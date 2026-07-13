import { AlgorithmDefinition } from './types';
import { bfsAlgorithm } from './bfs';

/**
 * Lee's Algorithm / Wavefront propagation is, mechanically, exactly BFS —
 * each expanding "ring" is a wavefront, and the ring number is the distance
 * label used in PCB/chip routing. It's kept as its own registry entry
 * (reusing bfsAlgorithm's generator directly rather than duplicating it)
 * because it's taught as a distinct named technique in circuit routing and
 * robotics, under different history and use cases than "BFS" — recognizing
 * that they're the same algorithm is itself the point.
 */
export const wavefrontAlgorithm: AlgorithmDefinition = {
  id: 'wavefront',
  name: "Lee's Algorithm / Wavefront",
  shortName: 'Wavefront',
  run: bfsAlgorithm.run,
  meta: {
    category: 'uninformed',
    pronunciation: "LEEZ algorithm",
    spokenName: "Lee's Algorithm",
    description:
      'Propagates a "wave" outward from the source one ring at a time, labeling each cell with its distance — mechanically identical to BFS, but developed independently for circuit routing and grid robotics.',
    intuition:
      "Drop a stone into a still pond and watch the ripple expand ring by ring, labeling everything it touches with how many rings out it is. That is literally the algorithm: circuit engineers just watch that same expanding ring sweep across a chip layout to route a wire, and call it a \"wavefront\" instead of a BFS frontier. Same ripple, different industry, different name.",
    howItWorks:
      'Exactly BFS: the source floods outward ring by ring, and every cell is labeled with the ring number (its distance) the moment the wave reaches it. Once the wave reaches the target, backtracking downhill through decreasing labels — from target to source — traces a shortest path.',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    optimal: true,
    complete: true,
    pseudocode: [
      'label[start] ← 0, queue ← {start}',
      'while queue is not empty:',
      '  current ← queue.dequeue()',
      '  mark current as visited/expanded',
      '  if current = goal: stop',
      '  for each neighbor of current:',
      '    if neighbor not labeled:',
      '      label[neighbor] ← label[current] + 1, parent[neighbor] ← current',
      '      queue.enqueue(neighbor)',
    ],
    advantages: [
      'Guarantees the shortest path on unweighted grids, identically to BFS',
      'Simple, predictable memory access pattern — well suited to hardware/VLSI implementation',
      'Distance labels double as a reusable "distance map" from the source to everywhere',
    ],
    disadvantages: [
      'Ignores edge weights — not shortest-path-optimal on weighted terrain, identically to BFS',
      'No sense of direction toward the goal — explores uniformly outward',
      "It's exactly BFS: understanding one is understanding both",
    ],
    useCases: [
      'PCB and chip circuit routing (its original and defining use case)',
      'Grid-based robot motion planning where a full distance map from a goal is useful',
      'Any unweighted shortest-path problem, wherever the "wavefront" framing is more natural than "BFS"',
    ],
    history:
      'Introduced by C. Y. Lee in 1961 in "An Algorithm for Path Connections and Its Applications," aimed at automatically routing wires on printed circuit boards. It was developed independently of, and around the same time as, the general graph-theoretic formalization of BFS by Edward F. Moore (1959) — two different fields arriving at the identical algorithm from different problems.',
    comparisons:
      'Lee\'s algorithm and BFS are the same algorithm — this entry exists to make that connection explicit. Where BFS is usually taught as an abstract graph traversal, Lee\'s algorithm is taught as a physical wave sweeping across a circuit board or grid, with each cell\'s "wave number" being exactly its BFS distance label.',
    realWorldApplications: [
      'Automated PCB and integrated-circuit wire routing (its original purpose)',
      'Robot motion planning via full distance-map ("wavefront") construction',
      'Any of BFS\'s applications, under the wavefront framing',
    ],
  },
};
