import { NextRequest, NextResponse } from 'next/server';
import { cancelJob } from '@code-analyzer/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await cancelJob(params.jobId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to cancel job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    );
  }
}
