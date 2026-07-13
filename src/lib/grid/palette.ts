export interface GridPalette {
  background: string;
  gridLine: string;
  wall: string;
  frontier: string;
  visited: string;
  path: string;
  start: string;
  end: string;
  checkpoint: string;
  text: string;
  markerText: string;
}

const dark: GridPalette = {
  background: '#0f1117',
  gridLine: 'rgba(255,255,255,0.045)',
  wall: '#232838',
  frontier: '#38bdf8',
  visited: '#2354c9',
  path: '#facc15',
  start: '#22c55e',
  end: '#ef4444',
  checkpoint: '#a855f7',
  text: 'rgba(226,232,240,0.65)',
  markerText: '#0b1220',
};

const light: GridPalette = {
  // Warm off-white instead of stark cool white/near-black — softer on the
  // eyes over long sessions while keeping comfortable contrast.
  background: '#f7f6f2',
  gridLine: 'rgba(41,37,30,0.07)',
  wall: '#453f36',
  frontier: '#7dd3fc',
  visited: '#3b82f6',
  path: '#eab308',
  start: '#16a34a',
  end: '#dc2626',
  checkpoint: '#9333ea',
  text: 'rgba(41,37,30,0.6)',
  markerText: '#f7f6f2',
};

const darkHighContrast: GridPalette = {
  ...dark,
  background: '#000000',
  wall: '#ffffff',
  frontier: '#00e5ff',
  visited: '#3366ff',
  path: '#ffee00',
  start: '#00ff66',
  end: '#ff1a1a',
  checkpoint: '#e066ff',
  gridLine: 'rgba(255,255,255,0.18)',
  text: '#ffffff',
};

const lightHighContrast: GridPalette = {
  ...light,
  background: '#ffffff',
  wall: '#000000',
  frontier: '#0091b3',
  visited: '#0033cc',
  path: '#a37800',
  start: '#008033',
  end: '#cc0000',
  checkpoint: '#7000b3',
  gridLine: 'rgba(0,0,0,0.25)',
  text: '#000000',
};

export function getPalette(theme: 'light' | 'dark', highContrast: boolean): GridPalette {
  if (theme === 'dark') return highContrast ? darkHighContrast : dark;
  return highContrast ? lightHighContrast : light;
}
