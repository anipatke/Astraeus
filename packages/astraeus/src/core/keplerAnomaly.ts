/** Solves Kepler's equation for the true anomaly (radians) from the mean anomaly (radians). */
export function trueAnomalyFromMean(meanRad: number, eccentricity: number): number {
  let eccentric = meanRad + eccentricity * Math.sin(meanRad);
  for (let step = 0; step < 50; step += 1) {
    eccentric -= (eccentric - eccentricity * Math.sin(eccentric) - meanRad) / (1 - eccentricity * Math.cos(eccentric));
  }
  return 2 * Math.atan2(
    Math.sqrt(1 + eccentricity) * Math.sin(eccentric / 2),
    Math.sqrt(1 - eccentricity) * Math.cos(eccentric / 2),
  );
}
