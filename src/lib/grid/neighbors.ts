import { Grid } from './Grid';

const ORTHOGONAL: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const DIAGONAL: [number, number][] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

export interface Neighbor {
  id: number;
  cost: number;
}

/**
 * Returns walkable neighbors of `id`. When `diagonal` is enabled, a diagonal
 * move is only allowed if `cornerCutting` is true, or if at least one of the
 * two orthogonal cells adjacent to that diagonal is walkable (standard
 * "no cutting through a wall corner" rule).
 */
export function getNeighbors(
  grid: Grid,
  id: number,
  diagonal: boolean,
  cornerCutting: boolean
): Neighbor[] {
  const [row, col] = grid.toRC(id);
  const result: Neighbor[] = [];

  for (const [dr, dc] of ORTHOGONAL) {
    const r = row + dr;
    const c = col + dc;
    if (!grid.inBounds(r, c)) continue;
    const nid = grid.toId(r, c);
    if (!grid.isWalkable(nid)) continue;
    result.push({ id: nid, cost: grid.weight[nid] });
  }

  if (diagonal) {
    for (const [dr, dc] of DIAGONAL) {
      const r = row + dr;
      const c = col + dc;
      if (!grid.inBounds(r, c)) continue;
      const nid = grid.toId(r, c);
      if (!grid.isWalkable(nid)) continue;

      if (!cornerCutting) {
        const sideA = grid.inBounds(row + dr, col) && grid.isWalkable(grid.toId(row + dr, col));
        const sideB = grid.inBounds(row, col + dc) && grid.isWalkable(grid.toId(row, col + dc));
        if (!sideA || !sideB) continue;
      }

      result.push({ id: nid, cost: grid.weight[nid] * Math.SQRT2 });
    }
  }

  return result;
}

export function chebyshevOrOctileDistance(
  grid: Grid,
  aId: number,
  bId: number,
  diagonal: boolean
): number {
  const [ar, ac] = grid.toRC(aId);
  const [br, bc] = grid.toRC(bId);
  const dr = Math.abs(ar - br);
  const dc = Math.abs(ac - bc);
  if (!diagonal) return dr + dc;
  return dr + dc + (Math.SQRT2 - 2) * Math.min(dr, dc);
}
