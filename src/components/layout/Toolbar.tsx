'use client';

import { BarChart3, Eraser, Hand, Maximize, Moon, Redo2, Rows3, Shuffle, Sun, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import { useGridStore } from '@/store/gridStore';
import { useUiStore } from '@/store/uiStore';
import { useViewStore } from '@/store/viewStore';
import { useCompareStore } from '@/store/compareStore';
import { useBenchmarkStore } from '@/store/benchmarkStore';
import { generateAndApplyMaze } from '@/lib/engine/mazeActions';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { UserMenu } from '@/components/auth/UserMenu';
import { PlaybackControls } from '@/components/controls/PlaybackControls';
import { GridSizeControl } from '@/components/controls/GridSizeControl';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function ToolbarIconButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant={active ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8 [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:w-10"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function Toolbar() {
  const canUndo = useGridStore((s) => s.canUndo);
  const canRedo = useGridStore((s) => s.canRedo);
  const undo = useGridStore((s) => s.undo);
  const redo = useGridStore((s) => s.redo);
  const clearAll = useGridStore((s) => s.clearAll);
  const clearObstacles = useGridStore((s) => s.clearObstacles);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const isPanMode = useUiStore((s) => s.isPanMode);
  const togglePanMode = useUiStore((s) => s.togglePanMode);
  const { requestFit, requestZoomIn, requestZoomOut } = useViewStore.getState();
  const isCompareActive = useCompareStore((s) => s.isActive);
  const compareCount = useCompareStore((s) => s.selectedIds.length);
  const isBenchmarkActive = useBenchmarkStore((s) => s.isActive);
  const isSpecialViewActive = isCompareActive || isBenchmarkActive;

  const viewControls = !isSpecialViewActive && (
    <>
      <ToolbarIconButton
        label={isPanMode ? 'Pan mode (drag to move — click to switch back to drawing)' : 'Pan mode (drag with left-click, no keys needed)'}
        onClick={togglePanMode}
        active={isPanMode}
      >
        <Hand className="h-4 w-4" />
      </ToolbarIconButton>
      {/* Redundant with pinch-zoom on touch, so only shown at md: and up
          (where this same fragment is rendered for mouse/trackpad users) —
          dropping them from the phone row (row 2) was the whole point of
          giving playback/nav their own row instead of cramming everything
          into one. Must match row 2's own md:hidden breakpoint below, or
          this and row 2 would both be visible at once in between. */}
      <span className="hidden md:contents">
        <ToolbarIconButton label="Zoom out" onClick={requestZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton label="Zoom in" onClick={requestZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </ToolbarIconButton>
      </span>
      <ToolbarIconButton label="Center & fit maze to view" onClick={requestFit}>
        <Maximize className="h-4 w-4" />
      </ToolbarIconButton>
      <div className="mx-1 h-5 w-px shrink-0 bg-border" />
    </>
  );

  const playbackOrStatus = isCompareActive ? (
    <span className="flex items-center gap-1.5 text-sm whitespace-nowrap text-muted-foreground">
      <Rows3 className="h-4 w-4" /> Comparing {compareCount} algorithms — controls are in the panel below
    </span>
  ) : isBenchmarkActive ? (
    <span className="flex items-center gap-1.5 text-sm whitespace-nowrap text-muted-foreground">
      <BarChart3 className="h-4 w-4" /> Viewing benchmark results
    </span>
  ) : (
    <PlaybackControls />
  );

  return (
    <div className="flex shrink-0 flex-col border-b bg-background/80 backdrop-blur">
      {/* Row 1 — general: navigation menu, grid-editing actions, account.
          Fits in one row at every width, so it never needs to scroll. */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-1.5 overflow-x-auto px-3 sm:gap-3">
        <div className="flex items-center gap-1.5">
          <span className="mr-1 hidden text-sm font-semibold sm:inline">Pathfinding Visualizer</span>
          <MobileMenu />
          <ToolbarIconButton label="Undo" onClick={undo} disabled={!canUndo}>
            <Undo2 className="h-4 w-4" />
          </ToolbarIconButton>
          <ToolbarIconButton label="Redo" onClick={redo} disabled={!canRedo}>
            <Redo2 className="h-4 w-4" />
          </ToolbarIconButton>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8" aria-label="Clear" />}>
              <Eraser className="h-4 w-4" /> <span className="hidden sm:inline">Clear</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={clearObstacles}>Clear obstacles (keep start/end)</DropdownMenuItem>
              <DropdownMenuItem onClick={clearAll}>Clear entire grid</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="h-8" aria-label="Generate maze" onClick={() => generateAndApplyMaze()}>
            <Shuffle className="h-4 w-4" /> <span className="hidden sm:inline">Generate maze</span>
          </Button>

          {/* Playback + view controls live in this row too at md: and up —
              row 2 below only exists to give them their own space on phone. */}
          <div className="hidden items-center gap-1.5 md:flex md:gap-3">
            <div className="mx-1 h-5 w-px bg-border" />
            {viewControls}
            <GridSizeControl />
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center gap-1.5 md:flex md:gap-3">{playbackOrStatus}</div>

        <div className="flex items-center gap-1.5">
          <ToolbarIconButton label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </ToolbarIconButton>
          <div className="mx-1 h-5 w-px bg-border" />
          <UserMenu />
        </div>
      </header>

      {/* Row 2 — phone only (below md:, matching the same breakpoint the
          rest of the app uses for "phone" vs. "tablet and up" — see the
          Sidebar/RightPanel breakpoints in AppShell): navigation
          (pan/zoom/fit/grid size) and playback (play/pause/stop/step/
          speed). Same controls as row 1's hidden md: groups above, just
          given a dedicated row instead of competing for space in row 1 on
          a narrow screen. */}
      <div className="flex h-12 shrink-0 items-center gap-1.5 overflow-x-auto border-t px-3 md:hidden">
        {viewControls}
        <GridSizeControl />
        <div className="mx-1 h-5 w-px shrink-0 bg-border" />
        {playbackOrStatus}
      </div>
    </div>
  );
}
