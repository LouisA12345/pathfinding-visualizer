import { AlgorithmResult, AlgorithmStep } from '@/lib/algorithms/types';

export const VizState = { None: 0, Frontier: 1, Visited: 2, Path: 3 } as const;

/**
 * Incrementally folds an algorithm's Step[] up to a target index into a
 * per-cell visualization state. Forward playback (the common case) only
 * applies the delta since the last index — O(1) amortized. Scrubbing
 * backward rebuilds from scratch, which is still fast since even a 200x200
 * worst-case run produces well under 100k steps.
 */
export class VizStateCache {
  state: Uint8Array;
  cost: Float32Array;
  /** Running counts as of the last `update()` call — cheap live stats without rescanning steps. */
  visitedCount = 0;
  frontierCount = 0;
  pathRevealed = 0;
  private cachedIndex = -1;
  private result: AlgorithmResult | null = null;

  constructor(size: number) {
    this.state = new Uint8Array(size);
    this.cost = new Float32Array(size).fill(NaN);
  }

  private reset(): void {
    this.state.fill(VizState.None);
    this.cost.fill(NaN);
    this.cachedIndex = -1;
    this.visitedCount = 0;
    this.frontierCount = 0;
    this.pathRevealed = 0;
  }

  private applyStep(step: AlgorithmStep): void {
    if (step.type === 'frontier') {
      if (this.state[step.nodeId] === VizState.None) {
        this.state[step.nodeId] = VizState.Frontier;
        this.frontierCount++;
      }
      if (step.cost !== undefined) this.cost[step.nodeId] = step.cost;
    } else if (step.type === 'visit' || step.type === 'dequeue') {
      if (this.state[step.nodeId] !== VizState.Visited) {
        this.state[step.nodeId] = VizState.Visited;
        if (step.type === 'visit') this.visitedCount++;
      }
      if (step.cost !== undefined) this.cost[step.nodeId] = step.cost;
    } else if (step.type === 'path') {
      this.state[step.nodeId] = VizState.Path;
      this.pathRevealed++;
    }
  }

  update(result: AlgorithmResult | null, targetIndex: number): void {
    if (result !== this.result) {
      this.result = result;
      this.reset();
    }
    if (!result) return;

    if (targetIndex < this.cachedIndex) this.reset();
    for (let i = this.cachedIndex + 1; i <= targetIndex; i++) {
      this.applyStep(result.steps[i]);
    }
    this.cachedIndex = targetIndex;
  }
}
