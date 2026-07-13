import { Grid } from '@/lib/grid/Grid';
import { getNeighbors } from '@/lib/grid/neighbors';
import { heuristicFor } from './heuristics';
import { AlgorithmDefinition, AlgorithmGenerator, RunOptions } from './types';
import { reconstructPath } from './path';

const MAX_STEPS = 500_000;

/**
 * Fringe Search. Like IDA*, it repeatedly raises an f-cost threshold instead
 * of using a priority queue — but instead of re-deriving the search from
 * scratch each pass (IDA*'s big weakness on grids), nodes that exceed the
 * current threshold are simply deferred to a "later" list that becomes next
 * pass's fringe, carrying their g-values forward. A newly-improved neighbor
 * is spliced into the fringe immediately after the node that discovered it
 * (an O(1) linked-list insert via typed arrays, not an array splice), which
 * approximates depth-first behavior within a pass without recursion.
 */
function* run(grid: Grid, startId: number, endId: number, opts: RunOptions): AlgorithmGenerator {
  const n = grid.size;
  const h = heuristicFor(opts.diagonalMovement);
  const g = new Float32Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);
  const inFringe = new Uint8Array(n);
  const next = new Int32Array(n).fill(-1);
  let order = 0;

  g[startId] = 0;
  inFringe[startId] = 1;
  let nowHead = startId;
  let laterHead = -1;
  let laterTail = -1;
  let flimit = h(grid, startId, endId);
  let nextFlimit = Infinity;
  yield { type: 'frontier', nodeId: startId, order: order++, cost: 0, pseudocodeLine: 1 };

  let prev = -1;
  let cur = nowHead;

  while (true) {
    if (order > MAX_STEPS) return { path: [], aborted: true };

    if (cur === -1) {
      if (laterHead === -1) return [];
      nowHead = laterHead;
      laterHead = -1;
      laterTail = -1;
      flimit = nextFlimit;
      nextFlimit = Infinity;
      prev = -1;
      cur = nowHead;
      continue;
    }

    const f = g[cur] + h(grid, cur, endId);
    if (f > flimit) {
      const after = next[cur];
      if (prev === -1) nowHead = after;
      else next[prev] = after;
      if (laterTail === -1) {
        laterHead = cur;
        laterTail = cur;
      } else {
        next[laterTail] = cur;
        laterTail = cur;
      }
      next[cur] = -1;
      nextFlimit = Math.min(nextFlimit, f);
      cur = after;
      continue;
    }

    yield { type: 'dequeue', nodeId: cur, order: order++, cost: g[cur], pseudocodeLine: 5 };
    yield { type: 'visit', nodeId: cur, order: order++, cost: g[cur], pseudocodeLine: 5 };
    if (cur === endId) return reconstructPath(parent, startId, endId);
    inFringe[cur] = 0;

    let insertAfter = cur;
    for (const { id: nb, cost } of getNeighbors(grid, cur, opts.diagonalMovement, opts.cornerCutting)) {
      const tentativeG = g[cur] + cost;
      if (tentativeG < g[nb]) {
        g[nb] = tentativeG;
        parent[nb] = cur;
        yield { type: 'frontier', nodeId: nb, order: order++, fromId: cur, cost: tentativeG, pseudocodeLine: 8 };
        if (!inFringe[nb]) {
          inFringe[nb] = 1;
          next[nb] = next[insertAfter];
          next[insertAfter] = nb;
          insertAfter = nb;
        }
      }
    }

    const after = next[cur];
    if (prev === -1) nowHead = after;
    else next[prev] = after;
    cur = after;
  }
}

