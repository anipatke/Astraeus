import type { BodyId } from "../core/body";
import type { Provenance } from "../core/provenance";
import type { ActivitySourceInput } from "./activity";
import type { LineStretchInput } from "./pathProvenance";
import { readableScale, solarSystemScale, trueScale, type ScalePolicy } from "../core/scalePolicy";
import type { State } from "../core/state";
import { createStateResolver } from "../core/stateResolver";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import type { TimeBounds, Trajectory } from "../core/trajectory";
import { catalogue as builtInCatalogue } from "../assets/catalogue";
import type { ElementsBodyRecord } from "../core/elementsBody";
import type { ExperienceDefinition } from "../app/experienceDefinition";
import { circlesTheSun } from "./sunOrbit";
import { FALLBACK_SCENE_CENTRE, type BodyRef } from "./bodies";
import type { DataSource } from "./data";
import type { ActivityInput } from "./activity";
import type { GroupInput } from "./group";
export type { GroupInput, GroupOrbitInput, GroupClumpInput, GroupReadoutInput } from "./group";
export type { ActivityInput, ActivitySampleInput, ActivitySourceInput } from "./activity";
export type { DataSource, MoonPositions } from "./data";
import { SceneError } from "./errors";
import { NotLoadedError } from "../core/planetSeries";
import { BodyPlan } from "./planBodies";
import { GroupPlan } from "./planGroups";
import { BodySetPlan, type BodySetContext } from "./planBodySets";
import { MoonPanelPlan } from "./planMoonPanel";
import { PickerPlan } from "./planPicker";
import type { PickerInput } from "./pickerInput";
import { PlacesPlan } from "./planPlaces";
import type { MoonPanelInput, PlacesInput } from "./moonPanelInput";
import type { BodySetInput } from "./bodySetInput";
import { assembleScene } from "./assembleScene";
import { SceneCamera } from "./planCamera";
import { isMounted } from "./sceneFreeze";
import type { SceneBodyRead, SceneBodySetRead, SceneEventRead, SceneGroupRead, SceneMoonPanelRead, ScenePanelRead, ScenePlacesRead, ScenePathRead, SceneTimelineRead, SceneViewsRead } from "./sceneReads";
export type { SceneBodyRead, SceneBodySetRead, SceneEventRead, SceneGroupRead, SceneMoonPanelRead, ScenePanelRead, ScenePlacesRead, ScenePathRead, SceneTimelineRead, SceneViewRead, SceneViewsRead } from "./sceneReads";
export { SceneCamera } from "./planCamera";
import { StoryPlan } from "./planStory";
import { buildTracked, pathReads, type Tracked } from "./planPaths";
import { toUtcMs, type TimeInput } from "./time";
import { TimelinePlan } from "./planTimeline";
import { ViewPlan } from "./planViews";
import type { SwitchesInput } from "./switches";
import type { LookInput } from "./look";
import { checkedLook } from "./lookInput";
import type { ViewInput, ViewsOptions } from "./views";
import { type AddEventsOptions, type EventInput, type StoryPanelsInput, type TimelineInput } from "./story";
export { toUtcMs, type TimeInput } from "./time";
export type { ElementsBodyRecord } from "../core/elementsBody";

/** Options of `addBody`. */
export interface AddBodyOptions {
  /**
   * Draws the body's orbit as a line: the Moon's about Earth and Io's about Jupiter, or, in a scene that holds the Sun, one full turn round the Sun of any body that
   * circles it (the planets, Earth's year, a body added with `addBodyFromElements`), from the scene's opening time (an own body from its periapsis). Others throw `no-orbit`.
   * An object `{ lapDays, fades? }` draws any moon's line from a lap time you state (`OrbitLapInput`), whether or not its record has a period. Default: no line.
   */
  readonly orbit?: boolean | OrbitLapInput;
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
  /** Bars for the body's info card, in order: the same list a path takes (`addTrajectory`'s `readouts`), measured from the scene's centre body. They replace the catalogue's own distance rows. A bad readout throws `bad-readout`; a named body must be in the scene. */
  readonly readouts?: readonly ReadoutInput[];
  /** False leaves the body out of the viewer's object menu (default true). It stays drawn and selectable, and the menu shows it while it is the selected one. A non-boolean throws `bad-body`. */
  readonly listed?: boolean;
  /** Labelled facts for the body's info card, in order, such as `{ label: "Discovered", value: "1610" }`; both texts non-empty, else `bad-body`. None by default. */
  readonly facts?: readonly CardFactInput[];
  /** Sources added to the card's provenance after the body's own (the catalogue's), each a non-empty text, else `bad-body`. Also read by `Scene.provenanceOf`. None by default. */
  readonly sources?: readonly string[];
  /** Which label wins when labels overlap: the higher number shows. A finite number, else `bad-body`. Default `100 - index`, so bodies added earlier win. */
  readonly labelPriority?: number;
}

