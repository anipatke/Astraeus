import type { BodyId } from "../core/body";
import type { TimelineEvent } from "../core/events";
import type { Provenance } from "../core/provenance";
import type { ActivitySourceInput } from "./activity";
import type { LineStretchInput } from "./pathProvenance";
import { readableScale, solarSystemScale, trueScale, type ScalePolicy } from "../core/scalePolicy";
import type { State } from "../core/state";
import { createStateResolver } from "../core/stateResolver";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import type { TimeBounds, Trajectory } from "../core/trajectory";
import { isPlanetId, loadPlanetSeries, planetSeriesLoaded, planetSeriesSpan } from "../core/planetSeries";
import { catalogue as builtInCatalogue } from "../assets/catalogue";
import type { ElementsBodyRecord } from "../core/elementsBody";
import { createComposition } from "../assets/compositions";
import { bodyMetrics } from "../app/bodyMetrics";
import type { ExperienceDefinition, GroupLayer, PathLayer } from "../app/experienceDefinition";
import { needsPlanetSeries } from "../app/planetNeeds";
import type { StoryPanelSet } from "../shell/storyPanels";
import type { Metric } from "../shell/metrics";
import type { ExperienceConfig, ExperienceObject } from "../shell/experience";
import { createReadoutMetrics } from "../app/trackedMetrics";
import { circlesTheSun, farthestSunDistanceKm } from "./sunOrbit";
import { FALLBACK_SCENE_CENTRE, type BodyRef } from "./bodies";
import { installData, type DataSource } from "./data";
import { planActivity, rateMetricOf, type ActivityInput, type PlannedActivity } from "./activity";
import { buildGroupLayer, planGroup, type GroupInput, type PlannedGroup } from "./group";
export type { GroupInput, GroupOrbitInput, GroupClumpInput, GroupReadoutInput } from "./group";
export type { ActivityInput, ActivitySampleInput, ActivitySourceInput } from "./activity";
export type { DataSource, MoonPositions } from "./data";
import { SceneError } from "./errors";
import { BodyPlan } from "./planBodies";
import { autoPaths, buildTracked, checkReadouts, pathCover, type Tracked } from "./planPaths";
import { toUtcMs, type TimeInput } from "./time";
import { switchesOf, type SwitchesInput } from "./switches";
import { resolveViews, viewsOf, type ViewInput, type ViewsOptions, type ViewsPlan } from "./views";
import type { DisplaySwitchSettings } from "../app/displaySwitches";
import type { ViewSettings } from "../app/views";
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
   * A list of `{ start, end, body }` (times as `provenanceSpans`) draws each stretch against its own body, so a flyby is one path: Sun-fixed cruise, planet-fixed encounter, Sun-fixed cruise.
   * Sorted, not overlapping, inside the path's span; time outside every stretch is drawn against the scene centre. A fault throws `bad-trajectory` naming the index.
   * `"auto"` builds that list from the path's own samples: each sample is fixed to the innermost body in the scene whose sphere of influence (`a (m / M)^(2/5)`, `a` the body's distance from its parent,
   * GMs from the catalogue) holds the probe (a root body such as the Sun holds everything), else the scene centre; consecutive samples on one body merge. Resolved once when the planet series are in
   * (at mount, or in `prepare`), never per frame. A body with no catalogue GM (most moons) is skipped. "auto" is reserved, so no body may carry that id.
   * Throws `bad-trajectory` at build if the scene does not hold the body.
   */
  readonly lineFixedTo?: BodyId | "auto" | readonly LineStretchInput[];
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

