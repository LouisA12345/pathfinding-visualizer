import { Grid } from '@/lib/grid/Grid';
import { getNeighbors } from '@/lib/grid/neighbors';
import { AlgorithmDefinition, AlgorithmGenerator, RunOptions } from './types';

function* run(grid: Grid, startId: number, endId: number, opts: RunOptions): AlgorithmGenerator {
  const n = grid.size;
  const visitedStart = new Uint8Array(n);
  const visitedEnd = new Uint8Array(n);
  const parentStart = new Int32Array(n).fill(-1);
  const parentEnd = new Int32Array(n).fill(-1);
  let queueStart: number[] = [startId];
  let queueEnd: number[] = [endId];
  visitedStart[startId] = 1;
  visitedEnd[endId] = 1;
  let order = 0;
  let meetingNode = -1;

  yield { type: 'frontier', nodeId: startId, order: order++, pseudocodeLine: 1 };
  yield { type: 'frontier', nodeId: endId, order: order++, pseudocodeLine: 1 };

  if (startId === endId) return [startId];

  const expandLevel = function* (
    queue: number[],
    visited: Uint8Array,
    otherVisited: Uint8Array,
    parent: Int32Array
  ) {
    const next: number[] = [];
    for (const current of queue) {
      yield { type: 'visit' as const, nodeId: current, order: order++, pseudocodeLine: 5 };
      if (otherVisited[current]) {
        meetingNode = current;
        return next;
      }
      for (const { id: nb } of getNeighbors(grid, current, opts.diagonalMovement, opts.cornerCutting)) {
        if (visited[nb]) continue;
        visited[nb] = 1;
        parent[nb] = current;
        next.push(nb);
        yield { type: 'frontier' as const, nodeId: nb, order: order++, fromId: current, pseudocodeLine: 8 };
        if (otherVisited[nb]) {
          meetingNode = nb;
          return next;
        }
      }
    }
    return next;
  };

  while (queueStart.length > 0 && queueEnd.length > 0 && meetingNode === -1) {
    queueStart = yield* expandLevel(queueStart, visitedStart, visitedEnd, parentStart);
    if (meetingNode !== -1) break;
    queueEnd = yield* expandLevel(queueEnd, visitedEnd, visitedStart, parentEnd);
  }

  if (meetingNode === -1) return [];

  const pathFromStart: number[] = [];
  let cur = meetingNode;
  while (cur !== -1) {
    pathFromStart.push(cur);
    cur = parentStart[cur];
  }
  pathFromStart.reverse();

  const pathFromEnd: number[] = [];
  cur = parentEnd[meetingNode];
  while (cur !== -1) {
    pathFromEnd.push(cur);
    cur = parentEnd[cur];
  }

  return [...pathFromStart, ...pathFromEnd];
}

export const bidirectionalBfsAlgorithm: AlgorithmDefinition = {
  id: 'bidirectional-bfs',
  name: 'Bidirectional BFS',
  shortName: 'Bi-BFS',
  run,
  meta: {
    category: 'bidirectional',
    pronunciation: 'BY-dih-REK-shuh-nuhl B-F-S',
    spokenName: 'Bidirectional Breadth First Search',
    description:
      'Runs two simultaneous breadth-first searches — one forward from the start, one backward from the goal — and stops as soon as their frontiers meet.',
    intuition:
      "Two ripples spreading at once — one from the start, one from the goal — and the search stops the moment they touch. Since the area a ripple covers grows explosively with its radius, two ripples each only having to cross half the distance touch far less of the map combined than one ripple crossing the whole thing alone.",
    howItWorks:
      'Both searches expand one "ring" at a time, alternating turns. Because search space grows exponentially with radius, meeting in the middle after two searches of radius r/2 explores far fewer nodes than one search of radius r.',
    timeComplexity: 'O(b^(d/2)) vs O(b^d) for one-directional BFS, where b is branching factor and d is distance',
    spaceComplexity: 'O(V)',
    optimal: true,
    complete: true,
    pseudocode: [
      'queueStart ← {start}, queueEnd ← {goal}',
      'while both queues non-empty and no meeting point found:',
      '  expand one level of queueStart; check for overlap with visitedEnd',
      '  expand one level of queueEnd; check for overlap with visitedStart',
      'reconstruct path by joining start→meeting and meeting→goal chains',
    ],
    advantages: [
      'Dramatically fewer nodes explored than single-direction BFS on unweighted grids',
      'Still guarantees the shortest path (unweighted)',
      'Scales much better with large distances between start and goal',
    ],
    disadvantages: [
      'More bookkeeping — two frontiers, two visited sets, two parent maps',
      "Doesn't account for weighted terrain (needs Bidirectional A*/Dijkstra for that)",
      'Meeting-point detection adds a bit of overhead per step',
    ],
    useCases: [
      'Large unweighted grids/mazes with a distant start and goal',
      'Social network "shortest connection" style queries',
      'Any scenario where both endpoints are known in advance',
    ],
    history:
      'Searching simultaneously from both ends of a problem to cut the explored space dates back to the 1960s-70s heuristic-search literature; Ira Pohl\'s 1971 paper "Bi-directional and Heuristic Search in Path Problems" put the idea on formal footing and analyzed exactly when meeting in the middle pays off.',
    comparisons:
      'Bidirectional BFS is two ordinary BFS searches — the same FIFO-queue mechanics as single-direction BFS — run from opposite ends and stopped as soon as they touch. Bidirectional A* is its heuristic-guided sibling: the same meet-in-the-middle idea, but each side is guided by a heuristic toward the other, which usually finds the meeting point even faster.',
    realWorldApplications: [
      'Shortest-connection queries in large social graphs ("degrees of separation" at scale)',
      'Peer-to-peer network routing',
      'Any unweighted shortest-path query where both endpoints are known and the graph is large',
    ],
  },
};
