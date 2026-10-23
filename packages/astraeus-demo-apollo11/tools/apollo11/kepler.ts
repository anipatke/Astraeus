import { add, cross, dot, norm, scale, sub, type Vec3 } from "./vec";

export interface OrbitState {
  readonly r: Vec3;
  readonly v: Vec3;
}

export interface OrbitApsides {
  readonly periapsisRadiusKm: number;
  readonly apoapsisRadiusKm: number;
  readonly eccentricity: number;
}

function stumpff(z: number): { c: number; s: number } {
  if (Math.abs(z) < 1e-3) {
    return {
      c: 1 / 2 - z / 24 + (z * z) / 720 - (z * z * z) / 40320,
      s: 1 / 6 - z / 120 + (z * z) / 5040 - (z * z * z) / 362880,
    };
  }
  if (z > 0) {
    const root = Math.sqrt(z);
    return { c: (1 - Math.cos(root)) / z, s: (root - Math.sin(root)) / (root * root * root) };
  }
  const root = Math.sqrt(-z);
  return { c: (Math.cosh(root) - 1) / -z, s: (Math.sinh(root) - root) / (root * root * root) };
}

function initialAnomaly(mu: number, r0: number, rv: number, alpha: number, dt: number): number {
  const sqrtMu = Math.sqrt(mu);
  if (alpha > 1e-12) return sqrtMu * dt * alpha;
  if (alpha < -1e-12) {
    const a = 1 / alpha;
    const sign = Math.sign(dt);
    const argument = (-2 * mu * alpha * dt) / (rv + sign * Math.sqrt(-mu * a) * (1 - r0 * alpha));
    return sign * Math.sqrt(-a) * Math.log(argument);
  }
  return (sqrtMu * dt) / r0;
}

/** Two-body propagation by universal variables; exact for elliptic and hyperbolic orbits. */
export function propagateKepler(mu: number, state: OrbitState, dtSeconds: number): OrbitState {
  if (dtSeconds === 0) return state;
  const r0 = norm(state.r);
  const speed2 = dot(state.v, state.v);
  const alpha = 2 / r0 - speed2 / mu;
  let dt = dtSeconds;
  if (alpha > 1e-12) {
    const period = 2 * Math.PI * Math.sqrt(1 / (alpha * alpha * alpha) / mu);
    dt = dtSeconds - Math.trunc(dtSeconds / period) * period;
    if (dt === 0) return state;
  }
  const sqrtMu = Math.sqrt(mu);
  const rv = dot(state.r, state.v);
  let chi = initialAnomaly(mu, r0, rv, alpha, dt);
  for (let iteration = 0; ; iteration += 1) {
    if (iteration > 200 || !Number.isFinite(chi)) throw new RangeError("Kepler propagation did not converge");
    const z = alpha * chi * chi;
    const { c, s } = stumpff(z);
    const f = ((rv / sqrtMu) * chi * chi * c) + (1 - alpha * r0) * chi * chi * chi * s + r0 * chi - sqrtMu * dt;
    const df = (rv / sqrtMu) * chi * (1 - z * s) + (1 - alpha * r0) * chi * chi * c + r0;
    const step = f / df;
    chi -= step;
    if (Math.abs(step) <= 1e-12 * Math.max(1, Math.abs(chi))) break;
  }
  const z = alpha * chi * chi;
  const { c, s } = stumpff(z);
  const fLagrange = 1 - (chi * chi * c) / r0;
  const gLagrange = dt - (chi * chi * chi * s) / sqrtMu;
  const r = add(scale(state.r, fLagrange), scale(state.v, gLagrange));
  const rNorm = norm(r);
  const fDot = (sqrtMu / (rNorm * r0)) * chi * (z * s - 1);
  const gDot = 1 - (chi * chi * c) / rNorm;
  return { r, v: add(scale(state.r, fDot), scale(state.v, gDot)) };
}

/** Osculating apsides of a bound two-body orbit. */
export function apsides(mu: number, state: OrbitState): OrbitApsides {
  const h = cross(state.r, state.v);
  const eccentricityVector = sub(scale(cross(state.v, h), 1 / mu), scale(state.r, 1 / norm(state.r)));
  const eccentricity = norm(eccentricityVector);
  if (eccentricity >= 1) throw new RangeError("orbit is not bound");
  const semiLatus = dot(h, h) / mu;
  return {
    periapsisRadiusKm: semiLatus / (1 + eccentricity),
    apoapsisRadiusKm: semiLatus / (1 - eccentricity),
    eccentricity,
  };
}
