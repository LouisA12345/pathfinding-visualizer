'use client';

import { X } from 'lucide-react';
import { useCompareStore } from '@/store/compareStore';
import { CompareControls } from './CompareControls';
import { CompareGridPanel } from './CompareGridPanel';
import { CompareSummaryTable } from './CompareSummaryTable';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { computeLiveStats } from '@/hooks/useLiveStats';

export function CompareView() {
  const selectedIds = useCompareStore((s) => s.selectedIds);
  const results = useCompareStore((s) => s.results);
  const currentTick = useCompareStore((s) => s.currentTick);
  const exitCompareMode = useCompareStore((s) => s.exitCompareMode);

  const finishedIds = selectedIds.filter((id) => {
    const result = results[id];
    if (!result) return false;
    const effectiveIndex = Math.min(currentTick, result.steps.length - 1);
    return computeLiveStats(result, effectiveIndex).success === true;
  });
  let fastestId: string | null = null;
  let bestRuntime = Infinity;
  for (const id of finishedIds) {
    const rt = results[id]?.stats.runtimeMs ?? Infinity;
    if (rt < bestRuntime) {
      bestRuntime = rt;
      fastestId = id;
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <CompareControls />
        <Button variant="outline" size="sm" onClick={exitCompareMode}>
          <X className="h-4 w-4" /> Exit compare mode
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
          {selectedIds.map((id) => (
            <CompareGridPanel key={id} algorithmId={id} isWinner={fastestId === id} />
          ))}
        </div>
      </ScrollArea>

      <CompareSummaryTable />
    </div>
  );
}
