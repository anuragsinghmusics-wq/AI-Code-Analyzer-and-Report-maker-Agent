import type { State } from '../state';
import { callLLM, parseLLMJson } from '../utils/llm';
import { SYSTEM_PROMPT, generateLogicReviewPrompt, LogicReviewSchema } from '../prompts/logic-review.prompt';

export async function logicReviewNode(state: State): Promise<Partial<State>> {
  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_start', phase: 'logic-review' });
  }

  const prompt = generateLogicReviewPrompt(state.files);
  let result;
  const errors = [];

  try {
    const response = await callLLM(prompt, SYSTEM_PROMPT, 4096, 0.2, state.jobId);
    result = parseLLMJson(response, LogicReviewSchema);
  } catch (err: any) {
    errors.push({
      phase: 'logic-review' as const,
      message: `Logic Review failed: ${err.message}`,
      timestamp: new Date(),
      recoverable: true
    });
    result = {
      findings: [],
      algorithmComplexity: 'Analysis failed.',
      concurrencyIssues: [],
      authFlaws: [],
      summary: 'Analysis failed due to LLM error.'
    };
  }

  if (state.streamEmit) {
    state.streamEmit({ 
      type: 'phase_complete', 
      phase: 'logic-review', 
      summary: `Found ${result.findings.length} logic findings.` 
    });
  }

  return {
    logicReview: result,
    errors: errors.length > 0 ? errors : undefined,
    currentPhase: 'logic-review',
    completedPhases: ['logic-review'],
  };
}
