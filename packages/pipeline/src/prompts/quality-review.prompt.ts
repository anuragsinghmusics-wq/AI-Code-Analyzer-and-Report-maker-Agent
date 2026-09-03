import { z } from 'zod';
import type { CodeFile } from '@code-analyzer/shared';
import { SYSTEM_PROMPT } from './file-analysis.prompt';

export { SYSTEM_PROMPT };

export const QualityReviewSchema = z.object({
  dimensions: z.record(z.object({
    score: z.number().min(0).max(10),
    analysis: z.string()
  })),
  overallScore: z.number().min(0).max(10),
  summary: z.string(),
  topIssues: z.array(z.string()),
  topStrengths: z.array(z.string())
});

export function generateQualityReviewPrompt(files: CodeFile[]): string {
  const codeContext = files.map(f => `<code_file path="${f.path}">\n${f.content}\n</code_file>`).join('\n\n');
  
  return `
Perform a code quality review of the following codebase.

<code_files>
${codeContext}
</code_files>

Score the code rigorously from 0.0 to 10.0 on the following 11 dimensions:
1. Architecture (modularity, separation of concerns, pattern adherence)
2. Security (input sanitization, vulnerability prevention, secure practices)
3. Performance (algorithmic efficiency, resource minimization, bottleneck avoidance)
4. Maintainability (clean code, clean dependencies, reusability)
5. Scalability (handling growth, async patterns, statelessness)
6. ErrorHandling (try/catch precision, failure recovery, meaningful error propagation)
7. CodeQuality (lint compliance, strong typing, best practice conformance)
8. Readability (clear naming, straightforward logic, cognitive ease)
9. Testing (testability, separation of side effects, verifiable behavior)
10. Documentation (code clarity, self-documenting interfaces)

STRICT EVALUATION CRITERIA:
- 9.0 - 10.0: Exemplary production quality with zero notable flaws.
- 7.0 - 8.9: Solid implementation with minor technical debt.
- 5.0 - 6.9: Average prototype code; lacks robust error handling, security hardening, or production tests.
- 0.0 - 4.9: Flawed, fragile, unvalidated, or unmaintainable code.

For each dimension, provide a brief 1-2 sentence hard-hitting critique grounding your score in specific code evidence. 
Calculate a realistic overall score (0.0-10.0), write a candid executive summary, and list top critical issues and strengths.

Return a JSON objec\nIMPORTANT: You MUST return a JSON  containing the exact keys shown above. Do NOT wrap the JSON in any other keys. Do NOT change the capitalization (use exact camelCase).\n adhering exactly to this schema:
{
  "dimensions": {
    "Architecture": { "score": 8, "analysis": "string" },
    "Security": { ... },
    // ... all 10 dimensions listed above
  },
  "overallScore": 8.5,
  "summary": "string",
  "topIssues": ["string"],
  "topStrengths": ["string"]
}
`;
}
