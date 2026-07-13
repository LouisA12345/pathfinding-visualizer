import { Grid, CellType } from '@/lib/grid/Grid';
import { getTerrainPreset } from '@/lib/grid/terrain';
import { getPalette } from '@/lib/grid/palette';
import { VizStateCache } from '@/lib/engine/vizStateCache';
import { renderGrid } from '@/lib/engine/renderGrid';
import { VisualizerSettings } from '@/types';

function computeCellSize(grid: Grid): number {
  const maxDim = Math.max(grid.width, grid.height);
  return Math.max(2, Math.min(32, Math.floor(1600 / maxDim)));
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportGridAsPng(
  grid: Grid,
  theme: 'light' | 'dark',
  settings: VisualizerSettings,
  name: string
): void {
  const cellSize = computeCellSize(grid);
  const canvas = document.createElement('canvas');
  canvas.width = grid.width * cellSize;
  canvas.height = grid.height * cellSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const palette = getPalette(theme, settings.highContrast);
  const viz = new VizStateCache(grid.size);
  renderGrid({
    ctx,
    grid,
    camera: { offsetX: 0, offsetY: 0, cellSize },
    viz,
    palette,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    settings: { ...settings, showCoordinates: false, showCosts: false },
  });

  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, `${name}.png`);
  }, 'image/png');
}

export function exportGridAsSvg(grid: Grid, theme: 'light' | 'dark', settings: VisualizerSettings, name: string): void {
  const cellSize = computeCellSize(grid);
  const palette = getPalette(theme, settings.highContrast);
  const width = grid.width * cellSize;
  const height = grid.height * cellSize;
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="${palette.background}" />`,
  ];

  for (let r = 0; r < grid.height; r++) {
    for (let c = 0; c < grid.width; c++) {
      const id = grid.toId(r, c);
      const type = grid.cellType[id];
      const x = c * cellSize;
      const y = r * cellSize;
      let fill = palette.background;
      if (type === CellType.Wall) {
        fill = palette.wall;
      } else {
        const terrainId = grid.terrainId[id];
        if (terrainId > 0) {
          const preset = getTerrainPreset(terrainId);
          if (preset) fill = preset.color;
        }
      }
      if (fill !== palette.background) {
        parts.push(`<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fill}" />`);
      }
      if (type === CellType.Start || type === CellType.End || type === CellType.Checkpoint) {
        const color = type === CellType.Start ? palette.start : type === CellType.End ? palette.end : palette.checkpoint;
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;
        parts.push(`<circle cx="${cx}" cy="${cy}" r="${Math.max(1, cellSize * 0.32)}" fill="${color}" />`);
      }
    }
  }

  parts.push('</svg>');
  downloadBlob(new Blob([parts.join('\n')], { type: 'image/svg+xml' }), `${name}.svg`);
}
