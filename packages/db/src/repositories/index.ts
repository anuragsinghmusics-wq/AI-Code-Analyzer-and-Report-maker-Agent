// packages/db/src/repositories/index.ts — Repository barrel export

// ── User ──────────────────────────────────────────────────────────────
export {
  createUser,
  deleteUser,
  findUserByEmail,
  findUserByGithubId,
  findUserById,
  findUserWithToken,
  updateUserTier,
  updateUserToken,
  upsertUserFromGithub,
} from './user.repository.js';

export type {
  UserRecord,
  UserWithToken,
} from './user.repository.js';

// ── Job ───────────────────────────────────────────────────────────────
export {
  countActiveJobsForUser,
  countRecentJobsForUser,
  createJob,
  cancelJob,
  deleteJob,
  findJobById,
  findJobByIdForUser,
  findJobByInputHash,
  listJobsForUser,
  markJobCompleted,
  markJobFailed,
  markJobProcessing,
} from './job.repository.js';

export type {
  JobDetailRecord,
  JobListRecord,
  PaginatedResult,
  PaginationParams,
} from './job.repository.js';

// ── Analysis (Report + Questions) ─────────────────────────────────────
export {
  createReportWithQuestions,
  deleteReport,
  findQuestionsByJobId,
  findQuestionsByReportId,
  findReportById,
  findReportByJobId,
  findReportByShareToken,
  revokeReportShareToken,
  setReportShareToken,
} from './analysis.repository.js';

export type {
  CreateReportInput,
  QuestionRecord,
  ReportFullRecord,
  ReportSummaryRecord,
} from './analysis.repository.js';
