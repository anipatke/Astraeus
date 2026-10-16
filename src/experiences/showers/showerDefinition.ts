import { bodyMetrics } from "../../app/bodyMetrics";
import { catalogueItem } from "../../app/catalogueItem";
import { EARTH_EPHEMERIS } from "../../app/ephemerisProvenance";
import type { ExperienceDefinition, GroupLayer, PathLayer } from "../../app/experienceDefinition";
import type { BodyId } from "../../core/body";
import { catalogue as builtInCatalogue, extendCatalogue, rootBodyId, type BodyCatalogue } from "../../assets/catalogue";
import { createComposition, type SystemComposition } from "../../assets/compositions";
import { createOrbAstronomyAdapter } from "../../core/astronomyAdapter";
import { createEvents } from "../../core/events";
import { createListedOrbitGroup } from "../../core/listedOrbitGroup";
import { createProvenance, type Provenance } from "../../core/provenance";
import { createWindows, rateAt, type RateSample, type TimelineWindow } from "../../core/timeWindow";
import { createEarthSunTrajectory, fullTurnSpanMs, type EccentricSampling } from "../../core/sunCentredSources";
import type { Trajectory } from "../../core/trajectory";
import { createOrbTwoBodyAdapter } from "../../core/twoBodyAdapter";
import type { ExperienceConfig, ExperienceObject } from "../../shell/experience";
import type { CoordinatesMetric, Metric, RateMetric } from "../../shell/metrics";
import { fetchOrbitsCommand, offeredSources, orbitSetCounts, selectOrbits, type MeasuredLoad, type MeasuredOrbitProvenance, type MeasuredOrbits, type OrbitSet, type OrbitSetCounts } from "./measuredOrbits";
import { parseStoryPanels, StoryPanelError, type StoryPanelSet } from "../../shell/storyPanels";
import { citedSourceOf, ShowerSettingsError, type OrbitSource, type ShowerSettings, type ShowerSource } from "./showerSettings";

const AU_KM = 149_597_870.7;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const YEAR_MS = Math.round(365.256363 * DAY_MS);
/** Label priorities: the stream and the planets Earth meets first, then the Sun, the parent, the paths. */
const LABEL_PRIORITY = { earth: 100, sun: 95, parent: 90, planet: 80, stream: 70, parentOrbit: 65, earthPath: 60, planetOrbit: 50 } as const;

/** The catalogue this shower draws from: the built-in one, plus the parent when the settings define it. The built-in catalogue is never changed. */
export function showerCatalogue(settings: ShowerSettings): BodyCatalogue {
  if (settings.parentElements === undefined) return builtInCatalogue;
  let held = EXTENDED.get(settings);
  if (held === undefined) {
    held = extendCatalogue(builtInCatalogue, [settings.parentElements]);
    EXTENDED.set(settings, held);
  }
  return held;
}

/** One extended catalogue per settings object, so every part of one experience shares it. */
const EXTENDED = new WeakMap<ShowerSettings, BodyCatalogue>();

/** Every story panels file a shower's `story.panels` path may name, keyed by repo-relative path. */
const PANEL_FILES = import.meta.glob<unknown>("../../../data/stories/*/panels.json", { eager: true, import: "default" });

/**
 * The shower's story panels, or undefined when its settings carry none. A path is read from the story folder; either way the panels are checked
 * against this experience's events, objects and timeline, and a problem is raised with the settings field or the panel and field named.
 */
export function showerStoryPanels(settings: ShowerSettings, objectIds: readonly string[], events: readonly { readonly id: string; readonly timeUtcMs: number }[], window: { readonly startUtcMs: number; readonly endUtcMs: number }): StoryPanelSet | undefined {
  if (settings.story === undefined) return undefined;
  const given = settings.story.panels;
  const raw = typeof given === "string" ? PANEL_FILES[`../../../${given}`] : given;
  if (raw === undefined) throw new ShowerSettingsError(`shower settings story.panels names "${String(given)}", which is not a panels file in the project`);
  try {
    // Validated against the full default (year) timeline so a genuine data mistake still throws; a viewer who narrows the span just loses the panels outside what is visible.
    const set = parseStoryPanels(raw, { events, objectIds, window: yearBoundsOf(settings) });
    const panels = set.panels.filter((panel) => panel.timeUtcMs >= window.startUtcMs && panel.timeUtcMs <= window.endUtcMs);
    return panels.length === set.panels.length ? set : { ...set, panels };
  } catch (error) {
    if (error instanceof StoryPanelError) throw new ShowerSettingsError(`shower settings story.panels: ${error.message}`);
    throw error;
  }
}

