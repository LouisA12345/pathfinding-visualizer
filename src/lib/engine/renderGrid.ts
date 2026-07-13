import { CellType, Grid } from '@/lib/grid/Grid';
import { getTerrainPreset } from '@/lib/grid/terrain';
import { GridPalette } from '@/lib/grid/palette';
import { VizState, VizStateCache } from './vizStateCache';
import { VisualizerSettings } from '@/types';
import { heuristicFor } from '@/lib/algorithms/heuristics';

export interface Camera {
  offsetX: number;
  offsetY: number;
  cellSize: number;
}

export interface RenderParams {
  ctx: CanvasRenderingContext2D;
  grid: Grid;
  camera: Camera;
  viz: VizStateCache;
  palette: GridPalette;
  canvasWidth: number;
  canvasHeight: number;
  settings: VisualizerSettings;
  /**
   * The start/goal actually used by the current result, when multi-start/
   * multi-goal markers are on the grid — `runAlgorithm` silently tries every
   * start×goal combination and keeps the cheapest, which otherwise gives no
   * visual sign of *which* pair that was. Any other Start/End marker is
   * rendered dimmed once these are set. Undefined (no result yet, or a
   * failed run) draws every marker at full strength.
   */
  usedStartId?: number;
  usedEndId?: number;
}

function visibleRange(camera: Camera, grid: Grid, canvasWidth: number, canvasHeight: number) {
  const { offsetX, offsetY, cellSize } = camera;
  const firstCol = Math.max(0, Math.floor(-offsetX / cellSize));
  const lastCol = Math.min(grid.width - 1, Math.ceil((canvasWidth - offsetX) / cellSize));
  const firstRow = Math.max(0, Math.floor(-offsetY / cellSize));
  const lastRow = Math.min(grid.height - 1, Math.ceil((canvasHeight - offsetY) / cellSize));
  return { firstRow, lastRow, firstCol, lastCol };
}

export function renderGrid(p: RenderParams): void {
  const { ctx, grid, camera, viz, palette, canvasWidth, canvasHeight, settings, usedStartId, usedEndId } = p;
  const { offsetX, offsetY, cellSize } = camera;

  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const { firstRow, lastRow, firstCol, lastCol } = visibleRange(camera, grid, canvasWidth, canvasHeight);
  if (firstRow > lastRow || firstCol > lastCol) return;

  const showHeuristics = settings.showHeuristics && grid.endId >= 0;
  const showLabels = cellSize >= 14 && (settings.showCoordinates || settings.showCosts || showHeuristics);
  const h = showHeuristics ? heuristicFor(settings.diagonalMovement) : null;

  for (let r = firstRow; r <= lastRow; r++) {
    const y = offsetY + r * cellSize;
    for (let c = firstCol; c <= lastCol; c++) {
      const id = grid.toId(r, c);
      const x = offsetX + c * cellSize;
      drawCell(ctx, grid, id, x, y, cellSize, palette, viz, settings, usedStartId, usedEndId);
    }
  }

  if (showLabels) {
    ctx.font = `${Math.max(7, cellSize * 0.24)}px ui-monospace, monospace`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = palette.text;
    for (let r = firstRow; r <= lastRow; r++) {
      const y = offsetY + r * cellSize;
      for (let c = firstCol; c <= lastCol; c++) {
        const id = grid.toId(r, c);
        if (grid.cellType[id] === CellType.Wall) continue;
        const x = offsetX + c * cellSize;
        if (settings.showCoordinates) ctx.fillText(`${r},${c}`, x + 2, y + 1);
        if (settings.showCosts) {
          const cost = viz.cost[id];
          if (!Number.isNaN(cost)) ctx.fillText(`g${cost.toFixed(1)}`, x + 2, y + cellSize * 0.36);
        }
        if (h) ctx.fillText(`h${h(grid, id, grid.endId).toFixed(1)}`, x + 2, y + cellSize * 0.68);
      }
    }
  }

  if (cellSize >= 6) {
    ctx.strokeStyle = palette.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = firstCol; c <= lastCol + 1; c++) {
      const x = Math.round(offsetX + c * cellSize) + 0.5;
      ctx.moveTo(x, offsetY + firstRow * cellSize);
      ctx.lineTo(x, offsetY + (lastRow + 1) * cellSize);
    }
    for (let r = firstRow; r <= lastRow + 1; r++) {
      const y = Math.round(offsetY + r * cellSize) + 0.5;
      ctx.moveTo(offsetX + firstCol * cellSize, y);
      ctx.lineTo(offsetX + (lastCol + 1) * cellSize, y);
    }
    ctx.stroke();
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  id: number,
  x: number,
  y: number,
  size: number,
  palette: GridPalette,
  viz: VizStateCache,
  settings: VisualizerSettings,
  usedStartId?: number,
  usedEndId?: number
): void {
  const type = grid.cellType[id];
  let fill = palette.background;

  if (type === CellType.Wall) {
    fill = palette.wall;
  } else {
    const terrainId = grid.terrainId[id];
    if (terrainId > 0) {
      const preset = getTerrainPreset(terrainId);
      if (preset) fill = preset.color;
    }
    const vizState = viz.state[id];
    if (vizState === VizState.Path) fill = palette.path;
    else if (vizState === VizState.Visited && settings.showVisited) fill = palette.visited;
    else if (vizState === VizState.Frontier && settings.showFrontier) fill = palette.frontier;
  }

  ctx.fillStyle = fill;
  ctx.fillRect(x, y, size, size);

  if (type === CellType.Start || type === CellType.End || type === CellType.Checkpoint) {
    const isUnused =
      (type === CellType.Start && usedStartId !== undefined && id !== usedStartId) ||
      (type === CellType.End && usedEndId !== undefined && id !== usedEndId);
    drawMarker(ctx, type, x, y, size, palette, isUnused);
  }
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  type: number,
  x: number,
  y: number,
  size: number,
  palette: GridPalette,
  isUnused = false
): void {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.32;
  const color = type === CellType.Start ? palette.start : type === CellType.End ? palette.end : palette.checkpoint;

  ctx.save();
  if (isUnused) ctx.globalAlpha = 0.35;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(2, r), 0, Math.PI * 2);
  ctx.fill();

  if (size >= 14) {
    const label = type === CellType.Start ? 'S' : type === CellType.End ? 'E' : 'C';
    ctx.fillStyle = palette.markerText;
    ctx.font = `600 ${Math.max(8, size * 0.42)}px ui-sans-serif, system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy + 0.5);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();
}

export function screenToCell(camera: Camera, screenX: number, screenY: number): [row: number, col: number] {
  const col = Math.floor((screenX - camera.offsetX) / camera.cellSize);
  const row = Math.floor((screenY - camera.offsetY) / camera.cellSize);
  return [row, col];
}
