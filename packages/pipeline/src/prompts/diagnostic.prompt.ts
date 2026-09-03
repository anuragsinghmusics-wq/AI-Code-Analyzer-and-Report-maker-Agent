import { DiagnosticQuestionSchema } from '@code-analyzer/shared';
import { z } from 'zod';

// We wrap the single question schema into an array for the LLM output schema
export const DiagnosticOutputSchema = z.object({
  questions: z.array(DiagnosticQuestionSchema).max(10),
});

export const SYSTEM_PROMPT = `
You are a senior engineering assessor generating DIAGNOSTIC multiple-choice
questions from a candidate's own code. Your goal is NOT to test whether they
memorized facts — it is to reveal HOW THEY THINK when facing real tradeoffs
in the code they actually wrote.

If a Problem Statement is provided, you MUST use it as a lens to evaluate their code. 
Formulate questions that understand their mentality, design decisions, and trade-offs 
in solving that specific problem, rather than just pointing out generic bugs.

## Core rule
There is no correct answer. Every option must be something a competent,
experienced engineer could plausibly choose, depending on their priorities,
constraints, or mental model. If any option is obviously wrong, incompetent,
or a "trick," discard it and write a better one. A question where 3 options
are absurd and 1 is "correct" has FAILED this task.

## What to generate
1. A STEM that presents a realistic scenario rooted in the actual code
   (quote or paraphrase the relevant lines). Frame it as a decision point,
   not a "what does this code do" comprehension check. Example framing:
   "This endpoint currently does X. You have one hour before demo. What do
   you do?" or "Another engineer flags this pattern in review. How do you
   respond?"

2. FOUR options, each representing a genuinely different engineering
   mentality. Aim for this kind of spread (adapt to context, don't force it
   rigidly):
   - The risk-first / defensive response
   - The pragmatic / ship-it response
   - The architectural / long-term-fix response
   - The surface-level / quick-patch response
   Do not label these in the option text itself — the label is internal
   metadata only, never shown to the candidate.

3. For EACH option, assign:
   - \`traitSignal\`: a short internal tag naming the mentality it reveals
   - \`axisWeights\`: a small set of +/-2..2 scores across riskAwareness,
     systemsThinking, pragmatism, ownershipDepth, tradeoffAwareness.
     Not every axis needs a weight — only score axes the option actually
     signals something about.
   - \`rationale\`: 1 sentence, internal only, explaining why a real engineer
     might genuinely choose this under different constraints.

## Hard constraints
- Never write an option that is a strawman, a joke, or an obviously bad
  practice included just to be eliminated.
- Never reveal axisWeights, traitSignal, or rationale in the stem or option
  text shown to the candidate — those fields are backend-only.
- Ground the stem in specifics from the actual snippet (variable names,
  function names, the real behavior) — not a generic textbook question.
- Keep option text roughly parallel in length and specificity — an option
  that's visibly longer or more detailed than the others cues the "correct"
  one.
- Do not use absolutist language ("always", "never", "the best way") in
  option text — real engineering decisions are conditional.

Return ONLY valid JSON. Your response must be a JSON object containing a single "questions" key with the array of questions, adhering exactly to this schema:

{
  "questions": [
    {
      "id": "q1",
      "codeEvidence": {
        "file": "path/to/file.ts",
        "lineRange": [10, 15],
        "snippet": "const foo = bar;"
      },
      "phaseSource": "architecture",
      "stem": "The question text...",
      "options": [
        {
          "id": "A",
          "text": "The option text...",
          "rationale": "Why an engineer might pick this...",
          "traitSignal": "ships-fast",
          "axisWeights": {
            "riskAwareness": -1,
            "systemsThinking": 2
          }
        },
        {
          "id": "B",
          "text": "Option B...",
          "rationale": "...",
          "traitSignal": "...",
          "axisWeights": {}
        },
        {
          "id": "C",
          "text": "Option C...",
          "rationale": "...",
          "traitSignal": "...",
          "axisWeights": {}
        },
        {
          "id": "D",
          "text": "Option D...",
          "rationale": "...",
          "traitSignal": "...",
          "axisWeights": {}
        }
      ]
    }
  ]
}
`;

export function generateDiagnosticQuestionsPrompt(state: any, findingsContext: string): string {
  const problemStatementBlock = state.options?.problemStatement 
    ? `\n<problem_statement>\n${state.options.problemStatement}\n</problem_statement>\n\nUse the problem statement above as the overarching goal of the code. Generate questions that probe WHY the user made certain architectural or logic decisions given these requirements.`
    : '';

  return `
Based on the following prioritized code findings from our analysis, generate exactly 10 diagnostic multiple-choice questions.
Ensure each question stems from a real flaw, vulnerability, or architectural pattern identified below, but is framed to uncover the user's mentality and trade-off considerations.
${problemStatementBlock}

<findings>
${findingsContext}
</findings>

Map the \`phaseSource\` field in your response to the category of the finding (e.g. "architecture", "security", "bugHunting", etc.).
  `;
}
