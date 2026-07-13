import { create } from 'zustand';

interface ViewStoreState {
  /** Incrementing tokens rather than a single "last command" — avoids one rapid click clobbering another. */
  fitToken: number;
  zoomInToken: number;
  zoomOutToken: number;
  requestFit: () => void;
  requestZoomIn: () => void;
  requestZoomOut: () => void;
}

export const useViewStore = create<ViewStoreState>((set) => ({
  fitToken: 0,
  zoomInToken: 0,
  zoomOutToken: 0,
  requestFit: () => set((s) => ({ fitToken: s.fitToken + 1 })),
  requestZoomIn: () => set((s) => ({ zoomInToken: s.zoomInToken + 1 })),
  requestZoomOut: () => set((s) => ({ zoomOutToken: s.zoomOutToken + 1 })),
}));
