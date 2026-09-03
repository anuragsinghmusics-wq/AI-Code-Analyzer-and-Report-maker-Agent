// apps/worker/src/jobs/analysis.job.ts — Analysis queue definition & enqueue helper
import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';

export const ANALYSIS_QUEUE_NAME = 'analysis-queue';

export interface AnalysisJobPayload {
  jobId: string;
  userId: string;
  hackathonId?: string;
  submissionId?: string;
  inputType: 'file' | 'zip' | 'repo';
  repoUrl?: string;
  filePath?: string;
  options?: {
    problemStatement?: string;
    questionCount?: number;
    includeModelAnswers?: boolean;
    forceRefresh?: boolean;
  };
}

let analysisQueueInstance: Queue<AnalysisJobPayload> | null = null;

export function getAnalysisQueue(connection: Redis): Queue<AnalysisJobPayload> {
  if (!analysisQueueInstance) {
    analysisQueueInstance = new Queue<AnalysisJobPayload>(ANALYSIS_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600 },   // 1 hour retention
        removeOnFail: { age: 86400 },      // 24 hours retention
      },
    });
  }
  return analysisQueueInstance;
}
