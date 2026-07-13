import { Grid } from '@/lib/grid/Grid';
import { getNeighbors } from '@/lib/grid/neighbors';
import { MinHeap } from './heap';
import { AlgorithmDefinition, AlgorithmGenerator, RunOptions } from './types';
import { reconstructPath } from './path';

function* run(grid: Grid, startId: number, endId: number, opts: RunOptions): AlgorithmGenerator {
  const n = grid.size;
  const dist = new Float32Array(n).fill(Infinity);
  const visited = new Uint8Array(n);
  const parent = new Int32Array(n).fill(-1);
  const heap = new MinHeap<number>();
  let order = 0;

  dist[startId] = 0;
  heap.push(0, startId);
  yield { type: 'frontier', nodeId: startId, order: order++, cost: 0, pseudocodeLine: 1 };

  while (!heap.isEmpty()) {
    const current = heap.pop()!;
    if (visited[current]) continue;
    visited[current] = 1;
    yield { type: 'dequeue', nodeId: current, order: order++, cost: dist[current], pseudocodeLine: 3 };
    yield { type: 'visit', nodeId: current, order: order++, cost: dist[current], pseudocodeLine: 4 };
    if (current === endId) break;

    for (const { id: nb, cost } of getNeighbors(grid, current, opts.diagonalMovement, opts.cornerCutting)) {
      if (visited[nb]) continue;
      const newDist = dist[current] + cost;
      if (newDist < dist[nb]) {
        dist[nb] = newDist;
        parent[nb] = current;
        heap.push(newDist, nb);
        yield { type: 'frontier', nodeId: nb, order: order++, fromId: current, cost: newDist, pseudocodeLine: 8 };
      }
    }
  }

  return reconstructPath(parent, startId, endId);
}

export const dijkstraAlgorithm: AlgorithmDefinition = {
  id: 'dijkstra',
  name: "Dijkstra's Algorithm",
  shortName: 'Dijkstra',
  run,
  meta: {
    category: 'uninformed',
    pronunciation: "DIKE-struh's algorithm",
    spokenName: "Dijkstra's Algorithm",
    description:
      "Finds the lowest-cost path on weighted graphs by always expanding the frontier node with the smallest known cost-from-start, using a priority queue (min-heap).",
    intuition:
      "Imagine water flooding outward from the start, seeping fast through open floors and slowly through mud. Dijkstra always lets whichever point is currently cheapest to reach get soaked next, so by the time the flood reaches the goal, it has necessarily done so via the cheapest possible route — expensive terrain just makes the flood crawl slower there, never sneaks in a shortcut.",
    howItWorks:
      'Each node holds a tentative distance from the start, initially infinite except the start (0). Dijkstra repeatedly pops the unvisited node with the smallest tentative distance, marks it final, and relaxes its neighbors — updating their tentative distance if a shorter path through the current node is found.',
    timeComplexity: 'O((V + E) log V) with a binary heap',
    spaceComplexity: 'O(V)',
    optimal: true,
    complete: true,
    pseudocode: [
      'dist[start] ← 0, push(start, 0)',
      'while priority queue is not empty:',
      '  current ← pop node with smallest dist',
      '  mark current as visited/expanded',
      '  if current = goal: stop',
      '  for each neighbor of current:',
      '    newDist ← dist[current] + weight(current, neighbor)',
      '    if newDist < dist[neighbor]: update dist, parent, push(neighbor, newDist)',
    ],
    advantages: [
      'Guarantees the lowest-cost path on graphs with non-negative weights',
      'Naturally supports weighted terrain (mud, water, ice, etc.)',
      'Well understood, general-purpose, no heuristic required',
    ],
    disadvantages: [
      'No sense of direction toward the goal — expands uniformly by cost',
      'Slower than A* in practice when a good heuristic is available',
      "Doesn't support negative edge weights",
    ],
    useCases: [
      'Weighted shortest paths (road networks, terrain costs)',
      'When no reliable heuristic to the goal exists',
      'Single-source shortest paths to many destinations at once',
    ],
    history:
      'Designed by Edsger W. Dijkstra in 1956 and published in 1959. By his own account he devised it in about twenty minutes while sitting in a café in Amsterdam, without pen or paper, to demonstrate the capabilities of a new computer (the ARMAC) — he deliberately chose a problem, shortest routes between Dutch cities, that a general audience could immediately understand.',
    comparisons:
      "Dijkstra's algorithm is A* with the heuristic h(n) permanently fixed at zero — it has no sense of direction toward the goal, only cost-so-far. Whenever a good heuristic is available, A* will outperform it by exploring a much smaller region; Dijkstra's advantage is that it needs no heuristic at all, and it naturally finds shortest paths to every node, not just one target.",
    realWorldApplications: [
      'Link-state routing protocols on the internet (OSPF, IS-IS)',
      'GPS and mapping software computing cheapest/fastest routes',
      'Network latency and bandwidth optimization',
      'Telephone network routing',
    ],
  },
};
