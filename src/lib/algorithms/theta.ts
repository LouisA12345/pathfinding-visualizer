import { Grid } from '@/lib/grid/Grid';
import { getNeighbors } from '@/lib/grid/neighbors';
import { euclidean } from './heuristics';
import { MinHeap } from './heap';
import { AlgorithmDefinition, AlgorithmGenerator, RunOptions } from './types';
import { reconstructPath } from './path';

/** Bresenham line-of-sight: true if every cell on the straight line between the two points is walkable. */
function hasLineOfSight(grid: Grid, aId: number, bId: number): boolean {
  let [r, c] = grid.toRC(aId);
  const [r2, c2] = grid.toRC(bId);
  const dr = Math.abs(r2 - r);
  const dc = Math.abs(c2 - c);
  const sr = r2 > r ? 1 : -1;
  const sc = c2 > c ? 1 : -1;
  let err = dr - dc;

  for (;;) {
    if (!grid.isWalkable(grid.toId(r, c))) return false;
    if (r === r2 && c === c2) return true;
    const e2 = err * 2;
    if (e2 > -dc) {
      err -= dc;
      r += sr;
    }
    if (e2 < dr) {
      err += dr;
      c += sc;
    }
  }
}

/**
 * Theta*: an any-angle A* variant. When relaxing a neighbor, it first checks
 * line-of-sight from the *current node's parent* straight to that neighbor —
 * if clear, it connects directly to the parent (skipping the grid-aligned
 * hop through "current"), producing smoother, more realistic paths that
 * aren't confined to 0/45/90-degree turns.
 */
function* run(grid: Grid, startId: number, endId: number, opts: RunOptions): AlgorithmGenerator {
  const n = grid.size;
  const gScore = new Float32Array(n).fill(Infinity);
  const visited = new Uint8Array(n);
  const parent = new Int32Array(n).fill(-1);
  const heap = new MinHeap<number>();
  let order = 0;

  gScore[startId] = 0;
  parent[startId] = startId;
  heap.push(euclidean(grid, startId, endId), startId);
  yield { type: 'frontier', nodeId: startId, order: order++, pseudocodeLine: 1 };

  while (!heap.isEmpty()) {
    const current = heap.pop()!;
    if (visited[current]) continue;
    visited[current] = 1;
    yield { type: 'dequeue', nodeId: current, order: order++, cost: gScore[current], pseudocodeLine: 3 };
    yield { type: 'visit', nodeId: current, order: order++, cost: gScore[current], pseudocodeLine: 4 };
    if (current === endId) break;

    const par = parent[current];
    for (const { id: nb, cost } of getNeighbors(grid, current, opts.diagonalMovement, opts.cornerCutting)) {
      if (visited[nb]) continue;

      if (par !== current && hasLineOfSight(grid, par, nb)) {
        const tentative = gScore[par] + euclidean(grid, par, nb);
        if (tentative < gScore[nb]) {
          gScore[nb] = tentative;
          parent[nb] = par;
          heap.push(tentative + euclidean(grid, nb, endId), nb);
          yield { type: 'frontier', nodeId: nb, order: order++, fromId: par, cost: tentative, pseudocodeLine: 8 };
          continue;
        }
      }

      const tentative = gScore[current] + cost;
      if (tentative < gScore[nb]) {
        gScore[nb] = tentative;
        parent[nb] = current;
        heap.push(tentative + euclidean(grid, nb, endId), nb);
        yield { type: 'frontier', nodeId: nb, order: order++, fromId: current, cost: tentative, pseudocodeLine: 10 };
      }
    }
  }

  parent[startId] = -1;
  return reconstructPath(parent, startId, endId);
}

export const thetaAlgorithm: AlgorithmDefinition = {
  id: 'theta-star',
  name: 'Theta* (Any-Angle A*)',
  shortName: 'Theta*',
  run,
  meta: {
    category: 'grid-specific',
    pronunciation: 'THAY-tuh star',
    spokenName: 'Theta Star',
    description:
      'An any-angle variant of A* that connects a node directly to its grandparent when line-of-sight is clear, producing natural, unconstrained-angle paths instead of the 45°/90° zig-zags typical of grid search.',
    intuition:
      "Ordinary grid A* is forced to move in a staircase of right-angle steps even when a straight diagonal line would do. Theta* keeps checking 'can I actually see the earlier point directly, with nothing in the way?' — and if so, it cuts the corner and connects straight to it, producing a path that looks like a person walked it instead of a robot confined to graph paper.",
    howItWorks:
      'Whenever Theta* would relax a neighbor, it first checks whether the neighbor is directly visible (an unobstructed straight line) from the current node\'s parent. If so, it connects the neighbor straight to that parent using true Euclidean distance, skipping the intermediate grid-aligned hop. Otherwise it falls back to ordinary A* behavior.',
    timeComplexity: 'O((V + E) log V), with extra per-edge cost for line-of-sight checks',
    spaceComplexity: 'O(V)',
    optimal: true,
    complete: true,
    pseudocode: [
      'g[start] ← 0, parent[start] ← start',
      'while priority queue is not empty:',
      '  current ← pop node with smallest f = g + euclidean(current, goal)',
      '  mark current as visited/expanded',
      '  if current = goal: stop',
      '  for each neighbor of current:',
      '    if line-of-sight(parent[current], neighbor) is clear:',
      '      connect neighbor directly to parent[current] using true distance',
      '    else:',
      '      connect neighbor to current, as in ordinary A*',
    ],
    advantages: [
      'Produces visually natural, shorter paths that ignore the grid\'s artificial 45°/90° bias',
      'Still optimal on the underlying visibility graph',
      'Popular in robotics and game AI where paths must look believable',
    ],
    disadvantages: [
      'Line-of-sight checks add real per-step overhead compared to plain A*',
      'Assumes uniform-cost terrain — any-angle shortcuts don\'t account for weighted cells',
      'More complex to implement and reason about than grid-aligned A*',
    ],
    useCases: [
      'Robotics motion planning where smooth, realistic paths matter',
      'Game AI navigation on grid-based maps that should look human-like',
      'Any scenario where grid-constrained paths look artificially jagged',
    ],
    history:
      'Introduced by Alex Nash, Kenny Daniel, Sven Koenig, and Ariel Felner in their 2007 AAAI paper "Theta*: Any-Angle Path Planning on Grids." It was motivated by a very visible flaw in grid-based A*: even the shortest grid-constrained path often looks like an unnatural staircase where a straight diagonal line would clearly be shorter and more realistic.',
    comparisons:
      'Theta* is A* with one extra check per neighbor (line-of-sight to the current node\'s parent) — remove that check and it degenerates exactly to ordinary grid-based A*. Compared to Field D* (another any-angle planner used in some robotics systems), Theta* is simpler to implement, though Field D* handles replanning after the map changes more gracefully.',
    realWorldApplications: [
      "Path planning for mobile robots, whose movement isn't actually restricted to 8 directions",
      'Game AI that needs paths to look human-plausible rather than grid-snapped',
      'Drone and vehicle route planning over open terrain',
    ],
  },
};
