import { parseFile } from '@code-analyzer/parser';
import type { ParsedAST } from '@code-analyzer/shared';
import type { State } from '../state';

export async function parseNode(state: State): Promise<Partial<State>> {
  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_start', phase: 'parse' });
  }

  const parsedASTs: ParsedAST[] = [];
  const total = state.files.length;
  
  for (let i = 0; i < state.files.length; i++) {
    const file = state.files[i];
    
    // Only parse TS, JS, and Python for now
    if (['typescript', 'javascript', 'python'].includes(file.language)) {
      try {
        const ast = parseFile(file);
        parsedASTs.push(ast);
      } catch (err) {
        // Skip files that fail to parse
        console.error(`Failed to parse file: ${file.path}`, err);
      }
    }

    if (state.streamEmit) {
      state.streamEmit({ 
        type: 'phase_progress', 
        phase: 'parse', 
        item: file.path,
        percent: Math.round(((i + 1) / total) * 100) 
      });
    }
  }

  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_complete', phase: 'parse', summary: `Parsed ${parsedASTs.length} files.` });
  }

  return {
    parsedASTs,
    currentPhase: 'parse',
    completedPhases: ['parse'],
  };
}
