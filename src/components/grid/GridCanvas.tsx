'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useGridStore } from '@/store/gridStore';
import { useAlgorithmStore } from '@/store/algorithmStore';
import { useUiStore } from '@/store/uiStore';
import { useViewStore } from '@/store/viewStore';
import { VizStateCache } from '@/lib/engine/vizStateCache';
import { getPalette } from '@/lib/grid/palette';
import { Camera, renderGrid } from '@/lib/engine/renderGrid';
import { rectCells, lineCells, circleCells } from '@/lib/grid/edits';
import { useGridInteraction } from '@/hooks/useGridInteraction';

const MIN_CELL_SIZE = 2;
const MAX_CELL_SIZE = 80;

export function GridCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera>({ offsetX: 0, offsetY: 0, cellSize: 22 });
  const dimsRef = useRef({ width: 0, height: 0, dpr: 1 });
  const rafRef = useRef<number | null>(null);
  const drawRef = useRef<() => void>(() => {});
  const firstFitDoneRef = useRef(false);

  const grid = useGridStore((s) => s.grid);
  const gridVersion = useGridStore((s) => s.version);
  const result = useAlgorithmStore((s) => s.result);
  const currentStepIndex = useAlgorithmStore((s) => s.currentStepIndex);
  const theme = useUiStore((s) => s.theme);
  const settings = useUiStore((s) => s.settings);
  const isPanMode = useUiStore((s) => s.isPanMode);
  const selection = useUiStore((s) => s.selection);
  const fitToken = useViewStore((s) => s.fitToken);
  const zoomInToken = useViewStore((s) => s.zoomInToken);
  const zoomOutToken = useViewStore((s) => s.zoomOutToken);

  const vizCache = useMemo(() => new VizStateCache(grid.size), [grid.size]);

  const scheduleDraw = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      drawRef.current();
    });
  }, []);

  const { previewRef, handlers } = useGridInteraction({ containerRef, cameraRef, scheduleDraw });

  const fitToView = useCallback(() => {
    const { width, height } = dimsRef.current;
    if (width === 0 || height === 0) return;
    const fit = Math.min(width / grid.width, height / grid.height);
    const cellSize = Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, Math.min(settings.nodeSize, fit)));
    cameraRef.current = {
      cellSize,
      offsetX: (width - grid.width * cellSize) / 2,
      offsetY: (height - grid.height * cellSize) / 2,
    };
  }, [grid.width, grid.height, settings.nodeSize]);

  const zoomByFactor = useCallback(
    (factor: number) => {
      const { width, height } = dimsRef.current;
      if (width === 0 || height === 0) return;
      const camera = cameraRef.current;
      const cx = width / 2;
      const cy = height / 2;
      const worldX = (cx - camera.offsetX) / camera.cellSize;
      const worldY = (cy - camera.offsetY) / camera.cellSize;
      const newCellSize = Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, camera.cellSize * factor));
      camera.cellSize = newCellSize;
      camera.offsetX = cx - worldX * newCellSize;
      camera.offsetY = cy - worldY * newCellSize;
      scheduleDraw();
    },
    [scheduleDraw]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { width, height, dpr } = dimsRef.current;
    if (width === 0 || height === 0) return;

    vizCache.update(result, currentStepIndex);
    const palette = getPalette(theme, settings.highContrast);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const usedStartId = result?.stats.success ? result.path[0] : undefined;
    const usedEndId = result?.stats.success ? result.path[result.path.length - 1] : undefined;
    renderGrid({
      ctx,
      grid,
      camera: cameraRef.current,
      viz: vizCache,
      palette,
      canvasWidth: width,
      canvasHeight: height,
      settings,
      usedStartId,
      usedEndId,
    });

    const preview = previewRef.current;
    if (preview) {
      const { offsetX, offsetY, cellSize } = cameraRef.current;
      if (preview.mode === 'select') {
        const r1 = Math.min(preview.startRow, preview.endRow);
        const r2 = Math.max(preview.startRow, preview.endRow);
        const c1 = Math.min(preview.startCol, preview.endCol);
        const c2 = Math.max(preview.startCol, preview.endCol);
        ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(15,23,42,0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(offsetX + c1 * cellSize, offsetY + r1 * cellSize, (c2 - c1 + 1) * cellSize, (r2 - r1 + 1) * cellSize);
        ctx.setLineDash([]);
      } else {
        const ids =
          preview.mode === 'rectangle'
            ? rectCells(grid, preview.startRow, preview.startCol, preview.endRow, preview.endCol)
            : preview.mode === 'circle'
              ? circleCells(grid, preview.startRow, preview.startCol, Math.hypot(preview.endRow - preview.startRow, preview.endCol - preview.startCol))
              : lineCells(preview.startRow, preview.startCol, preview.endRow, preview.endCol)
                  .filter(([r, c]) => grid.inBounds(r, c))
                  .map(([r, c]) => grid.toId(r, c));
        ctx.fillStyle = theme === 'dark' ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.28)';
        for (const id of ids) {
          const [r, c] = grid.toRC(id);
          ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize);
        }
      }
    } else if (selection) {
      const { offsetX, offsetY, cellSize } = cameraRef.current;
      const r1 = Math.min(selection.r1, selection.r2);
      const r2 = Math.max(selection.r1, selection.r2);
      const c1 = Math.min(selection.c1, selection.c2);
      const c2 = Math.max(selection.c1, selection.c2);
      ctx.strokeStyle = theme === 'dark' ? 'rgba(96,165,250,0.9)' : 'rgba(37,99,235,0.9)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(offsetX + c1 * cellSize, offsetY + r1 * cellSize, (c2 - c1 + 1) * cellSize, (r2 - r1 + 1) * cellSize);
      ctx.setLineDash([]);
    }
  }, [grid, result, currentStepIndex, theme, settings, vizCache, previewRef, selection]);

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dimsRef.current = { width, height, dpr };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (!firstFitDoneRef.current && width > 0 && height > 0) {
        firstFitDoneRef.current = true;
        fitToView();
      }
      scheduleDraw();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [fitToView, scheduleDraw]);

  useEffect(() => {
    fitToView();
    scheduleDraw();
  }, [grid.width, grid.height, fitToView, scheduleDraw]);

  useEffect(() => {
    scheduleDraw();
  }, [gridVersion, result, currentStepIndex, theme, settings, selection, scheduleDraw]);

  useEffect(() => {
    if (fitToken === 0) return;
    fitToView();
    scheduleDraw();
  }, [fitToken, fitToView, scheduleDraw]);

  useEffect(() => {
    if (zoomInToken === 0) return;
    zoomByFactor(1.3);
  }, [zoomInToken, zoomByFactor]);

  useEffect(() => {
    if (zoomOutToken === 0) return;
    zoomByFactor(1 / 1.3);
  }, [zoomOutToken, zoomByFactor]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full touch-none overflow-hidden select-none ${isPanMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
      role="application"
      aria-label="Pathfinding grid — draw walls, place start and end nodes, and visualize algorithms"
      {...handlers}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
