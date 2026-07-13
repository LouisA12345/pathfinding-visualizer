import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BrushSize, DEFAULT_SETTINGS, LeftPanelTab, MaterialId, ShapeMode, Theme, VisualizerSettings } from '@/types';
import { ClipboardData } from '@/lib/grid/edits';

export interface CellSelection {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

interface UiStoreState {
  theme: Theme;
  activeLeftTab: LeftPanelTab;
  activeMaterial: MaterialId;
  shapeMode: ShapeMode;
  brushSize: BrushSize;
  settings: VisualizerSettings;
  isPanMode: boolean;
  selection: CellSelection | null;
  clipboard: ClipboardData | null;
  /** Whatever shape tool was active right before Paste was armed — restored by `exitPasteMode` so paste is one-shot, not a sticky stamp. */
  shapeModeBeforePaste: ShapeMode | null;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setActiveLeftTab: (tab: LeftPanelTab) => void;
  setActiveMaterial: (material: MaterialId) => void;
  setShapeMode: (mode: ShapeMode) => void;
  setBrushSize: (size: BrushSize) => void;
  updateSettings: (patch: Partial<VisualizerSettings>) => void;
  resetSettings: () => void;
  setPanMode: (v: boolean) => void;
  togglePanMode: () => void;
  setSelection: (sel: CellSelection | null) => void;
  setClipboard: (clip: ClipboardData | null) => void;
  /** Call after a paste actually lands (or to cancel paste mode, e.g. on Escape) — returns to whichever tool was active before Paste was armed. */
  exitPasteMode: () => void;
}

export const useUiStore = create<UiStoreState>()(
  persist(
    (set) => ({
      theme: 'dark',
      activeLeftTab: 'algorithms',
      activeMaterial: 'wall',
      shapeMode: 'freehand',
      brushSize: 1,
      settings: DEFAULT_SETTINGS,
      isPanMode: false,
      selection: null,
      clipboard: null,
      shapeModeBeforePaste: null,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setActiveLeftTab: (tab) => set({ activeLeftTab: tab }),
      setActiveMaterial: (material) => set({ activeMaterial: material }),
      // Leaving Select drops the on-canvas selection outline — it's a
      // "what would Copy grab right now" indicator, and showing it while
      // the user has moved on to drawing something else with a different
      // tool just reads as a stuck/buggy leftover rectangle. Entering Paste
      // (from anything other than Paste itself) remembers the tool that was
      // active, so a completed/cancelled paste can snap back to it instead
      // of leaving Paste armed to keep stamping on every subsequent click.
      setShapeMode: (mode) =>
        set((s) => ({
          shapeMode: mode,
          selection: mode === 'select' ? s.selection : null,
          shapeModeBeforePaste: mode === 'paste' && s.shapeMode !== 'paste' ? s.shapeMode : s.shapeModeBeforePaste,
        })),
      setBrushSize: (size) => set({ brushSize: size }),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      setPanMode: (v) => set({ isPanMode: v }),
      togglePanMode: () => set((s) => ({ isPanMode: !s.isPanMode })),
      setSelection: (sel) => set({ selection: sel }),
      setClipboard: (clip) => set({ clipboard: clip }),
      exitPasteMode: () => set((s) => ({ shapeMode: s.shapeModeBeforePaste ?? 'freehand', shapeModeBeforePaste: null })),
    }),
    {
      name: 'pathfinding-visualizer-ui',
      partialize: (s) => ({ theme: s.theme, settings: s.settings }),
    }
  )
);