const sourceLine = (source: ShowerSource): string => `${source.name} (${source.url}, accessed ${source.accessed})`;

/** The timeline's bounds: the activity window, or one year centred on the peak. Everything the timeline bounds (the stream, the clock, the loop) uses these. */
export function timelineBoundsOf(settings: ShowerSettings): { readonly startUtcMs: number; readonly endUtcMs: number } {
  const { startUtc, endUtc } = settings.activity;
  if (settings.timeline.span === "activity") return { startUtcMs: Date.parse(startUtc), endUtcMs: Date.parse(endUtc) };
  return yearBoundsOf(settings);
}

/** One year centred on the peak: the shower's full default timeline. */
function yearBoundsOf(settings: ShowerSettings): { readonly startUtcMs: number; readonly endUtcMs: number } {
  const start = Math.round(Date.parse(settings.activity.peakUtc) - YEAR_MS / 2);
  return { startUtcMs: start, endUtcMs: start + YEAR_MS };
}

/** The stream's id in the shell: also what the camera presets target. */
export const streamIdOf = (settings: ShowerSettings): string => `${settings.id}-stream`;
export const windowIdOf = (settings: ShowerSettings): string => `${settings.id}-activity`;

export { showerEntryName } from "./showerEntry";

const percent = (fraction: number): string => `${Math.round(fraction * 100)}%`;

/** The words the stream's panel must carry about what is measured, what is a drawing choice and what is not shown. */
export function orbitSetSentence(settings: ShowerSettings, set: OrbitSet, counts: OrbitSetCounts, source: OrbitSource = "cams"): string {
  const { rule } = settings.stream.quality;
  const gmn = source === "gmn" ? settings.stream.sources.gmn : undefined;
  if (gmn !== undefined) {
    const shownGmn = set === "reliable" ? counts.reliable : counts.all;
    const cutGmn = `Qc (the maximum convergence angle between the stations that saw the meteor) at least ${rule.minConvergenceAngleDeg}° and the Vgeo sigma at most ${Math.round(rule.maxVelocityErrorFraction * 100)}% of Vgeo`;
    return `Orbit set shown: ${set === "reliable" ? "reliable orbits only" : "all orbits"} (${shownGmn} of ${counts.all} bound orbits; the reliable set, ${cutGmn}, has ${counts.reliable} and cuts ${counts.cut}). The cut is the published rule: ${rule.quote} (${rule.source.name}, ${rule.source.url}), mapped to GMN's own columns: ${gmn.ruleNote} GMN has no double-entry flag.`;
  }
  const cut = `convergence angle Q at least ${rule.minConvergenceAngleDeg}° and velocity error at most ${Math.round(rule.maxVelocityErrorFraction * 100)}% of the geocentric velocity`;
  const shown = set === "reliable" ? counts.reliable : counts.all;
  return `Orbit set shown: ${set === "reliable" ? "reliable orbits only" : "all orbits"} (${shown} of ${counts.all} bound orbits; the reliable set, ${cut}, has ${counts.reliable} and cuts ${counts.cut}). The cut is published: ${rule.quote} (${rule.source.name}, ${rule.source.url}). ${counts.pairsFlagged} records flagged as double entries are kept in both sets (${counts.pairsFlaggedReliable} of them in the reliable set).`;
}

/** What the stream's panel says about the catalogue itself, when it is the GMN: the source, its licence and what was read. */
export function gmnSourceSentence(settings: ShowerSettings, provenance?: MeasuredOrbitProvenance): string {
  const gmn = settings.stream.sources.gmn;
  if (gmn === undefined) return "";
  const read = provenance === undefined ? "" : ` Read from ${gmn.months.join(" and ")}: ${provenance.counts.members} records, ${provenance.counts.unbound} unbound orbits dropped, ${provenance.counts.kept} bound orbits kept.`;
  return `Source: ${gmn.source.name}. Licence ${gmn.licence} (${gmn.licenceUrl}), credit the Global Meteor Network.${read}`;
}

