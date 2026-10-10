import { BufferAttribute, BufferGeometry, Group, Points, PointsMaterial } from "three";
import type { AstronomyAdapter } from "../core/astronomyAdapter";
import { sunPositionFromEarthAt } from "../core/referenceCenters";
import type { ScalePolicy } from "../core/scalePolicy";
import type { GroupLayer } from "./experienceDefinition";
import type { FloatingOrigin } from "./floatingOrigin";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import { TRACK_LAYER } from "./TrackedBodyView";

// Measured in T-030 for 10^4 members: a 5-minute span blends to within about 8 km of the exact position on a ring 26,000 km
// across, and costs one ~12 ms slide per span; shorter spans slide more often, longer ones drift further from exact.
export const DEFAULT_REFILL_AFTER_MS = 300_000;
const DEFAULT_POINT_SIZE_PX = 2.5;

/** Earth-centred offset of the group's centre, from the existing centre composition. */
function centreOffsetKm(layer: GroupLayer, adapter: AstronomyAdapter, timeUtcMs: number): ArrayLike<number> {
  const { center } = layer.group;
  if (center === "earth") return [0, 0, 0];
  if (center === "sun") return sunPositionFromEarthAt(adapter, timeUtcMs).positionKm;
  throw new RangeError(`${layer.object.id}: groups centred on "${center}" are not supported by the points layer`);
}

/** One exact fill, already composed to the scene's Earth-centred placement and mapped through the policy. */
interface Fill {
  timeUtcMs: number;
  readonly km: Float64Array;
  readonly scaled: Float64Array;
  centroidKm: [number, number, number];
  extentKm: number;
  centroid: RenderVector;
  mappedFor: string;
}

/**
 * Dots for one group. Positions come from batch fills into reused buffers, are composed to the
 * scene's Earth-centred placement, and then go through ScalePolicy -> render axes -> floating origin
 * like every other body. Two exact fills are held, one at or before the clock time and one at or
 * after it, `refillAfterMs` apart; each frame draws a straight-line blend of them, so the dots glide
 * between fills and a fill happens once per interval. The blend is presentation only: it never
 * changes the group's State, and at a fill time the drawn positions are the exact fill.
 */
export class PointsView {
  readonly group = new Group();
  /** Number of batch fills so far; lets tests and diagnostics see that no fill happens outside bounds. */
  fillCount = 0;
  readonly #points: Points;
  readonly #positions: BufferAttribute;
  readonly #material: PointsMaterial;
  readonly #spanMs: number;
  #before: Fill;
  #after: Fill;
  #filled = false;
  #blend = 0;
  #centroid: RenderVector = [0, 0, 0];
  #extentKm = 0;
  #holdKm: [number, number, number] | null = null;
  #mappedFor = "";
  #drawn = false;

  constructor(readonly layer: GroupLayer) {
    const count = layer.group.count;
    this.#spanMs = layer.refillAfterMs ?? DEFAULT_REFILL_AFTER_MS;
    if (!(this.#spanMs > 0) || !Number.isFinite(this.#spanMs)) {
      throw new RangeError(`${layer.object.id}: refillAfterMs must be a positive finite number`);
    }
    const emptyFill = (): Fill => ({
      timeUtcMs: Number.NaN,
      km: new Float64Array(3 * count),
      scaled: new Float64Array(3 * count),
      centroidKm: [0, 0, 0],
      extentKm: 0,
      centroid: [0, 0, 0],
      mappedFor: "",
    });
    this.#before = emptyFill();
    this.#after = emptyFill();
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
  sync(timeUtcMs: number, adapter: AstronomyAdapter, policy: ScalePolicy): void {
    const { group } = this.layer;
    const bounds = group.bounds;
    this.#drawn = bounds === undefined || (timeUtcMs >= bounds.startUtcMs && timeUtcMs <= bounds.endUtcMs);
    if (!this.#drawn) {
      if (!this.#filled && this.#holdKm === null) this.#holdCentre(adapter, bounds?.startUtcMs ?? timeUtcMs, policy);
      return;
    }
    this.#advance(timeUtcMs, adapter, policy);
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
  #advance(timeUtcMs: number, adapter: AstronomyAdapter, policy: ScalePolicy): void {
    const bounds = this.layer.group.bounds;
    const span = this.#spanMs;
    const a = this.#before;
    const b = this.#after;
    if (this.#filled && timeUtcMs >= a.timeUtcMs && timeUtcMs <= b.timeUtcMs) return;
    if (this.#filled && timeUtcMs > b.timeUtcMs && timeUtcMs <= b.timeUtcMs + span) {
      this.#before = b;
      this.#after = a;
      this.#fill(a, Math.min(b.timeUtcMs + span, bounds?.endUtcMs ?? Infinity), adapter, policy);
    } else if (this.#filled && timeUtcMs < a.timeUtcMs && timeUtcMs >= a.timeUtcMs - span) {
      this.#after = a;
      this.#before = b;
      this.#fill(b, Math.max(a.timeUtcMs - span, bounds?.startUtcMs ?? -Infinity), adapter, policy);
    } else {
      this.#fill(a, timeUtcMs, adapter, policy);
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

  #fill(target: Fill, timeUtcMs: number, adapter: AstronomyAdapter, policy: ScalePolicy): void {
    const { group } = this.layer;
    const km = target.km;
    group.fillPositionsKm(timeUtcMs, km);
    this.fillCount += 1;
    target.timeUtcMs = timeUtcMs;
    const offset = centreOffsetKm(this.layer, adapter, timeUtcMs);
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
    const { km, scaled } = fill;
    const member = new Float64Array(3);
    for (let i = 0; i < km.length; i += 3) {
      member[0] = km[i];
      member[1] = km[i + 1];
      member[2] = km[i + 2];
      const mapped = eqjToRenderVector(policy.mapPosition(member));
      scaled[i] = mapped[0];
      scaled[i + 1] = mapped[1];
      scaled[i + 2] = mapped[2];
    }
    fill.centroid = eqjToRenderVector(policy.mapPosition(fill.centroidKm));
    fill.mappedFor = policy.id;
  }

  /** Before any fill and outside bounds, the group's centre stands in for the representative point. */
  #holdCentre(adapter: AstronomyAdapter, timeUtcMs: number, policy: ScalePolicy): void {
    const offset = centreOffsetKm(this.layer, adapter, timeUtcMs);
    this.#holdKm = [offset[0], offset[1], offset[2]];
    this.#centroid = eqjToRenderVector(policy.mapPosition(this.#holdKm));
  }
}
