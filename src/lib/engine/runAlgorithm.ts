import { CellType, Grid } from '@/lib/grid/Grid';
import { AlgorithmDefinition, AlgorithmReturn, AlgorithmResult, AlgorithmStep, RunOptions } from '@/lib/algorithms/types';
import { densifyPath } from '@/lib/algorithms/path';

function pathCostOf(grid: Grid, path: number[]): number {
  if (path.length < 2) return 0;
  let cost = 0;
  for (let i = 1; i < path.length; i++) {
    const [ar, ac] = grid.toRC(path[i - 1]);
    const [br, bc] = grid.toRC(path[i]);
    const diagonal = ar !== br && ac !== bc;
    const steps = Math.max(Math.abs(ar - br), Math.abs(ac - bc));
    cost += grid.weight[path[i]] * steps * (diagonal ? Math.SQRT2 : 1);
  }
  return cost;
}

function drainOnce(def: AlgorithmDefinition, grid: Grid, startId: number, endId: number, opts: RunOptions) {
  const gen = def.run(grid, startId, endId, opts);
  const steps: AlgorithmStep[] = [];
  const t0 = performance.now();
  let result = gen.next();
  while (!result.done) {
    steps.push(result.value);
    result = gen.next();
  }
  const runtimeMs = performance.now() - t0;
  return { steps, rawReturn: (result.value ?? []) as AlgorithmReturn, runtimeMs };
}

const MAX_TIMING_TRIALS = 7;
const TIMING_BUDGET_MS = 60;

/**
 * Times and densifies one leg of the run (between two consecutive waypoints).
 * See `runAlgorithm` for why timing takes the minimum of several trials.
 */
function runLeg(def: AlgorithmDefinition, grid: Grid, startId: number, endId: number, opts: RunOptions) {
  let best = drainOnce(def, grid, startId, endId, opts);
  let totalElapsed = best.runtimeMs;

  for (let trial = 1; trial < MAX_TIMING_TRIALS && totalElapsed < TIMING_BUDGET_MS; trial++) {
    const attempt = drainOnce(def, grid, startId, endId, opts);
    totalElapsed += attempt.runtimeMs;
    if (attempt.runtimeMs < best.runtimeMs) best = attempt;
  }

  const { steps, rawReturn, runtimeMs } = best;
  const aborted = !Array.isArray(rawReturn) && rawReturn.aborted === true;
  const rawPath = Array.isArray(rawReturn) ? rawReturn : rawReturn.path;
  return { steps, path: densifyPath(grid, rawPath), runtimeMs, aborted };
}

interface WaypointRunResult {
  steps: AlgorithmStep[];
  path: number[];
  runtimeMs: number;
  aborted: boolean;
  success: boolean;
}

/**
 * Runs through a fixed sequence of waypoints — start → checkpoint(s) → goal —
 * concatenating each leg's steps/path/timing. Checkpoints are shared by every
 * start×goal combination `runAlgorithm` tries (see below); this is the part
 * that actually drains the algorithm's generator.
 */
function runThroughWaypoints(def: AlgorithmDefinition, grid: Grid, waypoints: number[], opts: RunOptions): WaypointRunResult {
  const steps: AlgorithmStep[] = [];
  let path: number[] = [];
  let runtimeMs = 0;
  let aborted = false;
  let success = true;

  for (let leg = 0; leg < waypoints.length - 1 && success; leg++) {
    const legResult = runLeg(def, grid, waypoints[leg], waypoints[leg + 1], opts);
    runtimeMs += legResult.runtimeMs;

    const orderOffset = steps.length > 0 ? steps[steps.length - 1].order + 1 : 0;
    for (const step of legResult.steps) {
      steps.push({ ...step, order: step.order + orderOffset });
    }

    if (legResult.aborted || legResult.path.length === 0) {
      aborted = legResult.aborted;
      success = false;
      break;
    }
    // Consecutive legs share a waypoint node — keep it only once.
    path = path.length > 0 ? [...path, ...legResult.path.slice(1)] : legResult.path;
  }

  if (!success) path = [];
  return { steps, path, runtimeMs, aborted, success };
}

