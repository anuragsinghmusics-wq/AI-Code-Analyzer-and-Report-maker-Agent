import { Annotation } from '@langchain/langgraph';
import type { 
  PipelineState, 
  CodeFile, 
  Phase, 
  PhaseError, 
  StreamEvent, 
  AnalysisOptions, 
  ParsedAST,
  DependencyGraph,
  FileAnalysis,
  ArchitectureAnalysis,
  DataFlowAnalysis,
  LogicReview,
  QualityReview,
  BugReport,
  PerformanceReview,
  DesignReview,
  AIAgentReview,
  ReportCard,
  Question,
  CohortRanking,
  SimilarityFlagResult
} from '@code-analyzer/shared';

// For LangGraph JS, the state channel definition maps exactly to our PipelineState
// We use reducers for fields that should be appended to, rather than overwritten.
export const GraphState = Annotation.Root({
  jobId: Annotation<string>(),
  userId: Annotation<string>(),
  hackathonId: Annotation<string | undefined>(),
  submissionId: Annotation<string | undefined>(),
  files: Annotation<CodeFile[]>(),
  inputType: Annotation<'file' | 'zip' | 'repo'>(),
  repoUrl: Annotation<string | undefined>(),
  options: Annotation<AnalysisOptions>(),

  parsedASTs: Annotation<ParsedAST[]>({
    reducer: (state, update) => update
  }),
  dependencyGraph: Annotation<DependencyGraph>(),
  fileAnalyses: Annotation<FileAnalysis[]>({
    reducer: (state, update) => update
  }),
  architectureAnalysis: Annotation<ArchitectureAnalysis>(),
  dataFlowAnalysis: Annotation<DataFlowAnalysis>(),
  logicReview: Annotation<LogicReview>(),
  qualityReview: Annotation<QualityReview>(),
  bugReport: Annotation<BugReport>(),
  performanceReview: Annotation<PerformanceReview>(),
  designReview: Annotation<DesignReview>(),
  aiAgentReview: Annotation<AIAgentReview | undefined>(),

  reportCard: Annotation<ReportCard>(),
  questions: Annotation<Question[]>(),
  cohortRanking: Annotation<CohortRanking | undefined>(),
  similarityFlags: Annotation<SimilarityFlagResult[] | undefined>(),
  diagnosticQuestions: Annotation<import('@code-analyzer/shared').DiagnosticQuestion[] | undefined>(),

  currentPhase: Annotation<Phase>(),
  completedPhases: Annotation<Phase[]>({
    reducer: (state, update) => {
      if (!update) return state || [];
      const merged = [...(state || []), ...update];
      return Array.from(new Set(merged));
    }
  }),
  errors: Annotation<PhaseError[]>({
    reducer: (state, update) => {
      if (!update) return state || [];
      return [...(state || []), ...update];
    }
  }),
  streamEmit: Annotation<(event: StreamEvent) => void>({
    // We just keep the latest function reference
    reducer: (state, update) => update
  })
});

// Helper for type inference in node implementations
export type State = typeof GraphState.State;
