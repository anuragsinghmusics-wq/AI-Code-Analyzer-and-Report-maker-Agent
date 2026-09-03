// packages/db/src/index.ts — Package entry point
//
// Usage:
//   import { prisma, disconnectDb } from '@code-analyzer/db';
//   import { findJobById, createReportWithQuestions } from '@code-analyzer/db';

// ── Prisma Client ─────────────────────────────────────────────────────
export { disconnectDb, prisma } from './client.js';

// ── Repositories ──────────────────────────────────────────────────────
export * from './repositories/index.js';

// ── Types ────────────────────────────────────────────────────────────
export type { InputType, JobStatus } from './repositories/job.repository.js';
export type { Tier } from './repositories/user.repository.js';
