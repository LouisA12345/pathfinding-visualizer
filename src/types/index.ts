export type MaterialId =
  | 'wall'
  | 'erase'
  | 'start'
  | 'end'
  | 'extra-start'
  | 'extra-end'
  | 'checkpoint'
  | 'terrain-road'
  | 'terrain-forest'
  | 'terrain-mud'
  | 'terrain-water'
  | 'terrain-ice'
  | 'terrain-lava';

export type ShapeMode = 'freehand' | 'rectangle' | 'line' | 'circle' | 'bucket' | 'select' | 'paste';

export type BrushSize = 1 | 2 | 3 | 5;

export type GridSizePresetId = 'small' | 'medium' | 'large' | 'xlarge' | 'huge' | 'custom';

export interface GridSizePreset {
  id: GridSizePresetId;
  label: string;
  width: number;
  height: number;
}

export const GRID_SIZE_PRESETS: GridSizePreset[] = [
  { id: 'small', label: '20 x 20', width: 20, height: 20 },
  { id: 'medium', label: '40 x 40', width: 40, height: 40 },
  { id: 'large', label: '75 x 75', width: 75, height: 75 },
  { id: 'xlarge', label: '100 x 100', width: 100, height: 100 },
  { id: 'huge', label: '200 x 200', width: 200, height: 200 },
];

export type LeftPanelTab = 'algorithms' | 'templates' | 'generator' | 'draw' | 'compare' | 'community' | 'stats' | 'settings';

export type Theme = 'light' | 'dark';

export interface VisualizerSettings {
  animationSpeed: number; // steps per second
  nodeSize: number; // base cell px before zoom
  reduceMotion: boolean;
  highContrast: boolean;
  soundEffects: boolean;
  showCoordinates: boolean;
  showHeuristics: boolean;
  showCosts: boolean;
  showFrontier: boolean;
  showVisited: boolean;
  diagonalMovement: boolean;
  cornerCutting: boolean;
  heuristicWeight: number;
}

export const DEFAULT_SETTINGS: VisualizerSettings = {
  animationSpeed: 60,
  nodeSize: 22,
  reduceMotion: false,
  highContrast: false,
  soundEffects: false,
  showCoordinates: false,
  showHeuristics: false,
  showCosts: false,
  showFrontier: true,
  showVisited: true,
  diagonalMovement: false,
  cornerCutting: false,
  heuristicWeight: 1.5,
};
