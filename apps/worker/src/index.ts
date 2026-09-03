import fs from 'node:fs';
import { prisma, markJobProcessing, markJobCompleted, markJobFailed } from '@code-analyzer/db';
import { logger } from '@code-analyzer/shared/logger';
import { detectLanguageFromExtension } from '@code-analyzer/shared/utils';
import type { Language } from '@code-analyzer/shared/types';
import { analysisPipeline, type State } from '@code-analyzer/pipeline';
import { sleep } from '@code-analyzer/shared/utils';
import { config } from '@code-analyzer/shared/config';

logger.info('Initializing @code-analyzer/worker database polling service...');

let isRunning = true;

async function processJob(job: any) {
  const startTime = Date.now();
  const inputType = job.inputType.toLowerCase();

  const filesToAnalyze: any[] = [];

  if (inputType === 'file' && job.repoUrl && fs.existsSync(job.repoUrl)) {
    logger.info({ filePath: job.repoUrl }, 'Reading uploaded single file from disk');
    const rawContent = fs.readFileSync(job.repoUrl, 'utf-8');
    let content = rawContent;

    // Clean up Jupyter notebooks by extracting only source code
    if (job.repoUrl.endsWith('.ipynb')) {
      try {
        const notebook = JSON.parse(rawContent);
        if (notebook.cells && Array.isArray(notebook.cells)) {
          content = notebook.cells
            .filter((c: any) => c.cell_type === 'code' || c.cell_type === 'markdown')
            .map((c: any) => (c.source.join ? c.source.join('') : c.source))
            .join('\n\n');
        }
      } catch (e) {
        logger.warn({ err: e }, 'Failed to parse .ipynb as JSON, treating as raw text');
      }
    }

    // Truncate large files to avoid token limit issues (~10k tokens = ~40k chars)
    const MAX_CHARS = 40_000;
    content =
      content.length > MAX_CHARS
        ? content.substring(0, MAX_CHARS) +
          `\n\n... [File truncated: ${content.length} chars total, showing first ${MAX_CHARS}] ...`
        : content;

    filesToAnalyze.push({
      id: `file-${Date.now()}`,
      path: job.repoUrl.split(/[\\\/]/).pop() || 'uploaded_file',
      content,
      language: detectLanguageFromExtension(job.repoUrl) as Language,
      metadata: { size: content.length },
      lineCount: content.split('\n').length,
      sizeBytes: content.length,
      isEntryPoint: true,
    });
  }

  // A flag that the streamEmit callback sets when it detects cancellation
  let cancelDetected = false;

  const initialState: Partial<State> = {
    jobId: job.id,
    userId: job.userId,
    inputType: inputType as any,
    files: filesToAnalyze,
    options: {
      problemStatement: (job as any).problemStatement || undefined,
    },
    completedPhases: [],
    errors: [],
    streamEmit: async (event) => {
      // 1. Check for cancellation (non-throwing — just set a flag)
      try {
        const currentJob = await prisma.job.findUnique({
          where: { id: job.id },
          select: { status: true },
        });
        if (currentJob?.status === 'CANCELLED') {
          cancelDetected = true;
          return;
        }
      } catch (e) {
        logger.warn({ err: e }, 'Failed to check job cancellation status');
      }

      // 2. Update DB
      if (event.type === 'phase_start' && event.phase) {
        try {
          await prisma.job.update({
            where: { id: job.id },
            data: { currentPhase: event.phase },
          });
        } catch (e) {
          logger.warn({ err: e }, 'Failed to update currentPhase in DB');
        }
      }
    },
  };

  const finalState = await analysisPipeline.invoke(initialState);

  // If cancellation was detected during the pipeline, stop without completing
  if (cancelDetected) {
    logger.info({ jobId: job.id }, 'Job was cancelled during analysis, skipping completion.');
    return;
  }

  if (finalState.errors && finalState.errors.length > 0) {
    const fatalError = finalState.errors.find((e) => !e.recoverable);
    if (fatalError) {
      throw new Error(`Analysis failed during ${fatalError.phase}: ${fatalError.message}`);
    }
  }

  await markJobCompleted(job.id, {
    fileCount: filesToAnalyze.length,
    languages: filesToAnalyze.map((f) => f.language),
    durationMs: Date.now() - startTime,
  });

  logger.info({ jobId: job.id }, 'Job completed successfully');
}

async function pollForJobs() {
  // Reset any jobs stuck in PROCESSING state from a previous crash or restart
  try {
    logger.info('Resetting any jobs stuck in PROCESSING state from a previous crash...');
    const result = await prisma.job.updateMany({
      where: { status: 'PROCESSING' },
      data: { status: 'PENDING' },
    });
    if (result.count > 0) {
      logger.info({ count: result.count }, 'Reset stuck jobs back to PENDING');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to reset stuck jobs');
  }

  while (isRunning) {
    try {
      const job = await prisma.job.findFirst({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
      });

      if (job) {
        logger.info({ jobId: job.id }, 'Found pending job, starting processing...');
        await markJobProcessing(job.id);

        try {
          await processJob(job);
        } catch (err: any) {
          logger.error({ jobId: job.id, err }, 'Analysis job failed');
          await markJobFailed(job.id, err.message);
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error during polling loop');
    }

    // Wait 2 seconds before checking again
    await sleep(2000);
  }
}

// Graceful Shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Received termination signal — stopping polling...');
  isRunning = false;
  // Let the current loop finish or exit immediately
  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Start polling
pollForJobs();
