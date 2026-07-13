import { create } from 'zustand';
import { AlgorithmResult } from '@/lib/algorithms/types';
import { getAlgorithm } from '@/lib/algorithms/registry';
import { runAlgorithm } from '@/lib/engine/runAlgorithm';
import { useGridStore } from './gridStore';
import { useUiStore } from './uiStore';

export type CompareRunState = 'idle' | 'paused' | 'playing' | 'finished';

export const MAX_COMPARE_SLOTS = 4;
export const MIN_COMPARE_SLOTS = 2;

function maxTotalSteps(results: Record<string, AlgorithmResult | null>): number {
  let max = 1;
  for (const r of Object.values(results)) {
    if (r && r.steps.length > max) max = r.steps.length;
  }
  return max;
}

interface CompareStoreState {
  isActive: boolean;
  selectedIds: string[];
  results: Record<string, AlgorithmResult | null>;
  currentTick: number;
  runState: CompareRunState;
  speed: number;
  elapsedMs: number;
  wasSkipped: boolean;

  toggleAlgorithm: (id: string) => void;
  enterCompareMode: () => void;
  exitCompareMode: () => void;
  runComparison: () => boolean;
  start: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  skipToEnd: () => void;
  setSpeed: (speed: number) => void;
  tick: (steps: number, dtMs: number) => void;
}

export const useCompareStore = create<CompareStoreState>((set, get) => ({
  isActive: false,
  selectedIds: ['bfs', 'astar'],
  results: {},
  currentTick: 0,
  runState: 'idle',
  speed: 60,
  elapsedMs: 0,
  wasSkipped: false,

  toggleAlgorithm: (id) =>
    set((s) => {
      if (s.selectedIds.includes(id)) {
        return { selectedIds: s.selectedIds.filter((x) => x !== id) };
      }
      if (s.selectedIds.length >= MAX_COMPARE_SLOTS) return s;
      return { selectedIds: [...s.selectedIds, id] };
    }),

  enterCompareMode: () => set({ isActive: true }),
  exitCompareMode: () => set({ isActive: false, runState: 'idle' }),

  runComparison: () => {
    const { grid } = useGridStore.getState();
    const { settings } = useUiStore.getState();
    const { selectedIds } = get();
    if (grid.startId < 0 || grid.endId < 0) return false;
    if (selectedIds.length < MIN_COMPARE_SLOTS) return false;

    const results: Record<string, AlgorithmResult | null> = {};
    for (const id of selectedIds) {
      const def = getAlgorithm(id);
      if (!def) continue;
      results[id] = runAlgorithm(def, grid, grid.startId, grid.endId, {
        diagonalMovement: settings.diagonalMovement,
        cornerCutting: settings.cornerCutting,
        heuristicWeight: settings.heuristicWeight,
      });
    }
    set({ results, currentTick: 0, runState: 'paused', elapsedMs: 0, wasSkipped: false });
    return true;
  },

  start: () => {
    if (get().runComparison()) set({ runState: 'playing' });
  },

  play: () => {
    const { results, currentTick } = get();
    if (Object.keys(results).length === 0) {
      get().start();
      return;
    }
    if (currentTick >= maxTotalSteps(results) - 1) set({ currentTick: 0, elapsedMs: 0, wasSkipped: false });
    set({ runState: 'playing' });
  },

  pause: () => set((s) => (s.runState === 'playing' ? { runState: 'paused' } : {})),

  stop: () => set((s) => (Object.keys(s.results).length > 0 ? { runState: 'paused' } : s)),

  reset: () => set({ results: {}, currentTick: 0, runState: 'idle', elapsedMs: 0, wasSkipped: false }),

  stepForward: () => {
    const { results, currentTick } = get();
    if (Object.keys(results).length === 0) return;
    const max = maxTotalSteps(results);
    const next = Math.min(currentTick + 1, max - 1);
    set({ currentTick: next, runState: next >= max - 1 ? 'finished' : 'paused' });
  },

  stepBackward: () => {
    const { currentTick } = get();
    set({ currentTick: Math.max(currentTick - 1, 0), runState: 'paused' });
  },

  skipToEnd: () => {
    const { results } = get();
    if (Object.keys(results).length === 0) return;
    set({ currentTick: maxTotalSteps(results) - 1, runState: 'finished', wasSkipped: true });
  },

  setSpeed: (speed) => set({ speed }),

  tick: (steps, dtMs) => {
    const { results, currentTick, runState, elapsedMs } = get();
    if (Object.keys(results).length === 0 || runState !== 'playing') return;
    const max = maxTotalSteps(results);
    const next = currentTick + steps;
    if (next >= max - 1) {
      set({ currentTick: max - 1, runState: 'finished', elapsedMs: elapsedMs + dtMs });
    } else {
      set({ currentTick: next, elapsedMs: elapsedMs + dtMs });
    }
  },
}));

// Grid edits invalidate comparison results too.
let lastGridVersionForCompare = useGridStore.getState().version;
useGridStore.subscribe((state) => {
  if (state.version !== lastGridVersionForCompare) {
    lastGridVersionForCompare = state.version;
    useCompareStore.getState().reset();
  }
});
