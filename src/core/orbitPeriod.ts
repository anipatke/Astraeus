/** One osculating orbital period (s) of a body at position `r` (km) and velocity `v` (km/s) about a centre of `gm` (km^3/s^2); Infinity when unbound. */
export function osculatingPeriodS(r: ArrayLike<number>, v: ArrayLike<number>, gm: number): number {
  const radius = Math.hypot(r[0], r[1], r[2]);
  const energy = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) / 2 - gm / radius;
  if (!(radius > 0) || !(energy < 0)) return Number.POSITIVE_INFINITY;
  const a = -gm / (2 * energy);
  return 2 * Math.PI * Math.sqrt((a * a * a) / gm);
}

/**
 * A system whose centre and one big moon circle their common balance point (Pluto and Charon): that moon's body id and its GM (km^3/s^2).
 * Data a moon system names, never a check on one planet in code.
 */
export interface BalancePoint {
  readonly body: string;
  readonly gmKm3S2: number;
}

/** How far (as a share of the partner's centre-relative position) the centre sits from the balance point, towards the side away from the partner. */
export function balanceShare(centreGmKm3S2: number, partner: BalancePoint): number {
  return partner.gmKm3S2 / (centreGmKm3S2 + partner.gmKm3S2);
}

/**
 * The orbital period (s) of a body whose centre-relative state is `r`, `v`, in a system that names a balance point: the partner itself orbits the
 * centre with the pair's GM; any other body orbits the balance point, so its state is moved there first (the centre's own reflex motion would
 * otherwise corrupt the period, I-056). `partnerR` and `partnerV` are the partner's centre-relative state at the same time.
 */
export function periodAboutBalanceS(
  r: ArrayLike<number>, v: ArrayLike<number>, centreGmKm3S2: number,
  balance: BalancePoint | undefined, isPartner: boolean, partnerR: ArrayLike<number>, partnerV: ArrayLike<number>,
): number {
  if (balance === undefined) return osculatingPeriodS(r, v, centreGmKm3S2);
  const gm = centreGmKm3S2 + balance.gmKm3S2;
  if (isPartner) return osculatingPeriodS(r, v, gm);
  const f = balanceShare(centreGmKm3S2, balance);
  return osculatingPeriodS([r[0] - f * partnerR[0], r[1] - f * partnerR[1], r[2] - f * partnerR[2]], [v[0] - f * partnerV[0], v[1] - f * partnerV[1], v[2] - f * partnerV[2]], gm);
}

/** How many phases of the orbit the mean motion is read at (equal spacing cancels the first and second harmonics of an eccentric orbit's rate). */
const MEAN_MOTION_PHASES = 4;
/** The short arc (a share of the first-guess period) each rate is measured over. */
const MEAN_MOTION_ARC = 1 / 256;

/**
 * The mean orbital period (s) of a body whose place (km about the line's centre) `positionInto` gives, found from its own motion: the angle it
 * sweeps over a short arc, read at four equally spaced phases back from `timeUtcMs` and averaged. An osculating period reads the instantaneous
 * state, which a perturbed orbit (Pluto's small moons, circling a binary) does not keep for a lap; this is the lap the line must span (I-056).
 * `guessS` (an osculating period) fixes the phase spacing and the arc and is returned when the arc cannot be read (the data does not reach back).
 */
export function meanPeriodS(positionInto: (timeUtcMs: number, out: Float64Array) => void, timeUtcMs: number, guessS: number): number {
  if (!(guessS > 0) || !Number.isFinite(guessS)) return guessS;
  const arcMs = Math.max(1, Math.round(guessS * 1000 * MEAN_MOTION_ARC));
  const a = new Float64Array(3);
  const b = new Float64Array(3);
  let rate = 0;
  try {
    for (let k = 0; k < MEAN_MOTION_PHASES; k += 1) {
      const at = Math.round(timeUtcMs - (k * guessS * 1000) / MEAN_MOTION_PHASES);
      positionInto(at - arcMs, a);
      positionInto(at, b);
      const cross = Math.hypot(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]);
      rate += Math.atan2(cross, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (arcMs / 1000);
    }
  } catch {
    return guessS;
  }
  return rate > 0 ? (2 * Math.PI * MEAN_MOTION_PHASES) / rate : guessS;
}
