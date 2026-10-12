import { createObjectMetrics } from "../../app/metricReadouts";
import type { ExperienceDefinition, GroupLayer } from "../../app/experienceDefinition";
import { createEvents } from "../../core/events";
import { createOrbitGroup, type OrbitElements, type OrbitSpread } from "../../core/orbitGroup";
import { createProvenance, type Provenance } from "../../core/provenance";
import { createWindows, rateAt, type RateSample, type TimelineWindow } from "../../core/timeWindow";
import { createOrbTwoBodyAdapter } from "../../core/twoBodyAdapter";
import type { ExperienceConfig } from "../../shell/experience";
import type { CoordinatesMetric, Metric, RateMetric } from "../../shell/metrics";
import type { ShowerSettings, ShowerSource } from "./showerSettings";

const AU_KM = 149_597_870.7;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const STREAM_COLOR = "#ffb86b";
/** Sun-centred scenes are about 2 AU across; one AU is about 23,500 Earth radii. */
const CAMERA_REACH = { maxFocusDistance: 400_000, far: 1_000_000 };
/** Presentation only: the stream drifts slowly, so exact fills six simulated hours apart are enough. */
const REFILL_AFTER_MS = 6 * HOUR_MS;

const sourceLine = (source: ShowerSource): string => `${source.name} (${source.url}, accessed ${source.accessed})`;

/** The stream's id in the shell: also what the camera presets target. */
export const streamIdOf = (settings: ShowerSettings): string => `${settings.id}-stream`;
export const windowIdOf = (settings: ShowerSettings): string => `${settings.id}-activity`;

/** The key an entry finds a settings file under: its file name without folder or extension. */
export function showerEntryName(path: string): string {
  const file = path.slice(path.lastIndexOf("/") + 1);
  return file.endsWith(".json") ? file.slice(0, -".json".length) : file;
}

/** The true anomaly at which an orbit crosses the ecliptic or equatorial plane on the chosen node. */
export function nodeTrueAnomalyDeg(argumentOfPeriapsisDeg: number, node: ShowerSettings["stream"]["encounterNode"]): number {
  const raw = (node === "ascending" ? 0 : 180) - argumentOfPeriapsisDeg;
  return ((((raw + 180) % 360) + 360) % 360) - 180;
}

function streamBase(settings: ShowerSettings): { base: OrbitElements; spread: OrbitSpread } {
  const { elements } = settings.orbit;
  const { spread } = settings.stream;
  return {
    base: {
      semiMajorAxisKm: elements.semiMajorAxisAu * AU_KM,
      eccentricity: elements.eccentricity,
      inclinationDeg: elements.inclinationDeg,
      raanDeg: elements.raanDeg,
      argumentOfPeriapsisDeg: elements.argumentOfPeriapsisDeg,
      trueAnomalyDeg: nodeTrueAnomalyDeg(elements.argumentOfPeriapsisDeg, settings.stream.encounterNode),
    },
    spread: {
      semiMajorAxisKm: spread.semiMajorAxisAu * AU_KM,
      eccentricity: spread.eccentricity,
      inclinationDeg: spread.inclinationDeg,
      raanDeg: spread.raanDeg,
      argumentOfPeriapsisDeg: spread.argumentOfPeriapsisDeg,
      trueAnomalyDeg: spread.trueAnomalyDeg,
    },
  };
}

const MODELLED_LIMITATION = "Modelled spread, two-body, not observed.";

function streamProvenance(settings: ShowerSettings): Provenance {
  return createProvenance({
    sourceType: "illustrative",
    sources: [sourceLine(settings.orbit.source)],
    accuracy: "The parent body's orbit is published; the stream is not. Its members are invented around that orbit.",
    notes: `${MODELLED_LIMITATION} The spread of the members is chosen so that Earth passes through the stream across the activity window.`,
  });
}

