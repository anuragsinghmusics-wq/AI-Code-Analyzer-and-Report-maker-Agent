import { State } from '../state.js';
import { generateDiagnosticQuestionsPrompt, SYSTEM_PROMPT, DiagnosticOutputSchema } from '../prompts/diagnostic.prompt.js';
import { callLLM, parseLLMJson } from '../utils/llm.js';
import { logger } from '@code-analyzer/shared';

export async function generateDiagnosticsNode(state: State): Promise<Partial<State>> {
  logger.info(`[Job ${state.jobId}] Starting generateDiagnosticsNode`);

  // We want to pull the most interesting findings from the previous phases.
  const findings: string[] = [];

  // Gather Security / Bug flaws
  if (state.bugReport?.bugs && state.bugReport.bugs.length > 0) {
    const topBugs = state.bugReport.bugs.filter(b => b.severity === 'critical' || b.severity === 'high').slice(0, 2);
    for (const bug of topBugs) {
      findings.push(`[security/bugHunting] (${bug.file}:${bug.line || 'unknown'}): ${bug.description}`);
    }
  }

  // Gather Architecture flaws
  if (state.architectureAnalysis?.layering?.violations && state.architectureAnalysis.layering.violations.length > 0) {
    const topArch = state.architectureAnalysis.layering.violations.slice(0, 1);
    for (const v of topArch) {
      findings.push(`[architecture] ${v}`);
    }
  }

  // Gather Data Flow flaws
  if (state.dataFlowAnalysis?.dataValidation) {
    findings.push(`[dataFlow] General Validation observation: ${state.dataFlowAnalysis.dataValidation}`);
  }

  // Gather Logic / Concurrency issues
  if (state.logicReview?.concurrencyIssues && state.logicReview.concurrencyIssues.length > 0) {
    findings.push(`[concurrency] ${state.logicReview.concurrencyIssues[0]}`);
  }

  if (findings.length === 0) {
    logger.info(`[Job ${state.jobId}] No significant findings to generate diagnostics. Skipping.`);
    return { currentPhase: 'generate-diagnostics', diagnosticQuestions: [] };
  }

  try {
    const findingsContext = findings.join('\n');
    const prompt = generateDiagnosticQuestionsPrompt(state, findingsContext);

    const rawResponse = await callLLM(
      prompt,
      SYSTEM_PROMPT,
      8192,
      0.7,
      state.jobId
    );
    
    const result = parseLLMJson(rawResponse, DiagnosticOutputSchema);

    logger.info(`[Job ${state.jobId}] Successfully generated ${result.questions?.length || 0} diagnostic questions.`);
    
    return {
      currentPhase: 'generate-diagnostics',
      diagnosticQuestions: result.questions || []
    };
  } catch (error) {
    logger.error({ err: error }, `[Job ${state.jobId}] Failed to generate diagnostic questions`);
    return {
      currentPhase: 'generate-diagnostics',
      errors: [{ phase: 'generate-diagnostics', message: (error as Error).message, timestamp: new Date(), recoverable: true }],
      diagnosticQuestions: []
    };
  }
}
