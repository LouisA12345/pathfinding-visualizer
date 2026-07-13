import { CellType, Grid } from '@/lib/grid/Grid';
import { MazeGenerator } from '../types';
import { placeDefaultStartEnd } from '../placement';

interface Room {
  row: number;
  col: number;
  w: number;
  h: number;
}

function overlaps(a: Room, b: Room, padding: number): boolean {
  return !(
    a.col + a.w + padding <= b.col ||
    b.col + b.w + padding <= a.col ||
    a.row + a.h + padding <= b.row ||
    b.row + b.h + padding <= a.row
  );
}

function generate(width: number, height: number): Grid {
  const grid = new Grid(width, height);
  grid.cellType.fill(CellType.Wall);

  const rooms: Room[] = [];
  const attempts = Math.max(6, Math.floor((width * height) / 90));

  for (let i = 0; i < attempts; i++) {
    const w = 3 + Math.floor(Math.random() * Math.max(2, Math.min(8, Math.floor(width / 5))));
    const h = 3 + Math.floor(Math.random() * Math.max(2, Math.min(8, Math.floor(height / 5))));
    if (w >= width - 1 || h >= height - 1) continue;
    const row = 1 + Math.floor(Math.random() * (height - h - 2));
    const col = 1 + Math.floor(Math.random() * (width - w - 2));
    const room: Room = { row, col, w, h };
    if (rooms.some((r) => overlaps(r, room, 2))) continue;
    rooms.push(room);
  }

  for (const room of rooms) {
    for (let r = room.row; r < room.row + room.h; r++) {
      for (let c = room.col; c < room.col + room.w; c++) {
        grid.erase(grid.toId(r, c));
      }
    }
  }

  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1];
    const b = rooms[i];
    const ar = a.row + Math.floor(a.h / 2);
    const ac = a.col + Math.floor(a.w / 2);
    const br = b.row + Math.floor(b.h / 2);
    const bc = b.col + Math.floor(b.w / 2);
    for (let c = Math.min(ac, bc); c <= Math.max(ac, bc); c++) grid.erase(grid.toId(ar, c));
    for (let r = Math.min(ar, br); r <= Math.max(ar, br); r++) grid.erase(grid.toId(r, bc));
  }

  if (rooms.length === 0) {
    // Grid too small for any room to fit — fall back to a fully open grid
    // rather than a single isolated open cell (which start/end placement
    // could pick two of independently, leaving them disconnected).
    grid.cellType.fill(CellType.Empty);
  }

  placeDefaultStartEnd(grid);
  return grid;
}

export const dungeonGenerator: MazeGenerator = {
  id: 'dungeon',
  name: 'Rooms & Corridors',
  description: 'Scatters non-overlapping rectangular rooms and connects them with straight corridors — a classic roguelike dungeon layout.',
  generate,
};
