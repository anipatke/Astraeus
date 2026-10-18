/** One osculating orbital period (s) of a body at position `r` (km) and velocity `v` (km/s) about a centre of `gm` (km^3/s^2); Infinity when unbound. */
export function osculatingPeriodS(r: ArrayLike<number>, v: ArrayLike<number>, gm: number): number {
  const radius = Math.hypot(r[0], r[1], r[2]);
  const energy = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) / 2 - gm / radius;
  if (!(radius > 0) || !(energy < 0)) return Number.POSITIVE_INFINITY;
  const a = -gm / (2 * energy);
  return 2 * Math.PI * Math.sqrt((a * a * a) / gm);
}
