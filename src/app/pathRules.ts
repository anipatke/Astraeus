import type { CenterId } from "../core/body";
import type { ScalePolicy } from "../core/scalePolicy";
import { sceneOffsetKm, type ScenePlacement } from "./sceneLayout";

/** Sample times and the positions a state source gave at them (km, EQJ, about the source's own centre), 3 per time. */
export interface PathSamples {
  readonly timesUtcMs: readonly number[];
  readonly positionsKm: Float64Array;
}

const ZERO: ArrayLike<number> = Object.freeze([0, 0, 0]);

/** Maps physical positions (km, 3 per vertex) through the scale policy. */
export function mapPathKm(positionsKm: Float64Array, policy: ScalePolicy): Float64Array {
  const mapped = new Float64Array(positionsKm.length);
  for (let index = 0; index < positionsKm.length; index += 3) mapped.set(policy.mapPosition(positionsKm.subarray(index, index + 3)), index);
  return mapped;
}

/**
 * The three path rules. Each takes samples measured about `native` (the source's own centre) and uses only the resolver's
 * offsets, so a source need not be catalogued: it only has to say which catalogued body it is measured from.
 *
 * - orbit: every sample about its centre, the whole line carried to the centre's place from the scene centre at the clock time.
 * - relative trail: each sample from the scene centre at that sample's own time (what an observer riding the centre saw).
 * - inertial trail: each sample in the common root frame at its own time, then from the scene centre at the display time.
 */

/** Orbit: the samples (about `center`) plus the one vector from the scene centre to `center` at the clock time. Returns the input when that vector is zero. */
export function orbitKm(samplesKm: Float64Array, center: CenterId, placement: ScenePlacement, clockUtcMs: number): Float64Array {
  const offset = sceneOffsetKm(placement, center, clockUtcMs);
  return offset === null ? samplesKm : shiftedBy(samplesKm, offset);
}

/** Relative trail: sample i plus the scene centre's offset to `native` at time i. Returns the input when `native` is the scene centre. */
export function relativeTrailKm(samples: PathSamples, native: CenterId, placement: ScenePlacement): Float64Array {
  if (samples.timesUtcMs.length === 0 || native === placement.center) return samples.positionsKm;
  const out = Float64Array.from(samples.positionsKm);
  samples.timesUtcMs.forEach((time, index) => {
    const offset = placement.resolver.offsetKm(native, placement.center, time);
    for (let k = 0; k < 3; k += 1) out[index * 3 + k] += offset[k];
  });
  return out;
}

/** Inertial trail, first half: each sample in the root frame at its own time. Does not depend on the scene centre or the clock, so it is computed once. */
export function rootFrameKm(samples: PathSamples, native: CenterId, placement: ScenePlacement): Float64Array {
  const out = Float64Array.from(samples.positionsKm);
  samples.timesUtcMs.forEach((time, index) => {
    // The root seen from `native` is exactly the negation of `native` seen from the root.
    const root = placement.resolver.sunFrom(native, time).positionKm;
    for (let k = 0; k < 3; k += 1) out[index * 3 + k] -= root[k];
  });
  return out;
}

/** Inertial trail, second half: root-frame samples as seen from the scene centre at the display time. */
export function inertialTrailKm(rootKm: Float64Array, placement: ScenePlacement, displayUtcMs: number): Float64Array {
  return shiftedBy(rootKm, placement.resolver.sunFrom(placement.center, displayUtcMs).positionKm);
}

export function shiftedBy(positionsKm: Float64Array, offset: ArrayLike<number> = ZERO): Float64Array {
  const out = new Float64Array(positionsKm.length);
  for (let i = 0; i < out.length; i += 3) {
    out[i] = positionsKm[i] + offset[0];
    out[i + 1] = positionsKm[i + 1] + offset[1];
    out[i + 2] = positionsKm[i + 2] + offset[2];
  }
  return out;
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

/**
 * Whether a rolling-window path must be resampled. `centerUtcMs` is the clock time its samples were centred on (null: none yet),
 * `windowMs` its width. A seek past a quarter window rebuilds at once; a slow drift rebuilds at most every `minRealIntervalMs`.
 */
export function pathNeedsRefresh(
  centerUtcMs: number | null,
  windowMs: number,
  timeUtcMs: number,
  realNowMs: number,
  lastBuildRealMs: number,
  policy: PathRefreshPolicy = DEFAULT_PATH_REFRESH,
): boolean {
  if (centerUtcMs === null) return true;
  const drift = Math.abs(timeUtcMs - centerUtcMs);
  if (drift > windowMs / 4) return true; // seek: the old window no longer brackets the date
  return drift > policy.maxDriftMs && realNowMs - lastBuildRealMs >= policy.minRealIntervalMs;
}

/**
 * Opacity shapes (0 to 1) of the two layers of an orbit line over `count` evenly spaced vertices of a window, the body at the middle vertex.
 * `ring`: nothing at both ends rising smoothly to full by `endFade` of the way in. `arc`: the vertices from the body back over
 * `arcFraction` of `periodFraction` of the window (the period as a share of the window), 1 at the body falling to 0 at the tail as
 * (1 - along)^exponent; 0 elsewhere. `arcFirst`/`arcCount` give the arc's vertex range.
 */
export function orbitLookShapes(count: number, endFadeFraction: number, arcFraction: number, exponent: number, periodShare = 1): { readonly ring: Float32Array; readonly arc: Float32Array; readonly arcFirst: number; readonly arcCount: number } {
  const ring = new Float32Array(count).fill(1);
  if (endFadeFraction > 0 && count >= 2) {
    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1);
      const x = Math.min(1, Math.min(t, 1 - t) / endFadeFraction);
      ring[i] = x * x * (3 - 2 * x);
    }
  }
  const body = (count - 1) / 2;
  const segments = Math.min(body, Math.round(arcFraction * periodShare * (count - 1)));
  const arc = new Float32Array(count);
  for (let k = 0; k <= segments; k += 1) arc[body - k] = segments === 0 ? 1 : (1 - k / segments) ** exponent;
  return { ring, arc, arcFirst: body - segments, arcCount: segments + 1 };
}