const DAY_MS = 86_400_000;
const SCALES: readonly ScalePolicy[] = [trueScale, readableScale, solarSystemScale];

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
  readonly #plan = new BodyPlan((id) => this.#taken(id), (id) => { for (const input of this.#defaulted.values()) this.#track(input, id); });
  readonly #tracked = new Map<string, Tracked>();
  /** Paths added without a `center`: they follow the scene's first body, so one added before any body is rebuilt when the first body arrives. */
  readonly #defaulted = new Map<string, TrajectoryInput>();
  readonly #groups = new Map<string, PlannedGroup>();
  readonly #activities = new Map<string, PlannedActivity>();
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
  #views: ViewsPlan | undefined;

  constructor() {
    this.camera = new SceneCamera((id) => this.#taken(id), (id) => this.#plan.bodies.has(id) && circlesTheSun(this.#plan.catalogue, id));
  }

  /** Adds a catalogued body: a ready-made one (`earth`, `moon`, ...) or its id. The first body added is the scene's centre. `{ orbit: true }` also draws its orbit line. */
  addBody(body: BodyRef | BodyId, options: AddBodyOptions = {}): this {
    this.#plan.addBody(body, options);
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
    this.#plan.addFromElements(record, options);
    return this;
  }

  /** Adds a path to follow and draw, from sampled states or a provider with `stateAt(time)`. */
  addTrajectory(input: TrajectoryInput): this {
    const id = input.id;
    if (typeof id !== "string" || id === "") throw new SceneError("bad-trajectory", "addTrajectory: the trajectory needs a non-empty id");
    if (this.#taken(id)) throw new SceneError("duplicate-id", `addTrajectory("${id}"): that id is already in the scene`);
    this.#track(input, input.center ?? this.#sceneCentre());
    if (input.center === undefined) this.#defaulted.set(id, input);
    return this;
  }

  /** The scene's centre: its first body when that is a built-in one, else Earth (the default of a path added before any body; the body plan re-reads it when the first body arrives). */
  #sceneCentre(): BodyId {
    const first = this.#plan.bodies.keys().next();
    return first.done === true || !builtInCatalogue.has(first.value) ? FALLBACK_SCENE_CENTRE : first.value;
  }

  /** Validates and stores one path about `center` (`planPaths.ts`). */
  #track(input: TrajectoryInput, center: BodyId): void {
    this.#tracked.set(input.id, buildTracked(input, center, this.#plan.labelReaches));
  }

  /** Whether a body, path or group already has this id. */
  #taken(id: string): boolean {
    return this.#plan.bodies.has(id) || this.#tracked.has(id) || this.#groups.has(id);
  }

  /**
   * Adds a group of listed orbits drawn as one set of dots (one colour and dot size, one menu item and info card), with an optional clump near a body.
   * The orbits circle the scene's centre unless `center` names another body. A repeated id throws `duplicate-id`; an empty list, a bad orbit, colour or clump throws `bad-group`. A `center` that is not a catalogued body throws `unknown-body`; a catalogued one the finished scene does not hold throws `bad-group` from `toDefinition`.
   * @example
   * scene.addGroup({ id: "ring", orbits: [{ id: "a", semiMajorAxisKm: 90_000, eccentricity: 0.1, inclinationDeg: 5, raanDeg: 40, argumentOfPeriapsisDeg: 70 }], color: "#9de3a8" });
   */
  addGroup(input: GroupInput): this {
    const plan = planGroup(input, this.#plan.catalogue);
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
   * Names views of this one scene, each listing what it shows: `paths` (ids of `addTrajectory`), `bodies` (ids of `addBody` or `addGroup`), `events` (ids of `addEvents`) and `panels` (ids of `addStoryPanels`).
   * Anything no view names shows in every view (shared bodies such as the planets); anything a view names shows only in the views that name it. `place` is `"top-bar"` or `"panel"` (as for `setSwitches`);
   * `start` is the opening view (default the first). `camera` says what happens when the followed or focused object is not in the view switched to: `"stay"` (default), `"start"` (the scene's start) or
   * `{ follow: id }` / `{ focus: id }` (that framing; the object must be in the view). Presentation only: State is unchanged and a hidden object keeps its state. May be called again; the later call replaces the views.
   * An empty list, a repeated view id, a bad place or camera, or a `start` that is not a view throws `bad-view` here; an id the scene does not hold, or a camera target the view does not show, throws `bad-view` when the scene is built (`mount`), so the call may come before or after the objects.
   * @example
   * scene.setViews([{ id: "a", label: "Probe A", paths: ["probe-a"] }, { id: "b", label: "Probe B", paths: ["probe-b"] }, { id: "both", label: "Both" }], { place: "top-bar" });
   */
  setViews(views: readonly ViewInput[], options: ViewsOptions): this {
    this.#views = viewsOf(views, options);
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
    if (entry === undefined && !this.#plan.bodies.has(id)) throw new SceneError("unknown-body", `stateOf("${id}"): no body or trajectory with that id has been added to the scene`);
    const timeUtcMs = toUtcMs(time, `stateOf("${id}") time`);
    const trajectory = entry?.body.trajectory ?? this.#catalogueSource(id);
    const bounds = trajectory?.bounds;
    if (bounds !== undefined && (timeUtcMs < bounds.startUtcMs || timeUtcMs > bounds.endUtcMs)) throw new SceneError("bad-time", `stateOf("${id}"): ${new Date(timeUtcMs).toISOString()} is outside the ${entry === undefined ? "body's data" : "path"} (${new Date(bounds.startUtcMs).toISOString()} to ${new Date(bounds.endUtcMs).toISOString()})`);
    if (trajectory === undefined) return this.#sunState(id, timeUtcMs);
    try {
      return trajectory.stateAt(timeUtcMs, entry?.center ?? this.#plan.catalogue.get(id).definition.parentId);
    } catch (error) {
      if (entry === undefined && error instanceof Error && error.message.startsWith("the planet series are not loaded")) throw new SceneError("missing-data", `stateOf("${id}"): ${error.message}`);
      throw error;
    }
  }

  /** The Provenance of a body's position, as its info card shows it: for a ready-made or elements body the catalogue's position record, for a path the one passed to `addTrajectory`. Carries `accuracyClass` and `maxErrorFraction` where a comparison with an independent ephemeris exists. An id the scene does not hold throws `unknown-body`. */
  provenanceOf(id: string): Provenance {
    const entry = this.#tracked.get(id);
    if (entry !== undefined) return entry.body.provenance!; // addTrajectory always sets one
    if (!this.#plan.bodies.has(id)) throw new SceneError("unknown-body", `provenanceOf("${id}"): no body or trajectory with that id has been added to the scene`);
    return this.#plan.catalogue.get(id).definition.accuracy.position;
  }

  /** A catalogued body's state source, the one the viewer draws from, made once per scene; none for the root (the Sun). */
  #catalogueSource(id: BodyId): Trajectory | undefined {
    const binding = this.#plan.catalogue.sources().find((source) => source.body === id);
    if (binding === undefined) return undefined;
    const made = this.#sources.get(id) ?? binding.create(createOrbAstronomyAdapter());
    this.#sources.set(id, made);
    return made;
  }

  /** The root body is at the origin of itself and at rest. */
  #sunState(id: BodyId, timeUtcMs: number): State {
    return createStateResolver(this.#plan.catalogue.definitions(), this.#plan.catalogue.sources(), createOrbAstronomyAdapter()).stateOf(id, timeUtcMs, id);
  }

  /** The story panels, resolved against this scene's events, anchors, objects and timeline span. */
  #storyPanels(window: TimeBounds): StoryPanelSet | undefined {
    if (this.#panels === undefined) return undefined;
    const anchors = new Map<string, number>();
    for (const { body } of this.#tracked.values()) body.anchorLabels?.forEach((label, index) => { if (!anchors.has(label)) anchors.set(label, body.anchorTimesUtcMs[index]!); });
    return panelsOf(this.#panels, { events: this.#events, anchors, objectIds: [...this.#plan.bodies.keys(), ...this.#tracked.keys(), ...this.#groups.keys()], window });
  }

  /** The `views` entry of the definition: the views resolved against the finished scene once (absent when none was named). */
  #viewsEntry(ids: readonly BodyId[], storyPanels: StoryPanelSet | undefined): { views?: ViewSettings } {
    if (this.#views === undefined) return {};
    return { views: resolveViews(this.#views, { paths: [...this.#tracked.keys()], bodies: [...ids, ...this.#groups.keys()], events: this.#events.map(({ id }) => id), panels: storyPanels?.panels.map(({ id }) => id) ?? [] }) };
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
    return [...this.#groups.values()].filter(which).map((plan) => buildGroupLayer(plan, this.#plan.catalogue, plan.input.center ?? ids[0]!, openUtcMs, window));
  }

  /** The data packages the added bodies need that `data` does not provide. */
  missingData(data: readonly DataSource[] = []): readonly string[] {
    return this.#plan.missingData(data);
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

  /** The event provenance entries of the experience: the batch's, and each event's own. */
  #eventProvenanceEntries(): Pick<ExperienceConfig, "eventProvenance" | "eventProvenanceById"> {
    return {
      ...(this.#eventProvenance === undefined ? {} : { eventProvenance: this.#eventProvenance }),
      ...(this.#eventOwnProvenance.size === 0 ? {} : { eventProvenanceById: Object.fromEntries(this.#eventOwnProvenance) }),
    };
  }

  /** The fitted body's farthest Sun distance, read once when the viewer first needs it (a planet's reads the planet series, loaded by then); undefined when no orbit is fitted. */
  #fitFarthestKm(openUtcMs: number): { readonly read: () => number; readonly settle: () => void } | undefined {
    const id = this.camera.fitted;
    if (id === undefined) return undefined;
    let km: number | undefined;
    const read = (): number => (km ??= farthestSunDistanceKm(this.#plan.catalogue, id, openUtcMs, this.#plan.own.get(id)));
    if (planetSeriesLoaded()) read();
    return { read, settle: () => void read() };
  }

  /** The app's plug-in contract for this scene. Throws if the scene is empty or a body needs a data package not passed in `data`. */
  toDefinition(data: readonly DataSource[] = []): ExperienceDefinition {
    if (this.#plan.bodies.size === 0) throw new SceneError("empty-scene", "the scene has no bodies; call addBody before mount");
    this.#plan.checkData(data);
    this.#checkGroupReadouts();
    const ids = [...this.#plan.bodies.keys()];
    const paths = this.#plan.moonPaths();
    const sunCentred = this.#plan.checkSunCentred(ids);
    this.#plan.checkSolarSystemScale(this.#scale, sunCentred);
    for (const entry of this.#tracked.values()) checkReadouts(entry, ids);
    const entries = [...this.#tracked.values()];
    const tracked = entries.map((entry) => entry.body);
    const timeline = this.#timeline;
    const { window, startUtcMs } = spanOf(timeline, this.#timeUtcMs, [...tracked.map((body) => body.trajectory.bounds), ...[...this.#activities.values()].map((activity) => activity.window)]);
    const sunOrbitIds = this.#plan.sunOrbitIds(ids);
    // The farthest distance is worked out in setup, once: now when the planet series are in, else in `prepare` once they are; never in the frame loop.
    const fault: { error?: SceneError } = {};
    // `lineFixedTo: "auto"` paths read body states: now when the planet series are in, else in `prepare` once they are (the viewer draws only after it resolves); never per frame.
    const auto = autoPaths(this.#plan.catalogue, entries, tracked, ids);
    auto.now((read) => this.#deferredRead(ids, window, fault, undefined, read));
    const fit = this.#deferredRead(ids, window, fault, undefined, () => this.#fitFarthestKm(startUtcMs));
    // The lines read planet positions; when the planet series are not loaded yet (a consumer's mount), they are drawn in `prepare`, once the series are in. The viewer draws only after `prepare` resolves.
    const sunPaths: PathLayer[] = this.#deferredRead<PathLayer[]>(ids, window, fault, [], () => this.#plan.earlySunPaths(sunOrbitIds, startUtcMs, planetSeriesLoaded()));
    const target = this.camera.target;
    const view = this.camera.view;
    const storyPanels = this.#storyPanels(window);
    this.#checkGroups(ids);
    // A clump near a body reads its position; with the planet series not loaded yet, those groups are built in `prepare` (the viewer draws only after it resolves).
    const seriesIn = planetSeriesLoaded();
    const late = (plan: PlannedGroup): boolean => !seriesIn && plan.input.clump !== undefined;
    const layers: GroupLayer[] = this.#deferredRead<GroupLayer[]>(ids, window, fault, [], () => [...this.#groupLayers(ids, window, startUtcMs, (plan) => !late(plan))]);
    const labelled = [...this.#plan.bodies.values(), ...tracked, ...[...this.#groups.values()]].map(({ id, label }) => ({ id, label }));
    const catalogue = this.#plan.catalogue;
    checkEventObjects(this.#events, new Set(labelled.map(({ id }) => id)));
    const definition: ExperienceDefinition = {
      experience: {
        objects: [
          ...[...this.#plan.bodies.values()].map((body) => this.#plan.bodyObject(body, ids, sunCentred, this.camera)),
          ...[...this.#tracked.values()].map(({ body, description, knownLimitations, provenanceSpans }): ExperienceObject => ({ id: body.id, label: body.label, color: body.color, availability: body.trajectory.bounds, labelPriority: 80, ...this.#plan.labelReach(body.id, sunCentred, this.camera), provenance: body.provenance, ...(provenanceSpans === undefined ? {} : { provenanceSpans }), ...(description === undefined ? {} : { description }), ...(knownLimitations === undefined ? {} : { knownLimitations }) })),
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
      ...(this.#plan.catalogue === builtInCatalogue ? {} : { catalogue: this.#plan.catalogue }),
      ...this.#plan.visualOverrides(),
      composition: createComposition(this.#plan.catalogue, { id: "scene", bodies: ids, defaultCenter: ids[0]!, ...(paths.length === 0 ? {} : { paths }) }),
      scaleChoices: scaleChoicesOf(this.#scale, this.#scaleOnly, this.#plan.enlargedInSun(sunCentred)),
      ...(this.#switches === undefined ? {} : { displaySwitches: this.#switches }),
      ...this.#viewsEntry(ids, storyPanels),
      ...viewEntries(timeline, this.camera, fit?.read, pathCover(this.#tracked.values(), sunCentred, ids[0]!)),
      ...(target === undefined ? {} : { startView: { focus: target, azimuthDeg: view.azimuthDeg ?? 0, elevationDeg: view.elevationDeg ?? 30, distance: view.distance ?? 40 } }),
      trackedBodies: tracked,
      createMetrics: ({ resolver }) => {
        const catalogued = bodyMetrics(resolver, ids, ["distance"], catalogue);
        const readouts = createReadoutMetrics([...this.#tracked.values()].map(({ body, readouts: specs }) => ({ body, readouts: specs })), resolver);
        return (objectId: string, timeUtcMs: number): readonly Metric[] => (this.#groups.has(objectId) ? this.#groupMetrics(objectId, timeUtcMs) : this.#tracked.has(objectId) ? readouts(objectId, timeUtcMs) : catalogued(objectId, timeUtcMs));
      },
      prepare: async () => {
        if (fault.error !== undefined) throw fault.error;
        if (needsPlanetSeries(definition) || auto.later || sunPaths.length < sunOrbitIds.length || this.#groups.size > layers.length) await loadPlanetSeries();
        this.#checkPlanetSpan(ids, window);
        auto.settle((read) => this.#planetRead(ids, window, read));
        if (this.#groups.size > layers.length) layers.push(...this.#planetRead(ids, window, () => this.#groupLayers(ids, window, startUtcMs, late)));
        if (sunPaths.length < sunOrbitIds.length) sunPaths.push(...this.#planetRead(ids, window, () => sunOrbitIds.map((id) => this.#plan.sunPath(id, startUtcMs))));
        if (fit !== undefined) this.#planetRead(ids, window, () => fit.settle());
        await installData(data, ids, window, catalogue);
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
