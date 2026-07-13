'use client';

import { Pause, Play, RotateCcw, SkipForward, Square, StepBack, StepForward } from 'lucide-react';
import { useAlgorithmStore } from '@/store/algorithmStore';
import { useGridStore } from '@/store/gridStore';
import { FLOYD_WARSHALL_MAX_CELLS } from '@/lib/algorithms/floydWarshall';
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

export function PlaybackControls() {
  const runState = useAlgorithmStore((s) => s.runState);
  const result = useAlgorithmStore((s) => s.result);
  const currentStepIndex = useAlgorithmStore((s) => s.currentStepIndex);
  const speed = useAlgorithmStore((s) => s.speed);
  const { start, pause, play, stop, reset, stepForward, stepBackward, skipToEnd, setSpeed } = useAlgorithmStore.getState();
  const startId = useGridStore((s) => s.grid.startId);
  const endId = useGridStore((s) => s.grid.endId);
  const gridSize = useGridStore((s) => s.grid.size);
  const selectedId = useAlgorithmStore((s) => s.selectedId);

  const hasResult = !!result;
  const atStart = currentStepIndex <= 0;
  const atEnd = hasResult && currentStepIndex >= (result?.steps.length ?? 1) - 1;
  const hasStartEnd = startId >= 0 && endId >= 0;
  const overSizeCap = selectedId === 'floyd-warshall' && gridSize > FLOYD_WARSHALL_MAX_CELLS;
  const canRun = hasStartEnd && !overSizeCap;

  const startLabel = !hasStartEnd
    ? 'Place both a start and end node first'
    : overSizeCap
      ? `Floyd-Warshall is capped at ${FLOYD_WARSHALL_MAX_CELLS} cells (20×20) — pick a smaller grid or a different algorithm`
      : 'Start (from beginning)';

  return (
    <div className="flex items-center gap-1.5">
      <IconButton
        label={startLabel}
        onClick={start}
        disabled={!canRun}
      >
        <Play className="h-4 w-4" />
      </IconButton>
      <IconButton label="Pause" onClick={pause} disabled={runState !== 'playing'}>
        <Pause className="h-4 w-4" />
      </IconButton>
      <IconButton label="Resume" onClick={play} disabled={!canRun || !hasResult || runState === 'playing' || atEnd}>
        <Play className="h-4 w-4 opacity-70" />
      </IconButton>
      <IconButton label="Stop (halt at current step)" onClick={stop} disabled={!hasResult}>
        <Square className="h-4 w-4" />
      </IconButton>
      <IconButton label="Reset (clear result)" onClick={reset} disabled={!hasResult}>
        <RotateCcw className="h-4 w-4" />
      </IconButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <IconButton label="Step back" onClick={stepBackward} disabled={!hasResult || atStart}>
        <StepBack className="h-4 w-4" />
      </IconButton>
      <IconButton label="Step forward" onClick={stepForward} disabled={!hasResult || atEnd}>
        <StepForward className="h-4 w-4" />
      </IconButton>
      <IconButton label="Skip to end" onClick={skipToEnd} disabled={!hasResult || atEnd}>
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
          aria-label="Animation speed (steps per second)"
        />
      </div>
    </div>
  );
}
