// Independent geometry for the Perseid factual checks (T-038 Done When 2). It does not use the engine's propagation: it works from the
// measured elements directly, in the ecliptic J2000 frame they are given in, and takes only Earth's position (the engine's ephemeris
// adapter) and the Sun's GM. A stream member here is an ellipse, not a dot.
import type { AstronomyAdapter } from "../../src/core/astronomyAdapter";

export const AU_KM = 149_597_870.7;
export const SUN_GM_KM3_S2 = 132_712_440_018;
const RAD = Math.PI / 180;

export interface Ellipse {
  readonly a: number; // km
  readonly e: number;
  readonly p: number; // semi-latus rectum, km
  /** Perifocal axes in the ecliptic J2000 frame. */
  readonly P: readonly [number, number, number];
  readonly Q: readonly [number, number, number];
}

export function ellipseOf(aAu: number, e: number, iDeg: number, wDeg: number, nodeDeg: number): Ellipse {
  const [i, w, O] = [iDeg * RAD, wDeg * RAD, nodeDeg * RAD];
  const [cO, sO, ci, si, cw, sw] = [Math.cos(O), Math.sin(O), Math.cos(i), Math.sin(i), Math.cos(w), Math.sin(w)];
  const a = aAu * AU_KM;
  return {
    a,
    e,
    p: a * (1 - e * e),
    P: [cO * cw - sO * sw * ci, sO * cw + cO * sw * ci, sw * si],
    Q: [-cO * sw - sO * cw * ci, -sO * sw + cO * cw * ci, cw * si],
  };
}

export function pointOn(o: Ellipse, nu: number): [number, number, number] {
  const r = o.p / (1 + o.e * Math.cos(nu));
  const [x, y] = [r * Math.cos(nu), r * Math.sin(nu)];
  return [x * o.P[0] + y * o.Q[0], x * o.P[1] + y * o.Q[1], x * o.P[2] + y * o.Q[2]];
}

/** Heliocentric velocity (km/s) at true anomaly `nu`. */
export function velocityOn(o: Ellipse, nu: number): [number, number, number] {
  const k = Math.sqrt(SUN_GM_KM3_S2 / o.p);
  const [vx, vy] = [-k * Math.sin(nu), k * (o.e + Math.cos(nu))];
  return [vx * o.P[0] + vy * o.Q[0], vx * o.P[1] + vy * o.Q[1], vx * o.P[2] + vy * o.Q[2]];
}

const dist = (u: ArrayLike<number>, v: ArrayLike<number>): number => Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2]);

/**
 * The point of the ellipse nearest `target` (ecliptic km): the true anomalies at which the orbit is as far from the Sun as the target are
 * the starting guesses (the orbit passes the target's neighbourhood there), refined by a golden-section search of the distance within
 * +-0.15 rad. Returns null when the orbit never reaches the target's distance from the Sun.
 */
export function nearestPoint(o: Ellipse, target: ArrayLike<number>): { nu: number; distanceKm: number } | null {
  const rT = Math.hypot(target[0], target[1], target[2]);
  const c = (o.p / rT - 1) / o.e;
  if (o.e === 0 || Math.abs(c) > 1) return null;
  const nu0 = Math.acos(c);
  let best: { nu: number; distanceKm: number } | null = null;
  for (const centre of [nu0, -nu0]) {
    let [lo, hi] = [centre - 0.15, centre + 0.15];
    const f = (nu: number): number => dist(pointOn(o, nu), target);
    const g = (Math.sqrt(5) - 1) / 2;
    let [x1, x2] = [hi - g * (hi - lo), lo + g * (hi - lo)];
    let [f1, f2] = [f(x1), f(x2)];
    for (let k = 0; k < 28; k += 1) {
      if (f1 < f2) { hi = x2; x2 = x1; f2 = f1; x1 = hi - g * (hi - lo); f1 = f(x1); }
      else { lo = x1; x1 = x2; f1 = f2; x2 = lo + g * (hi - lo); f2 = f(x2); }
    }
    const nu = (lo + hi) / 2;
    const d = f(nu);
    if (best === null || d < best.distanceKm) best = { nu, distanceKm: d };
  }
  return best;
}

