import { BufferAttribute, BufferGeometry, Group, Line, LineBasicMaterial } from "three";
import type { CenterId } from "../core/body";
import type { ScalePolicy } from "../core/scalePolicy";
import { pathTimesUtcMs, samplePositionsKm, windowTimesUtcMs } from "../core/sunCentredSources";
import type { StateResolver } from "../core/stateResolver";
import type { Trajectory } from "../core/trajectory";
import { catalogue } from "../assets/catalogue";
import type { CompositionPath } from "../assets/compositions";
import {
  DEFAULT_PATH_SAMPLE_COUNT,
  DEFAULT_WINDOW_SAMPLE_COUNT,
  isRollingSpan,
  validatePathSpec,
  type PathLayer,
} from "./experienceDefinition";
import type { FloatingOrigin } from "./floatingOrigin";
import { inertialTrailKm, mapPathKm, orbitKm, pathNeedsRefresh, relativeTrailKm, rootFrameKm, type PathRefreshPolicy, DEFAULT_PATH_REFRESH } from "./pathRules";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import type { ScenePlacement } from "./sceneLayout";
import { TRACK_LAYER } from "./TrackedBodyView";

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

  constructor(readonly layer: PathLayer, style: PathStyle = {}, refresh: PathRefreshPolicy = DEFAULT_PATH_REFRESH) {
    validatePathSpec(layer.object?.id ?? "path", layer);
    this.#refresh = refresh;
    this.#explicitCentre = layer.kind === "orbit" ? layer.center : undefined;
    const rolling = isRollingSpan(layer.span);
    this.#capacity = layer.samples ?? (rolling ? DEFAULT_WINDOW_SAMPLE_COUNT : DEFAULT_PATH_SAMPLE_COUNT);
    this.#scaled = new Float64Array(this.#capacity * 3);
    if (!isRollingSpan(layer.span)) this.#resample(pathTimesUtcMs(layer.span, this.#capacity));
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
  }

  get id(): string {
    return this.layer.object.id;
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
    if (isRollingSpan(span) && pathNeedsRefresh(this.#windowCentre, span.windowMs, timeUtcMs, realNowMs, this.#builtRealMs, this.#refresh)) {
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
    this.#centreKm = [cx / count, cy / count, cz / count];
    let widest = 0;
    for (let i = 0; i < km.length; i += 3) {
      widest = Math.max(widest, Math.hypot(km[i] - this.#centreKm[0], km[i + 1] - this.#centreKm[1], km[i + 2] - this.#centreKm[2]));
    }
    this.#extentKm = widest;
    this.#centre = eqjToRenderVector(policy.mapPosition(this.#centreKm));
  }

  place(origin: FloatingOrigin): void {
    const [ox, oy, oz] = origin.scaledCameraOrigin;
    const out = this.#positions.array as Float32Array;
    for (let i = 0; i < out.length; i += 3) {
      out[i] = this.#scaled[i] - ox;
      out[i + 1] = this.#scaled[i + 1] - oy;
      out[i + 2] = this.#scaled[i + 2] - oz;
    }
    this.#positions.needsUpdate = true;
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
    object: { id: `${path.body}-orbit`, label: `${path.body} orbit` },
  };
}
