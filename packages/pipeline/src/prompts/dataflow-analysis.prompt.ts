import { z } from 'zod';
import type { CodeFile } from '@code-analyzer/shared';
import { SYSTEM_PROMPT } from './file-analysis.prompt';

export { SYSTEM_PROMPT };

export const DataFlowAnalysisSchema = z.object({
  traces: z.array(z.object({
    name: z.string(),
    type: z.enum(['request', 'event', 'data-transform', 'state-mutation']),
    steps: z.array(z.object({
      file: z.string(),
      function: z.string(),
      line: z.number(),
      description: z.string()
    }))
  })),
  stateManagement: z.string(),
  dataValidation: z.string(),
  summary: z.string()
});

export function generateDataFlowAnalysisPrompt(files: CodeFile[]): string {
  const codeContext = files.map(f => `<code_file path="${f.path}">\n${f.content}\n</code_file>`).join('\n\n');
  
  return `
Analyze the data flow and lifecycle of requests/events within the provided codebase.

<code_files>
${codeContext}
</code_files>

Trace at least 2 primary data flows (e.g., a user request from route to database, or an event from consumer to processor).
Evaluate how state is managed across the application.
Evaluate data validation boundaries (e.g., are inputs sanitized at the edge?).

Return a JSON objec\nIMPORTANT: You MUST return a JSON  containing the exact keys shown above. Do NOT wrap the JSON in any other keys. Do NOT change the capitalization (use exact camelCase).\n adhering exactly to this schema:
{
  "traces": [
    {
      "name": "string",
      "type": "request|event|data-transform|state-mutation",
      "steps": [
        { "file": "string", "function": "string", "line": 123, "description": "string" }
      ]
    }
  ],
  "stateManagement": "string",
  "dataValidation": "string",
  "summary": "string"
}
`;
}
