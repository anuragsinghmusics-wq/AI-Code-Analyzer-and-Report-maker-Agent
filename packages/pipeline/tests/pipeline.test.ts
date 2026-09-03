import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analysisPipeline } from '../src/index';
import type { State } from '../src/state';
import * as llmUtils from '../src/utils/llm';

describe('LangGraph Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes the first 4 phases correctly', async () => {
    // Mock LLM to return valid analysis
    vi.spyOn(llmUtils, 'callLLM').mockResolvedValue(JSON.stringify([{
      fileId: 'file-123',
      filePath: 'src/main.ts',
      purpose: 'test',
      responsibilities: [],
      publicAPI: [],
      dependencies: ['./utils'],
      issues: [],
      complexity: 'low',
      complexityReason: 'simple'
    }]));
    const initialState: Partial<State> = {
      jobId: 'test-job-123',
      userId: 'user-1',
      inputType: 'file',
      options: { skipAIReview: true },
      files: [{
        id: 'file-123',
        path: 'src/main.ts',
        content: `
          import { helper } from './utils';
          export class MainController {
            handle() {
              return helper();
            }
          }
        `,
        language: 'typescript',
        lineCount: 8,
        sizeBytes: 150,
        isEntryPoint: true
      }],
      completedPhases: [],
      errors: [],
      streamEmit: (event) => {
        // Just to verify it's callable
        expect(event).toBeDefined();
      }
    };

    const finalState = await analysisPipeline.invoke(initialState) as State;
    
    // Check completed phases
    expect(finalState.completedPhases).toContain('ingest');
    expect(finalState.completedPhases).toContain('parse');
    expect(finalState.completedPhases).toContain('dependency-graph');
    expect(finalState.completedPhases).toContain('file-analysis');
    expect(finalState.completedPhases).toContain('report-card'); // Since the rest are no-ops

    // Check parsedASTs
    expect(finalState.parsedASTs.length).toBe(1);
    expect(finalState.parsedASTs[0].fileId).toBe('file-123');
    expect(finalState.parsedASTs[0].classes.length).toBe(1);
    expect(finalState.parsedASTs[0].classes[0].name).toBe('MainController');
    expect(finalState.parsedASTs[0].imports.length).toBe(1);
    expect(finalState.parsedASTs[0].imports[0].source).toBe('./utils');

    // Check dependency graph
    expect(finalState.dependencyGraph).toBeDefined();
    expect(finalState.dependencyGraph.edges.length).toBe(1);
    expect(finalState.dependencyGraph.edges[0].to).toBe('./utils');
    expect(finalState.dependencyGraph.entryPoints).toContain('src/main.ts');

    // Check file analysis
    expect(finalState.fileAnalyses).toBeDefined();
    expect(finalState.fileAnalyses.length).toBe(1);
    expect(finalState.fileAnalyses[0].fileId).toBe('file-123');
  });
});
