import type { BodyId } from "../core/body";
import type { TimelineEvent } from "../core/events";
import { createProvenance, type Provenance } from "../core/provenance";
import type { WindowProvenanceSpan } from "../core/timeWindow";
import type { ActivitySourceInput } from "./activity";
import { planPathProvenance } from "./pathProvenance";
import { SampledTrajectory, type TrajectorySample } from "../core/sampledTrajectory";
import { readableScale, solarSystemScale, trueScale, type ScalePolicy } from "../core/scalePolicy";
import { createState, type State } from "../core/state";
import { createOrbTwoBodyAdapter } from "../core/twoBodyAdapter";
import { createStateResolver } from "../core/stateResolver";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import type { TimeBounds, Trajectory } from "../core/trajectory";
import { isPlanetId, loadPlanetSeries, planetSeriesLoaded, planetSeriesSpan } from "../core/planetSeries";
import { catalogue as builtInCatalogue, extendCatalogue, rootBodyId, type BodyCatalogue } from "../assets/catalogue";
import { buildElementsBody, ElementsBodyError, parseElementsBodyRecord, type ElementsBodyRecord } from "../core/elementsBody";
import { createComposition, type CompositionPath } from "../assets/compositions";
import { bodyMetrics } from "../app/bodyMetrics";
import type { ExperienceDefinition, GroupLayer, PathLayer, VisualOverride } from "../app/experienceDefinition";
import { needsPlanetSeries } from "../app/planetNeeds";
import type { TrackedBody } from "../app/mission";
import type { StoryPanelSet } from "../shell/storyPanels";
import type { Metric } from "../shell/metrics";
import type { ExperienceConfig, ExperienceObject } from "../shell/experience";
import { catalogueItem } from "../app/catalogueItem";
import { createReadoutMetrics } from "../app/trackedMetrics";
import type { EccentricSampling } from "../core/sunCentredSources";
import { circlesTheSun, farthestSunDistanceKm, sunOrbitIdOf, sunOrbitLayer } from "./sunOrbit";
import { FALLBACK_SCENE_CENTRE, readyMade, type BodyRef } from "./bodies";
import { installData, type DataSource } from "./data";
import { planActivity, rateMetricOf, type ActivityInput, type PlannedActivity } from "./activity";
import { buildGroupLayer, planGroup, type GroupInput, type PlannedGroup } from "./group";
export type { GroupInput, GroupOrbitInput, GroupClumpInput, GroupReadoutInput } from "./group";
export type { ActivityInput, ActivitySampleInput, ActivitySourceInput } from "./activity";
export type { DataSource, MoonPositions } from "./data";
import { SceneError } from "./errors";
import { toUtcMs, type TimeInput } from "./time";
import { switchesOf, type SwitchesInput } from "./switches";
import type { DisplaySwitchSettings } from "../app/displaySwitches";
import { TimeScaleOutOfRangeError } from "../core/timeScale";
import { checkEventObjects, eventProvenanceOf, eventsOf, pacingFor, panelsOf, timelineOf, type AddEventsOptions, type EventInput, type StoryPanelsInput, type TimelineInput, type TimelineSetting } from "./story";
export { toUtcMs, type TimeInput } from "./time";
export type { ElementsBodyRecord } from "../core/elementsBody";