export function streamLimitations(settings: ShowerSettings, orbitSet?: { readonly set: OrbitSet; readonly counts: OrbitSetCounts; readonly source?: OrbitSource; readonly provenance?: MeasuredOrbitProvenance }): readonly string[] {
  const { concentration } = settings.stream;
  const status = concentration.status === "cited" ? `cited; basis: ${concentration.basis}` : `illustrative defaults: ${concentration.basis}`;
  return [
    ...(orbitSet?.source === "gmn" ? [gmnSourceSentence(settings, orbitSet.provenance)] : []),
    ...(orbitSet === undefined ? [] : [orbitSetSentence(settings, orbitSet.set, orbitSet.counts, orbitSet.source)]),
    "The position of each dot along its orbit is illustrative: the records give each orbit's shape and tilt, not where the meteoroid is. The dots are spread evenly round their orbits.",
    `The clump near ${settings.parentBody} is a model: ${percent(concentration.fraction)} of the dots are placed within ±${concentration.widthDeg}° of ${settings.parentBody}'s orbital phase (${status}) The orbits differ in size, so the clump shows as a band at ${settings.parentBody}'s phase, not a blob on ${settings.parentBody}.`,
    "Parts of the stream that miss Earth are not shown: the database holds only meteoroids that reached Earth.",
    "The semi-major axis of a measured orbit is poorly determined (the speed error dominates it), so the sizes of the orbits are less certain than their shape and tilt.",
  ];
}

function streamObject(settings: ShowerSettings, description: string, orbitSet: { readonly set: OrbitSet; readonly counts: OrbitSetCounts; readonly source?: OrbitSource; readonly provenance?: MeasuredOrbitProvenance }): ExperienceObject {
  return {
    id: streamIdOf(settings),
    label: `${settings.label} stream`,
    color: settings.look.streamColor,
    labelPriority: LABEL_PRIORITY.stream,
    description,
    knownLimitations: streamLimitations(settings, orbitSet),
  };
}

function measuredProvenance(settings: ShowerSettings, orbits: MeasuredOrbits, shown: number, set: OrbitSet, source: OrbitSource): Provenance {
  const { provenance } = orbits;
  const { counts } = provenance;
  return createProvenance({
    sourceType: "observed",
    sources: [...(provenance.citations ?? [provenance.citation]), sourceLine(citedSourceOf(settings, source))],
    accuracy: "Orbit solutions from video meteor observations. The shape and tilt of each orbit are measured; its semi-major axis is the weakest element.",
    notes: `${provenance.database}, IAU shower ${provenance.iauCode}: ${counts.members} records, ${counts.unbound} unbound or incomplete records dropped, ${counts.kept} bound orbits in the file, ${shown} orbits drawn (${set === "reliable" ? "reliable set" : "all orbits"}). Fetched ${provenance.fetchedAt}.${provenance.licence === undefined ? "" : ` Licence ${provenance.licence}.`}`,
  });
}

/** What the stream's item says when its data is not on this machine: nothing is drawn and no stand-in is invented. */
export function absentStreamObject(settings: ShowerSettings, load: Exclude<MeasuredLoad, { kind: "loaded" }>, source: OrbitSource, production: boolean = import.meta.env.PROD): ExperienceObject {
  const command = fetchOrbitsCommand(settings.stream.iauCode, source, settings.stream.sources.gmn?.months ?? []);
  const size = source === "gmn" ? `the ${settings.stream.sources.gmn?.months.length ?? 0} monthly files, about 100 MB each` : "about 322 MB";
  const why = production
    ? load.kind === "invalid"
      ? `The measured orbit file this build ships for the ${settings.label} cannot be used (${load.problem}), so no stream is drawn.`
      : `This build does not include measured orbits for the ${settings.label}, so no stream is drawn.`
    : load.kind === "invalid"
    ? `The fetched file cannot be used: ${load.problem}. Run "${command}" again.`
    : `The measured orbits are not fetched on this machine, so no stream is drawn. Run "${command}" to fetch them (${size} downloaded, kept out of the repository and out of public builds).`;
  return {
    id: streamIdOf(settings),
    label: `${settings.label} stream`,
    color: settings.look.streamColor,
    labelPriority: LABEL_PRIORITY.stream,
    description: `The ${settings.label} stream is drawn from measured meteoroid orbits. ${why}`,
    provenance: createProvenance({
      sourceType: "observed",
      sources: [sourceLine(citedSourceOf(settings, source))],
      accuracy: "Nothing is drawn, so nothing is claimed.",
      notes: why,
    }),
    knownLimitations: [why],
  };
}

