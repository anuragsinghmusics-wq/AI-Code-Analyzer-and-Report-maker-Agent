import { z } from 'zod';
import type { CodeFile, FileAnalysis } from '@code-analyzer/shared';
import { SYSTEM_PROMPT } from './file-analysis.prompt';

export { SYSTEM_PROMPT };

export const ArchitectureAnalysisSchema = z.object({
  detectedPatterns: z.array(z.object({
    pattern: z.string(),
    confidence: z.number(),
    description: z.string()
  })).default([]),
  layering: z.object({
    layers: z.array(z.string()).default([]),
    violations: z.array(z.string()).default([])
  }).default({ layers: [], violations: [] }),
  entryPoints: z.array(z.string()).default([]),
  summary: z.string().default("No architecture summary provided"),
  recommendations: z.array(z.string()).default([])
});

export function generateArchitectureAnalysisPrompt(files: CodeFile[], fileAnalyses: FileAnalysis[]): string {
  const codeContext = files.map(f => `<code_file path="${f.path}">\n${f.content}\n</code_file>`).join('\n\n');
  const analysisContext = fileAnalyses.map(a => `<file_analysis path="${a.filePath}">\nPurpose: ${a.purpose}\nDependencies: ${a.dependencies.join(', ')}\n</file_analysis>`).join('\n\n');
  
  return `
Analyze the architecture of the provided codebase.

<context>
${analysisContext}
</context>

<code_files>
${codeContext}
</code_files>

Identify primary architectural patterns (e.g., MVC, Microservices, Event-Driven, Clean Architecture, Hexagonal, LangGraph, Multi-Agent, RAG).
Determine layering and identify any layering violations (e.g., UI layer directly querying the database).
List the true entry points of the application.
Provide a high-level summary and actionable architectural recommendations.

Return a JSON objec\nIMPORTANT: You MUST return a JSON  containing the exact keys shown above. Do NOT wrap the JSON in any other keys. Do NOT change the capitalization (use exact camelCase).\n adhering exactly to this schema:
{
  "detectedPatterns": [
    { "pattern": "string", "confidence": 0.9, "description": "string" }
  ],
  "layering": {
    "layers": ["string"],
    "violations": ["string"]
  },
  "entryPoints": ["string"],
  "summary": "string",
  "recommendations": ["string"]
}
`;
}
