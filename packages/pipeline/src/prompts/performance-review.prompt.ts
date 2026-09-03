import { z } from 'zod';
import type { CodeFile } from '@code-analyzer/shared';
import { SYSTEM_PROMPT } from './file-analysis.prompt';

export { SYSTEM_PROMPT };

export const PerformanceReviewSchema = z.object({
  issues: z.array(z.object({
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    file: z.string(),
    line: z.number().optional(),
    category: z.enum(['complexity', 'memory', 'io', 'rendering', 'bundle-size']),
    impact: z.string(),
    suggestion: z.string()
  })),
  bottlenecks: z.array(z.string()),
  complexityHotspots: z.array(z.object({
    file: z.string(),
    function: z.string(),
    complexity: z.string()
  })),
  summary: z.string()
});

export function generatePerformanceReviewPrompt(files: CodeFile[]): string {
  const codeContext = files.map(f => `<code_file path="${f.path}">\n${f.content}\n</code_file>`).join('\n\n');
  
  return `
Perform a static performance review of the following codebase.

<code_files>
${codeContext}
</code_files>

Identify static bottlenecks, O(n²) algorithms, N+1 queries, unnecessary re-renders, and memory overhead.

Return a JSON objec\nIMPORTANT: You MUST return a JSON  containing the exact keys shown above. Do NOT wrap the JSON in any other keys. Do NOT change the capitalization (use exact camelCase).\n adhering exactly to this schema:
{
  "issues": [
    {
      "description": "string",
      "severity": "low|medium|high|critical",
      "file": "string",
      "line": 123,
      "category": "complexity|memory|io|rendering|bundle-size",
      "impact": "string",
      "suggestion": "string"
    }
  ],
  "bottlenecks": ["string"],
  "complexityHotspots": [
    { "file": "string", "function": "string", "complexity": "string (e.g. O(N^2))" }
  ],
  "summary": "string"
}
`;
}
