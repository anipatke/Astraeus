import type { AstronomyAdapter } from "../../src/core/astronomyAdapter";
import { createEvents } from "../../src/core/events";
import { SampledTrajectory } from "../../src/core/sampledTrajectory";
import { liftoffAnchor, normaliseAnchor, type NormalisedAnchor, type RawAnchor } from "./anchors";
import config from "./config.json";
import { CONSTANTS, getToUtcMs } from "./conventions";
import { formatJson, roundPosition, roundTo, roundVelocity } from "./format";
import { buildVehicle, pinAnchors, planSegments, roundedSamples, type VehiclePlan } from "./trajectory";
import {
  anchorResiduals,
  burnPeakSpeedKmS,
  consistencyTable,
  landingSiteOffset,
  oneSecondSpeedScan,
  orbitCrossChecks,
  qualitativeChecks,
  surfaceClearance,
} from "./validation";
import { renderReport } from "./report";
import type { SegmentSamples } from "./sampling";

export interface RawEvent {
  readonly id: string;
  readonly category: string;
  readonly label: string;
  readonly vehicle: string;
  readonly get_printed: string;
}

export interface RawInputs {
  readonly anchors: { readonly anchors: readonly RawAnchor[] };
  readonly events: { readonly range_zero_gmt: string; readonly events: readonly RawEvent[] };
}

export type OutputFiles = Readonly<Record<string, string>>;

const SOURCES = [
  "NASA Apollo 11 Mission Report, MSC-00171 / SP-238 (NTRS 19700008096): Table 7-II, Table 7-VII, Table 5-IV, Table 3-I",
  "docs/APOLLO11_SOURCES.md (conventions)",
  "Astraeus Moon state (@lizard-isana/orb) for Moon-to-Earth normalisation",
];

const PROVENANCE = {
  sourceType: "reconstructed",
  sources: SOURCES,
  accuracy:
    "Passes through every non-cutoff NASA anchor state by construction. Ordinary burns are integrated offline from their ignition anchors with Earth (J2), Moon and Sun gravity plus a constant EQJ acceleration fitted to the cutoff velocity; each cutoff position and velocity residual and runtime peak speed are published. The following coast starts from the modelled cutoff state. Coasts integrate the same gravity model; each remaining miss at its next anchor is published as rawMissKm/rawMissMs and spread smoothly along that coast (smoothstep blend of forward and backward propagations), so joins have no steps. The correction is a presentation repair, not physics. Moon-referenced flight-path angle and heading use Earth-equatorial (EQJ) north, adopted from data consistency rather than a printed definition. A-05, A-33 and A-34 use owner-approved inferred overrides. Not navigation grade.",
  notes:
    "Reconstruction of the Apollo 11 flight path from sparse NASA postflight anchor states; not the exact flight path. Ordinary burns use a constant-acceleration physical segment fitted to cutoff velocity; this is not guidance. Powered descent and ascent remain two-anchor interpolations.",
} as const;

/** Raw miss and the largest correction smoothing applied, for smoothed coasts only. */
function smoothingFields(entry: SegmentSamples) {
  const smoothing = entry.segment.smoothing;
  if (smoothing === undefined) return {};
  return {
    smoothedAbout: smoothing.centre,
    rawMissKm: roundTo(entry.endMissKm, 3),
    rawMissMs: roundTo(entry.endMissMs, 3),
    maxCorrectionKm: roundTo(smoothing.maxCorrectionKm, 3),
    maxCorrectionMs: roundTo(smoothing.maxCorrectionMs, 3),
  };
}