/**
 * The stream as one group, centred on the Sun: one dot per measured orbit, on its own ellipse, with the dot's place along the orbit a
 * stated drawing choice. A stated share is clumped near the parent's orbital phase, a model.
 */
export function createStreamLayer(settings: ShowerSettings, all: MeasuredOrbits, set: OrbitSet = settings.stream.quality.default, source: OrbitSource = settings.stream.source): GroupLayer {
  const catalogue = showerCatalogue(settings);
  const counts = orbitSetCounts(all, settings.stream.quality.rule);
  const orbits = selectOrbits(all, set, settings.stream.quality.rule);
  const { peakUtc } = settings.activity;
  const { concentration } = settings.stream;
  const adapter = createOrbAstronomyAdapter();
  const parent = catalogue.get(settings.parentBodyId);
  if (parent.source === undefined) throw new RangeError(`parentBodyId "${settings.parentBodyId}" has no state source`);
  const group = createListedOrbitGroup({
    id: streamIdOf(settings),
    center: "sun",
    plane: "ecliptic-j2000",
    members: orbits.members,
    phase: {
      referenceUtcMs: Date.parse(peakUtc),
      seed: settings.stream.seed,
      concentration: { around: parent.source.create(adapter), fraction: concentration.fraction, widthDeg: concentration.widthDeg },
    },
    bounds: timelineBoundsOf(settings),
    provenance: measuredProvenance(settings, all, orbits.members.length, set, source),
  }, createOrbTwoBodyAdapter());
  const description = `${group.count} measured meteoroid orbits of the ${settings.label}, each drawn as one dot (${orbits.provenance.database}). The orbits' shapes and tilts are measured; where each dot sits along its orbit is illustrative, and the clump near ${settings.parentBody} is a model. One item stands for the whole stream; its focus point is the centroid of the dots.`;
  return {
    group,
    color: settings.look.streamColor,
    pointSizePx: settings.look.pointSizePx,
    refillAfterMs: settings.look.refillAfterHours * HOUR_MS,
    object: streamObject(settings, description, { set, counts, source, provenance: all.provenance }),
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
    frame: settings.radiant.equinox,
    origin: "Earth",
    context: `Published: ${settings.radiant.source.name}`,
  };
}

/** Earth's path round the Sun over the year about the peak, from the same Earth–Sun geometry that places Earth. */
export function createEarthPathLayer(settings: ShowerSettings): PathLayer {
  const peakUtcMs = Date.parse(settings.activity.peakUtc);
  return {
    kind: "orbit",
    color: settings.look.earthPathColor,
    source: createEarthSunTrajectory(createOrbAstronomyAdapter()),
    span: { startUtcMs: peakUtcMs - Math.floor(YEAR_MS / 2), endUtcMs: peakUtcMs + Math.ceil(YEAR_MS / 2) },
    samples: 361,
    object: {
      id: "earth-path",
      label: "Earth's path",
      color: settings.look.earthPathColor,
      labelPriority: LABEL_PRIORITY.earthPath,
      description: "Earth's path round the Sun over one year, drawn from the same Earth–Sun geometry that places Earth.",
      provenance: EARTH_EPHEMERIS.provenance,
      knownLimitations: ["A year's samples joined by straight segments."],
    },
  };
}

/** The turn search walks in two-day steps; the longest orbit among the planets is a dozen years. */
const PLANET_TURN_STEP_MS = 2 * DAY_MS;
const PLANET_TURN_MAX_STEPS = 3_000;

