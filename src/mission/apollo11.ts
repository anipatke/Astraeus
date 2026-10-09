import columbiaFile from "../../data/apollo11/generated/columbia.json";
import eagleFile from "../../data/apollo11/generated/eagle.json";
import eventsFile from "../../data/apollo11/generated/events.json";
import validationFile from "../../data/apollo11/generated/validation.json";
import { createEvents, type TimelineEvent } from "../core/events";
import { createProvenance, type Provenance } from "../core/provenance";
import { SampledTrajectory, type TrajectorySample } from "../core/sampledTrajectory";
import type { Trajectory } from "../core/trajectory";
import { EARTH_EPHEMERIS, MOON_EPHEMERIS } from "../app/ephemerisProvenance";
import type { MissionConfig, PositionDiscrepancy, TrackedBody } from "../app/mission";
import type { ExperienceConfig } from "../shell/experience";
import { formatMetricNumber } from "../shell/metrics";

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
  readonly rangeZeroGmt: string;
  readonly events: readonly (TimelineEvent & { readonly getPrinted: string })[];
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
    ...(trajectory.provenance === undefined ? {} : { provenance: trajectory.provenance }),
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

/** The 10-second coast after translunar injection that absorbs the burn's cutoff miss (accepted limitation). */
export const POST_TLI_COAST_ID = "A-02>A-03";
/** Speed is probed this often through the runtime trajectory, as the reconstruction report does for burns. */
const SPEED_PROBE_MS = 100;

const km = (value: number, digits: number) => formatMetricNumber(value, digits);

/** Highest speed the runtime trajectory reports inside [startUtcMs, endUtcMs]. */
function peakSpeedKmS(trajectory: Trajectory, startUtcMs: number, endUtcMs: number): number {
  let peak = 0;
  for (let time = startUtcMs; time <= endUtcMs; time += SPEED_PROBE_MS) {
    const velocity = trajectory.stateAt(time).velocityKmS;
    if (velocity !== undefined) peak = Math.max(peak, Math.hypot(...velocity));
  }
  return peak;
}

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
    + `by up to ${km(worst.maxCorrectionKm ?? 0, 0)} km (${worst.id}). The drawn path there is illustrative; no accuracy is claimed between anchors.`;
}

function burnCutoffs(vehicle: string, validation: GeneratedValidation): string | null {
  const burns = validation.segments.filter((segment) => segment.vehicle === vehicle && segment.cutoffPositionResidualKm !== undefined);
  if (burns.length === 0) return null;
  const residual = (segment: ValidationSegment) => segment.cutoffPositionResidualKm ?? 0;
  const worst = largest(burns, residual);
  const least = Math.min(...burns.map(residual));
  return `Burn cutoffs: the ${burns.length} modelled engine burns end ${km(least, 1)}–${km(residual(worst), 1)} km from NASA's published cutoff position `
    + `(largest ${worst.id}). Each residual is published, and the following coast starts from the modelled end.`;
}

function postTliSpeed(vehicle: string, validation: GeneratedValidation, trajectory: Trajectory): string | null {
  const coast = validation.segments.find((segment) => segment.vehicle === vehicle && segment.id === POST_TLI_COAST_ID);
  const burn = coast && validation.segments.find((segment) => segment.vehicle === vehicle
    && segment.endUtcMs === coast.startUtcMs && segment.cutoffPositionResidualKm !== undefined);
  if (coast === undefined || burn === undefined || coast.maxCorrectionMs === undefined) return null;
  const seconds = (coast.endUtcMs - coast.startUtcMs) / 1000;
  const peak = peakSpeedKmS(trajectory, coast.startUtcMs, coast.endUtcMs);
  return `Speed just after translunar injection: for ${km(seconds, 0)} s after the burn (${coast.id}) the coast absorbs the burn's `
    + `${km(burn.cutoffPositionResidualKm ?? 0, 1)} km cutoff miss with a velocity correction of up to ${km(coast.maxCorrectionMs, 0)} m/s, `
    + `so the speed shown there reaches ${km(peak, 1)} km/s and is not physical. This is an accepted limitation of this reconstruction.`;
}

function landingSite(validation: GeneratedValidation, events: GeneratedEvents): string | null {
  if (validation.landingSiteOffset.length === 0) return null;
  const at = (timeUtcMs: number) => events.events.find((event) => event.timeUtcMs === timeUtcMs)?.label ?? new Date(timeUtcMs).toISOString();
  const offsets = validation.landingSiteOffset
    .map((offset) => `${km(offset.offsetKm, 2)} km (${km(offset.offsetDeg, 3)}°) at ${at(offset.timeUtcMs)}`)
    .join(" and ");
  return "Landing site: Eagle is placed correctly in space, but the drawn Moon has no libration, so Eagle's surface position is offset "
    + `from Tranquility Base on the drawn Moon by ${offsets}. This is a stated liberty of the drawn Moon, not of the landing.`;
}

