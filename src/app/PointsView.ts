import { BufferAttribute, BufferGeometry, Group, Points, PointsMaterial, Vector3, type Camera, type WebGLProgramParametersWithUniforms } from "three";
import type { ScalePolicy } from "../core/scalePolicy";
import type { GroupLayer } from "./experienceDefinition";
import type { FloatingOrigin } from "./floatingOrigin";
import { fillKeplerRangeKm } from "../core/keplerElements";
import { KeplerPoints } from "./KeplerPoints";
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
/**
 * While the graphics chip places the dots, fills only feed the centroid and extent (the camera's focus and framing), which move slowly:
 * a week apart, linear steps between exact fills move the focus by under 2e-4 of the extent (about a twentieth of a pixel at the framing
 * distance; the shipped 51,115-member set 3e-5 of it, T-075 figures).
 */
export const KEPLER_CENTROID_SPAN_MS = 7 * 24 * 3_600_000;
/** Members computed between two looks at the clock while a fill is spread over frames; groups at or below it fill whole. */
export const SLICE_CHUNK_MEMBERS = 1024;

/** What `PointsView.screenReadout` reports for one group (diagnostic). */
export interface PointsScreenReadout {
  readonly id: string;
  /** Inside its time bounds and drawn at the last placement. */
  readonly drawn: boolean;
  readonly members: number;
  /** Members actually projected (an even sample of at most the limit). */
  sampled: number;
  /** Members in front of the camera and inside the view, scaled up from the sample. */
  inView: number;
  /** The box the sampled in-view members cover, as shares of the view; meaningless (min above max) when `inView` is 0. */
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

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
  /** Changes whenever the fill's drawn content changes, so the GPU copy knows when to be rewritten. */
  version: number;
}

/**
 * The numbers the vertex shader mixes: each member is `from + factor * (to - from) + offset`, in 32-bit floats.
 * `from` and `to` are the two fills relative to `anchor` (so they stay small and exact in 32 bits wherever the
 * group is); `offset` is the anchor minus the floating origin, the only thing that changes when the camera moves.
 */
