import { Grid } from '@/lib/grid/Grid';
import { getNeighbors } from '@/lib/grid/neighbors';
import { heuristicFor } from './heuristics';
import { MinHeap } from './heap';
import { AlgorithmDefinition, AlgorithmGenerator, RunOptions } from './types';
import { reconstructPath } from './path';

function* run(grid: Grid, startId: number, endId: number, opts: RunOptions): AlgorithmGenerator {
  const n = grid.size;
  const h = heuristicFor(opts.diagonalMovement);
  const visited = new Uint8Array(n);
  const discovered = new Uint8Array(n);
  const parent = new Int32Array(n).fill(-1);
  const heap = new MinHeap<number>();
  let order = 0;

  discovered[startId] = 1;
  heap.push(h(grid, startId, endId), startId);
  yield { type: 'frontier', nodeId: startId, order: order++, pseudocodeLine: 1 };

  while (!heap.isEmpty()) {
    const current = heap.pop()!;
    if (visited[current]) continue;
    visited[current] = 1;
    yield { type: 'dequeue', nodeId: current, order: order++, pseudocodeLine: 3 };
    yield { type: 'visit', nodeId: current, order: order++, pseudocodeLine: 4 };
    if (current === endId) break;

    for (const { id: nb } of getNeighbors(grid, current, opts.diagonalMovement, opts.cornerCutting)) {
      if (visited[nb] || discovered[nb]) continue;
      discovered[nb] = 1;
      parent[nb] = current;
      heap.push(h(grid, nb, endId), nb);
      yield { type: 'frontier', nodeId: nb, order: order++, fromId: current, pseudocodeLine: 8 };
    }
  }

  return reconstructPath(parent, startId, endId);
}

export const greedyBestFirstAlgorithm: AlgorithmDefinition = {
  id: 'greedy-bfs',
  name: 'Greedy Best-First Search',
  shortName: 'Greedy BFS',
  run,
  meta: {
    category: 'informed',
    pronunciation: 'GREE-dee best-first search',
    spokenName: 'Greedy Best First Search',
    description:
      'Always expands the frontier node that looks closest to the goal by heuristic alone (f = h), ignoring the cost accumulated so far.',
    intuition:
      "Always walks toward whatever looks closest to the goal right now, with no memory of how far it's already traveled to get there — like following a scent instead of checking a map. It's fast when the scent trail is honest, but it will happily walk into a long dead-end cul-de-sac if that's the direction that smells strongest at each step.",
    howItWorks:
      'A priority queue orders nodes purely by their heuristic estimate to the goal. This makes the search "greedy" — it commits hard to whichever direction looks most promising right now, which is fast but easily misled by obstacles.',
    timeComplexity: 'O(E) best case, O(V log V) worst case',
    spaceComplexity: 'O(V)',
    optimal: false,
    complete: true,
    pseudocode: [
      'push(start, h(start, goal))',
      'while priority queue is not empty:',
      '  current ← pop node with smallest h',
      '  mark current as visited/expanded',
      '  if current = goal: stop',
      '  for each neighbor of current:',
      '    if not visited/queued: parent[neighbor] ← current',
      '      push(neighbor, h(neighbor, goal))',
    ],
    advantages: [
      'Typically the fastest informed search on open terrain',
      'Very low overhead — no cost bookkeeping needed',
      'Great for quick, approximate paths',
    ],
    disadvantages: [
      'Not optimal — easily produces long detours around obstacles',
      'Can get trapped chasing the heuristic into dead ends',
      'Ignores terrain weight entirely when choosing direction',
    ],
    useCases: [
      'Quick approximate paths where speed matters more than quality',
      'Open, mostly-obstacle-free terrain',
      'As a fast first pass before a more careful search',
    ],
    history:
      'Greedy best-first search is the simplest member of the general "best-first search" family formalized in Judea Pearl\'s influential 1984 book Heuristics, which organized A*, greedy search, and their relatives into a common framework. It has no single named inventor — it is best understood as "what is left of A* once you delete the cost-so-far term."',
    comparisons:
      'Greedy Best-First is A* with g(n) removed entirely — it orders the frontier purely by h(n), the estimated distance to the goal. That single change makes it fast but not optimal: unlike A*, it will happily walk into a costly detour if that detour merely looks closer to the goal on the very next step.',
    realWorldApplications: [
      'Quick approximate routing where speed matters more than a perfect path',
      'Heuristic-guided web crawling and recommendation exploration',
      "Generating an initial 'first guess' path for systems that refine the result afterward",
    ],
  },
};
