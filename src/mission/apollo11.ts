import columbiaFile from "../../data/apollo11/generated/columbia.json";
import eagleFile from "../../data/apollo11/generated/eagle.json";
import eventsFile from "../../data/apollo11/generated/events.json";
import { createEvents, type TimelineEvent } from "../core/events";
import type { Provenance } from "../core/provenance";
import { SampledTrajectory, type TrajectorySample } from "../core/sampledTrajectory";
import type { MissionConfig, PositionDiscrepancy, TrackedBody } from "../app/mission";
import type { ExperienceConfig } from "../shell/experience";

/** The wording the brief requires; never describe the path as exact. */
export const APOLLO11_STATEMENT =
  "Apollo 11 educational trajectory reconstruction based on NASA postflight trajectory data";

export const APOLLO11_NOTES: readonly string[] = [
  "Lines are reconstructed samples; round dots are NASA source anchors.",
  "Spacecraft marker size is exaggerated for visibility and is not to scale.",
  "Launch and splashdown are events only; vehicles are drawn between their sampled bounds.",
];

const RATES: readonly number[] = [1, 100, 1_000, 10_000];

interface GeneratedSegment {
  readonly method: string;
  readonly startUtcMs: number;
  readonly endUtcMs: number;
  readonly maxCorrectionKm?: number;
  readonly cutoffPositionResidualKm?: number;
}

interface GeneratedFile {
  readonly provenance: Provenance;
  readonly segments: readonly GeneratedSegment[];
  readonly anchors: readonly { readonly id: string; readonly timeUtcMs: number }[];
  readonly samples: readonly TrajectorySample[];
}

interface GeneratedEvents {
  readonly events: readonly (TimelineEvent & { readonly getPrinted: string })[];
}

/** The reconstruction's own per-segment figure: a coast's smoothing correction or a burn's cutoff miss. */
function discrepancyOf(segment: GeneratedSegment): PositionDiscrepancy {
  const { startUtcMs, endUtcMs } = segment;
  if (segment.maxCorrectionKm !== undefined) {
    return { startUtcMs, endUtcMs, km: segment.maxCorrectionKm, basis: "largest smoothing correction on this coast" };
  }
  if (segment.cutoffPositionResidualKm !== undefined) {
    return { startUtcMs, endUtcMs, km: segment.cutoffPositionResidualKm, basis: "modelled burn cutoff miss against the NASA anchor" };
  }
  return { startUtcMs, endUtcMs, km: null, basis: `no figure published (${segment.method})` };
}

function trackedBody(id: string, label: string, color: string, file: GeneratedFile): TrackedBody {
  const trajectory = new SampledTrajectory({
    body: id,
    center: "earth",
    samples: file.samples,
    provenance: file.provenance,
  });
  return {
    id,
    label,
    color,
    trajectory,
    pathTimesUtcMs: file.samples.map((sample) => sample.timeUtcMs),
    anchorTimesUtcMs: file.anchors.map((anchor) => anchor.timeUtcMs),
    anchorLabels: file.anchors.map((anchor) => anchor.id),
    positionDiscrepancies: file.segments.map(discrepancyOf),
  };
}

export function buildApollo11Mission(
  columbia: GeneratedFile = columbiaFile as unknown as GeneratedFile,
  eagle: GeneratedFile = eagleFile as unknown as GeneratedFile,
  eventList: GeneratedEvents = eventsFile as unknown as GeneratedEvents,
): MissionConfig {
  const events = createEvents(eventList.events.map((event) => ({
    timeUtcMs: event.timeUtcMs,
    id: event.id,
    label: `GET ${event.getPrinted} · ${event.label}`,
    ...(event.type === undefined ? {} : { type: event.type }),
  })));
  return {
    title: APOLLO11_STATEMENT,
    notes: APOLLO11_NOTES,
    bodies: [
      trackedBody("columbia", "Columbia (CSM)", "#7fd4ff", columbia),
      trackedBody("eagle", "Eagle (LM)", "#ffb347", eagle),
    ],
    events,
    window: { startUtcMs: events[0].timeUtcMs, endUtcMs: events[events.length - 1].timeUtcMs },
    rates: RATES,
    journey: { start: "lift-off", end: "splashdown" },
  };
}

export const apollo11Mission: MissionConfig = buildApollo11Mission();

/** Shell-facing labels and timeline data projected from the existing Apollo scene config. */
export const apollo11Experience: ExperienceConfig = {
  objects: [
    { id: "earth", label: "Earth", color: "#9fd8ff", labelPriority: 100, labelMaxDistance: 500 },
    { id: "moon", label: "Moon", color: "#ded7cc", labelPriority: 90, labelMaxDistance: 500 },
    ...apollo11Mission.bodies.map(({ id, label, color, trajectory }) => ({
      id,
      label,
      color,
      availability: trajectory.bounds,
      labelPriority: 80,
      labelMaxDistance: 4,
    })),
  ],
  cameraPresets: [
    { id: "overview", label: "Earth–Moon overview", request: { kind: "overview" } },
    ...apollo11Mission.bodies.map(({ id, label }) => ({
      id: `focus-${id}`,
      label: `Focus ${label}`,
      request: { kind: "focus" as const, target: id },
    })),
    ...apollo11Mission.bodies.map(({ id, label }) => ({
      id: `follow-${id}`,
      label: `Follow ${label}`,
      request: { kind: "follow" as const, target: id },
    })),
    { id: "focus-earth", label: "Focus Earth", request: { kind: "focus", target: "earth" } },
    { id: "focus-moon", label: "Focus Moon", request: { kind: "focus", target: "moon" } },
  ],
  events: apollo11Mission.events,
  window: apollo11Mission.window,
  rates: apollo11Mission.rates,
};
