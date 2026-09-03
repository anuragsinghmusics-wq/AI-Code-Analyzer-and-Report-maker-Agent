import { NextRequest, NextResponse } from 'next/server';
import { markJobProcessing, markJobCompleted, markJobFailed, prisma } from '@code-analyzer/db';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    let repoUrl = '';
    let problemStatement: string | null = null;
    let inputType: 'REPO' | 'ZIP' | 'FILE' = 'REPO';
    let fileBuffer: Buffer | null = null;
    let originalFilename = '';

    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await req.json();
      repoUrl = data.repoUrl;
      problemStatement = data.problemStatement || null;
      if (!repoUrl) {
        return NextResponse.json({ error: 'GitHub repository URL is required' }, { status: 400 });
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      repoUrl = formData.get('repoUrl') as string;
      problemStatement = formData.get('problemStatement') as string || null;
      const file = formData.get('fileUpload') as File | null;

      if (!repoUrl && (!file || file.size === 0)) {
        return NextResponse.json({ error: 'Please provide either a GitHub URL or upload a file.' }, { status: 400 });
      }

      if (file && file.size > 0) {
        inputType = file.name.endsWith('.zip') ? 'ZIP' : 'FILE';
        originalFilename = file.name;
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      }
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
    }

    // 1. Get or create an anonymous user
    const user = await prisma.user.upsert({
      where: { email: 'anonymous@codejudge.local' },
      update: {},
      create: { 
        email: 'anonymous@codejudge.local', 
        name: 'Anonymous User' 
      },
    });

    let savedFilePath = '';
    // If a file was uploaded, save it to a temporary local path
    if (fileBuffer) {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const uniqueFilename = `${Date.now()}-${originalFilename}`;
      savedFilePath = path.join(uploadDir, uniqueFilename);
      fs.writeFileSync(savedFilePath, fileBuffer);
    }

    // 2. Caching logic: check for a completed job with the identical input hash
    const inputString = (repoUrl || originalFilename || '') + '|' + (problemStatement || '');
    const inputHash = Buffer.from(inputString).toString('base64');
    
    const existingJob = await prisma.job.findFirst({
      where: {
        inputHash,
        status: 'COMPLETED'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (existingJob) {
      console.log(`[CACHE HIT] Returning existing job ${existingJob.id} for hash ${inputHash}`);
      return NextResponse.json({ jobId: existingJob.id });
    }

    // 3. Create the Job in the database
    const job = await prisma.job.create({
      data: {
        userId: user.id,
        inputType,
        repoUrl: savedFilePath || repoUrl || originalFilename,
        inputHash,
        problemStatement,
        status: 'PENDING',
      }
    });

    // We rely on the standalone polling worker to pick up the PENDING job from the database.
    return NextResponse.json({ jobId: job.id });
  } catch (error: any) {
    console.error('Error submitting job:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
