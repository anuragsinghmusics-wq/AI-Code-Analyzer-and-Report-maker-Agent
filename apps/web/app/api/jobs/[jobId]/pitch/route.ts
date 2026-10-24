// apps/web/app/api/jobs/[jobId]/pitch/route.ts
// Generates tailored defense questions and evaluates the candidate's Developer Pitch answers.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@code-analyzer/db";
import OpenAI from "openai";
import { z } from "zod";
import fs from "fs";
import path from "path";

// ── In-memory cache for generated questions per job ───────────────────────────
const questionsCache = new Map<string, any[]>();

// ── Grade helpers ─────────────────────────────────────────────────────────────
function scoreToGrade(score: number): string {
  if (score >= 9.5) return "A+";
  if (score >= 9.0) return "A";
  if (score >= 8.5) return "A-";
  if (score >= 8.0) return "B+";
  if (score >= 7.5) return "B";
  if (score >= 7.0) return "B-";
  if (score >= 6.5) return "C+";
  if (score >= 6.0) return "C";
  if (score >= 5.5) return "C-";
  if (score >= 5.0) return "D";
  return "F";
}

// ── LLM client ────────────────────────────────────────────────────────────────
function getClient(): OpenAI {
  const groqKey = process.env.GROQ_API_KEY || "";
  if (groqKey) {
    return new OpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: groqKey.split(",")[0].trim(),
    });
  }
  if (process.env.OPENROUTER_API_KEY) {
    return new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }
  return new OpenAI({
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKey: process.env.GOOGLE_API_KEY || "",
  });
}

function parseLLMJson<T>(raw: string, schema: z.ZodSchema<T>): T {
  let cleaned = raw;
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) cleaned = jsonBlockMatch[1];
  cleaned = cleaned.trim();
  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");
  const jsonStr = startIdx !== -1 && endIdx !== -1
    ? cleaned.substring(startIdx, endIdx + 1)
    : cleaned;
  return schema.parse(JSON.parse(jsonStr));
}

// ── GET: Dynamically generate tailored defense questions for this codebase ────
export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (questionsCache.has(jobId)) {
      return NextResponse.json({ questions: questionsCache.get(jobId) });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        inputType: true,
        repoUrl: true,
        problemStatement: true,
        languages: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Try reading real code snippet if file exists on disk
    let codeSnippet = "";
    let fileName = job.repoUrl || "project";
    if (job.repoUrl && fs.existsSync(job.repoUrl)) {
      try {
        const raw = fs.readFileSync(job.repoUrl, "utf-8");
        codeSnippet = raw.slice(0, 3000);
        fileName = path.basename(job.repoUrl);
      } catch (_) {}
    }

    const systemPrompt = `You are a principal engineer conducting a live technical defense interview. Generate exactly 3 technical, penetrating defense questions tailored specifically to the candidate's code submission. Focus on architecture, trade-offs, and verification. Output ONLY valid JSON.`;
    
    const userPrompt = `Generate 3 defense interview questions for this code submission:
File / Target: ${fileName}
Input Type: ${job.inputType}
Problem Statement: ${job.problemStatement || "N/A"}
${codeSnippet ? `Code Snippet:\n\`\`\`\n${codeSnippet}\n\`\`\`` : ""}

