// packages/shared/src/types/question.types.ts — Interview question types

import type { Severity } from './common.types.js';

/**
 * Question difficulty level.
 */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

/**
 * Question category — what aspect of the code the question probes.
 */
export type QuestionCategory =
  | 'architecture'
  | 'design-patterns'
  | 'security'
  | 'performance'
  | 'error-handling'
  | 'testing'
  | 'code-quality'
  | 'debugging'
  | 'algorithms'
  | 'system-design';

/**
 * A single interview question generated from the analyzed code.
 */
export interface Question {
  /** 1-based index */
  index: number;
  /** The question text */
  text: string;
  /** Options for multiple choice questions */
  options?: string[];
  /** Which category this question falls into */
  category: QuestionCategory;
  /** Difficulty level */
  difficulty: Difficulty;
  /** Which file(s) this question relates to */
  relevantFiles: string[];
  /** Specific code context that prompted this question */
  codeContext?: string;
  /** Model answer (optional — only generated if requested) */
  modelAnswer?: string;
  /** Evaluation rubric for assessing a candidate's answer */
  rubric?: EvaluationRubric;
}

/**
 * Rubric for scoring a candidate's response to a question.
 */
export interface EvaluationRubric {
  /** Key points the answer should cover */
  keyPoints: string[];
  /** What constitutes a strong answer */
  strongAnswer: string;
  /** Common mistakes candidates make */
  commonMistakes: string[];
  /** Maximum score for this question */
  maxScore: number;
}
