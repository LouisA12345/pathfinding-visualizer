import { useMemo } from 'react';
import { useAlgorithmStore } from '@/store/algorithmStore';
import { AlgorithmResult } from '@/lib/algorithms/types';

export interface LiveStats {
  stepsCompleted: number;
  totalSteps: number;
  visited: number;
  frontier: number;
  pathLength: number;
  pathCost: number;
  runtimeMs: number;
  /** Wall-clock time spent actively playing this run, in ms — time taken from start to end. */
  elapsedMs: number;
  branchingFactor: number;
  efficiency: number;
  success: boolean | null;
  aborted: boolean;
  /** True once the user has skipped ahead — elapsedMs then reflects only the portion actually watched, not a real completion time. */
  wasSkipped: boolean;
  progress: number;
  hasResult: boolean;
}

const EMPTY: LiveStats = {
  stepsCompleted: 0,
  totalSteps: 0,
  visited: 0,
  frontier: 0,
  pathLength: 0,
  pathCost: 0,
  runtimeMs: 0,
  elapsedMs: 0,
  branchingFactor: 0,
  efficiency: 0,
  success: null,
  aborted: false,
  wasSkipped: false,
  progress: 0,
  hasResult: false,
};

/** Pure computation shared by the single-run stats hook and Compare Mode's per-panel stats. */
export function computeLiveStats(
  result: AlgorithmResult | null,
  stepIndex: number,
  elapsedMs = 0,
  wasSkipped = false
): LiveStats {
  if (!result) return EMPTY;

  let visited = 0;
  let frontier = 0;
  let pathLength = 0;
  const clampedIndex = Math.min(Math.max(stepIndex, 0), result.steps.length - 1);
  for (let i = 0; i <= clampedIndex; i++) {
    const step = result.steps[i];
    if (step.type === 'visit') visited++;
    else if (step.type === 'frontier') frontier++;
    else if (step.type === 'path') pathLength++;
  }

  const totalSteps = result.steps.length;
  const isAtEnd = clampedIndex >= totalSteps - 1;

  return {
    stepsCompleted: clampedIndex + 1,
    totalSteps,
    visited,
    frontier,
    pathLength,
    pathCost: isAtEnd ? result.stats.pathCost : 0,
    runtimeMs: result.stats.runtimeMs,
    elapsedMs,
    branchingFactor: visited > 0 ? frontier / visited : 0,
    efficiency: isAtEnd && visited > 0 ? result.stats.pathLength / visited : 0,
    success: isAtEnd ? result.stats.success : null,
    aborted: isAtEnd && result.stats.aborted,
    wasSkipped,
    progress: totalSteps > 0 ? (clampedIndex + 1) / totalSteps : 0,
    hasResult: true,
  };
}

/** Derives live progress stats from the step array up to the current playback index. */
export function useLiveStats(): LiveStats {
  const result = useAlgorithmStore((s) => s.result);
  const currentStepIndex = useAlgorithmStore((s) => s.currentStepIndex);
  const elapsedMs = useAlgorithmStore((s) => s.elapsedMs);
  const wasSkipped = useAlgorithmStore((s) => s.wasSkipped);

  return useMemo(
    () => computeLiveStats(result, currentStepIndex, elapsedMs, wasSkipped),
    [result, currentStepIndex, elapsedMs, wasSkipped]
  );
}

export function formatElapsed(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}m ${seconds}s`;
}

/** Formats elapsed playback time, honestly flagging when the user skipped ahead instead of watching it play out. */
export function formatElapsedWithSkip(ms: number, wasSkipped: boolean): string {
  const base = formatElapsed(ms);
  return wasSkipped ? `${base} (skipped ahead)` : base;
}
