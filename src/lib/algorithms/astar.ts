import { Grid } from '@/lib/grid/Grid';
import { getNeighbors } from '@/lib/grid/neighbors';
import { heuristicFor } from './heuristics';
import { MinHeap } from './heap';
import { AlgorithmDefinition, AlgorithmGenerator, RunOptions } from './types';
import { reconstructPath } from './path';

function* run(grid: Grid, startId: number, endId: number, opts: RunOptions): AlgorithmGenerator {
  const n = grid.size;
  const h = heuristicFor(opts.diagonalMovement);
  const gScore = new Float32Array(n).fill(Infinity);
  const visited = new Uint8Array(n);
  const parent = new Int32Array(n).fill(-1);
  const heap = new MinHeap<number>();
  let order = 0;

  gScore[startId] = 0;
  heap.push(h(grid, startId, endId), startId);
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
        const f = tentativeG + h(grid, nb, endId);
        heap.push(f, nb);
        yield { type: 'frontier', nodeId: nb, order: order++, fromId: current, cost: tentativeG, pseudocodeLine: 9 };
      }
    }
  }

  return reconstructPath(parent, startId, endId);
}

export const astarAlgorithm: AlgorithmDefinition = {
  id: 'astar',
  name: 'A* Search',
  shortName: 'A*',
  run,
  meta: {
    category: 'informed',
    pronunciation: 'AY-star search',
    spokenName: 'A Star Search',
    description:
      'Combines Dijkstra’s cost-so-far with a heuristic estimate of the remaining distance, expanding nodes in order of f = g + h. The gold-standard grid pathfinding algorithm.',
    intuition:
      "The same flood-fill idea as Dijkstra, except every drop of water also feels a pull toward the goal — a heuristic 'gravity' that biases the spread in the goal's direction. That pull means far less of the map has to get flooded before the water reaches its destination, without giving up the guarantee that it arrives by the cheapest route.",
    howItWorks:
      'Like Dijkstra, but the priority queue orders nodes by f(n) = g(n) + h(n), where g(n) is the known cost from the start and h(n) is an admissible heuristic (Manhattan/Octile distance) estimating the cost to the goal. This biases expansion toward the goal without sacrificing optimality, as long as h never overestimates the true cost.',
    timeComplexity: 'O(E) in the best case with a good heuristic; O((V + E) log V) worst case',
    spaceComplexity: 'O(V)',
    optimal: true,
    complete: true,
    pseudocode: [
      'g[start] ← 0, push(start, h(start, goal))',
      'while priority queue is not empty:',
      '  current ← pop node with smallest f = g + h',
      '  mark current as visited/expanded',
      '  if current = goal: stop',
      '  for each neighbor of current:',
      '    tentativeG ← g[current] + weight(current, neighbor)',
      '    if tentativeG < g[neighbor]:',
      '      update g, parent; push(neighbor, tentativeG + h(neighbor, goal))',
    ],
    advantages: [
      'Optimal and complete when the heuristic is admissible',
      'Explores far fewer nodes than Dijkstra by using directional guidance',
      'The de-facto standard for grid and game pathfinding',
    ],
    disadvantages: [
      'Quality depends entirely on having a good heuristic',
      'Still explores a wide area on grids with many obstacles',
      'Memory can still grow large on huge open maps',
    ],
    useCases: [
      'Game AI and NPC navigation',
      'Robotics motion planning',
      'Any weighted shortest-path problem with a usable distance estimate',
    ],
    history:
      'Developed in 1968 by Peter Hart, Nils Nilsson, and Bertram Raphael at Stanford Research Institute while working on Shakey the Robot, one of the first mobile robots capable of reasoning about its own actions. They proved A* is optimal given an admissible heuristic — the name simply reflects that it is the "starred" (provably optimal) member of a family of related algorithms they analyzed.',
    comparisons:
      "A* is Dijkstra's algorithm plus a heuristic term — set h(n) = 0 and it becomes Dijkstra exactly. Compared to Greedy Best-First Search (which uses only h and ignores accumulated cost g), A* is slower but never sacrifices optimality; compared to Weighted A*, plain A* is simply the w = 1 special case.",
    realWorldApplications: [
      'Non-player character navigation in most commercial video games',
      'Robotics motion planning (its original purpose, for Shakey the Robot)',
      'Puzzle solvers (15-puzzle, Rubik\'s Cube with the right heuristic)',
      'Route planning in logistics and GPS software',
    ],
  },
};
