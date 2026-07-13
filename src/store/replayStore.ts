import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Grid, SerializedGrid } from '@/lib/grid/Grid';
import { getAlgorithm } from '@/lib/algorithms/registry';
import { useGridStore } from './gridStore';
import { useAlgorithmStore } from './algorithmStore';

export interface ReplayEntry {
  id: string;
  timestamp: number;
  algorithmId: string;
  algorithmName: string;
  gridSnapshot: SerializedGrid;
  pathLength: number;
  pathCost: number;
  success: boolean;
}

const MAX_HISTORY = 20;

interface ReplayStoreState {
  history: ReplayEntry[];
  recordRun: (entry: Omit<ReplayEntry, 'id' | 'timestamp'>) => void;
  restoreAndReplay: (id: string) => void;
  clearHistory: () => void;
}

export const useReplayStore = create<ReplayStoreState>()(
  persist(
    (set, get) => ({
      history: [],

      recordRun: (entry) => {
        const full: ReplayEntry = { id: crypto.randomUUID(), timestamp: Date.now(), ...entry };
        set((s) => ({ history: [full, ...s.history].slice(0, MAX_HISTORY) }));
      },

      // Restores the exact grid the run happened on and re-selects the same
      // algorithm, then re-runs it — algorithms are deterministic given the
      // same grid/algorithm/options, so this reproduces the identical
      // animation without needing to have stored the (potentially huge)
      // step array itself.
      restoreAndReplay: (id) => {
        const entry = get().history.find((h) => h.id === id);
        if (!entry) return;
        useGridStore.getState().setGrid(Grid.deserialize(entry.gridSnapshot), { resetHistory: true });
        useAlgorithmStore.getState().selectAlgorithm(entry.algorithmId);
        useAlgorithmStore.getState().start();
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'pathfinding-visualizer-replays',
      partialize: (s) => ({ history: s.history }),
    }
  )
);

// One-way subscription (replayStore depends on algorithmStore/gridStore, never
// the reverse) — the same pattern algorithmStore itself uses to watch
// gridStore, so neither store needs to import the other back and forth.
// Fires exactly once per freshly-computed run: `result` is only ever
// reassigned to a new object inside `compute()`, so a reference change is a
// reliable "a run just happened" signal.
let lastResult: ReturnType<typeof useAlgorithmStore.getState>['result'] = null;
useAlgorithmStore.subscribe((state) => {
  if (!state.result || state.result === lastResult) return;
  lastResult = state.result;
  const def = getAlgorithm(state.selectedId);
  if (!def) return;
  const { grid } = useGridStore.getState();
  useReplayStore.getState().recordRun({
    algorithmId: state.selectedId,
    algorithmName: def.name,
    gridSnapshot: grid.serialize(),
    pathLength: state.result.stats.pathLength,
    pathCost: state.result.stats.pathCost,
    success: state.result.stats.success,
  });
});
