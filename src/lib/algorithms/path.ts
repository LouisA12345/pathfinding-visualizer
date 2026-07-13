import { Grid } from '@/lib/grid/Grid';

/**
 * Expands a path of waypoints into every intermediate cell via Bresenham's
 * line algorithm. Most algorithms already return cell-by-cell paths (a
 * no-op here). Grid-jumping algorithms like JPS return only their jump
 * points (always 45°-aligned), and any-angle algorithms like Theta* return
 * waypoints at arbitrary slopes — Bresenham handles both correctly, since a
 * pure orthogonal/diagonal line is just a special case of it.
 */
export function densifyPath(grid: Grid, path: number[]): number[] {
  if (path.length < 2) return path;
  const dense: number[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const [ar, ac] = grid.toRC(path[i - 1]);
    const [br, bc] = grid.toRC(path[i]);
    let r = ar;
    let c = ac;
    const dr = Math.abs(br - ar);
    const dc = Math.abs(bc - ac);
    const sr = br > ar ? 1 : -1;
    const sc = bc > ac ? 1 : -1;
    let err = dr - dc;

    while (r !== br || c !== bc) {
      const e2 = err * 2;
      if (e2 > -dc) {
        err -= dc;
        r += sr;
      }
      if (e2 < dr) {
        err += dr;
        c += sc;
      }
      dense.push(grid.toId(r, c));
    }
  }
  return dense;
}

export function reconstructPath(parent: Int32Array, startId: number, endId: number): number[] {
  if (startId === endId) return [startId];
  if (parent[endId] === -1) return [];
  const path: number[] = [];
  let cur = endId;
  const seen = new Set<number>();
  while (cur !== -1) {
    if (seen.has(cur)) return [];
    seen.add(cur);
    path.push(cur);
    if (cur === startId) break;
    cur = parent[cur];
  }
  if (path[path.length - 1] !== startId) return [];
  path.reverse();
  return path;
}