function vehicleFile(
  name: string,
  title: string,
  built: ReturnType<typeof buildVehicle>,
  samples: ReturnType<typeof roundedSamples>,
  anchors: ReadonlyMap<string, NormalisedAnchor>,
  burnPeakSpeedsKmS: ReadonlyMap<string, number>,
): string {
  const anchorRows = [...built.anchorSampleIndex]
    .map(([id, sampleIndex]) => ({ id, timeUtcMs: anchors.get(id)!.timeUtcMs, sampleIndex }))
    .sort((a, b) => a.sampleIndex - b.sampleIndex);
  let cursor = 0;
  const segmentRows = built.segments.map((entry) => {
    const row = {
      id: entry.segment.id,
      method: entry.segment.method,
      startUtcMs: entry.segment.startUtcMs,
      endUtcMs: entry.segment.endUtcMs,
      intervalS: entry.intervalS,
      firstSampleIndex: cursor,
      sampleCount: entry.samples.length,
      ...smoothingFields(entry),
      ...(entry.segment.burn === undefined ? {} : {
        constantAccelerationKmS2: entry.segment.burn.constantAccelerationKmS2.map((x) => roundTo(x, 12)),
        cutoffPositionResidualKm: roundTo(entry.segment.burn.cutoffPositionResidualKm, 6),
        cutoffVelocityResidualMs: roundTo(entry.segment.burn.cutoffVelocityResidualMs, 6),
        speedReferenceBody: entry.segment.from!.refBody,
        peakSpeedKmS: burnPeakSpeedsKmS.get(entry.segment.id),
      }),
    };
    cursor += entry.samples.length;
    return row;
  });
  return formatJson(
    {
      metadata: {
        mission: "Apollo 11",
        vehicle: title,
        body: name,
        kind: "reconstructed",
        frame: "EQJ",
        center: "earth",
        units: { position: "km", velocity: "km/s", time: "UTC Unix ms" },
        startUtcMs: samples[0].timeUtcMs,
        endUtcMs: samples[samples.length - 1].timeUtcMs,
        sampleCount: samples.length,
        interpolation: "cubic Hermite (positions and velocities)",
      },
      provenance: PROVENANCE,
      segments: segmentRows,
      anchors: anchorRows,
      // Coasts are smoothed onto their end anchors, so no steps remain; buildVehicle throws if one does.
      discontinuities: [],
      samples,
    },
    ["segments", "anchors", "discontinuities", "samples"],
  );
}

function normalisedAnchorsFile(anchors: readonly NormalisedAnchor[], rangeZeroGmt: string): string {
  const suspect = new Set(config.suspectAnchors.ids);
  return formatJson(
    {
      description:
        "Apollo 11 anchors converted to Cartesian EQJ states. 'native' is about the anchor's own reference body (Earth or Moon); 'earthCentred' adds the Astraeus Moon state at the same instant. Generated by tools/apollo11; do not edit.",
      rangeZeroGmt,
      rangeZeroUtcMs: CONSTANTS.rangeZeroUtcMs,
      conventions: "docs/APOLLO11_SOURCES.md section 4",
      anchors: anchors.map((a) => ({
        id: a.id,
        event: a.event,
        vehicle: a.vehicle,
        phase: a.phase,
        getPrinted: a.getPrinted,
        timeUtcMs: a.timeUtcMs,
        refBody: a.refBody,
        surfaceFixed: a.surfaceFixed,
        source: a.source,
        flags: a.inferredOverride !== undefined ? ["inferred-override"] : suspect.has(a.id) ? ["suspected-transcription-error"] : [],
        ...(a.inferredOverride === undefined ? {} : { inferredOverride: a.inferredOverride }),
        inputs: {
          latitudeDeg: a.inputs.latitudeDeg,
          longitudeDeg: a.inputs.longitudeDeg,
          altitudeKm: roundTo(a.inputs.altitudeKm, 6),
          inertialSpeedKmS: roundTo(a.inputs.inertialSpeedKmS, 9),
          flightPathAngleDeg: a.inputs.flightPathAngleDeg,
          headingDeg: a.inputs.headingDeg,
        },
        native: { center: a.native.center, positionKm: roundPosition(a.native.r), velocityKmS: roundVelocity(a.native.v) },
        earthCentred: { positionKm: roundPosition(a.earthCentred.r), velocityKmS: roundVelocity(a.earthCentred.v) },
        printRoundingUncertainty: {
          positionKm: roundTo(a.printRoundingUncertainty.positionKm, 3),
          velocityMs: roundTo(a.printRoundingUncertainty.velocityMs, 3),
        },
      })),
    },
    ["anchors"],
  );
}

