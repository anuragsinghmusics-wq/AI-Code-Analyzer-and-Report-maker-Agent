import type { State } from '../state';
import { callLLM, parseLLMJson } from '../utils/llm';
import { SYSTEM_PROMPT, generateArchitectureAnalysisPrompt, ArchitectureAnalysisSchema } from '../prompts/architecture-analysis.prompt';

export async function architectureAnalysisNode(state: State): Promise<Partial<State>> {
  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_start', phase: 'architecture-analysis' });
  }

  const prompt = generateArchitectureAnalysisPrompt(state.files, state.fileAnalyses || []);
  let result;
  const errors = [];

  try {
    const response = await callLLM(prompt, SYSTEM_PROMPT, 4096, 0.2, state.jobId);
    result = parseLLMJson(response, ArchitectureAnalysisSchema) as any;
  } catch (err: any) {
    errors.push({
      phase: 'architecture-analysis' as const,
      message: `Architecture Analysis failed: ${err.message}`,
      timestamp: new Date(),
      recoverable: true
    });
    // Fallback empty result so pipeline continues
    result = {
      detectedPatterns: [],
      layering: { layers: [], violations: [] },
      entryPoints: [],
      summary: 'Analysis failed due to LLM error.',
      recommendations: []
    };
  }

  if (state.streamEmit) {
    state.streamEmit({ 
      type: 'phase_complete', 
      phase: 'architecture-analysis', 
      summary: `Detected ${result.detectedPatterns.length} patterns.` 
    });
  }

  return {
    architectureAnalysis: result,
    errors: errors.length > 0 ? errors : undefined,
    currentPhase: 'architecture-analysis',
    completedPhases: ['architecture-analysis'],
  };
}
