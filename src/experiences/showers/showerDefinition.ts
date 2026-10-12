import { bodyMetrics } from "../../app/bodyMetrics";
import { catalogueItem } from "../../app/catalogueItem";
import { EARTH_EPHEMERIS } from "../../app/ephemerisProvenance";
import type { ExperienceDefinition, GroupLayer, PathLayer } from "../../app/experienceDefinition";
import { sunEarthSystem } from "../../assets/compositions";
import { createOrbAstronomyAdapter } from "../../core/astronomyAdapter";
import { createEvents } from "../../core/events";
import { createOrbitGroup, type OrbitElements, type OrbitSpread } from "../../core/orbitGroup";
import { createProvenance, type Provenance } from "../../core/provenance";
import { createWindows, rateAt, type RateSample, type TimelineWindow } from "../../core/timeWindow";
import { createEarthSunTrajectory, createTwoBodyTrajectory } from "../../core/sunCentredSources";
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
/** How much larger than life Earth is drawn under the solar-system scale; stated in Earth's info panel. */
export const EARTH_EXAGGERATION = 400;
const EARTH_PATH_COLOR = "#7ab8ff";
const PARENT_PATH_COLOR = "#c79bff";
const YEAR_MS = Math.round(365.256363 * DAY_MS);
/** The parent's path is drawn for this long either side of the peak: the stretch of its orbit that lies in the inner solar system. */
const PARENT_PATH_HALF_SPAN_MS = 180 * DAY_MS;
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

/** Earth's path round the Sun over the year about the peak, from the same Earth–Sun geometry that places Earth. */
export function createEarthPathLayer(settings: ShowerSettings): PathLayer {
  const peakUtcMs = Date.parse(settings.activity.peakUtc);
  return {
    kind: "orbit",
    color: EARTH_PATH_COLOR,
    source: createEarthSunTrajectory(createOrbAstronomyAdapter()),
    span: { startUtcMs: peakUtcMs - Math.floor(YEAR_MS / 2), endUtcMs: peakUtcMs + Math.ceil(YEAR_MS / 2) },
    samples: 361,
    object: {
      id: "earth-path",
      label: "Earth's path",
      color: EARTH_PATH_COLOR,
      labelPriority: 60,
      description: "Earth's path round the Sun over one year, drawn from the same Earth–Sun geometry that places Earth.",
      provenance: EARTH_EPHEMERIS.provenance,
      knownLimitations: ["A year's samples joined by straight segments."],
    },
  };
}

/** The parent body's orbit near the inner solar system: the published elements, set so the parent crosses Earth's path at the peak. */
export function createParentOrbitPathLayer(settings: ShowerSettings): PathLayer {
  const peakUtcMs = Date.parse(settings.activity.peakUtc);
  const id = `${settings.id}-parent-orbit`;
  return {
    kind: "orbit",
    color: PARENT_PATH_COLOR,
    source: createTwoBodyTrajectory({ body: settings.parentBody, plane: settings.orbit.plane, epochUtcMs: peakUtcMs, elements: streamBase(settings).base }, createOrbTwoBodyAdapter()),
    span: { startUtcMs: peakUtcMs - PARENT_PATH_HALF_SPAN_MS, endUtcMs: peakUtcMs + PARENT_PATH_HALF_SPAN_MS },
    samples: 361,
    object: {
      id,
      label: `${settings.parentBody} orbit`,
      color: PARENT_PATH_COLOR,
      labelPriority: 55,
      description: `The part of the orbit of ${settings.parentBody}, the source of the ${settings.label}, that lies in the inner solar system. The stream follows this orbit.`,
      provenance: createProvenance({
        sourceType: "illustrative",
        sources: [sourceLine(settings.orbit.source)],
        accuracy: "The shape and tilt of the orbit are the published elements. Where the parent is along it is set so that it crosses Earth's path at the peak.",
        notes: `${MODELLED_LIMITATION} Only about a year of the orbit is drawn, centred on the peak.`,
      }),
      knownLimitations: [MODELLED_LIMITATION, "Unperturbed two-body motion about the Sun; the full orbit reaches far beyond the part drawn."],
    },
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
      catalogueItem("sun", {
        labelPriority: 95,
        labelMaxDistance: CAMERA_REACH.far,
        description: "The Sun, the centre of the scene. The stream and Earth's path circle it.",
        knownLimitations: ["The Sun is drawn as a marker of fixed screen size, not to scale."],
      }),
      catalogueItem("earth", {
        color: "#9fd8ff",
        labelPriority: 100,
        labelMaxDistance: CAMERA_REACH.far,
        description: `The planet that crosses the stream of the ${settings.label}.`,
        knownLimitations: [
          ...EARTH_EPHEMERIS.knownLimitations,
          `In the Solar system scale Earth is drawn ${EARTH_EXAGGERATION} times larger than life so it can be seen; distances stay true.`,
        ],
      }),
    ],
    cameraPresets: [
      { id: "overview", label: "Overview", request: { kind: "overview" } },
      { id: "focus-earth", label: "Focus Earth", request: { kind: "focus", target: "earth" } },
      { id: "follow-earth", label: "Follow Earth", request: { kind: "follow", target: "earth" } },
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
    sceneLayers: ["points", "sun-centred"],
    composition: sunEarthSystem,
    sceneCenter: "sun",
    scaleChoices: ["true-scale", "solar-system"],
    visualOverrides: { earth: { exaggeration: EARTH_EXAGGERATION } },
    trackedBodies: [],
    groups: [layer],
    paths: [createEarthPathLayer(settings), createParentOrbitPathLayer(settings)],
    camera: CAMERA_REACH,
    createMetrics: ({ resolver }) => {
      const base = bodyMetrics(resolver, sunEarthSystem.bodies, ["distance"]);
      return (objectId: string, timeUtcMs: number): readonly Metric[] =>
        objectId === streamId ? [rateMetricOf(settings, window, timeUtcMs), radiant] : base(objectId, timeUtcMs);
    },
  };
}
