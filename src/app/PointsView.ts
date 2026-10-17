import { BufferAttribute, BufferGeometry, Group, Points, PointsMaterial } from "three";
import type { ScalePolicy } from "../core/scalePolicy";
import type { GroupLayer } from "./experienceDefinition";
import type { FloatingOrigin } from "./floatingOrigin";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import { sceneOffsetKm, type ScenePlacement } from "./sceneLayout";
import { TRACK_LAYER } from "./TrackedBodyView";

// Measured in T-030 for 10^4 members: a 5-minute span blends to within about 8 km of the exact position on a ring 26,000 km
// across, and costs one ~12 ms slide per span; shorter spans slide more often, longer ones drift further from exact.
export const DEFAULT_REFILL_AFTER_MS = 300_000;
const DEFAULT_POINT_SIZE_PX = 2.5;
/**
 * Milliseconds of each frame the points layer may spend computing the next fill ahead of time (see `refillSliceMs`).
 * About 8 ms leaves most of a 30 fps frame for drawing; 0 turns the look-ahead off and every fill happens in one frame.
 */
export const DEFAULT_REFILL_SLICE_MS = 8;
/** Members computed between two looks at the clock while a fill is spread over frames; groups at or below it fill whole. */
export const SLICE_CHUNK_MEMBERS = 1024;

const NO_OFFSET: ArrayLike<number> = Object.freeze([0, 0, 0]);

/** The group's centre measured from the scene centre; nothing to add when they are the same body. */
function centreOffsetKm(layer: GroupLayer, placement: ScenePlacement, timeUtcMs: number): ArrayLike<number> {
  return sceneOffsetKm(placement, layer.group.center, timeUtcMs) ?? NO_OFFSET;
}

/** One exact fill, already expressed from the scene centre and mapped through the policy. */
interface Fill {
  timeUtcMs: number;
  readonly km: Float64Array;
  readonly scaled: Float64Array;
  centroidKm: [number, number, number];
  extentKm: number;
  centroid: RenderVector;
  mappedFor: string;
}

/** A fill being computed a slice per frame toward a time known in advance. Not drawn until complete and swapped in. */
interface PendingFill {
  readonly target: Fill;
  readonly timeUtcMs: number;
  readonly direction: 1 | -1;
  readonly policyId: string;
  readonly offset: [number, number, number];
  /** 0: positions, offset and sums; 1: extent and scaled positions; 2: complete. */
  phase: number;
  cursor: number;
  sum: [number, number, number];
  widest: number;
}

/**
 * Dots for one group. Positions come from batch fills into reused buffers, are expressed from the
 * scene centre, and then go through ScalePolicy -> render axes -> floating origin
 * like every other body. Two exact fills are held, one at or before the clock time and one at or
 * after it, `refillAfterMs` apart; each frame draws a straight-line blend of them, so the dots glide
 * between fills and a fill happens once per interval. The blend is presentation only: it never
 * changes the group's State, and at a fill time the drawn positions are the exact fill.
 *
 * A large group would hitch for a whole frame at every fill, so when the group can fill a range of members the
 * next fill, whose time is known (one span past the pair, in the direction the clock is moving), is computed a
 * few milliseconds per frame ahead of time and only swapped in when complete. If the clock passes it first, jumps,
 * turns round, or the scale policy changes, the unfinished work is dropped and the fill is made whole, as it
 * would have been without look-ahead; the drawn pair is never a half-finished fill.
 */
export class PointsView {
  readonly group = new Group();
  /** Number of batch fills so far; lets tests and diagnostics see that no fill happens outside bounds. */
  fillCount = 0;
  readonly #points: Points;
  readonly #positions: BufferAttribute;
  readonly #material: PointsMaterial;
  readonly #spanMs: number;
  readonly #sliceMs: number;
  readonly #now: () => number;
  #spare: Fill | null = null;
  #pending: PendingFill | null = null;
  #lastTimeUtcMs = Number.NaN;
  #direction: 0 | 1 | -1 = 0;
  #before: Fill;
  #after: Fill;
  #filled = false;
  #blend = 0;
  #centroid: RenderVector = [0, 0, 0];
  #extentKm = 0;
  #holdKm: [number, number, number] | null = null;
  #mappedFor = "";
  #drawn = false;

