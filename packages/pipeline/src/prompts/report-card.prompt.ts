import { z } from 'zod';
import type { State } from '../state';
import { SYSTEM_PROMPT } from './file-analysis.prompt';

export { SYSTEM_PROMPT };

// ── Shared grade enum ──────────────────────────────────────────────────────
const GradeEnum = z.enum(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']).default('F');

// ── Schema for Call 1: category scores only ────────────────────────────────
export const CategoryScoresSchema = z.array(z.object({
  category: z.string().default('General'),
  score: z.number().min(0).max(10).default(0),
  weight: z.number().default(1),
  grade: GradeEnum,
  analysis: z.string().default('No analysis provided'),
  improvement: z.string().default('No improvements provided'),
  scoreReasoning: z.string().default('Score assigned based on automated phase findings.'),
}));

// ── Schema for Call 2: summary + overall ──────────────────────────────────
export const SummarySchema = z.object({
  overallScore: z.number().min(0).max(10).default(0),
  overallGrade: GradeEnum,
  summary: z.string().default('No summary generated'),
  improvements: z.array(z.object({
    title: z.string().default('Improvement'),
    description: z.string().default('Description missing'),
    category: z.string().default('General'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
    effort: z.enum(['low', 'medium', 'high']).default('low'),
    impact: z.enum(['low', 'medium', 'high']).default('low'),
  })).default([]),
});

// ── Full merged schema (unchanged — database & UI still work the same) ─────
export const ReportCardSchema = z.object({
  overallScore: z.number().min(0).max(10).default(0),
  overallGrade: GradeEnum,
  categoryScores: z.array(z.object({
    category: z.string().default('General'),
    score: z.number().min(0).max(10).default(0),
    weight: z.number().default(1),
    grade: GradeEnum,
    analysis: z.string().default('No analysis provided'),
    improvement: z.string().default('No improvements provided'),
    scoreReasoning: z.string().default('Score assigned based on automated phase findings.'),
  })).default([]),
  improvements: z.array(z.object({
    title: z.string().default('Improvement'),
    description: z.string().default('Description missing'),
    category: z.string().default('General'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
    effort: z.enum(['low', 'medium', 'high']).default('low'),
    impact: z.enum(['low', 'medium', 'high']).default('low'),
  })).default([]),
  summary: z.string().default('No summary generated'),
  filesAnalyzed: z.number().default(0),
  linesOfCode: z.number().default(0),
  languagesDetected: z.array(z.string()).default([]),
});

// ── System prompts ─────────────────────────────────────────────────────────

export const CATEGORY_SCORES_SYSTEM_PROMPT = `
You are a senior engineering judge scoring a codebase across specific dimensions.
CRITICAL: Output ONLY a raw JSON array. No markdown, no code fences, no explanation.
Keep each "analysis", "improvement", and "scoreReasoning" to 1-2 sentences maximum.
Grade each category RELATIVE TO THE PROBLEM STATEMENT if one is provided.
Be fair: a working solution should score a C (5-6). Reserve F only for broken/empty submissions.
`.trim();

export const SUMMARY_SYSTEM_PROMPT = `
You are a senior engineering judge writing the final verdict for a code analysis.
CRITICAL: Output ONLY a raw JSON object. No markdown, no code fences, no explanation.
The "summary" field must be a comprehensive 8-12 sentence authentic narrative explaining exactly WHY the code scored this way.
Limit "improvements" to exactly 3 items.
`.trim();

// ── Shared context builder ─────────────────────────────────────────────────

function buildContextBlock(state: State): string {
  const arch = state.architectureAnalysis;
  const quality = state.qualityReview;
  const bugs = state.bugReport;
  const perf = state.performanceReview;
  const flow = state.dataFlowAnalysis;
  const logic = state.logicReview;
  const design = state.designReview;
  const ai = state.aiAgentReview;

  const problemBlock = state.options?.problemStatement
    ? `=== PROBLEM STATEMENT (Primary Grading Lens) ===\n${state.options.problemStatement.substring(0, 1500)}\nGrade PRIMARILY on how well the code solves the above.`
    : `=== NO PROBLEM STATEMENT ===\nGrade on general software quality principles.`;

  return `
${problemBlock}

=== ARCHITECTURE ===
${arch?.summary || 'No data'}
Patterns: ${(arch?.detectedPatterns || []).join(', ') || 'none'}
Violations: ${(arch?.layering?.violations || []).slice(0, 3).join('; ') || 'none'}
Recommendations: ${(arch?.recommendations || []).slice(0, 3).join('; ') || 'none'}

=== CODE QUALITY ===
Score: ${quality?.overallScore ?? 'N/A'}
Issues: ${(quality?.topIssues || []).slice(0, 5).join('; ') || 'none'}
Strengths: ${(quality?.topStrengths || []).slice(0, 3).join('; ') || 'none'}

=== BUGS & SECURITY ===
Bugs found: ${bugs?.bugs?.length ?? 0}, Vulnerabilities: ${bugs?.vulnerabilityCount ?? 0}, Antipatterns: ${bugs?.antipatternCount ?? 0}
Top bugs: ${(bugs?.bugs || []).slice(0, 3).map((b: any) => `[${b.severity}] ${b.title}`).join('; ') || 'none'}

=== PERFORMANCE ===
${perf?.summary || 'No data'}
Bottlenecks: ${(perf?.bottlenecks || []).slice(0, 3).join('; ') || 'none'}

=== DATA FLOW ===
${flow?.summary || 'No data'}
State mgmt: ${flow?.stateManagement || 'N/A'} | Validation: ${flow?.dataValidation || 'N/A'}

=== LOGIC & CONCURRENCY ===
${logic?.summary || 'No data'}
Complexity: ${logic?.algorithmComplexity || 'N/A'}
Auth flaws: ${(logic?.authFlaws || []).slice(0, 2).join('; ') || 'none'}

=== DESIGN & SOLID ===
${design?.summary || 'No data'}
Abstraction: ${design?.abstractionLevel || 'N/A'}

=== AI/ML ===
Is AI project: ${ai?.isAIProject ? 'Yes' : 'No'} | ${ai?.summary || 'N/A'}
Frameworks: ${(ai?.frameworksDetected || []).join(', ') || 'none'}

=== STATS ===
Files: ${state.files.length} | LOC: ${state.files.reduce((acc, f) => acc + f.lineCount, 0)} | Languages: ${Array.from(new Set(state.files.map(f => f.language))).join(', ')}
`.trim();
}

// ── Call 1: generate all 10 category scores ────────────────────────────────

export function generateCategoryScoresPrompt(state: State): string {
  const context = buildContextBlock(state);
  return `
Score EXACTLY 10 categories for this codebase based on the analysis context below.

<context>
${context}
</context>

Categories to score (score all 10, no more, no less):
Architecture, Security, Performance, Maintainability, Scalability, ErrorHandling, CodeQuality, Readability, Testing, Documentation.

Return ONLY a raw JSON array (no markdown, no code block):
[
  {
    "category": "Architecture",
    "score": 6.5,
    "weight": 1.0,
    "grade": "C+",
    "analysis": "1-2 sentence evaluation of this category.",
    "improvement": "1 sentence top recommendation for this category.",
    "scoreReasoning": "1 sentence justification for the score given."
  }
]
`.trim();
}

// ── Call 2: generate overall + summary + improvements ─────────────────────

export function generateSummaryPrompt(state: State, categoryScores: any[]): string {
  const problemBlock = state.options?.problemStatement
    ? `Problem Statement: ${state.options.problemStatement.substring(0, 600)}`
    : `No problem statement provided. Graded on general software quality.`;

  const scoresLine = categoryScores
    .map((c: any) => `${c.category}: ${c.score}/10 (${c.grade})`)
    .join(', ');

  return `
You are writing the final verdict for a code analysis. The category scores are already computed.

${problemBlock}

Category Scores: ${scoresLine}

Based on these scores:
1. Compute a weighted overallScore (0-10) and overallGrade
2. Write a comprehensive 8-12 sentence summary explaining exactly WHY this code scored this way, referencing specific category results
3. List exactly 3 top-priority improvements

Return ONLY a raw JSON object (no markdown, no code block):
{
  "overallScore": 7.2,
  "overallGrade": "C",
  "summary": "8-12 sentence comprehensive narrative here...",
  "improvements": [
    {
      "title": "Improvement title",
      "description": "2-3 sentence description of what to do and why it matters.",
      "category": "Architecture",
      "priority": "high",
      "effort": "medium",
      "impact": "high"
    }
  ]
}
`.trim();
}

// Keep backward compat export (not used by the new node but safe to keep)
export function generateReportCardPrompt(state: State): string {
  return generateCategoryScoresPrompt(state);
}
