import columbiaFile from "../../data/apollo11/generated/columbia.json";
import eagleFile from "../../data/apollo11/generated/eagle.json";
import eventsFile from "../../data/apollo11/generated/events.json";
import { createEvents, type TimelineEvent } from "../core/events";
import type { Provenance } from "../core/provenance";
import { SampledTrajectory, type TrajectorySample } from "../core/sampledTrajectory";
import type { MissionConfig, TrackedBody } from "../app/mission";

/** The wording the brief requires; never describe the path as exact. */
export const APOLLO11_STATEMENT =
  "Apollo 11 educational trajectory reconstruction based on NASA postflight trajectory data";

export const APOLLO11_NOTES: readonly string[] = [
  "Lines are reconstructed samples; round dots are NASA source anchors.",
  "Spacecraft marker size is exaggerated for visibility and is not to scale.",
  "Launch and splashdown are events only; vehicles are drawn between their sampled bounds.",
];

const RATES: readonly number[] = [1, 100, 1_000, 10_000];

interface GeneratedFile {
  readonly provenance: Provenance;
  readonly anchors: readonly { readonly id: string; readonly timeUtcMs: number }[];
  readonly samples: readonly TrajectorySample[];
}

interface GeneratedEvents {
  readonly events: readonly (TimelineEvent & { readonly getPrinted: string })[];
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
  };
}

export const apollo11Mission: MissionConfig = buildApollo11Mission();
