import { z } from 'zod';
import type { CodeFile } from '@code-analyzer/shared';
import { SYSTEM_PROMPT } from './file-analysis.prompt';

export { SYSTEM_PROMPT };

export const AIAgentReviewSchema = z.object({
  isAIProject: z.boolean(),
  findings: z.array(z.object({
    category: z.enum(['langgraph', 'rag', 'tool-use', 'memory', 'prompt-engineering']),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    file: z.string(),
    suggestion: z.string()
  })),
  frameworksDetected: z.array(z.string()),
  summary: z.string()
});

export function generateAIAgentReviewPrompt(files: CodeFile[]): string {
  const codeContext = files.map(f => `<code_file path="${f.path}">\n${f.content}\n</code_file>`).join('\n\n');
  
  return `
Perform a specialized AI/Agentic code review of the following codebase.

<code_files>
${codeContext}
</code_files>

Identify AI frameworks (e.g. LangChain, LangGraph, LlamaIndex, OpenAI SDK).
Evaluate prompt engineering quality, tool calling safety, memory management, and agent routing logic.

Return a JSON objec\nIMPORTANT: You MUST return a JSON  containing the exact keys shown above. Do NOT wrap the JSON in any other keys. Do NOT change the capitalization (use exact camelCase).\n adhering exactly to this schema:
{
  "isAIProject": true,
  "findings": [
    {
      "category": "langgraph|rag|tool-use|memory|prompt-engineering",
      "description": "string",
      "severity": "low|medium|high|critical",
      "file": "string",
      "suggestion": "string"
    }
  ],
  "frameworksDetected": ["string"],
  "summary": "string"
}
`;
}
