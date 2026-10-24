import columbiaFile from "../../../data/apollo11/generated/columbia.json";
import eagleFile from "../../../data/apollo11/generated/eagle.json";
import eventsFile from "../../../data/apollo11/generated/events.json";
import panelsFile from "../../../data/stories/apollo11/panels.json";
import validationFile from "../../../data/apollo11/generated/validation.json";
import { Scene, earth, moon, trueScale, type EventInput, type Provenance, type StoryPanelsInput, type TrajectoryInput } from "astraeus";

/** The wording the brief requires; never describe the path as exact. */
export const APOLLO11_STATEMENT =
  "Apollo 11 educational trajectory reconstruction based on NASA postflight trajectory data";

/** The page heading the site shows for this story. */
export const APOLLO11_LABEL = "Apollo 11";

/** The speeds the timeline offers, simulated seconds per real second. */
const RATES: readonly number[] = [1, 100, 1_000, 10_000];
/** The speed it opens at: one hour per second. */
const OPENING_RATE = 3_600;

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
  readonly samples: readonly { readonly timeUtcMs: number; readonly positionKm: readonly number[]; readonly velocityKmS?: readonly number[] }[];
}

interface GeneratedEvents {
  readonly rangeZeroGmt: string;
  readonly events: readonly { readonly id: string; readonly label: string; readonly timeUtcMs: number; readonly type?: string; readonly getPrinted: string }[];
}

interface ValidationSegment {
  readonly vehicle: string;
  readonly id: string;
  readonly startUtcMs: number;
  readonly endUtcMs: number;
  readonly cutoffPositionResidualKm?: number;
  readonly maxCorrectionKm?: number;
  readonly maxCorrectionMs?: number;
}

/** The parts of the generated validation report the known limitations quote. */
export interface GeneratedValidation {
  readonly smoothingReportThreshold: { readonly km: number; readonly ms: number };
  readonly segments: readonly ValidationSegment[];
  readonly landingSiteOffset: readonly { readonly timeUtcMs: number; readonly offsetKm: number; readonly offsetDeg: number }[];
}

/** The two vehicles' generated data, the events and the validation report; tests pass smaller ones. */
export interface Apollo11Data {
  readonly columbia: GeneratedFile;
  readonly eagle: GeneratedFile;
  readonly events: GeneratedEvents;
  readonly validation: GeneratedValidation;
  readonly panels: StoryPanelsInput;
}

/** The data the site ships. */
export const APOLLO11_DATA: Apollo11Data = {
  columbia: columbiaFile as unknown as GeneratedFile,
  eagle: eagleFile as unknown as GeneratedFile,
  events: eventsFile as unknown as GeneratedEvents,
  validation: validationFile as unknown as GeneratedValidation,
  panels: panelsFile as unknown as StoryPanelsInput,
};

/** The coast just after translunar injection, which absorbs the burn's cutoff miss (an accepted limitation). */
export const POST_TLI_COAST_ID = "A-02>A-03";
/** Speed is probed this often, as the reconstruction report does for burns. */
const SPEED_PROBE_MS = 100;

const number = (value: number, digits: number) => value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

function largest<T>(items: readonly T[], value: (item: T) => number): T {
  return items.reduce((best, item) => (value(item) > value(best) ? item : best));
}

function smoothedJoins(vehicle: string, validation: GeneratedValidation): string | null {
  const { km: limitKm, ms: limitMs } = validation.smoothingReportThreshold;
  const smoothed = validation.segments.filter((segment) => segment.vehicle === vehicle && segment.maxCorrectionKm !== undefined
    && (segment.maxCorrectionKm > limitKm || (segment.maxCorrectionMs ?? 0) > limitMs));
  if (smoothed.length === 0) return null;
  const worst = largest(smoothed, (segment) => segment.maxCorrectionKm ?? 0);
  return `Smoothed joins: ${smoothed.length} coasts are bent by more than ${limitKm} km or ${limitMs} m/s to meet their next NASA anchor, `
    + `by up to ${number(worst.maxCorrectionKm ?? 0, 0)} km (${worst.id}). The drawn path there is illustrative; no accuracy is claimed between anchors.`;
}

function burnCutoffs(vehicle: string, validation: GeneratedValidation): string | null {
  const burns = validation.segments.filter((segment) => segment.vehicle === vehicle && segment.cutoffPositionResidualKm !== undefined);
  if (burns.length === 0) return null;
  const residual = (segment: ValidationSegment) => segment.cutoffPositionResidualKm ?? 0;
  const worst = largest(burns, residual);
  const least = Math.min(...burns.map(residual));
  return `Burn cutoffs: the ${burns.length} modelled engine burns end ${number(least, 1)}–${number(residual(worst), 1)} km from NASA's published cutoff position `
    + `(largest ${worst.id}). Each residual is published, and the following coast starts from the modelled end.`;
}

