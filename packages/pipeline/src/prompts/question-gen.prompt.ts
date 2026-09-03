import { z } from 'zod';
import type { State } from '../state';
import { SYSTEM_PROMPT } from './file-analysis.prompt';

export { SYSTEM_PROMPT };

export const QuestionGenSchema = z.array(z.object({
  index: z.number().default(1),
  text: z.string().default("Question text not generated."),
  options: z.array(z.string()).default([]),
  category: z.string().default("general"),
  difficulty: z.string().default("medium"),
  relevantFiles: z.array(z.string()).default([]),
  codeContext: z.string().default(""),
  modelAnswer: z.string().default(""),
  rubric: z.object({
    keyPoints: z.array(z.string()).default([]),
    strongAnswer: z.string().default(""),
    commonMistakes: z.array(z.string()).default([]),
    maxScore: z.number().default(10)
  }).default({ keyPoints: [], strongAnswer: "", commonMistakes: [], maxScore: 10 })
})).default([]);

export function generateQuestionGenPrompt(state: State): string {
  const problemStatementBlock = state.options?.problemStatement
    ? `\n<problem_statement>\n${state.options.problemStatement}\n</problem_statement>\n\nThe questions MUST be grounded in what this problem required. Ask about decisions the candidate made in their solution relative to the problem's requirements.`
    : '';

  const context = `
Architecture Summary: ${state.architectureAnalysis?.summary}
Top Issues: ${state.qualityReview?.topIssues?.join(', ')}
Performance Bottlenecks: ${state.performanceReview?.bottlenecks?.join(', ')}
${problemStatementBlock}
  `;

  return `
Generate 2 targeted interview questions grounded in the candidate's codebase.
These questions are for judges to ask during live candidate Q&A rounds.

<context>
${context}
</context>

Generate 2 high-quality questions across various categories and difficulties.
CRITICAL INSTRUCTION: To fit within the 4000 token limit while maintaining premium quality:
- You MUST only generate exactly 2 questions. Do NOT generate a 3rd question under any circumstances. STOP after 2.
- Provide a detailed \`modelAnswer\` and a comprehensive \`rubric\` for each question.
- Keep the \`codeContext\` concise (under 3 lines) or omit it entirely if unnecessary.
- MULTIPLE CHOICE OPTIONS: You MUST generate exactly 4 options. The options should test the candidate's mentality. ALL 4 options should be technically "correct" or plausible approaches to the problem, but they should represent different trade-offs (e.g. one is the absolute most efficient/fastest, one is easy to use but slow, one is highly secure but complex). The \`modelAnswer\` must identify which option is the BEST and explain the trade-offs of the others.
Return a JSON arra\nIMPORTANT: You MUST return a JSON  containing the exact keys shown above. Do NOT wrap the JSON in any other keys. Do NOT change the capitalization (use exact camelCase).\n of objects adhering exactly to this schema:
  [
    {
      "index": 1,
      "text": "string",
      "options": ["string", "string", "string", "string"],
      "category": "architecture|design-patterns|security|performance|...",
      "difficulty": "easy|medium|hard|expert",
      "relevantFiles": ["string"],
      "codeContext": "string (optional)",
      "modelAnswer": "string (optional)",
      "rubric": {
        "keyPoints": ["string"],
        "strongAnswer": "string",
        "commonMistakes": ["string"],
        "maxScore": 10
      }
    }
  ]
`;
}
