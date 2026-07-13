'use client';

import { Pause, Play, RotateCcw, SkipForward, Square, StepBack, StepForward } from 'lucide-react';
import { useCompareStore } from '@/store/compareStore';
import { useGridStore } from '@/store/gridStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onClick} disabled={disabled} aria-label={label} />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function CompareControls() {
  const runState = useCompareStore((s) => s.runState);
  const results = useCompareStore((s) => s.results);
  const currentTick = useCompareStore((s) => s.currentTick);
  const speed = useCompareStore((s) => s.speed);
  const selectedIds = useCompareStore((s) => s.selectedIds);
  const { start, pause, play, stop, reset, stepForward, stepBackward, skipToEnd, setSpeed } =
    useCompareStore.getState();
  const startId = useGridStore((s) => s.grid.startId);
  const endId = useGridStore((s) => s.grid.endId);

  const hasResults = Object.keys(results).length > 0;
  const maxSteps = Math.max(1, ...Object.values(results).map((r) => r?.steps.length ?? 1));
  const atStart = currentTick <= 0;
  const atEnd = hasResults && currentTick >= maxSteps - 1;
  const canRun = startId >= 0 && endId >= 0 && selectedIds.length >= 2;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <IconButton
        label={canRun ? 'Start comparison (from beginning)' : 'Select at least 2 algorithms and place start/end'}
        onClick={start}
        disabled={!canRun}
      >
        <Play className="h-4 w-4" />
      </IconButton>
      <IconButton label="Pause" onClick={pause} disabled={runState !== 'playing'}>
        <Pause className="h-4 w-4" />
      </IconButton>
      <IconButton label="Resume" onClick={play} disabled={!canRun || !hasResults || runState === 'playing' || atEnd}>
        <Play className="h-4 w-4 opacity-70" />
      </IconButton>
      <IconButton label="Stop (halt at current step)" onClick={stop} disabled={!hasResults}>
        <Square className="h-4 w-4" />
      </IconButton>
      <IconButton label="Reset (clear results)" onClick={reset} disabled={!hasResults}>
        <RotateCcw className="h-4 w-4" />
      </IconButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <IconButton label="Step back" onClick={stepBackward} disabled={!hasResults || atStart}>
        <StepBack className="h-4 w-4" />
      </IconButton>
      <IconButton label="Step forward" onClick={stepForward} disabled={!hasResults || atEnd}>
        <StepForward className="h-4 w-4" />
      </IconButton>
      <IconButton label="Skip to end" onClick={skipToEnd} disabled={!hasResults || atEnd}>
        <SkipForward className="h-4 w-4" />
      </IconButton>

      <div className="ml-2 flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Speed</span>
        <Slider
          className="w-24"
          min={1}
          max={300}
          step={1}
          value={[speed]}
          onValueChange={(v) => setSpeed(Array.isArray(v) ? v[0] : v)}
          aria-label="Comparison animation speed (steps per second)"
        />
      </div>
    </div>
  );
}
