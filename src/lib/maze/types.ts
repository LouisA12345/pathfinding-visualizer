import { Grid } from '@/lib/grid/Grid';

export interface MazeGenerator {
  id: string;
  name: string;
  description: string;
  /** `intensity` is a generic 0-1 knob (density/complexity); generators that don't use it ignore it. */
  generate: (width: number, height: number, intensity?: number) => Grid;
}