export const fringeSearchAlgorithm: AlgorithmDefinition = {
  id: 'fringe-search',
  name: 'Fringe Search',
  shortName: 'Fringe',
  run,
  meta: {
    category: 'informed',
    pronunciation: 'frinj search',
    spokenName: 'Fringe Search',
    description:
      'An A* alternative that avoids a sorted priority queue entirely, using a threshold that rises each pass (like IDA*) but carrying discovered nodes forward between passes instead of restarting from scratch.',
    intuition:
      "Like IDA*'s rising-threshold approach, but instead of forgetting everything and re-walking from the start each time the threshold rises, it keeps a 'not yet, maybe next time' pile of the nodes that got turned away — and starts straight from that pile once the threshold goes up, rather than re-discovering them from the beginning.",
    howItWorks:
      'Nodes live on a "now" list (this pass) or a "later" list (next pass). Each node on "now" is checked against a threshold (f = g + h): if within budget, it is expanded and any improved neighbor is spliced into "now" immediately after it, so the walk continues depth-first-like without recursion; if over budget, it moves to "later" and the smallest over-budget f seen becomes next pass\'s threshold. When "now" empties, "later" becomes the new "now" and the threshold rises — carrying every previously-discovered g-value forward, unlike IDA* which restarts from nothing each iteration.',
    timeComplexity: 'Comparable to A* in nodes expanded with a good heuristic; no O(log V) heap overhead per operation',
    spaceComplexity: 'O(V) — every discovered node is kept (on "now" or "later"), unlike IDA*\'s O(depth)',
    optimal: true,
    complete: true,
    pseudocode: [
      'g[start] ← 0, now ← {start}, later ← {}, flimit ← h(start, goal)',
      'loop:',
      '  if now is empty:',
      '    if later is empty: no path exists',
      '    now ← later, later ← {}, flimit ← smallest f that exceeded the old flimit',
      '  current ← next node in now',
      '  if g[current] + h(current, goal) > flimit: move current to later; continue',
      '  mark current as visited/expanded; if current = goal: stop',
      '  for each neighbor of current:',
      '    tentativeG ← g[current] + weight(current, neighbor)',
      '    if tentativeG < g[neighbor]: update g, parent; splice neighbor into now right after current',
    ],
    advantages: [
      'No priority queue — no O(log V) push/pop, unlike A*/Dijkstra',
      "Reuses g-values across passes, avoiding IDA*'s from-scratch restarts",
      'Cache-friendlier memory access pattern than a heap, which mattered a lot on 2005-era game console hardware',
    ],
    disadvantages: [
      'Keeps every discovered node in memory (like A*), so it does not share IDA*\'s low memory footprint',
      'More intricate to implement correctly than A* — the now/later/flimit bookkeeping is easy to get subtly wrong',
      "This implementation uses simple linked-list splicing rather than the original paper's more heavily hand-tuned cache layout, so its real-world speed edge over A* is smaller here than in the original benchmarks",
    ],
    useCases: [
      'Game pathfinding on hardware where heap operations are disproportionately expensive relative to raw array access',
      'Any A*-shaped problem where an admissible heuristic is available and priority-queue overhead is the bottleneck',
    ],
    history:
      'Introduced in 2005 by Yngvi Björnsson, Markus Enzenberger, Robert Holte, and Jonathan Schaeffer in "Fringe Search: Beating A* at Pathfinding on Game Maps" (IEEE CIG 2005). It was explicitly motivated by real game-industry profiling showing that A*\'s priority queue, not the search itself, was often the actual bottleneck on the hardware of the time.',
    comparisons:
      "Fringe Search sits between A* and IDA*: it uses IDA*'s rising-threshold trick instead of A*'s priority queue, but — unlike IDA* — it never throws away what it already discovered, so it doesn't pay IDA*'s repeated-restart cost on grids. Given the same admissible heuristic, it expands a similar set of nodes to A*, just without ever sorting them.",
    realWorldApplications: [
      'Console and PC game pathfinding, its original motivating use case',
      'Any embedded or performance-sensitive pathfinding system where avoiding heap allocation/maintenance overhead matters more than asymptotic complexity',
    ],
  },
};
