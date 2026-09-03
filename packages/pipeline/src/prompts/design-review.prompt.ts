import { z } from 'zod';
import type { CodeFile } from '@code-analyzer/shared';
import { SYSTEM_PROMPT } from './file-analysis.prompt';

export { SYSTEM_PROMPT };

export const DesignReviewSchema = z.object({
  issues: z.array(z.object({
    type: z.enum(['over-engineering', 'under-engineering']),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    file: z.string(),
    suggestion: z.string()
  })),
  abstractionLevel: z.enum(['appropriate', 'over-abstracted', 'under-abstracted']),
  solidPrinciples: z.record(z.object({
    score: z.number().min(0).max(10),
    notes: z.string()
  })),
  summary: z.string()
});

export function generateDesignReviewPrompt(files: CodeFile[]): string {
  const codeContext = files.map(f => `<code_file path="${f.path}">\n${f.content}\n</code_file>`).join('\n\n');
  
  return `
Perform a software design review of the following codebase.

<code_files>
${codeContext}
</code_files>

Evaluate engineering balance (over/under engineering), abstraction quality, and adherence to SOLID principles.

Return a JSON objec\nIMPORTANT: You MUST return a JSON  containing the exact keys shown above. Do NOT wrap the JSON in any other keys. Do NOT change the capitalization (use exact camelCase).\n adhering exactly to this schema:
{
  "issues": [
    {
      "type": "over-engineering|under-engineering",
      "description": "string",
      "severity": "low|medium|high|critical",
      "file": "string",
      "suggestion": "string"
    }
  ],
  "abstractionLevel": "appropriate|over-abstracted|under-abstracted",
  "solidPrinciples": {
    "SingleResponsibility": { "score": 8, "notes": "string" },
    "OpenClosed": { "score": 7, "notes": "string" },
    "LiskovSubstitution": { "score": 9, "notes": "string" },
    "InterfaceSegregation": { "score": 8, "notes": "string" },
    "DependencyInversion": { "score": 6, "notes": "string" }
  },
  "summary": "string"
}
`;
}
