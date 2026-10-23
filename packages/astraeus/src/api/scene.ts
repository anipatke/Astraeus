import type { BodyId } from "../core/body";
import type { TimelineEvent } from "../core/events";
import { createProvenance, type Provenance } from "../core/provenance";
import { SampledTrajectory, type TrajectorySample } from "../core/sampledTrajectory";
import { readableScale, trueScale, type ScalePolicy } from "../core/scalePolicy";
import type { State } from "../core/state";
import type { TimeBounds, Trajectory } from "../core/trajectory";
import { loadPlanetSeries } from "../core/planetSeries";
import { catalogue } from "../assets/catalogue";
import { createComposition, SIDEREAL_MONTH_MS, type CompositionPath } from "../assets/compositions";
import { IO_PERIOD_DAYS } from "../core/bodies/io";
import { bodyMetrics } from "../app/bodyMetrics";
import type { ExperienceDefinition } from "../app/experienceDefinition";
import { needsPlanetSeries } from "../app/planetNeeds";
import type { TrackedBody } from "../app/mission";
import type { StoryPanelSet } from "../shell/storyPanels";
import type { Metric } from "../shell/metrics";
import type { ExperienceObject } from "../shell/experience";
import { catalogueItem } from "../app/catalogueItem";
import { createReadoutMetrics } from "../app/trackedMetrics";
import { readyMade, type BodyRef } from "./bodies";
import { installData, type DataSource } from "./data";
export type { DataSource, MoonPositions } from "./data";
import { SceneError } from "./errors";
import { toUtcMs, type TimeInput } from "./time";
import { switchesOf, type SwitchesInput } from "./switches";
import type { DisplaySwitchSettings } from "../app/displaySwitches";
import { eventsOf, panelsOf, timelineOf, type AddEventsOptions, type EventInput, type StoryPanelsInput, type TimelineInput, type TimelineSetting } from "./story";
export { toUtcMs, type TimeInput } from "./time";

/** Options of `addBody`. */
export interface AddBodyOptions {
  /** Draws the body's orbit about its parent as a line (the engine's own orbit line). Only the Moon (about Earth) and Io (about Jupiter) have one in 0.1; others throw `no-orbit`. */
  readonly orbit?: boolean;
  /** One or two plain sentences for the body's info card. */
  readonly description?: string;
  /** The body's colour on its info card and label, as a CSS hex colour such as "#9fd8ff"; the catalogue's own when absent. A bad value throws `bad-body`. */
  readonly color?: string;
  /** Known limits shown with the body's provenance, replacing the catalogue's own; a list of non-empty texts. A bad value throws `bad-body`. */
  readonly knownLimitations?: readonly string[];
}

/** A source anchor on a path: a point the data was published at, drawn as a dot and labelled with its id. Its time must fall within the path. */
export interface AnchorInput {
  readonly id: string;
  readonly time: TimeInput;
}

/**
 * A bar on a path's info card: `range` (distance from the path's centre body; `marker` also marks where a named body is now), `speed` (its bar scaled
 * to the path's highest speed at its anchors), `distance` (centre to centre to a named body) and `altitude` (above a named body's mean radius).
 * A named body must be in the scene.
 */
export type ReadoutInput =
  | { readonly kind: "range"; readonly marker?: BodyId }
  | { readonly kind: "speed" }
  | { readonly kind: "distance"; readonly to: BodyId }
  | { readonly kind: "altitude"; readonly above: BodyId };

/** The orbits the engine can draw: the parent the line is measured from, and the span one lap covers. */
const ORBITS: Readonly<Record<string, { readonly parent: BodyId; readonly path: Omit<CompositionPath, "body"> }>> = {
  moon: { parent: "earth", path: { spanMs: SIDEREAL_MONTH_MS } },
  io: { parent: "jupiter", path: { spanMs: IO_PERIOD_DAYS * 86_400_000, look: { endFadeOn: false } } },
};

/** One sample of a recorded path: position in km (and optionally velocity in km/s) about the trajectory's centre. */
export interface TrajectorySampleInput {
  readonly time: TimeInput;
  readonly positionKm: ArrayLike<number>;
  readonly velocityKmS?: ArrayLike<number>;
}

