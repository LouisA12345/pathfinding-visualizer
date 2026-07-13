'use client';

import { useCompareStore, MAX_COMPARE_SLOTS, MIN_COMPARE_SLOTS } from '@/store/compareStore';
import { useBenchmarkStore } from '@/store/benchmarkStore';
import { useGridStore } from '@/store/gridStore';
import { ALGORITHMS } from '@/lib/algorithms/registry';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ComparePanel() {
  const selectedIds = useCompareStore((s) => s.selectedIds);
  const isActive = useCompareStore((s) => s.isActive);
  const toggleAlgorithm = useCompareStore((s) => s.toggleAlgorithm);
  const enterCompareMode = useCompareStore((s) => s.enterCompareMode);
  const exitCompareMode = useCompareStore((s) => s.exitCompareMode);
  const start = useCompareStore((s) => s.start);
  const exitBenchmarkView = useBenchmarkStore((s) => s.exitBenchmarkView);
  const startId = useGridStore((s) => s.grid.startId);
  const endId = useGridStore((s) => s.grid.endId);

  const canRun = startId >= 0 && endId >= 0 && selectedIds.length >= MIN_COMPARE_SLOTS;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Pick {MIN_COMPARE_SLOTS}-{MAX_COMPARE_SLOTS} algorithms to run side by side on the current maze, with
        synchronized playback and a live winner ranking.
      </p>

      <div className="space-y-1.5">
        {ALGORITHMS.map((def) => {
          const checked = selectedIds.includes(def.id);
          const disabled = !checked && selectedIds.length >= MAX_COMPARE_SLOTS;
          return (
            <button
              key={def.id}
              type="button"
              disabled={disabled}
              onClick={() => toggleAlgorithm(def.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                checked ? 'border-primary/40 bg-primary/10' : 'border-transparent hover:border-border hover:bg-muted',
                disabled && 'cursor-not-allowed opacity-40'
              )}
              aria-pressed={checked}
            >
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                  checked ? 'border-primary bg-primary' : 'border-input'
                )}
              >
                {checked && <span className="h-1.5 w-1.5 rounded-sm bg-primary-foreground" />}
              </span>
              {def.name}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {selectedIds.length} / {MAX_COMPARE_SLOTS} selected
        {selectedIds.length < MIN_COMPARE_SLOTS ? ` — pick at least ${MIN_COMPARE_SLOTS}` : ''}
      </p>

      {!isActive ? (
        <Button
          className="w-full"
          disabled={!canRun}
          onClick={() => {
            exitBenchmarkView();
            enterCompareMode();
            start();
          }}
        >
          Start comparison
        </Button>
      ) : (
        <Button variant="outline" className="w-full" onClick={exitCompareMode}>
          Exit compare mode
        </Button>
      )}
    </div>
  );
}
