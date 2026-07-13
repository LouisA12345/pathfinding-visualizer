import {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
  useCallback,
  useRef,
  WheelEvent as ReactWheelEvent,
} from 'react';
import { useGridStore } from '@/store/gridStore';
import { useUiStore } from '@/store/uiStore';
import { applyMaterial, bucketCells, brushCells, circleCells, lineCells, pasteClipboard, rectCells } from '@/lib/grid/edits';
import { Camera, screenToCell } from '@/lib/engine/renderGrid';

const MIN_CELL_SIZE = 2;
const MAX_CELL_SIZE = 80;

export interface ShapePreview {
  mode: 'rectangle' | 'line' | 'circle' | 'select';
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

interface PointerInfo {
  x: number;
  y: number;
  pointerType: string;
}

interface UseGridInteractionArgs {
  containerRef: RefObject<HTMLDivElement | null>;
  cameraRef: RefObject<Camera>;
  scheduleDraw: () => void;
}

export function useGridInteraction({ containerRef, cameraRef, scheduleDraw }: UseGridInteractionArgs) {
  const pointers = useRef<Map<number, PointerInfo>>(new Map());
  const mode = useRef<'idle' | 'paint' | 'pan' | 'pinch'>('idle');
  const panStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const pinchStart = useRef({ dist: 0, cellSize: 0, midX: 0, midY: 0, offsetX: 0, offsetY: 0 });
  const shapeStart = useRef<{ row: number; col: number } | null>(null);
  const previewRef = useRef<ShapePreview | null>(null);

  const getRelativePos = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    [containerRef]
  );

