import { CellType, Grid } from './Grid';
import { TERRAIN_PRESETS } from './terrain';
import { MaterialId } from '@/types';

export function applyMaterial(grid: Grid, material: MaterialId, id: number): void {
  switch (material) {
    case 'wall':
      grid.setWall(id);
      return;
    case 'erase':
      grid.erase(id);
      return;
    case 'start':
      grid.setStart(id);
      return;
    case 'end':
      grid.setEnd(id);
      return;
    case 'extra-start':
      grid.addStart(id);
      return;
    case 'extra-end':
      grid.addEnd(id);
      return;
    case 'checkpoint':
      grid.setCheckpoint(id);
      return;
    default: {
      const key = material.replace('terrain-', '');
      const preset = TERRAIN_PRESETS.find((t) => t.key === key);
      if (preset) grid.setTerrain(id, preset.id, preset.weight);
    }
  }
}

export function brushCells(grid: Grid, centerRow: number, centerCol: number, size: number): number[] {
  const half = Math.floor((size - 1) / 2);
  const ids: number[] = [];
  for (let dr = -half; dr <= size - 1 - half; dr++) {
    for (let dc = -half; dc <= size - 1 - half; dc++) {
      const r = centerRow + dr;
      const c = centerCol + dc;
      if (!grid.inBounds(r, c)) continue;
      ids.push(grid.toId(r, c));
    }
  }
  return ids;
}

export function rectCells(grid: Grid, r1: number, c1: number, r2: number, c2: number): number[] {
  const rowStart = Math.min(r1, r2);
  const rowEnd = Math.max(r1, r2);
  const colStart = Math.min(c1, c2);
  const colEnd = Math.max(c1, c2);
  const ids: number[] = [];
  for (let r = rowStart; r <= rowEnd; r++) {
    for (let c = colStart; c <= colEnd; c++) {
      if (!grid.inBounds(r, c)) continue;
      ids.push(grid.toId(r, c));
    }
  }
  return ids;
}

/** All cells within `radius` (Euclidean, inclusive) of a center cell. */
export function circleCells(grid: Grid, centerRow: number, centerCol: number, radius: number): number[] {
  const r = Math.max(0, Math.round(radius));
  const ids: number[] = [];
  for (let dr = -r; dr <= r; dr++) {
    for (let dc = -r; dc <= r; dc++) {
      if (dr * dr + dc * dc > r * r + 0.5) continue;
      const row = centerRow + dr;
      const col = centerCol + dc;
      if (!grid.inBounds(row, col)) continue;
      ids.push(grid.toId(row, col));
    }
  }
  return ids;
}

/** Bresenham line between two grid cells (inclusive of both endpoints). */
export function lineCells(r1: number, c1: number, r2: number, c2: number): [number, number][] {
  const points: [number, number][] = [];
  let r = r1;
  let c = c1;
  const dr = Math.abs(r2 - r1);
  const dc = Math.abs(c2 - c1);
  const sr = r2 > r1 ? 1 : -1;
  const sc = c2 > c1 ? 1 : -1;
  let err = dr - dc;

  for (;;) {
    points.push([r, c]);
    if (r === r2 && c === c2) break;
    const e2 = err * 2;
    if (e2 > -dc) {
      err -= dc;
      r += sr;
    }
    if (e2 < dr) {
      err += dr;
      c += sc;
    }
  }
  return points;
}

export interface ClipboardData {
  width: number;
  height: number;
  cellType: number[];
  weight: number[];
  terrainId: number[];
}

/** Snapshots a rectangular region for later pasting. Out-of-bounds cells (a selection dragged past an edge) are recorded as empty. */
export function copyCells(grid: Grid, r1: number, c1: number, r2: number, c2: number): ClipboardData {
  const rowStart = Math.min(r1, r2);
  const rowEnd = Math.max(r1, r2);
  const colStart = Math.min(c1, c2);
  const colEnd = Math.max(c1, c2);
  const width = colEnd - colStart + 1;
  const height = rowEnd - rowStart + 1;
  const cellType: number[] = [];
  const weight: number[] = [];
  const terrainId: number[] = [];
  for (let r = rowStart; r <= rowEnd; r++) {
    for (let c = colStart; c <= colEnd; c++) {
      if (grid.inBounds(r, c)) {
        const id = grid.toId(r, c);
        cellType.push(grid.cellType[id]);
        weight.push(grid.weight[id]);
        terrainId.push(grid.terrainId[id]);
      } else {
        cellType.push(CellType.Empty);
        weight.push(1);
        terrainId.push(0);
      }
    }
  }
  return { width, height, cellType, weight, terrainId };
}

/**
 * Stamps a copied region at `anchorRow`/`anchorCol` (top-left corner).
 * Start/End cells in the clipboard become *extra* starts/goals at the
 * destination (via `addStart`/`addEnd`) rather than raw overwrites, so
 * pasting a region containing a start marker can't corrupt `Grid`'s own
 * start/end bookkeeping — it just adds another multi-start/goal marker.
 * Never overwrites the grid's current primary start/end cell.
 */
export function pasteClipboard(grid: Grid, clip: ClipboardData, anchorRow: number, anchorCol: number): void {
  for (let dr = 0; dr < clip.height; dr++) {
    for (let dc = 0; dc < clip.width; dc++) {
      const row = anchorRow + dr;
      const col = anchorCol + dc;
      if (!grid.inBounds(row, col)) continue;
      const id = grid.toId(row, col);
      if (id === grid.startId || id === grid.endId) continue;

      const idx = dr * clip.width + dc;
      const type = clip.cellType[idx];
      if (type === CellType.Start) grid.addStart(id);
      else if (type === CellType.End) grid.addEnd(id);
      else if (type === CellType.Checkpoint) grid.setCheckpoint(id);
      else if (type === CellType.Wall) grid.setWall(id);
      else grid.setTerrain(id, clip.terrainId[idx], clip.weight[idx]);
    }
  }
}

/** Flood-fills the contiguous region matching the seed cell's type/terrain (4-connected). */
export function bucketCells(grid: Grid, seedRow: number, seedCol: number): number[] {
  if (!grid.inBounds(seedRow, seedCol)) return [];
  const seedId = grid.toId(seedRow, seedCol);
  const targetType = grid.cellType[seedId];
  const targetTerrain = grid.terrainId[seedId];
  const visited = new Uint8Array(grid.size);
  const stack = [seedId];
  visited[seedId] = 1;
  const ids: number[] = [];

  while (stack.length > 0) {
    const id = stack.pop()!;
    ids.push(id);
    const [r, c] = grid.toRC(id);
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const nr = r + dr;
      const nc = c + dc;
      if (!grid.inBounds(nr, nc)) continue;
      const nid = grid.toId(nr, nc);
      if (visited[nid]) continue;
      if (grid.cellType[nid] !== targetType || grid.terrainId[nid] !== targetTerrain) continue;
      visited[nid] = 1;
      stack.push(nid);
    }
  }
  return ids;
}
