'use client';

import { X } from 'lucide-react';
import { useBenchmarkStore } from '@/store/benchmarkStore';
import { getAlgorithm } from '@/lib/algorithms/registry';
import { BenchmarkBarChart, BarDatum } from './BenchmarkBarChart';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

function disabledReasonFor(result: { success: boolean; aborted: boolean } | undefined): string | undefined {
  if (!result) return '—';
  if (result.success) return undefined;
  return result.aborted ? 'Gave up' : 'No path';
}

export function BenchmarkView() {
  const latest = useBenchmarkStore((s) => s.latest);
  const isRunning = useBenchmarkStore((s) => s.isRunning);
  const progress = useBenchmarkStore((s) => s.progress);
  const runBenchmark = useBenchmarkStore((s) => s.runBenchmark);
  const exitBenchmarkView = useBenchmarkStore((s) => s.exitBenchmarkView);

  if (!latest) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">No benchmark results yet.</p>
        <Button onClick={() => runBenchmark()} disabled={isRunning}>
          {isRunning ? 'Running…' : 'Run benchmark now'}
        </Button>
      </div>
    );
  }

  const runtimeData: BarDatum[] = [];
  const visitedData: BarDatum[] = [];
  const pathCostData: BarDatum[] = [];

  for (const [id, result] of Object.entries(latest.results)) {
    const def = getAlgorithm(id);
    const label = def?.shortName ?? id;
    const reason = disabledReasonFor(result);
    runtimeData.push({ id, label, value: result.runtimeMs, disabledReason: reason ? '—' : undefined });
    visitedData.push({ id, label, value: result.visited });
    pathCostData.push({ id, label, value: result.pathCost, disabledReason: reason });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => runBenchmark()} disabled={isRunning}>
            {isRunning ? 'Running…' : 'Re-run benchmark'}
          </Button>
          {isRunning && <Progress value={progress * 100} className="h-1.5 w-32" />}
          <span className="text-xs text-muted-foreground">
            {latest.gridWidth}×{latest.gridHeight} grid · {new Date(latest.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={exitBenchmarkView}>
          <X className="h-4 w-4" /> Exit benchmark view
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-2">
          <BenchmarkBarChart title="Runtime (compute time, min of several trials)" data={runtimeData} valueFormatter={(v) => `${v.toFixed(2)}ms`} lowerIsBetter />
          <BenchmarkBarChart title="Nodes explored" data={visitedData} valueFormatter={(v) => v.toFixed(0)} lowerIsBetter />
          <BenchmarkBarChart title="Path cost (successful runs only)" data={pathCostData} valueFormatter={(v) => v.toFixed(1)} lowerIsBetter />
        </div>
      </ScrollArea>
    </div>
  );
}
