import type { State } from '../state';
import { callLLM, parseLLMJson } from '../utils/llm';
import { SYSTEM_PROMPT, generateDataFlowAnalysisPrompt, DataFlowAnalysisSchema } from '../prompts/dataflow-analysis.prompt';

export async function dataflowAnalysisNode(state: State): Promise<Partial<State>> {
  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_start', phase: 'dataflow-analysis' });
  }

  const prompt = generateDataFlowAnalysisPrompt(state.files);
  let result;
  const errors = [];

  try {
    const response = await callLLM(prompt, SYSTEM_PROMPT, 4096, 0.2, state.jobId);
    result = parseLLMJson(response, DataFlowAnalysisSchema);
  } catch (err: any) {
    errors.push({
      phase: 'dataflow-analysis' as const,
      message: `Data Flow Analysis failed: ${err.message}`,
      timestamp: new Date(),
      recoverable: true
    });
    result = {
      traces: [],
      stateManagement: 'Analysis failed.',
      dataValidation: 'Analysis failed.',
      summary: 'Analysis failed due to LLM error.'
    };
  }

  if (state.streamEmit) {
    state.streamEmit({ 
      type: 'phase_complete', 
      phase: 'dataflow-analysis', 
      summary: `Traced ${result.traces.length} data flows.` 
    });
  }

  return {
    dataFlowAnalysis: result,
    errors: errors.length > 0 ? errors : undefined,
    currentPhase: 'dataflow-analysis',
    completedPhases: ['dataflow-analysis'],
  };
}
