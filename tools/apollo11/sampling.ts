import type { AstronomyAdapter } from "../../src/core/astronomyAdapter";
import { SampledTrajectory } from "../../src/core/sampledTrajectory";
import { NUMERICS } from "./conventions";
import { toEarthCentred } from "./ephemeris";
import type { Segment } from "./segments";
import { norm, sub, type Vec3 } from "./vec";

export interface EarthSample {
  readonly timeUtcMs: number;
  readonly r: Vec3;
  readonly v: Vec3;
}

export interface SegmentSamples {
  readonly segment: Segment;
  /** Samples in time order, excluding the segment's end anchor unless the segment is the trajectory's last. */
  readonly samples: readonly EarthSample[];
  readonly intervalS: number;
  readonly interpolationMaxKm: number;
  readonly interpolationMaxMs: number;
  /** Raw miss: the unsmoothed propagation from the start anchor against the end anchor; zero for arcs that reach it by construction. */
  readonly endMissKm: number;
  readonly endMissMs: number;
}

export function earthStateAt(adapter: AstronomyAdapter, segment: Segment, timeUtcMs: number): EarthSample {
  const state = toEarthCentred(adapter, segment.generate(timeUtcMs), timeUtcMs);
  return { timeUtcMs, r: state.r, v: state.v };
}

/** Times from the segment start in whole intervals, stopping before `lastMs`, then `lastMs` itself. */
function gridTimes(startMs: number, lastMs: number, intervalMs: number, includeLast: boolean): number[] {
  const times: number[] = [];
  for (let t = startMs; t < lastMs; t += intervalMs) times.push(t);
  if (includeLast) times.push(lastMs);
  return times;
}

function interpolationError(
  adapter: AstronomyAdapter,
  segment: Segment,
  samples: readonly EarthSample[],
): { maxKm: number; maxMs: number } {
  if (samples.length < 2) return { maxKm: 0, maxMs: 0 };
  const trajectory = new SampledTrajectory({
    body: "check",
    center: "earth",
    samples: samples.map((s) => ({ timeUtcMs: s.timeUtcMs, positionKm: s.r, velocityKmS: s.v })),
  });
  let maxKm = 0;
  let maxMs = 0;
  for (let i = 0; i + 1 < samples.length; i += 1) {
    const middle = Math.floor((samples[i].timeUtcMs + samples[i + 1].timeUtcMs) / 2);
    if (middle === samples[i].timeUtcMs) continue;
    const truth = earthStateAt(adapter, segment, middle);
    const state = trajectory.stateAt(middle);
    maxKm = Math.max(maxKm, norm(sub(truth.r, state.positionKm as unknown as Vec3)));
    maxMs = Math.max(maxMs, norm(sub(truth.v, state.velocityKmS as unknown as Vec3)) * 1000);
  }
  return { maxKm, maxMs };
}

function rawMiss(segment: Segment): { km: number; ms: number } {
  if (segment.smoothing === undefined) return { km: 0, ms: 0 };
  const end = segment.smoothing.unsmoothed(segment.endUtcMs);
  return { km: norm(sub(end.r, segment.to.earthCentred.r)), ms: norm(sub(end.v, segment.to.earthCentred.v)) * 1000 };
}

/** Largest ladder interval whose held-out midpoint error is within the target; the smallest if none is. */
export function sampleSegment(adapter: AstronomyAdapter, segment: Segment, isFinal: boolean): SegmentSamples {
  const ladder = NUMERICS.sampleIntervalLadderS;
  let chosen: { intervalS: number; samples: EarthSample[]; error: { maxKm: number; maxMs: number } } | null = null;
  for (const intervalS of ladder) {
    const times = gridTimes(segment.startUtcMs, segment.endUtcMs, intervalS * 1000, isFinal);
    const samples = times.map((t) => earthStateAt(adapter, segment, t));
    // The end anchor is emitted by the next segment, but the interval before it still has to be measured.
    const checked = isFinal ? samples : [...samples, earthStateAt(adapter, segment, segment.endUtcMs)];
    chosen = { intervalS, samples, error: interpolationError(adapter, segment, checked) };
    if (chosen.error.maxKm <= NUMERICS.interpolationTargetKm) break;
  }
  if (chosen === null) throw new RangeError("no sample interval candidates configured");
  const miss = rawMiss(segment);
  return {
    segment,
    samples: chosen.samples,
    intervalS: chosen.intervalS,
    interpolationMaxKm: chosen.error.maxKm,
    interpolationMaxMs: chosen.error.maxMs,
    endMissKm: miss.km,
    endMissMs: miss.ms,
  };
}