function eventsFile(raw: RawInputs["events"]): string {
  const events = raw.events
    .map((event) => ({
      timeUtcMs: getToUtcMs(event.get_printed),
      id: event.id,
      label: event.label,
      type: event.category,
      vehicle: event.vehicle,
      getPrinted: event.get_printed,
    }))
    .sort((a, b) => a.timeUtcMs - b.timeUtcMs || a.id.localeCompare(b.id));
  createEvents(events);
  return formatJson({ rangeZeroGmt: raw.range_zero_gmt, events }, ["events"]);
}

/** Runs the whole offline pipeline; pure apart from the adapter, so identical inputs give identical files. */
export function reconstruct(adapter: AstronomyAdapter, raw: RawInputs): { files: OutputFiles; validation: ReturnType<typeof buildValidation> } {
  if (Date.parse(raw.events.range_zero_gmt) !== CONSTANTS.rangeZeroUtcMs) {
    throw new RangeError("configured range zero does not match events.json range_zero_gmt");
  }
  const anchors = new Map<string, NormalisedAnchor>();
  for (const anchor of raw.anchors.anchors) anchors.set(anchor.id, normaliseAnchor(adapter, anchor));
  const liftoffEvent = raw.events.events.find((event) => event.id === config.liftoff.eventId);
  const touchdown = anchors.get(config.liftoff.surfaceAnchorId);
  const insertionEvent = raw.events.events.find((event) => event.id === config.parkingOrbit.startEventId);
  if (liftoffEvent === undefined || touchdown === undefined || insertionEvent === undefined) {
    throw new RangeError("raw data is missing the lift-off event, the touchdown anchor or the orbit insertion event");
  }
  anchors.set(
    config.liftoff.anchorId,
    liftoffAnchor(adapter, touchdown, config.liftoff.anchorId, getToUtcMs(liftoffEvent.get_printed), liftoffEvent.label, liftoffEvent.get_printed),
  );

  const plans: Record<string, VehiclePlan> = {
    columbia: {
      chain: config.vehicles.columbia.chain,
      parking: {
        fromAnchor: config.parkingOrbit.fromAnchor,
        startUtcMs: getToUtcMs(insertionEvent.get_printed),
        startLabel: insertionEvent.id,
      },
    },
    eagle: { chain: config.vehicles.eagle.chain },
  };
  const built = Object.fromEntries(
    Object.entries(plans).map(([name, plan]) => {
      const segments = planSegments(adapter, anchors, plan, config);
      return [name, { segments, vehicle: buildVehicle(adapter, segments) }];
    }),
  );
  const finals = Object.fromEntries(
    Object.entries(built).map(([name, entry]) => {
      const samples = pinAnchors(entry.vehicle.samples, entry.vehicle.anchorSampleIndex, anchors, entry.vehicle.cutoffAnchorIds);
      return [name, roundedSamples(samples)];
    }),
  );
  const trajectories = Object.fromEntries(
    Object.entries(finals).map(([name, samples]) => [name, new SampledTrajectory({ body: name, center: "earth", samples })]),
  );

  const validation = buildValidation(adapter, anchors, plans, built, trajectories);
  const burnPeakSpeedsById = new Map<string, number>();
  for (const row of validation.segments) {
    if ("peakSpeedKmS" in row && row.peakSpeedKmS !== undefined) burnPeakSpeedsById.set(row.id, row.peakSpeedKmS);
  }
  const files: Record<string, string> = {
    "data/apollo11/normalised/anchors.json": normalisedAnchorsFile(
      [...anchors.values()].sort((a, b) => a.timeUtcMs - b.timeUtcMs || a.id.localeCompare(b.id)),
      raw.events.range_zero_gmt,
    ),
    "data/apollo11/generated/columbia.json": vehicleFile("columbia", "Columbia (CSM)", built.columbia.vehicle, finals.columbia, anchors, burnPeakSpeedsById),
    "data/apollo11/generated/eagle.json": vehicleFile("eagle", "Eagle (LM)", built.eagle.vehicle, finals.eagle, anchors, burnPeakSpeedsById),
    "data/apollo11/generated/events.json": eventsFile(raw.events),
    "data/apollo11/generated/validation.json": formatJson(validation as unknown as Record<string, unknown>, []),
    "docs/APOLLO11_RECONSTRUCTION.md": renderReport(validation, anchors),
  };
  return { files, validation };
}