export interface BlendInputs {
  readonly from: Float32Array;
  readonly to: Float32Array;
  readonly factor: number;
  readonly offset: Float32Array;
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
 * Dots for one group. A large group of two-body orbits under a policy that only scales (`linearUnitsPerKm`) is positioned by the vertex
 * shader straight from each member's ellipse every frame (`KeplerPoints`); the fills described next then serve only the centroid and
 * extent. Any other group or policy draws as follows.
 *
 *  Positions come from batch fills into reused buffers, are expressed from the
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
  readonly #from: BufferAttribute;
  readonly #to: BufferAttribute;
  readonly #material: PointsMaterial;
  readonly #kepler: KeplerPoints | null;
  #gpu = false;
  #policyId = "";
  #unitsPerKm = 0;
  /** The group's centre measured from the scene centre in scaled render units; zero when they are the same body. */
  #centreShift: RenderVector = [0, 0, 0];
  readonly #uniforms = { uBlend: { value: 0 }, uOffset: { value: new Vector3() } };
  readonly #offset = new Float32Array(3);
  #anchor: RenderVector = [0, 0, 0];
  #uploadedBefore: Fill | null = null;
  #uploadedAfter: Fill | null = null;
  #uploadedBeforeVersion = -1;
  #uploadedAfterVersion = -1;
  #versions = 0;
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
    this.#from = new BufferAttribute(new Float32Array(3 * count), 3);
    this.#to = new BufferAttribute(new Float32Array(3 * count), 3);
    geometry.setAttribute("position", this.#from);
    geometry.setAttribute("positionTo", this.#to);
    this.#material = new PointsMaterial({
      color: layer.color,
      size: layer.pointSizePx ?? DEFAULT_POINT_SIZE_PX,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    this.#material.onBeforeCompile = (shader) => this.#blendInVertexShader(shader);
    this.#material.customProgramCacheKey = () => "astraeus-points-blend";
    this.#points = new Points(geometry, this.#material);
    this.#points.frustumCulled = false;
    this.#points.layers.set(TRACK_LAYER);
    this.#points.visible = false;
    this.group.add(this.#points);
    const elements = count > SLICE_CHUNK_MEMBERS ? layer.group.keplerElements?.() : undefined;
    this.#kepler = elements === undefined ? null : new KeplerPoints(elements, layer.color, layer.pointSizePx ?? DEFAULT_POINT_SIZE_PX);
    if (this.#kepler !== null) this.group.add(this.#kepler.points);
  }

  /** Whether the graphics chip places the dots at the last `sync`, rather than the blend of exact fills. */
  get placedByShader(): boolean {
    return this.#gpu;
  }

  /** How many times the shader's phase epoch has been moved; 0 when the dots are not placed by the shader. */
  get rebases(): number {
    return this.#kepler?.rebaseCount ?? 0;
  }

  /** The key fills are mapped for: the policy, and whether member positions are mapped at all (the shader does that itself). */
  #mapKey(policy: ScalePolicy): string {
    return this.#gpu ? `${policy.id}:centroid` : policy.id;
  }

  get #span(): number {
    return this.#gpu ? Math.max(this.#spanMs, KEPLER_CENTROID_SPAN_MS) : this.#spanMs;
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
    const gpu = this.#kepler !== null && policy.linearUnitsPerKm !== undefined;
    if (gpu !== this.#gpu) {
      // The two ways of drawing keep different things in their fills, so start afresh.
      this.#gpu = gpu;
      this.#filled = false;
      this.#pending = null;
      this.#mappedFor = "";
    }
    this.#policyId = policy.id;
    if (gpu) {
      this.#unitsPerKm = policy.linearUnitsPerKm!;
      const shift = centreOffsetKm(this.layer, placement, timeUtcMs);
      this.#centreShift = eqjToRenderVector([shift[0] * this.#unitsPerKm, shift[1] * this.#unitsPerKm, shift[2] * this.#unitsPerKm]);
    }
    const key = this.#mapKey(policy);
    const moved = timeUtcMs - this.#lastTimeUtcMs;
    const direction = moved > 0 ? 1 : moved < 0 ? -1 : this.#direction;
    if (this.#pending !== null && (direction !== this.#pending.direction || key !== this.#pending.policyId)) this.#pending = null;
    this.#lastTimeUtcMs = timeUtcMs;
    this.#direction = direction;
    const fillsBefore = this.fillCount;
    this.#advance(timeUtcMs, placement, policy);
    const wholeFill = this.fillCount !== fillsBefore;
    if (this.#mappedFor !== key) {
      this.#remap(this.#before, policy);
      this.#remap(this.#after, policy);
      this.#mappedFor = key;
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

  /**
   * Hands the GPU this frame's numbers. The two fills are copied into the attributes only when one of them has
   * changed (a fill, a slide, a scale change); every other frame only the blend factor and offset change.
   */
  place(origin: FloatingOrigin): void {
    this.#points.visible = this.#drawn && !this.#gpu;
    if (this.#kepler !== null) this.#kepler.points.visible = this.#drawn && this.#gpu;
    if (!this.#drawn) return;
    if (this.#gpu) {
      this.#placeByShader(origin);
      return;
    }
    if (this.#uploadedBefore !== this.#before || this.#uploadedBeforeVersion !== this.#before.version
      || this.#uploadedAfter !== this.#after || this.#uploadedAfterVersion !== this.#after.version) this.#upload();
    const [ox, oy, oz] = origin.scaledCameraOrigin;
    const anchor = this.#anchor;
    this.#offset[0] = anchor[0] - ox;
    this.#offset[1] = anchor[1] - oy;
    this.#offset[2] = anchor[2] - oz;
    this.#uniforms.uBlend.value = this.#blend;
    this.#uniforms.uOffset.value.set(this.#offset[0], this.#offset[1], this.#offset[2]);
    // Mapped positions are not consistent with body radii in ReadableScale, so only TrueScale occludes.
    this.#material.depthTest = this.#policyId === "true-scale";
  }

  /** Hands the shader this frame's clock, scale and offset from the floating origin; the per-member numbers were uploaded once. */
  #placeByShader(origin: FloatingOrigin): void {
    const [ox, oy, oz] = origin.scaledCameraOrigin;
    const [sx, sy, sz] = this.#centreShift;
    this.#kepler!.update(this.#lastTimeUtcMs, this.#direction, this.#unitsPerKm, [sx - ox, sy - oy, sz - oz]);
    this.#kepler!.material.depthTest = this.#policyId === "true-scale";
  }

  /** The numbers the shader mixes as last placed; tests prove them against the exact blend. */
  get blendInputs(): BlendInputs {
    return { from: this.#from.array as Float32Array, to: this.#to.array as Float32Array, factor: this.#blend, offset: this.#offset };
  }

  /** Copies both fills into the attributes relative to a common anchor, narrowed to 32 bits. */
  #upload(): void {
    const a = this.#before;
    const b = this.#after;
    const anchor = a.centroid;
    this.#anchor = [anchor[0], anchor[1], anchor[2]];
    const from = this.#from.array as Float32Array;
    const to = this.#to.array as Float32Array;
    for (let i = 0; i < from.length; i += 3) {
      from[i] = a.scaled[i] - anchor[0];
      from[i + 1] = a.scaled[i + 1] - anchor[1];
      from[i + 2] = a.scaled[i + 2] - anchor[2];
      to[i] = b.scaled[i] - anchor[0];
      to[i + 1] = b.scaled[i + 1] - anchor[1];
      to[i + 2] = b.scaled[i + 2] - anchor[2];
    }
    this.#from.needsUpdate = true;
    this.#to.needsUpdate = true;
    this.#uploadedBefore = a;
    this.#uploadedAfter = b;
    this.#uploadedBeforeVersion = a.version;
    this.#uploadedAfterVersion = b.version;
  }

  /** Makes the stock point shader read `position` and `positionTo` and mix them, so the blend costs the CPU nothing per member. */
  #blendInVertexShader(shader: WebGLProgramParametersWithUniforms): void {
    shader.uniforms.uBlend = this.#uniforms.uBlend;
    shader.uniforms.uOffset = this.#uniforms.uOffset;
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", "attribute vec3 positionTo;\nuniform float uBlend;\nuniform vec3 uOffset;\nvoid main() {")
      .replace("#include <begin_vertex>", "vec3 transformed = position + uBlend * (positionTo - position) + uOffset;");
  }

  /**
   * Diagnostic: whether the group is drawn and how many of its members (sampled evenly, at most `limit`) are in front of the camera and inside the view,
   * with the box they cover as shares of the view (0 to 1, y down). `inView` is scaled up to all members. Reads the members as last placed.
   */
  screenReadout(camera: Camera, limit = 512): PointsScreenReadout {
    const members = this.layer.group.count;
    const drawn = this.#drawn && this.#filled && (this.#gpu ? this.#kepler!.points.visible : this.#points.visible);
    const out = { id: this.id, drawn, members, sampled: 0, inView: 0, minX: 1, maxX: 0, minY: 1, maxY: 0 };
    if (!drawn || members === 0) return out;
    camera.updateMatrixWorld();
    const point = new Vector3();
    const step = Math.max(1, Math.floor(members / limit));
    let seen = 0;
    for (let i = 0; i < members; i += step) {
      seen += 1;
      const [x, y, z] = this.memberLocalPosition(i);
      point.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
      if (point.z >= 0) continue;
      point.applyMatrix4(camera.projectionMatrix);
      if (Math.abs(point.x) > 1 || Math.abs(point.y) > 1) continue;
      const sx = (point.x + 1) / 2;
      const sy = (1 - point.y) / 2;
      out.inView += 1;
      out.minX = Math.min(out.minX, sx); out.maxX = Math.max(out.maxX, sx); out.minY = Math.min(out.minY, sy); out.maxY = Math.max(out.maxY, sy);
    }
    out.sampled = seen;
    out.inView = Math.round((out.inView / seen) * members);
    return out;
  }

  /** Local (floating-origin) position of member `index` as last placed. */
  memberLocalPosition(index: number): [number, number, number] {
    if (this.#gpu) return this.#kepler!.localPosition(index);
    const { from, to, factor, offset } = this.blendInputs;
    const f = Math.fround;
    return [0, 1, 2].map((k) => {
      const a = from[3 * index + k];
      return f(f(a + f(factor * f(to[3 * index + k] - a))) + offset[k]);
    }) as [number, number, number];
  }

  /**
   * Keeps `before <= time <= after`. Playing on in either direction slides the pair and fills one new
   * end; a seek fills once and holds that fill at both ends until the clock moves.
   */
  #advance(timeUtcMs: number, placement: ScenePlacement, policy: ScalePolicy): void {
    const bounds = this.layer.group.bounds;
    const span = this.#span;
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
      b.version = ++this.#versions;
      this.#filled = true;
    }
  }

  /** The completed look-ahead fill if it is the one wanted, else nothing (any unfinished work is dropped). */
  #takeReady(timeUtcMs: number, direction: 1 | -1, policy: ScalePolicy): Fill | null {
    const pending = this.#pending;
    this.#pending = null;
    if (pending === null || pending.phase !== 2 || pending.direction !== direction) return null;
    if (pending.timeUtcMs !== timeUtcMs || pending.policyId !== this.#mapKey(policy)) return null;
    this.fillCount += 1;
    pending.target.version = ++this.#versions;
    return pending.target;
  }

  /** Whether this group can be filled a range at a time, and is big enough for that to matter. */
  get #canSlice(): boolean {
    const { group } = this.layer;
    return this.#sliceMs > 0 && (this.#gpu || group.fillPositionsRangeKm !== undefined) && group.count > SLICE_CHUNK_MEMBERS;
  }

  /** Members `from` up to `to` of the group at a time, in km: from the elements when the shader draws (a cheaper path), else the group's own fill. */
  #fillRange(timeUtcMs: number, km: Float64Array, from: number, to: number): void {
    const { group } = this.layer;
    if (this.#gpu) fillKeplerRangeKm(this.#kepler!.elements, timeUtcMs, km, from, to);
    else if (from === 0 && to === group.count) group.fillPositionsKm(timeUtcMs, km);
    else group.fillPositionsRangeKm!(timeUtcMs, km, from, to);
  }

  /** Starts, or carries on, the next fill within this frame's time budget. */
  #lookAhead(placement: ScenePlacement, policy: ScalePolicy): void {
    if (!this.#filled || this.#direction === 0 || !this.#canSlice) return;
    if (this.#pending === null) {
      const bounds = this.layer.group.bounds;
      const forward = this.#direction > 0;
      const edge = forward ? this.#after.timeUtcMs : this.#before.timeUtcMs;
      const time = forward
        ? Math.min(edge + this.#span, bounds?.endUtcMs ?? Infinity)
        : Math.max(edge - this.#span, bounds?.startUtcMs ?? -Infinity);
      if (time === edge) return;
      const spare = (this.#spare ??= this.#emptyFill());
      const offset = centreOffsetKm(this.layer, placement, time);
      this.#pending = {
        target: spare,
        timeUtcMs: time,
        direction: this.#direction,
        policyId: this.#mapKey(policy),
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
      this.#fillRange(pending.timeUtcMs, km, from, to);
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
      target.mappedFor = this.#mapKey(policy);
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
      version: 0,
    };
  }

  #fill(target: Fill, timeUtcMs: number, placement: ScenePlacement, policy: ScalePolicy): void {
    const { group } = this.layer;
    const km = target.km;
    this.#fillRange(timeUtcMs, km, 0, group.count);
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
    const key = this.#mapKey(policy);
    if (fill.mappedFor === key) return;
    this.#mapRange(fill, policy, 0, this.layer.group.count);
    fill.centroid = eqjToRenderVector(policy.mapPosition(fill.centroidKm));
    fill.mappedFor = key;
    fill.version = ++this.#versions;
  }

  /** Maps members `from` up to `to` of a fill's km positions through the policy into its scaled positions. */
  #mapRange(fill: Fill, policy: ScalePolicy, from: number, to: number): void {
    if (this.#gpu) return; // the shader maps member positions itself
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
