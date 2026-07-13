export const CellType = {
  Empty: 0,
  Wall: 1,
  Start: 2,
  End: 3,
  Checkpoint: 4,
} as const;
export type CellTypeValue = (typeof CellType)[keyof typeof CellType];

export interface SerializedGrid {
  width: number;
  height: number;
  cellType: number[];
  weight: number[];
  terrainId: number[];
  startId: number;
  endId: number;
  /** Optional for backward compatibility with mazes saved before checkpoint ordering was tracked. */
  checkpointOrder?: number[];
}

/**
 * Flat typed-array backed grid model. Avoids array-of-objects so cloning and
 * resetting large grids (up to 200x200 = 40,000 cells) stays cheap and keeps
 * GC pressure low during interactive drawing and algorithm playback.
 */
export class Grid {
  readonly width: number;
  readonly height: number;
  cellType: Uint8Array;
  weight: Float32Array;
  terrainId: Uint8Array;
  startId: number;
  endId: number;
  /** Ids of Checkpoint cells in the order the user placed them — the order a run must visit them in, start → checkpoints → end. */
  checkpointOrder: number[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    const size = width * height;
    this.cellType = new Uint8Array(size);
    this.weight = new Float32Array(size).fill(1);
    this.terrainId = new Uint8Array(size);
    this.startId = -1;
    this.endId = -1;
    this.checkpointOrder = [];
  }

  get size(): number {
    return this.width * this.height;
  }

  toId(row: number, col: number): number {
    return row * this.width + col;
  }

  toRC(id: number): [row: number, col: number] {
    return [Math.floor(id / this.width), id % this.width];
  }

  inBounds(row: number, col: number): boolean {
    return row >= 0 && row < this.height && col >= 0 && col < this.width;
  }

  isWalkable(id: number): boolean {
    return this.cellType[id] !== CellType.Wall;
  }

  /** All cell ids currently of the given type, in id (row-major scan) order. */
  cellsOfType(type: CellTypeValue): number[] {
    const ids: number[] = [];
    for (let id = 0; id < this.cellType.length; id++) {
      if (this.cellType[id] === type) ids.push(id);
    }
    return ids;
  }

  /** Drops an id from checkpointOrder — call before any setter overwrites a cell away from Checkpoint. */
  private unmarkCheckpoint(id: number): void {
    if (this.cellType[id] !== CellType.Checkpoint) return;
    const idx = this.checkpointOrder.indexOf(id);
    if (idx !== -1) this.checkpointOrder.splice(idx, 1);
  }

  setStart(id: number): void {
    if (this.startId >= 0 && this.cellType[this.startId] === CellType.Start) {
      this.cellType[this.startId] = CellType.Empty;
    }
    this.unmarkCheckpoint(id);
    this.startId = id;
    this.cellType[id] = CellType.Start;
    this.weight[id] = 1;
    this.terrainId[id] = 0;
  }

  setEnd(id: number): void {
    if (this.endId >= 0 && this.cellType[this.endId] === CellType.End) {
      this.cellType[this.endId] = CellType.Empty;
    }
    this.unmarkCheckpoint(id);
    this.endId = id;
    this.cellType[id] = CellType.End;
    this.weight[id] = 1;
    this.terrainId[id] = 0;
  }

  /**
   * Adds an *additional* start/goal without clearing existing ones — the
   * basis for multi-start/multi-goal runs (`runAlgorithm` tries every
   * start×goal combination and keeps the cheapest). `setStart`/`setEnd`
   * remain single-replace, unchanged, so every existing call site (maze
   * generators, "place default start/end", etc.) keeps working exactly as
   * before; this is purely additive.
   */
  addStart(id: number): void {
    if (id === this.endId || this.cellType[id] === CellType.Start) return;
    this.unmarkCheckpoint(id);
    this.cellType[id] = CellType.Start;
    this.weight[id] = 1;
    this.terrainId[id] = 0;
    if (this.startId < 0) this.startId = id;
  }

  addEnd(id: number): void {
    if (id === this.startId || this.cellType[id] === CellType.End) return;
    this.unmarkCheckpoint(id);
    this.cellType[id] = CellType.End;
    this.weight[id] = 1;
    this.terrainId[id] = 0;
    if (this.endId < 0) this.endId = id;
  }

  setWall(id: number): void {
    if (id === this.startId || id === this.endId) return;
    this.unmarkCheckpoint(id);
    this.cellType[id] = CellType.Wall;
    this.weight[id] = 1;
    this.terrainId[id] = 0;
  }

  /** Checkpoints are visited in the order they were placed — start → checkpoints (this order) → end. */
  setCheckpoint(id: number): void {
    if (id === this.startId || id === this.endId) return;
    if (this.cellType[id] !== CellType.Checkpoint) this.checkpointOrder.push(id);
    this.cellType[id] = CellType.Checkpoint;
  }

