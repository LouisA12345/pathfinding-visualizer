import { create } from 'zustand';
import { AlgorithmResult } from '@/lib/algorithms/types';
import { getAlgorithm } from '@/lib/algorithms/registry';
import { runAlgorithm } from '@/lib/engine/runAlgorithm';
import { useGridStore } from './gridStore';
import { useUiStore } from './uiStore';

export type RunState = 'idle' | 'paused' | 'playing' | 'finished';

interface AlgorithmStoreState {
  selectedId: string;
  result: AlgorithmResult | null;
  currentStepIndex: number;
  runState: RunState;
  speed: number;
  /** Wall-clock time spent actively playing this run, in ms — "time taken from start to end". */
  elapsedMs: number;
  /** True once the user has skipped ahead — elapsedMs then reflects only the portion actually watched, not a real completion time. */
  wasSkipped: boolean;

  selectAlgorithm: (id: string) => void;
  compute: () => boolean;
  start: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  seek: (index: number) => void;
  skipToEnd: () => void;
  setSpeed: (speed: number) => void;
  tick: (steps: number, dtMs: number) => void;
}

export const useAlgorithmStore = create<AlgorithmStoreState>((set, get) => ({
  selectedId: 'astar',
  result: null,
  currentStepIndex: 0,
  runState: 'idle',
  speed: 60,
  elapsedMs: 0,
  wasSkipped: false,

  selectAlgorithm: (id) =>
    set({ selectedId: id, result: null, currentStepIndex: 0, runState: 'idle', elapsedMs: 0, wasSkipped: false }),

  compute: () => {
    const { grid } = useGridStore.getState();
    const { settings } = useUiStore.getState();
    if (grid.startId < 0 || grid.endId < 0) return false;
    const def = getAlgorithm(get().selectedId);
    if (!def) return false;

    const result = runAlgorithm(def, grid, grid.startId, grid.endId, {
      diagonalMovement: settings.diagonalMovement,
      cornerCutting: settings.cornerCutting,
      heuristicWeight: settings.heuristicWeight,
    });
    set({ result, currentStepIndex: 0, runState: 'paused', elapsedMs: 0, wasSkipped: false });
    return true;
  },

  start: () => {
    if (get().compute()) set({ runState: 'playing' });
  },

  play: () => {
    const { result, currentStepIndex } = get();
    if (!result) {
      get().start();
      return;
    }
    if (currentStepIndex >= result.steps.length - 1) set({ currentStepIndex: 0, elapsedMs: 0 });
    set({ runState: 'playing' });
  },

  pause: () => set((s) => (s.runState === 'playing' ? { runState: 'paused' } : {})),

  // Halts playback exactly where it is — unlike Reset, it does not rewind or
  // clear the result. Unlike Pause, it's available any time a result exists.
  stop: () => set((s) => (s.result ? { runState: 'paused' } : s)),

  reset: () => set({ result: null, currentStepIndex: 0, runState: 'idle', elapsedMs: 0, wasSkipped: false }),

  stepForward: () => {
    const { result, currentStepIndex } = get();
    if (!result) return;
    const next = Math.min(currentStepIndex + 1, result.steps.length - 1);
    set({ currentStepIndex: next, runState: next >= result.steps.length - 1 ? 'finished' : 'paused' });
  },

  stepBackward: () => {
    const { currentStepIndex } = get();
    set({ currentStepIndex: Math.max(currentStepIndex - 1, 0), runState: 'paused' });
  },

  seek: (index) => {
    const { result } = get();
    if (!result) return;
    const clamped = Math.min(Math.max(index, 0), result.steps.length - 1);
    set({ currentStepIndex: clamped, runState: clamped >= result.steps.length - 1 ? 'finished' : 'paused' });
  },

  skipToEnd: () => {
    const { result } = get();
    if (!result) return;
    set({ currentStepIndex: result.steps.length - 1, runState: 'finished', wasSkipped: true });
  },

  setSpeed: (speed) => set({ speed }),

  tick: (steps, dtMs) => {
    const { result, currentStepIndex, runState, elapsedMs } = get();
    if (!result || runState !== 'playing') return;
    const next = currentStepIndex + steps;
    if (next >= result.steps.length - 1) {
      set({ currentStepIndex: result.steps.length - 1, runState: 'finished', elapsedMs: elapsedMs + dtMs });
    } else {
      set({ currentStepIndex: next, elapsedMs: elapsedMs + dtMs });
    }
  },
}));

// Grid edits invalidate the current visualization — keep the two in sync without
// every call site having to remember to reset the algorithm result.
let lastGridVersion = useGridStore.getState().version;
useGridStore.subscribe((state) => {
  if (state.version !== lastGridVersion) {
    lastGridVersion = state.version;
    useAlgorithmStore.getState().reset();
  }
});