/**
 * The orbit of every catalogued body that circles the Sun, except Earth (which has its own path) and the parent (whose whole orbit is drawn
 * deliberately, below), from its own catalogue state source and drawn for one full turn from the peak. No body is named here: the planets
 * are whatever the catalogue holds.
 */
export function createPlanetOrbitPathLayers(settings: ShowerSettings): PathLayer[] {
  const catalogue = showerCatalogue(settings);
  const peakUtcMs = Date.parse(settings.activity.peakUtc);
  const adapter = createOrbAstronomyAdapter();
  const root = rootBodyId();
  return catalogue.ids()
    .filter((id) => catalogue.get(id).definition.parentId === root && catalogue.get(id).visual.kind === "sphere" && id !== "earth" && id !== settings.parentBodyId)
    .flatMap((id): PathLayer[] => {
      const { definition, source, visual } = catalogue.get(id);
      const trajectory = source!.create(adapter);
      // An orbit too long to sweep within the search (a comet's, over a century) is not a planet's turn; the search finds none and it is left out here.
      const spanMs = turnSpanOrNull(trajectory, peakUtcMs);
      if (spanMs === null) return [];
      const { endUtcMs: validUntil } = definition.accuracy.validUtc;
      const beyond = peakUtcMs + spanMs > validUntil;
      return [{
        kind: "orbit",
        color: visual.material.color,
        source: trajectory,
        span: { startUtcMs: peakUtcMs, endUtcMs: peakUtcMs + spanMs },
        samples: 361,
        object: {
          id: `${id}-orbit`,
          label: `${definition.label}'s orbit`,
          color: visual.material.color,
          labelPriority: LABEL_PRIORITY.planetOrbit,
          description: `${definition.label}'s path round the Sun for one full turn from the peak, from the same position source that places ${definition.label} when it is drawn.`,
          provenance: definition.accuracy.position,
          knownLimitations: [
            "A turn's samples joined by straight segments.",
            ...(beyond ? [`The turn reaches past ${new Date(validUntil).getUTCFullYear()}, the last year the position was compared with JPL Horizons; the series itself is not limited to that range.`] : []),
          ],
        },
      }];
    });
}

function turnSpanOrNull(trajectory: Trajectory, peakUtcMs: number): number | null {
  try {
    return fullTurnSpanMs(trajectory, peakUtcMs, PLANET_TURN_STEP_MS, PLANET_TURN_MAX_STEPS);
  } catch (error) {
    if (error instanceof RangeError && /no full turn/.test(error.message)) return null;
    throw error;
  }
}

/** The id of the parent's whole-orbit path: also what the "Whole orbit" camera preset targets. */
export const parentOrbitIdOf = (settings: ShowerSettings): string => `${settings.parentBodyId}-orbit`;

const SAMPLING_STEPS = 2_000;
const REFINE_ITERATIONS = 80;

/**
 * What a path of the parent's whole orbit needs to space its samples by eccentric anomaly: the published eccentricity and semi-major axis
 * give the shape and the period (about the Sun's catalogue GM), and the instant of periapsis is where the catalogue body's own trajectory is
 * nearest the Sun, found by a coarse sweep over one period about `aroundUtcMs` and then refined. Nothing here names a body.
 */
export function parentSamplingOf(settings: ShowerSettings, aroundUtcMs: number): EccentricSampling {
  const catalogue = showerCatalogue(settings);
  const gm = catalogue.get(rootBodyId()).definition.gmKm3S2;
  if (gm === undefined) throw new RangeError("the catalogue's root body has no gravitational parameter");
  const { semiMajorAxisAu, eccentricity } = settings.orbit.elements;
  const periodMs = 2 * Math.PI * Math.sqrt((semiMajorAxisAu * AU_KM) ** 3 / gm) * 1000;
  const parent = catalogue.get(settings.parentBodyId);
  if (parent.source === undefined) throw new RangeError(`parentBodyId "${settings.parentBodyId}" has no state source`);
  const trajectory = parent.source.create(createOrbAstronomyAdapter());
  const radius = (t: number): number => Math.hypot(...trajectory.stateAt(Math.round(t), "sun").positionKm);
  const step = periodMs / SAMPLING_STEPS;
  const start = aroundUtcMs - periodMs / 2;
  let best = start;
  for (let k = 0; k <= SAMPLING_STEPS; k += 1) if (radius(start + k * step) < radius(best)) best = start + k * step;
  let [lo, hi] = [best - step, best + step];
  for (let k = 0; k < REFINE_ITERATIONS; k += 1) {
    const [m1, m2] = [lo + (hi - lo) / 3, hi - (hi - lo) / 3];
    if (radius(m1) < radius(m2)) hi = m2;
    else lo = m1;
  }
  return Object.freeze({ eccentricity, periodMs, periapsisUtcMs: Math.round((lo + hi) / 2) });
}

