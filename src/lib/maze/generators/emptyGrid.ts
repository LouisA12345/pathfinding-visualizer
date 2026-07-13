import { Grid } from '@/lib/grid/Grid';
import { MazeGenerator } from '../types';
import { placeDefaultStartEnd } from '../placement';

function generate(width: number, height: number): Grid {
  const grid = new Grid(width, height);
  placeDefaultStartEnd(grid);
  return grid;
}

export const emptyGridGenerator: MazeGenerator = {
  id: 'empty',
  name: 'Empty Grid',
  description: 'A blank canvas with no obstacles — draw your own maze from scratch.',
  generate,
};
