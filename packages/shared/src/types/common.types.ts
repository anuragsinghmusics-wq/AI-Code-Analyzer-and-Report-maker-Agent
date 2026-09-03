// packages/shared/src/types/common.types.ts — Shared enums and base types

/**
 * Supported programming languages for analysis.
 * Extensible — add new languages here as tree-sitter grammars are added.
 */
export type Language =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'java'
  | 'go'
  | 'rust'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'ruby'
  | 'php'
  | 'swift'
  | 'kotlin'
  | 'unknown';

/**
 * Severity levels used across all analysis findings.
 */
export type Severity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Complexity classification.
 */
export type Complexity = 'low' | 'medium' | 'high' | 'very-high';

/**
 * Input source type for an analysis job.
 */
export type InputType = 'file' | 'zip' | 'repo';

/**
 * Job lifecycle status for BullMQ jobs.
 */
export type JobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Base interface for timestamped entities.
 */
export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}
