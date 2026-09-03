// packages/shared/src/constants/scoring.constants.ts — Report card scoring

import type { Grade, ScoringCategory } from '../types/report.types.js';

/**
 * Category weights for computing the overall report card score.
 * Sum = 1.00 — each category's score (0–10) is multiplied by its weight.
 */
export const CATEGORY_WEIGHTS: Record<ScoringCategory, number> = {
  Architecture:    0.15,
  Security:        0.15,
  Performance:     0.12,
  Maintainability: 0.12,
  Scalability:     0.10,
  ErrorHandling:   0.10,
  CodeQuality:     0.08,
  Readability:     0.07,
  Testing:         0.06,
  Documentation:   0.05,
} as const;

/**
 * Score thresholds for letter grades.
 * A score at or above the threshold earns the grade.
 * Below 5.0 = F.
 */
export const GRADE_THRESHOLDS: Record<Exclude<Grade, 'F'>, number> = {
  'A+': 9.5,
  'A':  9.0,
  'A-': 8.7,
  'B+': 8.3,
  'B':  8.0,
  'B-': 7.7,
  'C+': 7.3,
  'C':  7.0,
  'C-': 6.5,
  'D+': 6.0,
  'D':  5.5,
  'D-': 5.0,
} as const;

/**
 * All scoring categories in display order.
 */
export const SCORING_CATEGORIES: readonly ScoringCategory[] = [
  'Architecture',
  'Security',
  'Performance',
  'Maintainability',
  'Scalability',
  'ErrorHandling',
  'CodeQuality',
  'Readability',
  'Testing',
  'Documentation',
] as const;

/**
 * Compute the letter grade for a given score (0–10).
 */
export function scoreToGrade(score: number): Grade {
  if (score >= GRADE_THRESHOLDS['A+']) return 'A+';
  if (score >= GRADE_THRESHOLDS['A'])  return 'A';
  if (score >= GRADE_THRESHOLDS['A-']) return 'A-';
  if (score >= GRADE_THRESHOLDS['B+']) return 'B+';
  if (score >= GRADE_THRESHOLDS['B'])  return 'B';
  if (score >= GRADE_THRESHOLDS['B-']) return 'B-';
  if (score >= GRADE_THRESHOLDS['C+']) return 'C+';
  if (score >= GRADE_THRESHOLDS['C'])  return 'C';
  if (score >= GRADE_THRESHOLDS['C-']) return 'C-';
  if (score >= GRADE_THRESHOLDS['D+']) return 'D+';
  if (score >= GRADE_THRESHOLDS['D'])  return 'D';
  if (score >= GRADE_THRESHOLDS['D-']) return 'D-';
  return 'F';
}

/**
 * Compute weighted overall score from per-category scores.
 */
export function computeOverallScore(
  scores: Record<ScoringCategory, number>,
): number {
  let weightedSum = 0;
  for (const [category, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    const score = scores[category as ScoringCategory] ?? 0;
    weightedSum += score * weight;
  }
  // Round to 1 decimal
  return Math.round(weightedSum * 10) / 10;
}