/**
 * The parent's whole orbit, one full turn from periapsis, from the catalogue body's own (Horizons-checked) trajectory and spaced by
 * eccentric anomaly so the sharp end near the Sun is smooth.
 */
export function createParentOrbitPathLayer(settings: ShowerSettings): PathLayer {
  const catalogue = showerCatalogue(settings);
  const peakUtcMs = Date.parse(settings.activity.peakUtc);
  const { definition, source } = catalogue.get(settings.parentBodyId);
  if (source === undefined) throw new RangeError(`parentBodyId "${settings.parentBodyId}" has no state source`);
  const sampling = parentSamplingOf(settings, peakUtcMs);
  return {
    kind: "orbit",
    color: settings.look.parentPathColor,
    source: source.create(createOrbAstronomyAdapter()),
    span: { startUtcMs: sampling.periapsisUtcMs, endUtcMs: sampling.periapsisUtcMs + Math.round(sampling.periodMs) },
    sampling,
    object: {
      id: parentOrbitIdOf(settings),
      label: `${definition.label} orbit`,
      color: settings.look.parentPathColor,
      labelPriority: LABEL_PRIORITY.parentOrbit,
      description: `The whole orbit of ${settings.parentBody}, the source of the ${settings.label}, from its nearest point to the Sun out to its farthest and back. The stream follows orbits like this one.`,
      provenance: definition.accuracy.position,
      knownLimitations: [
        "One full turn of unperturbed two-body motion about the Sun, starting at the nearest point to the Sun; the samples are spaced by eccentric anomaly and joined by straight segments.",
        ...(definition.accuracy.orientationLimitations ?? []),
      ],
    },
  };
}

/** The Sun, the catalogue's planets (Earth included) and this shower's parent, as the catalogue holds them. */
export function showerComposition(settings: ShowerSettings): SystemComposition {
  const catalogue = showerCatalogue(settings);
  const root = rootBodyId();
  const circling = catalogue.ids().filter((id) => catalogue.get(id).definition.parentId === root);
  if (!circling.includes(settings.parentBodyId)) {
    throw new RangeError(`parentBodyId "${settings.parentBodyId}" is not a catalogued body that circles the Sun (${circling.join(", ")})`);
  }
  // The Sun, the planets and this shower's own parent. A "planet" is a Sun-circling body drawn as a sphere (the catalogue has no category field; a marker body is a
  // comet or asteroid), so another shower's parent is never mounted here.
  const around = circling.filter((id) => id === settings.parentBodyId || catalogue.get(id).visual.kind === "sphere");
  return createComposition(catalogue, { id: `${settings.id}-sun-system`, bodies: [root, ...around], defaultCenter: root });
}

/** The composition's planets: every drawn sphere except the Sun and the parent (a comet is a marker; its nucleus is under a pixel at any scale). */
function planetIdsOf(composition: SystemComposition, settings: ShowerSettings): BodyId[] {
  const catalogue = showerCatalogue(settings);
  return composition.bodies.filter((id) => id !== rootBodyId() && id !== settings.parentBodyId && catalogue.get(id).visual.kind === "sphere");
}

/** The shell items of the composition's bodies: the Sun, Earth and the parent have their own words, every other body is whatever the catalogue holds. */
function bodyObjects(settings: ShowerSettings, composition: SystemComposition): ExperienceObject[] {
  const reach = settings.look.cameraFar;
  return composition.bodies.map((id) => withLabelSetting(settings, bodyObject(settings, composition, id, reach)));
}

