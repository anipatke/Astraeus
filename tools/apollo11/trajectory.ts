import type { AstronomyAdapter } from "../../src/core/astronomyAdapter";
import type { NormalisedAnchor } from "./anchors";
import type { EarthState } from "./dynamics";
import { roundPosition, roundVelocity } from "./format";
import { buildSegment, parkingOrbitBackward, type Segment, type SegmentMethod } from "./segments";
import { earthStateAt, sampleSegment, type EarthSample, type SegmentSamples } from "./sampling";
import { norm, sub } from "./vec";

export interface VehiclePlan {
  readonly chain: readonly string[];
  readonly parking?: { readonly fromAnchor: string; readonly startUtcMs: number; readonly startLabel: string };
}

export interface PlanConfig {
  readonly poweredPairs: readonly (readonly string[])[];
  readonly specialPairs: Readonly<Record<string, string>>;
}

export interface BuiltVehicle {
  readonly segments: readonly SegmentSamples[];
  readonly samples: readonly EarthSample[];
  readonly anchorSampleIndex: ReadonlyMap<string, number>;
  readonly cutoffAnchorIds: ReadonlySet<string>;
}

/** Largest position (km) and velocity (m/s) step tolerated where one segment hands over to the next. */
const JOIN_TOLERANCE = { km: 1e-6, ms: 1e-6 };

function lookup(anchors: ReadonlyMap<string, NormalisedAnchor>, id: string): NormalisedAnchor {
  const anchor = anchors.get(id);
  if (anchor === undefined) throw new RangeError(`anchor ${id} is not in the normalised set`);
  return anchor;
}

export function planSegments(
  adapter: AstronomyAdapter,
  anchors: ReadonlyMap<string, NormalisedAnchor>,
  plan: VehiclePlan,
  config: PlanConfig,
): Segment[] {
  const powered = new Set(config.poweredPairs.map((pair) => pair.join(">")));
  const segments: Segment[] = [];
  if (plan.parking !== undefined) {
    segments.push(parkingOrbitBackward(adapter, plan.parking.startUtcMs, plan.parking.startLabel, lookup(anchors, plan.parking.fromAnchor)));
  }
  let startState: EarthState | undefined;
  for (let i = 0; i + 1 < plan.chain.length; i += 1) {
    const key = `${plan.chain[i]}>${plan.chain[i + 1]}`;
    const special = config.specialPairs[key] as SegmentMethod | undefined;
    const segment = buildSegment(adapter, lookup(anchors, plan.chain[i]), lookup(anchors, plan.chain[i + 1]), powered.has(key), special, startState);
    segments.push(segment);
    startState = segment.endState;
  }
  return segments;
}

/** Samples every segment and checks that each one ends on the anchor where the next one starts. */
export function buildVehicle(adapter: AstronomyAdapter, segments: readonly Segment[]): BuiltVehicle {
  const sampled = segments.map((segment, index) => sampleSegment(adapter, segment, index === segments.length - 1));
  const samples: EarthSample[] = [];
  const anchorSampleIndex = new Map<string, number>();
  const finalAnchor = segments[segments.length - 1].to;
  for (const entry of sampled) {
    const end = earthStateAt(adapter, entry.segment, entry.segment.endUtcMs);
    const stepKm = norm(sub(end.r, entry.segment.to.earthCentred.r));
    const stepMs = norm(sub(end.v, entry.segment.to.earthCentred.v)) * 1000;
    if (entry.segment.burn === undefined && (stepKm > JOIN_TOLERANCE.km || stepMs > JOIN_TOLERANCE.ms)) {
      throw new RangeError(`segment ${entry.segment.id} ends ${stepKm} km / ${stepMs} m/s from its end anchor`);
    }
    for (const sample of entry.samples) {
      if (entry.segment.from !== null && sample.timeUtcMs === entry.segment.startUtcMs) {
        anchorSampleIndex.set(entry.segment.from.id, samples.length);
      }
      samples.push(sample);
    }
  }
  anchorSampleIndex.set(finalAnchor.id, samples.length - 1);
  if (samples[samples.length - 1].timeUtcMs !== finalAnchor.timeUtcMs) {
    throw new RangeError("trajectory does not end on its final anchor");
  }
  const cutoffAnchorIds = new Set(segments.filter((segment) => segment.burn !== undefined).map((segment) => segment.to.id));
  return { segments: sampled, samples, anchorSampleIndex, cutoffAnchorIds };
}

/** The final anchor sample is the anchor itself, so the trajectory passes through it exactly. */
export function withFinalAnchor(built: BuiltVehicle, finalAnchor: NormalisedAnchor): EarthSample[] {
  const samples = [...built.samples];
  samples[samples.length - 1] = { timeUtcMs: finalAnchor.timeUtcMs, r: finalAnchor.earthCentred.r, v: finalAnchor.earthCentred.v };
  return samples;
}

/** Start anchors are emitted by their own segments; overwrite those samples with the converted anchor exactly. */
export function pinAnchors(
  samples: readonly EarthSample[],
  anchorIndex: ReadonlyMap<string, number>,
  anchors: ReadonlyMap<string, NormalisedAnchor>,
  cutoffAnchorIds: ReadonlySet<string> = new Set(),
): EarthSample[] {
  const pinned = [...samples];
  for (const [id, index] of anchorIndex) {
    if (cutoffAnchorIds.has(id)) continue;
    const anchor = lookup(anchors, id);
    pinned[index] = { timeUtcMs: anchor.timeUtcMs, r: anchor.earthCentred.r, v: anchor.earthCentred.v };
  }
  return pinned;
}

export function roundedSamples(samples: readonly EarthSample[]): {
  timeUtcMs: number;
  positionKm: number[];
  velocityKmS: number[];
}[] {
  return samples.map((s) => ({ timeUtcMs: s.timeUtcMs, positionKm: roundPosition(s.r), velocityKmS: roundVelocity(s.v) }));
}
