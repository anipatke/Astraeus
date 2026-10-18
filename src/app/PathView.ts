import { BufferAttribute, BufferGeometry, DoubleSide, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, Vector3, type Camera } from "three";
import type { CenterId } from "../core/body";
import type { ScalePolicy } from "../core/scalePolicy";
import { eccentricPathTimesUtcMs, pathTimesUtcMs, samplePositionsKm, windowTimesUtcMs } from "../core/sunCentredSources";
import type { StateResolver } from "../core/stateResolver";
import type { Trajectory } from "../core/trajectory";
import { catalogue } from "../assets/catalogue";
import { ORBIT_LOOK_LIMITS, resolveOrbitLook, type OrbitLook } from "../assets/orbitLook";
import type { CompositionPath } from "../assets/compositions";
import {
  DEFAULT_ECCENTRIC_SAMPLE_COUNT,
  DEFAULT_PATH_SAMPLE_COUNT,
  DEFAULT_WINDOW_SAMPLE_COUNT,
  isRollingSpan,
  validatePathSpec,
  type PathLayer,
} from "./experienceDefinition";
import type { FloatingOrigin } from "./floatingOrigin";
import { arcSegmentAlpha, inertialTrailKm, mapPathKm, ringAlpha, windowEdgeAlpha, orbitKm, pathNeedsRefresh, relativeTrailKm, rootFrameKm, type PathRefreshPolicy, DEFAULT_PATH_REFRESH } from "./pathRules";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import type { ScenePlacement } from "./sceneLayout";
import { TRACK_LAYER } from "./TrackedBodyView";

/** What `PathView.screenReadout` reports for one path (diagnostic). */
export interface PathScreenReadout {
  readonly id: string;
  readonly visible: boolean;
  readonly vertices: number;
  /** Vertices in front of the camera and inside the view. */
  readonly inView: number;
  /** The box those vertices cover, as shares of the view; meaningless (min above max) when `inView` is 0. */
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

/** Steps each arc segment is cut into, as the donor's ring slices (8). */
const ARC_SUBSTEPS = 8;

const scaleLength = (policy: ScalePolicy, km: number): number => policy.mapPosition([km, 0, 0])[0];

/** How a path line looks; presentation only, so it never reaches a rule. */
export interface PathStyle {
  readonly opacity?: number;
  /** Whether scene bodies can hide the line. Paths are overlays by default. */
  readonly depthTest?: boolean;
  /** Camera layer the line is drawn on; defaults to the overlay layer. */
  readonly layer?: number;
  /** Draw order among transparent objects; defaults to 1, after the data dots a line crosses. */
  readonly renderOrder?: number;
  /**
   * Draw an orbit as a faint ring with faded ends plus a brighter arc behind the body (see `OrbitLook`); the line's `opacity` is then
   * replaced by the look's. Rolling spans only: the body is the middle vertex.
   */
  readonly orbitLook?: OrbitLook;
}

/**
 * A path: a state source sampled over a span and drawn by one of three rules (`orbit`, relative `trail`, inertial `trail`; see
 * `pathRules.ts`). Each frame the vertices are expressed from the scene centre by the rule, then go through
 * ScalePolicy -> render axes -> floating origin like every other body. A rolling span is resampled around the clock time.
 */
export class PathView {
  readonly group = new Group();
  readonly #capacity: number;
  readonly #scaled: Float64Array;
  readonly #positions: BufferAttribute;
  readonly #refresh: PathRefreshPolicy;
  readonly #explicitCentre: CenterId | undefined;
  /** The centre the samples are measured about. */
  #frame: CenterId | undefined;
  #times: readonly number[] = [];
  #samplesKm: Float64Array = new Float64Array(0);
  #maxRadiusKm = 0;
  #version = 0;
  #builtRealMs = Number.NEGATIVE_INFINITY;
  #windowCentre: number | null = null;
  #cache: { readonly key: string; readonly resolver: StateResolver; readonly km: Float64Array } | null = null;
  #centreKm: [number, number, number] = [0, 0, 0];
  #extentKm = 0;
  #centre: RenderVector = [0, 0, 0];
  #extentScaled = 0;
  #look: OrbitLook | null = null;
  #defaultLook: OrbitLook | null = null;
  #line: Line | null = null;
  #ring: Line | null = null;
  #arc: Mesh | null = null;
  #ringColours: BufferAttribute | null = null;
  #arcColours: BufferAttribute | null = null;
  /** The arc's centre line, oldest first, in scaled absolute positions: `segments x ARC_SUBSTEPS + 1` points. */
  #arcScaled: Float64Array | null = null;
  #arcPoints = 0;
  #arcBase: Float32Array = new Float32Array(0);
  #ribbonScaled: Float64Array | null = null;
  #arcTimes: readonly number[] = [];
  #arcPositions: BufferAttribute | null = null;

