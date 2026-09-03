import type { State } from '../state';
import { callLLM, parseLLMJson } from '../utils/llm';
import {
  CATEGORY_SCORES_SYSTEM_PROMPT,
  SUMMARY_SYSTEM_PROMPT,
  CategoryScoresSchema,
  SummarySchema,
  generateCategoryScoresPrompt,
  generateSummaryPrompt,
} from '../prompts/report-card.prompt';
import type { ReportCard } from '@code-analyzer/shared';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function reportCardNode(state: State): Promise<Partial<State>> {
  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_start', phase: 'report-card' });
  }

  let result: Partial<ReportCard> = {};
  const errors: any[] = [];

  // ── Call 1: Generate all 10 category scores ──────────────────────────────
  // Output is a JSON array only — much smaller than the full report card.
  // Max tokens 4096 is plenty for 10 categories with 1-2 sentence fields each.
  let categoryScores: any[] = [];
  try {
    const prompt1 = generateCategoryScoresPrompt(state);
    const response1 = await callLLM(prompt1, CATEGORY_SCORES_SYSTEM_PROMPT, 4096, 0.2, state.jobId);
    categoryScores = parseLLMJson(response1, CategoryScoresSchema) as any[];
  } catch (err: any) {
    errors.push({
      phase: 'report-card' as const,
      message: `Category scoring failed: ${err.message}`,
      timestamp: new Date(),
      recoverable: true,
    });
    // Continue to Call 2 even if Call 1 partially fails — summary can still be generated
    categoryScores = [];
  }

  // ── 2-second gap between calls to avoid rate-limit spikes ────────────────
  await sleep(2000);

  // ── Call 2: Generate overall score + full summary + improvements ─────────
  // Input is just the category scores list (compact) + problem statement.
  // Output is a small JSON object — well under 2000 tokens.
  let summaryResult: any = null;
  try {
    const prompt2 = generateSummaryPrompt(state, categoryScores);
    const response2 = await callLLM(prompt2, SUMMARY_SYSTEM_PROMPT, 3000, 0.2, state.jobId);
    summaryResult = parseLLMJson(response2, SummarySchema);
  } catch (err: any) {
    errors.push({
      phase: 'report-card' as const,
      message: `Summary generation failed: ${err.message}`,
      timestamp: new Date(),
      recoverable: true,
    });
  }

  // ── Merge both call results into the final ReportCard ────────────────────
  const baseStats = {
    filesAnalyzed: state.files.length,
    linesOfCode: state.files.reduce((acc, f) => acc + f.lineCount, 0),
    languagesDetected: Array.from(new Set(state.files.map(f => f.language))),
  };

  if (categoryScores.length > 0 || summaryResult) {
    result = {
      categoryScores,
      overallScore: summaryResult?.overallScore ?? 0,
      overallGrade: summaryResult?.overallGrade ?? 'F',
      summary: summaryResult?.summary ?? 'Category scores generated but final summary failed.',
      improvements: summaryResult?.improvements ?? [],
      ...baseStats,
    };
  } else {
    // Both calls failed — use full fallback
    result = {
      overallScore: 0,
      overallGrade: 'F',
      categoryScores: [],
      improvements: [],
      summary: 'Analysis failed due to LLM error.',
      ...baseStats,
    };
  }

  // Ensure required DB fields
  result.id = state.jobId;
  result.jobId = state.jobId;
  result.generatedAt = new Date();

  if (state.streamEmit) {
    state.streamEmit({
      type: 'phase_complete',
      phase: 'report-card',
      summary: `Report card generated. Grade: ${result.overallGrade}`,
    });
    state.streamEmit({
      type: 'score_ready',
      category: 'Overall',
      score: result.overallScore || 0,
    });
  }

  return {
    reportCard: result as ReportCard,
    errors: errors.length > 0 ? errors : undefined,
    currentPhase: 'report-card',
    completedPhases: ['report-card'],
  };
}
