import { getMazeGenerator } from '@/lib/maze/registry';
import { Grid } from '@/lib/grid/Grid';
import { useGridStore } from '@/store/gridStore';
import { useMazeStore, SavedMaze } from '@/store/mazeStore';

export function generateAndApplyMaze(generatorId?: string): void {
  const mazeState = useMazeStore.getState();
  const id = generatorId ?? mazeState.selectedGeneratorId;
  const generator = getMazeGenerator(id);
  if (!generator) return;

  const { grid } = useGridStore.getState();
  const newGrid = generator.generate(grid.width, grid.height, mazeState.intensity);
  useGridStore.getState().setGrid(newGrid);
}

export function saveCurrentMaze(name: string): void {
  const { grid } = useGridStore.getState();
  const maze: SavedMaze = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    grid: grid.serialize(),
  };
  useMazeStore.getState().addSavedMaze(maze);
}

export function loadSavedMaze(id: string): void {
  const maze = useMazeStore.getState().savedMazes.find((m) => m.id === id);
  if (!maze) return;
  useGridStore.getState().setGrid(Grid.deserialize(maze.grid));
}
