import { Grid } from '@/lib/grid/Grid';
import { getNeighbors } from '@/lib/grid/neighbors';
import { AlgorithmDefinition, AlgorithmGenerator, RunOptions } from './types';
import { reconstructPath } from './path';

function* run(grid: Grid, startId: number, endId: number, opts: RunOptions): AlgorithmGenerator {
  const n = grid.size;
  const visited = new Uint8Array(n);
  const parent = new Int32Array(n).fill(-1);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;
  let order = 0;

  queue[tail++] = startId;
  visited[startId] = 1;
  yield { type: 'frontier', nodeId: startId, order: order++, pseudocodeLine: 1 };

  while (head < tail) {
    const current = queue[head++];
    yield { type: 'dequeue', nodeId: current, order: order++, pseudocodeLine: 3 };
    yield { type: 'visit', nodeId: current, order: order++, pseudocodeLine: 4 };
    if (current === endId) break;

    for (const { id: nb } of getNeighbors(grid, current, opts.diagonalMovement, opts.cornerCutting)) {
      if (visited[nb]) continue;
      visited[nb] = 1;
      parent[nb] = current;
      queue[tail++] = nb;
      yield { type: 'frontier', nodeId: nb, order: order++, fromId: current, pseudocodeLine: 7 };
    }
  }

  return reconstructPath(parent, startId, endId);
}

export const bfsAlgorithm: AlgorithmDefinition = {
  id: 'bfs',
  name: 'Breadth-First Search',
  shortName: 'BFS',
  run,
  meta: {
    category: 'uninformed',
    pronunciation: 'BREDTH-first search',
    spokenName: 'Breadth First Search',
    description:
      'Explores the grid outward in rings, visiting every node at distance k before any node at distance k+1. Uses a FIFO queue.',
    intuition:
      "Picture ripples spreading out from a stone dropped in a pond. BFS visits every cell exactly one step away before any cell two steps away, so the instant a ripple touches the goal, it has necessarily arrived by the fewest possible steps — there's no way a later, farther-out ripple could have gotten there first.",
    howItWorks:
      'Starting from the source, BFS enqueues all unvisited neighbors of the current node, marks them visited, and repeats with the next node in the queue. Because it expands in order of distance from the source, the first time it reaches the target is guaranteed to be via a shortest path (in terms of edge count).',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    optimal: true,
    complete: true,
    pseudocode: [
      'queue ← {start}, visited ← {start}',
      'while queue is not empty:',
      '  current ← queue.dequeue()',
      '  mark current as visited/expanded',
      '  if current = goal: stop',
      '  for each neighbor of current:',
      '    if neighbor not visited:',
      '      mark visited, parent[neighbor] ← current',
      '      queue.enqueue(neighbor)',
    ],
    advantages: [
      'Guarantees the shortest path on unweighted grids',
      'Simple to implement and reason about',
      'Complete — will find a solution if one exists',
    ],
    disadvantages: [
      'Ignores edge weights — not shortest-path-optimal on weighted terrain',
      'Explores uniformly in all directions, wasting work when the goal direction is known',
      'Memory grows quickly on large open grids',
    ],
    useCases: [
      'Unweighted shortest path / maze solving',
      'Finding the shortest number of moves in puzzles/games',
      'Flood fill and connectivity checks',
    ],
    history:
      'Formalized by Edward F. Moore in 1959 in "The Shortest Path Through a Maze," and independently discovered by C. Y. Lee in 1961 for circuit routing (the "Lee algorithm"). It is one of the oldest graph traversal strategies, predating most of modern algorithmic complexity theory.',
    comparisons:
      "BFS is what Dijkstra's algorithm reduces to when every edge has the same weight — it uses a plain FIFO queue instead of a priority queue because that alone is enough to guarantee visiting nodes in order of distance. Bidirectional BFS is the same algorithm run from both ends at once, finding the same shortest path while touching far fewer nodes.",
    realWorldApplications: [
      "Lee's algorithm for PCB and chip circuit routing",
      'Finding shortest connections in social networks ("degrees of separation")',
      'Web crawlers exploring pages level by level',
      'Flood fill in image editors and Minesweeper-style games',
    ],
  },
};
