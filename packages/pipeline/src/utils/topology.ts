import type { CodeFile, DependencyGraph } from '@code-analyzer/shared';

export function topologicalSortFiles(files: CodeFile[], dependencyGraph: DependencyGraph): CodeFile[] {
  // Map of file path to its indegree (number of files it depends on)
  // Wait, if A depends on B, B is a dependency of A.
  // We want to process B (no dependencies) before A.
  // So the directed edge should be A -> B (A depends on B).
  // In our dependency graph, edge `from` is the dependent, `to` is the dependency.
  // We want to process files with 0 outgoing edges (no internal dependencies) first.
  
  // So we compute out-degree (dependencies) within the project.
  const outDegree = new Map<string, number>();
  const reverseAdjacency = new Map<string, string[]>(); // B is depended on by [A, C]
  
  const filePaths = new Set(files.map(f => f.path));

  for (const path of filePaths) {
    outDegree.set(path, 0);
    reverseAdjacency.set(path, []);
  }

  for (const edge of dependencyGraph.edges) {
    if (filePaths.has(edge.from) && filePaths.has(edge.to)) {
      outDegree.set(edge.from, outDegree.get(edge.from)! + 1);
      reverseAdjacency.get(edge.to)!.push(edge.from);
    }
  }

  // Queue of files with 0 outgoing edges (they depend on nothing internal)
  const queue: string[] = [];
  for (const [path, deg] of outDegree.entries()) {
    if (deg === 0) queue.push(path);
  }

  const sortedPaths: string[] = [];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    sortedPaths.push(current);
    
    // For every file that depends on 'current'
    for (const dependent of reverseAdjacency.get(current)!) {
      const deg = outDegree.get(dependent)! - 1;
      outDegree.set(dependent, deg);
      if (deg === 0) {
        queue.push(dependent);
      }
    }
  }

  // If there are cycles, some files will be left with outDegree > 0.
  // Just append them at the end.
  for (const [path, deg] of outDegree.entries()) {
    if (deg > 0) {
      sortedPaths.push(path);
    }
  }

  // Map back to CodeFile objects
  const pathToFile = new Map(files.map(f => [f.path, f]));
  return sortedPaths.map(p => pathToFile.get(p)!);
}
