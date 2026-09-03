import type { State } from '../state';
import { callLLM, parseLLMJson } from '../utils/llm';
import { SYSTEM_PROMPT, generateBugHuntingPrompt, BugReportSchema } from '../prompts/bug-hunting.prompt';

export async function bugHuntingNode(state: State): Promise<Partial<State>> {
  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_start', phase: 'bug-hunting' });
  }

  const prompt = generateBugHuntingPrompt(state.files);
  let result;
  const errors = [];

  try {
    const response = await callLLM(prompt, SYSTEM_PROMPT, 4096, 0.2, state.jobId);
    result = parseLLMJson(response, BugReportSchema);
  } catch (err: any) {
    errors.push({
      phase: 'bug-hunting' as const,
      message: `Bug Hunting failed: ${err.message}`,
      timestamp: new Date(),
      recoverable: true
    });
    result = {
      bugs: [],
      vulnerabilityCount: 0,
      antipatternCount: 0,
      summary: 'Analysis failed due to LLM error.'
    };
  }

  if (state.streamEmit) {
    state.streamEmit({ 
      type: 'phase_complete', 
      phase: 'bug-hunting', 
      summary: `Found ${result.bugs.length} bugs.` 
    });
  }

  return {
    bugReport: result,
    errors: errors.length > 0 ? errors : undefined,
    currentPhase: 'bug-hunting',
    completedPhases: ['bug-hunting'],
  };
}
