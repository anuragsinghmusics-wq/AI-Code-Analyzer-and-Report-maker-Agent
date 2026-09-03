import type { DependencyGraph, DependencyEdge } from '@code-analyzer/shared';
import type { State } from '../state';

export async function dependencyGraphNode(state: State): Promise<Partial<State>> {
  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_start', phase: 'dependency-graph' });
  }

  const edges: DependencyEdge[] = [];
  const adjacency: Record<string, string[]> = {};
  const externalDeps = new Set<string>();

  // Build basic adjacency and edge list based on imports
  for (const ast of (state.parsedASTs || [])) {
    // Find matching code file to get the path
    const file = state.files.find(f => f.id === ast.fileId);
    if (!file) continue;

    adjacency[file.path] = [];

    for (const imp of ast.imports) {
      // Very basic internal vs external heuristic
      const isInternal = imp.source.startsWith('.') || imp.source.startsWith('/') || imp.source.startsWith('@/');
      
      if (!isInternal) {
        externalDeps.add(imp.source);
      }

      edges.push({
        from: file.path,
        to: imp.source, // In a robust version, we'd resolve this to absolute project paths
        type: 'import',
        specifiers: imp.specifiers,
      });

      adjacency[file.path].push(imp.source);
    }
  }

  // Find entry points (files that are not imported by anyone)
  const allImported = new Set(edges.map(e => e.to));
  const entryPoints = state.files
    .filter(f => !allImported.has(f.path) || f.isEntryPoint)
    .map(f => f.path);

  const dependencyGraph: DependencyGraph = {
    edges,
    entryPoints,
    externalDependencies: Array.from(externalDeps),
    cycles: [], // Cycle detection omitted for simple pass
    adjacency,
  };

  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_complete', phase: 'dependency-graph', summary: `Built graph with ${edges.length} edges.` });
  }

  return {
    dependencyGraph,
    currentPhase: 'dependency-graph',
    completedPhases: ['dependency-graph'],
  };
}
