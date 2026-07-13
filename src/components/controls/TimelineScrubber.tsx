'use client';

import { useAlgorithmStore } from '@/store/algorithmStore';
import { Slider } from '@/components/ui/slider';

export function TimelineScrubber() {
  const result = useAlgorithmStore((s) => s.result);
  const currentStepIndex = useAlgorithmStore((s) => s.currentStepIndex);
  const seek = useAlgorithmStore((s) => s.seek);
  const pause = useAlgorithmStore((s) => s.pause);

  if (!result) return null;
  const total = result.steps.length;

  return (
    <div className="flex items-center gap-2 border-b bg-background/60 px-3 py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground">Timeline</span>
      <Slider
        className="flex-1"
        min={0}
        max={Math.max(0, total - 1)}
        step={1}
        value={[currentStepIndex]}
        onValueChange={(v) => {
          pause();
          seek(Array.isArray(v) ? v[0] : v);
        }}
        aria-label="Scrub through algorithm steps"
      />
      <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {currentStepIndex + 1}/{total}
      </span>
    </div>
  );
}
