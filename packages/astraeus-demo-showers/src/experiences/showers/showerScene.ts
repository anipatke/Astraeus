// The meteor showers as stories on the public API: a Scene built from a shower's settings and its measured orbits, with `astraeus` as the only import.
import { Scene, earth, jupiter, mars, mercury, sun, trueScale, venus, type ActivityInput, type BodyRef, type EventInput, type GroupInput, type Provenance, type StoryPanelsInput } from "astraeus";
import type { MeasuredLoad, MeasuredOrbits } from "./measuredOrbits";
import { orbitSetCounts } from "./measuredOrbits";
import { DAY_MS, HOUR_MS, sourceLine, streamIdOf, timelineBoundsOf, windowIdOf } from "./showerBasics";
import { citedSourceOf, ShowerSettingsError, type ShowerSettings, type StartView } from "./showerSettings";
import { absentStreamNotice, radiantSentence, streamLimitations } from "./showerText";

/** The planets each shower scene draws with the Sun, Earth and its parent (their overview and scales were made for planets out to Jupiter). */
const PLANETS: readonly BodyRef[] = [mercury, venus, mars, jupiter];
/** The speeds the timeline offers, simulated seconds per real second, beside the settings' own opening rate. */
const RATES: readonly number[] = [3_600, 43_200, 86_400, 259_200, 604_800];
/** The opening view of a shower whose settings declare none: the Sun from above the ecliptic, the planets' orbits in frame. */
const DEFAULT_VIEW = { azimuthDeg: 100, elevationDeg: 40, distance: 250_000 } as const;

/**
 * Loads the panels file a shower's settings name, from the lazy `lookup` of panels files keyed by repo-relative path (so only the chosen shower's is fetched).
 * Undefined when the settings carry no path (none, or inline panels); a path that names no file in the project is a settings error.
 */
export async function loadShowerPanelsFile(settings: ShowerSettings, lookup: Readonly<Record<string, () => Promise<unknown>>>): Promise<unknown> {
  const path = settings.story?.panels;
  if (typeof path !== "string") return undefined;
  const load = lookup[`../${path}`];
  if (load === undefined) throw new ShowerSettingsError(`shower settings story.panels names "${path}", which is not a panels file in the project`);
  return load();
}

/** Rate samples: one per day over the window and one at the peak, falling off from the peak by powers of ten. */
export function rateSamplesOf(settings: ShowerSettings): ActivityInput["samples"] {
  const { startUtc, endUtc, peakUtc, peakRate, fallOffPerDay } = settings.activity;
  const [startMs, endMs, peakMs] = [startUtc, endUtc, peakUtc].map(Date.parse) as [number, number, number];
  const times = new Set<number>([peakMs, startMs, endMs]);
  for (let t = startMs + DAY_MS; t < endMs; t += DAY_MS) times.add(t);
  return [...times].sort((a, b) => a - b).map((time) => ({ time, value: peakRate * 10 ** (-fallOffPerDay * (Math.abs(time - peakMs) / DAY_MS)) }));
}

const provenanceOf = (sourceType: Provenance["sourceType"], sources: readonly string[], accuracy: string, notes: string): Provenance => ({ sourceType, sources, accuracy, notes });

function modelledProvenance(side: "rise" | "fall"): Provenance {
  return provenanceOf("illustrative", ["Modelled rate curve; not observed"], "None claimed. The rate between the published points falls off smoothly from the peak.", side === "rise" ? "Modelled rise toward the published peak." : "Modelled fall after the published peak.");
}

/** The shower's activity: the rate curve (the timeline's glow and the stream's rate bar), its peak, and which stretches are published and which modelled. */
function activityOf(settings: ShowerSettings): ActivityInput {
  const { startUtc, endUtc, peakUtc, rateUnit, source, peakPublishedNight, peakRate } = settings.activity;
  const [startMs, endMs, peakMs] = [startUtc, endUtc, peakUtc].map(Date.parse) as [number, number, number];
  const halfNight = 12 * HOUR_MS;
  const nightStart = Math.max(startMs, peakMs - halfNight);
  const nightEnd = Math.min(endMs, peakMs + halfNight);
  const published = provenanceOf("observed", [sourceLine(source)], `As published for the night of ${peakPublishedNight}; not checked against the primary source.`, `The published peak night and peak rate of ${peakRate}. The exact instant inside the night is chosen for the picture.`);
  return {
    id: windowIdOf(settings),
    label: `${settings.label} activity`,
    unit: rateUnit,
    start: startMs,
    end: endMs,
    peak: peakMs,
    peakLabel: "Published peak",
    type: "meteor-shower",
    samples: rateSamplesOf(settings),
    provenance: [
      { start: startMs, end: nightStart, provenance: modelledProvenance("rise") },
      { start: nightStart, end: nightEnd, provenance: published },
      { start: nightEnd, end: endMs, provenance: modelledProvenance("fall") },
    ].filter((span) => span.end > span.start),
  };
}

