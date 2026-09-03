import type { State } from '../state';
import { callLLM, parseLLMJson } from '../utils/llm';
import { SYSTEM_PROMPT, generateQualityReviewPrompt, QualityReviewSchema } from '../prompts/quality-review.prompt';

export async function qualityReviewNode(state: State): Promise<Partial<State>> {
  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_start', phase: 'quality-review' });
  }

  const prompt = generateQualityReviewPrompt(state.files);
  let result;
  const errors = [];

  try {
    const response = await callLLM(prompt, SYSTEM_PROMPT, 4096, 0.2, state.jobId);
    result = parseLLMJson(response, QualityReviewSchema);
  } catch (err: any) {
    errors.push({
      phase: 'quality-review' as const,
      message: `Quality Review failed: ${err.message}`,
      timestamp: new Date(),
      recoverable: true
    });
    result = {
      dimensions: {},
      overallScore: 0,
      summary: 'Analysis failed due to LLM error.',
      topIssues: [],
      topStrengths: []
    };
  }

  if (state.streamEmit) {
    state.streamEmit({ 
      type: 'phase_complete', 
      phase: 'quality-review', 
      summary: `Quality score: ${result.overallScore}/10` 
    });
  }

  return {
    qualityReview: result,
    errors: errors.length > 0 ? errors : undefined,
    currentPhase: 'quality-review',
    completedPhases: ['quality-review'],
  };
}
