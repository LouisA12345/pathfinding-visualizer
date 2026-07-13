import { create } from 'zustand';
import { Grid } from '@/lib/grid/Grid';
import { GRID_SIZE_PRESETS } from '@/types';
import { placeDefaultStartEnd } from '@/lib/maze/placement';

const MAX_HISTORY = 50;
const DEFAULT_PRESET = GRID_SIZE_PRESETS[1];

function createDefaultGrid(): Grid {
  const grid = new Grid(DEFAULT_PRESET.width, DEFAULT_PRESET.height);
  placeDefaultStartEnd(grid);
  return grid;
}

interface GridStoreState {
  grid: Grid;
  version: number;
  canUndo: boolean;
  canRedo: boolean;
  history: Grid[];
  future: Grid[];
  beginEdit: () => void;
  bumpVersion: () => void;
  setGrid: (grid: Grid, opts?: { resetHistory?: boolean }) => void;
  resize: (width: number, height: number) => void;
  undo: () => void;
  redo: () => void;
  clearAll: () => void;
  clearObstacles: () => void;
}

export const useGridStore = create<GridStoreState>((set, get) => ({
  grid: createDefaultGrid(),
  version: 0,
  canUndo: false,
  canRedo: false,
  history: [],
  future: [],

  beginEdit: () => {
    const { grid, history } = get();
    const next = [...history, grid.clone()].slice(-MAX_HISTORY);
    set({ history: next, future: [], canUndo: true, canRedo: false });
  },

  bumpVersion: () => set((s) => ({ version: s.version + 1 })),

  setGrid: (grid, opts) => {
    if (opts?.resetHistory) {
      set({ grid, version: get().version + 1, history: [], future: [], canUndo: false, canRedo: false });
    } else {
      get().beginEdit();
      set((s) => ({ grid, version: s.version + 1 }));
    }
  },

  resize: (width, height) => {
    const newGrid = new Grid(width, height);
    placeDefaultStartEnd(newGrid);
    set({ grid: newGrid, version: get().version + 1, history: [], future: [], canUndo: false, canRedo: false });
  },

  undo: () => {
    const { history, grid, future } = get();
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    set({
      grid: previous,
      version: get().version + 1,
      history: history.slice(0, -1),
      future: [grid, ...future],
      canUndo: history.length - 1 > 0,
      canRedo: true,
    });
  },

  redo: () => {
    const { future, grid, history } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      grid: next,
      version: get().version + 1,
      future: future.slice(1),
      history: [...history, grid],
      canRedo: future.length - 1 > 0,
      canUndo: true,
    });
  },

  clearAll: () => {
    get().beginEdit();
    const { grid } = get();
    grid.clearAll();
    placeDefaultStartEnd(grid);
    set((s) => ({ version: s.version + 1 }));
  },

  clearObstacles: () => {
    get().beginEdit();
    const { grid } = get();
    grid.clearObstacles();
    set((s) => ({ version: s.version + 1 }));
  },
}));
