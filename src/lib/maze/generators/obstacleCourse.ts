import { Grid } from '@/lib/grid/Grid';
import { TERRAIN_PRESETS } from '@/lib/grid/terrain';
import { MazeGenerator } from '../types';
import { placeDefaultStartEnd } from '../placement';

function generate(width: number, height: number): Grid {
  const grid = new Grid(width, height);
  const numPatches = Math.max(4, Math.floor((width * height) / 220));

  for (let i = 0; i < numPatches; i++) {
    const maxW = Math.max(1, Math.min(9, Math.floor(width / 5)));
    const maxH = Math.max(1, Math.min(9, Math.floor(height / 5)));
    const w = 2 + Math.floor(Math.random() * maxW);
    const h = 2 + Math.floor(Math.random() * maxH);
    if (w >= width || h >= height) continue;
    const row = Math.floor(Math.random() * (height - h));
    const col = Math.floor(Math.random() * (width - w));

    const isWall = Math.random() < 0.3;
    const preset = TERRAIN_PRESETS[Math.floor(Math.random() * TERRAIN_PRESETS.length)];

    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        const id = grid.toId(r, c);
        if (isWall) grid.setWall(id);
        else grid.setTerrain(id, preset.id, preset.weight);
      }
    }
  }

  placeDefaultStartEnd(grid);
  return grid;
}

export const obstacleCourseGenerator: MazeGenerator = {
  id: 'obstacle-course',
  name: 'Obstacle Course',
  description:
    'Scatters a mix of wall blocks and weighted terrain patches (water, mud, ice, lava…) — a playground for weighted algorithms. Like Random Walls, solvability is not guaranteed on very small grids.',
  generate,
};
