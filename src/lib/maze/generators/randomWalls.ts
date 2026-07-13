import { Grid } from '@/lib/grid/Grid';
import { MazeGenerator } from '../types';
import { placeDefaultStartEnd } from '../placement';

function generate(width: number, height: number, intensity = 0.28): Grid {
  const grid = new Grid(width, height);
  for (let id = 0; id < grid.size; id++) {
    if (Math.random() < intensity) grid.setWall(id);
  }
  placeDefaultStartEnd(grid);
  return grid;
}

export const randomWallsGenerator: MazeGenerator = {
  id: 'random-walls',
  name: 'Random Walls',
  description: 'Scatters walls randomly across the grid — quick, unpredictable obstacle courses.',
  generate,
};
