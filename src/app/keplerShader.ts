// Purpose: places a large orbit group's dots on the graphics chip from each member's orbital ellipse. The GLSL and its 32-bit
// JavaScript twin live side by side so tests can prove the twin against the group's own 64-bit positions and the two cannot drift.
import type { KeplerElements } from "../core/keplerElements";
import { wrapAnomaly } from "../core/keplerElements";

/**
 * Halley steps (third order) on Kepler's equation, by eccentricity: the fewest that bring the error down to the 32-bit rounding floor
 * for every eccentricity up to 0.99, from the start `m + 0.85 e sign(m)`. Chosen from the emulation study in tests/keplerShader.test.ts
 * (worst error, in units of a sqrt((1 + e) / (1 - e)): below 2e-7 once the steps below are taken; one fewer leaves 1e-6 to 1e-4).
 */
export const KEPLER_MAX_STEPS = 4;
export function keplerStepsFor(e: number): number {
  return e < 0.5 ? 2 : e < 0.95 ? 3 : KEPLER_MAX_STEPS;
}

const f = Math.fround;
const PI = f(Math.PI);
const TWO_PI = f(2 * Math.PI);
const START_SLOPE = f(0.85);

/** Operation names in the order the shader performs them for one member, for the structural test that pairs the GLSL with the twin. */
export function keplerOperationOrder(e: number): string[] {
  const loop = Array.from({ length: keplerStepsFor(e) }, () => ["sin", "cos"]).flat();
  return ["floor", "sign", ...loop, "cos", "sin"];
}

/**
 * The shader function. `pa` and `qb` are the ellipse's two axes in render axes and km (a P and a sqrt(1 - e^2) Q), and `shape` holds
 * eccentricity, mean anomaly at the epoch and mean motion in radians per second; `dt` is seconds since that epoch.
 */
export function keplerGlsl(): string {
  return `const float K_PI = ${PI.toPrecision(8)};
const float K_TWO_PI = ${TWO_PI.toPrecision(8)};
vec3 keplerKm(vec3 pa, vec3 qb, vec3 shape, float dt) {
  float e = shape.x;
  float m = shape.y + shape.z * dt;
  m = m - K_TWO_PI * floor((m + K_PI) / K_TWO_PI);
  float E = m + ${START_SLOPE.toPrecision(2)} * e * sign(m);
  int steps = e < 0.5 ? 2 : (e < 0.95 ? 3 : ${KEPLER_MAX_STEPS});
  for (int i = 0; i < ${KEPLER_MAX_STEPS}; i++) {
    if (i >= steps) break;
    float s = sin(E);
    float c = cos(E);
    float g = E - e * s - m;
    float d = 1.0 - e * c;
    E = E - g / (d - 0.5 * g * (e * s) / d);
  }
  return pa * (cos(E) - e) + qb * sin(E);
}`;
}

/** Declarations and the replacement for three's `begin_vertex`, which together make the stock point shader place a dot by its ellipse. */
export const KEPLER_ATTRIBUTES_GLSL = "attribute vec3 keplerQ;\nattribute vec3 keplerShape;\nuniform float uDt;\nuniform float uUnitsPerKm;\nuniform vec3 uOffset;\n";
export const KEPLER_BEGIN_VERTEX_GLSL = "vec3 transformed = uUnitsPerKm * keplerKm(position, keplerQ, keplerShape, uDt) + uOffset;";

/** The shader's arithmetic in 32-bit floats, one rounding per GLSL operation. `trace` collects the transcendental calls in order. */
export function keplerKmF32(pa: ArrayLike<number>, qb: ArrayLike<number>, e: number, m0: number, n: number, dt: number, trace?: string[]): [number, number, number] {
  let m = f(m0 + f(n * dt));
  trace?.push("floor");
  m = f(m - f(TWO_PI * Math.floor(f(f(m + PI) / TWO_PI))));
  trace?.push("sign");
  let E = f(m + f(f(START_SLOPE * e) * Math.sign(m)));
  const steps = keplerStepsFor(e);
  for (let i = 0; i < steps; i++) {
    trace?.push("sin", "cos");
    const s = f(Math.sin(E));
    const c = f(Math.cos(E));
    const g = f(f(E - f(e * s)) - m);
    const d = f(1 - f(e * c));
    E = f(E - f(g / f(d - f(f(f(0.5 * g) * f(e * s)) / d))));
  }
  trace?.push("cos", "sin");
  const cosE = f(Math.cos(E));
  const sinE = f(Math.sin(E));
  return [0, 1, 2].map((k) => f(f(pa[k] * f(cosE - e)) + f(qb[k] * sinE))) as [number, number, number];
}

