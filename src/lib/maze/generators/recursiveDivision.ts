import { Grid } from '@/lib/grid/Grid';
import { MazeGenerator } from '../types';
import { placeDefaultStartEnd } from '../placement';

type Orientation = 'horizontal' | 'vertical';

interface Cell {
  row: number;
  col: number;
}

function chooseOrientation(w: number, h: number): Orientation {
  if (w < h) return 'horizontal';
  if (w > h) return 'vertical';
  return Math.random() < 0.5 ? 'horizontal' : 'vertical';
}

/**
 * Divides a chamber with a single-passage wall, recursing into both halves.
 *
 * `protectedCells` are cells that MUST stay open because a passage from an
 * ancestor division depends on them — without this, a deeper division's own
 * wall can coincidentally run straight through the one cell that connects a
 * chamber back to the rest of the maze, silently disconnecting it. Each
 * division protects its own new connector cells for its two children, plus
 * re-threads any inherited ones down to whichever child actually contains them.
 */
function divide(grid: Grid, x: number, y: number, w: number, h: number, orientation: Orientation, protectedCells: Cell[]): void {
  if (w < 4 || h < 4) return;
  const isProtected = (row: number, col: number) => protectedCells.some((p) => p.row === row && p.col === col);

  if (orientation === 'horizontal') {
    const wallY = y + 1 + Math.floor(Math.random() * (h - 2));
    const passageX = x + Math.floor(Math.random() * w);
    for (let cx = x; cx < x + w; cx++) {
      if (cx === passageX || isProtected(wallY, cx)) continue;
      grid.setWall(grid.toId(wallY, cx));
    }

    const topProtected: Cell[] = [{ row: wallY - 1, col: passageX }];
    const bottomProtected: Cell[] = [{ row: wallY + 1, col: passageX }];
    for (const p of protectedCells) {
      if (p.row >= y && p.row < wallY) topProtected.push(p);
      else if (p.row > wallY && p.row < y + h) bottomProtected.push(p);
    }

    divide(grid, x, y, w, wallY - y, chooseOrientation(w, wallY - y), topProtected);
    divide(grid, x, wallY + 1, w, y + h - (wallY + 1), chooseOrientation(w, y + h - (wallY + 1)), bottomProtected);
  } else {
    const wallX = x + 1 + Math.floor(Math.random() * (w - 2));
    const passageY = y + Math.floor(Math.random() * h);
    for (let cy = y; cy < y + h; cy++) {
      if (cy === passageY || isProtected(cy, wallX)) continue;
      grid.setWall(grid.toId(cy, wallX));
    }

    const leftProtected: Cell[] = [{ row: passageY, col: wallX - 1 }];
    const rightProtected: Cell[] = [{ row: passageY, col: wallX + 1 }];
    for (const p of protectedCells) {
      if (p.col >= x && p.col < wallX) leftProtected.push(p);
      else if (p.col > wallX && p.col < x + w) rightProtected.push(p);
    }

    divide(grid, x, y, wallX - x, h, chooseOrientation(wallX - x, h), leftProtected);
    divide(grid, wallX + 1, y, x + w - (wallX + 1), h, chooseOrientation(x + w - (wallX + 1), h), rightProtected);
  }
}

function generate(width: number, height: number): Grid {
  const grid = new Grid(width, height);
  divide(grid, 0, 0, width, height, chooseOrientation(width, height), []);
  placeDefaultStartEnd(grid);
  return grid;
}

export const recursiveDivisionGenerator: MazeGenerator = {
  id: 'recursive-division',
  name: 'Recursive Division',
  description: 'Recursively splits the grid into chambers with a single passage each, producing room-like structures.',
  generate,
};
