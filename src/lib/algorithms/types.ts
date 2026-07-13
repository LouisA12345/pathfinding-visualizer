import { Grid } from '@/lib/grid/Grid';

export type StepType = 'frontier' | 'dequeue' | 'visit' | 'path';

export interface AlgorithmStep {
  type: StepType;
  nodeId: number;
  order: number;
  fromId?: number;
  cost?: number;
  pseudocodeLine?: number;
}

export interface RunOptions {
  diagonalMovement: boolean;
  cornerCutting: boolean;
  /** Extra multiplier applied to the heuristic (Weighted A*). 1 = plain A*. */
  heuristicWeight?: number;
}

export interface AlgorithmStats {
  visited: number;
  expanded: number;
  pathLength: number;
  pathCost: number;
  runtimeMs: number;
  branchingFactor: number;
  success: boolean;
  /** True when the search gave up due to a resource safety cap rather than exhaustively proving no path exists (e.g. IDA* on a large open grid). */
  aborted: boolean;
}

export interface AlgorithmResult {
  steps: AlgorithmStep[];
  path: number[];
  stats: AlgorithmStats;
}

/**
 * Most algorithms just return the path (or [] if none/exhausted). An
 * algorithm that can hit a resource safety cap without exhaustively proving
 * no path exists (currently only IDA*) instead returns `{ path: [], aborted: true }`
 * so the UI can tell "no path exists" apart from "gave up".
 */
export type AlgorithmReturn = number[] | { path: number[]; aborted: true };

export type AlgorithmGenerator = Generator<AlgorithmStep, AlgorithmReturn, void>;

export interface AlgorithmMeta {
  category: 'uninformed' | 'informed' | 'bidirectional' | 'grid-specific';
  /**
   * Plain-English phonetic respelling shown as text, stressed syllable in
   * CAPS (e.g. "DIKE-struh") — purely visual, dictionary-style guidance for
   * a reader sounding it out themselves. NOT what gets spoken (see
   * `spokenName`): browser speech synthesis is far more reliable on real
   * words/names than on invented spellings, which it has never seen and
   * must guess at with generic letter-to-sound rules.
   */
  pronunciation: string;
  /**
   * Clean, real-word phrasing fed to speechSynthesis by the "hear it"
   * button — e.g. "A Star Search" for A*, "Iterative Deepening A Star" for
   * IDA*. Must be plain real English words/names only: no `*`, no
   * parentheses, no slashes, nothing invented — anything unusual here is
   * spoken verbatim and TTS engines guess badly at things they've never seen.
   */
  spokenName: string;
  description: string;
  /** A short, concrete analogy for what the algorithm is "doing" at a glance — plain language, no jargon, distinct from the more technical howItWorks. */
  intuition: string;
  howItWorks: string;
  timeComplexity: string;
  spaceComplexity: string;
  optimal: boolean;
  complete: boolean;
  pseudocode: string[];
  advantages: string[];
  disadvantages: string[];
  useCases: string[];
  /** Inventor(s), year, and the origin story — the "who/when/why" behind the algorithm. */
  history: string;
  /** How this algorithm relates to other algorithms in the registry — helps learners tell close relatives apart. */
  comparisons: string;
  /** Concrete, named real-world systems/products that use this algorithm or a direct descendant of it. */
  realWorldApplications: string[];
}

export interface AlgorithmDefinition {
  id: string;
  name: string;
  shortName: string;
  meta: AlgorithmMeta;
  run: (grid: Grid, startId: number, endId: number, opts: RunOptions) => AlgorithmGenerator;
}
