import type { State } from '../state';
import { callLLM, parseLLMJson } from '../utils/llm';
import { SYSTEM_PROMPT, generateAIAgentReviewPrompt, AIAgentReviewSchema } from '../prompts/ai-agent-review.prompt';

export async function aiAgentReviewNode(state: State): Promise<Partial<State>> {
  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_start', phase: 'ai-agent-review' });
  }

  const prompt = generateAIAgentReviewPrompt(state.files);
  let result;
  const errors = [];

  try {
    const response = await callLLM(prompt, SYSTEM_PROMPT, 4096, 0.2, state.jobId);
    result = parseLLMJson(response, AIAgentReviewSchema);
  } catch (err: any) {
    errors.push({
      phase: 'ai-agent-review' as const,
      message: `AI Agent Review failed: ${err.message}`,
      timestamp: new Date(),
      recoverable: true
    });
    result = {
      isAIProject: false,
      findings: [],
      frameworksDetected: [],
      summary: 'Analysis failed due to LLM error.'
    };
  }

  if (state.streamEmit) {
    state.streamEmit({ 
      type: 'phase_complete', 
      phase: 'ai-agent-review', 
      summary: `Detected ${result.frameworksDetected.length} AI frameworks.` 
    });
  }

  return {
    aiAgentReview: result,
    errors: errors.length > 0 ? errors : undefined,
    currentPhase: 'ai-agent-review',
    completedPhases: ['ai-agent-review'],
  };
}
