import { prisma } from './prisma';
import type { FootprintEntry } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GamificationResult {
  pointsEarned: number;
  streakUpdated: number;
  newBadges: string[];
  completedChallenges: string[];
}

type EntryLike = Pick<
  FootprintEntry,
  'transportMode' | 'foodDietType' | 'wasteVolume' | 'wasteRecycled' | 'electricityUsage' | 'co2Emission'
>;

interface UserWithGamificationData {
  id: string;
  streak: number;
  lastLoggedAt: Date | null;
  entries: FootprintEntry[];
  badges: { badge: { name: string } }[];
  challenges: { id: string; challenge: { title: string; pointsReward: number } }[];
}

// ---------------------------------------------------------------------------
// Tunable constants (previously magic numbers scattered through the logic)
// ---------------------------------------------------------------------------

const POINTS = {
  DAILY_LOG: 10,
  BADGE_UNLOCK: 50,
} as const;

const STREAK_BADGE_THRESHOLD = 7;
const CARBON_CUTTER_REDUCTION = 0.9; // unlock if new entry <= 90% of recent average
const CARBON_CUTTER_MIN_HISTORY = 3;

const CLEAN_COMMUTE_MODES = ['WALK', 'BIKE', 'TRAIN', 'BUS', 'NONE'];
const SAFE_DIETS = ['VEGAN', 'VEGETARIAN'];
const ACTIVE_COMMUTE_MODES = ['WALK', 'BIKE'];

// ---------------------------------------------------------------------------
// Badge rules — each rule is a pure predicate over (newEntry, pastEntries).
// Adding a new badge means adding one entry here, not a new if-block.
// ---------------------------------------------------------------------------

interface BadgeRule {
  name: string;
  isUnlocked: (newEntry: EntryLike, pastEntries: EntryLike[], streak: number) => boolean;
}

const BADGE_RULES: BadgeRule[] = [
  {
    name: 'Eco Warrior',
    isUnlocked: (_e, _p, streak) => streak >= STREAK_BADGE_THRESHOLD,
  },
  {
    name: 'Zero Waste Champion',
    isUnlocked: (e) => e.wasteVolume === 'LOW' && e.wasteRecycled === true,
  },
  {
    name: 'Green Commuter',
    isUnlocked: (e, past) => hasCleanStreak([e, ...past], 'transportMode', CLEAN_COMMUTE_MODES, 5, 3),
  },
  {
    name: 'Conscious Consumer',
    isUnlocked: (e, past) => hasCleanStreak([e, ...past], 'foodDietType', SAFE_DIETS, 5, 3, true),
  },
  {
    name: 'Carbon Cutter',
    isUnlocked: (e, past) => {
      if (past.length < CARBON_CUTTER_MIN_HISTORY) return false;
      const avg = past.reduce((sum, p) => sum + p.co2Emission, 0) / past.length;
      return e.co2Emission <= avg * CARBON_CUTTER_REDUCTION;
    },
  },
];

/**
 * Checks whether the most recent `windowSize` entries (out of `entries`, newest first)
 * all match one of `allowedValues` for the given field. Requires at least `minCount`
 * entries to be present to qualify (avoids unlocking on day one with too little data).
 * `requireValue` controls whether a null/missing field counts as "clean" (commute: yes,
 * diet: no — you can't be a Conscious Consumer by simply not logging food).
 */
function hasCleanStreak<T extends Record<string, unknown>>(
  entries: T[],
  field: keyof T,
  allowedValues: string[],
  windowSize: number,
  minCount: number,
  requireValue = false
): boolean {
  const window = entries.slice(0, windowSize);
  if (window.length < minCount) return false;

  return window.every((entry) => {
    const value = entry[field];
    if (!value) return !requireValue;
    return allowedValues.includes(String(value).toUpperCase());
  });
}

// ---------------------------------------------------------------------------
// Challenge rules — same data-driven pattern as badges, keyed by challenge title
// so they line up with whatever's seeded in the database.
// ---------------------------------------------------------------------------

interface ChallengeRule {
  title: string;
  isCompleted: (newEntry: EntryLike, pastEntries: EntryLike[]) => boolean;
}

