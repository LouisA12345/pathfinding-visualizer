'use client';

import { History, Trash2 } from 'lucide-react';
import { formatElapsedWithSkip, useLiveStats } from '@/hooks/useLiveStats';
import { getAlgorithm } from '@/lib/algorithms/registry';
import { useAlgorithmStore } from '@/store/algorithmStore';
import { useBenchmarkStore } from '@/store/benchmarkStore';
import { useCompareStore } from '@/store/compareStore';
import { useReplayStore } from '@/store/replayStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const BYTES_PER_NODE_ESTIMATE = 40; // rough: parent (i32) + cost (f32) + visited flag + heap entry overhead

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

function BenchmarkSection() {
  const isActive = useBenchmarkStore((s) => s.isActive);
  const isRunning = useBenchmarkStore((s) => s.isRunning);
  const latest = useBenchmarkStore((s) => s.latest);
  const history = useBenchmarkStore((s) => s.history);
  const runBenchmark = useBenchmarkStore((s) => s.runBenchmark);
  const enterBenchmarkView = useBenchmarkStore((s) => s.enterBenchmarkView);
  const exitBenchmarkView = useBenchmarkStore((s) => s.exitBenchmarkView);
  const viewHistoryEntry = useBenchmarkStore((s) => s.viewHistoryEntry);
  const clearHistory = useBenchmarkStore((s) => s.clearHistory);
  const exitCompareMode = useCompareStore((s) => s.exitCompareMode);

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground">Benchmark (run all algorithms)</p>
      <p className="text-xs text-muted-foreground">
        Runs every algorithm against the current maze and compares runtime, nodes explored, and path cost.
      </p>
      <div className="flex gap-1.5">
        <Button
          size="sm"
          className="flex-1"
          disabled={isRunning}
          onClick={async () => {
            exitCompareMode();
            await runBenchmark();
            enterBenchmarkView();
          }}
        >
          {isRunning ? 'Running…' : 'Run benchmark'}
        </Button>
        {latest && !isActive && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              exitCompareMode();
              enterBenchmarkView();
            }}
          >
            View
          </Button>
        )}
        {isActive && (
          <Button size="sm" variant="outline" onClick={exitBenchmarkView}>
            Hide
          </Button>
        )}
      </div>

      {history.length > 0 && (
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">History</p>
            <Button variant="ghost" size="icon-xs" aria-label="Clear benchmark history" onClick={clearHistory}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <ScrollArea className="h-24 rounded-md border">
            <div className="space-y-0.5 p-1">
              {history.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-[11px] hover:bg-muted"
                  onClick={() => {
                    viewHistoryEntry(h.id);
                    exitCompareMode();
                    enterBenchmarkView();
                  }}
                >
                  <span>
                    {h.gridWidth}×{h.gridHeight}
                  </span>
                  <span className="text-muted-foreground">{new Date(h.timestamp).toLocaleTimeString()}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

function ReplayHistorySection() {
  const history = useReplayStore((s) => s.history);
  const restoreAndReplay = useReplayStore((s) => s.restoreAndReplay);
  const clearHistory = useReplayStore((s) => s.clearHistory);
  const exitCompareMode = useCompareStore((s) => s.exitCompareMode);
  const exitBenchmarkView = useBenchmarkStore((s) => s.exitBenchmarkView);

  if (history.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <History className="h-3.5 w-3.5" /> Run history
        </p>
        <Button variant="ghost" size="icon-xs" aria-label="Clear run history" onClick={clearHistory}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Every completed run, on the exact grid it ran on — click one to restore that grid and watch it again.</p>
      <ScrollArea className="h-28 rounded-md border">
        <div className="space-y-0.5 p-1">
          {history.map((h) => (
            <button
              key={h.id}
              type="button"
              className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-[11px] hover:bg-muted"
              onClick={() => {
                exitCompareMode();
                exitBenchmarkView();
                restoreAndReplay(h.id);
              }}
            >
              <span className="truncate">{h.algorithmName}</span>
              <span className="shrink-0 text-muted-foreground">
                {h.success ? `${h.pathLength} steps` : 'no path'} · {new Date(h.timestamp).toLocaleTimeString()}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function StatsSidebarPanel() {
  const stats = useLiveStats();
  const selectedId = useAlgorithmStore((s) => s.selectedId);
  const def = getAlgorithm(selectedId);

  const memoryKb = ((stats.visited + stats.frontier) * BYTES_PER_NODE_ESTIMATE) / 1024;

  return (
    <div className="space-y-3">
      <BenchmarkSection />
      <ReplayHistorySection />
      <Separator />
      {!stats.hasResult ? (
        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          Run an algorithm to see detailed statistics here.
        </div>
      ) : (
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">{def?.name}</p>
          <Row label="Steps completed" value={`${stats.stepsCompleted} / ${stats.totalSteps}`} />
          <Row label="Nodes visited" value={String(stats.visited)} />
          <Row label="Frontier additions" value={String(stats.frontier)} />
          <Row label="Path length" value={stats.pathLength > 0 ? String(stats.pathLength) : '—'} />
          <Row label="Path cost" value={stats.pathCost > 0 ? stats.pathCost.toFixed(2) : '—'} />
          <Row label="Compute time" value={`${stats.runtimeMs.toFixed(3)} ms`} />
          <Row label="Time taken (start to end)" value={formatElapsedWithSkip(stats.elapsedMs, stats.wasSkipped)} />
          <Row label="Branching factor" value={stats.branchingFactor.toFixed(2)} />
          <Row label="Efficiency (path/visited)" value={stats.efficiency > 0 ? stats.efficiency.toFixed(2) : '—'} />
          <Row label="Memory estimate" value={`${memoryKb.toFixed(1)} KB`} />
          {stats.success !== null && (
            <Row
              label="Result"
              value={stats.success ? 'Path found' : stats.aborted ? 'Exceeded step budget' : 'No path found'}
            />
          )}
        </div>
      )}
      {stats.hasResult && (
        <p className="text-xs text-muted-foreground">
          Memory estimate is an approximation ({BYTES_PER_NODE_ESTIMATE} bytes/node bookkeeping), not a measured value.
        </p>
      )}
    </div>
  );
}
