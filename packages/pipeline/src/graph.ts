import { StateGraph, END } from '@langchain/langgraph';
import { GraphState, type State } from './state';
import { ingestNode } from './nodes/ingest.node';
import { parseNode } from './nodes/parse.node';
import { dependencyGraphNode } from './nodes/dependency-graph.node';
import { fileAnalysisNode } from './nodes/file-analysis.node';

import { architectureAnalysisNode } from './nodes/architecture-analysis.node';
import { dataflowAnalysisNode } from './nodes/dataflow-analysis.node';
import { logicReviewNode } from './nodes/logic-review.node';
import { qualityReviewNode } from './nodes/quality-review.node';
import { bugHuntingNode } from './nodes/bug-hunting.node';
import { performanceReviewNode } from './nodes/performance-review.node';
import { designReviewNode } from './nodes/design-review.node';
import { aiAgentReviewNode } from './nodes/ai-agent-review.node';
import { reportCardNode } from './nodes/report-card.node';
import { questionGenNode } from './nodes/question-gen.node';
import { saveReportNode } from './nodes/save-report.node';

import { generateDiagnosticsNode } from './nodes/diagnostic.node';

// Placeholder nodes for phases 14-16 (if any)
const noopNode = (phaseName: string) => async (state: State): Promise<Partial<State>> => {
  if (state.streamEmit) state.streamEmit({ type: 'phase_start', phase: phaseName });
  if (state.streamEmit) state.streamEmit({ type: 'phase_complete', phase: phaseName, summary: 'Skipped' });
  return {
    currentPhase: phaseName as any,
    completedPhases: [phaseName as any],
  };
};

// Conditional edge logic
const shouldRunAIAgentReview = (state: State) => {
  // If skipAIReview is true, or no patterns detected, skip to diagnostics
  if (state.options?.skipAIReview) {
    return 'generate-diagnostics';
  }
  
  const hasAIPatterns = state.architectureAnalysis?.detectedPatterns.some(
    p => p.pattern === 'langgraph' || p.pattern === 'rag' || p.pattern === 'multi-agent'
  );
  
  return hasAIPatterns ? 'ai-agent-review' : 'generate-diagnostics';
};

import { parallelDeepDivesNode } from './nodes/parallel-deep-dives.node';

const withLogging = (nodeName: string, nodeFn: any) => async (state: State): Promise<Partial<State>> => {
  console.log(`\n[Pipeline] ---> Starting phase: ${nodeName}`);
  const startTime = Date.now();
  try {
    const result = await nodeFn(state);
    const duration = Date.now() - startTime;
    console.log(`[Pipeline] <--- Completed phase: ${nodeName} in ${duration}ms`);
    return result;
  } catch (err: any) {
    const duration = Date.now() - startTime;
    console.error(`\n[Pipeline] !!! ERROR in phase: ${nodeName} after ${duration}ms`, err);
    throw err;
  }
};

export const graph = new StateGraph(GraphState)
  // Add actual nodes
  .addNode('ingest', withLogging('ingest', ingestNode))
  .addNode('parse', withLogging('parse', parseNode))
  .addNode('dependency-graph', withLogging('dependency-graph', dependencyGraphNode))
  .addNode('file-analysis', withLogging('file-analysis', fileAnalysisNode))
  .addNode('parallel-deep-dives', withLogging('parallel-deep-dives', parallelDeepDivesNode))
  .addNode('ai-agent-review', withLogging('ai-agent-review', aiAgentReviewNode))
  .addNode('generate-diagnostics', withLogging('generate-diagnostics', generateDiagnosticsNode))
  .addNode('report-card', withLogging('report-card', reportCardNode))
  .addNode('question-gen', withLogging('question-gen', questionGenNode))
  .addNode('save-report', withLogging('save-report', saveReportNode))

  // Define Sequential Edges
  .addEdge('__start__', 'ingest')
  .addEdge('ingest', 'parse')
  .addEdge('parse', 'dependency-graph')
  .addEdge('dependency-graph', 'file-analysis')
  .addEdge('file-analysis', 'parallel-deep-dives')
  
  // Conditional Edge after parallel-deep-dives
  .addConditionalEdges('parallel-deep-dives', shouldRunAIAgentReview)
  
  // Routes from conditional branches
  .addEdge('ai-agent-review', 'generate-diagnostics')
  .addEdge('generate-diagnostics', 'report-card')
  
  // Remaining Sequential Edges
  .addEdge('report-card', 'question-gen')
  .addEdge('question-gen', 'save-report')
  .addEdge('save-report', END);

// Compile the graph
export const analysisPipeline = graph.compile();
