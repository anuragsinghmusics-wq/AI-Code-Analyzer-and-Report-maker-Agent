// packages/shared/src/types/report.types.ts — Report Card types

import type { Severity } from './common.types.js';

/**
 * Grade string — A+ through F.
 */
export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'F';

/**
 * Scoring category names aligned with CATEGORY_WEIGHTS in constants.
 */
export type ScoringCategory =
  | 'Architecture'
  | 'Security'
  | 'Performance'
  | 'Maintainability'
  | 'Scalability'
  | 'ErrorHandling'
  | 'CodeQuality'
  | 'Readability'
  | 'Testing'
  | 'Documentation';

/**
 * Individual category score within the report card.
 */
export interface CategoryScore {
  category: ScoringCategory;
  score: number;     // 0–10
  weight: number;    // from CATEGORY_WEIGHTS
  grade: Grade;
  analysis: string;
  /** Actionable improvement suggestion */
  improvement: string;
  /** Explicit explanation of why this specific numerical score was awarded based on findings */
  scoreReasoning?: string;
}

/**
 * An improvement recommendation with priority.
 */
export interface Improvement {
  title: string;
  description: string;
  category: ScoringCategory;
  priority: Severity;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

/**
 * The final report card — aggregate of all analysis phases.
 */
export interface ReportCard {
  /** Unique report ID */
  id: string;
  /** Associated job ID */
  jobId: string;
  /** Weighted average score 0–10 */
  overallScore: number;
  /** Overall grade derived from GRADE_THRESHOLDS */
  overallGrade: Grade;
  /** Per-category breakdown */
  categoryScores: CategoryScore[];
  /** Ranked improvement suggestions */
  improvements: Improvement[];
  /** Executive summary paragraph */
  summary: string;
  /** Total files analyzed */
  filesAnalyzed: number;
  /** Total lines of code analyzed */
  linesOfCode: number;
  /** Languages detected */
  languagesDetected: string[];
  /** Scenario-based diagnostic questions generated from codebase flaws */
  diagnosticQuestions?: import('./diagnostic.types.js').DiagnosticQuestion[];
  /** Timestamp of generation */
  generatedAt: Date;
}