/** Each vehicle's known limitations, worded here and quoting figures from the generated reconstruction data. */
export function apollo11KnownLimitations(
  mission: MissionConfig,
  validation: GeneratedValidation = validationFile as unknown as GeneratedValidation,
  events: GeneratedEvents = eventsFile as unknown as GeneratedEvents,
): Readonly<Record<string, readonly string[]>> {
  const of = (id: string) => mission.bodies.find((body) => body.id === id);
  const columbia = of("columbia");
  const limitations = (items: readonly (string | null)[]) => items.filter((item): item is string => item !== null);
  return {
    columbia: limitations([
      smoothedJoins("columbia", validation),
      burnCutoffs("columbia", validation),
      columbia === undefined ? null : postTliSpeed("columbia", validation, columbia.trajectory),
    ]),
    eagle: limitations([landingSite(validation, events), smoothedJoins("eagle", validation), burnCutoffs("eagle", validation)]),
  };
}

const DESCRIPTIONS: Readonly<Record<string, string>> = {
  earth: "Our planet, and the centre every distance and speed here is measured from.",
  moon: "Earth's natural satellite and Apollo 11's destination. Columbia orbited it while Eagle landed in the Sea of Tranquility.",
  columbia: "The command and service module. It carried the three astronauts to lunar orbit and home, with Michael Collins aboard while Eagle was on the surface.",
  eagle: "The lunar module. It took Neil Armstrong and Buzz Aldrin from lunar orbit down to the Sea of Tranquility and back up to Columbia.",
};

function eventProvenance(events: GeneratedEvents = eventsFile as unknown as GeneratedEvents): Provenance {
  return createProvenance({
    sourceType: "observed",
    sources: ["NASA Apollo 11 Mission Report, MSC-00171 / SP-238 (NTRS 19700008096): Table 3-I, Table 7-II, Table 7-VII, Table 5-IV"],
    accuracy: `Printed ground elapsed times, to a tenth of a second, added to range zero ${events.rangeZeroGmt}.`,
    notes: "Event times do not depend on the reconstructed paths. Launch, ascent to orbit and splashdown exist only as events.",
  });
}

/** Shell-facing objects, content and timeline data projected from the existing Apollo scene config. */
export function buildApollo11Experience(mission: MissionConfig = apollo11Mission): ExperienceConfig {
  const limitations = apollo11KnownLimitations(mission);
  return {
    objects: [
      {
        id: "earth", label: "Earth", color: "#9fd8ff", labelPriority: 100, labelMaxDistance: 500,
        description: DESCRIPTIONS.earth, provenance: EARTH_EPHEMERIS.provenance, knownLimitations: EARTH_EPHEMERIS.knownLimitations,
      },
      {
        id: "moon", label: "Moon", color: "#ded7cc", labelPriority: 90, labelMaxDistance: 500,
        description: DESCRIPTIONS.moon, provenance: MOON_EPHEMERIS.provenance, knownLimitations: MOON_EPHEMERIS.knownLimitations,
      },
      ...mission.bodies.map(({ id, label, color, trajectory, provenance }) => ({
        id,
        label,
        color,
        availability: trajectory.bounds,
        labelPriority: 80,
        labelMaxDistance: 4,
        ...(DESCRIPTIONS[id] === undefined ? {} : { description: DESCRIPTIONS[id] }),
        ...(provenance === undefined ? {} : { provenance }),
        knownLimitations: limitations[id] ?? [],
      })),
    ],
    cameraPresets: [
      { id: "overview", label: "Earth–Moon overview", request: { kind: "overview" } },
      ...mission.bodies.map(({ id, label }) => ({
        id: `focus-${id}`,
        label: `Focus ${label}`,
        request: { kind: "focus" as const, target: id },
      })),
      ...mission.bodies.map(({ id, label }) => ({
        id: `follow-${id}`,
        label: `Follow ${label}`,
        request: { kind: "follow" as const, target: id },
      })),
      { id: "focus-earth", label: "Focus Earth", request: { kind: "focus", target: "earth" } },
      { id: "focus-moon", label: "Focus Moon", request: { kind: "focus", target: "moon" } },
    ],
    events: mission.events,
    window: mission.window,
    rates: mission.rates,
    eventProvenance: eventProvenance(),
  };
}

export const apollo11Experience: ExperienceConfig = buildApollo11Experience();
