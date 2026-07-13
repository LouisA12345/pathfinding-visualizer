'use client';

import {
  Baseline,
  BoxSelect,
  Circle,
  ClipboardPaste,
  Copy,
  Eraser,
  Flag,
  FlipHorizontal2,
  FlipVertical2,
  MapPin,
  MapPinPlus,
  MousePointer2,
  PaintBucket,
  RotateCw,
  Slash,
  Square,
} from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useGridStore } from '@/store/gridStore';
import { TERRAIN_PRESETS } from '@/lib/grid/terrain';
import { copyCells } from '@/lib/grid/edits';
import { BrushSize, MaterialId, ShapeMode } from '@/types';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const MATERIALS: { id: MaterialId; label: string; icon?: React.ReactNode; color?: string }[] = [
  { id: 'wall', label: 'Wall', icon: <Square className="h-4 w-4" /> },
  { id: 'erase', label: 'Erase', icon: <Eraser className="h-4 w-4" /> },
  { id: 'start', label: 'Start', icon: <MapPin className="h-4 w-4" />, color: 'text-emerald-500' },
  { id: 'end', label: 'End', icon: <Flag className="h-4 w-4" />, color: 'text-red-500' },
  {
    id: 'extra-start',
    label: 'Extra start — multi-start mode: the run tries every start x goal combination and keeps the cheapest',
    icon: <MapPinPlus className="h-4 w-4" />,
    color: 'text-emerald-500',
  },
  {
    id: 'extra-end',
    label: 'Extra goal — multi-start mode: the run tries every start x goal combination and keeps the cheapest',
    icon: <MapPinPlus className="h-4 w-4" />,
    color: 'text-red-500',
  },
  {
    id: 'checkpoint',
    label: 'Checkpoint — the run is routed through these in the order you place them, start to end',
    icon: <Baseline className="h-4 w-4" />,
    color: 'text-purple-500',
  },
];

const SHAPES: { id: ShapeMode; label: string; icon: React.ReactNode }[] = [
  { id: 'freehand', label: 'Freehand brush', icon: <MousePointer2 className="h-4 w-4" /> },
  { id: 'rectangle', label: 'Rectangle fill', icon: <Square className="h-4 w-4" /> },
  { id: 'circle', label: 'Circle brush — drag from center out to set the radius', icon: <Circle className="h-4 w-4" /> },
  { id: 'line', label: 'Line tool', icon: <Slash className="h-4 w-4" /> },
  { id: 'bucket', label: 'Bucket fill', icon: <PaintBucket className="h-4 w-4" /> },
  { id: 'select', label: 'Select — drag a region to copy', icon: <BoxSelect className="h-4 w-4" /> },
];

const BRUSH_SIZES: BrushSize[] = [1, 2, 3, 5];

function SwatchButton({
  active,
  onClick,
  children,
  label,
  colorDot,
}: {
  active: boolean;
  onClick: () => void;
  children?: React.ReactNode;
  label: string;
  colorDot?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            aria-label={label}
            className={cn(
              'flex h-9 items-center justify-center rounded-lg border text-xs transition-colors',
              active ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
            )}
          />
        }
      >
        {colorDot ? <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: colorDot }} /> : children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function DrawToolsPanel() {
  const activeMaterial = useUiStore((s) => s.activeMaterial);
  const setActiveMaterial = useUiStore((s) => s.setActiveMaterial);
  const shapeMode = useUiStore((s) => s.shapeMode);
  const setShapeMode = useUiStore((s) => s.setShapeMode);
  const brushSize = useUiStore((s) => s.brushSize);
  const setBrushSize = useUiStore((s) => s.setBrushSize);
  const selection = useUiStore((s) => s.selection);
  const clipboard = useUiStore((s) => s.clipboard);
  const setSelection = useUiStore((s) => s.setSelection);
  const setClipboard = useUiStore((s) => s.setClipboard);

  const copySelection = () => {
    if (!selection) return;
    const { grid } = useGridStore.getState();
    setClipboard(copyCells(grid, selection.r1, selection.c1, selection.r2, selection.c2));
  };

  const startPaste = () => {
    if (!clipboard) return;
    setShapeMode('paste');
  };

  const applyTransform = (transform: 'rotate' | 'flip-h' | 'flip-v') => {
    const { grid, setGrid } = useGridStore.getState();
    const next = transform === 'rotate' ? grid.rotated90() : transform === 'flip-h' ? grid.mirroredHorizontal() : grid.mirroredVertical();
    setGrid(next);
    setSelection(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Material</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {MATERIALS.map((m) => (
            <SwatchButton
              key={m.id}
              label={m.label}
              active={activeMaterial === m.id}
              onClick={() => setActiveMaterial(m.id)}
            >
              <span className={m.color}>{m.icon}</span>
            </SwatchButton>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Terrain</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {TERRAIN_PRESETS.map((t) => {
            const material: MaterialId = `terrain-${t.key}` as MaterialId;
            return (
              <SwatchButton
                key={t.id}
                label={`${t.name} (weight ${t.weight})`}
                active={activeMaterial === material}
                onClick={() => setActiveMaterial(material)}
                colorDot={t.color}
              />
            );
          })}
        </div>
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label className="text-xs">Shape</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {SHAPES.map((s) => (
            <SwatchButton key={s.id} label={s.label} active={shapeMode === s.id} onClick={() => setShapeMode(s.id)}>
              {s.icon}
            </SwatchButton>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Brush size</Label>
        <div className={cn('grid grid-cols-4 gap-1.5', shapeMode !== 'freehand' && 'opacity-40')}>
          {BRUSH_SIZES.map((size) => (
            <SwatchButton
              key={size}
              label={`${size}×${size} brush`}
              active={brushSize === size}
              onClick={() => setBrushSize(size)}
            >
              {size}×{size}
            </SwatchButton>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {shapeMode === 'freehand'
            ? 'Start/End always place a single cell.'
            : 'Only affects the Freehand brush shape — Rectangle/Circle size from your drag, Line is 1 cell wide, Bucket fills the whole region.'}
        </p>
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label className="text-xs">Copy / paste</Label>
        <div className="grid grid-cols-2 gap-1.5">
          <Button variant="outline" size="sm" className="gap-1.5" disabled={!selection} onClick={copySelection} title="Copy (Ctrl+C)">
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={!clipboard} onClick={startPaste} title="Paste (Ctrl+V)">
            <ClipboardPaste className="h-3.5 w-3.5" /> Paste
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {shapeMode === 'select'
            ? 'Drag a region on the grid, then Copy (or press Ctrl+C).'
            : shapeMode === 'paste'
              ? 'Click once on the grid to place it there — Esc to cancel.'
              : 'Pick Select above, drag a region, then Copy (Ctrl+C) / Paste (Ctrl+V).'}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Transform whole grid</Label>
        <div className="grid grid-cols-3 gap-1.5">
          <SwatchButton label="Rotate 90° clockwise" active={false} onClick={() => applyTransform('rotate')}>
            <RotateCw className="h-4 w-4" />
          </SwatchButton>
          <SwatchButton label="Mirror left-right" active={false} onClick={() => applyTransform('flip-h')}>
            <FlipHorizontal2 className="h-4 w-4" />
          </SwatchButton>
          <SwatchButton label="Mirror top-bottom" active={false} onClick={() => applyTransform('flip-v')}>
            <FlipVertical2 className="h-4 w-4" />
          </SwatchButton>
        </div>
      </div>
    </div>
  );
}
