import { Grid } from '@/lib/grid/Grid';
import { getNeighbors } from '@/lib/grid/neighbors';
import { heuristicFor } from './heuristics';
import { MinHeap } from './heap';
import { AlgorithmDefinition, AlgorithmGenerator, RunOptions } from './types';
import { reconstructPath } from './path';

function* run(grid: Grid, startId: number, endId: number, opts: RunOptions): AlgorithmGenerator {
  const n = grid.size;
  const w = opts.heuristicWeight ?? 1.5;
  const h = heuristicFor(opts.diagonalMovement);
  const gScore = new Float32Array(n).fill(Infinity);
  const visited = new Uint8Array(n);
  const parent = new Int32Array(n).fill(-1);
  const heap = new MinHeap<number>();
  let order = 0;

  gScore[startId] = 0;
  heap.push(w * h(grid, startId, endId), startId);
  yield { type: 'frontier', nodeId: startId, order: order++, cost: 0, pseudocodeLine: 1 };

  while (!heap.isEmpty()) {
    const current = heap.pop()!;
    if (visited[current]) continue;
    visited[current] = 1;
    yield { type: 'dequeue', nodeId: current, order: order++, cost: gScore[current], pseudocodeLine: 3 };
    yield { type: 'visit', nodeId: current, order: order++, cost: gScore[current], pseudocodeLine: 4 };
    if (current === endId) break;

    for (const { id: nb, cost } of getNeighbors(grid, current, opts.diagonalMovement, opts.cornerCutting)) {
      if (visited[nb]) continue;
      const tentativeG = gScore[current] + cost;
      if (tentativeG < gScore[nb]) {
        gScore[nb] = tentativeG;
        parent[nb] = current;
        const f = tentativeG + w * h(grid, nb, endId);
        heap.push(f, nb);
        yield { type: 'frontier', nodeId: nb, order: order++, fromId: current, cost: tentativeG, pseudocodeLine: 9 };
      }
    }
  }

  return reconstructPath(parent, startId, endId);
}

export const weightedAstarAlgorithm: AlgorithmDefinition = {
  id: 'weighted-astar',
  name: 'Weighted A*',
  shortName: 'Weighted A*',
  run,
  meta: {
    category: 'informed',
    pronunciation: 'WAY-tid AY-star',
    spokenName: 'Weighted A Star',
    description:
      'A* with the heuristic multiplied by a weight w > 1 (f = g + w·h), trading guaranteed optimality for faster, more goal-directed search.',
    intuition:
      "Take A*'s pull toward the goal and turn it up. A stronger pull gets the search there faster, but it also means the search starts trusting 'this direction looks promising' more than 'this is what I've actually confirmed is cheapest' — so the path it finds can end up a little longer than the true shortest one, in exchange for exploring far less of the map.",
    howItWorks:
      'Identical to A*, except the heuristic term is scaled by a weight (default 1.5). Larger weights make the search behave more like Greedy Best-First (fast, but potentially suboptimal); w = 1 recovers plain A*.',
    timeComplexity: 'O((V + E) log V) worst case, typically much faster in practice than plain A*',
    spaceComplexity: 'O(V)',
    optimal: false,
    complete: true,
    pseudocode: [
      'g[start] ← 0, push(start, w · h(start, goal))',
      'while priority queue is not empty:',
      '  current ← pop node with smallest f = g + w·h',
      '  mark current as visited/expanded',
      '  if current = goal: stop',
      '  for each neighbor of current:',
      '    tentativeG ← g[current] + weight(current, neighbor)',
      '    if tentativeG < g[neighbor]:',
      '      update g, parent; push(neighbor, tentativeG + w · h(neighbor, goal))',
    ],
    advantages: [
      'Noticeably faster than plain A*, visiting fewer nodes',
      'Tunable — the weight lets you trade path quality for speed',
      'Still uses full cost information, unlike pure greedy search',
    ],
    disadvantages: [
      'No longer guaranteed to find the optimal path once w > 1',
      'Path quality degrades unpredictably as w grows',
      'Requires picking a reasonable weight for the scenario',
    ],
    useCases: [
      'Real-time systems where "good enough, fast" beats "optimal, slow"',
      'Large maps where plain A* is too slow',
      'Anytime-style planning where a quick first path is refined later',
    ],
    history:
      'The idea of inflating A*\'s heuristic to trade optimality for speed was explored throughout the 1970s AI search literature, notably by Ira Pohl, as part of a broader study of "weighted" and "bounded suboptimal" heuristic search. It is less a single named invention than a well-known, deliberate relaxation of Hart, Nilsson, and Raphael\'s original A*.',
    comparisons:
      'Weighted A* sits on a dial between plain A* (weight = 1, optimal) and Greedy Best-First Search (as the weight grows very large, cost-so-far stops mattering and it behaves almost like pure greedy search). It is the algorithm to reach for when you want something faster than A* but more careful than Greedy Best-First.',
    realWorldApplications: [
      'Real-time game AI where a good-enough path this frame beats a perfect path next frame',
      'Anytime planning systems that refine an initial fast path over time',
      'Large-scale logistics routing where near-optimal is an acceptable trade for speed',
    ],
  },
};