  constructor(readonly layer: PathLayer, style: PathStyle = {}, refresh: PathRefreshPolicy = DEFAULT_PATH_REFRESH) {
    validatePathSpec(layer.object?.id ?? "path", layer);
    this.#refresh = refresh;
    this.#explicitCentre = layer.kind === "orbit" ? layer.center : undefined;
    const rolling = isRollingSpan(layer.span);
    this.#capacity = layer.samples ?? (rolling ? DEFAULT_WINDOW_SAMPLE_COUNT : layer.sampling === undefined ? DEFAULT_PATH_SAMPLE_COUNT : DEFAULT_ECCENTRIC_SAMPLE_COUNT);
    this.#scaled = new Float64Array(this.#capacity * 3);
    if (!isRollingSpan(layer.span)) this.#resample(layer.sampling === undefined ? pathTimesUtcMs(layer.span, this.#capacity) : eccentricPathTimesUtcMs(layer.span, this.#capacity, layer.sampling));
    const geometry = new BufferGeometry();
    this.#positions = new BufferAttribute(new Float32Array(this.#capacity * 3), 3);
    geometry.setAttribute("position", this.#positions);
    const line = new Line(geometry, new LineBasicMaterial({
      color: layer.color,
      transparent: true,
      opacity: style.opacity ?? 0.7,
      depthTest: style.depthTest ?? false,
    }));
    line.frustumCulled = false;
    line.layers.set(style.layer ?? TRACK_LAYER);
    // Overlays are drawn after the data dots they cross, so a belt cannot swallow the line (I-020).
    line.renderOrder = style.renderOrder ?? 1;
    this.group.add(line);
    this.#line = line;
    if (style.orbitLook !== undefined && rolling) this.#addLookLayers(geometry, line, style.orbitLook);
  }

  /** The ring is the line already built (vertex colours carry the end fade); the arc is its own short line from the recent samples to the body's live position. */
  #addLookLayers(geometry: BufferGeometry, ring: Line, look: OrbitLook): void {
    const n = this.#capacity;
    this.#ringColours = new BufferAttribute(new Float32Array(n * 4).fill(1), 4);
    const maxSegments = ORBIT_LOOK_LIMITS.arcSegments.max;
    const maxVertices = maxSegments * (ARC_SUBSTEPS + 1) * 2;
    this.#arcColours = new BufferAttribute(new Float32Array(maxVertices * 4).fill(1), 4);
    this.#arcScaled = new Float64Array((maxSegments * ARC_SUBSTEPS + 1) * 3);
    this.#ribbonScaled = new Float64Array(maxVertices * 3);
    this.#arcPositions = new BufferAttribute(new Float32Array(maxVertices * 3), 3);
    geometry.setAttribute("color", this.#ringColours);
    const indices: number[] = [];
    for (let s = 0; s < maxSegments; s += 1) {
      for (let j = 0; j < ARC_SUBSTEPS; j += 1) {
        const v = (s * (ARC_SUBSTEPS + 1) + j) * 2;
        indices.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
      }
    }
    const arcGeometry = new BufferGeometry();
    arcGeometry.setAttribute("position", this.#arcPositions);
    arcGeometry.setAttribute("color", this.#arcColours);
    arcGeometry.setIndex(indices);
    arcGeometry.setDrawRange(0, 0);
    const ringMaterial = ring.material as LineBasicMaterial;
    ringMaterial.vertexColors = true;
    // Planetary Explorer's arc: flat ribbons, transparent, no depth write, both sides; the opacity rides on the vertices, segment by segment.
    const arcMaterial = new MeshBasicMaterial({ vertexColors: true, color: ringMaterial.color.clone(), transparent: true, depthWrite: false, side: DoubleSide, depthTest: ringMaterial.depthTest });
    const arc = new Mesh(arcGeometry, arcMaterial);
    arc.frustumCulled = false;
    arc.layers.mask = ring.layers.mask;
    arc.renderOrder = ring.renderOrder + 1;
    this.group.add(arc);
    this.#ring = ring;
    this.#arc = arc;
    this.#defaultLook = look;
    this.setLook(look);
  }

  /**
   * Opacities from time, every frame: the ring's end fade slides with the clock, and the arc runs from the last sample at or before the clock
   * to the body's live position, so neither steps with the sampling or jumps when the window is rebuilt.
   */
  #updateLook(timeUtcMs: number, placement: ScenePlacement, policy: ScalePolicy): void {
    const look = this.#look;
    const span = this.layer.span;
    if (look === null || this.#ringColours === null || this.#arcColours === null || this.#arcScaled === null || this.#arcPositions === null || this.#arc === null || !isRollingSpan(span) || this.#frame === undefined) return;
    const times = this.#times;
    const n = times.length;
    const arcMs = look.arcFraction * span.windowMs;
    for (let i = 0; i < n; i += 1) {
      // The ring runs under the arc, as Planetary Explorer's OrbitalTrail does under its OrbitalTrailArc: seen edge-on the flat arc thins
      // away and the ring's one-pixel line still carries the orbit.
      const alpha = look.endFadeOn ? ringAlpha(timeUtcMs, times[i], span.windowMs, look.endFade) * windowEdgeAlpha(i, n, look.endFade) : 1;
      this.#ringColours.setW(i, alpha);
    }
    this.#ringColours.needsUpdate = true;
    // The arc is the body's own recent path, sampled here from its trajectory (never from the ring's window), cut into equal-time segments.
    const segments = Math.max(2, Math.round(look.arcSegments));
    const points = segments * ARC_SUBSTEPS + 1;
    const km = new Float64Array(3 * points);
    const arcTimes: number[] = [];
    for (let k = 0; k < points; k += 1) {
      const t = k === points - 1 ? timeUtcMs : Math.round(timeUtcMs - arcMs * (1 - k / (points - 1)));
      arcTimes.push(t);
      km.set(this.layer.source.stateAt(t, this.#explicitCentre).positionKm, 3 * k);
    }
    this.#arcTimes = arcTimes;
    this.#arcPoints = points;
    this.#arcScaled.set(eqjMapped(orbitKm(km, this.#frame, placement, timeUtcMs), policy));
    this.#arcBase = Float32Array.from({ length: segments }, (_, i) => arcSegmentAlpha(i, segments, look.arcPeak, look.arcExponent));
    this.#arc.geometry.setDrawRange(0, segments * ARC_SUBSTEPS * 6);
    this.#paintArc();
  }

  /**
   * Each centre-line point gets an inner and an outer vertex, half the width either side along the line from the orbit's centre: a flat
   * ribbon in the orbit's plane, as Planetary Explorer's ring slices are (`innerR = R - hw`, `outerR = R + hw`). It never turns to face the
   * camera, so it cannot flip or flicker; seen edge-on it thins away, as the donor's does. Positions are scaled absolute; `place` subtracts
   * the floating origin.
   */
  #buildRibbon(camera: ArrayLike<number>, screen: PathScreen | undefined): void {
    const c = this.#arcScaled;
    const out = this.#ribbonScaled;
    const look = this.#look;
    if (c === null || out === null || look === null) return;
    const points = this.#arcPoints;
    const segments = this.#arcBase.length;
    const halfWidth = look.arcWidth * this.#extentScaled;
    const [cx, cy, cz] = this.#centre;
    // Units per pixel at unit distance; the half-width at a point is capped at half of `arcMaxWidthPx` there (owner, 2026-10-18).
    const perPx = screen === undefined ? Infinity : (2 * Math.tan((screen.fovDeg * Math.PI) / 360)) / screen.viewportHeightPx;
    const side = new Float64Array(3 * points);
    for (let k = 0; k < points; k += 1) {
      const rx = c[3 * k] - cx;
      const ry = c[3 * k + 1] - cy;
      const rz = c[3 * k + 2] - cz;
      const length = Math.hypot(rx, ry, rz) || 1;
      const distance = Math.hypot(c[3 * k] - camera[0], c[3 * k + 1] - camera[1], c[3 * k + 2] - camera[2]);
      const half = Math.min(halfWidth, (look.arcMaxWidthPx / 2) * perPx * distance);
      side[3 * k] = (rx / length) * half;
      side[3 * k + 1] = (ry / length) * half;
      side[3 * k + 2] = (rz / length) * half;
    }
    for (let s = 0; s < segments; s += 1) {
      // Segment 0 is the one nearest the body: it covers the last ARC_SUBSTEPS steps of the centre line.
      const headPoint = points - 1 - s * ARC_SUBSTEPS;
      for (let j = 0; j <= ARC_SUBSTEPS; j += 1) {
        const k = headPoint - ARC_SUBSTEPS + j;
        const base = (s * (ARC_SUBSTEPS + 1) + j) * 2;
        for (let m = 0; m < 3; m += 1) {
          out[3 * base + m] = c[3 * k + m] - side[3 * k + m];
          out[3 * (base + 1) + m] = c[3 * k + m] + side[3 * k + m];
        }
      }
    }
  }

  /** The arc's vertex opacities: each segment's own level, brightened a little as the camera pulls back. */
  #paintArc(): void {
    const look = this.#look;
    if (look === null || this.#arcColours === null) return;
    const boost = look.zoomOn ? this.#zoom * look.zoomBoostArc : 0;
    for (let s = 0; s < this.#arcBase.length; s += 1) {
      const alpha = Math.min(1, this.#arcBase[s] + boost);
      for (let v = 0; v < (ARC_SUBSTEPS + 1) * 2; v += 1) this.#arcColours.setW(s * (ARC_SUBSTEPS + 1) * 2 + v, alpha);
    }
    this.#arcColours.needsUpdate = true;
  }

  /** Segment opacities of the arc as drawn, nearest the body first (diagnostic). */
  get arcSegmentOpacities(): readonly number[] {
    const colours = this.#arcColours;
    return colours === null ? [] : Array.from(this.#arcBase, (_, s) => colours.getW(s * (ARC_SUBSTEPS + 1) * 2));
  }

  /** The arc's centre line in scaled absolute positions, oldest first, 3 per point (diagnostic). */
  get arcPointsAbsolute(): Float64Array {
    return this.#arcScaled === null ? new Float64Array(0) : this.#arcScaled.subarray(0, 3 * this.#arcPoints);
  }

  /** Full width of the ribbon in scaled units, read from its first two vertices after `place` (diagnostic). */
  get arcRibbonWidth(): number {
    const r = this.#ribbonScaled;
    return r === null ? 0 : Math.hypot(r[3] - r[0], r[4] - r[1], r[5] - r[2]);
  }

  /** Longest step of the arc's centre line in scaled units. Diagnostic: a chord to a stale point would show here. */
  arcLongestSegment(): number {
    const c = this.#arcScaled;
    if (c === null) return 0;
    let longest = 0;
    for (let k = 1; k < this.#arcPoints; k += 1) longest = Math.max(longest, Math.hypot(c[3 * k] - c[3 * k - 3], c[3 * k + 1] - c[3 * k - 2], c[3 * k + 2] - c[3 * k - 1]));
    return longest;
  }

  /** The times the arc's points were sampled at, oldest first; the last is the clock. */
  get arcTimesUtcMs(): readonly number[] {
    return this.#arcTimes;
  }

  /** Scaled absolute position of the arc's head (the last vertex drawn), or null with no arc yet. Diagnostic: it is where the body is. */
  arcHeadAbsolute(): RenderVector | null {
    if (this.#arcScaled === null || this.#arcPoints === 0) return null;
    const i = 3 * (this.#arcPoints - 1);
    return [this.#arcScaled[i], this.#arcScaled[i + 1], this.#arcScaled[i + 2]];
  }

  /** The look this path was built with (its data), which live controls start from and reset to; null for a plain line. */
  get defaultLook(): OrbitLook | null {
    return this.#defaultLook;
  }

  /** The orbit look now in force, or null for a plain line. */
  get look(): OrbitLook | null {
    return this.#look;
  }

  /** Applies a look live: layers switch and opacities change at once (the shapes follow in `sync`). Ignored for a plain line. */
  setLook(look: OrbitLook): void {
    if (this.#ring === null || this.#arc === null) return;
    this.#look = look;
    this.#ring.visible = look.baseOn;
    this.#arc.visible = look.arcOn;
    this.#applyOpacity();
  }

  /** A path with an orbit look resamples at once, unthrottled, when the clock leaves the window or moves more than `ringRefresh` of it: a load, a seek or fast playback never draws a stale ring. */
  #ringStale(windowMs: number, timeUtcMs: number): boolean {
    if (this.#look === null || this.#windowCentre === null || this.#times.length === 0) return false;
    const outside = timeUtcMs < this.#times[0] || timeUtcMs > this.#times[this.#times.length - 1];
    return outside || Math.abs(timeUtcMs - this.#windowCentre) > this.#look.ringRefresh * windowMs;
  }

  /** The zoom-out brightening, 0 close in to 1 at `zoomFarRatio` orbit sizes away; moved by `place` with the camera. */
  #zoom = 0;

  #applyOpacity(): void {
    const look = this.#look;
    if (look === null || this.#ring === null || this.#arc === null) return;
    const sf = look.zoomOn ? this.#zoom : 0;
    (this.#ring.material as LineBasicMaterial).opacity = Math.min(1, look.baseOpacity + sf * look.zoomBoostBase);
    this.#paintArc();
  }

  get id(): string {
    return this.layer.object.id;
  }

  /** Whether this path is a long eccentric orbit, framed to fit whole rather than by the usual multiple of its extent. */
  get fitsWhole(): boolean {
    return this.layer.sampling !== undefined;
  }

  /** The samples as the source gave them (km, EQJ, about the centre they are measured from), 3 per vertex. */
  get samplesKm(): Float64Array {
    return this.#samplesKm;
  }

  /** The sample times, in order. */
  get timesUtcMs(): readonly number[] {
    return this.#times;
  }

  /** Farthest sample from the centre it is measured about, in km. */
  get maxRadiusKm(): number {
    return this.#maxRadiusKm;
  }

  /** The centre the samples are measured about; undefined until a rolling span has been sampled. */
  get frame(): CenterId | undefined {
    return this.#frame;
  }

  #resample(times: readonly number[]): void {
    const first = this.layer.source.stateAt(times[0], this.#explicitCentre);
    this.#frame = first.center;
    this.#times = times;
    this.#samplesKm = samplePositionsKm(this.layer.source, times, this.#explicitCentre);
    let radius = 0;
    for (let i = 0; i < this.#samplesKm.length; i += 3) {
      radius = Math.max(radius, Math.hypot(this.#samplesKm[i], this.#samplesKm[i + 1], this.#samplesKm[i + 2]));
    }
    this.#maxRadiusKm = radius;
    this.#version += 1;
    this.#cache = null;
  }

  /** The vertices (km, EQJ) from the scene centre for the clock time, by this path's rule. */
  #vertexKm(placement: ScenePlacement, timeUtcMs: number): Float64Array {
    const layer = this.layer;
    const frame = this.#frame!;
    if (layer.kind === "orbit") return orbitKm(this.#samplesKm, frame, placement, timeUtcMs);
    const samples = { timesUtcMs: this.#times, positionsKm: this.#samplesKm };
    if (layer.frame === "relative") {
      // The relative trail depends on the scene centre only: shifted once per centre, not per frame.
      const key = `${this.#version}:${placement.center}`;
      if (this.#cache === null || this.#cache.key !== key || this.#cache.resolver !== placement.resolver) {
        this.#cache = { key, resolver: placement.resolver, km: relativeTrailKm(samples, frame, placement) };
      }
      return this.#cache.km;
    }
    // The inertial trail's root-frame samples depend on neither the centre nor the clock: computed once per sampling.
    const key = `${this.#version}:root`;
    if (this.#cache === null || this.#cache.key !== key || this.#cache.resolver !== placement.resolver) {
      this.#cache = { key, resolver: placement.resolver, km: rootFrameKm(samples, frame, placement) };
    }
    return inertialTrailKm(this.#cache.km, placement, timeUtcMs);
  }

  sync(timeUtcMs: number, placement: ScenePlacement, policy: ScalePolicy, realNowMs: number = performance.now()): void {
    const span = this.layer.span;
    if (isRollingSpan(span) && (this.#ringStale(span.windowMs, timeUtcMs) || pathNeedsRefresh(this.#windowCentre, span.windowMs, timeUtcMs, realNowMs, this.#builtRealMs, this.#refresh))) {
      this.#resample(windowTimesUtcMs(timeUtcMs, span.windowMs, this.#capacity));
      this.#windowCentre = timeUtcMs;
      this.#builtRealMs = realNowMs;
    }
    const km = this.#vertexKm(placement, timeUtcMs);
    this.#scaled.set(eqjMapped(km, policy));
    let cx = 0;
    let cy = 0;
    let cz = 0;
    const count = km.length / 3;
    for (let i = 0; i < km.length; i += 3) {
      cx += km[i];
      cy += km[i + 1];
      cz += km[i + 2];
    }
    this.#centreKm = this.layer.sampling === undefined ? [cx / count, cy / count, cz / count] : boundsMidpoint(km);
    let widest = 0;
    for (let i = 0; i < km.length; i += 3) {
      widest = Math.max(widest, Math.hypot(km[i] - this.#centreKm[0], km[i + 1] - this.#centreKm[1], km[i + 2] - this.#centreKm[2]));
    }
    this.#extentKm = widest;
    this.#extentScaled = scaleLength(policy, widest);
    this.#centre = eqjToRenderVector(policy.mapPosition(this.#centreKm));
    this.#updateLook(timeUtcMs, placement, policy);
  }

  place(origin: FloatingOrigin, screen?: PathScreen): void {
    const [ox, oy, oz] = origin.scaledCameraOrigin;
    if (this.#look !== null && this.#extentScaled > 0) {
      const distance = Math.hypot(this.#centre[0] - ox, this.#centre[1] - oy, this.#centre[2] - oz);
      const far = this.#look.zoomFarRatio;
      this.#zoom = Math.max(0, Math.min(1, (distance / this.#extentScaled - 1) / (far - 1)));
      this.#applyOpacity();
    }
    const out = this.#positions.array as Float32Array;
    for (let i = 0; i < out.length; i += 3) {
      out[i] = this.#scaled[i] - ox;
      out[i + 1] = this.#scaled[i + 1] - oy;
      out[i + 2] = this.#scaled[i + 2] - oz;
    }
    this.#positions.needsUpdate = true;
    if (this.#ribbonScaled !== null && this.#arcPositions !== null) {
      this.#buildRibbon(origin.scaledCameraOrigin, screen);
      const arcOut = this.#arcPositions.array as Float32Array;
      for (let i = 0; i < arcOut.length; i += 3) {
        arcOut[i] = this.#ribbonScaled[i] - ox;
        arcOut[i + 1] = this.#ribbonScaled[i + 1] - oy;
        arcOut[i + 2] = this.#ribbonScaled[i + 2] - oz;
      }
      this.#arcPositions.needsUpdate = true;
    }
  }

  /**
   * Diagnostic for the browser checks: whether the line is drawn, its vertex count, how many vertices are in front of the camera and inside the
   * view, and the box they cover as shares of the view (0 to 1, y down). It reads the vertices as last placed and the camera's current matrices,
   * so it describes the line itself, never its label.
   */
  screenReadout(camera: Camera): PathScreenReadout {
    const line = this.#line;
    const count = this.#capacity;
    const visible = line !== null && line.visible && this.group.visible && (this.#ring === null || this.#ring.visible);
    const a = this.#positions.array;
    camera.updateMatrixWorld();
    const point = new Vector3();
    let inView = 0;
    let [minX, maxX, minY, maxY] = [1, 0, 1, 0];
    for (let i = 0; i < count; i += 1) {
      point.set(a[3 * i], a[3 * i + 1], a[3 * i + 2]).applyMatrix4(camera.matrixWorldInverse);
      if (point.z >= 0) continue;
      point.applyMatrix4(camera.projectionMatrix);
      if (Math.abs(point.x) > 1 || Math.abs(point.y) > 1) continue;
      const x = (point.x + 1) / 2;
      const y = (1 - point.y) / 2;
      inView += 1;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    return { id: this.id, visible, vertices: count, inView, minX, maxX, minY, maxY };
  }

  /** The centre of the drawn line, so a focused path sits in the middle of the view. */
  absolute(): RenderVector {
    return this.#centre;
  }

  /** The first vertex: always on the line, so the label never floats in empty space. */
  labelAnchor(): RenderVector {
    return [this.#scaled[0], this.#scaled[1], this.#scaled[2]];
  }

  /** Scaled distance from the focus point that frames the whole line. */
  extentUnits(policy: ScalePolicy): number {
    return scaleLength(policy, this.#extentKm);
  }

  /** Scaled absolute position of vertex `index` as last synced. */
  vertexAbsolute(index: number): RenderVector {
    return [this.#scaled[3 * index], this.#scaled[3 * index + 1], this.#scaled[3 * index + 2]];
  }

  /** Local (floating-origin) position of vertex `index` as last placed. */
  vertexLocal(index: number): [number, number, number] {
    const a = this.#positions.array;
    return [a[3 * index], a[3 * index + 1], a[3 * index + 2]];
  }
}

/**
 * The middle of the box that holds every vertex. A highly eccentric orbit's vertices crowd at one end (the mean of them sits near the
 * sharp end, not in the middle of the line), so a path spaced by eccentric anomaly is centred by its extremes and framed whole.
 */
function boundsMidpoint(km: Float64Array): [number, number, number] {
  const low = [Infinity, Infinity, Infinity];
  const high = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < km.length; i += 3) {
    for (let k = 0; k < 3; k += 1) {
      low[k] = Math.min(low[k], km[i + k]);
      high[k] = Math.max(high[k], km[i + k]);
    }
  }
  return [(low[0] + high[0]) / 2, (low[1] + high[1]) / 2, (low[2] + high[2]) / 2];
}

/** Physical positions (km, EQJ) -> ScalePolicy -> render axes, 3 per vertex, in Float64. */
function eqjMapped(km: Float64Array, policy: ScalePolicy): Float64Array {
  const mapped = mapPathKm(km, policy);
  for (let i = 0; i < mapped.length; i += 3) {
    const render = eqjToRenderVector([mapped[i], mapped[i + 1], mapped[i + 2]]);
    mapped[i] = render[0];
    mapped[i + 1] = render[1];
    mapped[i + 2] = render[2];
  }
  return mapped;
}

/** The distance in km from each path's centre to its farthest vertex, over every path: what a view of the Sun frames. */
export function pathReachKm(views: readonly PathView[]): number {
  return Math.max(0, ...views.map((view) => view.maxRadiusKm));
}

/** Builds the views for the declared paths. */
export function createPathViews(paths: readonly PathLayer[]): readonly PathView[] {
  return paths.map((layer) => new PathView(layer));
}

/** How the Moon-style composition orbit looks: the quiet, occludable line the Earth-Moon scene has always drawn, on the scene's own layer. */
/** The camera's vertical field of view and the viewport's height, so the arc's width can be capped in pixels. */
export interface PathScreen {
  readonly fovDeg: number;
  readonly viewportHeightPx: number;
}

export const COMPOSITION_PATH_STYLE: PathStyle = Object.freeze({ opacity: 0.45, depthTest: true, layer: 0, renderOrder: 0 });

/**
 * A composition's declared path as an orbit layer: the body's positions about its parent from the resolver, over a window about the
 * clock, carried with the parent.
 */
export function compositionPathLayer(path: CompositionPath, resolver: StateResolver): PathLayer {
  const parent = catalogue.get(path.body).definition.parentId;
  if (parent === undefined) throw new RangeError(`path body "${path.body}" has no parent to orbit`);
  const source: Trajectory = { body: path.body, stateAt: (timeUtcMs, center = parent) => resolver.stateOf(path.body, timeUtcMs, center) };
  return {
    kind: "orbit",
    center: parent,
    color: "#f0e6da",
    source,
    span: { windowMs: path.spanMs },
    ...(path.samples === undefined ? {} : { samples: path.samples }),
    // Orbit labels are off by default in every demo (owner, 2026-10-18); switchable under labels.
    object: { id: `${path.body}-orbit`, label: `${path.body} orbit`, showLabel: false },
  };
}

/** A composition path drawn with its orbit look (the path's own settings over the defaults), on the scene's own layer. */
export function compositionPathView(path: CompositionPath, resolver: StateResolver): PathView {
  return new PathView(compositionPathLayer(path, resolver), { ...COMPOSITION_PATH_STYLE, orbitLook: resolveOrbitLook(path.look, `path for "${path.body}"`) });
}