/** Transposes a row-major 3x3 and applies it: EQJ to ecliptic J2000 when `m` is the ecliptic-to-EQJ matrix. */
export const applyTransposed = (m: ArrayLike<number>, v: ArrayLike<number>): [number, number, number] => [
  m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
  m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
  m[2] * v[0] + m[5] * v[1] + m[8] * v[2],
];
export const apply = (m: ArrayLike<number>, v: ArrayLike<number>): [number, number, number] => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];

/** Earth's heliocentric position and velocity in the ecliptic J2000 frame (the velocity by a +-1 h central difference of the ephemeris). */
export function earthEcliptic(adapter: AstronomyAdapter, toEqj: ArrayLike<number>, timeUtcMs: number): { position: [number, number, number]; velocity: [number, number, number] } {
  const position = applyTransposed(toEqj, adapter.earthPositionFromSunKm(Math.round(timeUtcMs)));
  const [before, after] = [-3_600_000, 3_600_000].map((dt) => applyTransposed(toEqj, adapter.earthPositionFromSunKm(Math.round(timeUtcMs + dt))));
  return { position, velocity: [0, 1, 2].map((k) => (after[k] - before[k]) / 7200) as [number, number, number] };
}

/**
 * The Sun's geometric ecliptic longitude in the J2000.0 ecliptic and equinox, degrees: Earth's heliocentric longitude (J2000 ecliptic) plus 180 degrees.
 * CONVENTION (I-027): the IAU MDC peak solar longitudes ("All records on J2000") are J2000.0 values, so they are compared
 * with this J2000 longitude. Do NOT add general precession (about 1.397 deg per century, 0.37 deg in 2027): that gives the longitude of date, which is a
 * different quantity and put the peak instants about 9 h early. Aberration (-20.5 arcsec) and nutation are not applied: under 0.01 deg, about 15 minutes.
 */
export function solarLongitudeDeg(adapter: AstronomyAdapter, toEqj: ArrayLike<number>, timeUtcMs: number): number {
  const [x, y] = applyTransposed(toEqj, adapter.earthPositionFromSunKm(Math.round(timeUtcMs)));
  const lambda = Math.atan2(y, x) / RAD + 180;
  return ((lambda % 360) + 360) % 360;
}

/** The instant in [fromUtcMs, toUtcMs] at which the solar longitude passes `targetDeg` (bisection; the longitude rises monotonically). */
export function timeOfSolarLongitude(adapter: AstronomyAdapter, toEqj: ArrayLike<number>, targetDeg: number, fromUtcMs: number, toUtcMs: number): number {
  const signed = (t: number): number => ((solarLongitudeDeg(adapter, toEqj, t) - targetDeg + 540) % 360) - 180;
  let [lo, hi] = [fromUtcMs, toUtcMs];
  for (let k = 0; k < 60; k += 1) {
    const mid = (lo + hi) / 2;
    if (signed(mid) < 0) lo = mid;
    else hi = mid;
  }
  return Math.round((lo + hi) / 2);
}

export const raDecOf = (v: ArrayLike<number>): { raDeg: number; decDeg: number } => {
  const r = Math.hypot(v[0], v[1], v[2]);
  return { raDeg: ((Math.atan2(v[1], v[0]) / RAD) + 360) % 360, decDeg: Math.asin(v[2] / r) / RAD };
};

export const separationDeg = (a: { raDeg: number; decDeg: number }, b: { raDeg: number; decDeg: number }): number => {
  const [a1, d1, a2, d2] = [a.raDeg * RAD, a.decDeg * RAD, b.raDeg * RAD, b.decDeg * RAD];
  const c = Math.sin(d1) * Math.sin(d2) + Math.cos(d1) * Math.cos(d2) * Math.cos(a1 - a2);
  return Math.acos(Math.max(-1, Math.min(1, c))) / RAD;
};
