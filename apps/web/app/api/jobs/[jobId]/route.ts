// apps/web/app/api/jobs/[jobId]/route.ts — Job status API route placeholder
import { NextRequest, NextResponse } from 'next/server';

// TODO: Implement job status endpoint + SSE streaming
export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  return NextResponse.json({ status: 'not-implemented', jobId: params.jobId });
}
