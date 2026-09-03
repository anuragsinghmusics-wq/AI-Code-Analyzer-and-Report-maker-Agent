// packages/shared/src/types/analysis.types.ts — Analysis pipeline types

import type { Complexity, Language, Severity } from './common.types.js';

// ── Code File ─────────────────────────────────────────────────────────

/**
 * A single source code file ingested into the pipeline.
 * `id` is the SHA-256 hash of `content` — used for cache deduplication.
 */
export interface CodeFile {
  id: string;
  path: string;
  content: string;
  language: Language;
  lineCount: number;
  sizeBytes: number;
  isEntryPoint: boolean;
}

// ── AST Extraction (tree-sitter output) ───────────────────────────────

export interface ASTFunction {
  name: string;
  startLine: number;
  endLine: number;
  params: string[];
  returnType?: string;
  isAsync: boolean;
  isExported: boolean;
  complexity: number; // cyclomatic complexity
}

export interface ASTClass {
  name: string;
  startLine: number;
  endLine: number;
  methods: ASTFunction[];
  properties: string[];
  isExported: boolean;
  superClass?: string;
  interfaces?: string[];
}

export interface ASTImport {
  source: string;
  specifiers: string[];
  isDefault: boolean;
  isDynamic: boolean;
  line: number;
}

export interface ASTExport {
  name: string;
  type: 'function' | 'class' | 'variable' | 'type' | 'default' | 're-export';
  line: number;
}

export interface ParsedAST {
  fileId: string;
  language: Language;
  functions: ASTFunction[];
  classes: ASTClass[];
  imports: ASTImport[];
  exports: ASTExport[];
  lineCount: number;
  commentLineCount: number;
  /** Top-level statements not in any function/class */
  topLevelStatements: number;
}

// ── Dependency Graph ──────────────────────────────────────────────────

export interface DependencyEdge {
  from: string; // file path
  to: string;   // file path or module name
  type: 'import' | 'dynamic-import' | 'require' | 'call';
  specifiers: string[];
}

export interface DependencyCycle {
  files: string[];
  severity: Severity;
}

export interface DependencyGraph {
  edges: DependencyEdge[];
  entryPoints: string[];
  externalDependencies: string[];
  cycles: DependencyCycle[];
  /** Adjacency list: file path → list of imported file paths */
  adjacency: Record<string, string[]>;
}

// ── File-Level Analysis (LLM output) ──────────────────────────────────

export interface PublicAPI {
  name: string;
  signature: string;
  description: string;
}

export interface FileIssue {
  description: string;
  severity: Severity;
  line?: number;
}

export interface FileAnalysis {
  fileId: string;
  filePath: string;
  purpose: string;
  responsibilities: string[];
  publicAPI: PublicAPI[];
  dependencies: string[];
  issues: FileIssue[];
  complexity: Complexity;
  complexityReason: string;
}

// ── Architecture Analysis ─────────────────────────────────────────────

export interface PatternDetection {
  pattern: string;
  confidence: number; // 0–1
  description: string;
}

export interface ArchitectureAnalysis {
  detectedPatterns: PatternDetection[];
  layering: {
    layers: string[];
    violations: string[];
  };
  entryPoints: string[];
  summary: string;
  recommendations: string[];
}

// ── Data Flow Analysis ────────────────────────────────────────────────

export interface DataFlowStep {
  file: string;
  function: string;
  line: number;
  description: string;
}

export interface DataFlowTrace {
  name: string;
  type: 'request' | 'event' | 'data-transform' | 'state-mutation';
  steps: DataFlowStep[];
}

export interface DataFlowAnalysis {
  traces: DataFlowTrace[];
  stateManagement: string;
  dataValidation: string;
  summary: string;
}

// ── Logic Review ──────────────────────────────────────────────────────

export interface LogicFinding {
  category: 'algorithm' | 'auth' | 'concurrency' | 'boundary' | 'state';
  description: string;
  severity: Severity;
  file: string;
  line?: number;
  suggestion: string;
}

export interface LogicReview {
  findings: LogicFinding[];
  algorithmComplexity: string;
  concurrencyIssues: string[];
  authFlaws: string[];
  summary: string;
}

// ── Quality Review (11-dimension scoring) ─────────────────────────────

export interface DimensionScore {
  score: number;     // 0–10
  analysis: string;
}

export interface QualityReview {
  dimensions: Record<string, DimensionScore>;
  overallScore: number;
  summary: string;
  topIssues: string[];
  topStrengths: string[];
}

// ── Bug Report ────────────────────────────────────────────────────────

export interface Bug {
  title: string;
  description: string;
  severity: Severity;
  category: 'vulnerability' | 'antipattern' | 'logic-error' | 'runtime-risk';
  file: string;
  line?: number;
  codeSnippet?: string;
  fix: string;
}

export interface BugReport {
  bugs: Bug[];
  vulnerabilityCount: number;
  antipatternCount: number;
  summary: string;
}

// ── Performance Review ────────────────────────────────────────────────

export interface PerformanceIssue {
  description: string;
  severity: Severity;
  file: string;
  line?: number;
  category: 'complexity' | 'memory' | 'io' | 'rendering' | 'bundle-size';
  impact: string;
  suggestion: string;
}

export interface PerformanceReview {
  issues: PerformanceIssue[];
  bottlenecks: string[];
  complexityHotspots: Array<{
    file: string;
    function: string;
    complexity: string;
  }>;
  summary: string;
}

// ── Design Review ─────────────────────────────────────────────────────

export interface DesignIssue {
  type: 'over-engineering' | 'under-engineering';
  description: string;
  severity: Severity;
  file: string;
  suggestion: string;
}

export interface DesignReview {
  issues: DesignIssue[];
  abstractionLevel: 'appropriate' | 'over-abstracted' | 'under-abstracted';
  solidPrinciples: Record<string, { score: number; notes: string }>;
  summary: string;
}

// ── AI Agent Review (conditional) ─────────────────────────────────────

export interface AIAgentFinding {
  category: 'langgraph' | 'rag' | 'tool-use' | 'memory' | 'prompt-engineering';
  description: string;
  severity: Severity;
  file: string;
  suggestion: string;
}

export interface AIAgentReview {
  isAIProject: boolean;
  findings: AIAgentFinding[];
  frameworksDetected: string[];
  summary: string;
}

// ── Analysis Options ──────────────────────────────────────────────────

export interface AnalysisOptions {
  /** Skip AI agent review even if AI patterns detected */
  skipAIReview?: boolean;
  /** Problem statement from a hackathon or prompt */
  problemStatement?: string;
  /** Maximum files to analyze (for large repos) */
  maxFiles?: number;
  /** Question count to generate (10–30, default 20) */
  questionCount?: number;
  /** Generate model answers for questions */
  generateAnswers?: boolean;
}

// ── Phase 15 & 16 Results ─────────────────────────────────────────────

export interface CohortRanking {
  adjustedScore: number;
  rank: number;
  percentile: number;
}

export interface SimilarityFlagResult {
  submissionId1: string;
  submissionId2: string;
  similarityScore: number;
  flaggedFiles: string[];
}

