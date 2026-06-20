import { prisma } from './prisma';
import { calculateTotalEntryEmission } from './carbonCalculator';

interface GamificationResult {
  pointsEarned: number;
  streakUpdated: number;
  newBadges: string[];
  completedChallenges: string[];
}

/**
 * Process a new footprint entry to update points, streaks, badges, and challenges.
 */
export async function processGamification(
  userId: string,
  newEntry: {
    timestamp: Date;
    transportMode?: string | null;
    transportDistance?: number | null;
    electricityUsage?: number | null;
    heatingSource?: string | null;
    heatingUsage?: number | null;
    foodDietType?: string | null;
    wasteVolume?: string | null;
    wasteRecycled?: boolean | null;
    co2Emission: number;
  }
): Promise<GamificationResult> {
  const result: GamificationResult = {
    pointsEarned: 0,
    streakUpdated: 0,
    newBadges: [],
    completedChallenges: [],
  };

  // 1. Fetch User details, past entries, badges, and active challenges
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      entries: {
        orderBy: { timestamp: 'desc' },
        take: 10,
      },
      badges: {
        include: { badge: true },
      },
      challenges: {
        where: { status: 'ACTIVE' },
        include: { challenge: true },
      },
    },
  });

  if (!user) throw new Error('User not found');

  const existingBadgeNames = new Set(user.badges.map((ub) => ub.badge.name));
  const pastEntries = user.entries; // sorted desc, so pastEntries[0] is the *previous* newest entry (if we haven't committed the new one yet)
  
  // Define helper to unlock a badge
  const unlockBadge = async (badgeName: string) => {
    if (existingBadgeNames.has(badgeName)) return;
    const badge = await prisma.badge.findUnique({ where: { name: badgeName } });
    if (badge) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
        },
      });
      result.newBadges.push(badgeName);
      result.pointsEarned += 50; // 50 points bonus for any badge unlocked!
    }
  };

  // 2. Streaks and Base Logging Points
  let newStreak = user.streak;
  const now = new Date(newEntry.timestamp);
  
  if (!user.lastLoggedAt) {
    // First log ever
    newStreak = 1;
    await unlockBadge('First Step');
  } else {
    const lastLoggedDate = new Date(user.lastLoggedAt);
    
    // Reset hours to compare calendar days
    const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const d2 = new Date(lastLoggedDate.getFullYear(), lastLoggedDate.getMonth(), lastLoggedDate.getDate());
    
    const diffTime = Math.abs(d1.getTime() - d2.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Logged on the consecutive day
      newStreak += 1;
    } else if (diffDays > 1) {
      // Streak broken
      newStreak = 1;
    }
    // If diffDays === 0, same day, streak doesn't change
  }

  result.streakUpdated = newStreak;
  result.pointsEarned += 10; // 10 points for daily log

  // Check for Eco Warrior badge (7-day streak)
  if (newStreak >= 7) {
    await unlockBadge('Eco Warrior');
  }

  // 3. Custom Badge Triggers
  
  // A. Zero Waste Champion
  // Condition: wasteVolume is LOW and wasteRecycled is true
  if (newEntry.wasteVolume === 'LOW' && newEntry.wasteRecycled === true) {
    await unlockBadge('Zero Waste Champion');
  }

  // B. Green Commuter
  // Condition: the last 5 entries had only clean commute (WALK, BIKE, TRAIN, BUS or no commute)
  const cleanCommutes = ['WALK', 'BIKE', 'TRAIN', 'BUS', null, 'NONE'];
  const lastEntriesForCommute = [newEntry, ...pastEntries].slice(0, 5);
  const allCleanCommute = lastEntriesForCommute.every(
    (e) => !e.transportMode || cleanCommutes.includes(e.transportMode.toUpperCase())
  );
  if (allCleanCommute && lastEntriesForCommute.length >= 3) {
    await unlockBadge('Green Commuter');
  }

  // C. Conscious Consumer
  // Condition: last 5 entries had VEGAN or VEGETARIAN diet
  const safeDiets = ['VEGAN', 'VEGETARIAN'];
  const lastEntriesForFood = [newEntry, ...pastEntries].slice(0, 5);
  const allSafeFood = lastEntriesForFood.every(
    (e) => e.foodDietType && safeDiets.includes(e.foodDietType.toUpperCase())
  );
  if (allSafeFood && lastEntriesForFood.length >= 3) {
    await unlockBadge('Conscious Consumer');
  }

  // D. Carbon Cutter (10% reduction)
  // Compare this entry emissions to user average (if they have at least 3 previous entries)
  if (pastEntries.length >= 3) {
    const sumEmissions = pastEntries.reduce((sum, e) => sum + e.co2Emission, 0);
    const avgEmission = sumEmissions / pastEntries.length;
    if (newEntry.co2Emission <= avgEmission * 0.90) {
      await unlockBadge('Carbon Cutter');
    }
  }

  // 4. Update Challenges
  // Check if any active challenges are met
  for (const uc of user.challenges) {
    const challenge = uc.challenge;
    let completed = false;

    // Check progress for Meat-Free Week
    if (challenge.title === 'Meat-Free Week') {
      const foodEntries = [newEntry, ...pastEntries].slice(0, 7);
      const isMeatFree = foodEntries.every(
        (e) => e.foodDietType === 'VEGAN' || e.foodDietType === 'VEGETARIAN'
      );
      if (isMeatFree && foodEntries.length >= 7) {
        completed = true;
      }
    }

    // Check progress for Active Commuting
    if (challenge.title === 'Active Commuting') {
      const activeCommutes = ['WALK', 'BIKE'];
      const travelEntries = [newEntry, ...pastEntries].slice(0, 5);
      const isActive = travelEntries.every(
        (e) => !e.transportMode || activeCommutes.includes(e.transportMode.toUpperCase())
      );
      if (isActive && travelEntries.length >= 5) {
        completed = true;
      }
    }

    // Check progress for Unplugged Weekend
    if (challenge.title === 'Unplugged Weekend') {
      const energyEntries = [newEntry, ...pastEntries].slice(0, 2);
      const isLowEnergy = energyEntries.every(
        (e) => typeof e.electricityUsage === 'number' && e.electricityUsage < 5
      );
      if (isLowEnergy && energyEntries.length >= 2) {
        completed = true;
      }
    }

    // Check progress for Zero Single-Use Waste
    if (challenge.title === 'Zero Single-Use Waste') {
      const wasteEntries = [newEntry, ...pastEntries].slice(0, 7);
      const isZeroWaste = wasteEntries.every(
        (e) => e.wasteVolume === 'LOW' && e.wasteRecycled === true
      );
      if (isZeroWaste && wasteEntries.length >= 7) {
        completed = true;
      }
    }

    if (completed) {
      await prisma.userChallenge.update({
        where: { id: uc.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
      result.completedChallenges.push(challenge.title);
      result.pointsEarned += challenge.pointsReward;
    }
  }

  // 5. Save updated user profile metrics
  await prisma.user.update({
    where: { id: userId },
    data: {
      points: { increment: result.pointsEarned },
      streak: newStreak,
      lastLoggedAt: now,
    },
  });

  return result;
}
