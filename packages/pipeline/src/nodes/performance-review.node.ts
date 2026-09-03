import type { State } from '../state';
import { callLLM, parseLLMJson } from '../utils/llm';
import { SYSTEM_PROMPT, generatePerformanceReviewPrompt, PerformanceReviewSchema } from '../prompts/performance-review.prompt';

export async function performanceReviewNode(state: State): Promise<Partial<State>> {
  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_start', phase: 'performance-review' });
  }

  const prompt = generatePerformanceReviewPrompt(state.files);
  let result;
  const errors = [];

  try {
    const response = await callLLM(prompt, SYSTEM_PROMPT, 4096, 0.2, state.jobId);
    result = parseLLMJson(response, PerformanceReviewSchema);
  } catch (err: any) {
    errors.push({
      phase: 'performance-review' as const,
      message: `Performance Review failed: ${err.message}`,
      timestamp: new Date(),
      recoverable: true
    });
    result = {
      issues: [],
      bottlenecks: [],
      complexityHotspots: [],
      summary: 'Analysis failed due to LLM error.'
    };
  }

  if (state.streamEmit) {
    state.streamEmit({ 
      type: 'phase_complete', 
      phase: 'performance-review', 
      summary: `Found ${result.issues.length} performance issues.` 
    });
  }

  return {
    performanceReview: result,
    errors: errors.length > 0 ? errors : undefined,
    currentPhase: 'performance-review',
    completedPhases: ['performance-review'],
  };
}
