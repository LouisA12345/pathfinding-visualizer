export interface TerrainPreset {
  id: number;
  key: string;
  name: string;
  weight: number;
  color: string;
  description: string;
}

/**
 * Terrain types are just named weight+color presets layered on top of the
 * grid's existing `weight` field — no separate system needed, but they give
 * drawing a lot of educational/visual payoff for very little cost.
 */
export const TERRAIN_PRESETS: TerrainPreset[] = [
  { id: 1, key: 'road', name: 'Road', weight: 0.5, color: '#94a3b8', description: 'Fast, cheap to traverse.' },
  { id: 2, key: 'forest', name: 'Forest', weight: 2, color: '#166534', description: 'Moderately costly terrain.' },
  { id: 3, key: 'mud', name: 'Mud', weight: 3, color: '#78350f', description: 'Slow going, high cost.' },
  { id: 4, key: 'water', name: 'Water', weight: 4, color: '#0284c7', description: 'Very costly to cross.' },
  { id: 5, key: 'ice', name: 'Ice', weight: 1.25, color: '#a5f3fc', description: 'Slippery but quick.' },
  { id: 6, key: 'lava', name: 'Lava', weight: 12, color: '#dc2626', description: 'Extremely costly — near-impassable.' },
];

export function getTerrainPreset(id: number): TerrainPreset | undefined {
  return TERRAIN_PRESETS.find((t) => t.id === id);
}
