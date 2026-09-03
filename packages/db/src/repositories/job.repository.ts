// packages/db/src/repositories/job.repository.ts — Job data access
//
// Rules (rules.md §4.1):
// - All queries through repository functions
// - Always specify `select`
// - Paginate any list that could return > 20 items
// - `findUnique` for unique lookups

import { prisma } from '../client.js';

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type InputType = 'FILE' | 'ZIP' | 'REPO';

// ── Select shapes ─────────────────────────────────────────────────────

/** Default job select: summary fields for listings */
const jobListSelect = {
  id: true,
  status: true,
  inputType: true,
  repoUrl: true,
  fileCount: true,
  languages: true,
  completedAt: true,
  durationMs: true,
  error: true,
  createdAt: true,
} as const;

/** Detail select: includes report existence check */
const jobDetailSelect = {
  ...jobListSelect,
  userId: true,
  inputHash: true,
  updatedAt: true,
  report: {
    select: {
      id: true,
      overallScore: true,
      grade: true,
    },
  },
} as const;

// ── Types ─────────────────────────────────────────────────────────────

export type JobListRecord = {
  id: string;
  status: JobStatus;
  inputType: InputType;
  repoUrl: string | null;
  fileCount: number;
  languages: string[];
  completedAt: Date | null;
  durationMs: number | null;
  error: string | null;
  createdAt: Date;
};

export type JobDetailRecord = JobListRecord & {
  userId: string;
  inputHash: string;
  updatedAt: Date;
  report: {
    id: string;
    overallScore: number;
    grade: string;
  } | null;
};

export interface PaginationParams {
  page: number;  // 1-based
  limit: number; // max 50
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Repository Functions ──────────────────────────────────────────────

/**
 * Find a job by its unique ID.
 * Returns null if not found.
 */
export async function findJobById(id: string): Promise<JobDetailRecord | null> {
  const job = await prisma.job.findUnique({
    where: { id },
    select: jobDetailSelect,
  });
  return parseJobStrings(job);
}

/**
 * Find a job by ID, but only if it belongs to the given user.
 * Used for authorization checks.
 */
export async function findJobByIdForUser(
  id: string,
  userId: string,
): Promise<JobDetailRecord | null> {
  const job = await prisma.job.findUnique({
    where: { id },
    select: jobDetailSelect,
  });
  if (job?.userId === userId) {
    return parseJobStrings(job);
  }
  return null;
}

/**
 * Find an existing job by input hash for cache deduplication.
 * Returns the most recent completed job with the same content hash.
 */
export async function findJobByInputHash(
  inputHash: string,
  userId: string,
): Promise<JobDetailRecord | null> {
  const job = await prisma.job.findFirst({
    where: {
      inputHash,
      userId,
      status: 'COMPLETED',
    },
    orderBy: { createdAt: 'desc' },
    select: jobDetailSelect,
  });
  return parseJobStrings(job);
}

/**
 * List jobs for a user with pagination.
 * Ordered by creation date descending (newest first).
 */
export async function listJobsForUser(
  userId: string,
  { page = 1, limit = 20 }: Partial<PaginationParams> = {},
): Promise<PaginatedResult<JobListRecord>> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const [data, total] = await Promise.all([
    prisma.job.findMany({
      where: { userId },
      select: jobListSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
    }),
    prisma.job.count({ where: { userId } }),
  ]);

  return {
    data: data.map((j) => parseJobStrings(j) as JobListRecord),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };
}

/**
 * Create a new analysis job.
 */
export async function createJob(data: {
  userId: string;
  inputType: InputType;
  inputHash: string;
  repoUrl?: string;
}): Promise<JobDetailRecord> {
  const job = await prisma.job.create({
    data: {
      userId: data.userId,
      inputType: data.inputType,
      inputHash: data.inputHash,
      repoUrl: data.repoUrl,
    },
    select: jobDetailSelect,
  });
  return parseJobStrings(job) as JobDetailRecord;
}

/**
 * Mark a job as processing.
 */
export async function markJobProcessing(jobId: string): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: { status: 'PROCESSING' },
  });
}

/**
 * Mark a job as completed with results metadata.
 */
export async function markJobCompleted(
  jobId: string,
  data: {
    fileCount: number;
    languages: string[];
    durationMs: number;
  },
): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      fileCount: data.fileCount,
      languages: JSON.stringify(data.languages),
      durationMs: data.durationMs,
      completedAt: new Date(),
    },
  });
}

function parseJobStrings(job: any): any {
  if (!job) return null;
  return {
    ...job,
    status: job.status as JobStatus,
    inputType: job.inputType as InputType,
    languages: typeof job.languages === 'string' ? JSON.parse(job.languages) : (job.languages || []),
  };
}

/**
 * Mark a job as failed with an error message.
 */
export async function markJobFailed(
  jobId: string,
  error: string,
): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'FAILED',
      error,
      completedAt: new Date(),
    },
  });
}

/**
 * Delete a job and all its associated data (report, questions cascade via schema).
 */
export async function deleteJob(jobId: string): Promise<void> {
  await prisma.job.delete({
    where: { id: jobId },
  });
}

/**
 * Cancel a job if it is currently pending or processing.
 */
export async function cancelJob(jobId: string): Promise<void> {
  await prisma.job.updateMany({
    where: {
      id: jobId,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
    data: {
      status: 'CANCELLED',
      completedAt: new Date(),
    },
  });
}

/**
 * Count active (non-completed) jobs for a user.
 * Used for rate limiting.
 */
export async function countActiveJobsForUser(userId: string): Promise<number> {
  return prisma.job.count({
    where: {
      userId,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
  });
}

/**
 * Count jobs created by a user in the last hour.
 * Used for rate limiting per rules.md §3.2.
 */
export async function countRecentJobsForUser(userId: string): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return prisma.job.count({
    where: {
      userId,
      createdAt: { gte: oneHourAgo },
    },
  });
}
