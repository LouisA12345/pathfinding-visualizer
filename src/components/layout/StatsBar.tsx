'use client';

import { formatElapsedWithSkip, useLiveStats } from '@/hooks/useLiveStats';
import { getAlgorithm } from '@/lib/algorithms/registry';
import { useAlgorithmStore } from '@/store/algorithmStore';
import { cn } from '@/lib/utils';

function Metric({ label, value, hideBelowMd }: { label: string; value: string; hideBelowMd?: boolean }) {
  return (
    <div className={cn('flex items-baseline gap-1.5 whitespace-nowrap', hideBelowMd && 'hidden md:flex')}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function StatsBar() {
  const stats = useLiveStats();
  const selectedId = useAlgorithmStore((s) => s.selectedId);
  const def = getAlgorithm(selectedId);

  return (
    <div className="flex h-11 shrink-0 items-center gap-3 overflow-x-auto border-t bg-background/60 px-4 backdrop-blur md:gap-5">
      <Metric label="Algorithm" value={def?.shortName ?? '—'} />
      <Metric label="Nodes explored" value={stats.hasResult ? String(stats.visited) : '—'} />
      <Metric label="Path length" value={stats.hasResult && stats.pathLength > 0 ? String(stats.pathLength) : '—'} />
      <Metric label="Path cost" value={stats.hasResult && stats.pathCost > 0 ? stats.pathCost.toFixed(1) : '—'} />
      <Metric label="Compute time" value={stats.hasResult ? `${stats.runtimeMs.toFixed(2)} ms` : '—'} />
      <Metric label="Time taken" value={stats.hasResult ? formatElapsedWithSkip(stats.elapsedMs, stats.wasSkipped) : '—'} />
      <Metric label="Branching factor" value={stats.hasResult ? stats.branchingFactor.toFixed(2) : '—'} hideBelowMd />
      <Metric label="Efficiency" value={stats.hasResult && stats.efficiency > 0 ? stats.efficiency.toFixed(2) : '—'} hideBelowMd />
      <Metric
        label="Steps"
        value={stats.hasResult ? `${stats.stepsCompleted} / ${stats.totalSteps}` : '—'}
      />
      {stats.success === false && stats.aborted && (
        <span className="text-xs font-medium text-destructive">
          Exceeded step budget — try a smaller grid or a different algorithm
        </span>
      )}
      {stats.success === false && !stats.aborted && (
        <span className="text-xs font-medium text-destructive">No path found</span>
      )}
    </div>
  );
}
