// packages/shared/src/types/pipeline.types.ts — Pipeline state and streaming types

import type { InputType, Language } from './common.types.js';
import type {
  AIAgentReview,
  AnalysisOptions,
  ArchitectureAnalysis,
  BugReport,
  CodeFile,
  DataFlowAnalysis,
  DependencyGraph,
  DesignReview,
  FileAnalysis,
  LogicReview,
  ParsedAST,
  PerformanceReview,
  QualityReview,
  CohortRanking,
  SimilarityFlagResult
} from './analysis.types.js';
import type { ReportCard } from './report.types.js';
import type { Question } from './question.types.js';

// ── Pipeline Phases ───────────────────────────────────────────────────

/**
 * All pipeline phases, in execution order.
 */
export type Phase =
  | 'ingest'
  | 'parse'
  | 'dependency-graph'
  | 'file-analysis'
  | 'architecture-analysis'
  | 'dataflow-analysis'
  | 'logic-review'
  | 'quality-review'
  | 'bug-hunting'
  | 'performance-review'
  | 'design-review'
  | 'ai-agent-review'
  | 'generate-diagnostics'
  | 'report-card'
  | 'question-gen';

/**
 * Error captured from a specific phase.
 */
export interface PhaseError {
  phase: Phase;
  message: string;
  stack?: string;
  timestamp: Date;
  /** Whether the pipeline can continue past this error */
  recoverable: boolean;
}

// ── Pipeline State (LangGraph state schema) ───────────────────────────

/**
 * The canonical pipeline state flowing through all LangGraph nodes.
 * Matches memory.md §7 exactly.
 */
export interface PipelineState {
  // ── Input ──────────────────────────────────────────────
  jobId: string;
  userId: string;
  hackathonId?: string;
  submissionId?: string;
  files: CodeFile[];
  inputType: InputType;
  repoUrl?: string;
  options: AnalysisOptions;

  // ── Phase Outputs (filled progressively) ───────────────
  parsedASTs: ParsedAST[];
  dependencyGraph: DependencyGraph;
  fileAnalyses: FileAnalysis[];
  architectureAnalysis: ArchitectureAnalysis;
  dataFlowAnalysis: DataFlowAnalysis;
  logicReview: LogicReview;
  qualityReview: QualityReview;
  bugReport: BugReport;
  performanceReview: PerformanceReview;
  designReview: DesignReview;
  aiAgentReview?: AIAgentReview; // only if AI patterns detected

  // ── Final Outputs ───────────────────────────────────────
  reportCard: ReportCard;
  questions: Question[];
  cohortRanking?: CohortRanking;
  similarityFlags?: SimilarityFlagResult[];

  // ── Pipeline Control ────────────────────────────────────
  currentPhase: Phase;
  completedPhases: Phase[];
  errors: PhaseError[];
  streamEmit: (event: StreamEvent) => void;
}

// ── SSE Streaming Events ──────────────────────────────────────────────

/**
 * Events emitted by the pipeline via BullMQ job progress,
 * relayed to the frontend as SSE. Matches memory.md §12.
 */
export type StreamEvent =
  | { type: 'phase_start'; phase: string }
  | { type: 'phase_progress'; phase: string; item: string; percent: number }
  | { type: 'phase_complete'; phase: string; summary: string }
  | { type: 'file_analyzed'; path: string; purpose: string }
  | { type: 'score_ready'; category: string; score: number }
  | { type: 'question_ready'; index: number; question: Question }
  | { type: 'done'; reportId: string }
  | { type: 'error'; phase: string; message: string };
