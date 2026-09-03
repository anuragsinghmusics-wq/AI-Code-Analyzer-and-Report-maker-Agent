import { z } from 'zod';
import type { CodeFile } from '@code-analyzer/shared';
import { SYSTEM_PROMPT } from './file-analysis.prompt';

export { SYSTEM_PROMPT };

export const LogicReviewSchema = z.object({
  findings: z.array(z.object({
    category: z.enum(['algorithm', 'auth', 'concurrency', 'boundary', 'state']),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    file: z.string(),
    line: z.number().optional(),
    suggestion: z.string()
  })),
  algorithmComplexity: z.string(),
  concurrencyIssues: z.array(z.string()),
  authFlaws: z.array(z.string()),
  summary: z.string()
});

export function generateLogicReviewPrompt(files: CodeFile[]): string {
  const codeContext = files.map(f => `<code_file path="${f.path}">\n${f.content}\n</code_file>`).join('\n\n');
  
  return `
Perform a deep logic review of the following codebase.

<code_files>
${codeContext}
</code_files>

Focus on:
1. Algorithm correctness and complexity.
2. Concurrency risks (race conditions, async flaws).
3. Boundary edge cases (off-by-one, null handling, unchecked bounds).
4. Authorization flaws (missing checks, broken access control).
5. State inconsistencies.

Return a JSON objec\nIMPORTANT: You MUST return a JSON  containing the exact keys shown above. Do NOT wrap the JSON in any other keys. Do NOT change the capitalization (use exact camelCase).\n adhering exactly to this schema:
{
  "findings": [
    {
      "category": "algorithm|auth|concurrency|boundary|state",
      "description": "string",
      "severity": "low|medium|high|critical",
      "file": "string",
      "line": 123,
      "suggestion": "string"
    }
  ],
  "algorithmComplexity": "string",
  "concurrencyIssues": ["string"],
  "authFlaws": ["string"],
  "summary": "string"
}
`;
}
