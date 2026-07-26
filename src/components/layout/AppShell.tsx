'use client';

import { useEffect } from 'react';
import { Layout, LayoutChangedMeta, useGroupRef } from 'react-resizable-panels';
import { usePlayback } from '@/hooks/usePlayback';
import { useComparePlayback } from '@/hooks/useComparePlayback';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useThemeSync } from '@/hooks/useThemeSync';
import { useAuthInit } from '@/hooks/useAuthInit';
import { useCompareStore } from '@/store/compareStore';
import { useBenchmarkStore } from '@/store/benchmarkStore';
import { Toolbar } from '@/components/layout/Toolbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightPanel } from '@/components/layout/RightPanel';
import { StatsBar } from '@/components/layout/StatsBar';
import { GridCanvas } from '@/components/grid/GridCanvas';
import { CompareView } from '@/components/compare/CompareView';
import { BenchmarkView } from '@/components/benchmark/BenchmarkView';
import { TimelineScrubber } from '@/components/controls/TimelineScrubber';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
// Side-effect import: replayStore's module-scope subscription (which records
// every completed run) must be registered from app start, not lazily whenever
// a user first opens the Statistics tab — otherwise every run before that
// first visit goes unrecorded. AppShell always mounts immediately, and
// nothing imports AppShell back, so this can't create a circular import the
// way algorithmStore importing replayStore directly would.
import '@/store/replayStore';
// Same reasoning as replayStore above — communityStore's module-scope
// subscription (clearing `activeMazeId` the moment the loaded maze is
// edited) must be registered before any grid mutation can possibly happen.
import '@/store/communityStore';

const LAYOUT_STORAGE_KEY = 'app-shell-panels-layout';

export function AppShell() {
  usePlayback();
  useComparePlayback();
  useKeyboardShortcuts();
  useThemeSync();
  useAuthInit();
  const isCompareActive = useCompareStore((s) => s.isActive);
  const isBenchmarkActive = useBenchmarkStore((s) => s.isActive);
  const isSpecialViewActive = isCompareActive || isBenchmarkActive;
  const groupRef = useGroupRef();

  // Panels always render with their static `defaultSize` on both server and
  // client (SSR-safe, no hydration mismatch), then a saved layout — if any —
  // is applied imperatively once mounted. `useDefaultLayout`'s own
  // storage-swap-after-mount approach doesn't work here: it only reads
  // storage once, on first call, so passing a real `storage` value on a
  // later render (once we know we're past hydration) never gets picked up.
  useEffect(() => {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return;
    try {
      groupRef.current?.setLayout(JSON.parse(raw));
    } catch {
      // Corrupt/old saved layout — ignore and keep the defaults.
    }
  }, [groupRef]);

  const handleLayoutChanged = (layout: Layout, meta: LayoutChangedMeta) => {
    if (!meta.isUserInteraction) return;
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  };

  let mainView = <GridCanvas />;
  if (isCompareActive) mainView = <CompareView />;
  else if (isBenchmarkActive) mainView = <BenchmarkView />;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Toolbar />
      {!isSpecialViewActive && <TimelineScrubber />}
      {/* Visibility for the sidebar/right-panel Panels is handled in
          globals.css via #sidebar/#right-panel media queries, not a
          className here — see the comment there for why. */}
      <ResizablePanelGroup className="flex-1 overflow-hidden" groupRef={groupRef} onLayoutChanged={handleLayoutChanged}>
        <ResizablePanel id="sidebar" defaultSize="22%" minSize="16%" maxSize="40%">
          <Sidebar />
        </ResizablePanel>
        <ResizableHandle withHandle className="hidden md:flex" />
        <ResizablePanel id="main" minSize="20%">
          <main className="relative h-full w-full overflow-hidden">{mainView}</main>
        </ResizablePanel>
        <ResizableHandle withHandle className="hidden lg:flex" />
        <ResizablePanel id="right-panel" defaultSize="22%" minSize="16%" maxSize="40%">
          <RightPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
      <StatsBar />
    </div>
  );
}
