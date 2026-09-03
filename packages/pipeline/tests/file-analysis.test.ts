import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileAnalysisNode } from '../src/nodes/file-analysis.node';
import type { State } from '../src/state';
import * as llmUtils from '../src/utils/llm';

describe('File Analysis Node (Phase 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('batches files and parses LLM response correctly', async () => {
    // Mock the LLM call
    const callLLMMock = vi.spyOn(llmUtils, 'callLLM').mockResolvedValue(JSON.stringify([
      {
        fileId: 'f1',
        filePath: 'src/a.ts',
        purpose: 'purpose A',
        responsibilities: ['resp1'],
        publicAPI: [],
        dependencies: [],
        issues: [],
        complexity: 'low',
        complexityReason: 'simple'
      },
      {
        fileId: 'f2',
        filePath: 'src/b.ts',
        purpose: 'purpose B',
        responsibilities: ['resp2'],
        publicAPI: [],
        dependencies: [],
        issues: [],
        complexity: 'high',
        complexityReason: 'complex logic'
      }
    ]));

    const state: Partial<State> = {
      jobId: 'job-123',
      files: [
        { id: 'f1', path: 'src/a.ts', content: 'content A', language: 'typescript', lineCount: 1, sizeBytes: 10, isEntryPoint: false },
        { id: 'f2', path: 'src/b.ts', content: 'content B', language: 'typescript', lineCount: 1, sizeBytes: 10, isEntryPoint: false }
      ],
      dependencyGraph: {
        edges: [
          { from: 'src/a.ts', to: 'src/b.ts', type: 'import', specifiers: [] }
        ],
        entryPoints: ['src/a.ts'],
        externalDependencies: [],
        cycles: [],
        adjacency: {
          'src/a.ts': ['src/b.ts'],
          'src/b.ts': []
        }
      },
      completedPhases: [],
      errors: []
    };

    const result = await fileAnalysisNode(state as State);
    
    // B depends on nothing, A depends on B.
    // Topological sort should put B before A.
    // Since there are only 2 files, they fit in 1 batch.
    expect(callLLMMock).toHaveBeenCalledTimes(1);
    
    expect(result.fileAnalyses).toHaveLength(2);
    expect(result.currentPhase).toBe('file-analysis');
    expect(result.completedPhases).toContain('file-analysis');
    
    // Ensure errors is undefined or empty
    expect(result.errors).toBeUndefined();
  });

  it('handles LLM failure gracefully without crashing', async () => {
    // Force a failure
    vi.spyOn(llmUtils, 'callLLM').mockRejectedValue(new Error('Simulated LLM crash'));

    const state: Partial<State> = {
      jobId: 'job-123',
      files: [
        { id: 'f1', path: 'src/a.ts', content: 'content', language: 'typescript', lineCount: 1, sizeBytes: 10, isEntryPoint: false }
      ],
      dependencyGraph: { edges: [], entryPoints: [], externalDependencies: [], cycles: [], adjacency: {} },
      completedPhases: [],
      errors: []
    };

    const result = await fileAnalysisNode(state as State);
    
    // Should return empty analyses but push an error
    expect(result.fileAnalyses).toHaveLength(0);
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toContain('Simulated LLM crash');
    expect(result.errors![0].recoverable).toBe(true);
    expect(result.currentPhase).toBe('file-analysis');
  });
});