interface TrajectoryBase {
  readonly id: string;
  readonly label?: string;
  readonly color?: string;
  /** The body the positions are measured from; defaults to "earth". */
  readonly center?: BodyId;
  readonly provenance?: Provenance;
  /** One or two plain sentences for the path's info card. */
  readonly description?: string;
  /** Published limits of the data, shown with the provenance. */
  readonly knownLimitations?: readonly string[];
  /** Source anchors, drawn as dots on the path and labelled with their ids. */
  readonly anchors?: readonly AnchorInput[];
  /** Bars for the info card, in order. */
  readonly readouts?: readonly ReadoutInput[];
}
/** A path given as sampled states, or as a provider with `stateAt(time)` and the span it covers. */
export type TrajectoryInput =
  | (TrajectoryBase & { readonly samples: readonly TrajectorySampleInput[] })
  | (TrajectoryBase & { readonly provider: { stateAt(timeUtcMs: number, center?: BodyId): State }; readonly bounds: { readonly start: TimeInput; readonly end: TimeInput } });

/** The camera's opening view of a followed object; the angles are degrees, the distance is in Earth radii. */
export interface FollowView {
  readonly azimuthDeg?: number;
  readonly elevationDeg?: number;
  readonly distance?: number;
}

const DEFAULT_COLOR = "#ffd27a";
const DAY_MS = 86_400_000;
const PROVIDER_PATH_SAMPLES = 128;
const SCALES: readonly ScalePolicy[] = [trueScale, readableScale];

interface Tracked {
  readonly body: TrackedBody;
  readonly center: BodyId;
  readonly description?: string;
  readonly knownLimitations?: readonly string[];
  readonly readouts: readonly ReadoutInput[];
}

