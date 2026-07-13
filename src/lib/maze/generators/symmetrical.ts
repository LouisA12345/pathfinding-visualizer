import { CellType, Grid } from '@/lib/grid/Grid';
import { MazeGenerator } from '../types';
import { placeDefaultStartEnd } from '../placement';

const CELL_DIRS: [number, number][] = [
  [-2, 0],
  [2, 0],
  [0, -2],
  [0, 2],
];

function carveQuadrant(grid: Grid, maxRow: number, maxCol: number): void {
  const carve = (row: number, col: number) => grid.erase(grid.toId(row, col));
  const visited = new Uint8Array(grid.size);

  carve(0, 0);
  visited[grid.toId(0, 0)] = 1;
  const stack: [number, number][] = [[0, 0]];

  while (stack.length > 0) {
    const [row, col] = stack[stack.length - 1];
    const options: [number, number, number, number][] = [];
    for (const [dr, dc] of CELL_DIRS) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nc < 0 || nr >= maxRow || nc >= maxCol) continue;
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
}

/** Carves a perfect maze on the top-left quadrant, then mirrors it across both axes. */
function generate(width: number, height: number): Grid {
  const grid = new Grid(width, height);
  grid.cellType.fill(CellType.Wall);

  const halfW = Math.ceil(width / 2);
  const halfH = Math.ceil(height / 2);
  carveQuadrant(grid, halfH, halfW);

  for (let r = 0; r < halfH; r++) {
    for (let c = 0; c < halfW; c++) {
      if (grid.cellType[grid.toId(r, c)] !== CellType.Wall) {
        grid.erase(grid.toId(r, width - 1 - c));
      }
    }
  }
  for (let r = 0; r < halfH; r++) {
    for (let c = 0; c < width; c++) {
      if (grid.cellType[grid.toId(r, c)] !== CellType.Wall) {
        grid.erase(grid.toId(height - 1 - r, c));
      }
    }
  }

  // Mirroring a lattice maze can leave a hard seam between quadrants with no
  // aligned passage crossing it, silently splitting the maze into four
  // disconnected mirror copies. The one guaranteed-connected point in every
  // copy is its corner (the DFS root at (0,0), and its mirror images at the
  // other three corners) — so forcing the entire outer border open threads
  // all four corners onto one loop, which transitively joins all four
  // quadrant trees into a single connected maze.
  for (let c = 0; c < width; c++) {
    grid.erase(grid.toId(0, c));
    grid.erase(grid.toId(height - 1, c));
  }
  for (let r = 0; r < height; r++) {
    grid.erase(grid.toId(r, 0));
    grid.erase(grid.toId(r, width - 1));
  }

  placeDefaultStartEnd(grid);
  return grid;
}

export const symmetricalGenerator: MazeGenerator = {
  id: 'symmetrical',
  name: 'Symmetrical',
  description: 'Carves one quadrant as a perfect maze, then mirrors it across both axes for a visually symmetric layout.',
  generate,
};
