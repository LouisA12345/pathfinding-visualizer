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
 * Wilson's algorithm: builds a maze via loop-erased random walks. Unlike
 * DFS backtracking or Prim's, this produces an unbiased uniform spanning
 * tree — every possible perfect maze on the grid is equally likely.
 */
function generate(width: number, height: number): Grid {
  const grid = new Grid(width, height);
  grid.cellType.fill(CellType.Wall);
  const carve = (row: number, col: number) => grid.erase(grid.toId(row, col));

  const cells: [number, number][] = [];
  for (let r = 0; r < height; r += 2) {
    for (let c = 0; c < width; c += 2) {
      cells.push([r, c]);
    }
  }

  const inMaze = new Set<number>();
  const [startR, startC] = cells[Math.floor(Math.random() * cells.length)];
  carve(startR, startC);
  inMaze.add(grid.toId(startR, startC));

  for (const [cellR, cellC] of cells) {
    const originId = grid.toId(cellR, cellC);
    if (inMaze.has(originId)) continue;

    const path: number[] = [originId];
    const posInPath = new Map<number, number>([[originId, 0]]);
    let curRow = cellR;
    let curCol = cellC;

    while (!inMaze.has(grid.toId(curRow, curCol))) {
      const options: [number, number][] = [];
      for (const [dr, dc] of CELL_DIRS) {
        const nr = curRow + dr;
        const nc = curCol + dc;
        if (grid.inBounds(nr, nc)) options.push([nr, nc]);
      }
      const [nextRow, nextCol] = options[Math.floor(Math.random() * options.length)];
      const nextId = grid.toId(nextRow, nextCol);

      const loopIndex = posInPath.get(nextId);
      if (loopIndex !== undefined) {
        for (let i = loopIndex + 1; i < path.length; i++) posInPath.delete(path[i]);
        path.length = loopIndex + 1;
      } else {
        path.push(nextId);
        posInPath.set(nextId, path.length - 1);
      }
      curRow = nextRow;
      curCol = nextCol;
    }

    for (let i = 0; i < path.length; i++) {
      const [r, c] = grid.toRC(path[i]);
      carve(r, c);
      inMaze.add(path[i]);
      if (i > 0) {
        const [pr, pc] = grid.toRC(path[i - 1]);
        carve((pr + r) / 2, (pc + c) / 2);
      }
    }
  }

  placeDefaultStartEnd(grid);
  return grid;
}

export const wilsonGenerator: MazeGenerator = {
  id: 'wilson',
  name: "Wilson's Algorithm",
  description: 'Loop-erased random walks build an unbiased perfect maze — every layout is equally likely, unlike DFS or Prim.',
  generate,
};
