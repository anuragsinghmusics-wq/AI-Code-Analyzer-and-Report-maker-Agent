// apps/worker/src/processors/analysis.processor.ts — Main pipeline job processor
import fs from 'node:fs';
import { Worker, type Job as BullJob } from 'bullmq';
import type { Redis } from 'ioredis';
import { config } from '@code-analyzer/shared/config';
import { createPipelineLogger } from '@code-analyzer/shared/logger';
import { detectLanguageFromExtension } from '@code-analyzer/shared/utils';
import type { Language } from '@code-analyzer/shared/types';
import { markJobProcessing, markJobCompleted, markJobFailed } from '@code-analyzer/db';
import { analysisPipeline } from '@code-analyzer/pipeline';
import type { State } from '@code-analyzer/pipeline';
import { ANALYSIS_QUEUE_NAME, type AnalysisJobPayload } from '../jobs/analysis.job.js';

export function createAnalysisWorker(connection: Redis): Worker<AnalysisJobPayload> {
  const worker = new Worker<AnalysisJobPayload>(
    ANALYSIS_QUEUE_NAME,
    async (job: BullJob<AnalysisJobPayload>) => {
      const { jobId, inputType, hackathonId, submissionId, filePath, repoUrl } = job.data;
      const log = createPipelineLogger(jobId, 'analysis');
      const startTime = Date.now();

      log.info(
        { jobId, inputType, attempt: job.attemptsMade + 1 },
        'Received analysis job — starting execution',
      );

      // 1. Update status PENDING -> PROCESSING in PostgreSQL
      try {
        await markJobProcessing(jobId);
        log.info({ jobId }, 'Job status updated to PROCESSING in database');
      } catch (dbErr) {
        log.warn({ jobId, dbErr }, 'Failed to update job status to PROCESSING in DB');
      }

      // 2. Main analysis execution (LangGraph pipeline)
      log.info({ jobId }, 'Executing LangGraph analysis pipeline...');
      
      // Read file into memory if it's an uploaded file
      const filesToAnalyze = [];
      if (inputType === 'file' && filePath && fs.existsSync(filePath)) {
        log.info({ filePath }, 'Reading uploaded single file from disk');
        const content = fs.readFileSync(filePath, 'utf-8');
        filesToAnalyze.push({
          id: `file-${Date.now()}`,
          path: repoUrl || filePath.split(/[\\/]/).pop() || 'uploaded_file',
          content,
          language: detectLanguageFromExtension(repoUrl || filePath) as Language,
          metadata: { size: content.length },
          lineCount: content.split('\\n').length,
          sizeBytes: content.length,
          isEntryPoint: true,
        });
      } else if (inputType === 'repo') {
        // Mock repo download for now
        log.info({ repoUrl }, 'Processing repository URL (mock: no files downloaded yet)');
      }

      const initialState: Partial<State> = {
        jobId,
        userId: 'system', // TODO: fetch actual user ID from job or DB
        hackathonId,
        submissionId,
        inputType,
        files: filesToAnalyze,
        options: {}, 
        completedPhases: [],
        errors: [],
        streamEmit: (event) => {
           // We will forward these events to Redis pub/sub or websocket later
           log.debug({ event: event.type, phase: 'phase' in event ? event.phase : undefined }, 'Pipeline Stream Event');
        }
      };

      const finalState = await analysisPipeline.invoke(initialState) as State;
      const durationMs = Date.now() - startTime;

      // 3. Update status PROCESSING -> COMPLETED in PostgreSQL
      await markJobCompleted(jobId, {
        fileCount: filesToAnalyze.length,
        languages: filesToAnalyze.map(f => f.language),
        durationMs,
      });

      log.info(
        { jobId, durationMs },
        'Analysis job completed successfully — status updated to COMPLETED in database',
      );


      return { success: true, jobId, durationMs };
    },
    {
      connection,
      concurrency: config.WORKER_CONCURRENCY,
    },
  );

  // Worker-level error & failure listeners
  worker.on('failed', async (job, err) => {
    if (!job) return;
    const { jobId } = job.data;
    const log = createPipelineLogger(jobId, 'analysis');

    log.error(
      { jobId, attempt: job.attemptsMade, maxAttempts: job.opts.attempts, err },
      `Analysis job attempt failed: ${err.message}`,
    );

    // If max attempts reached, mark job as FAILED in database
    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
      try {
        await markJobFailed(jobId, err.message);
        log.error({ jobId }, 'Job marked as FAILED in database after exhausting retries');
      } catch (dbErr) {
        log.error({ jobId, dbErr }, 'Failed to mark job as FAILED in database');
      }
    }
  });

  return worker;
}