const CHALLENGE_RULES: ChallengeRule[] = [
  {
    title: 'Meat-Free Week',
    isCompleted: (e, past) => hasCleanStreak([e, ...past], 'foodDietType', SAFE_DIETS, 7, 7, true),
  },
  {
    title: 'Active Commuting',
    isCompleted: (e, past) => hasCleanStreak([e, ...past], 'transportMode', ACTIVE_COMMUTE_MODES, 5, 5),
  },
  {
    title: 'Unplugged Weekend',
    isCompleted: (e, past) => {
      const window = [e, ...past].slice(0, 2);
      if (window.length < 2) return false;
      return window.every((entry) => typeof entry.electricityUsage === 'number' && entry.electricityUsage < 5);
    },
  },
  {
    title: 'Zero Single-Use Waste',
    isCompleted: (e, past) => {
      const window = [e, ...past].slice(0, 7);
      if (window.length < 7) return false;
      return window.every((entry) => entry.wasteVolume === 'LOW' && entry.wasteRecycled === true);
    },
  },
];

// ---------------------------------------------------------------------------
// Streak calculation — isolated so it's independently testable
// ---------------------------------------------------------------------------

function toCalendarDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Computes the user's updated streak given the timestamp of the new entry
 * and their previous streak/lastLoggedAt state. Pure function, no DB access.
 */
export function calculateUpdatedStreak(
  newTimestamp: Date,
  previousStreak: number,
  lastLoggedAt: Date | null
): number {
  if (!lastLoggedAt) return 1; // first log ever

  const daysBetween = Math.round(
    (toCalendarDay(newTimestamp) - toCalendarDay(lastLoggedAt)) / (1000 * 60 * 60 * 24)
  );

  if (daysBetween === 0) return previousStreak; // same calendar day, unchanged
  if (daysBetween === 1) return previousStreak + 1; // consecutive day
  return 1; // streak broken (or backdated entry) — restart
}

// ---------------------------------------------------------------------------
// Badge/challenge evaluation — small, focused, each does exactly one thing
// ---------------------------------------------------------------------------

async function unlockBadge(
  userId: string,
  badgeName: string,
  alreadyUnlocked: Set<string>,
  result: GamificationResult
): Promise<void> {
  if (alreadyUnlocked.has(badgeName)) return;

  const badge = await prisma.badge.findUnique({ where: { name: badgeName } });
  if (!badge) return;

  await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
  result.newBadges.push(badgeName);
  result.pointsEarned += POINTS.BADGE_UNLOCK;
}

async function evaluateBadges(
  user: UserWithGamificationData,
  newEntry: EntryLike,
  newStreak: number,
  result: GamificationResult
): Promise<void> {
  const existingBadgeNames = new Set(user.badges.map((ub) => ub.badge.name));

  if (!user.lastLoggedAt) {
    await unlockBadge(user.id, 'First Step', existingBadgeNames, result);
  }

  for (const rule of BADGE_RULES) {
    if (rule.isUnlocked(newEntry, user.entries, newStreak)) {
      await unlockBadge(user.id, rule.name, existingBadgeNames, result);
    }
  }
}

async function evaluateChallenges(
  user: UserWithGamificationData,
  newEntry: EntryLike,
  result: GamificationResult
): Promise<void> {
  for (const userChallenge of user.challenges) {
    const rule = CHALLENGE_RULES.find((r) => r.title === userChallenge.challenge.title);
    if (!rule || !rule.isCompleted(newEntry, user.entries)) continue;

    await prisma.userChallenge.update({
      where: { id: userChallenge.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    result.completedChallenges.push(userChallenge.challenge.title);
    result.pointsEarned += userChallenge.challenge.pointsReward;
  }
}

// ---------------------------------------------------------------------------
// Entry point — orchestrates the steps above. Each step is independently
// readable and testable; this function just sequences them.
// ---------------------------------------------------------------------------

export async function processGamification(
  userId: string,
  newEntry: EntryLike & { timestamp: Date }
): Promise<GamificationResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      entries: { orderBy: { timestamp: 'desc' }, take: 10 },
      badges: { include: { badge: true } },
      challenges: { where: { status: 'ACTIVE' }, include: { challenge: true } },
    },
  });

  if (!user) throw new Error('User not found');

  const result: GamificationResult = {
    pointsEarned: POINTS.DAILY_LOG,
    streakUpdated: 0,
    newBadges: [],
    completedChallenges: [],
  };

  const newStreak = calculateUpdatedStreak(newEntry.timestamp, user.streak, user.lastLoggedAt);
  result.streakUpdated = newStreak;

  await evaluateBadges(user, newEntry, newStreak, result);
  await evaluateChallenges(user, newEntry, result);

  await prisma.user.update({
    where: { id: userId },
    data: {
      points: { increment: result.pointsEarned },
      streak: newStreak,
      lastLoggedAt: newEntry.timestamp,
    },
  });

  return result;
}