  setTerrain(id: number, terrainId: number, weight: number): void {
    if (id === this.startId || id === this.endId) return;
    this.unmarkCheckpoint(id);
    this.cellType[id] = CellType.Empty;
    this.terrainId[id] = terrainId;
    this.weight[id] = weight;
  }

  erase(id: number): void {
    this.unmarkCheckpoint(id);
    this.cellType[id] = CellType.Empty;
    this.weight[id] = 1;
    this.terrainId[id] = 0;
    // If the *primary* start/end was erased, promote another remaining
    // Start/End cell (if any — multi-start/multi-goal mode) so `startId`/
    // `endId` keep pointing at a real cell instead of going stale at -1
    // while other start/goal markers are still on the grid.
    if (id === this.startId) this.startId = this.cellsOfType(CellType.Start)[0] ?? -1;
    if (id === this.endId) this.endId = this.cellsOfType(CellType.End)[0] ?? -1;
  }

  clearAll(): void {
    this.cellType.fill(CellType.Empty);
    this.weight.fill(1);
    this.terrainId.fill(0);
    this.startId = -1;
    this.endId = -1;
    this.checkpointOrder = [];
  }

  /** Clears walls/weights/checkpoints but keeps start & end in place. */
  clearObstacles(): void {
    const { startId, endId } = this;
    this.cellType.fill(CellType.Empty);
    this.weight.fill(1);
    this.terrainId.fill(0);
    this.checkpointOrder = [];
    if (startId >= 0) {
      this.startId = startId;
      this.cellType[startId] = CellType.Start;
    }
    if (endId >= 0) {
      this.endId = endId;
      this.cellType[endId] = CellType.End;
    }
  }

  clone(): Grid {
    const g = new Grid(this.width, this.height);
    g.cellType.set(this.cellType);
    g.weight.set(this.weight);
    g.terrainId.set(this.terrainId);
    g.startId = this.startId;
    g.endId = this.endId;
    g.checkpointOrder = [...this.checkpointOrder];
    return g;
  }

  /** Copies every per-cell array plus start/end/checkpoints into `g`, via an id→id remap. Shared by rotate/mirror. */
  private remapInto(g: Grid, remap: (oldId: number) => number): void {
    for (let oldId = 0; oldId < this.size; oldId++) {
      const newId = remap(oldId);
      g.cellType[newId] = this.cellType[oldId];
      g.weight[newId] = this.weight[oldId];
      g.terrainId[newId] = this.terrainId[oldId];
    }
    g.startId = this.startId >= 0 ? remap(this.startId) : -1;
    g.endId = this.endId >= 0 ? remap(this.endId) : -1;
    g.checkpointOrder = this.checkpointOrder.map(remap);
  }

  /** Rotates the whole grid 90° clockwise. Width and height swap, since a non-square grid rotated a quarter-turn changes shape. */
  rotated90(): Grid {
    const g = new Grid(this.height, this.width);
    this.remapInto(g, (oldId) => {
      const [r, c] = this.toRC(oldId);
      return g.toId(c, this.height - 1 - r);
    });
    return g;
  }

  /** Flips the grid left-right (mirrors across the vertical axis). Same dimensions. */
  mirroredHorizontal(): Grid {
    const g = new Grid(this.width, this.height);
    this.remapInto(g, (oldId) => {
      const [r, c] = this.toRC(oldId);
      return g.toId(r, this.width - 1 - c);
    });
    return g;
  }

  /** Flips the grid top-bottom (mirrors across the horizontal axis). Same dimensions. */
  mirroredVertical(): Grid {
    const g = new Grid(this.width, this.height);
    this.remapInto(g, (oldId) => {
      const [r, c] = this.toRC(oldId);
      return g.toId(this.height - 1 - r, c);
    });
    return g;
  }

  serialize(): SerializedGrid {
    return {
      width: this.width,
      height: this.height,
      cellType: Array.from(this.cellType),
      weight: Array.from(this.weight),
      terrainId: Array.from(this.terrainId),
      startId: this.startId,
      endId: this.endId,
      checkpointOrder: [...this.checkpointOrder],
    };
  }

  static deserialize(data: SerializedGrid): Grid {
    const g = new Grid(data.width, data.height);
    g.cellType.set(data.cellType);
    g.weight.set(data.weight);
    g.terrainId.set(data.terrainId);
    g.startId = data.startId;
    g.endId = data.endId;
    // Older saved mazes predate checkpointOrder — fall back to id order (the
    // only ordering that ever existed before placement order was tracked).
    g.checkpointOrder =
      data.checkpointOrder ??
      Array.from(data.cellType.entries())
        .filter(([, type]) => type === CellType.Checkpoint)
        .map(([id]) => id);
    return g;
  }
}
