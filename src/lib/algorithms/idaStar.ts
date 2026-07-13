import { Grid } from '@/lib/grid/Grid';
import { getNeighbors, Neighbor } from '@/lib/grid/neighbors';
import { heuristicFor } from './heuristics';
import { AlgorithmDefinition, AlgorithmGenerator, RunOptions } from './types';
import { reconstructPath } from './path';

/**
 * Safety valve: textbook IDA* (pure DFS, no memoization) can revisit the
 * same node an astronomical number of times on open grids with many
 * equal-cost paths — this is a real, well-documented weakness of the
 * algorithm, not a bug. Left unbounded it doesn't just get slow, it can
 * exhaust the tab's memory. Two mitigations: a per-iteration "best g seen"
 * table prunes provably-inferior duplicate visits (this does raise memory
 * use above textbook IDA*'s O(depth), but it's the difference between
 * "usable on a grid" and "crashes the tab"), and a hard step cap that gives
 * up rather than growing forever.
 */
const MAX_STEPS = 250_000;
const MAX_ITERATIONS = 300;

interface Frame {
  nodeId: number;
  g: number;
  neighbors: Neighbor[];
  neighborIndex: number;
}

function* run(grid: Grid, startId: number, endId: number, opts: RunOptions): AlgorithmGenerator {
  const n = grid.size;
  const h = heuristicFor(opts.diagonalMovement);
  let order = 0;
  let threshold = h(grid, startId, endId);

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const bestG = new Float32Array(n).fill(Infinity);
    const parent = new Int32Array(n).fill(-1);
    const stack: Frame[] = [{ nodeId: startId, g: 0, neighbors: [], neighborIndex: -1 }];
    bestG[startId] = 0;
    let nextThreshold = Infinity;
    let foundEnd = false;

    yield { type: 'frontier', nodeId: startId, order: order++, pseudocodeLine: 2 };

    while (stack.length > 0 && !foundEnd) {
      if (order > MAX_STEPS) return { path: [], aborted: true };
      const frame = stack[stack.length - 1];

      if (frame.neighborIndex === -1) {
        yield { type: 'visit', nodeId: frame.nodeId, order: order++, cost: frame.g, pseudocodeLine: 3 };
        if (frame.nodeId === endId) {
          foundEnd = true;
          break;
        }
        frame.neighbors = getNeighbors(grid, frame.nodeId, opts.diagonalMovement, opts.cornerCutting);
        frame.neighborIndex = 0;
      }

      if (frame.neighborIndex >= frame.neighbors.length) {
        stack.pop();
        continue;
      }

      const { id: nb, cost } = frame.neighbors[frame.neighborIndex];
      frame.neighborIndex++;

      const g2 = frame.g + cost;
      if (g2 >= bestG[nb]) continue;

      const f2 = g2 + h(grid, nb, endId);
      if (f2 > threshold) {
        nextThreshold = Math.min(nextThreshold, f2);
        continue;
      }

      bestG[nb] = g2;
      parent[nb] = frame.nodeId;
      stack.push({ nodeId: nb, g: g2, neighbors: [], neighborIndex: -1 });
      yield { type: 'frontier', nodeId: nb, order: order++, fromId: frame.nodeId, cost: g2, pseudocodeLine: 3 };
    }

    if (foundEnd) return reconstructPath(parent, startId, endId);
    if (nextThreshold === Infinity) return [];
    threshold = nextThreshold;
  }

  return { path: [], aborted: true };
}

export const idaStarAlgorithm: AlgorithmDefinition = {
  id: 'ida-star',
  name: 'IDA* (Iterative Deepening A*)',
  shortName: 'IDA*',
  run,
  meta: {
    category: 'informed',
    pronunciation: 'EYE-DEE-AY star',
    spokenName: 'Iterative Deepening A Star',
    description:
      'Runs a series of depth-first searches, each bounded by an increasing f-cost threshold, trading A*\'s memory usage for repeated work.',
    intuition:
      "A* remembers its entire frontier at once, which costs memory. IDA* instead explores like a hiker with no notepad: charge ahead depth-first until a distance budget runs out, backtrack, and if the goal still wasn't found, raise the budget slightly and redo the entire hike from scratch. It trades a lot of repeated walking for needing to remember almost nothing.",
    howItWorks:
      'Instead of a priority queue holding every frontier node, IDA* does a plain depth-first search that abandons any branch once its f = g + h exceeds the current threshold. If the goal isn\'t found, the threshold is raised to the smallest f-value that got pruned, and the whole search restarts from scratch. This uses only as much memory as the current path\'s depth, at the cost of re-visiting nodes across iterations. This implementation adds a per-iteration table of the best cost seen to each node, pruning provably-worse duplicate visits — without it, open grids have so many equal-length routes between two points that textbook IDA* can exhaust a browser tab\'s memory rather than just running slowly.',
    timeComplexity: 'Can be exponential in the worst case on grids with many equal-cost paths; O(bd) per iteration for branching factor b, depth d',
    spaceComplexity: 'O(d) in theory (just the current path); this implementation trades some of that for an O(V) duplicate-pruning table to stay practical on grids',
    optimal: true,
    complete: true,
    pseudocode: [
      'threshold ← h(start, goal)',
      'loop:',
      '  result ← depth-first search from start, pruning any node with f = g + h > threshold',
      '           (and any duplicate visit no cheaper than one already seen this iteration)',
      '  if goal found: return path',
      '  if nothing was pruned: no path exists',
      '  threshold ← smallest f-value that got pruned this iteration',
    ],
    advantages: [
      'Uses dramatically less memory than A* in principle — just the current path depth',
      'Still guarantees the optimal path when it completes',
      'No priority queue overhead per step',
    ],
    disadvantages: [
      'Re-explores nodes across iterations — can be much slower than A* in practice',
      'Performs especially poorly on long, winding mazes, where the heuristic badly underestimates the true distance and many threshold-raising iterations are needed — on very large mazes it can give up without finding a path at all (shown as "exceeded its step budget", not "no path exists"). Counter-intuitively, wide open grids are its easy case, since the heuristic there is close to exact and few iterations are needed.',
      'Choosing a good initial threshold matters a lot for performance',
    ],
    useCases: [
      'Memory-constrained environments (embedded systems, huge state spaces)',
      'Puzzle solving (sliding tile puzzles, Rubik\'s Cube) where A*\'s memory use is prohibitive',
      'Search spaces where depth is small relative to branching factor',
    ],
    history:
      'Invented by Richard Korf in 1985 and presented in his paper "Depth-First Iterative-Deepening: An Optimal Admissible Tree Search." Korf was motivated by memory, not speed: mid-1980s hardware made A*\'s need to hold every frontier node in memory a hard practical ceiling on problems like the 15-puzzle and Rubik\'s Cube, which IDA* sidestepped by using only as much memory as the current path\'s depth.',
    comparisons:
      "IDA* is A* reimagined as repeated depth-first searches instead of one priority-queue-driven search — the same optimality guarantee, a radically different memory profile. It shines on tree-like search spaces (puzzles, where a state is rarely reached two different ways) and struggles on grid graphs (where it usually is), which is exactly the weakness this app's implementation works around with duplicate-path pruning.",
    realWorldApplications: [
      'Solving sliding-tile puzzles and Rubik\'s Cube (its original and best-known use case)',
      "Any large tree-shaped search space where A*'s memory use is the binding constraint, not its speed",
    ],
  },
};
