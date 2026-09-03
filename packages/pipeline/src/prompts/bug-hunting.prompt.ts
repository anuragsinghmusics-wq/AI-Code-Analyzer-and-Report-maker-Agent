import { z } from 'zod';
import type { CodeFile } from '@code-analyzer/shared';
import { SYSTEM_PROMPT } from './file-analysis.prompt';

export { SYSTEM_PROMPT };

export const BugReportSchema = z.object({
  bugs: z.array(z.object({
    title: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    category: z.enum(['vulnerability', 'antipattern', 'logic-error', 'runtime-risk']),
    file: z.string(),
    line: z.number().optional(),
    codeSnippet: z.string().optional(),
    fix: z.string()
  })),
  vulnerabilityCount: z.number(),
  antipatternCount: z.number(),
  summary: z.string()
});

export function generateBugHuntingPrompt(files: CodeFile[]): string {
  const codeContext = files.map(f => `<code_file path="${f.path}">\n${f.content}\n</code_file>`).join('\n\n');
  
  return `
Perform a bug hunt and security review of the following codebase.

<code_files>
${codeContext}
</code_files>

Detect vulnerabilities, null pointer risks, memory leaks, SQL injection, prompt injection, hardcoded secrets, and logic errors.

Return a JSON objec\nIMPORTANT: You MUST return a JSON  containing the exact keys shown above. Do NOT wrap the JSON in any other keys. Do NOT change the capitalization (use exact camelCase).\n adhering exactly to this schema:
{
  "bugs": [
    {
      "title": "string",
      "description": "string",
      "severity": "low|medium|high|critical",
      "category": "vulnerability|antipattern|logic-error|runtime-risk",
      "file": "string",
      "line": 123,
      "codeSnippet": "string (optional)",
      "fix": "string"
    }
  ],
  "vulnerabilityCount": 0,
  "antipatternCount": 0,
  "summary": "string"
}
`;
}