export type Validation = ReturnType<typeof buildValidation>;

function buildValidation(
  adapter: AstronomyAdapter,
  anchors: ReadonlyMap<string, NormalisedAnchor>,
  plans: Record<string, VehiclePlan>,
  built: Record<string, { segments: ReturnType<typeof planSegments>; vehicle: ReturnType<typeof buildVehicle> }>,
  trajectories: Record<string, SampledTrajectory>,
) {
  const residuals = Object.entries(plans).flatMap(([name, plan]) =>
    anchorResiduals(name, trajectories[name], [...new Set(plan.chain)], anchors),
  );
  const segments = Object.entries(built).flatMap(([name, entry]) =>
    entry.vehicle.segments.map((s) => ({
      vehicle: name,
      id: s.segment.id,
      method: s.segment.method,
      startUtcMs: s.segment.startUtcMs,
      endUtcMs: s.segment.endUtcMs,
      endAnchorId: s.segment.to.id,
      intervalS: s.intervalS,
      sampleCount: s.samples.length,
      endMissKm: roundTo(s.endMissKm, 3),
      endMissMs: roundTo(s.endMissMs, 3),
      ...smoothingFields(s),
      ...(s.segment.burn === undefined ? {} : {
        constantAccelerationKmS2: s.segment.burn.constantAccelerationKmS2.map((x) => roundTo(x, 12)),
        cutoffPositionResidualKm: roundTo(s.segment.burn.cutoffPositionResidualKm, 6),
        cutoffVelocityResidualMs: roundTo(s.segment.burn.cutoffVelocityResidualMs, 6),
        speedReferenceBody: s.segment.from!.refBody,
        peakSpeedKmS: burnPeakSpeedKmS(adapter, trajectories[name], s.segment),
      }),
      interpolationMaxKm: roundTo(s.interpolationMaxKm, 4),
      interpolationMaxMs: roundTo(s.interpolationMaxMs, 4),
    })),
  );
  const touchdown = anchors.get(config.liftoff.surfaceAnchorId)!;
  const liftoff = anchors.get(config.liftoff.anchorId)!;
  return {
    generatedBy: "tools/apollo11 (npm run apollo11:reconstruct)",
    targets: { anchorPositionKm: 1, anchorVelocityMs: 1, interpolationKm: 1, selectionThresholdKm: 0.25 },
    smoothingReportThreshold: config.smoothingReportThreshold,
    suspectAnchors: config.suspectAnchors,
    sampleCounts: Object.fromEntries(Object.entries(trajectories).map(([k, t]) => [k, { startUtcMs: t.bounds.startUtcMs, endUtcMs: t.bounds.endUtcMs }])),
    anchorResiduals: residuals,
    segments,
    oneSecondSpeedScan: Object.fromEntries(Object.entries(trajectories).map(([name, trajectory]) => [name, oneSecondSpeedScan(trajectory)])),
    consistency: consistencyTable(adapter, anchors),
    orbitCrossChecks: orbitCrossChecks(anchors),
    qualitative: qualitativeChecks({
      adapter,
      anchors,
      columbia: trajectories.columbia,
      eagle: trajectories.eagle,
      columbiaSegments: built.columbia.segments,
    }),
    surfaceClearance: surfaceClearance(built.eagle.segments),
    landingSiteOffset: [touchdown, liftoff].map((anchor) => landingSiteOffset(adapter, touchdown, anchor.timeUtcMs)),
  };
}
