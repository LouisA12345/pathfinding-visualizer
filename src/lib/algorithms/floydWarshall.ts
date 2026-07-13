import { Grid } from '@/lib/grid/Grid';
import { getNeighbors } from '@/lib/grid/neighbors';
import { AlgorithmDefinition, AlgorithmGenerator, RunOptions } from './types';

/**
 * Floyd-Warshall is genuinely O(V³) — at this app's usual grid sizes (up to
 * 40,000 cells) that's quadrillions of operations, not a slow run but a
 * browser-hanging one. Capped at 400 cells (a 20x20 grid, one of the app's
 * own size presets) where V³ = 64,000,000, which is still real work but
 * finishes in well under a second. Above the cap this returns `aborted`
 * immediately rather than pretending to run — the cap itself is the
 * pedagogical point (it's exactly why nobody runs Floyd-Warshall on a road
 * network the size of a grid map).
 */
export const FLOYD_WARSHALL_MAX_CELLS = 400;
const MAX_CELLS = FLOYD_WARSHALL_MAX_CELLS;

/**
 * Floyd-Warshall computes every pair's shortest distance via dynamic
 * programming over candidate intermediate vertices k = 0..V-1 — it has no
 * "frontier expanding outward from one source" structure to animate
 * faithfully. This visualizes the *result* instead of the computation:
 * once the full V×V table is done (silently — yielding a step per (i,j,k)
 * triple would be millions of steps with no meaningful visual mapping to
 * grid cells), every reachable cell is revealed in order of increasing
 * distance from the start. That reveal order is a readable proxy for "the
 * algorithm learned about this cell," not the real k-by-k computation order.
 */
function* run(grid: Grid, startId: number, endId: number, opts: RunOptions): AlgorithmGenerator {
  const n = grid.size;
  let order = 0;

  if (n > MAX_CELLS) {
    yield { type: 'frontier', nodeId: startId, order: order++, pseudocodeLine: 1 };
    return { path: [], aborted: true };
  }

  const dist = new Float32Array(n * n).fill(Infinity);
  const nextHop = new Int32Array(n * n).fill(-1);
  for (let i = 0; i < n; i++) {
    dist[i * n + i] = 0;
    if (!grid.isWalkable(i)) continue;
    for (const { id: j, cost } of getNeighbors(grid, i, opts.diagonalMovement, opts.cornerCutting)) {
      const idx = i * n + j;
      if (cost < dist[idx]) {
        dist[idx] = cost;
        nextHop[idx] = j;
      }
    }
  }
  yield { type: 'frontier', nodeId: startId, order: order++, cost: 0, pseudocodeLine: 1 };

  for (let k = 0; k < n; k++) {
    if (!grid.isWalkable(k)) continue;
    const rowK = k * n;
    for (let i = 0; i < n; i++) {
      const dik = dist[i * n + k];
      if (dik === Infinity) continue;
      const rowI = i * n;
      for (let j = 0; j < n; j++) {
        const throughK = dik + dist[rowK + j];
        if (throughK < dist[rowI + j]) {
          dist[rowI + j] = throughK;
          nextHop[rowI + j] = nextHop[rowI + k];
        }
      }
    }
  }

  const reachable: number[] = [];
  for (let id = 0; id < n; id++) {
    if (id !== startId && dist[startId * n + id] < Infinity) reachable.push(id);
  }
  reachable.sort((a, b) => dist[startId * n + a] - dist[startId * n + b]);
  for (const id of reachable) {
    yield { type: 'visit', nodeId: id, order: order++, cost: dist[startId * n + id], pseudocodeLine: 8 };
  }

  if (dist[startId * n + endId] === Infinity) return [];

  const path: number[] = [startId];
  let cur = startId;
  while (cur !== endId) {
    cur = nextHop[cur * n + endId];
    if (cur === -1) return [];
    path.push(cur);
  }
  return path;
}

