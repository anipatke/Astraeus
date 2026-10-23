import type { CenterId } from "./body";
import type { TwoBodyAdapter } from "./twoBodyAdapter";

/**
 * Each member's orbit as an ellipse the graphics chip can evaluate: the shape (`a`, `e`), the orientation as two in-plane unit
 * vectors in EQJ axes (P toward periapsis, Q a quarter turn on in the orbit's direction), and where the member is along the orbit
 * at `epochUtcMs`. Derived once, in 64 bits, from the same state vectors the group's own fills propagate, so
 * `a (cos E - e) P + a sqrt(1 - e^2) sin E Q` with M = M0 + n (t - epoch) is the group's position.
 */
export interface KeplerElements {
  readonly count: number;
  /** The instant `meanAnomalyRad` holds at. */
  readonly epochUtcMs: number;
  readonly semiMajorAxisKm: Float64Array;
  readonly eccentricity: Float64Array;
  /** Unit vector toward periapsis, three values per member (a circular orbit takes the member's own direction at the epoch). */
  readonly periapsisDirection: Float64Array;
  /** Unit vector 90 degrees past periapsis in the direction of motion, three values per member. */
  readonly quadratureDirection: Float64Array;
  /** Mean anomaly at the epoch, in [-pi, pi). */
  readonly meanAnomalyRad: Float64Array;
  /** Radians per second. */
  readonly meanMotionRadS: Float64Array;
}

const TWO_PI = 2 * Math.PI;

/** Mean anomaly wrapped to [-pi, pi). */
export function wrapAnomaly(radians: number): number {
  return radians - TWO_PI * Math.floor((radians + Math.PI) / TWO_PI);
}

/** The centre's gravitational parameter as the adapter applies it: a circular orbit has v² r = μ. */
export function gravitationalParameterOf(adapter: TwoBodyAdapter, center: CenterId): number {
  const r = 1e6;
  const { velocity } = adapter.elementsToState(
    { semiMajorAxisKm: r, eccentricity: 0, inclinationRad: 0, raanRad: 0, argumentOfPeriapsisRad: 0, trueAnomalyRad: 0 },
    center,
  );
  return (velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2) * r;
}

/** Elements for `count` members from six-values-per-member states (position then velocity, EQJ) about a centre of parameter `mu`. */
export function keplerElementsFromStates(states: Float64Array, count: number, mu: number, epochUtcMs: number): KeplerElements {
  const a = new Float64Array(count);
  const e = new Float64Array(count);
  const p = new Float64Array(3 * count);
  const q = new Float64Array(3 * count);
  const m0 = new Float64Array(count);
  const n = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    const o = 6 * i;
    const [rx, ry, rz, vx, vy, vz] = [states[o], states[o + 1], states[o + 2], states[o + 3], states[o + 4], states[o + 5]];
    const r = Math.hypot(rx, ry, rz);
    const hx = ry * vz - rz * vy;
    const hy = rz * vx - rx * vz;
    const hz = rx * vy - ry * vx;
    const hMag = Math.hypot(hx, hy, hz);
    // Eccentricity vector (v × h) / μ - r / |r|.
    let ex = (vy * hz - vz * hy) / mu - rx / r;
    let ey = (vz * hx - vx * hz) / mu - ry / r;
    let ez = (vx * hy - vy * hx) / mu - rz / r;
    const ecc = Math.hypot(ex, ey, ez);
    if (ecc < 1e-10) {
      ex = rx / r;
      ey = ry / r;
      ez = rz / r;
    } else {
      ex /= ecc;
      ey /= ecc;
      ez /= ecc;
    }
    const wx = hx / hMag;
    const wy = hy / hMag;
    const wz = hz / hMag;
    // Q = ĥ × P
    const qx = wy * ez - wz * ey;
    const qy = wz * ex - wx * ez;
    const qz = wx * ey - wy * ex;
    const semiMajor = -mu / (2 * ((vx * vx + vy * vy + vz * vz) / 2 - mu / r));
    const eccentric = Math.min(ecc, 1 - 1e-12);
    const nu = Math.atan2(rx * qx + ry * qy + rz * qz, rx * ex + ry * ey + rz * ez);
    const E = 2 * Math.atan2(Math.sqrt(1 - eccentric) * Math.sin(nu / 2), Math.sqrt(1 + eccentric) * Math.cos(nu / 2));
    a[i] = semiMajor;
    e[i] = ecc;
    p.set([ex, ey, ez], 3 * i);
    q.set([qx, qy, qz], 3 * i);
    m0[i] = wrapAnomaly(E - eccentric * Math.sin(E));
    n[i] = Math.sqrt(mu / (semiMajor * semiMajor * semiMajor));
  }
  return { count, epochUtcMs, semiMajorAxisKm: a, eccentricity: e, periapsisDirection: p, quadratureDirection: q, meanAnomalyRad: m0, meanMotionRadS: n };
}

/**
 * Members `start` up to `end` at `timeUtcMs`, in 64 bits, straight from the elements: `a (cos E - e) P + a sqrt(1 - e^2) sin E Q` with
 * E from Newton's method. The same positions as the group's own fill (proven in tests), without that fill's per-member allocation.
 * Positions go into `out` (EQJ km, three per member) at the member's own index.
 */
export function fillKeplerRangeKm(elements: KeplerElements, timeUtcMs: number, out: Float64Array, start: number, end: number): void {
  const dtSeconds = (timeUtcMs - elements.epochUtcMs) / 1000;
  const { semiMajorAxisKm: a, eccentricity: ecc, periapsisDirection: p, quadratureDirection: q, meanAnomalyRad: m0, meanMotionRadS: n } = elements;
  for (let i = start; i < end; i++) {
    const e = ecc[i];
    const m = wrapAnomaly(m0[i] + n[i] * dtSeconds);
    let E = m + 0.85 * e * Math.sign(m);
    for (let step = 0; step < 40; step++) {
      const delta = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
      E -= delta;
      if (Math.abs(delta) < 1e-14) break;
    }
    const x = a[i] * (Math.cos(E) - e);
    const y = a[i] * Math.sqrt(1 - e * e) * Math.sin(E);
    out[3 * i] = x * p[3 * i] + y * q[3 * i];
    out[3 * i + 1] = x * p[3 * i + 1] + y * q[3 * i + 1];
    out[3 * i + 2] = x * p[3 * i + 2] + y * q[3 * i + 2];
  }
}
