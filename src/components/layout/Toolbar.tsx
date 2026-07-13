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
            className="h-8 w-8"
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

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 overflow-x-auto border-b bg-background/80 px-3 backdrop-blur">
      <div className="flex items-center gap-1.5">
        <span className="mr-2 hidden text-sm font-semibold sm:inline">Pathfinding Visualizer</span>
        <MobileMenu />
        <ToolbarIconButton label="Undo" onClick={undo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
        </ToolbarIconButton>
        <ToolbarIconButton label="Redo" onClick={redo} disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
        </ToolbarIconButton>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8" />}>
            <Eraser className="h-4 w-4" /> Clear
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={clearObstacles}>Clear obstacles (keep start/end)</DropdownMenuItem>
            <DropdownMenuItem onClick={clearAll}>Clear entire grid</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" className="h-8" onClick={() => generateAndApplyMaze()}>
          <Shuffle className="h-4 w-4" /> Generate maze
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {isCompareActive ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Rows3 className="h-4 w-4" /> Comparing {compareCount} algorithms — controls are in the panel below
          </span>
        ) : isBenchmarkActive ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" /> Viewing benchmark results
          </span>
        ) : (
          <PlaybackControls />
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {!isSpecialViewActive && (
          <>
            <ToolbarIconButton
              label={isPanMode ? 'Pan mode (drag to move — click to switch back to drawing)' : 'Pan mode (drag with left-click, no keys needed)'}
              onClick={togglePanMode}
              active={isPanMode}
            >
              <Hand className="h-4 w-4" />
            </ToolbarIconButton>
            <ToolbarIconButton label="Zoom out" onClick={requestZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </ToolbarIconButton>
            <ToolbarIconButton label="Zoom in" onClick={requestZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </ToolbarIconButton>
            <ToolbarIconButton label="Center & fit maze to view" onClick={requestFit}>
              <Maximize className="h-4 w-4" />
            </ToolbarIconButton>

            <div className="mx-1 h-5 w-px bg-border" />
          </>
        )}

        <GridSizeControl />
        <ToolbarIconButton label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </ToolbarIconButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <UserMenu />
      </div>
    </header>
  );
}
