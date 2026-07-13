'use client';

import { AlgorithmInfoPanel } from '@/components/panels/AlgorithmInfoPanel';
import { StatsSidebarPanel } from '@/components/panels/StatsSidebarPanel';
import { ScrollArea } from '@/components/ui/scroll-area';

export function RightPanel() {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-l bg-background">
      <ScrollArea className="h-full min-h-0">
        <div className="space-y-5 p-4">
          <AlgorithmInfoPanel />
          <div>
            <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">Current run</h3>
            <StatsSidebarPanel />
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
