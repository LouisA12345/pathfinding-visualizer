import { Grid } from '@/lib/grid/Grid';
import { getNeighbors } from '@/lib/grid/neighbors';
import { AlgorithmDefinition, AlgorithmGenerator, RunOptions } from './types';
import { reconstructPath } from './path';

const MAX_STEPS = 500_000;

/**
 * Bellman-Ford via the standard SPFA (queue-based) optimization: instead of
 * blindly relaxing every edge V-1 times (which is what makes textbook
 * Bellman-Ford O(V·E) — utterly impractical on a 40,000-node grid), only
 * nodes whose distance actually improved get re-queued for further
 * relaxation. This is still genuinely Bellman-Ford's core idea — repeated
 * relaxation with no priority queue, which is what lets it handle negative
 * edge weights that would break Dijkstra — just implemented the way it's
 * actually used in practice rather than the textbook worst case.
 */
function* run(grid: Grid, startId: number, endId: number, opts: RunOptions): AlgorithmGenerator {
  const n = grid.size;
  const dist = new Float32Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);
  const inQueue = new Uint8Array(n);
  const queue: number[] = [startId];
  let order = 0;

  dist[startId] = 0;
  inQueue[startId] = 1;
  yield { type: 'frontier', nodeId: startId, order: order++, cost: 0, pseudocodeLine: 1 };

  let head = 0;
  while (head < queue.length) {
    if (order > MAX_STEPS) return { path: [], aborted: true };

    const current = queue[head++];
    inQueue[current] = 0;
    yield { type: 'dequeue', nodeId: current, order: order++, cost: dist[current], pseudocodeLine: 3 };
    yield { type: 'visit', nodeId: current, order: order++, cost: dist[current], pseudocodeLine: 4 };

    for (const { id: nb, cost } of getNeighbors(grid, current, opts.diagonalMovement, opts.cornerCutting)) {
      const newDist = dist[current] + cost;
      if (newDist < dist[nb]) {
        dist[nb] = newDist;
        parent[nb] = current;
        yield { type: 'frontier', nodeId: nb, order: order++, fromId: current, cost: newDist, pseudocodeLine: 8 };
        if (!inQueue[nb]) {
          inQueue[nb] = 1;
          queue.push(nb);
        }
      }
    }
  }

  return reconstructPath(parent, startId, endId);
}

export const bellmanFordAlgorithm: AlgorithmDefinition = {
  id: 'bellman-ford',
  name: 'Bellman-Ford',
  shortName: 'Bellman-Ford',
  run,
  meta: {
    category: 'uninformed',
    pronunciation: 'BEL-mun ford',
    spokenName: 'Bellman Ford Algorithm',
    description:
      "Finds shortest paths by repeatedly relaxing edges until nothing improves, using a plain queue instead of Dijkstra's priority queue — slower in practice, but works correctly even with negative edge weights.",
    intuition:
      "The same flooding idea as Dijkstra, but nobody is ever declared 'permanently done.' If a cheaper route to some point is discovered later — even to a point that seemed finished — it gets revised and the flood spreads onward from it again. That extra caution is exactly what lets it survive roads with a negative cost, which would trick Dijkstra's 'never revisit a settled node' shortcut into giving a wrong answer.",
    howItWorks:
      'Every node starts at distance infinity except the source (0). Whenever relaxing an edge would shorten a neighbor\'s known distance, that neighbor is updated and queued for further relaxation. Unlike Dijkstra, a node can be re-queued and re-relaxed multiple times as better paths to it are discovered — there\'s no "this node is finalized" guarantee until the queue empties.',
    timeComplexity: 'O(V·E) worst case (textbook form); typically close to O(V + E) in practice on well-behaved graphs like grids with non-negative weights (the queue-based form used here)',
    spaceComplexity: 'O(V)',
    optimal: true,
    complete: true,
    pseudocode: [
      'dist[start] ← 0, queue ← {start}',
      'while queue is not empty:',
      '  current ← queue.dequeue()',
      '  mark current as visited/expanded',
      '  for each neighbor of current:',
      '    newDist ← dist[current] + weight(current, neighbor)',
      '    if newDist < dist[neighbor]:',
      '      update dist, parent',
      '      if neighbor not already queued: queue.enqueue(neighbor)',
    ],
    advantages: [
      'Handles negative edge weights correctly, unlike Dijkstra',
      'Can detect negative-weight cycles (not applicable on this grid, which never has negative weights)',
      'No priority queue needed — simpler underlying data structure',
    ],
    disadvantages: [
      'Slower than Dijkstra in practice on graphs with only non-negative weights (which is all this grid ever has)',
      'A node can be re-relaxed many times, unlike Dijkstra\'s single settle-and-done per node',
      "Textbook full-edge-relaxation form is O(V·E) — impractically slow on large grids without the queue-based optimization used here",
    ],
    useCases: [
      'Graphs with negative edge weights (currency arbitrage, some network cost models)',
      'Detecting negative cycles',
      'Distributed routing protocols (a queue-based relaxation like this is the basis of distance-vector routing, e.g. early RIP)',
    ],
    history:
      'Developed independently by Alfonso Shimbel (1955), Richard Bellman (1958), and Lester Ford Jr. (1956). Edward F. Moore published an equivalent queue-based version in 1959 — close enough in spirit to today\'s algorithm that it is sometimes called "Bellman–Ford–Moore" — and the specific "only re-queue a node if it isn\'t already waiting" optimization used in this implementation was popularized much later, in 1994, as the "Shortest Path Faster Algorithm" (SPFA) by Fanding Duan. It predates Dijkstra\'s algorithm and was the first widely known shortest-path method to correctly handle negative weights.',
    comparisons:
      "Bellman-Ford is Dijkstra's algorithm without the assumption that once a node is popped, its distance is final — that assumption is exactly what breaks in the presence of negative weights, and exactly what Bellman-Ford avoids relying on. On this grid's non-negative weights, it computes the identical shortest paths as Dijkstra, just by doing more redundant relaxation work to get there.",
    realWorldApplications: [
      'Distance-vector routing protocols like early RIP, which are essentially distributed Bellman-Ford',
      'Currency arbitrage detection (negative cycles correspond to profitable arbitrage loops)',
      'Any shortest-path problem where edge weights can be negative',
    ],
  },
};
