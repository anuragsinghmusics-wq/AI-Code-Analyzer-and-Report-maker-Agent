// packages/db/src/repositories/analysis.repository.ts — Report & Question data access
//
// Rules (rules.md §4.1):
// - All queries through repository functions
// - Always specify `select`
// - Transactions for multi-table operations
// - `findUnique` for unique lookups

import { prisma } from '../client.js';

// ── Select shapes ─────────────────────────────────────────────────────

/** Report summary: for listings and cards */
const reportSummarySelect = {
  id: true,
  jobId: true,
  summary: true,
  overallScore: true,
  grade: true,
  strengths: true,
  weaknesses: true,
  createdAt: true,
} as const;

/** Full report: includes JSON blobs */
const reportFullSelect = {
  ...reportSummarySelect,
  reportCard: true,
  improvements: true,
  fileBreakdown: true,
  diagnosticQuestions: true,
  shareToken: true,
  shareExpiresAt: true,
} as const;

/** Question select */
const questionSelect = {
  id: true,
  reportId: true,
  index: true,
  text: true,
  options: true,
  category: true,
  difficulty: true,
  codeRef: true,
  modelAnswer: true,
  rubric: true,
} as const;

// ── Types ─────────────────────────────────────────────────────────────

export type ReportSummaryRecord = {
  id: string;
  jobId: string;
  summary: string;
  overallScore: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  createdAt: Date;
};

export type ReportFullRecord = ReportSummaryRecord & {
  reportCard: unknown;     // CategoryScore[] (JSON)
  improvements: unknown;   // Improvement[] (JSON)
  fileBreakdown: unknown;  // FileAnalysis[] (JSON)
  diagnosticQuestions: unknown; // DiagnosticQuestion[] (JSON)
  shareToken: string | null;
  shareExpiresAt: Date | null;
};

export type QuestionRecord = {
  id: string;
  reportId: string;
  index: number;
  text: string;
  options: string | null; // JSON-encoded string[]
  category: string;
  difficulty: string;
  codeRef: string | null;
  modelAnswer: string | null;
  rubric: string | null;
};

/** Input for creating a full report with questions in a transaction */
export interface CreateReportInput {
  jobId: string;
  summary: string;
  overallScore: number;
  grade: string;
  reportCard: unknown;    // CategoryScore[]
  strengths: string[];
  weaknesses: string[];
  improvements: unknown;  // Improvement[]
  fileBreakdown: unknown; // FileAnalysis[]
  diagnosticQuestions?: unknown; // DiagnosticQuestion[]
  questions: Array<{
    index: number;
    text: string;
    options?: string[];
    category: string;
    difficulty: string;
    codeRef?: string;
    modelAnswer?: string;
    rubric?: string;
  }>;
}

// ── Repository Functions ──────────────────────────────────────────────

/**
 * Find a report by its unique ID.
 */
export async function findReportById(id: string): Promise<ReportFullRecord | null> {
  const report = await prisma.report.findUnique({
    where: { id },
    select: reportFullSelect,
  });
  return parseReportStrings(report);
}

/**
 * Find a report by its associated job ID (1:1 relationship).
 */
export async function findReportByJobId(jobId: string): Promise<ReportFullRecord | null> {
  const report = await prisma.report.findUnique({
    where: { jobId },
    select: reportFullSelect,
  });
  return parseReportStrings(report);
}

/**
 * Find a report by its share token (public access, no auth required).
 * Returns null if token is expired or not found.
 */
export async function findReportByShareToken(
  shareToken: string,
): Promise<ReportFullRecord | null> {
  const report = await prisma.report.findUnique({
    where: { shareToken },
    select: reportFullSelect,
  });

  if (!report) return null;

  // Check expiration
  if (report.shareExpiresAt && report.shareExpiresAt < new Date()) {
    return null;
  }

  return parseReportStrings(report);
}

