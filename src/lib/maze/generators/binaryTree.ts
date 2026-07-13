import { CellType, Grid } from '@/lib/grid/Grid';
import { MazeGenerator } from '../types';
import { placeDefaultStartEnd } from '../placement';

function generate(width: number, height: number): Grid {
  const grid = new Grid(width, height);
  grid.cellType.fill(CellType.Wall);
  const carve = (row: number, col: number) => grid.erase(grid.toId(row, col));

  for (let row = 0; row < height; row += 2) {
    for (let col = 0; col < width; col += 2) {
      carve(row, col);
      const canNorth = row >= 2;
      const canWest = col >= 2;
      if (canNorth && canWest) {
        if (Math.random() < 0.5) carve(row - 1, col);
        else carve(row, col - 1);
      } else if (canNorth) {
        carve(row - 1, col);
      } else if (canWest) {
        carve(row, col - 1);
      }
    }
  }

  placeDefaultStartEnd(grid);
  return grid;
}

export const binaryTreeGenerator: MazeGenerator = {
  id: 'binary-tree',
  name: 'Binary Tree',
  description: 'Each cell carves toward north or west at random — fast, simple, and strongly biased toward one corner.',
  generate,
};
