import type { State } from '../state';
import { architectureAnalysisNode } from './architecture-analysis.node';
import { dataflowAnalysisNode } from './dataflow-analysis.node';
import { logicReviewNode } from './logic-review.node';
import { qualityReviewNode } from './quality-review.node';
import { bugHuntingNode } from './bug-hunting.node';
import { performanceReviewNode } from './performance-review.node';
import { designReviewNode } from './design-review.node';

export async function parallelDeepDivesNode(state: State): Promise<Partial<State>> {
  // Execute all 7 deep dive nodes concurrently, but stagger them by 12 seconds each to avoid RPM limits
  const executeWithDelay = async (nodeFn: (state: State) => Promise<Partial<State>>, phase: string, delayMs: number) => {
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    return nodeFn(state).catch(e => ({ errors: [{ phase: phase as any, message: e.message, timestamp: new Date(), recoverable: true }] } as Partial<State>));
  };

  const results = await Promise.all([
    executeWithDelay(architectureAnalysisNode, 'architecture-analysis', 0),
    executeWithDelay(dataflowAnalysisNode, 'dataflow-analysis', 12000),
    executeWithDelay(logicReviewNode, 'logic-review', 24000),
    executeWithDelay(qualityReviewNode, 'quality-review', 36000),
    executeWithDelay(bugHuntingNode, 'bug-hunting', 48000),
    executeWithDelay(performanceReviewNode, 'performance-review', 60000),
    executeWithDelay(designReviewNode, 'design-review', 72000)
  ]);

  // Merge the results
  const merged: Partial<State> = {
    errors: [],
    completedPhases: []
  };

  for (const r of results) {
    if (r.architectureAnalysis) merged.architectureAnalysis = r.architectureAnalysis;
    if (r.dataFlowAnalysis) merged.dataFlowAnalysis = r.dataFlowAnalysis;
    if (r.logicReview) merged.logicReview = r.logicReview;
    if (r.qualityReview) merged.qualityReview = r.qualityReview;
    if (r.bugReport) merged.bugReport = r.bugReport;
    if (r.performanceReview) merged.performanceReview = r.performanceReview;
    if (r.designReview) merged.designReview = r.designReview;

    if (r.errors && r.errors.length > 0) {
      merged.errors!.push(...r.errors);
    }
    if (r.completedPhases && r.completedPhases.length > 0) {
      merged.completedPhases!.push(...r.completedPhases);
    }
  }

  merged.currentPhase = 'design-review'; // Set to the last one so the graph conditional edge works
  return merged;
}