/** The three events on the timeline: where the activity begins, peaks and ends. */
function eventsOf(settings: ShowerSettings): EventInput[] {
  const { startUtc, endUtc, peakUtc } = settings.activity;
  return [
    { id: `${settings.id}-start`, label: `${settings.label} activity begins`, time: startUtc },
    { id: `${settings.id}-peak`, label: `${settings.label} peak`, time: peakUtc },
    { id: `${settings.id}-end`, label: `${settings.label} activity ends`, time: endUtc },
  ];
}

function measuredProvenance(settings: ShowerSettings, orbits: MeasuredOrbits): Provenance {
  const { provenance } = orbits;
  const { counts } = provenance;
  return provenanceOf(
    "observed",
    [...(provenance.citations ?? [provenance.citation]), sourceLine(citedSourceOf(settings))],
    "Orbit solutions from video meteor observations. The shape and tilt of each orbit are measured; its semi-major axis is the weakest element.",
    `${provenance.database}, IAU shower ${provenance.iauCode}: ${counts.members} records, ${counts.unbound} unbound or incomplete records dropped, ${counts.kept} bound orbits in the file, ${orbits.members.length} orbits drawn (all orbits). Fetched ${provenance.fetchedAt}.${provenance.licence === undefined ? "" : ` Licence ${provenance.licence} (${settings.stream.sources.gmn.licenceUrl}), credit the Global Meteor Network.`}`,
  );
}

/** The stream as one group: one dot per measured orbit, the clump (when the settings state one) near the parent, the rate bar on its card. */
function streamOf(settings: ShowerSettings, orbits: MeasuredOrbits): GroupInput {
  const { concentration } = settings.stream;
  const { look } = settings;
  const counts = orbitSetCounts(orbits, settings.stream.quality.rule);
  return {
    id: streamIdOf(settings),
    label: `${settings.label} stream`,
    orbits: orbits.members.map(({ recordId, epochUtcMs, elements }) => ({ id: recordId, time: epochUtcMs, ...elements })),
    color: look.streamColor,
    dotSizePx: look.pointSizePx,
    referenceTime: settings.activity.peakUtc,
    seed: settings.stream.seed,
    ...(concentration.fraction > 0 ? { clump: { near: settings.parentBodyId, fraction: concentration.fraction, widthDeg: concentration.widthDeg } } : {}),
    refillAfterMs: look.refillAfterHours * HOUR_MS,
    ...(look.refillSliceMs === undefined ? {} : { refillSliceMs: look.refillSliceMs }),
    provenance: measuredProvenance(settings, orbits),
    description: `${orbits.members.length} measured meteoroid orbits of the ${settings.label}, each drawn as one dot (${orbits.provenance.database}). The orbits' shapes and tilts are measured; where each dot sits along its orbit is illustrative${concentration.fraction > 0 ? `, and the clump near ${settings.parentBody} is a model` : ""}. One item stands for the whole stream; its focus point is the centroid of the dots. ${radiantSentence(settings)}`,
    knownLimitations: streamLimitations(settings, counts, orbits.provenance),
    readouts: [{ kind: "rate", activity: windowIdOf(settings) }],
  };
}

/** The panels object for the scene: from the file the caller loaded or inline in the settings; a panel naming the stream is kept, but loses that name when no stream is drawn. */
function panelsOf(settings: ShowerSettings, panelsFile: unknown, streamDrawn: boolean): StoryPanelsInput | undefined {
  if (settings.story === undefined) return undefined;
  const given = settings.story.panels;
  const raw = (typeof given === "string" ? panelsFile : given) as StoryPanelsInput | undefined;
  if (raw === undefined) return undefined; // a path whose file the caller has not loaded: the entry raises the missing-file error before it gets here
  if (streamDrawn) return raw;
  const streamId = streamIdOf(settings);
  return { ...raw, panels: raw.panels.map((panel) => ((panel as { object?: string }).object === streamId ? { ...(panel as object), object: undefined } : panel)) };
}

