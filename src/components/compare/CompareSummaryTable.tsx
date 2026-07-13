'use client';

import { useCompareStore } from '@/store/compareStore';
import { getAlgorithm } from '@/lib/algorithms/registry';
import { computeLiveStats, LiveStats } from '@/hooks/useLiveStats';
import { cn } from '@/lib/utils';

function bestId(ids: string[], valueOf: (id: string) => number | null): string | null {
  let best: string | null = null;
  let bestValue = Infinity;
  for (const id of ids) {
    const v = valueOf(id);
    if (v === null) continue;
    if (v < bestValue) {
      bestValue = v;
      best = id;
    }
  }
  return best;
}

export function CompareSummaryTable() {
  const selectedIds = useCompareStore((s) => s.selectedIds);
  const results = useCompareStore((s) => s.results);
  const currentTick = useCompareStore((s) => s.currentTick);

  if (Object.keys(results).length === 0) {
    return (
      <div className="border-t p-4 text-center text-xs text-muted-foreground">
        Run a comparison to see a side-by-side summary table.
      </div>
    );
  }

  const liveStatsById: Record<string, LiveStats> = {};
  for (const id of selectedIds) {
    const result = results[id] ?? null;
    const effectiveIndex = result ? Math.min(currentTick, result.steps.length - 1) : 0;
    liveStatsById[id] = computeLiveStats(result, effectiveIndex);
  }

  // Winners are only meaningful once a run has actually finished (success !== null).
  const finishedIds = selectedIds.filter((id) => liveStatsById[id].success === true);
  const fastestId = bestId(finishedIds, (id) => liveStatsById[id].runtimeMs);
  const fewestVisitedId = bestId(finishedIds, (id) => liveStatsById[id].visited);
  const shortestPathId = bestId(finishedIds, (id) => liveStatsById[id].pathCost);

  return (
    <div className="overflow-x-auto border-t">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/40 text-left">
            <th className="px-3 py-2 font-medium">Algorithm</th>
            <th className="px-3 py-2 font-medium">Runtime</th>
            <th className="px-3 py-2 font-medium">Visited</th>
            <th className="px-3 py-2 font-medium">Path len</th>
            <th className="px-3 py-2 font-medium">Path cost</th>
            <th className="px-3 py-2 font-medium">Optimal</th>
            <th className="px-3 py-2 font-medium">Result</th>
          </tr>
        </thead>
        <tbody>
          {selectedIds.map((id) => {
            const def = getAlgorithm(id);
            const stats = liveStatsById[id];
            return (
              <tr key={id} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium">{def?.shortName ?? id}</td>
                <td className={cn('px-3 py-2 tabular-nums', fastestId === id && 'text-emerald-500 font-medium')}>
                  {stats.success !== null ? `${stats.runtimeMs.toFixed(2)}ms` : '…'}
                </td>
                <td className={cn('px-3 py-2 tabular-nums', fewestVisitedId === id && 'text-emerald-500 font-medium')}>
                  {stats.visited}
                </td>
                <td className="px-3 py-2 tabular-nums">{stats.pathLength > 0 ? stats.pathLength : '—'}</td>
                <td className={cn('px-3 py-2 tabular-nums', shortestPathId === id && 'text-emerald-500 font-medium')}>
                  {stats.pathCost > 0 ? stats.pathCost.toFixed(1) : '—'}
                </td>
                <td className="px-3 py-2">{def?.meta.optimal ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">
                  {stats.success === null ? 'Running…' : stats.success ? 'Found' : stats.aborted ? 'Gave up' : 'No path'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="px-3 py-2 text-[11px] text-muted-foreground">
        Green = best so far (lowest runtime / fewest visited / lowest path cost), among runs that have finished and found a path.
      </p>
    </div>
  );
}