/**
 * Drains an algorithm's generator synchronously into a flat Step[] array and
 * appends synthetic 'path' steps for the reconstructed path. This decouples
 * algorithm execution speed from animation playback speed entirely — the
 * playback controller just walks an index through this array, which makes
 * step-forward/back, scrubbing, and replay trivial and fast even on large
 * grids.
 *
 * A single `performance.now()` sample around a sub-10ms computation is
 * dominated by measurement noise (GC pauses, JIT warm-up, OS scheduling) —
 * a faster algorithm can easily report a *larger* number than a slower one
 * purely by chance. All our pathfinding algorithms are deterministic given
 * the same grid/start/end/opts, so re-running the search a few times and
 * keeping the minimum timing (discarding the redundant step arrays) gives a
 * far more stable "runtime" figure, which matters most exactly where a
 * single sample is least reliable: fast runs, and side-by-side comparisons
 * in Compare Mode. Trials stop early once they've already spent
 * `TIMING_BUDGET_MS`, so a slow algorithm (e.g. IDA* giving up on a large
 * maze) doesn't get re-run needlessly.
 *
 * If the grid has Checkpoint cells, each run is split into legs — start →
 * checkpoint 1 → checkpoint 2 → ... → goal. If the grid has *multiple*
 * Start and/or End cells (multi-start/multi-goal, placed via the "extra
 * start"/"extra goal" tools), every start×goal combination is tried this
 * way and the cheapest successful one wins — this reuses every algorithm
 * completely unmodified (each combination is just an ordinary single-start/
 * single-goal run) rather than needing genuine multi-source search logic in
 * each of the 15 algorithm files, at the cost of some redundant computation
 * when there are several extra starts/goals. `cellsOfType`/`checkpointOrder`
 * are filtered defensively against the live `cellType` array because a few
 * maze generators bulk-overwrite `cellType` directly
 * (`grid.cellType.fill(...)`) rather than going through `Grid`'s setters,
 * which could otherwise leave stale ids behind.
 */
export function runAlgorithm(
  def: AlgorithmDefinition,
  grid: Grid,
  startId: number,
  endId: number,
  opts: RunOptions
): AlgorithmResult {
  const checkpoints = grid.checkpointOrder.filter((id) => grid.cellType[id] === CellType.Checkpoint);
  const starts = grid.cellsOfType(CellType.Start);
  const goals = grid.cellsOfType(CellType.End);
  const startCandidates = starts.length > 0 ? starts : [startId];
  const goalCandidates = goals.length > 0 ? goals : [endId];

  let best: WaypointRunResult | null = null;
  for (const s of startCandidates) {
    for (const g of goalCandidates) {
      const attempt = runThroughWaypoints(def, grid, [s, ...checkpoints, g], opts);
      if (!best) {
        best = attempt;
        continue;
      }
      const attemptBetter =
        (attempt.success && !best.success) ||
        (attempt.success && best.success && pathCostOf(grid, attempt.path) < pathCostOf(grid, best.path));
      if (attemptBetter) best = attempt;
    }
  }

  const { steps, path, runtimeMs, aborted, success } = best ?? {
    steps: [],
    path: [],
    runtimeMs: 0,
    aborted: false,
    success: false,
  };

  if (success) {
    let order = steps.length > 0 ? steps[steps.length - 1].order + 1 : 0;
    for (const nodeId of path) {
      steps.push({ type: 'path', nodeId, order: order++ });
    }
  }

  const visited = steps.filter((s) => s.type === 'visit').length;
  const frontier = steps.filter((s) => s.type === 'frontier').length;

  return {
    steps,
    path,
    stats: {
      visited,
      expanded: visited,
      pathLength: path.length,
      pathCost: pathCostOf(grid, path),
      runtimeMs,
      branchingFactor: visited > 0 ? frontier / visited : 0,
      success,
      aborted,
    },
  };
}