/** The figure the live uncertainty bar showed (Decision 9, O-041): per segment, the largest smoothing correction on a coast or the modelled burn cutoff miss. */
function pathUncertainty(file: GeneratedFile): string | null {
  const corrections = file.segments.flatMap((segment) => (segment.maxCorrectionKm === undefined ? [] : [segment.maxCorrectionKm]));
  const misses = file.segments.flatMap((segment) => (segment.cutoffPositionResidualKm === undefined ? [] : [segment.cutoffPositionResidualKm]));
  if (corrections.length === 0 && misses.length === 0) return null;
  const parts = [
    ...(corrections.length === 0 ? [] : [`on a coast by up to ${number(Math.max(...corrections), 0)} km (the largest smoothing correction)`]),
    ...(misses.length === 0 ? [] : [`at the end of a modelled burn by up to ${number(Math.max(...misses), 1)} km (the cutoff miss against the NASA anchor)`]),
  ];
  return `Path uncertainty: the drawn position can sit away from the position NASA's anchors imply ${parts.join(" and ")}. It varies along the path and is not shown as a live figure.`;
}

/** The highest speed the scene reports for a path inside [startUtcMs, endUtcMs], probed through `stateOf`. */
function peakSpeedKmS(scene: Scene, id: string, startUtcMs: number, endUtcMs: number): number {
  let peak = 0;
  for (let time = startUtcMs; time <= endUtcMs; time += SPEED_PROBE_MS) {
    const velocity = scene.stateOf(id, time).velocityKmS;
    if (velocity !== undefined) peak = Math.max(peak, Math.hypot(...velocity));
  }
  return peak;
}

function postTliSpeed(vehicle: string, validation: GeneratedValidation, probe: Scene): string | null {
  const coast = validation.segments.find((segment) => segment.vehicle === vehicle && segment.id === POST_TLI_COAST_ID);
  const burn = coast && validation.segments.find((segment) => segment.vehicle === vehicle
    && segment.endUtcMs === coast.startUtcMs && segment.cutoffPositionResidualKm !== undefined);
  if (coast === undefined || burn === undefined || coast.maxCorrectionMs === undefined) return null;
  const seconds = (coast.endUtcMs - coast.startUtcMs) / 1000;
  const peak = peakSpeedKmS(probe, vehicle, coast.startUtcMs, coast.endUtcMs);
  return `Speed just after translunar injection: for ${number(seconds, 0)} s after the burn (${coast.id}) the coast absorbs the burn's `
    + `${number(burn.cutoffPositionResidualKm ?? 0, 1)} km cutoff miss with a velocity correction of up to ${number(coast.maxCorrectionMs, 0)} m/s, `
    + `so the speed shown there reaches ${number(peak, 1)} km/s and is not physical. This is an accepted limitation of this reconstruction.`;
}

function landingSite(validation: GeneratedValidation, events: GeneratedEvents): string | null {
  if (validation.landingSiteOffset.length === 0) return null;
  const at = (timeUtcMs: number) => events.events.find((event) => event.timeUtcMs === timeUtcMs)?.label ?? new Date(timeUtcMs).toISOString();
  const offsets = validation.landingSiteOffset
    .map((offset) => `${number(offset.offsetKm, 2)} km (${number(offset.offsetDeg, 3)}°) at ${at(offset.timeUtcMs)}`)
    .join(" and ");
  return "Landing site: Eagle is placed by the IAU lunar rotation model, and the drawn Moon turns by the same model with its libration, so Eagle's surface position is offset "
    + `from Tranquility Base on the drawn Moon by ${offsets}. The model itself is a published approximation of the true lunar orientation.`;
}

const ABOUT_THE_DRAWING = `${APOLLO11_STATEMENT}. Lines are reconstructed samples and round dots are NASA source anchors. `
  + "The marker is drawn larger than the vehicle so you can see it, and is not to scale.";

const DESCRIPTIONS: Readonly<Record<string, string>> = {
  earth: "Our planet, and the centre every distance and speed here is measured from.",
  moon: "Earth's natural satellite and Apollo 11's destination. Columbia orbited it while Eagle landed in the Sea of Tranquility.",
  columbia: `The command and service module. It carried the three astronauts to lunar orbit and home, with Michael Collins aboard while Eagle was on the surface. ${ABOUT_THE_DRAWING} Launch and splashdown are events only; it is drawn between the bounds of its sampled path.`,
  eagle: `The lunar module. It took Neil Armstrong and Buzz Aldrin from lunar orbit down to the Sea of Tranquility and back up to Columbia. ${ABOUT_THE_DRAWING}`,
};

