// apps/web/app/api/evaluate-interview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@code-analyzer/db";
import OpenAI from "openai";
import { z } from "zod";

interface SubmittedAnswer {
  questionId: string;
  questionText: string;
  selectedOption: string;
  selectedIndex: number;
  options: string[];
}

const QuestionEvaluationSchema = z.object({
  questionId: z.string(),
  isCorrect: z.boolean(),
  correctAnswer: z.string(),
  explanation: z.string(),
});

const EvaluationResponseSchema = z.object({
  interviewScore: z.number().min(0).max(100),
  feedbackSummary: z.string(),
  evaluations: z.array(QuestionEvaluationSchema),
});

function getClient(): OpenAI {
  const groqKey = process.env.GROQ_API_KEY || "";
  if (groqKey) {
    return new OpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: groqKey.split(",")[0].trim(),
    });
  }
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "",
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
  const jsonStr =
    startIdx !== -1 && endIdx !== -1
      ? cleaned.substring(startIdx, endIdx + 1)
      : cleaned;
  const parsed = JSON.parse(jsonStr);
  return schema.parse(parsed);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportId, submittedAnswers } = body as {
      reportId: string;
      submittedAnswers: SubmittedAnswer[];
    };

    if (!reportId || !submittedAnswers || submittedAnswers.length === 0) {
      return NextResponse.json(
        { error: "reportId and submittedAnswers are required." },
        { status: 400 }
      );
    }

    const answersContext = submittedAnswers
      .map((ans, i) => {
        const optionsText = ans.options
          .map((opt, idx) => `  ${String.fromCharCode(65 + idx)}. ${opt}`)
          .join("\n");
        return `Question ${i + 1} (ID: ${ans.questionId}): ${ans.questionText}\nOptions:\n${optionsText}\nCandidate Answer: ${String.fromCharCode(65 + ans.selectedIndex)}. ${ans.selectedOption}`;
      })
      .join("\n\n---\n\n");

    const systemPrompt = `You are a strict senior engineering hiring manager evaluating a technical interview.
Assess the candidate's understanding of their own code based on their MCQ answers.
Output ONLY valid JSON. No text outside the JSON.`;

    const userPrompt = `Evaluate these ${submittedAnswers.length} technical interview answers. These questions were generated from the candidate's own code.

${answersContext}

Scoring guide:
- 0-40: Poor understanding of their own code
- 41-60: Basic understanding but significant gaps
- 61-75: Moderate understanding with some gaps
- 76-90: Strong understanding with minor gaps
- 91-100: Exceptional — clear expert level

CRITICAL REQUIREMENT:
You MUST return an evaluation for EVERY single question provided. There are exactly ${submittedAnswers.length} questions. Your "evaluations" array MUST contain exactly ${submittedAnswers.length} objects, matching the exact "questionId" of each question. Do not skip any question.

Return ONLY this exact JSON:
{
  "interviewScore": <number 0-100>,
  "feedbackSummary": "<3-5 sentence candidate assessment>",
  "evaluations": [
    {
      "questionId": "<id>",
      "isCorrect": <true|false>,
      "correctAnswer": "<full text of the correct option>",
      "explanation": "<1-2 sentence explanation>"
    }
  ]
}`;

    const client = getClient();
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 4096,
      temperature: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const rawText = response.choices[0]?.message?.content || "";
    let evaluation;
    try {
      evaluation = parseLLMJson(rawText, EvaluationResponseSchema);
    } catch {
      console.error("LLM parse failed:", rawText.substring(0, 500));
      return NextResponse.json(
        { error: "Failed to parse LLM evaluation." },
        { status: 500 }
      );
    }

    const attempt = await prisma.interviewAttempt.create({
      data: {
        reportId,
        submittedAnswers: JSON.stringify(submittedAnswers),
        interviewScore: evaluation.interviewScore,
        feedbackSummary: evaluation.feedbackSummary,
        evaluationResult: JSON.stringify(evaluation.evaluations),
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      interviewScore: evaluation.interviewScore,
      feedbackSummary: evaluation.feedbackSummary,
      evaluations: evaluation.evaluations,
    });
  } catch (error: any) {
    console.error("Interview evaluation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