function withLabelSetting(settings: ShowerSettings, object: ExperienceObject): ExperienceObject {
  const shown = settings.labels[object.id];
  return shown === undefined ? object : { ...object, showLabel: shown };
}

function bodyObject(settings: ShowerSettings, _composition: SystemComposition, id: BodyId, reach: number): ExperienceObject {
  {
    const catalogue = showerCatalogue(settings);
    const { definition } = catalogue.get(id);
    if (id === rootBodyId()) {
      return catalogueItem(id, {
        labelPriority: LABEL_PRIORITY.sun,
        labelMaxDistance: reach,
        description: "The Sun, the centre of the scene. The stream and the planets' paths circle it.",
        knownLimitations: ["The Sun is drawn as an emissive sphere at its true radius with a soft halo; the halo is a drawing aid sized on screen, not part of the Sun.", ...(catalogue.get(id).definition.accuracy.orientationLimitations ?? [])],
      }, catalogue);
    }
    if (id === "earth") {
      return catalogueItem(id, {
        color: "#9fd8ff",
        labelPriority: LABEL_PRIORITY.earth,
        labelMaxDistance: reach,
        description: `The planet that crosses the stream of the ${settings.label}.`,
        knownLimitations: [
          ...EARTH_EPHEMERIS.knownLimitations,
          `In the Solar system scale Earth is drawn ${settings.look.planetExaggeration} times larger than life so it can be seen; distances stay true.`,
        ],
      }, catalogue);
    }
    if (id === settings.parentBodyId) {
      return catalogueItem(id, {
        labelPriority: LABEL_PRIORITY.parent,
        labelMaxDistance: reach,
        description: `${definition.label}, the parent of the ${settings.label}, at its position on the date shown. Its whole orbit is drawn.`,
      }, catalogue);
    }
    return catalogueItem(id, {
      labelPriority: LABEL_PRIORITY.planet,
      labelMaxDistance: reach,
      description: `${definition.label}, at its catalogued position about the Sun on the date shown.`,
      knownLimitations: [
        ...(definition.accuracy.orientationLimitations ?? []),
        `In the Solar system scale ${definition.label} is drawn ${settings.look.planetExaggeration} times larger than life so it can be seen; distances stay true.`,
      ],
    }, catalogue);
  }
}

/** The live switches the Developer section lists: the orbit set (once loaded) and, for a shower that can read the GMN, the source. Undefined when there is none. */
function alternatesOf(settings: ShowerSettings, load: MeasuredLoad, set: OrbitSet, source: OrbitSource, offered: readonly OrbitSource[]): ExperienceDefinition["alternates"] {
  const alternates = [
    ...(load.kind !== "loaded" ? [] : (["all", "reliable"] as const).map((option) => ({
      label: option === "all" ? `All orbits (${orbitSetCounts(load.orbits, settings.stream.quality.rule).all})` : `Reliable only (${orbitSetCounts(load.orbits, settings.stream.quality.rule).reliable})`,
      param: "orbits",
      value: option,
      active: option === set,
    }))),
    // A source switch needs a choice: it is listed only when the build can read at least two of the shower's sources.
    ...(settings.stream.sources.gmn === undefined || offered.length < 2 ? [] : (["cams", "gmn"] as const).filter((option) => offered.includes(option)).map((option) => ({
      label: option === "cams" ? "Orbits from CAMS" : "Orbits from GMN",
      param: "source",
      value: option,
      active: option === source,
    }))),
  ];
  return alternates.length === 0 ? undefined : alternates;
}

/**
 * Turns shower settings and the shower's measured orbits into an experience definition; nothing here names a particular shower. When the
 * orbits are not on this machine the experience says so and draws no stream: there is no stand-in.
 */
