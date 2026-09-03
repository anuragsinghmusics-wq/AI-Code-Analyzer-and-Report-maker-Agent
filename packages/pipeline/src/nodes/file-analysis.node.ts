import { chunk } from '@code-analyzer/shared/utils';
import type { FileAnalysis } from '@code-analyzer/shared';
import type { State } from '../state';
import { topologicalSortFiles } from '../utils/topology';
import { callLLM, parseLLMJson } from '../utils/llm';
import { SYSTEM_PROMPT, generateFileAnalysisPrompt, FileAnalysisSchema } from '../prompts/file-analysis.prompt';

export async function fileAnalysisNode(state: State): Promise<Partial<State>> {
  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_start', phase: 'file-analysis' });
  }

  // 1. Sort files topologically so foundational files are analyzed first
  const sortedFiles = topologicalSortFiles(state.files, state.dependencyGraph);

  // 2. Batch files into groups of 3 to prevent token overflow
  const batches = chunk(sortedFiles, 3);
  
  const allAnalyses: FileAnalysis[] = [];
  const errors = [];
  
  let processedFiles = 0;
  const totalFiles = sortedFiles.length;

  for (const batch of batches) {
    const prompt = generateFileAnalysisPrompt(batch);
    
    try {
      // 3. Make LLM call with 3 retries (handled by callLLM)
      const response = await callLLM(prompt, SYSTEM_PROMPT, 8192, 0.2, state.jobId);
      
      // 4. Parse and validate JSON
      const parsedBatch = parseLLMJson(response, FileAnalysisSchema) as unknown as FileAnalysis[];
      
      // 4b. Recover missing fileId and filePath by zipping with the input batch
      parsedBatch.forEach((analysis, idx) => {
        if (batch[idx]) {
          if (!analysis.fileId) analysis.fileId = batch[idx].id;
          if (!analysis.filePath) analysis.filePath = batch[idx].path;
        }
      });

      allAnalyses.push(...parsedBatch);
      
      // 5. Emit progress per file completed
      for (const fileAnalysis of parsedBatch) {
        processedFiles++;
        if (state.streamEmit) {
          state.streamEmit({
            type: 'phase_progress',
            phase: 'file-analysis',
            item: fileAnalysis.filePath,
            percent: Math.round((processedFiles / totalFiles) * 100)
          });
        }
      }
    } catch (err: any) {
      // 6. Handle batch failure, record error, and continue to next batch
      errors.push({
        phase: 'file-analysis' as const,
        message: `Batch failed: ${err.message}`,
        timestamp: new Date(),
        recoverable: true
      });
      
      // We didn't process these files successfully, but we move on
      processedFiles += batch.length;
      if (state.streamEmit) {
         state.streamEmit({
            type: 'phase_progress',
            phase: 'file-analysis',
            item: 'batch_failed',
            percent: Math.round((processedFiles / totalFiles) * 100)
         });
      }
    }
  }

  if (state.streamEmit) {
    state.streamEmit({ 
      type: 'phase_complete', 
      phase: 'file-analysis', 
      summary: `Analyzed ${allAnalyses.length} files. ${errors.length > 0 ? errors.length + ' batch errors.' : ''}` 
    });
  }

  return {
    fileAnalyses: allAnalyses,
    errors: errors.length > 0 ? errors : undefined,
    currentPhase: 'file-analysis',
    completedPhases: ['file-analysis'],
  };
}
