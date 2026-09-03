// packages/shared/src/types/index.ts — Type barrel export

// ── Common / Base ─────────────────────────────────────────────────────
export type {
  Complexity,
  InputType,
  JobStatus,
  Language,
  Severity,
  Timestamped,
} from './common.types.js';

// ── Analysis ──────────────────────────────────────────────────────────
export type {
  AIAgentFinding,
  AIAgentReview,
  AnalysisOptions,
  ArchitectureAnalysis,
  ASTClass,
  ASTExport,
  ASTFunction,
  ASTImport,
  Bug,
  BugReport,
  CodeFile,
  DataFlowAnalysis,
  DataFlowStep,
  DataFlowTrace,
  DependencyCycle,
  DependencyEdge,
  DependencyGraph,
  DesignIssue,
  DesignReview,
  FileAnalysis,
  FileIssue,
  LogicFinding,
  LogicReview,
  ParsedAST,
  PatternDetection,
  PerformanceIssue,
  PerformanceReview,
  PublicAPI,
  QualityReview,
  DimensionScore,
  CohortRanking,
  SimilarityFlagResult,
} from './analysis.types.js';

// ── Report Card ───────────────────────────────────────────────────────
export type {
  CategoryScore,
  Grade,
  Improvement,
  ReportCard,
  ScoringCategory,
} from './report.types.js';

// ── Questions ─────────────────────────────────────────────────────────
export type {
  Difficulty,
  EvaluationRubric,
  Question,
  QuestionCategory,
} from './question.types.js';

// ── Pipeline ──────────────────────────────────────────────────────────
export type {
  Phase,
  PhaseError,
  PipelineState,
  StreamEvent,
} from './pipeline.types.js';

// ── Diagnostic ────────────────────────────────────────────────────────
export type {
  TraitAxis,
  DiagnosticOption,
  DiagnosticQuestion,
  CandidateProfile,
} from './diagnostic.types.js';

