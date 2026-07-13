import { useEffect } from 'react';
import { useAlgorithmStore } from '@/store/algorithmStore';
import { useCompareStore } from '@/store/compareStore';
import { useGridStore } from '@/store/gridStore';
import { useUiStore } from '@/store/uiStore';
import { copyCells } from '@/lib/grid/edits';
import { ALGORITHMS, indexForShortcutKey } from '@/lib/algorithms/registry';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;

      // While Compare Mode is showing, playback shortcuts drive the shared
      // comparison timeline instead of the (unmounted) single-run canvas.
      const compare = useCompareStore.getState();
      const algo = compare.isActive ? compare : useAlgorithmStore.getState();

      if (e.code === 'Space') {
        e.preventDefault();
        if (algo.runState === 'playing') algo.pause();
        else algo.play();
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        algo.reset();
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        algo.pause();
        algo.stepForward();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        algo.pause();
        algo.stepBackward();
        return;
      }

      if (e.key === 'End') {
        e.preventDefault();
        algo.skipToEnd();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        useGridStore.getState().undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        useGridStore.getState().redo();
        return;
      }

      // Only steal Ctrl/Cmd+C when there's an active grid selection to copy
      // and the user isn't actually mid-way through selecting ordinary page
      // text (which they'd reasonably expect the browser's native copy to
      // handle instead).
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const { selection } = useUiStore.getState();
        const hasTextSelected = (window.getSelection()?.toString().length ?? 0) > 0;
        if (selection && !hasTextSelected) {
          e.preventDefault();
          const { grid } = useGridStore.getState();
          useUiStore.getState().setClipboard(copyCells(grid, selection.r1, selection.c1, selection.r2, selection.c2));
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        const { clipboard } = useUiStore.getState();
        if (clipboard) {
          e.preventDefault();
          useUiStore.getState().setShapeMode('paste');
        }
        return;
      }

      // Esc backs out of Paste without placing anything, same as dismissing
      // a pending action in VSCode.
      if (e.key === 'Escape' && useUiStore.getState().shapeMode === 'paste') {
        e.preventDefault();
        useUiStore.getState().exitPasteMode();
        return;
      }

      if (compare.isActive) return;

      const index = indexForShortcutKey(e.key);
      if (index !== null && index < ALGORITHMS.length) {
        useAlgorithmStore.getState().selectAlgorithm(ALGORITHMS[index].id);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