/** The stream as one group, centred on the Sun, placed where the parent's orbit crosses Earth's path at the peak. */
export function createStreamLayer(settings: ShowerSettings): GroupLayer {
  const { startUtc, endUtc, peakUtc } = settings.activity;
  const { base, spread } = streamBase(settings);
  const group = createOrbitGroup({
    id: streamIdOf(settings),
    count: settings.stream.memberCount,
    center: "sun",
    plane: settings.orbit.plane,
    epochUtcMs: Date.parse(peakUtc),
    base,
    spread,
    seed: settings.stream.seed,
    bounds: { startUtcMs: Date.parse(startUtc), endUtcMs: Date.parse(endUtc) },
    provenance: streamProvenance(settings),
  }, createOrbTwoBodyAdapter());
  return {
    group,
    color: STREAM_COLOR,
    refillAfterMs: REFILL_AFTER_MS,
    object: {
      id: streamIdOf(settings),
      label: `${settings.label} stream`,
      color: STREAM_COLOR,
      labelPriority: 70,
      description: `${settings.stream.memberCount} invented dust grains around the orbit of ${settings.parentBody}, the source of the ${settings.label}. One item stands for the whole stream; its focus point is the centroid of the members.`,
      knownLimitations: [
        MODELLED_LIMITATION,
        `Only the orbit of ${settings.parentBody} is published; the width and density of the stream are chosen for the picture.`,
      ],
    },
  };
}

/** Rate samples: one per day over the window and one at the peak, falling off from the peak by powers of ten. */
export function rateSamplesOf(settings: ShowerSettings): readonly RateSample[] {
  const { startUtc, endUtc, peakUtc, peakRate, fallOffPerDay } = settings.activity;
  const [startMs, endMs, peakMs] = [startUtc, endUtc, peakUtc].map(Date.parse);
  const times = new Set<number>([peakMs, startMs, endMs]);
  for (let t = startMs + DAY_MS; t < endMs; t += DAY_MS) times.add(t);
  return [...times]
    .sort((a, b) => a - b)
    .map((timeUtcMs) => ({ timeUtcMs, value: peakRate * 10 ** (-fallOffPerDay * (Math.abs(timeUtcMs - peakMs) / DAY_MS)) }));
}

function publishedProvenance(settings: ShowerSettings): Provenance {
  return createProvenance({
    sourceType: "observed",
    sources: [sourceLine(settings.activity.source)],
    accuracy: `As published for the night of ${settings.activity.peakPublishedNight}; not checked against the primary source.`,
    notes: `The published peak night and peak rate of ${settings.activity.peakRate}. The exact instant inside the night is chosen for the picture.`,
  });
}

function modelledProvenance(side: "rise" | "fall"): Provenance {
  return createProvenance({
    sourceType: "illustrative",
    sources: ["Modelled rate curve; not observed"],
    accuracy: "None claimed. The rate between the published points falls off smoothly from the peak.",
    notes: side === "rise" ? "Modelled rise toward the published peak." : "Modelled fall after the published peak.",
  });
}

export function createActivityWindow(settings: ShowerSettings): TimelineWindow {
  const { startUtc, endUtc, peakUtc, rateUnit } = settings.activity;
  const [startUtcMs, endUtcMs, peakUtcMs] = [startUtc, endUtc, peakUtc].map(Date.parse);
  const halfNight = 12 * HOUR_MS;
  const nightStart = Math.max(startUtcMs, peakUtcMs - halfNight);
  const nightEnd = Math.min(endUtcMs, peakUtcMs + halfNight);
  return createWindows([{
    id: windowIdOf(settings),
    label: `${settings.label} activity`,
    type: "meteor-shower",
    startUtcMs,
    endUtcMs,
    peakUtcMs,
    rate: { unit: rateUnit, samples: rateSamplesOf(settings) },
    provenance: [
      { startUtcMs, endUtcMs: nightStart, provenance: modelledProvenance("rise") },
      { startUtcMs: nightStart, endUtcMs: nightEnd, provenance: publishedProvenance(settings) },
      { startUtcMs: nightEnd, endUtcMs, provenance: modelledProvenance("fall") },
    ].filter((span) => span.endUtcMs > span.startUtcMs),
  }])[0];
}

