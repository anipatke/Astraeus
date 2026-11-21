const TWO_PI = 2 * Math.PI;
const MAX_STEPS = 100;

/** Raised for an eccentricity outside [0, 1): a bound orbit is the only one the elliptic solve can place. */
export class KeplerEccentricityError extends RangeError {
  constructor(eccentricity: number) {
    super(`the Kepler solve needs an eccentricity of at least 0 and below 1, not ${eccentricity}`);
    this.name = "KeplerEccentricityError";
  }
}

/**
 * Solves Kepler's equation M = E - e sin E for the eccentric anomaly E (radians), for any e in [0, 1) and any mean anomaly. The mean
 * anomaly is wrapped to (-pi, pi] and E comes back in the same range. E - e sin E rises with E, so the root of |M| sits inside
 * [0, pi]; Newton's method runs inside that bracket and any step that leaves it is replaced by a bisection, so the loop converges
 * even where 1 - e cos E is nearly zero (near periapsis of a near-parabolic orbit). The start is the cube-root approximation
 * E ~ (6 M)^(1/3) for e above 0.8, which cannot overshoot far, and M itself otherwise. It stops on a residual or step at rounding.
 */
export function eccentricAnomalyFromMean(meanRad: number, eccentricity: number): number {
  if (!(eccentricity >= 0 && eccentricity < 1)) throw new KeplerEccentricityError(eccentricity);
  const wrapped = meanRad - TWO_PI * Math.ceil((meanRad - Math.PI) / TWO_PI);
  const m = Math.abs(wrapped);
  if (m === 0 || eccentricity === 0) return wrapped;
  let low = 0;
  let high = Math.PI;
  let anomaly = Math.min(Math.PI, eccentricity < 0.8 ? m : Math.cbrt(6 * m));
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const residual = anomaly - eccentricity * Math.sin(anomaly) - m;
    if (residual === 0) break;
    if (residual > 0) high = anomaly;
    else low = anomaly;
    let next = anomaly - residual / (1 - eccentricity * Math.cos(anomaly));
    if (!(next > low && next < high)) next = (low + high) / 2;
    const change = Math.abs(next - anomaly);
    anomaly = next;
    if (change <= 4e-16 * anomaly || high - low <= 4e-16 * anomaly) break;
  }
  return wrapped < 0 ? -anomaly : anomaly;
}

/** Solves Kepler's equation for the true anomaly (radians) from the mean anomaly (radians). */
export function trueAnomalyFromMean(meanRad: number, eccentricity: number): number {
  const eccentric = eccentricAnomalyFromMean(meanRad, eccentricity);
  return 2 * Math.atan2(
    Math.sqrt(1 + eccentricity) * Math.sin(eccentric / 2),
    Math.sqrt(1 - eccentricity) * Math.cos(eccentric / 2),
  );
}
