import { Grid } from '@/lib/grid/Grid';
import { getNeighbors } from '@/lib/grid/neighbors';
import { AlgorithmDefinition, AlgorithmGenerator, RunOptions } from './types';
import { reconstructPath } from './path';

function* run(grid: Grid, startId: number, endId: number, opts: RunOptions): AlgorithmGenerator {
  const n = grid.size;
  const visited = new Uint8Array(n);
  const parent = new Int32Array(n).fill(-1);
  const stack: number[] = [startId];
  let order = 0;

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited[current]) continue;
    visited[current] = 1;
    yield { type: 'visit', nodeId: current, order: order++, pseudocodeLine: 3 };
    if (current === endId) break;

    for (const { id: nb } of getNeighbors(grid, current, opts.diagonalMovement, opts.cornerCutting)) {
      if (visited[nb]) continue;
      if (parent[nb] === -1) parent[nb] = current;
      stack.push(nb);
      yield { type: 'frontier', nodeId: nb, order: order++, fromId: current, pseudocodeLine: 6 };
    }
  }

  return reconstructPath(parent, startId, endId);
}

export const dfsAlgorithm: AlgorithmDefinition = {
  id: 'dfs',
  name: 'Depth-First Search',
  shortName: 'DFS',
  run,
  meta: {
    category: 'uninformed',
    pronunciation: 'DEPTH-first search',
    spokenName: 'Depth First Search',
    description:
      'Dives as deep as possible down one path before backtracking, using a LIFO stack. Does not guarantee the shortest path.',
    intuition:
      "Like exploring a hedge maze by always charging down the next unexplored corridor and never looking back until you hit a dead end — DFS commits fully to one path before ever considering an alternative, which is why it can wander far out of its way even when a short path exists just around the corner.",
    howItWorks:
      'DFS pushes the start node onto a stack. It repeatedly pops a node, marks it visited, and pushes all of its unvisited neighbors. Because the most recently pushed node is explored next, the search commits to a single path for as long as possible before backtracking.',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    optimal: false,
    complete: true,
    pseudocode: [
      'stack ← {start}',
      'while stack is not empty:',
      '  current ← stack.pop()',
      '  if current visited: continue',
      '  mark current as visited/expanded',
      '  if current = goal: stop',
      '  for each neighbor of current:',
      '    if neighbor not visited: stack.push(neighbor)',
    ],
    advantages: [
      'Very low memory footprint relative to breadth-first exploration',
      'Simple to implement iteratively or recursively',
      'Good for exhaustive search / maze generation-style traversal',
    ],
    disadvantages: [
      'Does not guarantee the shortest path',
      'Can produce long, winding paths even when a short one exists',
      'Ignores edge weights entirely',
    ],
    useCases: [
      'Maze generation and connectivity checks',
      'Topological sorting and cycle detection (on general graphs)',
      'Situations where any valid path is acceptable, not necessarily the shortest',
    ],
    history:
      'Systematic depth-first traversal was described as a maze-solving strategy by Charles Pierre Trémaux in the 19th century, long before computers existed. It was formalized as a graph algorithm and analyzed for efficiency by John Hopcroft and Robert Tarjan in the early 1970s — work that helped earn Tarjan a Turing Award.',
    comparisons:
      "DFS and BFS explore the same graph with almost the same code — the only difference is a stack versus a queue — yet that single change is the difference between \"some path\" and \"shortest path.\" DFS is also the traversal strategy underlying several of this app's maze generators (Recursive Backtracking is literally DFS carving a maze instead of solving one).",
    realWorldApplications: [
      "Maze and dungeon generation (this app's Recursive Backtracking template)",
      'Cycle detection and topological sorting in build systems and dependency graphs',
      'Solving puzzles with backtracking (Sudoku, N-Queens)',
      'Finding connected components and articulation points in networks',
    ],
  },
};
