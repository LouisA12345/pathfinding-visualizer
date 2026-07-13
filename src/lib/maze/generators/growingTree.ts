import { CellType, Grid } from '@/lib/grid/Grid';
import { MazeGenerator } from '../types';
import { placeDefaultStartEnd } from '../placement';

const CELL_DIRS: [number, number][] = [
  [-2, 0],
  [2, 0],
  [0, -2],
  [0, 2],
];

/**
 * Growing Tree: keeps a list of "active" cells and repeatedly extends from
 * one of them, chosen either as the newest (pure backtracking behavior) or
 * at random (Prim-like behavior). Mixing both produces long corridors with
 * moderate branching — a texture distinct from either pure strategy.
 */
function generate(width: number, height: number): Grid {
  const grid = new Grid(width, height);
  grid.cellType.fill(CellType.Wall);
  const carve = (row: number, col: number) => grid.erase(grid.toId(row, col));
  const visited = new Uint8Array(grid.size);

  carve(0, 0);
  visited[grid.toId(0, 0)] = 1;
  const active: [number, number][] = [[0, 0]];

  while (active.length > 0) {
    const useNewest = Math.random() < 0.6;
    const idx = useNewest ? active.length - 1 : Math.floor(Math.random() * active.length);
    const [row, col] = active[idx];

    const options: [number, number, number, number][] = [];
    for (const [dr, dc] of CELL_DIRS) {
      const nr = row + dr;
      const nc = col + dc;
      if (!grid.inBounds(nr, nc)) continue;
      if (visited[grid.toId(nr, nc)]) continue;
      options.push([nr, nc, row + dr / 2, col + dc / 2]);
    }

    if (options.length === 0) {
      active.splice(idx, 1);
      continue;
    }

    const [nr, nc, wr, wc] = options[Math.floor(Math.random() * options.length)];
    visited[grid.toId(nr, nc)] = 1;
    carve(wr, wc);
    carve(nr, nc);
    active.push([nr, nc]);
  }

  placeDefaultStartEnd(grid);
  return grid;
}

export const growingTreeGenerator: MazeGenerator = {
  id: 'growing-tree',
  name: 'Growing Tree',
  description: 'A configurable hybrid of DFS and Prim — extends from the newest or a random active cell, producing long corridors with moderate branching.',
  generate,
};
