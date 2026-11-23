import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Vector3,
  type Camera,
  type PerspectiveCamera,
} from "three";
import { disposeOwned } from "./disposeOwned";
import type { CenterId } from "../core/body";
import type { ScalePolicy } from "../presentation/scalePolicy";
import {
  eccentricAnomalyFromMean,
  eccentricPathTimesUtcMs,
  pathTimesUtcMs,
  samplePositionsKm,
  windowTimesUtcMs,
  type EccentricSampling,
} from "../core/sunCentredSources";
import type { StateResolver } from "../core/stateResolver";
import type { Trajectory } from "../core/trajectory";
import { catalogue as builtInCatalogue, type BodyCatalogue } from "../assets/catalogue";
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
import {
  arcSegmentAlpha,
  inertialTrailKm,
  mapPathKm,
  ringAlpha,
  windowEdgeAlpha,
  orbitKm,
  pathNeedsRefresh,
  relativeTrailKm,
  rootFrameKm,
  type PathRefreshPolicy,
  DEFAULT_PATH_REFRESH,
} from "./pathRules";
import {
  eccentricTurnTimes,
  fineTimeMs,
  HEAD_BUDGET,
  HEAD_REACH,
  headByNearness,
  HEAD_SUBSTEPS,
  headAbout,
  mergedLineTimes,
  outsideMiddleHalf,
  turnGridTimes,
} from "./orbitLineRule";
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
  /** The box the drawn line itself covers in the view, shares of the view: the segments between vertices are clipped to the view, so a line with no vertex in view still reads; each segment is clipped to the view exactly; min above max when no part of it is in view. */
  readonly lineMinX: number;
  readonly lineMaxX: number;
  readonly lineMinY: number;
  readonly lineMaxY: number;
  /** Angle of the in-view vertices' major axis from horizontal, in degrees (-90 to 90; screen y points down, so a line rising to the right reads negative); 0 when fewer than 3 are in view. The view's aspect (width over height) is applied, so it is the angle on the screen. */
  readonly axisDeg: number;
  /** The view's width over its height, to turn the shares above into pixel proportions. */
  readonly aspect: number;
  /** The orbit look in force as drawn (null for a plain line): which layers are shown, the ring's opacity now (zoom brightening included) and the arc's peak opacity. */
  readonly look: {
    readonly ring: boolean;
    readonly arc: boolean;
    readonly endFade: boolean;
    readonly zoomBrighten: boolean;
    readonly ringOpacity: number;
    readonly arcPeak: number;
  } | null;
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
 * The box (as shares of the view, y down) covered by the line between the vertices: each segment whose ends are both in front of the camera is a
 * straight line on the screen, clipped to the view (Liang-Barsky). Returns [minX, maxX, minY, maxY]; the empty box is [1, 0, 1, 0].
 */
