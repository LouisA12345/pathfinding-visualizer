import { CellType, Grid } from '@/lib/grid/Grid';
import { MazeGenerator } from '../types';
import { placeDefaultStartEnd } from '../placement';

function generate(width: number, height: number): Grid {
  const grid = new Grid(width, height);
  grid.cellType.fill(CellType.Wall);
  const carve = (row: number, col: number) => grid.erase(grid.toId(row, col));

  for (let row = 0; row < height; row += 2) {
    let runStart = 0;
    const atNorthernBoundary = row === 0;

    for (let col = 0; col < width; col += 2) {
      carve(row, col);
      const atEasternBoundary = col + 2 >= width;
      const closeRun = atEasternBoundary || (!atNorthernBoundary && Math.random() < 0.5);

      if (!closeRun) {
        carve(row, col + 1);
        continue;
      }

      if (!atNorthernBoundary) {
        const runCols: number[] = [];
        for (let c = runStart; c <= col; c += 2) runCols.push(c);
        const chosen = runCols[Math.floor(Math.random() * runCols.length)];
        carve(row - 1, chosen);
      }
      runStart = col + 2;
    }
  }

  placeDefaultStartEnd(grid);
  return grid;
}

export const sidewinderGenerator: MazeGenerator = {
  id: 'sidewinder',
  name: 'Sidewinder',
  description: 'Carves row by row, grouping cells into horizontal runs that each open exactly one passage north.',
  generate,
};