/** Options of `addBody`. */
export interface AddBodyOptions {
  /**
   * Draws the body's orbit as a line: the Moon's about Earth and Io's about Jupiter, or, in a scene that holds the Sun, one full turn round the Sun of any body that
   * circles it (the planets, Earth's year, a body added with `addBodyFromElements`), from the scene's opening time (an own body from its periapsis). Others throw `no-orbit`.
   */
  readonly orbit?: boolean;
  /** Draws the body this many times larger than life so a planet can be seen; a number of at least 1 (distances stay true). In a scene centred on the Sun the viewer offers its \"solar-system\" scale (true distances, the named bodies enlarged) as the second scale choice in place of the readable scale. A bad value throws `bad-body`. */
  readonly enlarge?: number;
  /** False starts the body's label off (the body stays in the menu and selectable; the viewer's labels switch can turn it on). Default true. */
  readonly showLabel?: boolean;
  /** How far from the camera the body's label shows, in the camera's `distance` units (as `camera.setReach`); a positive finite number. When absent the scene's shared rule applies: no limit in a Sun-centred or fitted scene, else the camera reach (at least 500). */
  readonly labelReach?: number;
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

/**
 * The orbit line of a catalogued moon, by one rule: one lap of the period its catalogue definition carries (`orbitPeriodDays`, read once from the record or mean
 * elements), drawn about its parent. Undefined where the definition gives no period. A moon closes its loop (Io's look) unless its definition says its line fades (the Moon's, as before).
 */
function moonOrbitPath(catalogue: BodyCatalogue, id: BodyId): Omit<CompositionPath, "body"> | undefined {
  if (!catalogue.has(id)) return undefined;
  const { orbitPeriodDays, orbitLineFades, parentId } = catalogue.get(id).definition;
  if (orbitPeriodDays === undefined || parentId === undefined) return undefined;
  return { spanMs: orbitPeriodDays * 86_400_000, ...(orbitLineFades === true ? {} : { look: { endFadeOn: false } }) };
}

/** One sample of a recorded path: position in km (and optionally velocity in km/s) about the trajectory's centre, in equatorial J2000 (EQJ) axes unless the path says `plane: "ecliptic-j2000"`. */
export interface TrajectorySampleInput {
  readonly time: TimeInput;
  readonly positionKm: ArrayLike<number>;
  readonly velocityKmS?: ArrayLike<number>;
}

interface TrajectoryBase {
  readonly id: string;
  readonly label?: string;
  readonly color?: string;
  /** The body the positions are measured from; defaults to the scene's centre (its first body, whichever you add first; "earth" if none is a catalogued body). */
  readonly center?: BodyId;
  /**
   * The body the path's line is drawn against: each sample is placed from this body at the sample's own time, then the line is carried to
   * this body's place from the scene centre at the clock time. Defaults to the scene centre; name the Sun for a probe crossing a Sun-centred scene.
   * Throws `bad-trajectory` at build if the scene does not hold the body.
   */
  readonly lineFixedTo?: BodyId;
  /**
   * The frame the positions and velocities are given in, about `center`: "EQJ" (equatorial J2000, the default) or "ecliptic-j2000" (the vectors JPL Horizons
   * publishes by default). Ecliptic input is rotated to EQJ once, as it is read, so drawing, `stateOf` and readouts all see EQJ. Any other value throws `bad-trajectory`.
   */
  readonly plane?: "EQJ" | "ecliptic-j2000";
  /** How far from the camera the path's label shows, in the camera's `distance` units (as `camera.setReach`); a positive finite number. When absent the scene's shared rule applies: no limit in a Sun-centred or fitted scene, else the camera reach (at least 500). */
  readonly labelReach?: number;
  readonly provenance?: Provenance;
  /**
   * Where each stretch of the path comes from, shown with the path as time moves (the same `{ start, end, provenance }` list as an activity's `provenance`).
   * Sorted, not overlapping, inside the path's span; a fault throws `bad-trajectory` naming the index. Where no span covers the time, `provenance` (or the illustrative default) shows.
   */
  readonly provenanceSpans?: readonly ActivitySourceInput[];
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
  /** Which direction is up as the viewer orbits: "equatorial" (celestial north, the default) or "ecliptic" (the ecliptic's north pole, so the planets' plane reads flat). Any other value throws `bad-camera`. */
  readonly up?: "equatorial" | "ecliptic";
}

const DEFAULT_COLOR = "#ffd27a";
const DAY_MS = 86_400_000;
const PROVIDER_PATH_SAMPLES = 128;
const SCALES: readonly ScalePolicy[] = [trueScale, readableScale, solarSystemScale];

/** Samples along a path when its farthest distance is read for the default zoom-out. */
const PATH_COVER_SAMPLES = 400;

interface Tracked {
  readonly body: TrackedBody;
  readonly center: BodyId;
  readonly description?: string;
  readonly knownLimitations?: readonly string[];
  readonly provenanceSpans?: readonly WindowProvenanceSpan[];
  readonly readouts: readonly ReadoutInput[];
}

/** The scene's camera: what it opens on. */
export class SceneCamera {
  #target: string | undefined;
  #following = false;
  #view: FollowView = {};
  #reach: number | undefined;
  #fit: string | undefined;
  readonly #has: (id: string) => boolean;
  readonly #circlesSun: (id: string) => boolean;
  constructor(has: (id: string) => boolean, circlesSun: (id: string) => boolean) {
    this.#has = has;
    this.#circlesSun = circlesSun;
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
    if (view.up !== undefined && view.up !== "equatorial" && view.up !== "ecliptic") throw new SceneError("bad-camera", `camera.${call}("${id}"): up "${String(view.up)}" must be "equatorial" or "ecliptic"`);
    this.#target = id;
    this.#following = following;
    this.#view = view;
    return this;
  }
  /**
   * Sets how far the viewer can zoom out from what they look at, in Earth radii (the scene's scaled unit); a finite number above 0, else `bad-camera`.
   * Also sets the camera's far plane (where drawing stops) to 2.5 times `distance`, so what lies out to the reach is still drawn.
   * Labels reach as far: a body's label stays shown at any distance the camera can take. Without this call the camera frames the scene as before.
   * `setReach` and `fitOrbit` set the same limit, so the later call wins and replaces the earlier one.
   */
  setReach(distance: number): this {
    if (!(typeof distance === "number" && Number.isFinite(distance) && distance > 0)) throw new SceneError("bad-camera", `camera.setReach: distance must be a finite number above 0, got ${String(distance)}`);
    this.#reach = distance;
    this.#fit = undefined;
    return this;
  }
  /**
   * Sets the farthest zoom-out so the whole orbit of a body circling the Sun (a planet, a built-in comet or one from `addBodyFromElements`, already added to the scene) fits the canvas
   * from any view direction: the orbit's farthest Sun distance divided by the sine of the narrower half field of view of the canvas (vertical 45 degrees, or horizontal from the
   * canvas's width over height), with 10 percent to spare. The viewer fits again whenever the canvas changes shape, such as a phone turning or a window resizing; the far plane follows
   * as for `setReach`. The opening view does not move. Any other body throws `bad-camera` naming it; an id not in the scene throws `unknown-body`. `setReach` and `fitOrbit` set the
   * same limit, so the later call wins and replaces the earlier one.
   * @example
   * scene.camera.fitOrbit("c-2025-a1");
   */
  fitOrbit(body: BodyRef | BodyId): this {
    const id = typeof body === "string" ? body : body.id;
    if (!this.#has(id)) throw new SceneError("unknown-body", `camera.fitOrbit("${id}"): no body or trajectory with that id has been added to the scene`);
    if (!this.#circlesSun(id)) throw new SceneError("bad-camera", `camera.fitOrbit("${id}"): "${id}" is not a body that circles the Sun (a planet, a comet or one added with addBodyFromElements)`);
    this.#fit = id;
    this.#reach = undefined;
    return this;
  }
  /** The body `fitOrbit` fits the zoom-out to, if any. */
  get fitted(): string | undefined { return this.#fit; }
  /** The farthest zoom-out set with `setReach`, if any. */
  get reach(): number | undefined { return this.#reach; }
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
  /** Paths added without a `center`: they follow the scene's first body, so one added before any body is rebuilt when the first body arrives. */
  readonly #defaulted = new Map<string, TrajectoryInput>();
  readonly #groups = new Map<string, PlannedGroup>();
  readonly #activities = new Map<string, PlannedActivity>();
  readonly #orbits = new Set<BodyId>();
  readonly #own = new Map<BodyId, EccentricSampling>();
  readonly #labelReaches = new Map<string, number>();
  readonly #shape = new Map<BodyId, Pick<AddBodyOptions, "enlarge" | "showLabel">>();
  #catalogue: BodyCatalogue = builtInCatalogue;
  readonly #notes = new Map<BodyId, string>();
  readonly #looks = new Map<BodyId, Pick<AddBodyOptions, "color" | "knownLimitations">>();
  readonly #sources = new Map<BodyId, Trajectory>();
  #timeUtcMs: number | undefined;
  #scale: ScalePolicy = trueScale;
  #scaleOnly = false;
  #events: readonly TimelineEvent[] = [];
  #eventProvenance: Provenance | undefined;
  #eventOwnProvenance = new Map<string, Provenance>();
  #panels: StoryPanelsInput | undefined;
  #timeline: TimelineSetting | undefined;
  #switches: DisplaySwitchSettings | undefined;

  constructor() {
    this.camera = new SceneCamera((id) => this.#taken(id), (id) => this.#bodies.has(id) && circlesTheSun(this.#catalogue, id));
  }

  /** Adds a catalogued body: a ready-made one (`earth`, `moon`, ...) or its id. The first body added is the scene's centre. `{ orbit: true }` also draws its orbit line. */
  addBody(body: BodyRef | BodyId, options: AddBodyOptions = {}): this {
    const id = typeof body === "string" ? body : body.id;
    this.#register("addBody", id, typeof body === "string" ? readyMade(id) ?? { id, label: this.#catalogue.has(id) ? this.#catalogue.get(id).definition.label : id } : body, options);
    return this;
  }

  /**
   * Adds your own body that circles the Sun, from its published orbit elements and where they came from: a record with the id, label, elements at an epoch, the source
   * (name, URL, solution, access date), a stated accuracy and optionally a radius and marker. Drawn as a marker on unperturbed two-body motion about the Sun; the provenance
   * and the stated limits show on its info card. The options are `addBody`'s (`{ orbit: true }` draws its whole orbit from periapsis). A bad record throws `bad-element`
   * naming the field; a repeated id throws `duplicate-id`.
   * @example
   * scene.addBody(sun).addBodyFromElements(record, { orbit: true, showLabel: false });
   */
  addBodyFromElements(record: ElementsBodyRecord, options: AddBodyOptions = {}): this {
    const parsed = parseRecord(record);
    if (this.#taken(parsed.id) || this.#catalogue.has(parsed.id)) throw new SceneError("duplicate-id", `addBodyFromElements("${parsed.id}"): that id is already in the scene or the catalogue`);
    const root = builtInCatalogue.get(rootBodyId()).definition;
    const before = this.#catalogue;
    this.#catalogue = extendCatalogue(before, [parsed]);
    try {
      this.#register("addBodyFromElements", parsed.id, { id: parsed.id, label: parsed.label }, options);
    } catch (error) {
      this.#catalogue = before;
      throw error;
    }
    this.#own.set(parsed.id, buildElementsBody(parsed, { id: root.id, gmKm3S2: root.gmKm3S2! }).sampling);
    return this;
  }

  #register(call: string, id: BodyId, ref: BodyRef, options: AddBodyOptions): void {
    if (options.orbit === true && moonOrbitPath(this.#catalogue, id) === undefined && !(circlesTheSun(this.#catalogue, id))) throw new SceneError("no-orbit", `${call}("${id}", { orbit: true }): the engine draws the orbit line of any catalogued moon whose data give a period about its planet and of any body that circles the Sun (every planet: its own source over a full turn where the source covers one, else the two-body ellipse osculating at the opening time)`);
    if (!this.#catalogue.has(id)) throw new SceneError("unknown-body", `${call}("${id}"): not a catalogued body (known: ${this.#catalogue.ids().join(", ")})`);
    if (this.#taken(id)) throw new SceneError("duplicate-id", `${call}("${id}"): already in the scene`);
    checkBodyLook(id, options);
    if (options.labelReach !== undefined) this.#labelReaches.set(id, options.labelReach);
    if (options.orbit === true) this.#orbits.add(id);
    if (options.color !== undefined || options.knownLimitations !== undefined) this.#looks.set(id, { ...(options.color === undefined ? {} : { color: options.color }), ...(options.knownLimitations === undefined ? {} : { knownLimitations: options.knownLimitations }) });
    if (options.enlarge !== undefined || options.showLabel !== undefined) this.#shape.set(id, { ...(options.enlarge === undefined ? {} : { enlarge: options.enlarge }), ...(options.showLabel === undefined ? {} : { showLabel: options.showLabel }) });
    if (options.description !== undefined) this.#notes.set(id, options.description);
    this.#bodies.set(id, ref);
    if (this.#bodies.size === 1 && builtInCatalogue.has(id)) for (const input of this.#defaulted.values()) this.#buildTracked(input, id);
  }

  /** Adds a path to follow and draw, from sampled states or a provider with `stateAt(time)`. */
  addTrajectory(input: TrajectoryInput): this {
    const id = input.id;
    if (typeof id !== "string" || id === "") throw new SceneError("bad-trajectory", "addTrajectory: the trajectory needs a non-empty id");
    if (this.#taken(id)) throw new SceneError("duplicate-id", `addTrajectory("${id}"): that id is already in the scene`);
    this.#buildTracked(input, input.center ?? this.#sceneCentre());
    if (input.center === undefined) this.#defaulted.set(id, input);
    return this;
  }

  /** The scene's centre: its first body when that is a built-in one, else Earth (the default of a path added before any body; `#register` re-reads it when the first body arrives). */
  #sceneCentre(): BodyId {
    const first = this.#bodies.keys().next();
    return first.done === true || !builtInCatalogue.has(first.value) ? FALLBACK_SCENE_CENTRE : first.value;
  }

  /** Validates and stores one path about `center`. */
  #buildTracked(input: TrajectoryInput, center: BodyId): void {
    const id = input.id;
    if (!builtInCatalogue.has(center)) throw new SceneError("unknown-body", `addTrajectory("${id}"): centre "${center}" is not a catalogued body`);
    const provenance = input.provenance ?? createProvenance({ sourceType: "illustrative", sources: ["Supplied by the caller"], accuracy: "As supplied; the engine makes no claim.", notes: "Positions were passed to addTrajectory." });
    const common = { id, label: input.label ?? id, color: input.color ?? DEFAULT_COLOR, anchorTimesUtcMs: [], provenance, ...(input.lineFixedTo === undefined ? {} : { lineFixedTo: input.lineFixedTo }) };
    const readouts = readoutsOf(id, input.readouts);
    if (input.labelReach !== undefined) {
      checkLabelReach(input.labelReach, new SceneError("bad-trajectory", `addTrajectory("${id}"): labelReach ${String(input.labelReach)} must be a positive finite number`));
      this.#labelReaches.set(id, input.labelReach);
    }
    if (input.plane !== undefined && input.plane !== "EQJ" && input.plane !== "ecliptic-j2000") throw new SceneError("bad-trajectory", `addTrajectory("${id}"): plane "${String(input.plane)}" must be "EQJ" or "ecliptic-j2000"`);
    const toEqj = input.plane === "ecliptic-j2000" ? createOrbTwoBodyAdapter().eclipticJ2000ToEqjMatrix() : null;
    const body = "samples" in input ? sampledBody(common, input, center, toEqj) : providerBody(common, input, toEqj);
    const provenanceSpans = input.provenanceSpans === undefined ? undefined : planPathProvenance(id, input.provenanceSpans, { startUtcMs: body.trajectory.bounds.startUtcMs, endUtcMs: body.trajectory.bounds.endUtcMs });
    this.#tracked.set(id, { center, body: withAnchors(body, input.anchors), readouts, ...(provenanceSpans === undefined ? {} : { provenanceSpans }), ...(input.description === undefined ? {} : { description: input.description }), ...(input.knownLimitations === undefined ? {} : { knownLimitations: input.knownLimitations }) });
  }

  /** Whether a body, path or group already has this id. */
  #taken(id: string): boolean {
    return this.#bodies.has(id) || this.#tracked.has(id) || this.#groups.has(id);
  }

  /**
   * Adds a group of listed orbits drawn as one set of dots (one colour and dot size, one menu item and info card), with an optional clump near a body.
   * The orbits circle the scene's centre unless `center` names another body. A repeated id throws `duplicate-id`; an empty list, a bad orbit, colour or clump throws `bad-group`. A `center` that is not a catalogued body throws `unknown-body`; a catalogued one the finished scene does not hold throws `bad-group` from `toDefinition`.
   * @example
   * scene.addGroup({ id: "ring", orbits: [{ id: "a", semiMajorAxisKm: 90_000, eccentricity: 0.1, inclinationDeg: 5, raanDeg: 40, argumentOfPeriapsisDeg: 70 }], color: "#9de3a8" });
   */
  addGroup(input: GroupInput): this {
    const plan = planGroup(input, this.#catalogue);
    if (this.#taken(plan.id)) throw new SceneError("duplicate-id", `addGroup("${plan.id}"): that id is already in the scene`);
    this.#groups.set(plan.id, plan);
    return this;
  }

  /**
   * Adds a period of activity to the timeline: a rate curve the timeline glows by, its peak mark, and where each stretch comes from. A group's `{ kind: "rate" }` readout shows its live rate
   * (unavailable outside the period) against the peak. Without `setTimeline`, the timeline spans the activities. A repeated id, or a bad curve, peak, source or moment, throws `bad-activity`.
   * @example
   * scene.addActivity({ id: "burst", label: "Burst", unit: "per hour", start: "2026-08-01", end: "2026-08-20", peak: "2026-08-12", samples: [{ time: "2026-08-01", value: 2 }, { time: "2026-08-12", value: 100 }, { time: "2026-08-20", value: 5 }] });
   */
  addActivity(input: ActivityInput): this {
    const plan = planActivity(input);
    if (this.#activities.has(plan.window.id)) throw new SceneError("bad-activity", `addActivity("${plan.window.id}"): an activity with that id is already in the scene`);
    this.#activities.set(plan.window.id, plan);
    return this;
  }

  /** Sets the moment the scene opens at. */
  setTime(time: TimeInput): this {
    this.#timeUtcMs = toUtcMs(time, "setTime");
    return this;
  }

  /** Chooses the opening scale: `trueScale`, `readableScale` or `solarSystemScale` (true distances, the enlarged bodies drawn larger; it needs a Sun-centred scene with an enlarged body, else the scene throws `bad-scale`); the viewer can switch to the other (in a Sun-centred scene with an enlarged body, the second choice is the Solar system scale instead of the readable one), unless `{ only: true }` offers this scale alone. */
  setScale(scale: ScalePolicy, options: { readonly only?: boolean } = {}): this {
    if (!SCALES.some((known) => known.id === scale?.id)) throw new SceneError("bad-scale", `setScale: "${String(scale?.id)}" is not a scale; use trueScale, readableScale or solarSystemScale`);
    this.#scale = scale;
    this.#scaleOnly = options.only === true;
    return this;
  }

  /** Adds timed events to the timeline, each with an id, a label and a moment; `provenance` says where the times come from and is shown with every event that has none of its own (`EventInput.provenance`). May be called more than once. Malformed provenance throws "bad-event". */
  addEvents(events: readonly EventInput[], options: AddEventsOptions = {}): this {
    const merged = eventsOf(events, this.#events);
    const own = events.flatMap((event): [string, Provenance][] => event.provenance === undefined ? [] : [[event.id, eventProvenanceOf(event.provenance, event.id)]]);
    const batch = options.provenance === undefined ? undefined : eventProvenanceOf(options.provenance);
    this.#events = merged;
    for (const [id, provenance] of own) this.#eventOwnProvenance.set(id, provenance);
    if (batch !== undefined) this.#eventProvenance = batch;
    return this;
  }

  /**
   * Adds story panels that open as playback reaches them. A panel opens only when forward playback crosses its time, so one at the opening instant never opens by itself
   * (a panel with an `object` still has its marker on that object). `at.utc` may be any instant inside the timeline, in any year. Their times may name events (`addEvents`) and path anchors, and `object` a body or path; these are checked when the scene is built (`mount`), and a mistake throws `bad-panels` naming the panel and field.
   */
  addStoryPanels(panels: StoryPanelsInput): this {
    this.#panels = panels;
    return this;
  }

  /** Sets the timeline: its span (`start`, `end`), the speeds offered (`rates`), the speed it opens at (`rate`), `pacing` (playback that slows for encounters and speeds up for cruise: spans `{ from, to, rate }` and event rules `{ near: { type, within }, rate }`, easing between speeds; a speed the visitor or host picks wins until `setRate("auto")`; see `PacingInput`) and whether playback wraps from the end to the start (`loop`; ignored with `{ none: true }`, which has no span to wrap, and when `setTimeline` is not called), or `{ none: true }` for no timeline bar, with time frozen at `at` or running at `rate`. Without this call the span follows the paths and the speeds are 1 minute, 1 hour and 1 day per second. */
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

  /**
   * The state of a body in the scene at a moment (position in km always; velocity in km/s only where the body's source provides it), the same State the viewer draws: for a path added with `addTrajectory`, about its centre body;
   * for a ready-made body or one from `addBodyFromElements`, about its parent (a planet about the Sun, a moon about its planet). Figures a story quotes, such as a distance from the Sun, come from here. `velocityKmS` is set only for a path whose
   * samples or provider carry velocities and for a moon from fitted data (Io); planets, Earth, the Sun, the built-in comet and elements bodies give position only, so check it before use. An id the scene does not hold throws `unknown-body`. Ready-made and elements bodies answer at any date (they have no data cut-off); only a moment outside an
   * `addTrajectory` path throws `bad-time`. A planet before the planet series have loaded (they load at mount) throws `missing-data`.
   * @example
   * const sunDistanceKm = Math.hypot(...scene.stateOf("earth", "2026-08-12T00:00:00Z").positionKm);
   */
  stateOf(id: string, time: TimeInput): State {
    const entry = this.#tracked.get(id);
    if (entry === undefined && !this.#bodies.has(id)) throw new SceneError("unknown-body", `stateOf("${id}"): no body or trajectory with that id has been added to the scene`);
    const timeUtcMs = toUtcMs(time, `stateOf("${id}") time`);
    const trajectory = entry?.body.trajectory ?? this.#catalogueSource(id);
    const bounds = trajectory?.bounds;
    if (bounds !== undefined && (timeUtcMs < bounds.startUtcMs || timeUtcMs > bounds.endUtcMs)) throw new SceneError("bad-time", `stateOf("${id}"): ${new Date(timeUtcMs).toISOString()} is outside the ${entry === undefined ? "body's data" : "path"} (${new Date(bounds.startUtcMs).toISOString()} to ${new Date(bounds.endUtcMs).toISOString()})`);
    if (trajectory === undefined) return this.#sunState(id, timeUtcMs);
    try {
      return trajectory.stateAt(timeUtcMs, entry?.center ?? this.#catalogue.get(id).definition.parentId);
    } catch (error) {
      if (entry === undefined && error instanceof Error && error.message.startsWith("the planet series are not loaded")) throw new SceneError("missing-data", `stateOf("${id}"): ${error.message}`);
      throw error;
    }
  }

  /** The Provenance of a body's position, as its info card shows it: for a ready-made or elements body the catalogue's position record, for a path the one passed to `addTrajectory`. Carries `accuracyClass` and `maxErrorFraction` where a comparison with an independent ephemeris exists. An id the scene does not hold throws `unknown-body`. */
  provenanceOf(id: string): Provenance {
    const entry = this.#tracked.get(id);
    if (entry !== undefined) return entry.body.provenance!; // addTrajectory always sets one
    if (!this.#bodies.has(id)) throw new SceneError("unknown-body", `provenanceOf("${id}"): no body or trajectory with that id has been added to the scene`);
    return this.#catalogue.get(id).definition.accuracy.position;
  }

  /** A catalogued body's state source, the one the viewer draws from, made once per scene; none for the root (the Sun). */
  #catalogueSource(id: BodyId): Trajectory | undefined {
    const binding = this.#catalogue.sources().find((source) => source.body === id);
    if (binding === undefined) return undefined;
    const made = this.#sources.get(id) ?? binding.create(createOrbAstronomyAdapter());
    this.#sources.set(id, made);
    return made;
  }

  /** The root body is at the origin of itself and at rest. */
  #sunState(id: BodyId, timeUtcMs: number): State {
    return createStateResolver(this.#catalogue.definitions(), this.#catalogue.sources(), createOrbAstronomyAdapter()).stateOf(id, timeUtcMs, id);
  }

  /** The story panels, resolved against this scene's events, anchors, objects and timeline span. */
  #storyPanels(window: TimeBounds): StoryPanelSet | undefined {
    if (this.#panels === undefined) return undefined;
    const anchors = new Map<string, number>();
    for (const { body } of this.#tracked.values()) body.anchorLabels?.forEach((label, index) => { if (!anchors.has(label)) anchors.set(label, body.anchorTimesUtcMs[index]!); });
    return panelsOf(this.#panels, { events: this.#events, anchors, objectIds: [...this.#bodies.keys(), ...this.#tracked.keys(), ...this.#groups.keys()], window });
  }

  /** Checks the groups against the finished scene: each circles its centre (default the scene's first body), which and whose clump body the scene must hold. */
  #checkGroups(ids: readonly BodyId[]): void {
    for (const plan of this.#groups.values()) {
      const center = plan.input.center ?? ids[0]!;
      const clump = plan.input.clump;
      if (!ids.includes(center)) throw new SceneError("bad-group", `addGroup("${plan.id}"): the orbits circle "${center}", which has not been added to the scene`);
      if (clump !== undefined && !ids.includes(clump.near)) throw new SceneError("bad-group", `addGroup("${plan.id}"): clump.near "${clump.near}" has not been added to the scene`);
      if (clump !== undefined && clump.near === center) throw new SceneError("bad-group", `addGroup("${plan.id}"): the clump cannot be near the body the orbits circle ("${center}")`);
    }
  }

  /** The draw layers of the groups chosen by `which` (a clump near a planet reads its position, so needs the planet series). */
  #groupLayers(ids: readonly BodyId[], window: TimeBounds, openUtcMs: number, which: (plan: PlannedGroup) => boolean): readonly GroupLayer[] {
    return [...this.#groups.values()].filter(which).map((plan) => buildGroupLayer(plan, this.#catalogue, plan.input.center ?? ids[0]!, openUtcMs, window));
  }

  /** The Sun-orbit lines that can be drawn now: all of them when the planet series are loaded, else none (they are drawn in `prepare`). */
  #earlySunPaths(orbitIds: readonly BodyId[], openUtcMs: number): PathLayer[] {
    return planetSeriesLoaded() ? orbitIds.map((id) => this.#sunPath(id, openUtcMs)) : [];
  }

  #checkSolarSystemScale(sunCentred: boolean): void {
    if (this.#scale.id === solarSystemScale.id && !this.#enlargedInSun(sunCentred)) throw new SceneError("bad-scale", "setScale: the Solar system scale needs a Sun-centred scene with an enlarged body (addBody(x, { enlarge }))");
  }

  /** Whether a Sun-centred scene enlarges a body, which the viewer's solar-system scale draws. */
  #enlargedInSun(sunCentred: boolean): boolean {
    return sunCentred && [...this.#shape.values()].some((shape) => shape.enlarge !== undefined);
  }

  /** The activity windows, when any were added. */
  #windowsEntry(): Pick<ExperienceDefinition["experience"], "windows"> {
    return this.#activities.size === 0 ? {} : { windows: [...this.#activities.values()].map((activity) => activity.window) };
  }

  /** The bars of a group's info card at a moment. */
  #groupMetrics(id: string, timeUtcMs: number): readonly Metric[] {
    return (this.#groups.get(id)?.input.readouts ?? []).map((spec) => rateMetricOf(id, this.#activities.get(spec.activity ?? this.#firstActivity())!, timeUtcMs));
  }

  #firstActivity(): string {
    return this.#activities.keys().next().value as string;
  }

  /** A group's rate readout names an activity the scene holds. */
  #checkGroupReadouts(): void {
    for (const { id, input } of this.#groups.values()) {
      for (const spec of input.readouts ?? []) {
        const named = spec.activity ?? (this.#activities.size > 0 ? this.#firstActivity() : undefined);
        if (named === undefined || !this.#activities.has(named)) throw new SceneError("bad-readout", `addGroup("${id}"): readout rate ${named === undefined ? "needs an activity (addActivity)" : `names activity "${named}", which has not been added to the scene`}`);
      }
    }
  }

  /** The `out-of-span` error naming the planets when the scene's window reaches outside the years the planet series cover (the series are loaded); undefined otherwise. */
  #planetSpanError(ids: readonly BodyId[], window: TimeBounds): SceneError | undefined {
    const planets = ids.filter(isPlanetId);
    if (planets.length === 0 || !planetSeriesLoaded()) return undefined;
    const span = planetSeriesSpan();
    if (window.startUtcMs >= span.startUtcMs && window.endUtcMs <= span.endUtcMs) return undefined;
    const iso = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
    return new SceneError("out-of-span", `${planets.join(", ")} is outside the years the built-in planet series covers: it covers ${iso(span.startUtcMs)} to ${iso(span.endUtcMs)}, but the scene runs ${iso(window.startUtcMs)} to ${iso(window.endUtcMs)}; set the timeline inside that span`);
  }

  /** Throws `out-of-span` naming the planets when the scene's window reaches outside the years the planet series cover (the series are loaded). */
  #checkPlanetSpan(ids: readonly BodyId[], window: TimeBounds): void {
    const error = this.#planetSpanError(ids, window);
    if (error !== undefined) throw error;
  }

  /**
   * The one choke point for planet-series reads during setup (orbit lines, the fit distance, clump groups): checks the span first, and turns a
   * `TimeScaleOutOfRangeError` from the read into the named `out-of-span` error when the window is outside the series, so no setup read can leak the raw one.
   */
  #planetRead<T>(ids: readonly BodyId[], window: TimeBounds, read: () => T): T {
    this.#checkPlanetSpan(ids, window);
    try {
      return read();
    } catch (error) {
      if (error instanceof TimeScaleOutOfRangeError) throw this.#planetSpanError(ids, window) ?? error;
      throw error;
    }
  }

  /**
   * A setup read in `toDefinition`: an `out-of-span` failure is recorded in `fault` and the read gives `fallback`, so `toDefinition` (and so `mount`) never throws it;
   * `prepare` rejects with the recorded error, which is how it always arrives (once, as `ready` rejecting).
   */
  #deferredRead<T>(ids: readonly BodyId[], window: TimeBounds, fault: { error?: SceneError }, fallback: T, read: () => T): T {
    try {
      return this.#planetRead(ids, window, read);
    } catch (error) {
      if (error instanceof SceneError && error.code === "out-of-span") {
        fault.error ??= error;
        return fallback;
      }
      throw error;
    }
  }

  /** Throws `missing-data` naming the bodies whose data package was not passed. */
  #checkData(data: readonly DataSource[]): void {
    const missing = this.missingData(data);
    if (missing.length === 0) return;
    const names = [...this.#bodies.values()].filter((body) => body.requires !== undefined && missing.includes(body.requires)).map((body) => body.id);
    throw new SceneError("missing-data", `${names.join(", ")} needs the ${missing.join(", ")} package: install it and pass it as mount(element, scene, { data: [...] })`);
  }

  /** The engine's own orbit loops (the Moon's and Io's) the scene asked for. */
  #moonPaths(): readonly CompositionPath[] {
    return [...this.#orbits].filter((id) => moonOrbitPath(this.#catalogue, id) !== undefined).map((id): CompositionPath => {
      const orbit = moonOrbitPath(this.#catalogue, id)!;
      const parent = this.#catalogue.get(id).definition.parentId;
      if (parent === undefined || !this.#bodies.has(parent)) throw new SceneError("no-orbit", `addBody("${id}", { orbit: true }): the orbit is drawn about ${parent}, which has not been added to the scene`);
      return { body: id, ...orbit };
    });
  }

  /** Whether the scene is centred on the Sun. */
  #checkSunCentred(ids: readonly BodyId[]): boolean {
    return ids[0] === rootBodyId(this.#catalogue);
  }

  /** How far a label shows, for bodies and paths alike: the item's own `labelReach` if given, else the shared rule: a Sun-centred scene, or one that fits the zoom-out to an orbit (`fitOrbit`, whose limit changes with the canvas), sets no limit; otherwise the camera reach, at least 500. */
  #labelReach(id: string, sunCentred: boolean): { readonly labelMaxDistance?: number } {
    const own = this.#labelReaches.get(id);
    if (own !== undefined) return { labelMaxDistance: own };
    return sunCentred || this.camera.fitted !== undefined ? {} : { labelMaxDistance: Math.max(500, this.camera.reach ?? 0) };
  }

  /** The shell item of a body: from the catalogue, with the scene's own words, look and label setting. Label reach is `#labelReach`. */
  #bodyObject(body: BodyRef, ids: readonly BodyId[], sunCentred: boolean): ExperienceObject {
    const own = { labelPriority: 100 - ids.indexOf(body.id), ...this.#labelReach(body.id, sunCentred), ...(this.#shape.get(body.id)?.showLabel === undefined ? {} : { showLabel: this.#shape.get(body.id)!.showLabel }), ...(this.#notes.has(body.id) ? { description: this.#notes.get(body.id) } : {}), ...this.#looks.get(body.id) };
    return { ...catalogueItem(body.id, own, this.#catalogue), label: body.label };
  }

  /** The event provenance entries of the experience: the batch's, and each event's own. */
  #eventProvenanceEntries(): Pick<ExperienceConfig, "eventProvenance" | "eventProvenanceById"> {
    return {
      ...(this.#eventProvenance === undefined ? {} : { eventProvenance: this.#eventProvenance }),
      ...(this.#eventOwnProvenance.size === 0 ? {} : { eventProvenanceById: Object.fromEntries(this.#eventOwnProvenance) }),
    };
  }

  /** The bodies that asked for a Sun-orbit line, checked: the Sun must be in the scene and the line's id free. */
  #sunOrbitIds(ids: readonly BodyId[]): readonly BodyId[] {
    return [...this.#orbits].filter((id) => moonOrbitPath(this.#catalogue, id) === undefined).map((id) => {
      if (!ids.includes(rootBodyId(this.#catalogue))) throw new SceneError("no-orbit", `addBody("${id}", { orbit: true }): the orbit is drawn about the Sun, which has not been added to the scene`);
      if (this.#taken(sunOrbitIdOf(id))) throw new SceneError("duplicate-id", `addBody("${id}", { orbit: true }): the orbit line's id "${sunOrbitIdOf(id)}" is already in the scene`);
      return id;
    });
  }

  /**
   * The distance the default zoom-out must cover for the scene's paths about the scene centre (I-114): a path reaching past the planets must fit whole whichever point of it the camera looks at,
   * so twice its farthest distance from the centre (no two points of a path are farther apart than that). Sampled over each path's span; undefined when no path is about the centre.
   */
  #pathCover(sunCentred: boolean, centre: BodyId): (() => number) | undefined {
    if (!sunCentred) return undefined;
    const about = [...this.#tracked.values()].filter((entry) => entry.center === centre);
    if (about.length === 0) return undefined;
    return () => 2 * Math.max(...about.map(({ body }) => {
      const { startUtcMs, endUtcMs } = body.trajectory.bounds;
      let farthest = 0;
      for (let k = 0; k < PATH_COVER_SAMPLES; k += 1) farthest = Math.max(farthest, Math.hypot(...body.trajectory.stateAt(Math.round(startUtcMs + ((endUtcMs - startUtcMs) * k) / (PATH_COVER_SAMPLES - 1)), centre).positionKm));
      return farthest;
    }));
  }

  /** The fitted body's farthest Sun distance, read once when the viewer first needs it (a planet's reads the planet series, loaded by then); undefined when no orbit is fitted. */
  #fitFarthestKm(openUtcMs: number): { readonly read: () => number; readonly settle: () => void } | undefined {
    const id = this.camera.fitted;
    if (id === undefined) return undefined;
    let km: number | undefined;
    const read = (): number => (km ??= farthestSunDistanceKm(this.#catalogue, id, openUtcMs, this.#own.get(id)));
    if (planetSeriesLoaded()) read();
    return { read, settle: () => void read() };
  }

  /** One Sun-orbit line: one full turn from the opening time (an own body from its periapsis). Reads planet positions, so the planet series must be loaded. */
  #sunPath(id: BodyId, openUtcMs: number): PathLayer {
    const layer = sunOrbitLayer(this.#catalogue, id, openUtcMs, this.#looks.get(id)?.color ?? "", this.#own.get(id));
    if (layer === undefined) throw new SceneError("no-orbit", `addBody("${id}", { orbit: true }): "${id}" completes no turn within thirty years and its position and the Sun's gravity do not give a bound ellipse; add it with addBodyFromElements to draw its whole orbit`);
    return layer;
  }

  /** A readout, or the body the line is fixed to, names a body the scene must hold. */
  #checkReadouts(entry: Tracked, ids: readonly BodyId[]): void {
    const fixed = entry.body.lineFixedTo;
    if (fixed !== undefined && !ids.includes(fixed)) throw new SceneError("bad-trajectory", `addTrajectory("${entry.body.id}"): lineFixedTo names "${fixed}", which has not been added to the scene`);
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
    this.#checkData(data);
    this.#checkGroupReadouts();
    const ids = [...this.#bodies.keys()];
    const paths = this.#moonPaths();
    const sunCentred = this.#checkSunCentred(ids);
    this.#checkSolarSystemScale(sunCentred);
    for (const entry of this.#tracked.values()) this.#checkReadouts(entry, ids);
    const tracked = [...this.#tracked.values()].map((entry) => entry.body);
    const timeline = this.#timeline;
    const { window, startUtcMs } = spanOf(timeline, this.#timeUtcMs, [...tracked.map((body) => body.trajectory.bounds), ...[...this.#activities.values()].map((activity) => activity.window)]);
    const sunOrbitIds = this.#sunOrbitIds(ids);
    // The farthest distance is worked out in setup, once: now when the planet series are in, else in `prepare` once they are; never in the frame loop.
    const fault: { error?: SceneError } = {};
    const fit = this.#deferredRead(ids, window, fault, undefined, () => this.#fitFarthestKm(startUtcMs));
    // The lines read planet positions; when the planet series are not loaded yet (a consumer's mount), they are drawn in `prepare`, once the series are in. The viewer draws only after `prepare` resolves.
    const sunPaths: PathLayer[] = this.#deferredRead<PathLayer[]>(ids, window, fault, [], () => this.#earlySunPaths(sunOrbitIds, startUtcMs));
    const target = this.camera.target;
    const view = this.camera.view;
    const storyPanels = this.#storyPanels(window);
    this.#checkGroups(ids);
    // A clump near a body reads its position; with the planet series not loaded yet, those groups are built in `prepare` (the viewer draws only after it resolves).
    const seriesIn = planetSeriesLoaded();
    const late = (plan: PlannedGroup): boolean => !seriesIn && plan.input.clump !== undefined;
    const layers: GroupLayer[] = this.#deferredRead<GroupLayer[]>(ids, window, fault, [], () => [...this.#groupLayers(ids, window, startUtcMs, (plan) => !late(plan))]);
    const labelled = [...this.#bodies.values(), ...tracked, ...[...this.#groups.values()]].map(({ id, label }) => ({ id, label }));
    const catalogue = this.#catalogue;
    checkEventObjects(this.#events, new Set(labelled.map(({ id }) => id)));
    const definition: ExperienceDefinition = {
      experience: {
        objects: [
          ...[...this.#bodies.values()].map((body) => this.#bodyObject(body, ids, sunCentred)),
          ...[...this.#tracked.values()].map(({ body, description, knownLimitations, provenanceSpans }): ExperienceObject => ({ id: body.id, label: body.label, color: body.color, availability: body.trajectory.bounds, labelPriority: 80, ...this.#labelReach(body.id, sunCentred), provenance: body.provenance, ...(provenanceSpans === undefined ? {} : { provenanceSpans }), ...(description === undefined ? {} : { description }), ...(knownLimitations === undefined ? {} : { knownLimitations }) })),
        ],
        cameraPresets: cameraPresetsOf(labelled),
        ...(target === undefined ? {} : { startCameraPresetId: `${this.camera.following ? "follow" : "focus"}-${target}` }),
        events: this.#events,
        ...this.#eventProvenanceEntries(),
        ...(storyPanels === undefined ? {} : { storyPanels }),
        ...(timeline?.none === true ? { hideTimeline: true } : {}),
        window,
        ...this.#windowsEntry(),
        rates: timeline?.rates ?? [60, 3_600, DAY_MS / 1000],
      },
      clock: clockOf(timeline, startUtcMs),
      ...pacingEntry(timeline, this.#events),
      ...groupLayersEntry(layers, this.#groups.size > 0, sunOrbitIds.length > 0),
      ...(sunOrbitIds.length === 0 ? {} : { paths: sunPaths }),
      ...(this.#own.size === 0 ? {} : { catalogue: this.#catalogue }),
      ...visualOverridesEntry(this.#shape),
      composition: createComposition(this.#catalogue, { id: "scene", bodies: ids, defaultCenter: ids[0]!, ...(paths.length === 0 ? {} : { paths }) }),
      scaleChoices: scaleChoicesOf(this.#scale, this.#scaleOnly, this.#enlargedInSun(sunCentred)),
      ...(this.#switches === undefined ? {} : { displaySwitches: this.#switches }),
      ...viewEntries(timeline, this.camera, fit?.read, this.#pathCover(sunCentred, ids[0]!)),
      ...(target === undefined ? {} : { startView: { focus: target, azimuthDeg: view.azimuthDeg ?? 0, elevationDeg: view.elevationDeg ?? 30, distance: view.distance ?? 40 } }),
      trackedBodies: tracked,
      createMetrics: ({ resolver }) => {
        const catalogued = bodyMetrics(resolver, ids, ["distance"], catalogue);
        const readouts = createReadoutMetrics([...this.#tracked.values()].map(({ body, readouts: specs }) => ({ body, readouts: specs })), resolver);
        return (objectId: string, timeUtcMs: number): readonly Metric[] => (this.#groups.has(objectId) ? this.#groupMetrics(objectId, timeUtcMs) : this.#tracked.has(objectId) ? readouts(objectId, timeUtcMs) : catalogued(objectId, timeUtcMs));
      },
      prepare: async () => {
        if (fault.error !== undefined) throw fault.error;
        if (needsPlanetSeries(definition) || sunPaths.length < sunOrbitIds.length || this.#groups.size > layers.length) await loadPlanetSeries();
        this.#checkPlanetSpan(ids, window);
        if (this.#groups.size > layers.length) layers.push(...this.#planetRead(ids, window, () => this.#groupLayers(ids, window, startUtcMs, late)));
        if (sunPaths.length < sunOrbitIds.length) sunPaths.push(...this.#planetRead(ids, window, () => sunOrbitIds.map((id) => this.#sunPath(id, startUtcMs))));
        if (fit !== undefined) this.#planetRead(ids, window, () => fit.settle());
        await installData(data, ids, window);
      },
    };
    return definition;
  }
}

/** The playback and camera settings the scene asked for: looping, the farthest zoom-out and the ecliptic up. */
function viewEntries(timeline: TimelineSetting | undefined, camera: SceneCamera, farthestKm: (() => number) | undefined, cover: (() => number) | undefined): Pick<ExperienceDefinition, "loop" | "camera" | "viewUp"> {
  const { reach, view, target } = camera;
  return {
    ...(timeline?.loop === true ? { loop: true } : {}),
    ...(reach === undefined ? {} : { camera: { maxFocusDistance: reach, far: reach * 2.5 } }),
    ...(farthestKm === undefined ? {} : { camera: { fitOrbit: { farthestKm } } }),
    ...(reach !== undefined || farthestKm !== undefined || cover === undefined ? {} : { camera: { cover: { farthestKm: cover } } }),
    ...(view.up === undefined || target === undefined ? {} : { viewUp: view.up }),
  };
}

/** The scene's layers: the points layer and the groups only when a group was added. */
function groupLayersEntry(layers: readonly GroupLayer[], hasGroups: boolean, sunCentred: boolean): Pick<ExperienceDefinition, "sceneLayers" | "groups"> {
  const sceneLayers: ExperienceDefinition["sceneLayers"] = ["tracked-bodies", ...(hasGroups ? ["points" as const] : []), ...(sunCentred ? ["sun-centred" as const] : [])];
  return hasGroups ? { sceneLayers, groups: layers } : { sceneLayers };
}

/** The enlargements the scene asked for, as the engine's per-body overrides. */
function visualOverridesEntry(shape: ReadonlyMap<BodyId, Pick<AddBodyOptions, "enlarge" | "showLabel">>): Pick<ExperienceDefinition, "visualOverrides"> {
  const overrides: Record<BodyId, VisualOverride> = {};
  for (const [id, { enlarge }] of shape) if (enlarge !== undefined) overrides[id] = { exaggeration: enlarge };
  return Object.keys(overrides).length === 0 ? {} : { visualOverrides: overrides };
}

/** Parses an elements record, naming the field a mistake is in. */
function parseRecord(record: ElementsBodyRecord): ElementsBodyRecord {
  try {
    return parseElementsBodyRecord(record, "addBodyFromElements");
  } catch (error) {
    if (error instanceof ElementsBodyError) throw new SceneError("bad-element", error.message);
    throw error;
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
function spanOf(timeline: TimelineSetting | undefined, timeUtcMs: number | undefined, tracked: readonly TimeBounds[]): { readonly window: TimeBounds; readonly startUtcMs: number } {
  const setTime = (timeline?.none === true ? timeline.atUtcMs : undefined) ?? timeUtcMs;
  // With nothing setting a span or a moment, the month window is centred on now and the clock opens at now (not at the window's start).
  const now = setTime === undefined && timeline?.window === undefined && tracked.length === 0 ? Date.now() : undefined;
  const window = timeline?.window ?? windowOf(tracked, setTime ?? now);
  if (timeline?.window !== undefined && setTime !== undefined && (setTime < window.startUtcMs || setTime > window.endUtcMs)) {
    throw new SceneError("bad-timeline", `setTime ${new Date(setTime).toISOString()} is outside the timeline (${new Date(window.startUtcMs).toISOString()} to ${new Date(window.endUtcMs).toISOString()})`);
  }
  return { window, startUtcMs: setTime ?? now ?? window.startUtcMs };
}

/** The pacing the timeline asked for, laid over the scene's events; a rule naming an event type with no events throws `bad-timeline`. */
function pacingEntry(timeline: TimelineSetting | undefined, events: readonly TimelineEvent[]): Pick<ExperienceDefinition, "pacing"> {
  const pacing = timeline === undefined ? undefined : pacingFor(timeline, events, timeline.rate ?? 60);
  return pacing === undefined ? {} : { pacing };
}

/** The clock's opening: 60 times real time unless set; with no timeline and no rate, frozen. */
function clockOf(timeline: TimelineSetting | undefined, startUtcMs: number): ExperienceDefinition["clock"] {
  return { startUtcMs, rate: timeline?.rate ?? 60, ...(timeline?.none === true && timeline.rate === undefined ? { playing: false } : {}) };
}

/**
 * The scale choices offered: the opening one first, then the other unless the caller offered one alone. A Sun-centred scene with an enlarged body (`addBody(x, { enlarge })`)
 * offers `solarSystemScale` (true distances, the named bodies enlarged) in place of the readable scale it would offer second, since the readable scale does not enlarge.
 */
function scaleChoicesOf(scale: ScalePolicy, only: boolean, enlarged: boolean): readonly string[] {
  const offered = [trueScale, enlarged ? solarSystemScale : readableScale];
  const second = scale.id === readableScale.id ? [trueScale] : offered.filter((other) => other.id !== scale.id);
  return only ? [scale.id] : [scale.id, ...second.map((other) => other.id)];
}

type Common = Pick<TrackedBody, "id" | "label" | "color" | "anchorTimesUtcMs" | "provenance" | "lineFixedTo">;

/** Rotates a vector by a row-major 3x3 matrix; a missing matrix leaves it as it is. Input that is not three numbers passes through for the State checks to refuse. */
function rotated(matrix: Float64Array | null, v: ArrayLike<number> | undefined): ArrayLike<number> | undefined {
  if (matrix === null || v === undefined || v.length !== 3) return v;
  return [0, 1, 2].map((row) => matrix[3 * row]! * v[0]! + matrix[3 * row + 1]! * v[1]! + matrix[3 * row + 2]! * v[2]!);
}

function sampledBody(common: Common, input: Extract<TrajectoryInput, { samples: unknown }>, center: BodyId, toEqj: Float64Array | null): TrackedBody {
  const samples: TrajectorySample[] = input.samples.map((sample, index) => {
    const velocityKmS = rotated(toEqj, sample.velocityKmS);
    return { positionKm: rotated(toEqj, sample.positionKm)!, ...(velocityKmS === undefined ? {} : { velocityKmS }), timeUtcMs: toUtcMs(sample.time, `addTrajectory("${common.id}") sample ${index} time`) };
  });
  try {
    const trajectory = new SampledTrajectory({ body: common.id, center, samples });
    return { ...common, trajectory, pathTimesUtcMs: samples.map((sample) => sample.timeUtcMs) };
  } catch (error) {
    if (error instanceof SceneError) throw error;
    throw new SceneError("bad-trajectory", `addTrajectory("${common.id}"): ${error instanceof Error ? error.message : String(error)}`);
  }
}

function providerBody(common: Common, input: Extract<TrajectoryInput, { provider: unknown }>, toEqj: Float64Array | null): TrackedBody {
  if (typeof input.provider?.stateAt !== "function") throw new SceneError("bad-trajectory", `addTrajectory("${common.id}"): provider needs a stateAt(time) function`);
  const bounds: TimeBounds = { startUtcMs: toUtcMs(input.bounds?.start, `addTrajectory("${common.id}") bounds.start`), endUtcMs: toUtcMs(input.bounds?.end, `addTrajectory("${common.id}") bounds.end`) };
  if (bounds.endUtcMs <= bounds.startUtcMs) throw new SceneError("bad-trajectory", `addTrajectory("${common.id}"): bounds must end after they start`);
  const trajectory: Trajectory & { readonly bounds: TimeBounds } = { body: common.id, bounds, stateAt: (timeUtcMs, center) => rotatedState(toEqj, input.provider.stateAt(timeUtcMs, center)) };
  const step = (bounds.endUtcMs - bounds.startUtcMs) / (PROVIDER_PATH_SAMPLES - 1);
  return { ...common, trajectory, pathTimesUtcMs: Array.from({ length: PROVIDER_PATH_SAMPLES }, (_, index) => bounds.startUtcMs + index * step) };
}

/** A provider's State with its position and velocity rotated into EQJ; unchanged for EQJ input. */
function rotatedState(matrix: Float64Array | null, state: State): State {
  if (matrix === null) return state;
  return createState({ body: state.body, center: state.center, timeUtcMs: state.timeUtcMs, positionKm: rotated(matrix, state.positionKm)!, ...(state.velocityKmS === undefined ? {} : { velocityKmS: rotated(matrix, state.velocityKmS)! }), orientation: state.orientation });
}

/** The timeline span: the union of the trajectories' and activities' spans, else a month about the chosen time (or about now). */
function windowOf(tracked: readonly TimeBounds[], timeUtcMs: number | undefined): TimeBounds {
  if (tracked.length > 0) {
    const start = Math.min(...tracked.map((bounds) => bounds.startUtcMs));
    const end = Math.max(...tracked.map((bounds) => bounds.endUtcMs));
    if (timeUtcMs === undefined || (timeUtcMs >= start && timeUtcMs <= end)) return { startUtcMs: start, endUtcMs: end };
  }
  const centre = timeUtcMs ?? Date.now();
  return { startUtcMs: centre - 15 * DAY_MS, endUtcMs: centre + 15 * DAY_MS };
}

/** Throws `error` unless `reach` is a positive finite number. */
function checkLabelReach(reach: unknown, error: SceneError): void {
  if (!(typeof reach === "number" && Number.isFinite(reach) && reach > 0)) throw error;
}

/** Checks the colour, known limits and label reach given to `addBody`. */
function checkBodyLook(id: string, options: AddBodyOptions): void {
  if (options.labelReach !== undefined) checkLabelReach(options.labelReach, new SceneError("bad-body", `addBody("${id}"): labelReach ${String(options.labelReach)} must be a positive finite number`));
  if (options.enlarge !== undefined && !(typeof options.enlarge === "number" && Number.isFinite(options.enlarge) && options.enlarge >= 1)) throw new SceneError("bad-body", `addBody("${id}"): enlarge ${String(options.enlarge)} must be a number of at least 1`);
  if (options.showLabel !== undefined && typeof options.showLabel !== "boolean") throw new SceneError("bad-body", `addBody("${id}"): showLabel must be true or false`);
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
    if (named !== undefined && !builtInCatalogue.has(named)) throw new SceneError("bad-readout", `addTrajectory("${id}"): readout ${spec.kind} names "${named}", which is not a catalogued body`);
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
