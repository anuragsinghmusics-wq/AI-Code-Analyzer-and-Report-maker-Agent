// packages/db/src/client.ts — Singleton PrismaClient instance
//
// Usage:
//   import { prisma } from '@code-analyzer/db';
//
// In development, hot-reload creates multiple PrismaClient instances.
// This module caches one instance on `globalThis` to avoid connection pool exhaustion.

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton PrismaClient instance.
 *
 * - In development: cached on `globalThis` to survive HMR
 * - In production: single instance per process
 * - Logs queries at DEBUG level only (controlled by LOG_LEVEL env)
 */
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? [
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ]
        : [{ emit: 'stdout', level: 'error' }],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Gracefully disconnect the Prisma client.
 * Call this in process shutdown handlers.
 */
export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}
