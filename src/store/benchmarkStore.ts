import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ALGORITHMS } from '@/lib/algorithms/registry';
import { runAlgorithm } from '@/lib/engine/runAlgorithm';
import { useGridStore } from './gridStore';
import { useUiStore } from './uiStore';

export interface BenchmarkAlgorithmResult {
  runtimeMs: number;
  visited: number;
  pathLength: number;
  pathCost: number;
  success: boolean;
  aborted: boolean;
}

export interface BenchmarkEntry {
  id: string;
  timestamp: number;
  gridWidth: number;
  gridHeight: number;
  results: Record<string, BenchmarkAlgorithmResult>;
}

const MAX_HISTORY = 20;

interface BenchmarkStoreState {
  isActive: boolean;
  isRunning: boolean;
  progress: number;
  latest: BenchmarkEntry | null;
  history: BenchmarkEntry[];

  runBenchmark: () => Promise<boolean>;
  enterBenchmarkView: () => void;
  exitBenchmarkView: () => void;
  clearHistory: () => void;
  viewHistoryEntry: (id: string) => void;
}

export const useBenchmarkStore = create<BenchmarkStoreState>()(
  persist(
    (set, get) => ({
      isActive: false,
      isRunning: false,
      progress: 0,
      latest: null,
      history: [],

      runBenchmark: async () => {
        const { grid } = useGridStore.getState();
        const { settings } = useUiStore.getState();
        if (grid.startId < 0 || grid.endId < 0) return false;

        set({ isRunning: true, progress: 0 });
        const results: Record<string, BenchmarkAlgorithmResult> = {};

        for (let i = 0; i < ALGORITHMS.length; i++) {
          const def = ALGORITHMS[i];
          const r = runAlgorithm(def, grid, grid.startId, grid.endId, {
            diagonalMovement: settings.diagonalMovement,
            cornerCutting: settings.cornerCutting,
            heuristicWeight: settings.heuristicWeight,
          });
          results[def.id] = {
            runtimeMs: r.stats.runtimeMs,
            visited: r.stats.visited,
            pathLength: r.stats.pathLength,
            pathCost: r.stats.pathCost,
            success: r.stats.success,
            aborted: r.stats.aborted,
          };
          set({ progress: (i + 1) / ALGORITHMS.length });
          // Yield to the browser between runs so the progress bar and the
          // rest of the UI stay responsive instead of freezing for the
          // entire batch (13 algorithms can add up to a couple of seconds).
          await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
        }

        const entry: BenchmarkEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          gridWidth: grid.width,
          gridHeight: grid.height,
          results,
        };
        set((s) => ({
          latest: entry,
          history: [entry, ...s.history].slice(0, MAX_HISTORY),
          isRunning: false,
          progress: 1,
        }));
        return true;
      },

      enterBenchmarkView: () => set({ isActive: true }),
      exitBenchmarkView: () => set({ isActive: false }),
      clearHistory: () => set({ history: [], latest: null }),
      viewHistoryEntry: (id) => {
        const entry = get().history.find((h) => h.id === id);
        if (entry) set({ latest: entry });
      },
    }),
    {
      name: 'pathfinding-visualizer-benchmarks',
      partialize: (s) => ({ history: s.history }),
    }
  )
);
