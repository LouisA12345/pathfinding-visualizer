'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useGridStore } from '@/store/gridStore';
import { useCompareStore } from '@/store/compareStore';
import { useUiStore } from '@/store/uiStore';
import { getAlgorithm } from '@/lib/algorithms/registry';
import { VizStateCache } from '@/lib/engine/vizStateCache';
import { getPalette } from '@/lib/grid/palette';
import { renderGrid } from '@/lib/engine/renderGrid';
import { computeLiveStats } from '@/hooks/useLiveStats';
import { Badge } from '@/components/ui/badge';

const MIN_CELL_SIZE = 1;
const MAX_CELL_SIZE = 40;

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function CompareGridPanel({ algorithmId, isWinner }: { algorithmId: string; isWinner: boolean }) {
  const grid = useGridStore((s) => s.grid);
  const gridVersion = useGridStore((s) => s.version);
  const result = useCompareStore((s) => s.results[algorithmId] ?? null);
  const currentTick = useCompareStore((s) => s.currentTick);
  const theme = useUiStore((s) => s.theme);
  const settings = useUiStore((s) => s.settings);
  const def = getAlgorithm(algorithmId);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimsRef = useRef({ width: 0, height: 0, dpr: 1 });
  const rafRef = useRef<number | null>(null);
  const drawRef = useRef<() => void>(() => {});

  const vizCache = useMemo(() => new VizStateCache(grid.size), [grid.size]);
  const effectiveIndex = result ? Math.min(currentTick, result.steps.length - 1) : 0;

  const scheduleDraw = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      drawRef.current();
    });
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { width, height, dpr } = dimsRef.current;
    if (width === 0 || height === 0) return;

    vizCache.update(result, effectiveIndex);
    const palette = getPalette(theme, settings.highContrast);
    const fit = Math.min(width / grid.width, height / grid.height);
    const cellSize = Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, fit));
    const camera = {
      cellSize,
      offsetX: (width - grid.width * cellSize) / 2,
      offsetY: (height - grid.height * cellSize) / 2,
    };

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderGrid({
      ctx,
      grid,
      camera,
      viz: vizCache,
      palette,
      canvasWidth: width,
      canvasHeight: height,
      settings: { ...settings, showCoordinates: false, showCosts: false },
    });
  }, [grid, result, effectiveIndex, theme, settings, vizCache]);

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
      scheduleDraw();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [scheduleDraw]);

  useEffect(() => {
    scheduleDraw();
  }, [gridVersion, result, effectiveIndex, theme, settings, scheduleDraw]);

  const stats = computeLiveStats(result, effectiveIndex);

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-2.5 py-1.5">
        <span className="truncate text-xs font-medium">{def?.name ?? algorithmId}</span>
        {isWinner && (
          <Badge variant="outline" className="shrink-0 border-emerald-500/30 text-[10px] text-emerald-500">
            Winner
          </Badge>
        )}
      </div>
      <div ref={containerRef} className="relative min-h-[140px] flex-1">
        <canvas ref={canvasRef} className="block" />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 border-t p-2 text-[11px]">
        <StatRow label="Visited" value={stats.hasResult ? String(stats.visited) : '—'} />
        <StatRow label="Path len" value={stats.pathLength > 0 ? String(stats.pathLength) : '—'} />
        <StatRow label="Runtime" value={stats.hasResult ? `${stats.runtimeMs.toFixed(2)}ms` : '—'} />
        <StatRow label="Steps" value={stats.hasResult ? `${stats.stepsCompleted}/${stats.totalSteps}` : '—'} />
        <StatRow
          label="Result"
          value={stats.success === null ? '…' : stats.success ? 'Found' : stats.aborted ? 'Gave up' : 'No path'}
        />
        <StatRow label="Optimal?" value={def?.meta.optimal ? 'Yes' : 'No'} />
      </div>
    </div>
  );
}
