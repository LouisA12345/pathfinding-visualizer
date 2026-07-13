import { Grid } from '@/lib/grid/Grid';

export function manhattan(grid: Grid, aId: number, bId: number): number {
  const [ar, ac] = grid.toRC(aId);
  const [br, bc] = grid.toRC(bId);
  return Math.abs(ar - br) + Math.abs(ac - bc);
}

export function octile(grid: Grid, aId: number, bId: number): number {
  const [ar, ac] = grid.toRC(aId);
  const [br, bc] = grid.toRC(bId);
  const dr = Math.abs(ar - br);
  const dc = Math.abs(ac - bc);
  return dr + dc + (Math.SQRT2 - 2) * Math.min(dr, dc);
}

export function euclidean(grid: Grid, aId: number, bId: number): number {
  const [ar, ac] = grid.toRC(aId);
  const [br, bc] = grid.toRC(bId);
  return Math.hypot(ar - br, ac - bc);
}

export function heuristicFor(diagonal: boolean) {
  return diagonal ? octile : manhattan;
}
