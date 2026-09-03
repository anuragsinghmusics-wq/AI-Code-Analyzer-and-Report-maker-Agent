import { z } from 'zod';
import type { CodeFile } from '@code-analyzer/shared';

export const SYSTEM_PROMPT = `
You are an uncompromising senior software architect and principal production security engineer with 15 years of experience.
You are performing a rigorous, highly critical technical evaluation for an enterprise codebase.
- You analyze code precisely, ground every critique in specific code evidence (files, methods, variables), and never make generic statements.
CRITICAL INSTRUCTION: You MUST prioritize high-impact quality while staying concise to avoid token limits. For any arrays or lists (e.g. issues, bugs, bottlenecks), return ONLY the top 3 most critical items. Do not exceed 3 items per list. Limit descriptions and explanations to at most 2 concise sentences. The final JSON MUST NOT exceed 2500 tokens.
When asked to return JSON, return ONLY valid JSON with no markdown, no explanation, and no code fences.
`;

export const FileAnalysisSchema = z.array(z.object({
  fileId: z.string().default(""),
  filePath: z.string().default(""),
  purpose: z.string().default("No purpose provided"),
  responsibilities: z.array(z.string()).default([]),
  publicAPI: z.array(z.object({
    name: z.string(),
    signature: z.string(),
    description: z.string()
  })).default([]),
  dependencies: z.array(z.string()).default([]),
  issues: z.array(z.object({
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    line: z.number().optional()
  })).default([]),
  complexity: z.enum(['low', 'medium', 'high']).default('medium'),
  complexityReason: z.string().default("No reason provided")
}));

export function generateFileAnalysisPrompt(files: CodeFile[]): string {
  const codeBlocks = files.map(f => `<code_file path="${f.path}" id="${f.id}">\n${f.content}\n</code_file>`).join('\n\n');
  
  return `
Analyze the following batch of code files.

${codeBlocks}

For each file, determine:
1. Its primary purpose in the system.
2. Its core responsibilities (bullet points).
3. Any public APIs exported (functions, classes, or endpoints).
4. Its key dependencies (external or internal).
5. Any immediate code issues, bugs, or anti-patterns.
6. A subjective complexity rating (low, medium, high) and a short reason why.

Return a JSON array of objects, one for each file, adhering exactly to this schema:
[
  {
    "fileId": "string (the exact id from the <code_file> tag)",
    "filePath": "string",
    "purpose": "string",
    "responsibilities": ["string"],
    "publicAPI": [
      { "name": "string", "signature": "string", "description": "string" }
    ],
    "dependencies": ["string"],
    "issues": [
      { "description": "string", "severity": "low|medium|high|critical", "line": 123 }
    ],
    "complexity": "low|medium|high",
    "complexityReason": "string"
  }
]

CRITICAL: Do NOT just return a list of issues! You MUST return the FULL object for EACH file, including its "fileId", "filePath", "purpose", "responsibilities", "publicAPI", and "dependencies".
CRITICAL: The root of your response MUST be a JSON array \`[...]\`. Do NOT wrap the array in a JSON object.
`;
}
