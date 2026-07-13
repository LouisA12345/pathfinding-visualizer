import { CellType, Grid } from '@/lib/grid/Grid';
import { MazeGenerator } from '../types';
import { placeDefaultStartEnd } from '../placement';

interface FrontierEntry {
  row: number;
  col: number;
  fromRow: number;
  fromCol: number;
}

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

  const addFrontier = (frontier: FrontierEntry[], row: number, col: number) => {
    for (const [dr, dc] of CELL_DIRS) {
      const nr = row + dr;
      const nc = col + dc;
      if (!grid.inBounds(nr, nc)) continue;
      if (visited[grid.toId(nr, nc)]) continue;
      frontier.push({ row: nr, col: nc, fromRow: row, fromCol: col });
    }
  };

  carve(0, 0);
  visited[grid.toId(0, 0)] = 1;
  const frontier: FrontierEntry[] = [];
  addFrontier(frontier, 0, 0);

  while (frontier.length > 0) {
    const idx = Math.floor(Math.random() * frontier.length);
    const { row, col, fromRow, fromCol } = frontier[idx];
    frontier[idx] = frontier[frontier.length - 1];
    frontier.pop();

    const id = grid.toId(row, col);
    if (visited[id]) continue;
    visited[id] = 1;
    carve(row, col);
    carve((row + fromRow) / 2, (col + fromCol) / 2);
    addFrontier(frontier, row, col);
  }

  placeDefaultStartEnd(grid);
  return grid;
}

export const primGenerator: MazeGenerator = {
  id: 'prim',
  name: "Prim's Maze",
  description: "Randomized Prim's algorithm — grows a maze outward from a random frontier of carveable walls.",
  generate,
};
