import type { State } from '../state';
import { callLLM, parseLLMJson } from '../utils/llm';
import { SYSTEM_PROMPT, generateQuestionGenPrompt, QuestionGenSchema } from '../prompts/question-gen.prompt';

export async function questionGenNode(state: State): Promise<Partial<State>> {
  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_start', phase: 'question-gen' });
  }

  // The request asks for 20 questions, and the prompt asks for them.
  let questionCount = state.options?.questionCount || 20;

  const prompt = generateQuestionGenPrompt(state);
  let result: any[] = [];
  const errors = [];

  try {
    // Generate 10 questions by running 5 parallel batches of 2 questions each
    const batchPromises = Array.from({ length: 5 }).map(async (_, index) => {
      // Add a 12 second delay between parallel calls to avoid rate limits
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, index * 12000));
      }
      
      // Pass a slightly modified prompt for each batch to encourage variety
      const batchPrompt = prompt + `\n\nNOTE FOR THIS BATCH: You MUST only generate exactly 2 questions. Focus heavily on batch index ${index + 1} specific topics (e.g., Batch 1: Architecture, Batch 2: Security, Batch 3: Performance, Batch 4: Quality, Batch 5: General Algorithms). Ensure questions are distinct.`;
      const response = await callLLM(batchPrompt, SYSTEM_PROMPT, 8192, 0.5, state.jobId);
      return parseLLMJson(response, QuestionGenSchema);
    });

    const batchResults = await Promise.all(batchPromises);
    
    // Flatten the array of arrays and fix up indices
    result = batchResults.flat().map((q: any, i: number) => ({
      ...q,
      index: i + 1
    }));

    // If we somehow got more than requested, truncate
    if (result.length > questionCount) {
      result = result.slice(0, questionCount);
    }
  } catch (err: any) {
    errors.push({
      phase: 'question-gen' as const,
      message: `Question Generation failed: ${err.message}`,
      timestamp: new Date(),
      recoverable: true
    });
    result = [];
  }

  if (state.streamEmit) {
    state.streamEmit({ 
      type: 'phase_complete', 
      phase: 'question-gen', 
      summary: `Generated ${result.length} questions.` 
    });
    // emit question_ready events
    result.forEach((q, i) => {
      state.streamEmit!({
        type: 'question_ready',
        index: i,
        question: q as any
      });
    });
  }

  return {
    questions: result as any, // Cast to any to avoid strict type mismatch if schema slightly differs, but should be exact
    errors: errors.length > 0 ? errors : undefined,
    currentPhase: 'question-gen',
    completedPhases: ['question-gen'],
  };
}