function parseReportStrings(report: any): ReportFullRecord | null {
  if (!report) return null;
  return {
    ...report,
    strengths: JSON.parse(report.strengths || '[]'),
    weaknesses: JSON.parse(report.weaknesses || '[]'),
    reportCard: report.reportCard ? JSON.parse(report.reportCard) : null,
    improvements: report.improvements ? JSON.parse(report.improvements) : null,
    fileBreakdown: report.fileBreakdown ? JSON.parse(report.fileBreakdown) : null,
    diagnosticQuestions: report.diagnosticQuestions ? JSON.parse(report.diagnosticQuestions) : null,
  };
}

/**
 * Create a full report with all questions in a single transaction.
 * Uses a transaction per rules.md §4.1 (multi-table operation).
 */
export async function createReportWithQuestions(
  input: CreateReportInput,
): Promise<ReportFullRecord> {
  return prisma.$transaction(async (tx) => {
    // Delete existing report if it exists to allow re-running jobs
    await tx.report.deleteMany({
      where: { jobId: input.jobId }
    });

    // Create the report
    const report = await tx.report.create({
      data: {
        jobId: input.jobId,
        summary: input.summary,
        overallScore: input.overallScore,
        grade: input.grade,
        reportCard: JSON.stringify(input.reportCard),
        strengths: JSON.stringify(input.strengths),
        weaknesses: JSON.stringify(input.weaknesses),
        improvements: JSON.stringify(input.improvements),
        fileBreakdown: JSON.stringify(input.fileBreakdown),
        diagnosticQuestions: input.diagnosticQuestions ? JSON.stringify(input.diagnosticQuestions) : "[]",
      },
      select: { id: true },
    });

    // Batch-create all questions
    if (input.questions.length > 0) {
      await tx.question.createMany({
        data: input.questions.map((q) => ({
          reportId: report.id,
          index: q.index,
          text: q.text,
          options: q.options && q.options.length > 0 ? JSON.stringify(q.options) : null,
          category: q.category,
          difficulty: q.difficulty,
          codeRef: q.codeRef ?? null,
          modelAnswer: q.modelAnswer ?? null,
          rubric: q.rubric ? JSON.stringify(q.rubric) : null,
        })),
      });
    }

    // Return the full report
    const savedReport = await tx.report.findUnique({
      where: { id: report.id },
      select: reportFullSelect,
    });
    return parseReportStrings(savedReport) as ReportFullRecord;
  });
}

/**
 * Get all questions for a report, ordered by index.
 */
export async function findQuestionsByReportId(
  reportId: string,
): Promise<QuestionRecord[]> {
  return prisma.question.findMany({
    where: { reportId },
    select: questionSelect,
    orderBy: { index: 'asc' },
  });
}

/**
 * Get questions for a job (convenience: looks up report first).
 */
export async function findQuestionsByJobId(
  jobId: string,
): Promise<QuestionRecord[]> {
  const report = await prisma.report.findUnique({
    where: { jobId },
    select: { id: true },
  });

  if (!report) return [];

  return findQuestionsByReportId(report.id);
}

/**
 * Generate a share token for a report.
 * Token is a random string; expiry defaults to 7 days.
 */
export async function setReportShareToken(
  reportId: string,
  shareToken: string,
  expiresInMs: number = 7 * 24 * 60 * 60 * 1000, // 7 days
): Promise<void> {
  await prisma.report.update({
    where: { id: reportId },
    data: {
      shareToken,
      shareExpiresAt: new Date(Date.now() + expiresInMs),
    },
  });
}

/**
 * Revoke a report's share token.
 */
export async function revokeReportShareToken(reportId: string): Promise<void> {
  await prisma.report.update({
    where: { id: reportId },
    data: {
      shareToken: null,
      shareExpiresAt: null,
    },
  });
}

/**
 * Delete a report and all its questions (cascades via schema).
 */
export async function deleteReport(reportId: string): Promise<void> {
  await prisma.report.delete({
    where: { id: reportId },
  });
}
