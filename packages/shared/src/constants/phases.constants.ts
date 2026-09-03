// packages/shared/src/constants/phases.constants.ts — Pipeline phase metadata

import type { Phase } from '../types/pipeline.types.js';

/**
 * Pipeline phases in execution order.
 */
export const PHASES: readonly Phase[] = [
  'ingest',
  'parse',
  'dependency-graph',
  'file-analysis',
  'architecture-analysis',
  'dataflow-analysis',
  'logic-review',
  'quality-review',
  'bug-hunting',
  'performance-review',
  'design-review',
  'ai-agent-review',
  'report-card',
  'question-gen',
] as const;

/**
 * Human-readable labels for each phase (used in UI and SSE events).
 */
export const PHASE_LABELS: Record<Phase, string> = {
  'ingest':                  'Ingesting Files',
  'parse':                   'Parsing AST',
  'dependency-graph':        'Building Dependency Graph',
  'file-analysis':           'Analyzing Files',
  'architecture-analysis':   'Analyzing Architecture',
  'dataflow-analysis':       'Tracing Data Flow',
  'logic-review':            'Reviewing Logic',
  'quality-review':          'Scoring Quality',
  'bug-hunting':             'Hunting Bugs',
  'performance-review':      'Reviewing Performance',
  'design-review':           'Evaluating Design Patterns',
  'ai-agent-review':         'Reviewing AI Integration',
  'generate-diagnostics':    'Generating Diagnostic MCQs',
  'report-card':             'Generating Report Card',
  'question-gen':            'Generating Questions',
} as const;

/**
 * Phases that require LLM calls (used for cost estimation and rate limiting).
 */
export const LLM_PHASES: readonly Phase[] = [
  'file-analysis',
  'architecture-analysis',
  'dataflow-analysis',
  'logic-review',
  'quality-review',
  'bug-hunting',
  'performance-review',
  'design-review',
  'ai-agent-review',
  'report-card',
  'question-gen',
] as const;

/**
 * Phases that can be skipped without breaking the pipeline.
 */
export const OPTIONAL_PHASES: readonly Phase[] = [
  'ai-agent-review',
] as const;

/**
 * Total number of phases (for progress calculation).
 */
export const TOTAL_PHASES = PHASES.length;

/**
 * Get the 0-based index of a phase for progress calculation.
 */
export function getPhaseIndex(phase: Phase): number {
  return PHASES.indexOf(phase);
}

/**
 * Get overall pipeline progress as a percentage (0–100).
 */
export function getPhaseProgress(phase: Phase): number {
  const index = getPhaseIndex(phase);
  if (index === -1) return 0;
  return Math.round(((index + 1) / TOTAL_PHASES) * 100);
}