/** The scene's camera: what it opens on. */
export class SceneCamera {
  #target: string | undefined;
  #following = false;
  #view: FollowView = {};
  readonly #has: (id: string) => boolean;
  constructor(has: (id: string) => boolean) {
    this.#has = has;
  }
  /** Opens framed on a body or trajectory already added to the scene and already following it (the viewer's Follow button shows as pressed). */
  follow(id: string, view: FollowView = {}): this {
    return this.#open("follow", id, view, true);
  }
  /** Opens framed on a body or trajectory already added to the scene, looking at it but not following it (the viewer's Focus button shows as pressed). The last of `follow` and `lookAt` wins. */
  lookAt(id: string, view: FollowView = {}): this {
    return this.#open("lookAt", id, view, false);
  }
  #open(call: string, id: string, view: FollowView, following: boolean): this {
    if (!this.#has(id)) throw new SceneError("unknown-body", `camera.${call}("${id}"): no body or trajectory with that id has been added to the scene`);
    this.#target = id;
    this.#following = following;
    this.#view = view;
    return this;
  }
  get target(): string | undefined { return this.#target; }
  /** Whether the opening view follows its target (`follow`) rather than only looking at it (`lookAt`). */
  get following(): boolean { return this.#following; }
  get view(): FollowView { return this.#view; }
}

/**
 * A scene built with imperative calls. `mount(element, scene)` draws it; `toDefinition()` is what the app is given. Every method returns the scene, so calls chain.
 * @example
 * const scene = new Scene()
 *   .addBody(earth)
 *   .addBody(moon, { orbit: true })
 *   .setTime("2026-01-01T00:00:00Z");
 * scene.camera.follow("moon", { distance: 60 });
 */
export class Scene {
  /** The camera: `scene.camera.follow(id)` opens framed on a body or trajectory. */
  readonly camera: SceneCamera;
  readonly #bodies = new Map<BodyId, BodyRef>();
  readonly #tracked = new Map<string, Tracked>();
  readonly #orbits = new Set<BodyId>();
  readonly #notes = new Map<BodyId, string>();
  readonly #looks = new Map<BodyId, Pick<AddBodyOptions, "color" | "knownLimitations">>();
  #timeUtcMs: number | undefined;
  #scale: ScalePolicy = trueScale;
  #scaleOnly = false;
  #events: readonly TimelineEvent[] = [];
  #eventProvenance: Provenance | undefined;
  #panels: StoryPanelsInput | undefined;
  #timeline: TimelineSetting | undefined;
  #switches: DisplaySwitchSettings | undefined;

  constructor() {
    this.camera = new SceneCamera((id) => this.#bodies.has(id) || this.#tracked.has(id));
  }

  /** Adds a catalogued body: a ready-made one (`earth`, `moon`, ...) or its id. The first body added is the scene's centre. `{ orbit: true }` also draws its orbit line. */
  addBody(body: BodyRef | BodyId, options: AddBodyOptions = {}): this {
    const id = typeof body === "string" ? body : body.id;
    if (options.orbit === true && ORBITS[id] === undefined) throw new SceneError("no-orbit", `addBody("${id}", { orbit: true }): the engine draws the orbit line of ${Object.keys(ORBITS).join(" and ")} only`);
    if (!catalogue.has(id)) throw new SceneError("unknown-body", `addBody("${id}"): not a catalogued body (known: ${catalogue.ids().join(", ")})`);
    if (this.#bodies.has(id) || this.#tracked.has(id)) throw new SceneError("duplicate-id", `addBody("${id}"): already in the scene`);
    checkBodyLook(id, options);
    if (options.orbit === true) this.#orbits.add(id);
    if (options.color !== undefined || options.knownLimitations !== undefined) this.#looks.set(id, { ...(options.color === undefined ? {} : { color: options.color }), ...(options.knownLimitations === undefined ? {} : { knownLimitations: options.knownLimitations }) });
    if (options.description !== undefined) this.#notes.set(id, options.description);
    this.#bodies.set(id, typeof body === "string" ? readyMade(id) ?? { id, label: catalogue.get(id).definition.label } : body);
    return this;
  }

  /** Adds a path to follow and draw, from sampled states or a provider with `stateAt(time)`. */
  addTrajectory(input: TrajectoryInput): this {
    const id = input.id;
    if (typeof id !== "string" || id === "") throw new SceneError("bad-trajectory", "addTrajectory: the trajectory needs a non-empty id");
    if (this.#bodies.has(id) || this.#tracked.has(id)) throw new SceneError("duplicate-id", `addTrajectory("${id}"): that id is already in the scene`);
    const center = input.center ?? "earth";
    if (!catalogue.has(center)) throw new SceneError("unknown-body", `addTrajectory("${id}"): centre "${center}" is not a catalogued body`);
    const provenance = input.provenance ?? createProvenance({ sourceType: "illustrative", sources: ["Supplied by the caller"], accuracy: "As supplied; the engine makes no claim.", notes: "Positions were passed to addTrajectory." });
    const common = { id, label: input.label ?? id, color: input.color ?? DEFAULT_COLOR, anchorTimesUtcMs: [], provenance };
    const readouts = readoutsOf(id, input.readouts);
    const body = "samples" in input ? sampledBody(common, input, center) : providerBody(common, input);
    this.#tracked.set(id, { center, body: withAnchors(body, input.anchors), readouts, ...(input.description === undefined ? {} : { description: input.description }), ...(input.knownLimitations === undefined ? {} : { knownLimitations: input.knownLimitations }) });
    return this;
  }

  /** Sets the moment the scene opens at. */
  setTime(time: TimeInput): this {
    this.#timeUtcMs = toUtcMs(time, "setTime");
    return this;
  }

  /** Chooses the opening scale: `trueScale` or `readableScale`; the viewer can switch to the other, unless `{ only: true }` offers this scale alone. */
  setScale(scale: ScalePolicy, options: { readonly only?: boolean } = {}): this {
    if (!SCALES.some((known) => known.id === scale?.id)) throw new SceneError("bad-scale", `setScale: "${String(scale?.id)}" is not a scale; use trueScale or readableScale`);
    this.#scale = scale;
    this.#scaleOnly = options.only === true;
    return this;
  }

  /** Adds timed events to the timeline, each with an id, a label and a moment; `provenance` says where the times come from and is shown with every event. May be called more than once. */
  addEvents(events: readonly EventInput[], options: AddEventsOptions = {}): this {
    this.#events = eventsOf(events, this.#events);
    if (options.provenance !== undefined) this.#eventProvenance = options.provenance;
    return this;
  }

  /** Adds story panels that open as playback reaches them. Their times may name events (`addEvents`) and path anchors, and `object` a body or path; these are checked when the scene is built (`mount`), and a mistake throws `bad-panels` naming the panel and field. */
  addStoryPanels(panels: StoryPanelsInput): this {
    this.#panels = panels;
    return this;
  }

  /** Sets the timeline: its span (`start`, `end`), the speeds offered (`rates`) and the speed it opens at (`rate`), or `{ none: true }` for no timeline bar, with time frozen at `at` or running at `rate`. Without this call the span follows the paths and the speeds are 1 minute, 1 hour and 1 day per second. */
  setTimeline(timeline: TimelineInput): this {
    this.#timeline = timelineOf(timeline);
    return this;
  }

  /**
   * Places the display switches: for each of `orbitLines` (orbit ring, trailing arc and moon orbits), `labels` (body and anchor labels) and `milkyWay` (the sky picture), `place` is
   * `"top-bar"` (a button in the bar), `"panel"` (a row in one switch panel opened from the bar) or `"developer"` (only in the Developer drawer, where every switch stays), and `on` is
   * whether it starts on (default on). A switch the scene has nothing for (orbit lines with no orbit drawn) shows nowhere. May be called more than once; later calls replace the same switch.
   * A bad switch name, place or `on` throws `bad-switch`.
   * @example
   * scene.setSwitches({ orbitLines: { place: "top-bar" }, labels: { place: "panel", on: false }, milkyWay: { place: "developer", on: false } });
   */
  setSwitches(switches: SwitchesInput): this {
    this.#switches = switchesOf(switches, this.#switches);
    return this;
  }

  /** The state of a trajectory added with `addTrajectory` at a moment, about its centre body (position in km, velocity in km/s): for figures a story quotes, such as a peak speed. Throws `unknown-body` for any other id and `bad-time` for a moment outside the path. */
  stateOf(id: string, time: TimeInput): State {
    const entry = this.#tracked.get(id);
    if (entry === undefined) throw new SceneError("unknown-body", `stateOf("${id}"): no trajectory with that id has been added to the scene`);
    const timeUtcMs = toUtcMs(time, `stateOf("${id}") time`);
    const { startUtcMs, endUtcMs } = entry.body.trajectory.bounds;
    if (timeUtcMs < startUtcMs || timeUtcMs > endUtcMs) throw new SceneError("bad-time", `stateOf("${id}"): ${new Date(timeUtcMs).toISOString()} is outside the path (${new Date(startUtcMs).toISOString()} to ${new Date(endUtcMs).toISOString()})`);
    return entry.body.trajectory.stateAt(timeUtcMs, entry.center);
  }

  /** The story panels, resolved against this scene's events, anchors, objects and timeline span. */
  #storyPanels(window: TimeBounds): StoryPanelSet | undefined {
    if (this.#panels === undefined) return undefined;
    const anchors = new Map<string, number>();
    for (const { body } of this.#tracked.values()) body.anchorLabels?.forEach((label, index) => { if (!anchors.has(label)) anchors.set(label, body.anchorTimesUtcMs[index]!); });
    return panelsOf(this.#panels, { events: this.#events, anchors, objectIds: [...this.#bodies.keys(), ...this.#tracked.keys()], window });
  }

  /** A readout names a body the scene must hold, so it can be measured against. */
  #checkReadouts(entry: Tracked, ids: readonly BodyId[]): void {
    for (const spec of entry.readouts) {
      const named = readoutBody(spec);
      if (named !== undefined && !ids.includes(named)) throw new SceneError("bad-readout", `addTrajectory("${entry.body.id}"): readout ${spec.kind} names "${named}", which has not been added to the scene`);
    }
  }

  /** The data packages the added bodies need that `data` does not provide. */
  missingData(data: readonly DataSource[] = []): readonly string[] {
    const have = new Set(data.flatMap((source) => source.provides));
    const named = new Set(data.map((source) => source.name));
    return [...new Set([...this.#bodies.values()].filter((body) => body.requires !== undefined && !have.has(body.id) && !named.has(body.requires)).map((body) => body.requires!))];
  }

  /** The app's plug-in contract for this scene. Throws if the scene is empty or a body needs a data package not passed in `data`. */
  toDefinition(data: readonly DataSource[] = []): ExperienceDefinition {
    if (this.#bodies.size === 0) throw new SceneError("empty-scene", "the scene has no bodies; call addBody before mount");
    const missing = this.missingData(data);
    if (missing.length > 0) {
      const names = [...this.#bodies.values()].filter((body) => body.requires !== undefined && missing.includes(body.requires)).map((body) => body.id);
      throw new SceneError("missing-data", `${names.join(", ")} needs the ${missing.join(", ")} package: install it and pass it as mount(element, scene, { data: [...] })`);
    }
    const ids = [...this.#bodies.keys()];
    const paths = [...this.#orbits].map((id): CompositionPath => {
      const orbit = ORBITS[id]!;
      if (!this.#bodies.has(orbit.parent)) throw new SceneError("no-orbit", `addBody("${id}", { orbit: true }): the orbit is drawn about ${orbit.parent}, which has not been added to the scene`);
      return { body: id, ...orbit.path };
    });
    for (const entry of this.#tracked.values()) this.#checkReadouts(entry, ids);
    const tracked = [...this.#tracked.values()].map((entry) => entry.body);
    const timeline = this.#timeline;
    const { window, startUtcMs } = spanOf(timeline, this.#timeUtcMs, tracked);
    const target = this.camera.target;
    const view = this.camera.view;
    const storyPanels = this.#storyPanels(window);
    const labelled = [...this.#bodies.values(), ...tracked].map(({ id, label }) => ({ id, label }));
    const definition: ExperienceDefinition = {
      experience: {
        objects: [
          ...[...this.#bodies.values()].map((body): ExperienceObject => ({ ...catalogueItem(body.id, { labelPriority: 100 - ids.indexOf(body.id), labelMaxDistance: 500, ...(this.#notes.has(body.id) ? { description: this.#notes.get(body.id) } : {}), ...this.#looks.get(body.id) }), label: body.label })),
          ...[...this.#tracked.values()].map(({ body, description, knownLimitations }): ExperienceObject => ({ id: body.id, label: body.label, color: body.color, availability: body.trajectory.bounds, labelPriority: 80, labelMaxDistance: 4, provenance: body.provenance, ...(description === undefined ? {} : { description }), ...(knownLimitations === undefined ? {} : { knownLimitations }) })),
        ],
        cameraPresets: cameraPresetsOf(labelled),
        ...(target === undefined ? {} : { startCameraPresetId: `${this.camera.following ? "follow" : "focus"}-${target}` }),
        events: this.#events,
        ...(this.#eventProvenance === undefined ? {} : { eventProvenance: this.#eventProvenance }),
        ...(storyPanels === undefined ? {} : { storyPanels }),
        ...(timeline?.none === true ? { hideTimeline: true } : {}),
        window,
        rates: timeline?.rates ?? [60, 3_600, DAY_MS / 1000],
      },
      clock: clockOf(timeline, startUtcMs),
      sceneLayers: ["tracked-bodies"],
      composition: createComposition(catalogue, { id: "scene", bodies: ids, defaultCenter: ids[0]!, ...(paths.length === 0 ? {} : { paths }) }),
      scaleChoices: scaleChoicesOf(this.#scale, this.#scaleOnly),
      ...(this.#switches === undefined ? {} : { displaySwitches: this.#switches }),
      ...(target === undefined ? {} : { startView: { focus: target, azimuthDeg: view.azimuthDeg ?? 0, elevationDeg: view.elevationDeg ?? 30, distance: view.distance ?? 40 } }),
      trackedBodies: tracked,
      createMetrics: ({ resolver }) => {
        const catalogued = bodyMetrics(resolver, ids, ["distance"]);
        const readouts = createReadoutMetrics([...this.#tracked.values()].map(({ body, readouts: specs }) => ({ body, readouts: specs })), resolver);
        return (objectId: string, timeUtcMs: number): readonly Metric[] => (this.#tracked.has(objectId) ? readouts(objectId, timeUtcMs) : catalogued(objectId, timeUtcMs));
      },
      prepare: async () => {
        if (needsPlanetSeries(definition)) await loadPlanetSeries();
        await installData(data, ids, window);
      },
    };
    return definition;
  }
}

/** The camera menu is automatic: Overview, and Focus and Follow for every body and path. */
function cameraPresetsOf(objects: readonly { readonly id: string; readonly label: string }[]): ExperienceDefinition["experience"]["cameraPresets"] {
  return [
    { id: "overview", label: "Overview", request: { kind: "overview" } },
    ...objects.flatMap(({ id, label }) => [
      { id: `focus-${id}`, label: `Focus ${label}`, request: { kind: "focus" as const, target: id } },
      { id: `follow-${id}`, label: `Follow ${label}`, request: { kind: "follow" as const, target: id } },
    ]),
  ];
}

/** The timeline span and the moment the clock opens at; a moment outside a span the caller set is a `bad-timeline`. */
function spanOf(timeline: TimelineSetting | undefined, timeUtcMs: number | undefined, tracked: readonly TrackedBody[]): { readonly window: TimeBounds; readonly startUtcMs: number } {
  const setTime = (timeline?.none === true ? timeline.atUtcMs : undefined) ?? timeUtcMs;
  const window = timeline?.window ?? windowOf(tracked, setTime);
  if (timeline?.window !== undefined && setTime !== undefined && (setTime < window.startUtcMs || setTime > window.endUtcMs)) {
    throw new SceneError("bad-timeline", `setTime ${new Date(setTime).toISOString()} is outside the timeline (${new Date(window.startUtcMs).toISOString()} to ${new Date(window.endUtcMs).toISOString()})`);
  }
  return { window, startUtcMs: setTime ?? window.startUtcMs };
}

/** The clock's opening: 60 times real time unless set; with no timeline and no rate, frozen. */
function clockOf(timeline: TimelineSetting | undefined, startUtcMs: number): ExperienceDefinition["clock"] {
  return { startUtcMs, rate: timeline?.rate ?? 60, ...(timeline?.none === true && timeline.rate === undefined ? { playing: false } : {}) };
}

/** The scale choices offered: the opening one first, then the other unless the caller offered one alone. */
function scaleChoicesOf(scale: ScalePolicy, only: boolean): readonly ScalePolicy["id"][] {
  return only ? [scale.id] : [scale.id, ...SCALES.filter((other) => other.id !== scale.id).map((other) => other.id)];
}

type Common = Pick<TrackedBody, "id" | "label" | "color" | "anchorTimesUtcMs" | "provenance">;

function sampledBody(common: Common, input: Extract<TrajectoryInput, { samples: unknown }>, center: BodyId): TrackedBody {
  const samples: TrajectorySample[] = input.samples.map((sample, index) => ({ ...sample, timeUtcMs: toUtcMs(sample.time, `addTrajectory("${common.id}") sample ${index} time`) }));
  try {
    const trajectory = new SampledTrajectory({ body: common.id, center, samples });
    return { ...common, trajectory, pathTimesUtcMs: samples.map((sample) => sample.timeUtcMs) };
  } catch (error) {
    if (error instanceof SceneError) throw error;
    throw new SceneError("bad-trajectory", `addTrajectory("${common.id}"): ${error instanceof Error ? error.message : String(error)}`);
  }
}

function providerBody(common: Common, input: Extract<TrajectoryInput, { provider: unknown }>): TrackedBody {
  if (typeof input.provider?.stateAt !== "function") throw new SceneError("bad-trajectory", `addTrajectory("${common.id}"): provider needs a stateAt(time) function`);
  const bounds: TimeBounds = { startUtcMs: toUtcMs(input.bounds?.start, `addTrajectory("${common.id}") bounds.start`), endUtcMs: toUtcMs(input.bounds?.end, `addTrajectory("${common.id}") bounds.end`) };
  if (bounds.endUtcMs <= bounds.startUtcMs) throw new SceneError("bad-trajectory", `addTrajectory("${common.id}"): bounds must end after they start`);
  const trajectory: Trajectory & { readonly bounds: TimeBounds } = { body: common.id, bounds, stateAt: (timeUtcMs, center) => input.provider.stateAt(timeUtcMs, center) };
  const step = (bounds.endUtcMs - bounds.startUtcMs) / (PROVIDER_PATH_SAMPLES - 1);
  return { ...common, trajectory, pathTimesUtcMs: Array.from({ length: PROVIDER_PATH_SAMPLES }, (_, index) => bounds.startUtcMs + index * step) };
}

/** The timeline span: the trajectories' union, else a month about the chosen time (or about now). */
function windowOf(tracked: readonly TrackedBody[], timeUtcMs: number | undefined): TimeBounds {
  if (tracked.length > 0) {
    const start = Math.min(...tracked.map((body) => body.trajectory.bounds.startUtcMs));
    const end = Math.max(...tracked.map((body) => body.trajectory.bounds.endUtcMs));
    if (timeUtcMs === undefined || (timeUtcMs >= start && timeUtcMs <= end)) return { startUtcMs: start, endUtcMs: end };
  }
  const centre = timeUtcMs ?? Date.now();
  return { startUtcMs: centre - 15 * DAY_MS, endUtcMs: centre + 15 * DAY_MS };
}

/** Checks the colour and known limits given to `addBody`. */
function checkBodyLook(id: string, options: AddBodyOptions): void {
  if (options.color !== undefined && !(typeof options.color === "string" && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(options.color))) throw new SceneError("bad-body", `addBody("${id}"): color "${String(options.color)}" is not a hex colour such as "#9fd8ff"`);
  const limits = options.knownLimitations;
  if (limits !== undefined && !(Array.isArray(limits) && limits.every((line) => typeof line === "string" && line !== ""))) throw new SceneError("bad-body", `addBody("${id}"): knownLimitations must be a list of non-empty texts`);
}

const READOUT_KINDS = ["range", "speed", "distance", "altitude"];

/** The body a readout names, if any. */
function readoutBody(spec: ReadoutInput): BodyId | undefined {
  return spec.kind === "range" ? spec.marker : spec.kind === "distance" ? spec.to : spec.kind === "altitude" ? spec.above : undefined;
}

/** Checks each readout's kind and the catalogued body it names; whether the scene holds that body is checked when the definition is built. */
function readoutsOf(id: string, readouts: readonly ReadoutInput[] = []): readonly ReadoutInput[] {
  if (!Array.isArray(readouts)) throw new SceneError("bad-readout", `addTrajectory("${id}"): readouts must be a list`);
  for (const spec of readouts) {
    if (!READOUT_KINDS.includes(spec?.kind)) throw new SceneError("bad-readout", `addTrajectory("${id}"): readout kind "${String(spec?.kind)}" is not one of ${READOUT_KINDS.join(", ")}`);
    const named = readoutBody(spec);
    if (spec.kind !== "range" && spec.kind !== "speed" && named === undefined) throw new SceneError("bad-readout", `addTrajectory("${id}"): readout ${spec.kind} needs ${spec.kind === "distance" ? "`to`" : "`above`"}, the body to measure against`);
    if (named !== undefined && !catalogue.has(named)) throw new SceneError("bad-readout", `addTrajectory("${id}"): readout ${spec.kind} names "${named}", which is not a catalogued body`);
  }
  return readouts;
}

/** The body with its anchors: sorted by time, each labelled with its id. Every anchor needs a distinct id and a moment inside the path. */
function withAnchors(body: TrackedBody, anchors: readonly AnchorInput[] = []): TrackedBody {
  if (!Array.isArray(anchors)) throw new SceneError("bad-anchor", `addTrajectory("${body.id}"): anchors must be a list`);
  const { startUtcMs, endUtcMs } = body.trajectory.bounds;
  const seen = new Set<string>();
  const placed = anchors.map((anchor) => {
    if (typeof anchor?.id !== "string" || anchor.id === "") throw new SceneError("bad-anchor", `addTrajectory("${body.id}"): every anchor needs a non-empty id`);
    if (seen.has(anchor.id)) throw new SceneError("bad-anchor", `addTrajectory("${body.id}"): anchor "${anchor.id}" appears twice`);
    seen.add(anchor.id);
    const timeUtcMs = anchorTime(body.id, anchor);
    if (timeUtcMs < startUtcMs || timeUtcMs > endUtcMs) throw new SceneError("bad-anchor", `addTrajectory("${body.id}"): anchor "${anchor.id}" is outside the path (${new Date(startUtcMs).toISOString()} to ${new Date(endUtcMs).toISOString()})`);
    return { id: anchor.id, timeUtcMs };
  }).sort((a, b) => a.timeUtcMs - b.timeUtcMs);
  return placed.length === 0 ? body : { ...body, anchorTimesUtcMs: placed.map((anchor) => anchor.timeUtcMs), anchorLabels: placed.map((anchor) => anchor.id) };
}

function anchorTime(path: string, anchor: AnchorInput): number {
  try { return toUtcMs(anchor.time); } catch { throw new SceneError("bad-anchor", `addTrajectory("${path}"): anchor "${anchor.id}" has a time "${String(anchor.time)}" that is not a valid moment`); }
}