  constructor(readonly layer: GroupLayer, now: () => number = () => performance.now()) {
    const count = layer.group.count;
    this.#now = now;
    this.#sliceMs = layer.refillSliceMs ?? DEFAULT_REFILL_SLICE_MS;
    if (!(this.#sliceMs >= 0) || !Number.isFinite(this.#sliceMs)) {
      throw new RangeError(`${layer.object.id}: refillSliceMs must be zero or a positive finite number`);
    }
    this.#spanMs = layer.refillAfterMs ?? DEFAULT_REFILL_AFTER_MS;
    if (!(this.#spanMs > 0) || !Number.isFinite(this.#spanMs)) {
      throw new RangeError(`${layer.object.id}: refillAfterMs must be a positive finite number`);
    }
    this.#before = this.#emptyFill();
    this.#after = this.#emptyFill();
    const geometry = new BufferGeometry();
    this.#positions = new BufferAttribute(new Float32Array(3 * count), 3);
    geometry.setAttribute("position", this.#positions);
    this.#material = new PointsMaterial({
      color: layer.color,
      size: layer.pointSizePx ?? DEFAULT_POINT_SIZE_PX,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    this.#points = new Points(geometry, this.#material);
    this.#points.frustumCulled = false;
    this.#points.layers.set(TRACK_LAYER);
    this.#points.visible = false;
    this.group.add(this.#points);
  }

  get id(): string {
    return this.layer.object.id;
  }

  /** Whether the group is inside its time bounds at the last `sync`. */
  get drawn(): boolean {
    return this.#drawn;
  }

  /** Scaled absolute representative point (the centroid) for the camera and label; holds the last one outside bounds. */
  absolute(): RenderVector {
    return this.#centroid;
  }

  /** Scaled distance from the centroid to the farthest member at the last sync; 0 before any fill. */
  extentUnits(policy: ScalePolicy): number {
    const mapped = policy.mapPosition([this.#extentKm, 0, 0]);
    return mapped[0];
  }

  /**
   * Brings the held fills up to `timeUtcMs` and `policy`. Outside the group's bounds nothing is
   * filled and nothing is drawn; the representative point holds its last value.
   */
  sync(timeUtcMs: number, placement: ScenePlacement, policy: ScalePolicy): void {
    const { group } = this.layer;
    const bounds = group.bounds;
    this.#drawn = bounds === undefined || (timeUtcMs >= bounds.startUtcMs && timeUtcMs <= bounds.endUtcMs);
    if (!this.#drawn) {
      if (!this.#filled && this.#holdKm === null) this.#holdCentre(placement, bounds?.startUtcMs ?? timeUtcMs, policy);
      return;
    }
    const moved = timeUtcMs - this.#lastTimeUtcMs;
    const direction = moved > 0 ? 1 : moved < 0 ? -1 : this.#direction;
    if (this.#pending !== null && (direction !== this.#pending.direction || policy.id !== this.#pending.policyId)) this.#pending = null;
    this.#lastTimeUtcMs = timeUtcMs;
    this.#direction = direction;
    const fillsBefore = this.fillCount;
    this.#advance(timeUtcMs, placement, policy);
    const wholeFill = this.fillCount !== fillsBefore;
    if (this.#mappedFor !== policy.id) {
      this.#remap(this.#before, policy);
      this.#remap(this.#after, policy);
      this.#mappedFor = policy.id;
    }
    const a = this.#before;
    const b = this.#after;
    this.#blend = b.timeUtcMs > a.timeUtcMs ? (timeUtcMs - a.timeUtcMs) / (b.timeUtcMs - a.timeUtcMs) : 0;
    const f = this.#blend;
    this.#centroid = [0, 1, 2].map((k) => a.centroid[k] + f * (b.centroid[k] - a.centroid[k])) as RenderVector;
    this.#extentKm = a.extentKm + f * (b.extentKm - a.extentKm);
    // A frame that already paid for a whole fill does no look-ahead; the next one starts it.
    if (!wholeFill) this.#lookAhead(placement, policy);
  }

  /** Writes the narrowed, origin-relative, blended positions the GPU draws. */
  place(origin: FloatingOrigin): void {
    this.#points.visible = this.#drawn;
    if (!this.#drawn) return;
    const [ox, oy, oz] = origin.scaledCameraOrigin;
    const from = this.#before.scaled;
    const to = this.#after.scaled;
    const f = this.#blend;
    const out = this.#positions.array as Float32Array;
    for (let i = 0; i < from.length; i += 3) {
      out[i] = from[i] + f * (to[i] - from[i]) - ox;
      out[i + 1] = from[i + 1] + f * (to[i + 1] - from[i + 1]) - oy;
      out[i + 2] = from[i + 2] + f * (to[i + 2] - from[i + 2]) - oz;
    }
    this.#positions.needsUpdate = true;
    // Mapped positions are not consistent with body radii in ReadableScale, so only TrueScale occludes.
    this.#material.depthTest = this.#mappedFor === "true-scale";
  }

  /** Local (floating-origin) position of member `index` as last placed. */
  memberLocalPosition(index: number): [number, number, number] {
    const a = this.#positions.array;
    return [a[3 * index], a[3 * index + 1], a[3 * index + 2]];
  }

  /**
   * Keeps `before <= time <= after`. Playing on in either direction slides the pair and fills one new
   * end; a seek fills once and holds that fill at both ends until the clock moves.
   */
  #advance(timeUtcMs: number, placement: ScenePlacement, policy: ScalePolicy): void {
    const bounds = this.layer.group.bounds;
    const span = this.#spanMs;
    const a = this.#before;
    const b = this.#after;
    if (this.#filled && timeUtcMs >= a.timeUtcMs && timeUtcMs <= b.timeUtcMs) return;
    if (this.#filled && timeUtcMs > b.timeUtcMs && timeUtcMs <= b.timeUtcMs + span) {
      const next = Math.min(b.timeUtcMs + span, bounds?.endUtcMs ?? Infinity);
      this.#before = b;
      const ready = this.#takeReady(next, 1, policy);
      if (ready === null) {
        this.#after = a;
        this.#fill(a, next, placement, policy);
      } else {
        this.#after = ready;
        this.#spare = a;
      }
    } else if (this.#filled && timeUtcMs < a.timeUtcMs && timeUtcMs >= a.timeUtcMs - span) {
      const next = Math.max(a.timeUtcMs - span, bounds?.startUtcMs ?? -Infinity);
      this.#after = a;
      const ready = this.#takeReady(next, -1, policy);
      if (ready === null) {
        this.#before = b;
        this.#fill(b, next, placement, policy);
      } else {
        this.#before = ready;
        this.#spare = b;
      }
    } else {
      this.#pending = null;
      this.#fill(a, timeUtcMs, placement, policy);
      b.km.set(a.km);
      b.scaled.set(a.scaled);
      b.timeUtcMs = a.timeUtcMs;
      b.centroidKm = a.centroidKm;
      b.extentKm = a.extentKm;
      b.centroid = a.centroid;
      b.mappedFor = a.mappedFor;
      this.#filled = true;
    }
  }

  /** The completed look-ahead fill if it is the one wanted, else nothing (any unfinished work is dropped). */
  #takeReady(timeUtcMs: number, direction: 1 | -1, policy: ScalePolicy): Fill | null {
    const pending = this.#pending;
    this.#pending = null;
    if (pending === null || pending.phase !== 2 || pending.direction !== direction) return null;
    if (pending.timeUtcMs !== timeUtcMs || pending.policyId !== policy.id) return null;
    this.fillCount += 1;
    return pending.target;
  }

  /** Whether this group can be filled a range at a time, and is big enough for that to matter. */
  get #canSlice(): boolean {
    const { group } = this.layer;
    return this.#sliceMs > 0 && group.fillPositionsRangeKm !== undefined && group.count > SLICE_CHUNK_MEMBERS;
  }

  /** Starts, or carries on, the next fill within this frame's time budget. */
  #lookAhead(placement: ScenePlacement, policy: ScalePolicy): void {
    if (!this.#filled || this.#direction === 0 || !this.#canSlice) return;
    if (this.#pending === null) {
      const bounds = this.layer.group.bounds;
      const forward = this.#direction > 0;
      const edge = forward ? this.#after.timeUtcMs : this.#before.timeUtcMs;
      const time = forward
        ? Math.min(edge + this.#spanMs, bounds?.endUtcMs ?? Infinity)
        : Math.max(edge - this.#spanMs, bounds?.startUtcMs ?? -Infinity);
      if (time === edge) return;
      const spare = (this.#spare ??= this.#emptyFill());
      const offset = centreOffsetKm(this.layer, placement, time);
      this.#pending = {
        target: spare,
        timeUtcMs: time,
        direction: this.#direction,
        policyId: policy.id,
        offset: [offset[0], offset[1], offset[2]],
        phase: 0,
        cursor: 0,
        sum: [0, 0, 0],
        widest: 0,
      };
    }
    const pending: PendingFill = this.#pending;
    if (pending.phase === 2) return;
    const started = this.#now();
    do {
      this.#step(pending, policy);
    } while (pending.phase !== 2 && this.#now() - started < this.#sliceMs);
  }

  /** One chunk of the pending fill, in the same member order and arithmetic as a whole fill. */
  #step(pending: PendingFill, policy: ScalePolicy): void {
    const { group } = this.layer;
    const target = pending.target;
    const km = target.km;
    const from = pending.cursor;
    const to = Math.min(from + SLICE_CHUNK_MEMBERS, group.count);
    if (pending.phase === 0) {
      group.fillPositionsRangeKm!(pending.timeUtcMs, km, from, to);
      const [ox, oy, oz] = pending.offset;
      let [cx, cy, cz] = pending.sum;
      for (let i = 3 * from; i < 3 * to; i += 3) {
        km[i] += ox;
        km[i + 1] += oy;
        km[i + 2] += oz;
        cx += km[i];
        cy += km[i + 1];
        cz += km[i + 2];
      }
      pending.sum = [cx, cy, cz];
      pending.cursor = to;
      if (to === group.count) {
        const n = group.count;
        target.centroidKm = [pending.sum[0] / n, pending.sum[1] / n, pending.sum[2] / n];
        target.timeUtcMs = pending.timeUtcMs;
        pending.phase = 1;
        pending.cursor = 0;
      }
      return;
    }
    const c = target.centroidKm;
    for (let i = 3 * from; i < 3 * to; i += 3) {
      pending.widest = Math.max(pending.widest, Math.hypot(km[i] - c[0], km[i + 1] - c[1], km[i + 2] - c[2]));
    }
    this.#mapRange(target, policy, from, to);
    pending.cursor = to;
    if (to === group.count) {
      target.extentKm = pending.widest;
      target.centroid = eqjToRenderVector(policy.mapPosition(target.centroidKm));
      target.mappedFor = policy.id;
      pending.phase = 2;
    }
  }

  #emptyFill(): Fill {
    const count = this.layer.group.count;
    return {
      timeUtcMs: Number.NaN,
      km: new Float64Array(3 * count),
      scaled: new Float64Array(3 * count),
      centroidKm: [0, 0, 0],
      extentKm: 0,
      centroid: [0, 0, 0],
      mappedFor: "",
    };
  }

  #fill(target: Fill, timeUtcMs: number, placement: ScenePlacement, policy: ScalePolicy): void {
    const { group } = this.layer;
    const km = target.km;
    group.fillPositionsKm(timeUtcMs, km);
    this.fillCount += 1;
    target.timeUtcMs = timeUtcMs;
    const offset = centreOffsetKm(this.layer, placement, timeUtcMs);
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (let i = 0; i < km.length; i += 3) {
      km[i] += offset[0];
      km[i + 1] += offset[1];
      km[i + 2] += offset[2];
      cx += km[i];
      cy += km[i + 1];
      cz += km[i + 2];
    }
    const n = group.count;
    const centroid: [number, number, number] = [cx / n, cy / n, cz / n];
    let widest = 0;
    for (let i = 0; i < km.length; i += 3) {
      widest = Math.max(widest, Math.hypot(km[i] - centroid[0], km[i + 1] - centroid[1], km[i + 2] - centroid[2]));
    }
    target.centroidKm = centroid;
    target.extentKm = widest;
    target.mappedFor = "";
    this.#remap(target, policy);
  }

  #remap(fill: Fill, policy: ScalePolicy): void {
    if (fill.mappedFor === policy.id) return;
    this.#mapRange(fill, policy, 0, this.layer.group.count);
    fill.centroid = eqjToRenderVector(policy.mapPosition(fill.centroidKm));
    fill.mappedFor = policy.id;
  }

  /** Maps members `from` up to `to` of a fill's km positions through the policy into its scaled positions. */
  #mapRange(fill: Fill, policy: ScalePolicy, from: number, to: number): void {
    const { km, scaled } = fill;
    const member = new Float64Array(3);
    for (let i = 3 * from; i < 3 * to; i += 3) {
      member[0] = km[i];
      member[1] = km[i + 1];
      member[2] = km[i + 2];
      const mapped = eqjToRenderVector(policy.mapPosition(member));
      scaled[i] = mapped[0];
      scaled[i + 1] = mapped[1];
      scaled[i + 2] = mapped[2];
    }
  }

  /** Before any fill and outside bounds, the group's centre stands in for the representative point. */
  #holdCentre(placement: ScenePlacement, timeUtcMs: number, policy: ScalePolicy): void {
    const offset = centreOffsetKm(this.layer, placement, timeUtcMs);
    this.#holdKm = [offset[0], offset[1], offset[2]];
    this.#centroid = eqjToRenderVector(policy.mapPosition(this.#holdKm));
  }
}