export const floydWarshallAlgorithm: AlgorithmDefinition = {
  id: 'floyd-warshall',
  name: 'Floyd-Warshall',
  shortName: 'Floyd-Warshall',
  run,
  meta: {
    category: 'uninformed',
    pronunciation: 'floyd WOR-shul',
    spokenName: 'Floyd Warshall Algorithm',
    description:
      'Computes shortest distances between every pair of nodes at once via dynamic programming over candidate intermediate vertices — capped to grids of 400 cells or fewer here, since its O(V³) cost is only practical on small graphs.',
    intuition:
      "Asks the same question for every possible pair of cells at the same time: \"is it shorter to go through some particular waypoint?\" — trying every single cell in turn as a possible waypoint for every pair, and keeping whichever route turns out shortest. It answers 'what's the distance between any two points' for the whole grid in one pass, instead of answering just 'from here to there' the way every other algorithm in this app does.",
    howItWorks:
      'Builds a full V×V distance table, initialized from direct grid adjacency. Then, for each candidate intermediate vertex k in turn, it checks every pair (i, j): if routing i→k→j is cheaper than the best i→j found so far, it updates the table. After considering all V vertices as possible waypoints, the table holds the true shortest distance between every pair. This implementation runs that full computation silently (yielding a step per (i, j, k) triple would be millions of steps with no meaningful grid-cell mapping), then reveals reachable cells in order of increasing distance from the start as a readable stand-in for the real computation.',
    timeComplexity: 'O(V³) — always, regardless of how sparse the grid is',
    spaceComplexity: 'O(V²) for the full distance table',
    optimal: true,
    complete: true,
    pseudocode: [
      'dist[i][j] ← direct edge cost (or 0 if i = j, ∞ otherwise), for all i, j',
      'for k ← 0 to V-1:',
      '  for i ← 0 to V-1:',
      '    for j ← 0 to V-1:',
      '      if dist[i][k] + dist[k][j] < dist[i][j]:',
      '        dist[i][j] ← dist[i][k] + dist[k][j]',
      '        next[i][j] ← next[i][k]',
      '(after all k considered, dist[i][j] is the true shortest distance for every pair)',
      'reveal reachable cells from start, and reconstruct start→end via next[][]',
    ],
    advantages: [
      'Computes shortest paths between every pair of nodes in a single pass — genuinely useful when many pairs will be queried afterward',
      'Handles negative edge weights, and can detect negative cycles (a negative value ever appearing on the diagonal)',
      'No heap, no queue, no recursion — just three nested loops over a table',
    ],
    disadvantages: [
      'O(V³) time regardless of how few walls or how sparse the grid is — catastrophically wasteful for a single start→end query',
      'O(V²) memory for the distance table makes it impractical on this app\'s larger grids even before the time cost is considered',
      "Capped to 400 cells (20×20) in this app — above that it reports \"exceeded its step budget\" immediately rather than hanging the browser",
    ],
    useCases: [
      'Small, dense graphs where distances between many or all pairs will be queried repeatedly afterward',
      'Precomputing a routing table once for a small, fixed network',
      'Detecting negative-weight cycles in a small graph',
    ],
    history:
      'Published independently in 1962: Robert Floyd\'s "Algorithm 97: Shortest Path" gave the shortest-path version, building on the same dynamic-programming-over-intermediate-vertices structure Stephen Warshall had published that same year for computing the transitive closure (reachability) of a boolean matrix — which is why the combined algorithm carries both names.',
    comparisons:
      "Every other algorithm in this app answers one question — shortest path from this start to this end — by exploring outward from a source. Floyd-Warshall instead answers all such questions simultaneously via dynamic programming over which vertices are allowed as waypoints, at the cost of O(V³) time no matter how small the actual answer set needed is. On this grid's non-negative weights it always agrees with Dijkstra/A*'s path cost when both can run; it is dramatically slower for a single query and dramatically more useful when many queries are coming.",
    realWorldApplications: [
      'Precomputed all-pairs routing tables in small, static networks',
      'Network analysis metrics (e.g. graph centrality measures) that inherently need all-pairs distances',
      'Precomputed distance tables between fixed points of interest on a small game level or building floor plan',
    ],
  },
};
