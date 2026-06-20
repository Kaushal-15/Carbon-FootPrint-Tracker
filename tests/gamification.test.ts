import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processGamification } from '../lib/gamification';
import { prisma } from '../lib/prisma';

// Mock the Prisma Client module
vi.mock('../lib/prisma', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      badge: {
        findUnique: vi.fn(),
      },
      userBadge: {
        create: vi.fn(),
      },
      userChallenge: {
        update: vi.fn(),
      },
    },
  };
});

describe('Gamification Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates points and streak for first log, awards First Step badge', async () => {
    // Mock user details for a brand new user
    const mockUser = {
      id: 'user-1',
      points: 0,
      streak: 0,
      lastLoggedAt: null,
      entries: [],
      badges: [],
      challenges: [],
    };
    
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.badge.findUnique).mockResolvedValue({ id: 'badge-1', name: 'First Step' } as any);

    const newEntry = {
      timestamp: new Date('2026-06-20T12:00:00Z'),
      co2Emission: 10.5,
    };

    const result = await processGamification('user-1', newEntry);

    // Verify streak updated to 1
    expect(result.streakUpdated).toBe(1);
    // 10 points for log + 50 points for unlocking "First Step"
    expect(result.pointsEarned).toBe(60);
    expect(result.newBadges).toContain('First Step');

    // Verify DB updates were called
    expect(prisma.userBadge.create).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        points: { increment: 60 },
        streak: 1,
        lastLoggedAt: newEntry.timestamp,
      },
    });
  });

  it('increments streak on consecutive days', async () => {
    const mockUser = {
      id: 'user-1',
      points: 100,
      streak: 3,
      lastLoggedAt: new Date('2026-06-19T10:00:00Z'), // Yesterday
      entries: [],
      badges: [{ badge: { name: 'First Step' } }],
      challenges: [],
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const newEntry = {
      timestamp: new Date('2026-06-20T14:00:00Z'), // Today
      co2Emission: 12.0,
    };

    const result = await processGamification('user-1', newEntry);

    expect(result.streakUpdated).toBe(4);
    expect(result.pointsEarned).toBe(10); // 10 points only (no new badges)
    expect(result.newBadges.length).toBe(0);
  });

  it('resets streak to 1 if time gap is more than 1 day', async () => {
    const mockUser = {
      id: 'user-1',
      points: 100,
      streak: 5,
      lastLoggedAt: new Date('2026-06-15T10:00:00Z'), // 5 days ago
      entries: [],
      badges: [{ badge: { name: 'First Step' } }],
      challenges: [],
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const newEntry = {
      timestamp: new Date('2026-06-20T14:00:00Z'), // Today
      co2Emission: 12.0,
    };

    const result = await processGamification('user-1', newEntry);

    expect(result.streakUpdated).toBe(1); // Reset to 1
  });

  it('triggers Zero Waste Champion badge when waste is LOW and recycled', async () => {
    const mockUser = {
      id: 'user-1',
      points: 100,
      streak: 1,
      lastLoggedAt: new Date('2026-06-20T10:00:00Z'),
      entries: [],
      badges: [],
      challenges: [],
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.badge.findUnique).mockResolvedValue({ id: 'badge-waste', name: 'Zero Waste Champion' } as any);

    const newEntry = {
      timestamp: new Date('2026-06-20T12:00:00Z'),
      wasteVolume: 'LOW',
      wasteRecycled: true,
      co2Emission: 0.13,
    };

    const result = await processGamification('user-1', newEntry);

    expect(result.newBadges).toContain('Zero Waste Champion');
  });
});