/** What the shader is handed per frame besides the per-member attributes. */
export interface KeplerUniforms {
  /** Seconds since the attributes' epoch. */
  readonly dt: number;
  /** Scaled units per km. */
  readonly unitsPerKm: number;
  /** Minus the floating origin plus any offset of the group's centre from the scene centre, in scaled render units. */
  readonly offset: ArrayLike<number>;
}

/** The three per-member attribute arrays, three floats per member, in render axes. */
export interface KeplerAttributes {
  /** a P, km: bound to three's `position`. */
  readonly axisP: Float32Array;
  /** a sqrt(1 - e^2) Q, km. */
  readonly axisQ: Float32Array;
  /** Eccentricity, mean anomaly at the epoch (radians), mean motion (radians per second). */
  readonly shape: Float32Array;
}

export function createKeplerAttributes(elements: KeplerElements): KeplerAttributes {
  const { count } = elements;
  const axisP = new Float32Array(3 * count);
  const axisQ = new Float32Array(3 * count);
  const shape = new Float32Array(3 * count);
  const p = elements.periapsisDirection;
  const q = elements.quadratureDirection;
  for (let i = 0; i < count; i++) {
    const a = elements.semiMajorAxisKm[i];
    const e = elements.eccentricity[i];
    const b = a * Math.sqrt(1 - e * e);
    // EQJ (x, y, z) -> render (x, z, -y)
    axisP[3 * i] = a * p[3 * i];
    axisP[3 * i + 1] = a * p[3 * i + 2];
    axisP[3 * i + 2] = -a * p[3 * i + 1];
    axisQ[3 * i] = b * q[3 * i];
    axisQ[3 * i + 1] = b * q[3 * i + 2];
    axisQ[3 * i + 2] = -b * q[3 * i + 1];
    shape[3 * i] = e;
    shape[3 * i + 2] = elements.meanMotionRadS[i];
  }
  setKeplerEpoch(elements, shape, elements.epochUtcMs);
  return { axisP, axisQ, shape };
}

/** Rewrites every member's mean anomaly to hold at `epochUtcMs`, computed in 64 bits and wrapped, so 32-bit time arithmetic stays small. */
export function setKeplerEpoch(elements: KeplerElements, shape: Float32Array, epochUtcMs: number): void {
  const seconds = (epochUtcMs - elements.epochUtcMs) / 1000;
  for (let i = 0; i < elements.count; i++) {
    shape[3 * i + 1] = wrapAnomaly(elements.meanAnomalyRad[i] + elements.meanMotionRadS[i] * seconds);
  }
}

/** The longest span, seconds either side of an epoch, over which the fastest member's `n dt` stays within `radians`. */
export function epochWindowSeconds(elements: KeplerElements, radians: number): number {
  let fastest = 0;
  for (let i = 0; i < elements.count; i++) fastest = Math.max(fastest, elements.meanMotionRadS[i]);
  return radians / fastest;
}

/** Member `index`, as the shader draws it, from the scene's origin: the twin of `keplerBeginVertex`. */
export function keplerLocalF32(attributes: KeplerAttributes, index: number, uniforms: KeplerUniforms): [number, number, number] {
  const o = 3 * index;
  const km = keplerKmF32(
    attributes.axisP.subarray(o, o + 3),
    attributes.axisQ.subarray(o, o + 3),
    attributes.shape[o],
    attributes.shape[o + 1],
    attributes.shape[o + 2],
    f(uniforms.dt),
  );
  const k = f(uniforms.unitsPerKm);
  return [0, 1, 2].map((axis) => f(f(k * km[axis]) + f(uniforms.offset[axis]))) as [number, number, number];
}
