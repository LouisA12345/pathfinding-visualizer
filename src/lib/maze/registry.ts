import { MazeGenerator } from './types';
import { emptyGridGenerator } from './generators/emptyGrid';
import { randomWallsGenerator } from './generators/randomWalls';
import { recursiveDivisionGenerator } from './generators/recursiveDivision';
import { recursiveBacktrackingGenerator } from './generators/recursiveBacktracking';
import { primGenerator } from './generators/prim';
import { binaryTreeGenerator } from './generators/binaryTree';
import { sidewinderGenerator } from './generators/sidewinder';
import { wilsonGenerator } from './generators/wilson';
import { growingTreeGenerator } from './generators/growingTree';
import { spiralGenerator } from './generators/spiral';
import { dungeonGenerator } from './generators/dungeon';
import { symmetricalGenerator } from './generators/symmetrical';
import { obstacleCourseGenerator } from './generators/obstacleCourse';

export const MAZE_GENERATORS: MazeGenerator[] = [
  emptyGridGenerator,
  randomWallsGenerator,
  recursiveDivisionGenerator,
  recursiveBacktrackingGenerator,
  primGenerator,
  binaryTreeGenerator,
  sidewinderGenerator,
  wilsonGenerator,
  growingTreeGenerator,
  spiralGenerator,
  dungeonGenerator,
  symmetricalGenerator,
  obstacleCourseGenerator,
];

export const MAZE_GENERATOR_MAP: Record<string, MazeGenerator> = Object.fromEntries(
  MAZE_GENERATORS.map((g) => [g.id, g])
);

export function getMazeGenerator(id: string): MazeGenerator | undefined {
  return MAZE_GENERATOR_MAP[id];
}
