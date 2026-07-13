import { AlgorithmDefinition } from './types';
import { bfsAlgorithm } from './bfs';
import { dfsAlgorithm } from './dfs';
import { dijkstraAlgorithm } from './dijkstra';
import { astarAlgorithm } from './astar';
import { weightedAstarAlgorithm } from './weightedAstar';
import { greedyBestFirstAlgorithm } from './greedyBestFirst';
import { bidirectionalBfsAlgorithm } from './bidirectionalBfs';
import { jpsAlgorithm } from './jps';
import { bidirectionalAstarAlgorithm } from './bidirectionalAstar';
import { thetaAlgorithm } from './theta';
import { idaStarAlgorithm } from './idaStar';
import { bellmanFordAlgorithm } from './bellmanFord';
import { wavefrontAlgorithm } from './wavefront';
import { fringeSearchAlgorithm } from './fringeSearch';
import { floydWarshallAlgorithm } from './floydWarshall';

export const ALGORITHMS: AlgorithmDefinition[] = [
  bfsAlgorithm,
  dfsAlgorithm,
  dijkstraAlgorithm,
  astarAlgorithm,
  weightedAstarAlgorithm,
  greedyBestFirstAlgorithm,
  bidirectionalBfsAlgorithm,
  jpsAlgorithm,
  bidirectionalAstarAlgorithm,
  thetaAlgorithm,
  idaStarAlgorithm,
  bellmanFordAlgorithm,
  wavefrontAlgorithm,
  fringeSearchAlgorithm,
  floydWarshallAlgorithm,
];

export const ALGORITHM_MAP: Record<string, AlgorithmDefinition> = Object.fromEntries(
  ALGORITHMS.map((a) => [a.id, a])
);

export function getAlgorithm(id: string): AlgorithmDefinition | undefined {
  return ALGORITHM_MAP[id];
}

/**
 * Live keyboard quick-switch keys — deliberately just 1-9 (not 0/-/= too).
 * Every algorithm still gets a numbered position tag in the UI regardless of
 * list length (see AlgorithmPicker), but a numbered *tag* that isn't
 * actually a number (like "-" or "=") reads as broken, and this list is
 * only going to get longer as more algorithms are added — so the keyboard
 * shortcut itself stays capped at the universally-understood 1-9 range.
 */
const SHORTCUT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function shortcutKeyForIndex(index: number): string | null {
  return SHORTCUT_KEYS[index] ?? null;
}

export function indexForShortcutKey(key: string): number | null {
  const index = SHORTCUT_KEYS.indexOf(key);
  return index === -1 ? null : index;
}
