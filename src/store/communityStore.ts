import { create } from 'zustand';
import { Grid, SerializedGrid } from '@/lib/grid/Grid';
import { useGridStore } from './gridStore';

interface CommunityStoreState {
  activeMazeId: string | null;
  activeMazeName: string | null;
  /** Loads a community maze into the grid and marks it "active" for leaderboard submission. */
  loadMaze: (id: string, name: string, gridData: SerializedGrid) => void;
}

// Tracks the gridStore version this maze was loaded at, so any *subsequent*
// edit (a different version) clears `activeMazeId` — leaderboard entries
// should only ever be submitted against the maze exactly as its creator
// published it, never a version the current user has since modified.
let versionAtMazeLoad = -1;

export const useCommunityStore = create<CommunityStoreState>((set) => ({
  activeMazeId: null,
  activeMazeName: null,
  loadMaze: (id, name, gridData) => {
    useGridStore.getState().setGrid(Grid.deserialize(gridData), { resetHistory: true });
    versionAtMazeLoad = useGridStore.getState().version;
    set({ activeMazeId: id, activeMazeName: name });
  },
}));

let lastGridVersion = useGridStore.getState().version;
useGridStore.subscribe((state) => {
  if (state.version === lastGridVersion) return;
  lastGridVersion = state.version;
  if (state.version !== versionAtMazeLoad) {
    useCommunityStore.setState({ activeMazeId: null, activeMazeName: null });
  }
});
