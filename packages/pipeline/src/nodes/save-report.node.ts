import type { State } from '../state';
import { createReportWithQuestions } from '@code-analyzer/db';
import { createPipelineLogger } from '@code-analyzer/shared/logger';

export async function saveReportNode(state: State): Promise<Partial<State>> {
  const log = createPipelineLogger(state.jobId, 'save-report');

  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_start', phase: 'save-report' as any });
  }

  try {
    if (!state.reportCard) {
      log.warn({ jobId: state.jobId }, 'No reportCard in state — skipping save');
      return {};
    }

    const reportCard = state.reportCard;
    const questions = state.questions || [];

    const strengths: string[] = reportCard.categoryScores?.map(c => c.analysis) || [];
    const weaknesses: string[] = [];
    const fileBreakdown = state.fileAnalyses || [];

    await createReportWithQuestions({
      jobId: state.jobId,
      summary: reportCard.summary || 'Analysis complete.',
      overallScore: reportCard.overallScore || 0,
      grade: reportCard.overallGrade || 'N/A',
      reportCard: reportCard as any,
      strengths,
      weaknesses,
      improvements: reportCard.improvements || [],
      fileBreakdown,
      diagnosticQuestions: state.diagnosticQuestions || [],
      questions: questions.map((q: any, i: number) => ({
        index: q.index ?? i,
        text: q.text || q.question || '',
        options: Array.isArray(q.options) && q.options.length > 0 ? q.options : undefined,
        category: q.category || 'General',
        difficulty: q.difficulty || 'Medium',
        codeRef: q.codeRef ?? undefined,
        modelAnswer: q.modelAnswer ?? undefined,
        rubric: q.rubric ?? undefined,
      })),
    });

    log.info({ jobId: state.jobId }, 'Report saved to database successfully');

    if (state.streamEmit) {
      state.streamEmit({ type: 'phase_complete', phase: 'save-report' as any, summary: 'Report saved.' });
    }
  } catch (err: any) {
    log.error({ jobId: state.jobId, err: err.message }, 'Failed to save report to database');
    // Don't throw — let the pipeline complete, the report just won't be persisted
  }

  return {
    currentPhase: 'save-report' as any,
    completedPhases: ['save-report' as any],
  };
}