export function buildShowerDefinition(settings: ShowerSettings, load: MeasuredLoad, set: OrbitSet = settings.stream.quality.default, source: OrbitSource = settings.stream.source, offered: readonly OrbitSource[] = offeredSources(settings.id, settings.stream.iauCode, settings.stream.sources.gmn === undefined ? ["cams"] : ["cams", "gmn"])): ExperienceDefinition {
  const composition = showerComposition(settings);
  const layer = load.kind === "loaded" ? createStreamLayer(settings, load.orbits, set, source) : null;
  const window = createActivityWindow(settings);
  const streamId = streamIdOf(settings);
  const { startUtcMs, endUtcMs } = timelineBoundsOf(settings);
  const radiant = radiantMetricOf(settings);
  const parentOrbitId = parentOrbitIdOf(settings);
  const events = createEvents([
    { id: `${settings.id}-start`, label: `${settings.label} activity begins`, timeUtcMs: window.startUtcMs },
    { id: `${settings.id}-peak`, label: `${settings.label} peak`, timeUtcMs: window.peakUtcMs ?? window.startUtcMs },
    { id: `${settings.id}-end`, label: `${settings.label} activity ends`, timeUtcMs: window.endUtcMs },
  ]);
  const objects = [...bodyObjects(settings, composition), ...(load.kind === "loaded" ? [] : [absentStreamObject(settings, load, source)])];
  // A panel may name any object the experience lists, or the stream when it is drawn.
  const storyPanels = showerStoryPanels(settings, [...objects.map((object) => object.id), ...(layer === null ? [] : [streamId])], events, { startUtcMs, endUtcMs });
  const experience: ExperienceConfig = {
    objects,
    cameraPresets: [
      { id: "overview", label: "Overview", request: { kind: "overview" } },
      { id: "focus-earth", label: "Focus Earth", request: { kind: "focus", target: "earth" } },
      { id: "follow-earth", label: "Follow Earth", request: { kind: "follow", target: "earth" } },
      { id: "focus-parent", label: "Focus parent", request: { kind: "focus", target: settings.parentBodyId } },
      { id: "whole-orbit", label: "Whole orbit", request: { kind: "focus", target: parentOrbitId } },
      ...(layer === null
        ? []
        : [
            { id: "focus-stream", label: "Focus stream", request: { kind: "focus", target: streamId } } as const,
            { id: "follow-stream", label: "Follow stream", request: { kind: "follow", target: streamId } } as const,
          ]),
    ],
    events,
    windows: [window],
    window: { startUtcMs, endUtcMs },
    ...(storyPanels === undefined ? {} : { storyPanels }),
    rates: [...new Set([3_600, 43_200, 86_400, 259_200, 604_800, settings.timeline.rateSecondsPerSecond])].sort((a, b) => a - b),
    eventProvenance: createProvenance({
      sourceType: "observed",
      sources: [sourceLine(settings.activity.source)],
      accuracy: "Activity dates as published; the peak instant is chosen inside the published night.",
      notes: "",
    }),
  };
  return {
    experience,
    clock: { startUtcMs, rate: settings.timeline.rateSecondsPerSecond },
    alternates: alternatesOf(settings, load, set, source, offered),
    loop: settings.look.loop,
    viewUp: settings.look.viewUp,
    ...(settings.look.startView === undefined ? {} : { startView: settings.look.startView }),
    sceneLayers: ["points", "sun-centred"],
    composition,
    ...(settings.parentElements === undefined ? {} : { catalogue: showerCatalogue(settings) }),
    sceneCenter: rootBodyId(),
    scaleChoices: ["true-scale", "solar-system"],
    visualOverrides: Object.fromEntries(planetIdsOf(composition, settings).map((id) => [id, { exaggeration: settings.look.planetExaggeration }])),
    trackedBodies: [],
    groups: layer === null ? [] : [layer],
    paths: [createEarthPathLayer(settings), ...createPlanetOrbitPathLayers(settings), createParentOrbitPathLayer(settings)],
    camera: { maxFocusDistance: settings.look.cameraMaxFocusDistance, far: settings.look.cameraFar },
    createMetrics: ({ resolver }) => {
      const base = bodyMetrics(resolver, composition.bodies, ["distance"]);
      return (objectId: string, timeUtcMs: number): readonly Metric[] =>
        objectId === streamId ? [rateMetricOf(settings, window, timeUtcMs), radiant] : base(objectId, timeUtcMs);
    },
  };
}
