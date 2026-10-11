import { BufferAttribute, BufferGeometry, Group, Line, LineBasicMaterial, Points, PointsMaterial } from "three";
import type { AstronomyAdapter } from "../core/astronomyAdapter";
import { sunPositionFromEarthAt } from "../core/referenceCenters";
import type { ScalePolicy } from "../core/scalePolicy";
import { samplePathKm } from "../core/sunCentredSources";
import { DEFAULT_PATH_SAMPLE_COUNT, type PathLayer, type SunBody } from "./experienceDefinition";
import type { FloatingOrigin } from "./floatingOrigin";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import { TRACK_LAYER } from "./TrackedBodyView";

const DEFAULT_SUN_SIZE_PX = 9;

/** What the scene needs from anything drawn here: a focus point, a label anchor, and a size to frame. */
export interface SunCentredItem {
  readonly id: string;
  readonly group: Group;
  sync(timeUtcMs: number, adapter: AstronomyAdapter, policy: ScalePolicy): void;
  place(origin: FloatingOrigin): void;
  /** Scaled absolute point the camera focuses on. */
  absolute(): RenderVector;
  /** Scaled absolute point the label sits at; a point on the line for a path. */
  labelAnchor(): RenderVector;
  /** Scaled distance from the focus point that frames the whole item. */
  extentUnits(policy: ScalePolicy): number;
}

function sunOffsetKm(adapter: AstronomyAdapter, timeUtcMs: number): ArrayLike<number> {
  return sunPositionFromEarthAt(adapter, timeUtcMs).positionKm;
}

const scaleLength = (policy: ScalePolicy, km: number): number => policy.mapPosition([km, 0, 0])[0];

/** The Sun's marker at the Sun's composed Earth-centred position. Drawn size is presentation only. */
export class SunView implements SunCentredItem {
  readonly group = new Group();
  readonly #positions = new BufferAttribute(new Float32Array(3), 3);
  #absolute: RenderVector = [0, 0, 0];
  #frameKm = 0;

  constructor(readonly layer: SunBody) {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", this.#positions);
    const points = new Points(geometry, new PointsMaterial({
      color: layer.color,
      size: layer.markerSizePx ?? DEFAULT_SUN_SIZE_PX,
      sizeAttenuation: false,
      depthTest: false,
    }));
    points.frustumCulled = false;
    points.layers.set(TRACK_LAYER);
    this.group.add(points);
  }

  get id(): string {
    return this.layer.object.id;
  }

  /** The farthest a declared path reaches from the Sun, so focusing the Sun frames them all. */
  setFramingKm(km: number): void {
    this.#frameKm = km;
  }

  sync(timeUtcMs: number, adapter: AstronomyAdapter, policy: ScalePolicy): void {
    this.#absolute = eqjToRenderVector(policy.mapPosition(sunOffsetKm(adapter, timeUtcMs)));
  }

  place(origin: FloatingOrigin): void {
    const [ox, oy, oz] = origin.scaledCameraOrigin;
    this.#positions.setXYZ(0, this.#absolute[0] - ox, this.#absolute[1] - oy, this.#absolute[2] - oz);
    this.#positions.needsUpdate = true;
  }

  absolute(): RenderVector {
    return this.#absolute;
  }

  labelAnchor(): RenderVector {
    return this.#absolute;
  }

  extentUnits(policy: ScalePolicy): number {
    return scaleLength(policy, this.#frameKm);
  }
}

/**
 * A path: a state source sampled once over its span, with every vertex Sun-centred. Each frame the vertices
 * are composed to the Earth-centred scene at the Sun's position for the clock time, then go through
 * ScalePolicy -> render axes -> floating origin like every other body.
 */
export class PathView implements SunCentredItem {
  readonly group = new Group();
  /** Sun-centred EQJ km, 3 per vertex. */
  readonly samplesKm: Float64Array;
  /** Farthest vertex from the Sun, in km. */
  readonly maxRadiusKm: number;
  readonly #count: number;
  readonly #scaled: Float64Array;
  readonly #positions: BufferAttribute;
  readonly #centreKm: [number, number, number];
  readonly #extentKm: number;
  #centre: RenderVector = [0, 0, 0];

  constructor(readonly layer: PathLayer) {
    this.samplesKm = samplePathKm(layer.source, layer.span, layer.samples ?? DEFAULT_PATH_SAMPLE_COUNT);
    this.#count = this.samplesKm.length / 3;
    this.#scaled = new Float64Array(this.samplesKm.length);
    let cx = 0;
    let cy = 0;
    let cz = 0;
    let radius = 0;
    for (let i = 0; i < this.samplesKm.length; i += 3) {
      cx += this.samplesKm[i];
      cy += this.samplesKm[i + 1];
      cz += this.samplesKm[i + 2];
      radius = Math.max(radius, Math.hypot(this.samplesKm[i], this.samplesKm[i + 1], this.samplesKm[i + 2]));
    }
    this.#centreKm = [cx / this.#count, cy / this.#count, cz / this.#count];
    let widest = 0;
    for (let i = 0; i < this.samplesKm.length; i += 3) {
      widest = Math.max(widest, Math.hypot(this.samplesKm[i] - this.#centreKm[0], this.samplesKm[i + 1] - this.#centreKm[1], this.samplesKm[i + 2] - this.#centreKm[2]));
    }
    this.maxRadiusKm = radius;
    this.#extentKm = widest;
    const geometry = new BufferGeometry();
    this.#positions = new BufferAttribute(new Float32Array(this.samplesKm.length), 3);
    geometry.setAttribute("position", this.#positions);
    const line = new Line(geometry, new LineBasicMaterial({ color: layer.color, transparent: true, opacity: 0.7, depthTest: false }));
    line.frustumCulled = false;
    line.layers.set(TRACK_LAYER);
    this.group.add(line);
  }

  get id(): string {
    return this.layer.object.id;
  }

  sync(timeUtcMs: number, adapter: AstronomyAdapter, policy: ScalePolicy): void {
    const offset = sunOffsetKm(adapter, timeUtcMs);
    const vertex = new Float64Array(3);
    for (let i = 0; i < this.samplesKm.length; i += 3) {
      vertex[0] = this.samplesKm[i] + offset[0];
      vertex[1] = this.samplesKm[i + 1] + offset[1];
      vertex[2] = this.samplesKm[i + 2] + offset[2];
      const mapped = eqjToRenderVector(policy.mapPosition(vertex));
      this.#scaled[i] = mapped[0];
      this.#scaled[i + 1] = mapped[1];
      this.#scaled[i + 2] = mapped[2];
    }
    this.#centre = eqjToRenderVector(policy.mapPosition([
      this.#centreKm[0] + offset[0],
      this.#centreKm[1] + offset[1],
      this.#centreKm[2] + offset[2],
    ]));
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

  /** The centre of the sampled line, so a focused path sits in the middle of the view. */
  absolute(): RenderVector {
    return this.#centre;
  }

  /** The first vertex: always on the line, so the label never floats in empty space. */
  labelAnchor(): RenderVector {
    return [this.#scaled[0], this.#scaled[1], this.#scaled[2]];
  }

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

/** Builds the views for a Sun and its paths; the Sun frames the farthest path. */
export function createSunCentredViews(sun: SunBody | undefined, paths: readonly PathLayer[]): readonly SunCentredItem[] {
  const pathViews = paths.map((layer) => new PathView(layer));
  const sunView = sun === undefined ? null : new SunView(sun);
  sunView?.setFramingKm(Math.max(0, ...pathViews.map((view) => view.maxRadiusKm)));
  return [...(sunView === null ? [] : [sunView]), ...pathViews];
}
