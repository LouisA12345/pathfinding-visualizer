import { CellType, Grid } from '@/lib/grid/Grid';
import { MazeGenerator } from '../types';

function generate(width: number, height: number): Grid {
  const grid = new Grid(width, height);
  grid.cellType.fill(CellType.Wall);

  let top = 0;
  let bottom = height - 1;
  let left = 0;
  let right = width - 1;
  const path: number[] = [];

  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) path.push(grid.toId(top, c));
    top++;
    for (let r = top; r <= bottom; r++) path.push(grid.toId(r, right));
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) path.push(grid.toId(bottom, c));
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) path.push(grid.toId(r, left));
      left++;
    }
  }

  for (const id of path) grid.erase(id);

  if (path.length > 0) {
    grid.setStart(path[0]);
    grid.setEnd(path[path.length - 1]);
  }
  return grid;
}

export const spiralGenerator: MazeGenerator = {
  id: 'spiral',
  name: 'Spiral',
  description: 'A single winding corridor spirals from the outer edge to the center — start and end sit at opposite ends of the spiral.',
  generate,
};
