import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as registerHandler } from '../app/api/auth/register/route';
import { POST as entryHandler, GET as getEntriesHandler } from '../app/api/entries/route';
import { GET as insightsHandler } from '../app/api/insights/route';
import { prisma } from '../lib/prisma';
import { getServerSession } from 'next-auth';

// Mock next-auth getServerSession and default NextAuth export
vi.mock('next-auth', () => {
  const mockNextAuth = () => () => {};
  return {
    default: mockNextAuth,
    getServerSession: vi.fn(),
  };
});

// Mock prisma client
vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    footprintEntry: {
      create: vi.fn(),
      findMany: vi.fn(),
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
}));

describe('EcoTrace API Route Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('creates new user when validation passes and email is free', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'new-user-id',
        name: 'Jane Doe',
        email: 'jane@example.com',
        createdAt: new Date(),
      } as any);

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'securepassword123',
        }),
      });

      const response = await registerHandler(req);
      expect(response.status).toBe(201);
      
      const json = await response.json();
      expect(json.message).toBe('User registered successfully');
      expect(json.user.email).toBe('jane@example.com');
    });

    it('rejects registration if password is too short', async () => {
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'short',
        }),
      });

      const response = await registerHandler(req);
      expect(response.status).toBe(400);
      
      const json = await response.json();
      expect(json.errors.password).toBeDefined();
    });
  });

  describe('POST /api/entries (Carbon Logging)', () => {
    it('returns 401 if user is unauthenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new Request('http://localhost:3000/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await entryHandler(req);
      expect(response.status).toBe(401);
    });

    it('creates a log and processes gamification when authenticated', async () => {
      // Mock authenticated session
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', name: 'Test User' },
      });

      // Mock database calls
      const mockEntry = {
        id: 'entry-1',
        userId: 'user-123',
        timestamp: new Date(),
        transportMode: 'BUS',
        transportDistance: 10,
        co2Emission: 0.8,
      };

      vi.mocked(prisma.footprintEntry.create).mockResolvedValue(mockEntry as any);
      
      // Mock gamification state lookup
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        points: 0,
        streak: 0,
        lastLoggedAt: null,
        entries: [],
        badges: [],
        challenges: [],
      } as any);

      const req = new Request('http://localhost:3000/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: '2026-06-20',
          transportMode: 'BUS',
          transportDistance: 10,
        }),
      });

      const response = await entryHandler(req);
      expect(response.status).toBe(201);
      
      const json = await response.json();
      expect(json.message).toBe('Footprint entry logged successfully');
      expect(json.entry.co2Emission).toBe(0.8);
      expect(json.gamification.pointsEarned).toBeGreaterThan(0);
    });
  });

  describe('GET /api/insights (AI Recommendations)', () => {
    it('rate-limits manual refreshes under 5 minutes', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123' },
      });

      const recentDate = new Date(); // Right now, so under 5 minutes
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        cachedInsights: 'Use public transport.',
        insightsUpdatedAt: recentDate,
        entries: [{ id: '1', co2Emission: 10.0 }],
      } as any);

      // Call route handler with forced refresh
      const req = new Request('http://localhost:3000/api/insights?refresh=true');
      const response = await insightsHandler(req);
      
      expect(response.status).toBe(429);
      
      const json = await response.json();
      expect(json.recommendations).toBe('Use public transport.');
      expect(json.message).toContain('Rate limit');
    });
  });
});
