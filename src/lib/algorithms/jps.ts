import { Grid } from '@/lib/grid/Grid';
import { heuristicFor } from './heuristics';
import { MinHeap } from './heap';
import { AlgorithmDefinition, AlgorithmGenerator, RunOptions } from './types';
import { reconstructPath } from './path';

const ORTHOGONAL_DIRS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const DIAGONAL_DIRS: [number, number][] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

/**
 * Jump Point Search. Assumes uniform movement cost (as classic JPS does) —
 * it deliberately does not account for weighted terrain, since the whole
 * technique relies on skipping long runs of identical-cost free space.
 *
 * This implementation performs full jump-point detection (the part that
 * gives JPS its speed on open corridors) but expands all 8/4 directions from
 * every node rather than applying the full textbook natural/forced-neighbor
 * *direction* pruning table. That trade-off keeps the algorithm simple and
 * provably correct (it always finds the optimal path) while still skipping
 * over open space — at the cost of expanding slightly more nodes than a
 * fully-pruned textbook JPS.
 */
function* run(grid: Grid, startId: number, endId: number, opts: RunOptions): AlgorithmGenerator {
  const diagonal = opts.diagonalMovement;
  const cornerCutting = opts.cornerCutting;
  const h = heuristicFor(diagonal);
  const n = grid.size;
  const gScore = new Float32Array(n).fill(Infinity);
  const visited = new Uint8Array(n);
  const parent = new Int32Array(n).fill(-1);
  const heap = new MinHeap<number>();
  let order = 0;

  const [endRow, endCol] = grid.toRC(endId);
  const dirs = diagonal ? [...ORTHOGONAL_DIRS, ...DIAGONAL_DIRS] : ORTHOGONAL_DIRS;

  function canWalk(row: number, col: number): boolean {
    return grid.inBounds(row, col) && grid.isWalkable(grid.toId(row, col));
  }

  function jump(fromRow: number, fromCol: number, dr: number, dc: number): [number, number] | null {
    const row = fromRow + dr;
    const col = fromCol + dc;

    if (dr !== 0 && dc !== 0) {
      if (!canWalk(row, col)) return null;
      if (!cornerCutting && (!canWalk(fromRow, col) || !canWalk(row, fromCol))) return null;
    } else if (!canWalk(row, col)) {
      return null;
    }

    if (row === endRow && col === endCol) return [row, col];

    if (!diagonal) {
      // JPS's forced-neighbor pruning is defined in terms of diagonal-movement
      // geometry: a jump point is where an obstacle newly opens up a
      // perpendicular passage. On a purely orthogonal (4-connected) grid with
      // no obstacles, nothing ever "newly opens" — every cell looks the same —
      // so scanning for a forced neighbor would never fire, and the search
      // would silently fail to progress toward a goal that isn't on the exact
      // same row/column as the start. Treat every step as its own jump point
      // instead: correct on any grid, just without JPS's speed benefit, which
      // doesn't apply without diagonal movement anyway.
      return [row, col];
    }

    if (dr !== 0 && dc !== 0) {
      const forced =
        (canWalk(row, fromCol) && !canWalk(row, fromCol - dc)) ||
        (canWalk(fromRow, col) && !canWalk(fromRow - dr, col));
      if (forced) return [row, col];

      if (jump(row, col, 0, dc) !== null) return [row, col];
      if (jump(row, col, dr, 0) !== null) return [row, col];

      if (!cornerCutting && (!canWalk(row, col + dc) || !canWalk(row + dr, col))) return null;
      return jump(row, col, dr, dc);
    }

    if (dc !== 0) {
      const forced =
        (canWalk(row + 1, col) && !canWalk(row + 1, fromCol)) ||
        (canWalk(row - 1, col) && !canWalk(row - 1, fromCol));
      if (forced) return [row, col];
    } else {
      const forced =
        (canWalk(row, col + 1) && !canWalk(fromRow, col + 1)) ||
        (canWalk(row, col - 1) && !canWalk(fromRow, col - 1));
      if (forced) return [row, col];
    }

    return jump(row, col, dr, dc);
  }

  gScore[startId] = 0;
  heap.push(h(grid, startId, endId), startId);
  yield { type: 'frontier', nodeId: startId, order: order++, pseudocodeLine: 1 };

  while (!heap.isEmpty()) {
    const current = heap.pop()!;
    if (visited[current]) continue;
    visited[current] = 1;
    yield { type: 'dequeue', nodeId: current, order: order++, cost: gScore[current], pseudocodeLine: 3 };
    yield { type: 'visit', nodeId: current, order: order++, cost: gScore[current], pseudocodeLine: 4 };
    if (current === endId) break;

    const [row, col] = grid.toRC(current);
    for (const [dr, dc] of dirs) {
      if (dr !== 0 && dc !== 0 && !cornerCutting) {
        if (!canWalk(row + dr, col) || !canWalk(row, col + dc)) continue;
      }
      const jp = jump(row, col, dr, dc);
      if (!jp) continue;
      const [jr, jc] = jp;
      const jid = grid.toId(jr, jc);
      if (visited[jid]) continue;

      const steps = Math.max(Math.abs(jr - row), Math.abs(jc - col));
      const cost = dr !== 0 && dc !== 0 ? steps * Math.SQRT2 : steps;
      const tentativeG = gScore[current] + cost;
      if (tentativeG < gScore[jid]) {
        gScore[jid] = tentativeG;
        parent[jid] = current;
        heap.push(tentativeG + h(grid, jid, endId), jid);
        yield { type: 'frontier', nodeId: jid, order: order++, fromId: current, cost: tentativeG, pseudocodeLine: 9 };
      }
    }
  }

  return reconstructPath(parent, startId, endId);
}

