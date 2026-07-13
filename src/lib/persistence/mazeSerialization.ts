import { Grid, SerializedGrid } from '@/lib/grid/Grid';

export interface MazeFile {
  formatVersion: 1;
  name: string;
  exportedAt: string;
  grid: SerializedGrid;
}

export function exportMazeToFile(grid: Grid, name: string): void {
  const file: MazeFile = {
    formatVersion: 1,
    name,
    exportedAt: new Date().toISOString(),
    grid: grid.serialize(),
  };
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/[^a-z0-9-_]+/gi, '_') || 'maze'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseMazeFile(text: string): Grid {
  const data = JSON.parse(text) as MazeFile;
  if (!data || data.formatVersion !== 1 || !data.grid) {
    throw new Error('Unrecognized maze file format.');
  }
  return Grid.deserialize(data.grid);
}

export async function importMazeFromFile(file: File): Promise<Grid> {
  const text = await file.text();
  return parseMazeFile(text);
}
