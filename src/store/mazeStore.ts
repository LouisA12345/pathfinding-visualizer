import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SerializedGrid } from '@/lib/grid/Grid';

export interface SavedMaze {
  id: string;
  name: string;
  createdAt: number;
  grid: SerializedGrid;
}

interface MazeStoreState {
  selectedGeneratorId: string;
  intensity: number;
  savedMazes: SavedMaze[];

  setSelectedGenerator: (id: string) => void;
  setIntensity: (v: number) => void;
  addSavedMaze: (maze: SavedMaze) => void;
  deleteSavedMaze: (id: string) => void;
}

export const useMazeStore = create<MazeStoreState>()(
  persist(
    (set) => ({
      selectedGeneratorId: 'recursive-backtracking',
      intensity: 0.28,
      savedMazes: [],

      setSelectedGenerator: (id) => set({ selectedGeneratorId: id }),
      setIntensity: (v) => set({ intensity: v }),
      addSavedMaze: (maze) => set((s) => ({ savedMazes: [maze, ...s.savedMazes].slice(0, 50) })),
      deleteSavedMaze: (id) => set((s) => ({ savedMazes: s.savedMazes.filter((m) => m.id !== id) })),
    }),
    { name: 'pathfinding-visualizer-mazes' }
  )
);
