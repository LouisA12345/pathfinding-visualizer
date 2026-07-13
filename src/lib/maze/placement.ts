import { Grid } from '@/lib/grid/Grid';

const DIRS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function findNearestOpen(grid: Grid, row: number, col: number, avoidId: number): number {
  const clampedRow = Math.min(Math.max(row, 0), grid.height - 1);
  const clampedCol = Math.min(Math.max(col, 0), grid.width - 1);
  const originId = grid.toId(clampedRow, clampedCol);

  const visited = new Uint8Array(grid.size);
  const queue: number[] = [originId];
  visited[originId] = 1;
  let head = 0;

  while (head < queue.length) {
    const id = queue[head++];
    if (grid.isWalkable(id) && id !== avoidId) return id;
    const [r, c] = grid.toRC(id);
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (!grid.inBounds(nr, nc)) continue;
      const nid = grid.toId(nr, nc);
      if (visited[nid]) continue;
      visited[nid] = 1;
      queue.push(nid);
    }
  }
  return originId;
}

/** Places the start near the top-left and the end near the bottom-right, snapping to the nearest walkable cell. */
export function placeDefaultStartEnd(grid: Grid): void {
  const startId = findNearestOpen(grid, 0, 0, -1);
  grid.setStart(startId);
  const endId = findNearestOpen(grid, grid.height - 1, grid.width - 1, startId);
  grid.setEnd(endId);
}
