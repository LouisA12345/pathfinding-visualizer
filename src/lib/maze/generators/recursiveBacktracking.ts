import { CellType, Grid } from '@/lib/grid/Grid';
import { MazeGenerator } from '../types';
import { placeDefaultStartEnd } from '../placement';

const CELL_DIRS: [number, number][] = [
  [-2, 0],
  [2, 0],
  [0, -2],
  [0, 2],
];

function generate(width: number, height: number): Grid {
  const grid = new Grid(width, height);
  grid.cellType.fill(CellType.Wall);

  const visited = new Uint8Array(grid.size);
  const carve = (row: number, col: number) => grid.erase(grid.toId(row, col));

  carve(0, 0);
  visited[grid.toId(0, 0)] = 1;
  const stack: [number, number][] = [[0, 0]];

  while (stack.length > 0) {
    const [row, col] = stack[stack.length - 1];
    const options: [number, number, number, number][] = [];
    for (const [dr, dc] of CELL_DIRS) {
      const nr = row + dr;
      const nc = col + dc;
      if (!grid.inBounds(nr, nc)) continue;
      if (visited[grid.toId(nr, nc)]) continue;
      options.push([nr, nc, row + dr / 2, col + dc / 2]);
    }
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const [nr, nc, wr, wc] = options[Math.floor(Math.random() * options.length)];
    visited[grid.toId(nr, nc)] = 1;
    carve(wr, wc);
    carve(nr, nc);
    stack.push([nr, nc]);
  }

  placeDefaultStartEnd(grid);
  return grid;
}

export const recursiveBacktrackingGenerator: MazeGenerator = {
  id: 'recursive-backtracking',
  name: 'Recursive Backtracking',
  description: 'A depth-first "perfect maze" generator — every open cell is reachable via exactly one path.',
  generate,
};
