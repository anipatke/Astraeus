import { BufferAttribute, BufferGeometry, Group, Line, LineBasicMaterial } from "three";
import type { ScalePolicy } from "../core/scalePolicy";
import { samplePathKm } from "../core/sunCentredSources";
import { DEFAULT_PATH_SAMPLE_COUNT, type PathLayer } from "./experienceDefinition";
import type { FloatingOrigin } from "./floatingOrigin";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import { sceneOffsetKm, type ScenePlacement } from "./sceneLayout";
import { TRACK_LAYER } from "./TrackedBodyView";

/** What the scene needs from a drawn path: a focus point, a label anchor, and a size to frame. */
export interface SunCentredItem {
  readonly id: string;
  readonly group: Group;
  sync(timeUtcMs: number, placement: ScenePlacement, policy: ScalePolicy): void;
  place(origin: FloatingOrigin): void;
  /** Scaled absolute point the camera focuses on. */
  absolute(): RenderVector;
  /** Scaled absolute point the label sits at; a point on the line for a path. */
  labelAnchor(): RenderVector;
  /** Scaled distance from the focus point that frames the whole item. */
  extentUnits(policy: ScalePolicy): number;
}

const ZERO_OFFSET: ArrayLike<number> = Object.freeze([0, 0, 0]);
const scaleLength = (policy: ScalePolicy, km: number): number => policy.mapPosition([km, 0, 0])[0];

/**
 * A path: a state source sampled once over its span, with every vertex Sun-centred. Each frame the vertices
 * are expressed from the scene centre at the Sun's position for the clock time, then go through
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

  sync(timeUtcMs: number, placement: ScenePlacement, policy: ScalePolicy): void {
    const offset = sceneOffsetKm(placement, "sun", timeUtcMs) ?? ZERO_OFFSET;
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

/** The distance in km from the Sun to the farthest vertex of any path: what a view of the Sun frames. */
export function pathReachKm(views: readonly PathView[]): number {
  return Math.max(0, ...views.map((view) => view.maxRadiusKm));
}

/** Builds the views for the declared paths. The Sun itself is a composition body, drawn by the scene like any other. */
export function createSunCentredViews(paths: readonly PathLayer[]): readonly PathView[] {
  return paths.map((layer) => new PathView(layer));
}