function clippedLineBox(a: ArrayLike<number>, count: number, camera: Camera): [number, number, number, number] {
  let [lineMinX, lineMaxX, lineMinY, lineMaxY] = [1, 0, 1, 0];
  const from = new Vector3();
  const to = new Vector3();
  for (let i = 0; i + 1 < count; i += 1) {
    from.set(a[3 * i], a[3 * i + 1], a[3 * i + 2]).applyMatrix4(camera.matrixWorldInverse);
    to.set(a[3 * i + 3], a[3 * i + 4], a[3 * i + 5]).applyMatrix4(camera.matrixWorldInverse);
    if (from.z >= 0 || to.z >= 0) continue;
    from.applyMatrix4(camera.projectionMatrix);
    to.applyMatrix4(camera.projectionMatrix);
    const [dx, dy] = [to.x - from.x, to.y - from.y];
    let [t0, t1] = [0, 1];
    for (const [p, q] of [
      [-dx, from.x + 1],
      [dx, 1 - from.x],
      [-dy, from.y + 1],
      [dy, 1 - from.y],
    ]) {
      if (p === 0) {
        if (q < 0) {
          t0 = 2;
          break;
        }
        continue;
      }
      const r = q / p;
      if (p < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
    }
    if (t0 > t1) continue;
    for (const t of [t0, t1]) {
      const x = (from.x + t * dx + 1) / 2;
      const y = (1 - (from.y + t * dy)) / 2;
      lineMinX = Math.min(lineMinX, x);
      lineMaxX = Math.max(lineMaxX, x);
      lineMinY = Math.min(lineMinY, y);
      lineMaxY = Math.max(lineMaxY, y);
    }
  }
  return [lineMinX, lineMaxX, lineMinY, lineMaxY];
}

/**
 * A path: a state source sampled over a span and drawn by one of three rules (`orbit`, relative `trail`, inertial `trail`; see
 * `pathRules.ts`). Each frame the vertices are expressed from the scene centre by the rule, then go through
 * ScalePolicy -> render axes -> floating origin like every other body. A rolling span is resampled around the clock time.
 */
export class PathView {
  readonly group = new Group();
  readonly #capacity: number;
  /** Whether this line follows the turn rule (`orbitLineRule.ts`): a rolling orbit window, or a fixed-span orbit marked `turn`. */
  readonly #ruled: boolean;
  /** Vertices the buffers hold: the far samples plus, for an orbit line, the head and the live point. */
  readonly #vertexCapacity: number;
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
  /** The inputs of the last full `sync`; null when it must run again. */
  #synced: { t: number; center: CenterId; resolver: StateResolver; policy: ScalePolicy } | null = null;
  /** Set by a full `sync`, cleared by the `place` that uploads it; `#placedAt` is that upload's origin and screen. */
  #fresh = true;
  #placedAt: readonly number[] = [];
  /** An orbit line's source and sampling now (an osculating fallback's are re-fitted at the display time when the turn is re-sampled). */
  #turnSource: Trajectory;
  #turnSampling: EccentricSampling | undefined;
  /** The turn-grid step a failed re-sample was tried at, so it is not tried again until the display time reaches another step. */
  #turnHeldAt: number | null = null;
  /** The head's fine points (km, about the explicit centre) by fine index, for the source they were taken from; null where the source has no position. */
  #head = new Map<number, Float64Array | null>();
  #headKey = "";
  #headSource: Trajectory | null = null;
  #headAt = Number.NaN;
  /** The drawn line: times and positions (km) in order, and which of them are far samples (for the centre, extent and end fade). */
  #drawnTimes: readonly number[] = [];
  #drawnKm: Float64Array = new Float64Array(0);
  #drawnFar: readonly number[] = [];
  /** Vertices drawn now. */
  #count = 0;

  constructor(
    readonly layer: PathLayer,
    style: PathStyle = {},
    refresh: PathRefreshPolicy = DEFAULT_PATH_REFRESH,
  ) {
    validatePathSpec(layer.object?.id ?? "path", layer);
    this.#refresh = refresh;
    this.#explicitCentre = layer.kind === "orbit" ? layer.center : undefined;
    const rolling = isRollingSpan(layer.span);
    this.#capacity =
      layer.samples ??
      (rolling
        ? DEFAULT_WINDOW_SAMPLE_COUNT
        : layer.sampling === undefined
          ? DEFAULT_PATH_SAMPLE_COUNT
          : DEFAULT_ECCENTRIC_SAMPLE_COUNT);
    this.#ruled = layer.kind === "orbit" && (rolling || layer.turn !== undefined);
    this.#vertexCapacity = this.#capacity + (this.#ruled ? 2 * HEAD_REACH + 3 : 0);
    this.#scaled = new Float64Array(this.#vertexCapacity * 3);
    this.#turnSource = layer.source;
    this.#turnSampling = layer.sampling;
    this.#sampleOpening();
    const geometry = new BufferGeometry();
    this.#positions = new BufferAttribute(new Float32Array(this.#vertexCapacity * 3), 3);
    geometry.setAttribute("position", this.#positions);
    const line = new Line(
      geometry,
      new LineBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: style.opacity ?? 0.7,
        depthTest: style.depthTest ?? false,
      }),
    );
    line.frustumCulled = false;
    line.layers.set(style.layer ?? TRACK_LAYER);
    // Overlays are drawn after the data dots they cross, so a belt cannot swallow the line (I-020).
    line.renderOrder = style.renderOrder ?? 1;
    this.group.add(line);
    this.#line = line;
    if (style.orbitLook !== undefined && rolling) this.#addLookLayers(geometry, line, style.orbitLook);
  }

  /** A fixed span's first samples: the span as given, or for a turn-ruled orbit one turn about the span's start (the opening time) until the first sync. */
  #sampleOpening(): void {
    const layer = this.layer;
    if (isRollingSpan(layer.span)) return;
    const span = layer.span;
    const opening = (): number[] =>
      layer.sampling === undefined
        ? pathTimesUtcMs(span, this.#capacity)
        : eccentricPathTimesUtcMs(span, this.#capacity, layer.sampling);
    // An orbit line is one turn about the display time; until the first sync, about the span's start (the opening time).
    if (!this.#ruled || !this.#resampleTurn(span.startUtcMs, false)) this.#resample(opening());
  }

  /** Frees the GPU copies of the line and, with the orbit look, the arc; the arrays stay, so drawing again uploads afresh. */
  dispose(): void {
    disposeOwned(this.group);
  }

  /** The ring is the line already built (vertex colours carry the end fade); the arc is its own short line from the recent samples to the body's live position. */
  #addLookLayers(geometry: BufferGeometry, ring: Line, look: OrbitLook): void {
    const n = this.#vertexCapacity;
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
    const arcMaterial = new MeshBasicMaterial({
      vertexColors: true,
      color: ringMaterial.color.clone(),
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      depthTest: ringMaterial.depthTest,
    });
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
    if (
      look === null ||
      this.#ringColours === null ||
      this.#arcColours === null ||
      this.#arcScaled === null ||
      this.#arcPositions === null ||
      this.#arc === null ||
      !isRollingSpan(span) ||
      this.#frame === undefined
    )
      return;
    const times = this.#drawnTimes;
    const n = times.length;
    const far = this.#times;
    const [first, last] = [far[0], far[far.length - 1]];
    const arcMs = look.arcFraction * span.windowMs;
    for (let i = 0; i < n; i += 1) {
      // The ring runs under the arc, as Planetary Explorer's OrbitalTrail does under its OrbitalTrailArc: seen edge-on the flat arc thins
      // away and the ring's one-pixel line still carries the orbit. A head point between far samples takes the edge fade of its place in time.
      const place =
        this.#drawnFar[i] >= 0 ? this.#drawnFar[i] : ((times[i] - first) / (last - first)) * (far.length - 1);
      const alpha = look.endFadeOn
        ? ringAlpha(timeUtcMs, times[i], span.windowMs, look.endFade) * windowEdgeAlpha(place, far.length, look.endFade)
        : 1;
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
    this.#arcBase = Float32Array.from({ length: segments }, (_, i) =>
      arcSegmentAlpha(i, segments, look.arcPeak, look.arcExponent),
    );
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
    const perPx =
      screen === undefined ? Infinity : (2 * Math.tan((screen.fovDeg * Math.PI) / 360)) / screen.viewportHeightPx;
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
    for (let k = 1; k < this.#arcPoints; k += 1)
      longest = Math.max(
        longest,
        Math.hypot(c[3 * k] - c[3 * k - 3], c[3 * k + 1] - c[3 * k - 2], c[3 * k + 2] - c[3 * k - 1]),
      );
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

  /** Recolours the line (ring and arc) live, e.g. to its family's colour; the opacities are unchanged. */
  setColor(color: string): void {
    const ring = this.group.children[0] as Line;
    const material = ring.material as LineBasicMaterial;
    if (material.userData.color === color) return;
    material.userData.color = color;
    material.color.set(color);
    if (this.#arc !== null) (this.#arc.material as MeshBasicMaterial).color.set(color);
  }

  /** Applies a look live: layers switch and opacities change at once (the shapes follow in `sync`). Ignored for a plain line. */
  setLook(look: OrbitLook): void {
    if (this.#ring === null || this.#arc === null) return;
    const now = this.#look;
    if (now !== null && (Object.keys(look) as (keyof OrbitLook)[]).every((k) => look[k] === now[k])) return;
    this.#look = look;
    this.#synced = null;
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

  #resample(times: readonly number[], source: Trajectory = this.layer.source): void {
    const first = source.stateAt(times[0], this.#explicitCentre);
    const samplesKm = samplePositionsKm(source, times, this.#explicitCentre);
    this.#frame = first.center;
    this.#times = times;
    this.#samplesKm = samplesKm;
    let radius = 0;
    for (let i = 0; i < this.#samplesKm.length; i += 3) {
      radius = Math.max(radius, Math.hypot(this.#samplesKm[i], this.#samplesKm[i + 1], this.#samplesKm[i + 2]));
    }
    this.#maxRadiusKm = radius;
    this.#version += 1;
    this.#cache = null;
  }

  /** An orbit line's far step: its turn (or window) over the sample count, in ms (a turn by eccentric anomaly by its mean step). */
  #turnStepMs(): number {
    const span = this.layer.span;
    const turnMs = isRollingSpan(span)
      ? span.windowMs
      : this.#turnSampling !== undefined
        ? this.#turnSampling.periodMs
        : span.endUtcMs - span.startUtcMs;
    return turnMs / (this.#capacity - 1);
  }

  /**
   * Samples one turn on the fixed grid about `displayMs` (an osculating fallback re-fitted there first when `refit`). Returns false, keeping
   * the line as it was, when the source does not cover that turn.
   */
  #resampleTurn(displayMs: number, refit: boolean): boolean {
    const layer = this.layer;
    let source = this.#turnSource;
    let sampling = this.#turnSampling;
    try {
      const fit = refit ? layer.turn?.reosculate?.(displayMs) : undefined;
      if (fit !== undefined) ({ source, sampling } = fit);
      const span = layer.span;
      const n = this.#capacity;
      const times = isRollingSpan(span)
        ? turnGridTimes(displayMs, span.windowMs, n)
        : sampling !== undefined
          ? eccentricTurnTimes(displayMs, sampling, n, eccentricAnomalyFromMean)
          : turnGridTimes(displayMs, span.endUtcMs - span.startUtcMs, n);
      // The ends first: a source that does not cover the turn fails at once, not after most of it.
      source.stateAt(times[0], this.#explicitCentre);
      source.stateAt(times[n - 1], this.#explicitCentre);
      this.#resample(times, source);
    } catch (error) {
      if (error instanceof RangeError) return false;
      throw error;
    }
    this.#turnSource = source;
    this.#turnSampling = sampling;
    return true;
  }

  /** The line's source position (km, about the explicit centre) at a time, or null where the source has none. */
  #positionAt(timeUtcMs: number): Float64Array | null {
    try {
      return Float64Array.from(this.#turnSource.stateAt(timeUtcMs, this.#explicitCentre).positionKm);
    } catch (error) {
      if (error instanceof RangeError) return null;
      throw error;
    }
  }

  /**
   * An orbit line as drawn: the far turn, the head's fine grid points about the display time (each taken once, nearest the display time first,
   * at most `HEAD_BUDGET` a frame) and the body's live place, merged in time order. Once the head is filled, one source evaluation per changed
   * frame: the live place.
   */
  #assembleLine(timeUtcMs: number): void {
    const fineMs = this.#turnStepMs() / HEAD_SUBSTEPS;
    const key = `${fineMs}`;
    if (this.#headKey !== key || this.#headSource !== this.#turnSource) {
      this.#head.clear();
      this.#headKey = key;
      this.#headSource = this.#turnSource;
    }
    const { from, to } = headAbout(timeUtcMs, fineMs, HEAD_REACH);
    for (const j of this.#head.keys()) if (j < from || j > to) this.#head.delete(j);
    // A re-sync at the same display time (a new centre, scale or look) takes no new points, so it draws what a fresh view would.
    let budget = timeUtcMs === this.#headAt ? 0 : HEAD_BUDGET;
    this.#headAt = timeUtcMs;
    for (const j of headByNearness(timeUtcMs, fineMs, from, to)) {
      if (budget === 0) break;
      if (this.#head.has(j)) continue;
      this.#head.set(j, this.#positionAt(fineTimeMs(j, fineMs)));
      budget -= 1;
    }
    const headTimes: number[] = [];
    const headKm = new Map<number, Float64Array>();
    for (let j = from; j <= to; j += 1) {
      const t = fineTimeMs(j, fineMs);
      const km = this.#head.get(j);
      if (km === null || km === undefined) continue;
      headTimes.push(t);
      headKm.set(t, km);
    }
    const live = this.#positionAt(timeUtcMs);
    if (live !== null) headKm.set(timeUtcMs, live);
    const { times, farIndex } = mergedLineTimes(this.#times, headTimes, live === null ? null : timeUtcMs);
    const out = new Float64Array(3 * times.length);
    times.forEach((t, i) => {
      const f = farIndex[i];
      out.set(f >= 0 ? this.#samplesKm.subarray(3 * f, 3 * f + 3) : headKm.get(t)!, 3 * i);
    });
    this.#drawnTimes = times;
    this.#drawnKm = out;
    this.#drawnFar = farIndex;
  }

  /** The vertices (km, EQJ) from the scene centre for the clock time, by this path's rule. */
  #vertexKm(placement: ScenePlacement, timeUtcMs: number): Float64Array {
    const layer = this.layer;
    const frame = this.#frame!;
    if (layer.kind === "orbit")
      return orbitKm(this.#ruled ? this.#drawnKm : this.#samplesKm, frame, placement, timeUtcMs);
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

  /** The re-sample stage: a rolling window when it is stale, an orbit's turn when the display time leaves its middle half. */
  #resampleIfDue(timeUtcMs: number, realNowMs: number): void {
    const span = this.layer.span;
    const orbit = this.#ruled;
    if (
      isRollingSpan(span) &&
      (this.#ringStale(span.windowMs, timeUtcMs) ||
        pathNeedsRefresh(this.#windowCentre, span.windowMs, timeUtcMs, realNowMs, this.#builtRealMs, this.#refresh))
    ) {
      // An orbit's window sits on the fixed grid (its points do not move when it is re-sampled); a trail's is centred on the clock.
      if (!orbit || !this.#resampleTurn(timeUtcMs, false))
        this.#resample(windowTimesUtcMs(timeUtcMs, span.windowMs, this.#capacity));
      this.#windowCentre = timeUtcMs;
      this.#builtRealMs = realNowMs;
      this.#synced = null;
    } else if (orbit && !isRollingSpan(span) && outsideMiddleHalf(timeUtcMs, this.#times[0], this.#times.at(-1)!)) {
      // A whole turn about the display time, re-sampled (an osculating ellipse re-fitted) when the display time leaves its middle half.
      const at = Math.round(timeUtcMs / this.#turnStepMs());
      if (this.#turnHeldAt !== at) {
        this.#turnHeldAt = this.#resampleTurn(timeUtcMs, true) ? null : at;
        this.#synced = null;
      }
    }
  }

  sync(timeUtcMs: number, placement: ScenePlacement, policy: ScalePolicy, realNowMs: number = performance.now()): void {
    const orbit = this.#ruled;
    this.#resampleIfDue(timeUtcMs, realNowMs);
    const was = this.#synced;
    if (
      was !== null &&
      was.t === timeUtcMs &&
      was.center === placement.center &&
      was.resolver === placement.resolver &&
      was.policy === policy
    )
      return;
    this.#synced = { t: timeUtcMs, center: placement.center, resolver: placement.resolver, policy };
    this.#fresh = true;
    if (orbit) this.#assembleLine(timeUtcMs);
    const drawn = this.#vertexKm(placement, timeUtcMs);
    this.#count = drawn.length / 3;
    this.#scaled.set(eqjMapped(drawn, policy));
    this.#scaled.fill(0, drawn.length);
    this.#line?.geometry.setDrawRange(0, this.#count);
    // The centre and extent are the far samples' alone, so the head does not move the framing.
    const km = orbit ? farOnly(drawn, this.#drawnFar) : drawn;
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
      widest = Math.max(
        widest,
        Math.hypot(km[i] - this.#centreKm[0], km[i + 1] - this.#centreKm[1], km[i + 2] - this.#centreKm[2]),
      );
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
    const at = [ox, oy, oz, screen?.fovDeg ?? -1, screen?.viewportHeightPx ?? -1];
    if (!this.#fresh && at.every((v, i) => v === this.#placedAt[i])) return;
    this.#fresh = false;
    this.#placedAt = at;
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
    const count = this.#count;
    const visible = line !== null && line.visible && this.group.visible && (this.#ring === null || this.#ring.visible);
    const a = this.#positions.array;
    camera.updateMatrixWorld();
    const point = new Vector3();
    let inView = 0;
    let [minX, maxX, minY, maxY] = [1, 0, 1, 0];
    const aspect = (camera as PerspectiveCamera).aspect ?? 1;
    let [sx, sy, sxx, syy, sxy] = [0, 0, 0, 0, 0];
    for (let i = 0; i < count; i += 1) {
      point.set(a[3 * i], a[3 * i + 1], a[3 * i + 2]).applyMatrix4(camera.matrixWorldInverse);
      if (point.z >= 0) continue;
      point.applyMatrix4(camera.projectionMatrix);
      if (Math.abs(point.x) > 1 || Math.abs(point.y) > 1) continue;
      const x = (point.x + 1) / 2;
      const y = (1 - point.y) / 2;
      inView += 1;
      const px = x * aspect;
      sx += px;
      sy += y;
      sxx += px * px;
      syy += y * y;
      sxy += px * y;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const [lineMinX, lineMaxX, lineMinY, lineMaxY] = clippedLineBox(a, count, camera);
    let axisDeg = 0;
    if (inView >= 3) {
      const [mx, my] = [sx / inView, sy / inView];
      axisDeg =
        (0.5 * Math.atan2(2 * (sxy / inView - mx * my), sxx / inView - mx * mx - (syy / inView - my * my)) * 180) /
        Math.PI;
    }
    const look = this.#look;
    const ring = this.#ring;
    const drawnLook =
      look === null || ring === null || this.#arc === null
        ? null
        : {
            ring: ring.visible,
            arc: this.#arc.visible,
            endFade: look.endFadeOn,
            zoomBrighten: look.zoomOn,
            ringOpacity: (ring.material as LineBasicMaterial).opacity,
            arcPeak: look.arcPeak,
          };
    return {
      id: this.id,
      visible,
      vertices: count,
      inView,
      minX,
      maxX,
      minY,
      maxY,
      lineMinX,
      lineMaxX,
      lineMinY,
      lineMaxY,
      axisDeg,
      aspect,
      look: drawnLook,
    };
  }

  /**
   * Diagnostic for the browser checks: the screen distance, as a share of the view's height, from `local` (a point in the floating-origin frame the line
   * is placed in) to the drawn line's nearest segment, over the segments wholly in front of the camera; null when there is none.
   */
  screenGapTo(camera: Camera, local: RenderVector): number | null {
    camera.updateMatrixWorld();
    const aspect = (camera as PerspectiveCamera).aspect ?? 1;
    const toScreen = (x: number, y: number, z: number): [number, number] | null => {
      const v = new Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse);
      if (v.z >= 0) return null;
      v.applyMatrix4(camera.projectionMatrix);
      return [(v.x * aspect) / 2, v.y / 2];
    };
    const target = toScreen(local[0], local[1], local[2]);
    if (target === null) return null;
    const a = this.#positions.array;
    let best: number | null = null;
    let from = toScreen(a[0], a[1], a[2]);
    for (let i = 1; i < this.#count; i += 1) {
      const to = toScreen(a[3 * i], a[3 * i + 1], a[3 * i + 2]);
      if (from !== null && to !== null) {
        const [dx, dy] = [to[0] - from[0], to[1] - from[1]];
        const length2 = dx * dx + dy * dy;
        const t =
          length2 === 0
            ? 0
            : Math.max(0, Math.min(1, ((target[0] - from[0]) * dx + (target[1] - from[1]) * dy) / length2));
        const gap = Math.hypot(target[0] - (from[0] + t * dx), target[1] - (from[1] + t * dy));
        best = best === null ? gap : Math.min(best, gap);
      }
      from = to;
    }
    return best;
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

/** The far samples among an orbit line's drawn vertices (`farIndex` -1 marks a head or live point). */
function farOnly(km: Float64Array, farIndex: readonly number[]): Float64Array {
  const out = new Float64Array(3 * farIndex.filter((f) => f >= 0).length);
  let k = 0;
  farIndex.forEach((f, i) => {
    if (f < 0) return;
    out.set(km.subarray(3 * i, 3 * i + 3), 3 * k);
    k += 1;
  });
  return out;
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

export const COMPOSITION_PATH_STYLE: PathStyle = Object.freeze({
  opacity: 0.45,
  depthTest: true,
  layer: 0,
  renderOrder: 0,
});

/**
 * A composition's declared path as an orbit layer: the body's positions about its parent from the resolver, over a window about the
 * clock, carried with the parent.
 */
export function compositionPathLayer(
  path: CompositionPath,
  resolver: StateResolver,
  bodies: BodyCatalogue = builtInCatalogue,
): PathLayer {
  const parent = bodies.get(path.body).definition.parentId;
  if (parent === undefined) throw new RangeError(`path body "${path.body}" has no parent to orbit`);
  const source: Trajectory = {
    body: path.body,
    stateAt: (timeUtcMs, center = parent) => resolver.stateOf(path.body, timeUtcMs, center),
  };
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
export function compositionPathView(
  path: CompositionPath,
  resolver: StateResolver,
  bodies: BodyCatalogue = builtInCatalogue,
): PathView {
  return new PathView(compositionPathLayer(path, resolver, bodies), {
    ...COMPOSITION_PATH_STYLE,
    orbitLook: resolveOrbitLook(path.look, `path for "${path.body}"`),
  });
}