function rateMetricOf(settings: ShowerSettings, window: TimelineWindow, timeUtcMs: number): RateMetric {
  return {
    kind: "rate",
    id: `${settings.id}-rate`,
    label: "Activity rate",
    value: rateAt(window, timeUtcMs),
    unit: window.rate?.unit ?? "",
    digits: 0,
    context: window.label,
    unavailable: "outside the activity window",
    peak: { label: "Published peak", value: settings.activity.peakRate },
  };
}

function radiantMetricOf(settings: ShowerSettings): CoordinatesMetric {
  return {
    kind: "coordinates",
    id: `${settings.id}-radiant`,
    label: "Radiant",
    system: "radec",
    components: [
      { label: "RA", value: settings.radiant.raDeg, unit: "°", digits: 1 },
      { label: "Dec", value: settings.radiant.decDeg, unit: "°", digits: 1 },
    ],
    frame: "equinox not stated by source",
    origin: "Earth",
    context: `Published: ${settings.radiant.source.name}`,
  };
}

/** Turns shower settings into an experience definition; nothing here names a particular shower. */
export function buildShowerDefinition(settings: ShowerSettings): ExperienceDefinition {
  const layer = createStreamLayer(settings);
  const window = createActivityWindow(settings);
  const streamId = streamIdOf(settings);
  const { startUtcMs, endUtcMs } = { startUtcMs: window.startUtcMs, endUtcMs: window.endUtcMs };
  const radiant = radiantMetricOf(settings);
  const experience: ExperienceConfig = {
    objects: [
      { id: "earth", label: "Earth", color: "#9fd8ff", labelPriority: 100, labelMaxDistance: CAMERA_REACH.far, description: `The planet that crosses the stream of the ${settings.label}.` },
      { id: "moon", label: "Moon", color: "#ded7cc", labelPriority: 90, labelMaxDistance: 500, description: "Shown for scale only." },
    ],
    cameraPresets: [
      { id: "overview", label: "Overview", request: { kind: "overview" } },
      { id: "focus-stream", label: "Focus stream", request: { kind: "focus", target: streamId } },
      { id: "follow-stream", label: "Follow stream", request: { kind: "follow", target: streamId } },
    ],
    events: createEvents([
      { id: `${settings.id}-start`, label: `${settings.label} activity begins`, timeUtcMs: startUtcMs },
      { id: `${settings.id}-peak`, label: `${settings.label} peak`, timeUtcMs: window.peakUtcMs ?? startUtcMs },
      { id: `${settings.id}-end`, label: `${settings.label} activity ends`, timeUtcMs: endUtcMs },
    ]),
    windows: [window],
    window: { startUtcMs, endUtcMs },
    rates: [3_600, 43_200, 86_400, 259_200],
    eventProvenance: createProvenance({
      sourceType: "observed",
      sources: [sourceLine(settings.activity.source)],
      accuracy: "Activity dates as published; the peak instant is chosen inside the published night.",
      notes: "",
    }),
  };
  return {
    experience,
    clock: { startUtcMs, rate: 86_400 },
    sceneLayers: ["earth-moon", "points"],
    trackedBodies: [],
    groups: [layer],
    camera: CAMERA_REACH,
    createMetrics: ({ moon }) => {
      const base = createObjectMetrics({ bodies: [], moon, earthId: "earth", moonId: "moon" });
      return (objectId: string, timeUtcMs: number): readonly Metric[] =>
        objectId === streamId ? [rateMetricOf(settings, window, timeUtcMs), radiant] : base(objectId, timeUtcMs);
    },
  };
}
