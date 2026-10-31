import type { LineStretch } from "../app/mission";

/**
 * Laplace's sphere of influence of a body about its parent: `r = a (m / M)^(2/5)`, `a` the body's distance from the parent, `m` and `M` their GMs (km^3/s^2).
 * Where either GM is missing or not above zero it returns NaN, so a body without a GM can never hold a probe.
 */
export function sphereOfInfluenceKm(gmKm3S2: number | undefined, parentGmKm3S2: number | undefined, distanceFromParentKm: number): number {
  if (!(typeof gmKm3S2 === "number" && gmKm3S2 > 0 && typeof parentGmKm3S2 === "number" && parentGmKm3S2 > 0)) return Number.NaN;
  return distanceFromParentKm * (gmKm3S2 / parentGmKm3S2) ** 0.4;
}

/** A body that can hold a probe: its sphere of influence and the probe's distance from it, at a time. A root body (no parent) holds everything (infinite radius). */
export interface InfluenceCandidate {
  readonly id: string;
  readonly radiusKm: (timeUtcMs: number) => number;
  readonly probeDistanceKm: (timeUtcMs: number) => number;
}

/** The candidate whose sphere holds the probe at `timeUtcMs`; the smallest sphere wins (a moon inside its planet's). */
export function innermostHolding(candidates: readonly InfluenceCandidate[], timeUtcMs: number): string | undefined {
  let best: string | undefined;
  let bestRadius = Infinity;
  for (const candidate of candidates) {
    const radius = candidate.radiusKm(timeUtcMs);
    if (!(radius >= candidate.probeDistanceKm(timeUtcMs)) || (best !== undefined && !(radius < bestRadius))) continue;
    best = candidate.id;
    bestRadius = radius;
  }
  return best;
}

/**
 * The stretch list for a path sampled at `timesUtcMs`: each sample belongs to the innermost holding body, consecutive samples on one body merge, and a stretch starts at its first
 * sample (so a boundary is within one sample of the true crossing) and ends where the next run starts, or at the path's last sample. Samples no body holds are left uncovered
 * (drawn against the scene centre). A run that would start at the last sample is dropped (it has no length).
 */
export function influenceStretches(timesUtcMs: readonly number[], candidates: readonly InfluenceCandidate[]): readonly LineStretch[] {
  const stretches: LineStretch[] = [];
  const end = timesUtcMs[timesUtcMs.length - 1];
  let open: { start: number; body: string } | undefined;
  const close = (until: number): void => {
    if (open !== undefined && until > open.start) stretches.push({ startUtcMs: open.start, endUtcMs: until, body: open.body });
    open = undefined;
  };
  for (const time of timesUtcMs) {
    const body = innermostHolding(candidates, time);
    if (open !== undefined && open.body === body) continue;
    close(time);
    if (body !== undefined) open = { start: time, body };
  }
  if (end !== undefined) close(end);
  return stretches;
}