/** One labelled fact on a body's info card (`AddBodyOptions.facts`). */
export interface CardFactInput {
  readonly label: string;
  readonly value: string;
}

/**
 * The orbit line of a moon from a lap time you give, for a moon whose catalogue record has no period (or to override it): one lap of `lapDays` days about its parent, which must be in the scene.
 * `fades` true fades the line's far end; false closes the loop; absent follows the moon's own rule (the Moon's line fades, others close). A bad lap or a body that circles the Sun throws `bad-body`.
 */
export interface OrbitLapInput {
  readonly lapDays: number;
  readonly fades?: boolean;
}

/** The rows a body's info card can show, in the order given to `Scene.setBodyReadouts`. */
export type BodyReadoutKind = "distance" | "phase" | "coordinates";

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

/** Options of `Scene.load` and `Scene.check`: the data packages `mount` would be given. */
export interface SceneLoadOptions {
  /** Data packages the scene's bodies need, such as moon positions; nothing is looked up behind the caller's back. */
  readonly data?: readonly DataSource[];
}

const DEFAULT_BODY_READOUTS: readonly BodyReadoutKind[] = Object.freeze(["distance"]);
const BODY_READOUT_KINDS: readonly BodyReadoutKind[] = ["distance", "phase", "coordinates"];

const SCALES: readonly ScalePolicy[] = [trueScale, readableScale, solarSystemScale];

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
  readonly #groupPlan = new GroupPlan(() => this.#plan.catalogue, (id) => this.#taken(id));
  readonly #bodySets = new BodySetPlan(() => this.#plan.catalogue, (id) => this.#taken(id));
  readonly #moonPanel = new MoonPanelPlan();
  readonly #places = new PlacesPlan();
  readonly #picker = new PickerPlan();
  readonly #story = new StoryPlan();
  readonly #timeline = new TimelinePlan();
  readonly #viewPlan = new ViewPlan();
  readonly #sources = new Map<BodyId, Trajectory>();
  #scale: ScalePolicy = trueScale;
  #scaleOnly = false;
  #look: LookInput | undefined;
  #bodyReadouts: readonly BodyReadoutKind[] = DEFAULT_BODY_READOUTS;

  constructor() {
    this.camera = new SceneCamera((id) => this.#taken(id), (id) => this.#plan.bodies.has(id) && circlesTheSun(this.#plan.catalogue, id), () => this.#editable());
  }

  /** Refuses an edit once a viewer has taken the scene. */
  #editable(): void {
    if (isMounted(this)) throw new SceneError("scene-mounted", "this scene was edited after a viewer took it; build a new scene instead");
  }

  /** The bodies the scene holds, in the order added (the first is the scene's centre): id, label, the body it circles, whether its orbit line is on, and how much it is enlarged. A fresh frozen list on every read; it answers on a scene a viewer has taken. */
  get bodies(): readonly SceneBodyRead[] { return this.#plan.reads(); }

  /** The paths the scene holds (`addTrajectory`), in the order added: id, label, centre body and provenance. A fresh frozen list on every read. */
  get paths(): readonly ScenePathRead[] { return pathReads(this.#tracked.values()); }

  /** The groups the scene holds (`addGroup`), in the order added: id, label, orbit count, centre body, plane and the provenance the group's card shows. A fresh frozen list on every read. */
  get groups(): readonly SceneGroupRead[] { return this.#groupPlan.reads(this.#sceneFirst()); }

  /** The body sets the scene holds (`addBodySet`), in the order added: id, centre body, member count and family ids. A fresh frozen list on every read. */
  get bodySets(): readonly SceneBodySetRead[] { return this.#bodySets.reads(this.#sceneFirst()); }

  /** The picker (`setPicker`), as set; undefined when none was set. */
  get picker(): PickerInput | undefined { return this.#picker.input; }

  /** The moon panel (`setMoonPanel`): how many moons it lists and the line that states them with their source and date; undefined when none was set. */
  get moonPanel(): SceneMoonPanelRead | undefined { return this.#moonPanel.read(); }

  /** The bodies that hold tagged places (`addPlaces`), in the order added, with how many each holds. A fresh frozen list on every read. */
  get places(): readonly ScenePlacesRead[] { return this.#places.reads(); }

  /** The events the scene holds (`addEvents`), sorted by time: id, label, `timeUtcMs`, type, object and provenance (the event's own, else the batch's). A fresh frozen list on every read. */
  get events(): readonly SceneEventRead[] { return this.#story.eventReads(); }

  /** The story panels (`addStoryPanels`), sorted by time with their times resolved against the events, path anchors and timeline as `mount` resolves them; empty when none were added. A bad panel throws `bad-panels`, as `mount` would. A fresh frozen list on every read. */
  get panels(): readonly ScenePanelRead[] {
    const { window } = this.#timelineSpan();
    return this.#story.panelReads(window, this.#tracked.values(), [...this.#plan.bodies.keys(), ...this.#tracked.keys(), ...this.#groupPlan.groups.keys(), ...this.#bodySets.memberIds()]);
  }

  /** The views the scene names (`setViews`): the id of the opening view (`startId`), where the choice shows and each view's id and label; undefined when none were named. */
  get views(): SceneViewsRead | undefined { return this.#viewPlan.read(); }

  /** The scale choices the viewer will offer, in order, as ids ("true-scale", "readable-scale", "solar-system"); the first is the opening scale and `setScale(.., { only: true })` leaves just that one. */
  get scales(): readonly string[] { return Object.freeze(this.#plan.scaleChoices(this.#scale, this.#scaleOnly)); }

  /** The timeline the scene opens with: its span and opening moment in UTC milliseconds (`windowStartUtcMs`, `windowEndUtcMs`, `openUtcMs`), the speeds offered (`rates`), the opening `rate` and whether playback wraps (`loop`). With no span or moment set and no path or activity, the span is a month about the moment of the read. A moment outside a span set with `setTimeline` throws `bad-timeline`, as `mount` would. */
  get timeline(): SceneTimelineRead { return this.#timeline.read(this.#spans()); }

  /** The spans of the paths and activities, which the timeline follows when nothing sets it. */
  #spans(): readonly TimeBounds[] {
    return [...[...this.#tracked.values()].map(({ body }) => body.trajectory.bounds), ...[...this.#groupPlan.activities.values()].map((activity) => activity.window)];
  }

  #timelineSpan(): { readonly window: TimeBounds; readonly startUtcMs: number } { return this.#timeline.span(this.#spans()); }

  /** The scene's first body, the centre of a group that names none. */
  #sceneFirst(): BodyId { return this.#plan.bodies.keys().next().value ?? FALLBACK_SCENE_CENTRE; }

  /** Adds a catalogued body: a ready-made one (`earth`, `moon`, ...) or its id. The first body added is the scene's centre. `{ orbit: true }` also draws its orbit line. */
  addBody(body: BodyRef | BodyId, options: AddBodyOptions = {}): this {
    this.#editable();
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
    this.#editable();
    this.#plan.addFromElements(record, options);
    return this;
  }

  /** Adds a path to follow and draw, from sampled states or a provider with `stateAt(time)`. */
  addTrajectory(input: TrajectoryInput): this {
    this.#editable();
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
    return this.#plan.bodies.has(id) || this.#tracked.has(id) || this.#groupPlan.groups.has(id) || this.#bodySets.has(id);
  }

  /**
   * Adds a group of listed orbits drawn as one set of dots (one colour and dot size, one menu item and info card), with an optional clump near a body.
   * The orbits circle the scene's centre unless `center` names another body. A repeated id throws `duplicate-id`; an empty list, a bad orbit, colour or clump throws `bad-group`. A `center` that is not a catalogued body throws `unknown-body`; a catalogued one the finished scene does not hold throws `bad-group` from `toDefinition`.
   * @example
   * scene.addGroup({ id: "ring", orbits: [{ id: "a", semiMajorAxisKm: 90_000, eccentricity: 0.1, inclinationDeg: 5, raanDeg: 40, argumentOfPeriapsisDeg: 70 }], color: "#9de3a8" });
   */
  addGroup(input: GroupInput): this {
    this.#editable();
    this.#groupPlan.addGroup(input);
    return this;
  }

  /**
   * Adds many small bodies about one centre as one batch: each member is a selectable dot (a ball at true size close up, its name on hover, tap or near zoom), with orbit lines coloured by its family.
   * The members circle the scene's centre unless `center` names another body in the scene. They are all listed moons of the centre (positions come through `data`, as for `addBody`) or all made-up
   * ones with `elements` on two-body motion. `bodies` names bodies added with `addBody` that belong to a family. A repeated id throws `duplicate-id`; a malformed set, an unlisted moon, a centre
   * without gravity or a balance point outside the set throws `bad-body-set`. Read the result from `scene.bodySets`.
   * @example
   * scene.addBodySet({ id: "swarm", families: [{ id: "inner", label: "Inner swarm" }], provenance: { sourceType: "illustrative", sources: ["Made up"], accuracy: "Not real.", notes: "" }, members: [{ id: "bit-a", label: "Bit A", radiusKm: 5, family: "inner", elements: { semiMajorAxisKm: 30_000, eccentricity: 0.1, inclinationDeg: 5, raanDeg: 10, argumentOfPeriapsisDeg: 20, trueAnomalyDeg: 30 } }] });
   */
  addBodySet(input: BodySetInput): this {
    this.#editable();
    this.#bodySets.add(input);
    return this;
  }

  /**
   * Shows the sliding panel of a planet's moons by family: its heading label, the families (each a one-line description and its moons, named or provisional), the family listed first with pictures
   * (`featuredFamily`) and where and when the list was taken (`listSource`, `listDate`). Each moon is a body (`addBody`) or a body-set member (`addBodySet`) of the scene, checked when the scene is built;
   * its label comes from there, and a body gets the picture the viewer's `data` brings for it. Replaces any earlier panel. A malformed panel, or a moon the scene does not hold, throws `bad-moon-panel`. Read the count and summary from `scene.moonPanel`.
   * @example
   * scene.setMoonPanel({ label: "Tarn", families: [{ id: "inner", label: "Inner moons", description: "Close and quick.", moons: [{ id: "bit-a" }] }], listSource: "A made-up list", listDate: "2026-10-18" });
   */
  setMoonPanel(input: MoonPanelInput): this {
    this.#editable();
    this.#moonPanel.set(input);
    return this;
  }

  /**
   * Offers a choice in the viewer's top bar and phone drawer: one button per option, the one with `value` pressed when the viewer opens. Fewer than two options draw nothing. Replaces any earlier picker.
   * A press only tells the host (`onPick` on the handle, or the prop of `AstraeusScene`): the viewer never navigates, reads or writes the page address, or keeps a time, and the pressed button does not move
   * until the host calls `setPick` or mounts a new scene. A malformed picker, or a `value` that is not one of the options, throws `bad-picker`. Read it back from `scene.picker`.
   * @example
   * scene.setPicker({ id: "world", label: "World", options: [{ value: "tarn", label: "Tarn" }, { value: "mere", label: "Mere" }], value: "tarn" });
   */
  setPicker(input: PickerInput): this {
    this.#editable();
    this.#picker.set(input);
    return this;
  }

  /**
   * Adds the tagged places of one body, drawn as markers on it and opened in the information panel: categories (key, label, colour), places (id, name, kind, category, latitude and longitude in degrees as given,
   * description and optional details) and the provenance shown with each. The body must be in the scene when it is built. A second call for one body throws `duplicate-id`; a malformed list throws `bad-places`.
   * Read the result from `scene.places`.
   * @example
   * scene.addPlaces("tarn", { categories: [{ key: "pit", label: "Pits", color: "#9de3a8" }], places: [{ id: "deep", name: "Deep Pit", kind: "Pit", category: "pit", latitudeDeg: 12, longitudeDeg: -40, description: "A made-up pit." }], provenance: { sourceType: "illustrative", sources: ["Made up"], accuracy: "Not real.", notes: "" } });
   */
  addPlaces(body: BodyRef | BodyId, input: PlacesInput): this {
    this.#editable();
    this.#places.add(body, input);
    return this;
  }

  /**
   * Adds a period of activity to the timeline: a rate curve the timeline glows by, its peak mark, and where each stretch comes from. A group's `{ kind: "rate" }` readout shows its live rate
   * (unavailable outside the period) against the peak. Without `setTimeline`, the timeline spans the activities. A repeated id throws `duplicate-id`; a bad curve, peak, source or moment throws `bad-activity`.
   * @example
   * scene.addActivity({ id: "burst", label: "Burst", unit: "per hour", start: "2026-08-01", end: "2026-08-20", peak: "2026-08-12", samples: [{ time: "2026-08-01", value: 2 }, { time: "2026-08-12", value: 100 }, { time: "2026-08-20", value: 5 }] });
   */
  addActivity(input: ActivityInput): this {
    this.#editable();
    this.#groupPlan.addActivity(input);
    return this;
  }

  /** Sets the moment the scene opens at. */
  setTime(time: TimeInput): this {
    this.#editable();
    this.#timeline.setTime(time);
    return this;
  }

  /** Chooses the opening scale: `trueScale`, `readableScale` or `solarSystemScale` (true distances, the enlarged bodies drawn larger; it needs a Sun-centred scene with an enlarged body, else the scene throws `bad-scale`); the viewer can switch to the other (in a Sun-centred scene with an enlarged body, the second choice is the Solar system scale instead of the readable one), unless `{ only: true }` offers this scale alone. */
  setScale(scale: ScalePolicy, options: { readonly only?: boolean } = {}): this {
    this.#editable();
    if (!SCALES.some((known) => known.id === scale?.id)) throw new SceneError("bad-scale", `setScale: "${String(scale?.id)}" is not a scale; use trueScale, readableScale or solarSystemScale`);
    this.#scale = scale;
    this.#scaleOnly = options.only === true;
    return this;
  }

  /**
   * Sets the looks, presentation settings that change how the scene is drawn and never where anything is (`LookInput`: star, Milky Way and Sun glow brightness, marker and feature-marker sizes in pixels, the
   * loading-cover fade in seconds, the sky shown or hidden). Replaces the whole look: a look not named keeps its default. A page address parameter, when the viewer's `address` option is on, overrides the look
   * it names. An unknown look or a value out of its range throws `bad-look` here.
   * @example
   * scene.setLook({ starBrightness: 1.4, markerSwapRadiusPx: 5, loadFadeSeconds: 1 });
   */
  setLook(look: LookInput): this {
    this.#editable();
    this.#look = checkedLook(look);
    return this;
  }

  /**
   * Chooses the rows a body's info card shows (a body whose `addBody` gave its own `readouts` keeps those): `"distance"` (to the parent and the Sun), `"phase"` (the lit share of its disc, for a body with a parent)
   * and `"coordinates"`, in the order given. Replaces the earlier choice. Default `["distance"]`. An unknown kind, or a list that is not an array, throws `bad-readout`.
   * @example
   * scene.setBodyReadouts(["distance", "phase", "coordinates"]);
   */
  setBodyReadouts(kinds: readonly BodyReadoutKind[]): this {
    this.#editable();
    if (!Array.isArray(kinds) || kinds.some((kind) => !BODY_READOUT_KINDS.includes(kind))) throw new SceneError("bad-readout", `setBodyReadouts: give a list of ${BODY_READOUT_KINDS.map((kind) => `"${kind}"`).join(", ")}, got ${JSON.stringify(kinds)}`);
    this.#bodyReadouts = Object.freeze([...kinds]);
    return this;
  }

  /** Adds timed events to the timeline, each with an id, a label and a moment; `provenance` says where the times come from and is shown with every event that has none of its own (`EventInput.provenance`). May be called more than once. Malformed provenance throws "bad-event". */
  addEvents(events: readonly EventInput[], options: AddEventsOptions = {}): this {
    this.#editable();
    this.#story.addEvents(events, options);
    return this;
  }

  /**
   * Adds story panels that open as playback reaches them. A panel opens only when forward playback crosses its time, so one at the opening instant never opens by itself
   * (a panel with an `object` still has its marker on that object). `at.utc` may be any instant inside the timeline, in any year. Their times may name events (`addEvents`) and path anchors, and `object` a body or path; these are checked when the scene is built (`mount`), and a mistake throws `bad-panels` naming the panel and field.
   */
  addStoryPanels(panels: StoryPanelsInput): this {
    this.#editable();
    this.#story.addPanels(panels);
    return this;
  }

  /** Sets the timeline: its span (`start`, `end`), the speeds offered (`rates`), the speed it opens at (`rate`), `pacing` (playback that slows for encounters and speeds up for cruise: spans `{ from, to, rate }` and event rules `{ near: { type, within }, rate }`, easing between speeds; a speed the visitor or host picks wins until `setRate("auto")`; see `PacingInput`) and whether playback wraps from the end to the start (`loop`; ignored with `{ none: true }`, which has no span to wrap, and when `setTimeline` is not called), or `{ none: true }` for no timeline bar, with time frozen at `at` or running at `rate`. Without this call the span follows the paths and the speeds are 1 minute, 1 hour and 1 day per second. */
  setTimeline(timeline: TimelineInput): this {
    this.#editable();
    this.#timeline.setTimeline(timeline);
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
    this.#editable();
    this.#viewPlan.setSwitches(switches);
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
    this.#editable();
    this.#viewPlan.setViews(views, options);
    return this;
  }

  /**
   * The state of a body in the scene at a moment (position in km always; velocity in km/s only where the body's source provides it), the same State the viewer draws: for a path added with `addTrajectory`, about its centre body;
   * for a ready-made body or one from `addBodyFromElements`, about its parent (a planet about the Sun, a moon about its planet). Figures a story quotes, such as a distance from the Sun, come from here. `velocityKmS` is set only for a path whose
   * samples or provider carry velocities and for a moon from fitted data (Io); planets, Earth, the Sun, the built-in comet and elements bodies give position only, so check it before use. An id the scene does not hold throws `unknown-body`. Ready-made and elements bodies answer at any date (they have no data cut-off); only a moment outside an
   * `addTrajectory` path throws `bad-time`. A planet or fitted moon before its data has loaded (`await scene.load({ data })`, or mount the scene and await `ready`) throws `missing-data`.
   * @example
   * const sunDistanceKm = Math.hypot(...scene.stateOf("earth", "2026-08-12T00:00:00Z").positionKm);
   */
  stateOf(id: string, time: TimeInput): State {
    const entry = this.#tracked.get(id);
    if (entry === undefined && !this.#plan.bodies.has(id) && this.#bodySets.setOf(id) !== undefined) return this.#bodySets.stateOf(id, toUtcMs(time, `stateOf("${id}") time`), this.#bodySetContext());
    if (entry === undefined && !this.#plan.bodies.has(id)) throw new SceneError("unknown-body", `stateOf("${id}"): no body or trajectory with that id has been added to the scene`);
    const timeUtcMs = toUtcMs(time, `stateOf("${id}") time`);
    const trajectory = entry?.body.trajectory ?? this.#catalogueSource(id);
    const bounds = trajectory?.bounds;
    if (bounds !== undefined && (timeUtcMs < bounds.startUtcMs || timeUtcMs > bounds.endUtcMs)) throw new SceneError("bad-time", `stateOf("${id}"): ${new Date(timeUtcMs).toISOString()} is outside the ${entry === undefined ? "body's data" : "path"} (${new Date(bounds.startUtcMs).toISOString()} to ${new Date(bounds.endUtcMs).toISOString()})`);
    if (trajectory === undefined) return this.#sunState(id, timeUtcMs);
    try {
      return trajectory.stateAt(timeUtcMs, entry?.center ?? this.#plan.catalogue.get(id).definition.parentId);
    } catch (error) {
      if (error instanceof NotLoadedError) throw new SceneError("missing-data", `stateOf("${id}"): its data is not loaded yet; await scene.load({ data }) first (or mount the scene and await ready)`);
      throw error;
    }
  }

  /** The Provenance of a body's position, as its info card shows it: for a ready-made or elements body the catalogue's position record, for a path the one passed to `addTrajectory`. Carries `accuracyClass` and `maxErrorFraction` where a comparison with an independent ephemeris exists. An id the scene does not hold throws `unknown-body`. */
  provenanceOf(id: string): Provenance {
    const entry = this.#tracked.get(id);
    if (entry !== undefined) return entry.body.provenance!; // addTrajectory always sets one
    if (!this.#plan.bodies.has(id) && this.#bodySets.setOf(id) !== undefined) return this.#bodySets.provenanceOf(id);
    if (!this.#plan.bodies.has(id)) throw new SceneError("unknown-body", `provenanceOf("${id}"): no body or trajectory with that id has been added to the scene`);
    return this.#plan.provenanceOf(id);
  }

  /** What a body set needs of the finished scene, checked: its bodies, window and opening time. */
  #bodySetContext(): BodySetContext {
    if (this.#plan.bodies.size === 0) throw new SceneError("empty-scene", "the scene has no bodies; call addBody before reading a body set's members");
    const context: BodySetContext = { ids: [...this.#plan.bodies.keys()], catalogue: this.#plan.catalogue, orbits: this.#plan.orbits, ...this.#timelineSpan() };
    this.#bodySets.check(context);
    return context;
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

  /**
   * Loads what `stateOf` and `provenanceOf` need without a viewer: the planet series and, for each moon the scene holds, the chunks its data package provides for the scene's window.
   * Pass the same `data` as `mount`. Rejects with `missing-data` when a body needs a package not passed, with `out-of-span` when the window reaches outside the years covered, and with
   * the scene's own build error as `check` does. Harmless to call twice; allowed on a scene a viewer has taken; a later `mount` re-uses what it loaded. Works in plain Node.
   * @example
   * await scene.load({ data: [jupiterData] });
   * const io = scene.stateOf("io", "2016-03-01T00:00:00Z");
   */
  async load(options: SceneLoadOptions = {}): Promise<void> {
    await this.toDefinition(options.data).prepare?.();
  }

  /**
   * Runs the checks `mount` runs before it draws and throws the same `SceneError` for a build fault (an empty scene, a body whose data package is not in `data`, a bad view or panel, ...).
   * Nothing is loaded and the scene is not frozen. Faults that need the planet or moon data (`out-of-span`) arrive from `load`, as they arrive from `mount`'s `ready`.
   * @example
   * scene.check({ data: [jupiterData] }); // throws what mount(element, scene, { data }) would throw
   */
  check(options: SceneLoadOptions = {}): void {
    this.toDefinition(options.data);
  }

  /** The data packages the added bodies need that `data` does not provide. */
  missingData(data: readonly DataSource[] = []): readonly string[] {
    return [...new Set([...this.#plan.missingData(data), ...this.#bodySets.missingData(data)])];
  }

  /** The app's plug-in contract for this scene (`assembleScene.ts`). Throws if the scene is empty or a body needs a data package not passed in `data`. */
  toDefinition(data: readonly DataSource[] = []): ExperienceDefinition {
    return assembleScene({ plan: this.#plan, tracked: this.#tracked, groupPlan: this.#groupPlan, bodySets: this.#bodySets, moonPanel: this.#moonPanel, picker: this.#picker, places: this.#places, story: this.#story, timeline: this.#timeline, viewPlan: this.#viewPlan, camera: this.camera, scale: this.#scale, scaleOnly: this.#scaleOnly, look: this.#look, bodyReadouts: this.#bodyReadouts }, data);
  }
}
