import type { State } from '../state';
import { callLLM, parseLLMJson } from '../utils/llm';
import { SYSTEM_PROMPT, generateDesignReviewPrompt, DesignReviewSchema } from '../prompts/design-review.prompt';

export async function designReviewNode(state: State): Promise<Partial<State>> {
  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_start', phase: 'design-review' });
  }

  const prompt = generateDesignReviewPrompt(state.files);
  let result;
  const errors = [];

  try {
    const response = await callLLM(prompt, SYSTEM_PROMPT, 4096, 0.2, state.jobId);
    result = parseLLMJson(response, DesignReviewSchema);
  } catch (err: any) {
    errors.push({
      phase: 'design-review' as const,
      message: `Design Review failed: ${err.message}`,
      timestamp: new Date(),
      recoverable: true
    });
    result = {
      issues: [],
      abstractionLevel: 'appropriate' as const,
      solidPrinciples: {},
      summary: 'Analysis failed due to LLM error.'
    };
  }

  if (state.streamEmit) {
    state.streamEmit({ 
      type: 'phase_complete', 
      phase: 'design-review', 
      summary: `Found ${result.issues.length} design issues.` 
    });
  }

  return {
    designReview: result,
    errors: errors.length > 0 ? errors : undefined,
    currentPhase: 'design-review',
    completedPhases: ['design-review'],
  };
}