/** The opening view: the settings' own, else the Sun from above the ecliptic. Looks at its focus without following it; up is the settings' `viewUp`. */
function openingViewOf(settings: ShowerSettings): StartView {
  return settings.look.startView ?? { focus: "sun", ...DEFAULT_VIEW, distance: Math.min(DEFAULT_VIEW.distance, settings.look.cameraMaxFocusDistance / 2) };
}

/**
 * A shower as a story on the public API: the Sun, Earth, the planets and the parent with their orbit lines, the stream as one group of dots, the
 * activity curve with its three events, the story panels, and the camera, scale and timeline the settings ask for. When the measured orbits are not
 * available no stream is drawn and the Sun says so; none is invented. `mount` it, or hand `toDefinition()` to the site.
 */
export function buildShowerScene(settings: ShowerSettings, load: MeasuredLoad, panelsFile?: unknown, production: boolean = import.meta.env.PROD): Scene {
  const { look, parentBodyId } = settings;
  const shown = (id: string) => (settings.labels[id] === undefined ? {} : { showLabel: settings.labels[id] });
  const enlarged = `${look.planetExaggeration} times larger than life so it can be seen; distances stay true`;
  const scene = new Scene();
  const absent = load.kind === "loaded" ? "" : ` ${absentStreamNotice(settings, load, production)}`;
  scene.addBody(sun, { ...shown("sun"), description: `The Sun, the centre of the scene. The stream and the planets' paths circle it. The Sun is drawn as an emissive sphere at its true radius with a soft halo; the halo is a drawing aid sized on screen, not part of the Sun.${absent}` });
  scene.addBody(earth, { ...shown("earth"), orbit: true, enlarge: look.planetExaggeration, color: "#9fd8ff", description: `The planet that crosses the stream of the ${settings.label}. In the Solar system scale Earth is drawn ${enlarged}.` });
  const parent = (): void => {
    const options = { ...shown(parentBodyId), orbit: true, description: `${settings.parentElements?.label ?? settings.parentBody}, the parent of the ${settings.label}, at its position on the date shown. Its whole orbit is drawn.` };
    if (settings.parentElements === undefined) scene.addBody(parentBodyId, options);
    else scene.addBodyFromElements(settings.parentElements, options);
  };
  for (const planet of PLANETS) {
    if (planet.id === parentBodyId) { parent(); continue; }
    scene.addBody(planet, { ...shown(planet.id), orbit: true, enlarge: look.planetExaggeration, description: `${planet.label}, at its catalogued position about the Sun on the date shown. In the Solar system scale ${planet.label} is drawn ${enlarged}.` });
  }
  if (!PLANETS.some((planet) => planet.id === parentBodyId)) parent();
  const activity = activityOf(settings);
  scene.addActivity(activity);
  if (load.kind === "loaded") scene.addGroup(streamOf(settings, load.orbits));
  scene.addEvents(eventsOf(settings), { provenance: provenanceOf("observed", [sourceLine(settings.activity.source)], "Activity dates as published; the peak instant is chosen inside the published night.", settings.activity.source.note ?? "") });
  const panels = panelsOf(settings, panelsFile, load.kind === "loaded");
  if (panels !== undefined) scene.addStoryPanels(panels);
  const { startUtcMs, endUtcMs } = timelineBoundsOf(settings);
  scene.setTimeline({ start: startUtcMs, end: endUtcMs, rates: [...new Set([...RATES, settings.timeline.rateSecondsPerSecond])].sort((a, b) => a - b), rate: settings.timeline.rateSecondsPerSecond, loop: look.loop });
  scene.setScale(trueScale);
  scene.camera.setReach(look.cameraMaxFocusDistance);
  const view = openingViewOf(settings);
  scene.camera.lookAt(view.focus, { azimuthDeg: view.azimuthDeg, elevationDeg: view.elevationDeg, distance: view.distance, up: look.viewUp });
  return scene;
}