Return ONLY this JSON array:
[
  {
    "id": "q1",
    "tag": "Architecture & Decisions",
    "question": "<Tailored question probing a specific design or architectural choice in this code>",
    "placeholder": "e.g. In this implementation, I chose this structure because..."
  },
  {
    "id": "q2",
    "tag": "Trade-offs & Resilience",
    "question": "<Tailored question probing an edge-case, performance constraint, or error handling trade-off>",
    "placeholder": "e.g. Under high concurrency or edge cases, the main trade-off here is..."
  },
  {
    "id": "q3",
    "tag": "Verification & Craft",
    "question": "<Tailored question probing how they validated their solution or what they would refactor first>",
    "placeholder": "e.g. If I had another iteration, the first part I would refactor is..."
  }
]`;

    let generatedQuestions: any[] | null = null;
    try {
      const client = getClient();
      const res = await client.chat.completions.create({
        model: "openai/gpt-oss-120b",
        max_tokens: 1024,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      const raw = res.choices[0]?.message?.content || "";
      let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "");
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        generatedQuestions = JSON.parse(match[0]);
      }
    } catch (e) {
      console.warn("Failed to generate dynamic questions via LLM, falling back to smart defaults:", e);
    }

    if (!Array.isArray(generatedQuestions) || generatedQuestions.length < 3) {
      generatedQuestions = [
        {
          id: "q1",
          tag: "Design Decisions",
          question: `What was the most challenging technical decision or architectural trade-off you made in ${fileName}?`,
          placeholder: "e.g. I chose this data structure/pattern because we prioritized throughput over memory...",
        },
        {
          id: "q2",
          tag: "Edge Cases & Resilience",
          question: `How does your implementation handle unexpected inputs, edge-cases, or failure modes in ${fileName}?`,
          placeholder: "e.g. If an invalid payload is passed, error boundaries catch it at line...",
        },
        {
          id: "q3",
          tag: "Self-Reflection & Craft",
          question: "If you had another sprint on this codebase, what is the first component you would refactor and why?",
          placeholder: "e.g. I would decouple the validation logic and add comprehensive unit tests...",
        },
      ];
    }

    questionsCache.set(jobId, generatedQuestions);
    return NextResponse.json({ questions: generatedQuestions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST: Evaluate answers and compute composite grades ───────────────────────
interface PitchAnswer {
  question: string;
  tag: string;
  answer: string;
}

const PitchEvalSchema = z.object({
  pitchScore: z.number().min(0).max(10),
  pitchGrade: z.string(),
  feedback: z.string(),
  questionEvals: z.array(z.object({
    tag: z.string(),
    score: z.number().min(0).max(10),
    comment: z.string(),
  })),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const body = await req.json();
    const answers: PitchAnswer[] = body.answers;

    if (!answers || answers.length === 0) {
      return NextResponse.json({ error: "answers array is required." }, { status: 400 });
    }

    // ── 1. Fetch the job and check for report (with polling if still running) ─
    let job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        report: {
          select: {
            id: true,
            overallScore: true,
            grade: true,
            summary: true,
            reportCard: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    // If report is still finishing in the worker pipeline, wait up to 25s
    let report = job.report;
    if (!report) {
      for (let i = 0; i < 25; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const check = await prisma.job.findUnique({
          where: { id: jobId },
          include: {
            report: {
              select: {
                id: true,
                overallScore: true,
                grade: true,
                summary: true,
                reportCard: true,
              },
            },
          },
        });
        if (check?.report) {
          report = check.report;
          job = check;
          break;
        }
      }
    }

    // ── 2. Context for evaluation ───────────────────────────────────────────
    let reportCardContext = "";
    if (report) {
      try {
        const rc = JSON.parse(report.reportCard || "{}");
        const categories = (rc.categoryScores || [])
          .slice(0, 5)
          .map((c: any) => `${c.category}: ${c.score?.toFixed(1)}/10 (${c.grade})`)
          .join(", ");
        reportCardContext = `Code analysis summary: ${report.summary}. Category scores: ${categories}. Overall code grade: ${report.grade} (${report.overallScore?.toFixed(1)}/10).`;
      } catch {
        reportCardContext = `Overall code grade: ${report.grade} (${report.overallScore?.toFixed(1)}/10).`;
      }
    } else {
      reportCardContext = `Target: ${job.repoUrl || 'codebase'}. Candidate defended their design decisions.`;
    }

    // ── 3. Build prompt ──────────────────────────────────────────────────────
    const answersBlock = answers
      .map((a, i) => `Question ${i + 1} [${a.tag}]:\n"${a.question}"\n\nCandidate Answer:\n"${a.answer || "(no answer provided)"}"`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are a senior engineering interviewer evaluating a candidate's verbal defense of their codebase. Be rigorous but fair. Score on technical depth, self-awareness, and communication clarity. Output ONLY valid JSON.`;

    const userPrompt = `You are evaluating a candidate's Developer Pitch answers about their codebase.

CODEBASE CONTEXT:
${reportCardContext}

CANDIDATE ANSWERS:
${answersBlock}

Scoring guide (0–10 scale):
- 0–4: Shallow, vague, or shows poor understanding of their own code
- 5–6: Basic awareness but lacks depth or specifics
- 7–8: Good technical understanding, clear communication, honest self-reflection
- 9–10: Exceptional — expert-level insight, precise trade-off analysis, strong engineering mentality

Evaluate each answer independently then compute an overall pitchScore (0–10 weighted average).

Return ONLY this exact JSON:
{
  "pitchScore": <number 0-10>,
  "pitchGrade": "<A+|A|A-|B+|B|B-|C+|C|C-|D|F>",
  "feedback": "<2-4 sentence holistic assessment of the candidate's self-awareness and technical communication>",
  "questionEvals": [
    {
      "tag": "<tag from the question>",
      "score": <number 0-10>,
      "comment": "<1 sentence specific feedback>"
    }
  ]
}`;

    // ── 4. Call LLM ──────────────────────────────────────────────────────────
    const client = getClient();
    const llmResponse = await client.chat.completions.create({
      model: "openai/gpt-oss-120b",
      max_tokens: 2048,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const rawText = llmResponse.choices[0]?.message?.content || "";
    let evaluation;
    try {
      evaluation = parseLLMJson(rawText, PitchEvalSchema);
    } catch {
      console.error("Pitch LLM parse failed:", rawText.substring(0, 500));
      return NextResponse.json({ error: "Failed to parse LLM evaluation." }, { status: 500 });
    }

    const pitchScore = evaluation.pitchScore;
    const pitchGrade = evaluation.pitchGrade || scoreToGrade(pitchScore);

    // If report is available, calculate composite and persist
    if (report) {
      const codeScore = report.overallScore;
      const compositeScore = parseFloat((codeScore * 0.65 + pitchScore * 0.35).toFixed(2));
      const compositeGrade = scoreToGrade(compositeScore);

      await prisma.report.update({
        where: { id: report.id },
        data: {
          pitchAnswers: JSON.stringify(answers),
          pitchScore,
          pitchGrade,
          pitchFeedback: evaluation.feedback,
          compositeScore,
          compositeGrade,
        },
      });

      return NextResponse.json({
        pitchScore,
        pitchGrade,
        feedback: evaluation.feedback,
        questionEvals: evaluation.questionEvals,
        codeScore,
        codeGrade: report.grade,
        compositeScore,
        compositeGrade,
      });
    }

    // In the edge case where pipeline is still crunching, return pitch evaluation
    return NextResponse.json({
      pitchScore,
      pitchGrade,
      feedback: evaluation.feedback,
      questionEvals: evaluation.questionEvals,
      codeScore: null,
      codeGrade: "Pending",
      compositeScore: null,
      compositeGrade: "Pending",
    });
  } catch (error: any) {
    console.error("Pitch evaluation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
