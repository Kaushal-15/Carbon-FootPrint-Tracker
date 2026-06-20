import { PrismaClient } from '@prisma/client';

/**
 * Global variable for PrismaClient to avoid multiple instances in development.
 * This is necessary because Next.js reloads files on every change in development,
 * which would otherwise exhaust database connections.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton instance of the PrismaClient.
 * Uses the global instance if available, otherwise creates a new one.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
