// Purpose: the drawn dots of an orbit group that the graphics chip positions every frame from each member's ellipse (see keplerShader).
// Uploads the per-member numbers once; each frame only a handful of uniforms change.
import { BufferAttribute, BufferGeometry, Points, type PointsMaterial, Vector3, type WebGLProgramParametersWithUniforms } from "three";
import { dotMaterial } from "./dotMaterial";
import type { KeplerElements } from "../core/keplerElements";
import {
  KEPLER_ATTRIBUTES_GLSL,
  KEPLER_BEGIN_VERTEX_GLSL,
  createKeplerAttributes,
  epochWindowSeconds,
  keplerGlsl,
  keplerLocalF32,
  setKeplerEpoch,
  type KeplerAttributes,
} from "./keplerShader";
import { TRACK_LAYER } from "./TrackedBodyView";

/** Largest `n dt` the fastest member may accumulate either side of the epoch; keeps the 32-bit phase error under ~1e-7 of a turn. */
const EPOCH_WINDOW_RADIANS = 0.5;

export class KeplerPoints {
  readonly points: Points;
  readonly material: PointsMaterial;
  readonly elements: KeplerElements;
  readonly #elements: KeplerElements;
  readonly #attributes: KeplerAttributes;
  readonly #shape: BufferAttribute;
  readonly #uniforms = { uDt: { value: 0 }, uUnitsPerKm: { value: 0 }, uOffset: { value: new Vector3() } };
  readonly #windowMs: number;
  #epochMs = Number.NaN;
  /** Number of times the epoch was moved; lets tests see that playing on does not move it every frame. */
  rebaseCount = 0;

  constructor(elements: KeplerElements, color: string, sizePx: number) {
    this.elements = elements;
    this.#elements = elements;
    this.#attributes = createKeplerAttributes(elements);
    this.#windowMs = 1000 * epochWindowSeconds(elements, EPOCH_WINDOW_RADIANS);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(this.#attributes.axisP, 3));
    geometry.setAttribute("keplerQ", new BufferAttribute(this.#attributes.axisQ, 3));
    this.#shape = new BufferAttribute(this.#attributes.shape, 3);
    geometry.setAttribute("keplerShape", this.#shape);
    this.material = dotMaterial({ color, size: sizePx, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false });
    this.material.onBeforeCompile = (shader) => this.#placeInVertexShader(shader);
    this.material.customProgramCacheKey = () => "astraeus-points-kepler";
    this.points = new Points(geometry, this.material);
    this.points.frustumCulled = false;
    this.points.layers.set(TRACK_LAYER);
    this.points.visible = false;
  }

  /**
   * Sets this frame's uniforms. The epoch the phases are held at moves (in 64 bits) only when the clock is more than a window away
   * from it, to just ahead of the clock in the direction it is going, so playing on touches the attributes once per window.
   */
  update(timeUtcMs: number, direction: 0 | 1 | -1, unitsPerKm: number, offset: ArrayLike<number>): void {
    if (!(Math.abs(timeUtcMs - this.#epochMs) <= this.#windowMs)) {
      this.#epochMs = Math.round(timeUtcMs + 0.5 * direction * this.#windowMs);
      setKeplerEpoch(this.#elements, this.#attributes.shape, this.#epochMs);
      this.#shape.needsUpdate = true;
      this.rebaseCount += 1;
    }
    this.#uniforms.uDt.value = (timeUtcMs - this.#epochMs) / 1000;
    this.#uniforms.uUnitsPerKm.value = unitsPerKm;
    this.#uniforms.uOffset.value.set(offset[0], offset[1], offset[2]);
  }

  /** Member `index`'s position from the floating origin as the shader computes it for the last `update`. */
  localPosition(index: number): [number, number, number] {
    const u = this.#uniforms;
    return keplerLocalF32(this.#attributes, index, { dt: u.uDt.value, unitsPerKm: u.uUnitsPerKm.value, offset: u.uOffset.value.toArray() });
  }

  #placeInVertexShader(shader: WebGLProgramParametersWithUniforms): void {
    Object.assign(shader.uniforms, this.#uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", `${KEPLER_ATTRIBUTES_GLSL}${keplerGlsl()}\nvoid main() {`)
      .replace("#include <begin_vertex>", KEPLER_BEGIN_VERTEX_GLSL);
  }
}