export const jpsAlgorithm: AlgorithmDefinition = {
  id: 'jps',
  name: 'Jump Point Search',
  shortName: 'JPS',
  run,
  meta: {
    category: 'grid-specific',
    pronunciation: 'jump point search',
    spokenName: 'Jump Point Search',
    description:
      'An A* variant specialized for uniform-cost grids that "jumps" over long runs of open space instead of expanding every single cell, skipping straight to the next cell where a decision actually matters.',
    intuition:
      "On a wide-open floor, you don't need to check every single tile between two doorways — you just walk straight to the doorway. JPS does exactly that: it skips straight across long stretches of open space and only stops to think at the points where a wall actually forces a decision, instead of pausing at every single step along the way.",
    howItWorks:
      'Instead of adding every adjacent cell to the frontier, JPS scans in a straight or diagonal line from the current node until it hits the goal, an obstacle, or a "forced neighbor" — a point where an obstacle forces a direction change. Only these jump points are added to the priority queue, so long open corridors are crossed in a single step instead of hundreds.',
    timeComplexity: 'O((V + E) log V) worst case, but typically far fewer nodes expanded than A* in practice',
    spaceComplexity: 'O(V)',
    optimal: true,
    complete: true,
    pseudocode: [
      'push(start, h(start, goal))',
      'while priority queue is not empty:',
      '  current ← pop node with smallest f = g + h',
      '  mark current as visited/expanded',
      '  if current = goal: stop',
      '  for each of the 8/4 directions:',
      '    jumpPoint ← jump(current, direction)  // scan until goal/obstacle/forced-turn',
      '    if jumpPoint found and improves g-score:',
      '      update g, parent; push(jumpPoint, g + h(jumpPoint, goal))',
    ],
    advantages: [
      'Explores dramatically fewer nodes than A* on open maps with sparse obstacles',
      'Still provably finds the optimal path',
      'Especially effective on large, mostly-open grids',
    ],
    disadvantages: [
      'Only applies to uniform-cost grids — cannot use weighted terrain',
      'More complex to implement and understand than A*',
      'Provides little to no benefit on dense, maze-like grids',
      "Its jump-point shortcut is fundamentally a diagonal-movement technique — with diagonal movement turned off, it degrades to plain single-step expansion (still correct, just no faster than A*)",
    ],
    useCases: [
      'Large open-world game maps',
      'Grid maps with few, large obstacles',
      'Any uniform-cost grid where A* spends most of its time in open space',
    ],
    history:
      'Introduced by Daniel Harabor and Alban Grastien in their 2011 AAAI paper "Online Graph Pruning for Pathfinding on Grid Maps." It was specifically motivated by the video game industry\'s need to run A*-quality pathfinding fast on the large, mostly-open grid maps common in strategy and simulation games.',
    comparisons:
      'JPS is A* with a smarter neighbor-generation step: instead of expanding to every adjacent cell, it "jumps" straight to the next cell where a decision actually matters. It produces the exact same optimal path as plain A* on a uniform-cost grid, just by visiting far fewer intermediate cells along the way.',
    realWorldApplications: [
      'Real-time strategy and simulation games with large open maps (its original motivating use case)',
      'Any grid-based pathfinding system where uniform movement cost makes the jump-point optimization valid',
    ],
  },
};
