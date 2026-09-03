import type { State } from '../state';

export async function ingestNode(state: State): Promise<Partial<State>> {
  // In a real implementation, this might fetch from S3/GitHub.
  // For now, we assume state.files is already populated from the caller.
  
  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_start', phase: 'ingest' });
  }

  // Simulated processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  if (state.streamEmit) {
    state.streamEmit({ type: 'phase_complete', phase: 'ingest', summary: `Ingested ${state.files.length} files.` });
  }

  return {
    currentPhase: 'ingest',
    completedPhases: ['ingest'],
  };
}