  const paintAt = useCallback(
    (row: number, col: number) => {
      const { grid } = useGridStore.getState();
      const { activeMaterial, brushSize } = useUiStore.getState();
      if (!grid.inBounds(row, col)) return;
      const isSingleton =
        activeMaterial === 'start' ||
        activeMaterial === 'end' ||
        activeMaterial === 'extra-start' ||
        activeMaterial === 'extra-end';
      const ids = isSingleton ? [grid.toId(row, col)] : brushCells(grid, row, col, brushSize);
      for (const id of ids) applyMaterial(grid, activeMaterial, id);
      useGridStore.getState().bumpVersion();
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const { x, y } = getRelativePos(e.clientX, e.clientY);
      pointers.current.set(e.pointerId, { x, y, pointerType: e.pointerType });

      if (pointers.current.size === 2) {
        const pts = Array.from(pointers.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        mode.current = 'pinch';
        pinchStart.current = {
          dist,
          cellSize: cameraRef.current.cellSize,
          midX: (pts[0].x + pts[1].x) / 2,
          midY: (pts[0].y + pts[1].y) / 2,
          offsetX: cameraRef.current.offsetX,
          offsetY: cameraRef.current.offsetY,
        };
        return;
      }

      const { isPanMode } = useUiStore.getState();
      if (isPanMode || e.button === 1 || e.button === 2) {
        mode.current = 'pan';
        panStart.current = { x, y, offsetX: cameraRef.current.offsetX, offsetY: cameraRef.current.offsetY };
        return;
      }
      if (e.button !== 0 && e.pointerType !== 'touch') return;

      const [row, col] = screenToCell(cameraRef.current, x, y);
      const { shapeMode } = useUiStore.getState();
      mode.current = 'paint';

      if (shapeMode === 'freehand') {
        useGridStore.getState().beginEdit();
        paintAt(row, col);
      } else if (shapeMode === 'bucket') {
        const { grid } = useGridStore.getState();
        const { activeMaterial } = useUiStore.getState();
        if (grid.inBounds(row, col)) {
          useGridStore.getState().beginEdit();
          const ids = bucketCells(grid, row, col);
          for (const id of ids) applyMaterial(grid, activeMaterial, id);
          useGridStore.getState().bumpVersion();
        }
      } else if (shapeMode === 'paste') {
        const { grid } = useGridStore.getState();
        const { clipboard } = useUiStore.getState();
        if (clipboard && grid.inBounds(row, col)) {
          useGridStore.getState().beginEdit();
          pasteClipboard(grid, clipboard, row, col);
          useGridStore.getState().bumpVersion();
          // One-shot, not a sticky stamp: land the paste, then snap back to
          // whichever tool was active before Paste was armed.
          useUiStore.getState().exitPasteMode();
        }
      } else {
        shapeStart.current = { row, col };
        previewRef.current = { mode: shapeMode, startRow: row, startCol: col, endRow: row, endCol: col };
      }
      scheduleDraw();
    },
    [cameraRef, getRelativePos, paintAt, scheduleDraw]
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const { x, y } = getRelativePos(e.clientX, e.clientY);
      if (pointers.current.has(e.pointerId)) {
        pointers.current.set(e.pointerId, { x, y, pointerType: e.pointerType });
      }

      if (mode.current === 'pinch' && pointers.current.size === 2) {
        const pts = Array.from(pointers.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const ratio = dist / Math.max(1, pinchStart.current.dist);
        const newCellSize = Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, pinchStart.current.cellSize * ratio));
        const worldX = (pinchStart.current.midX - pinchStart.current.offsetX) / pinchStart.current.cellSize;
        const worldY = (pinchStart.current.midY - pinchStart.current.offsetY) / pinchStart.current.cellSize;
        cameraRef.current.cellSize = newCellSize;
        cameraRef.current.offsetX = midX - worldX * newCellSize;
        cameraRef.current.offsetY = midY - worldY * newCellSize;
        scheduleDraw();
        return;
      }

      if (mode.current === 'pan') {
        cameraRef.current.offsetX = panStart.current.offsetX + (x - panStart.current.x);
        cameraRef.current.offsetY = panStart.current.offsetY + (y - panStart.current.y);
        scheduleDraw();
        return;
      }

      if (mode.current === 'paint') {
        const [row, col] = screenToCell(cameraRef.current, x, y);
        const { shapeMode } = useUiStore.getState();
        if (shapeMode === 'freehand') {
          paintAt(row, col);
          scheduleDraw();
        } else if (shapeMode !== 'bucket' && shapeMode !== 'paste' && shapeStart.current) {
          previewRef.current = {
            mode: shapeMode,
            startRow: shapeStart.current.row,
            startCol: shapeStart.current.col,
            endRow: row,
            endCol: col,
          };
          scheduleDraw();
        }
      }
    },
    [cameraRef, getRelativePos, paintAt, scheduleDraw]
  );

  const endGesture = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      pointers.current.delete(e.pointerId);

      if (mode.current === 'paint' && shapeStart.current && previewRef.current) {
        const { grid } = useGridStore.getState();
        const { activeMaterial, shapeMode } = useUiStore.getState();
        const { startRow, startCol, endRow, endCol } = previewRef.current;

        if (shapeMode === 'select') {
          useUiStore.getState().setSelection({ r1: startRow, c1: startCol, r2: endRow, c2: endCol });
        } else {
          useGridStore.getState().beginEdit();
          const ids =
            shapeMode === 'rectangle'
              ? rectCells(grid, startRow, startCol, endRow, endCol)
              : shapeMode === 'circle'
                ? circleCells(grid, startRow, startCol, Math.hypot(endRow - startRow, endCol - startCol))
                : lineCells(startRow, startCol, endRow, endCol)
                    .filter(([r, c]) => grid.inBounds(r, c))
                    .map(([r, c]) => grid.toId(r, c));
          for (const id of ids) applyMaterial(grid, activeMaterial, id);
          useGridStore.getState().bumpVersion();
        }
      }

      shapeStart.current = null;
      previewRef.current = null;
      if (pointers.current.size === 0) mode.current = 'idle';
      else if (pointers.current.size === 1) mode.current = 'idle';
      scheduleDraw();
    },
    [scheduleDraw]
  );

  const handleWheel = useCallback(
    (e: ReactWheelEvent<HTMLDivElement>) => {
      const { x, y } = getRelativePos(e.clientX, e.clientY);
      const camera = cameraRef.current;
      const zoomFactor = Math.exp(-e.deltaY * 0.0015);
      const newCellSize = Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, camera.cellSize * zoomFactor));
      const worldX = (x - camera.offsetX) / camera.cellSize;
      const worldY = (y - camera.offsetY) / camera.cellSize;
      camera.cellSize = newCellSize;
      camera.offsetX = x - worldX * newCellSize;
      camera.offsetY = y - worldY * newCellSize;
      scheduleDraw();
    },
    [cameraRef, getRelativePos, scheduleDraw]
  );

  const handleContextMenu = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return {
    previewRef,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: endGesture,
      onPointerCancel: endGesture,
      onWheel: handleWheel,
      onContextMenu: handleContextMenu,
    },
  };
}