/** The Moon's notes: the drawn Moon follows the IAU rotation model with libration, and it has no speed. */
const MOON_LIMITATIONS: readonly string[] = [
  "The Moon turns by the IAU mean-Earth rotation model with its libration terms, a published approximation, so surface features can sit a fraction of a degree from their true place.",
  "No velocity is modelled for the Moon, so it has no speed readout.",
];

/** Where the event times come from. */
function eventProvenance(events: GeneratedEvents): Provenance {
  return {
    sourceType: "observed",
    sources: ["NASA Apollo 11 Mission Report, MSC-00171 / SP-238 (NTRS 19700008096): Table 3-I, Table 7-II, Table 7-VII, Table 5-IV"],
    accuracy: `Printed ground elapsed times, to a tenth of a second, added to range zero ${events.rangeZeroGmt}.`,
    notes: "Event times do not depend on the reconstructed paths. Launch, ascent to orbit and splashdown exist only as events.",
  };
}

/** The bars on each spacecraft's info card: range from Earth (with the Moon marked), speed, distance to the Moon, and altitude above Earth and above the Moon. */
const READOUTS: TrajectoryInput["readouts"] = [
  { kind: "range", marker: "moon" },
  { kind: "speed" },
  { kind: "distance", to: "moon" },
  { kind: "altitude", above: "earth" },
  { kind: "altitude", above: "moon" },
];

function path(id: string, label: string, color: string, file: GeneratedFile, knownLimitations: readonly string[]): TrajectoryInput {
  return {
    id,
    label,
    color,
    center: "earth",
    samples: file.samples.map((sample) => ({ time: sample.timeUtcMs, positionKm: sample.positionKm, ...(sample.velocityKmS === undefined ? {} : { velocityKmS: sample.velocityKmS }) })),
    provenance: file.provenance,
    description: DESCRIPTIONS[id],
    knownLimitations,
    anchors: file.anchors.map((anchor) => ({ id: anchor.id, time: anchor.timeUtcMs })),
    readouts: READOUTS,
  };
}

const present = (items: readonly (string | null)[]) => items.filter((item): item is string => item !== null);

/** Apollo 11 as a story on the public API: Earth and the Moon, the two vehicles' reconstructed paths, the mission's events and story panels. `mount` it, or hand `toDefinition()` to the site. */
export function buildApollo11Scene(data: Apollo11Data = APOLLO11_DATA): Scene {
  const { columbia, eagle, events, validation, panels } = data;
  // Peak speeds quoted in a known limit are read through the scene's own path, so a probe scene holds the two paths first.
  const probe = new Scene().addBody(earth).addBody(moon).addTrajectory(path("columbia", "Columbia (CSM)", "#7fd4ff", columbia, [])).addTrajectory(path("eagle", "Eagle (LM)", "#ffb347", eagle, []));
  const eventInputs: EventInput[] = events.events.map((event) => ({
    id: event.id,
    label: `GET ${event.getPrinted} · ${event.label}`,
    time: event.timeUtcMs,
    ...(event.type === undefined ? {} : { type: event.type }),
  }));
  const scene = new Scene()
    .addBody(earth, { description: DESCRIPTIONS.earth, color: "#9fd8ff" })
    .addBody(moon, { orbit: true, description: DESCRIPTIONS.moon, color: "#ded7cc", knownLimitations: MOON_LIMITATIONS })
    .addTrajectory(path("columbia", "Columbia (CSM)", "#7fd4ff", columbia, present([
      smoothedJoins("columbia", validation),
      burnCutoffs("columbia", validation),
      postTliSpeed("columbia", validation, probe),
      pathUncertainty(columbia),
    ])))
    .addTrajectory(path("eagle", "Eagle (LM)", "#ffb347", eagle, present([
      landingSite(validation, events),
      smoothedJoins("eagle", validation),
      burnCutoffs("eagle", validation),
      pathUncertainty(eagle),
    ])))
    .addEvents(eventInputs, { provenance: eventProvenance(events) })
    .addStoryPanels(panels)
    .setTimeline({ start: events.events[0]!.timeUtcMs, end: events.events[events.events.length - 1]!.timeUtcMs, rates: RATES, rate: OPENING_RATE })
    // True scale only: this story is about scale, so no Readable view that changes the planets' size (owner, 2026-10-17, O-020 Decision 10).
    .setScale(trueScale, { only: true });
  // Seen from above: Earth, the Moon and the whole outbound and return path in frame (owner-chosen angle, T-063); it looks at Earth without following it.
  scene.camera.lookAt("earth", { azimuthDeg: 0, elevationDeg: 70, distance: 130 });
  return scene;
}
