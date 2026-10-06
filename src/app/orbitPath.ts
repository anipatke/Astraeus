import type { Trajectory } from "../core/trajectory";
import type { ScalePolicy } from "../core/scalePolicy";
import { assertUtcUnixMs } from "../core/state";

export const SIDEREAL_MONTH_MS = 27.321661 * 86_400_000;
export const DEFAULT_PATH_SAMPLES = 181;

export interface OrbitPathSamples {
  readonly centerUtcMs: number;
  readonly timesUtcMs: readonly number[];
  /** Scientific Moon-from-Earth positions in km, three values per sample. */
  readonly positionsKm: Float64Array;
}

/**
 * Samples the very same trajectory used for the Moon over one sidereal month centred on the
 * selected timestamp. The window is open: the first and last samples are not joined. The
 * selected timestamp is always one of the samples.
 */
export function sampleOrbitPath(
  trajectory: Trajectory,
  centerUtcMs: number,
  windowMs: number = SIDEREAL_MONTH_MS,
  sampleCount: number = DEFAULT_PATH_SAMPLES,
): OrbitPathSamples {
  assertUtcUnixMs(centerUtcMs);
  if (!Number.isInteger(sampleCount) || sampleCount < 3 || sampleCount % 2 === 0) {
    throw new RangeError("sampleCount must be an odd integer of at least 3 so the centre is a sample");
  }
  const half = (sampleCount - 1) / 2;
  const timesUtcMs: number[] = [];
  const positionsKm = new Float64Array(sampleCount * 3);
  for (let index = 0; index < sampleCount; index += 1) {
    const timeUtcMs = index === half
      ? centerUtcMs
      : Math.round(centerUtcMs + ((index - half) / half) * (windowMs / 2));
    const state = trajectory.stateAt(timeUtcMs, "earth");
    timesUtcMs.push(timeUtcMs);
    positionsKm.set(state.positionKm, index * 3);
  }
  return Object.freeze({ centerUtcMs, timesUtcMs, positionsKm });
}

/** Maps physical samples through the scale policy. Existing samples are remapped on scale changes. */
export function mapOrbitPath(samples: Pick<OrbitPathSamples, "timesUtcMs" | "positionsKm">, policy: ScalePolicy): Float64Array {
  const mapped = new Float64Array(samples.positionsKm.length);
  for (let index = 0; index < samples.timesUtcMs.length; index += 1) {
    mapped.set(policy.mapPosition(samples.positionsKm.subarray(index * 3, index * 3 + 3)), index * 3);
  }
  return mapped;
}

export interface PathRefreshPolicy {
  /** Sim-time drift from the sampled centre that triggers a rebuild. */
  readonly maxDriftMs: number;
  /** Minimum real time between rebuilds so high playback rates stay affordable. */
  readonly minRealIntervalMs: number;
}

export const DEFAULT_PATH_REFRESH: PathRefreshPolicy = Object.freeze({
  maxDriftMs: 3_600_000,
  minRealIntervalMs: 250,
});

export function pathNeedsRefresh(
  samples: OrbitPathSamples | null,
  timeUtcMs: number,
  realNowMs: number,
  lastBuildRealMs: number,
  policy: PathRefreshPolicy = DEFAULT_PATH_REFRESH,
): boolean {
  if (samples === null) return true;
  const drift = Math.abs(timeUtcMs - samples.centerUtcMs);
  if (drift > SIDEREAL_MONTH_MS / 4) return true; // seek: the old window no longer brackets the date
  return drift > policy.maxDriftMs && realNowMs - lastBuildRealMs >= policy.minRealIntervalMs;
}
