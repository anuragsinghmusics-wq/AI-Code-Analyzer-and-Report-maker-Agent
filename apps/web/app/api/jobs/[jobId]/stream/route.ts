import { NextRequest } from 'next/server';
import { prisma } from '@code-analyzer/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  const { jobId } = params;

  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(`data: {"type":"connected"}\n\n`);

        let lastPhase: string | null = null;
        let lastStatus: string | null = null;

        // Poll the SQLite database every 2 seconds for changes
        intervalId = setInterval(async () => {
          try {
            const job = await prisma.job.findUnique({
              where: { id: jobId },
              select: { currentPhase: true, status: true },
            });

            if (!job) return;

            // If phase changed, emit phase_start
            if (job.currentPhase !== lastPhase && job.currentPhase) {
              controller.enqueue(`data: {"type":"phase_start","phase":"${job.currentPhase}"}\n\n`);
              lastPhase = job.currentPhase;
            }

            // If status changed to COMPLETED, emit save-report complete
            if (job.status === 'COMPLETED' && lastStatus !== 'COMPLETED') {
              controller.enqueue(`data: {"type":"phase_complete","phase":"save-report"}\n\n`);
              lastStatus = job.status;
              clearInterval(intervalId); // Stop polling
              controller.close();
            } else if (job.status === 'FAILED' || job.status === 'CANCELLED') {
              clearInterval(intervalId);
              controller.close();
            }
          } catch (e) {
            console.error('SSE DB Polling Error:', e);
          }
        }, 2000);

      } catch (err) {
        console.error('SSE Error:', err);
        controller.error(err);
      }
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
