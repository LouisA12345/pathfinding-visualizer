'use client';

import { useState } from 'react';
import { useGridStore } from '@/store/gridStore';
import { GRID_SIZE_PRESETS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function GridSizeControl() {
  const width = useGridStore((s) => s.grid.width);
  const height = useGridStore((s) => s.grid.height);
  const resize = useGridStore((s) => s.resize);
  const [customWidth, setCustomWidth] = useState(String(width));
  const [customHeight, setCustomHeight] = useState(String(height));
  const [open, setOpen] = useState(false);

  const matchedPreset = GRID_SIZE_PRESETS.find((p) => p.width === width && p.height === height);

  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={matchedPreset?.id ?? 'custom'}
        onValueChange={(value) => {
          if (value === 'custom') {
            setOpen(true);
            return;
          }
          const preset = GRID_SIZE_PRESETS.find((p) => p.id === value);
          if (preset) resize(preset.width, preset.height);
        }}
      >
        <SelectTrigger className="h-8 w-[132px] text-xs" aria-label="Grid size preset">
          <SelectValue placeholder="Grid size" />
        </SelectTrigger>
        <SelectContent>
          {GRID_SIZE_PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              {preset.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom…</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="outline" size="sm" className="h-8 text-xs" />}>
          {width}×{height}
        </PopoverTrigger>
        <PopoverContent className="w-56 space-y-3" align="start">
          <div className="space-y-1.5">
            <Label htmlFor="grid-w" className="text-xs">
              Width
            </Label>
            <Input
              id="grid-w"
              type="number"
              min={5}
              max={300}
              value={customWidth}
              onChange={(e) => setCustomWidth(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="grid-h" className="text-xs">
              Height
            </Label>
            <Input
              id="grid-h"
              type="number"
              min={5}
              max={300}
              value={customHeight}
              onChange={(e) => setCustomHeight(e.target.value)}
              className="h-8"
            />
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              const w = Math.min(300, Math.max(5, Math.round(Number(customWidth) || width)));
              const h = Math.min(300, Math.max(5, Math.round(Number(customHeight) || height)));
              resize(w, h);
              setOpen(false);
            }}
          >
            Apply size
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
