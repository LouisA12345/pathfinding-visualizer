import { Grid } from '@/lib/grid/Grid';
import { getNeighbors } from '@/lib/grid/neighbors';
import { heuristicFor } from './heuristics';
import { MinHeap } from './heap';
import { AlgorithmDefinition, AlgorithmGenerator, RunOptions } from './types';

function* run(grid: Grid, startId: number, endId: number, opts: RunOptions): AlgorithmGenerator {
  const n = grid.size;
  const h = heuristicFor(opts.diagonalMovement);

  const gF = new Float32Array(n).fill(Infinity);
  const gB = new Float32Array(n).fill(Infinity);
  const closedF = new Uint8Array(n);
  const closedB = new Uint8Array(n);
  const parentF = new Int32Array(n).fill(-1);
  const parentB = new Int32Array(n).fill(-1);
  const heapF = new MinHeap<number>();
  const heapB = new MinHeap<number>();
  let order = 0;

  gF[startId] = 0;
  heapF.push(h(grid, startId, endId), startId);
  gB[endId] = 0;
  heapB.push(h(grid, endId, startId), endId);
  yield { type: 'frontier', nodeId: startId, order: order++, pseudocodeLine: 1 };
  yield { type: 'frontier', nodeId: endId, order: order++, pseudocodeLine: 1 };

  let bestCost = Infinity;
  let meetingNode = -1;

  if (startId === endId) return [startId];

  while (!heapF.isEmpty() && !heapB.isEmpty()) {
    if (bestCost < Infinity && heapF.peekPriority() + heapB.peekPriority() >= bestCost) break;

    // Forward step.
    const current = heapF.pop();
    if (current !== undefined && !closedF[current]) {
      closedF[current] = 1;
      yield { type: 'visit', nodeId: current, order: order++, cost: gF[current], pseudocodeLine: 4 };
      if (closedB[current] && gF[current] + gB[current] < bestCost) {
        bestCost = gF[current] + gB[current];
        meetingNode = current;
      }
      for (const { id: nb, cost } of getNeighbors(grid, current, opts.diagonalMovement, opts.cornerCutting)) {
        if (closedF[nb]) continue;
        const tentative = gF[current] + cost;
        if (tentative < gF[nb]) {
          gF[nb] = tentative;
          parentF[nb] = current;
          heapF.push(tentative + h(grid, nb, endId), nb);
          yield { type: 'frontier', nodeId: nb, order: order++, fromId: current, cost: tentative, pseudocodeLine: 4 };
        }
      }
    }

    if (heapB.isEmpty()) continue;

    // Backward step.
    const currentB = heapB.pop();
    if (currentB !== undefined && !closedB[currentB]) {
      closedB[currentB] = 1;
      yield { type: 'visit', nodeId: currentB, order: order++, cost: gB[currentB], pseudocodeLine: 6 };
      if (closedF[currentB] && gF[currentB] + gB[currentB] < bestCost) {
        bestCost = gF[currentB] + gB[currentB];
        meetingNode = currentB;
      }
      for (const { id: nb, cost } of getNeighbors(grid, currentB, opts.diagonalMovement, opts.cornerCutting)) {
        if (closedB[nb]) continue;
        const tentative = gB[currentB] + cost;
        if (tentative < gB[nb]) {
          gB[nb] = tentative;
          parentB[nb] = currentB;
          heapB.push(tentative + h(grid, nb, startId), nb);
          yield { type: 'frontier', nodeId: nb, order: order++, fromId: currentB, cost: tentative, pseudocodeLine: 6 };
        }
      }
    }
  }

  if (meetingNode === -1) return [];

  const pathFromStart: number[] = [];
  let cur = meetingNode;
  while (cur !== -1) {
    pathFromStart.push(cur);
    cur = parentF[cur];
  }
  pathFromStart.reverse();

  const pathFromEnd: number[] = [];
  cur = parentB[meetingNode];
  while (cur !== -1) {
    pathFromEnd.push(cur);
    cur = parentB[cur];
  }

  return [...pathFromStart, ...pathFromEnd];
}

export const bidirectionalAstarAlgorithm: AlgorithmDefinition = {
  id: 'bidirectional-astar',
  name: 'Bidirectional A*',
  shortName: 'Bi-A*',
  run,
  meta: {
    category: 'bidirectional',
    pronunciation: 'BY-dih-REK-shuh-nuhl AY-star',
    spokenName: 'Bidirectional A Star',
    description:
      'Runs A* simultaneously from both the start and the goal, each guided by a heuristic toward the other endpoint, meeting somewhere in the middle.',
    intuition:
      "Two goal-seeking floods — A*'s directional pull toward a target — launched from both the start and the goal at once, racing to meet somewhere in the middle. Each only has to reach roughly halfway, so together they cover much less ground than a single flood crossing the entire map from one side.",
    howItWorks:
      'Two independent A* searches expand alternately — one toward the goal, one toward the start. Each maintains its own priority queue, cost table, and closed set. Once a node has been closed by both searches, their combined cost is a candidate best path; the search keeps going until the sum of both frontiers\' best remaining f-values can no longer beat that candidate, guaranteeing optimality.',
    timeComplexity: 'O((V + E) log V) worst case, typically far less — roughly half the radius of one-directional A*',
    spaceComplexity: 'O(V)',
    optimal: true,
    complete: true,
    pseudocode: [
      'gF[start] ← 0, gB[goal] ← 0',
      'push both start and goal onto their own priority queues',
      'while both queues non-empty and frontiers might still improve on the best meeting cost:',
      '  expand one node from the forward queue (toward goal)',
      '  if it is already closed by the backward search: update best meeting cost',
      '  expand one node from the backward queue (toward start)',
      '  if it is already closed by the forward search: update best meeting cost',
      'reconstruct path by joining start→meeting and meeting→goal chains',
    ],
    advantages: [
      'Explores roughly half the search radius of single-directional A*',
      'Still guarantees the optimal path',
      'Combines the speed benefits of both bidirectional search and heuristic guidance',
    ],
    disadvantages: [
      'More complex to implement correctly (the stopping condition is easy to get wrong)',
      'Twice the bookkeeping — two heaps, two cost tables, two closed sets',
      'Benefit shrinks on mazes with few viable routes between start and goal',
    ],
    useCases: [
      'Large open maps with a distant start and goal',
      'Real-time applications where halving search radius meaningfully cuts latency',
      'Road-network-style routing where both endpoints are known upfront',
    ],
    history:
      'Introduced alongside bidirectional BFS in Ira Pohl\'s 1971 paper on bidirectional and heuristic search — Pohl was among the first to formally study how to combine "search from both ends" with heuristic guidance, and to work out the surprisingly tricky stopping condition needed to keep it optimal.',
    comparisons:
      'Bidirectional A* is to Bidirectional BFS what A* is to BFS: the same two-frontiers-meeting-in-the-middle idea, but each side is now guided by a heuristic toward the opposite endpoint instead of expanding uniformly. It generally outperforms single-direction A* on large maps for the same reason bidirectional BFS beats plain BFS — the two search "balls" meeting in the middle cover much less area than one ball reaching all the way across.',
    realWorldApplications: [
      'Long-distance road-network route planning where both endpoints are fixed in advance',
      'Large open-world game maps where a single A* search would explore too wide an area',
    ],
  },
};
