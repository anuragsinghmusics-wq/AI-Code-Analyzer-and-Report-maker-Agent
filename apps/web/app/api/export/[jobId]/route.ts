// apps/web/app/api/export/[jobId]/route.ts — PDF export API route placeholder
import { NextRequest, NextResponse } from 'next/server';

// TODO: Implement PDF export trigger + download
export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  return NextResponse.json({ status: 'not-implemented', jobId: params.jobId });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  return NextResponse.json({ status: 'not-implemented', jobId: params.jobId });
}
