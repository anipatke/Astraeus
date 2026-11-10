import type { BodyId } from "../core/body";
import type { BodyCatalogue } from "../assets/catalogue";
import type { EccentricSampling } from "../core/sunCentredSources";
import type { ExperienceDefinition } from "../app/experienceDefinition";
import type { BodyRef } from "./bodies";
import { SceneError } from "./errors";
import { frozenCopy } from "./frozenCopy";
import type { FollowView } from "./scene";
import type { CameraPose, SkyDirection } from "./viewerLink";
import { eqjUnitVector, validateCameraView } from "../core/startView";
import { farthestSunDistanceKm } from "./sunOrbit";
import { planetSeriesLoaded } from "../core/planetSeries";
import type { TimelineSetting } from "./story";

/** The scene's camera: what it opens on. */
export class SceneCamera {
  #target: string | undefined;
  #following = false;
  #view: FollowView = {};
  #reach: number | undefined;
  #far: number | undefined;
  #pose: CameraPose | undefined;
  #followIds: readonly string[] | undefined;
  #lookOutIds: readonly string[] = Object.freeze([]);
  #fit: string | undefined;
  readonly #has: (id: string) => boolean;
  readonly #circlesSun: (id: string) => boolean;
  readonly #editable: () => void;
  constructor(has: (id: string) => boolean, circlesSun: (id: string) => boolean, editable: () => void) {
    this.#editable = editable;
    this.#has = has;
    this.#circlesSun = circlesSun;
  }
  /** Opens framed on a body or trajectory already added to the scene and already following it (the viewer's Follow button shows as pressed). */
  follow(id: string, view: FollowView = {}): this {
    return this.#open("follow", id, view, true);
  }
  /** Opens framed on a body or trajectory already added to the scene, looking at it but not following it (the viewer's Focus button shows as pressed). The last of `follow` and `focus` wins. */
  focus(id: string, view: FollowView = {}): this {
    return this.#open("focus", id, view, false);
  }
  #open(call: string, id: string, view: FollowView, following: boolean): this {
    this.#editable();
    if (!this.#has(id)) throw new SceneError("unknown-body", `camera.${call}("${id}"): no body or trajectory with that id has been added to the scene`);
    if (view.up !== undefined && view.up !== "equatorial" && view.up !== "ecliptic") throw new SceneError("bad-camera", `camera.${call}("${id}"): up "${String(view.up)}" must be "equatorial" or "ecliptic"`);
    this.#target = id;
    this.#pose = undefined;
    this.#following = following;
    this.#view = frozenCopy(view);
    return this;
  }
  /**
   * Opens standing inside a body (at its centre) and looking out, with no camera button pressed. `body` must be a body or trajectory already added (else `unknown-body`).
   * `look.direction` is a star-map position (`{ raDeg, decDeg }`, J2000 equatorial degrees; default right ascension 0, declination 0) and `look.fovDeg` the vertical field of view in degrees (5 to 100; default 60);
   * a direction or field of view out of range throws `bad-camera`. Same as `setStartView` with a sky pose. The last of `follow`, `focus`, `lookOut` and `setStartView` wins.
   * @example
   * scene.camera.lookOut("earth", { direction: { raDeg: 83.6, decDeg: 22 }, fovDeg: 40 });
   */
  lookOut(body: BodyRef | BodyId, look: { readonly direction?: SkyDirection; readonly fovDeg?: number } = {}): this {
    const id = typeof body === "string" ? body : body?.id;
    const direction = look?.direction;
    if (direction !== undefined && (typeof direction !== "object" || direction === null)) throw new SceneError("bad-camera", "camera.lookOut: direction must be { raDeg, decDeg }");
    return this.#start({ lookOut: id, raDeg: direction?.raDeg ?? 0, decDeg: direction?.decDeg ?? 0, fovDeg: look?.fovDeg ?? 60 }, "camera.lookOut");
  }
  /**
   * Opens at a pose with no camera button pressed (neither Focus nor Follow shows as pressed, and choosing another body moves the camera as it does without a start). The pose is what `ViewerHandle.camera` reads, either kind:
   * an orbit pose `{ focus, azimuthDeg, elevationDeg, distance }` (distance in Earth radii), or a sky pose `{ lookOut, raDeg, decDeg, fovDeg }` (standing inside a body, looking out).
   * `focus` or `lookOut` must be a body or trajectory already added (else `unknown-body`); a bad angle, distance or field of view throws `bad-camera`.
   * The last of `follow`, `focus`, `lookOut` and `setStartView` wins. Default: none.
   * @example
   * scene.camera.setStartView({ focus: "earth", azimuthDeg: 20, elevationDeg: 30, distance: 40 });
   */
  setStartView(pose: CameraPose): this {
    return this.#start(pose, "camera.setStartView");
  }
  #start(pose: unknown, call: string): this {
    this.#editable();
    const record = pose as { focus?: unknown; lookOut?: unknown } | null;
    const named = record?.lookOut ?? record?.focus;
    if (typeof named === "string" && !this.#has(named)) throw new SceneError("unknown-body", `${call}: "${named}" has not been added to the scene`);
    try {
      this.#pose = validateCameraView(pose, `${call} pose`);
    } catch (error) {
      if (error instanceof RangeError) throw new SceneError("bad-camera", error.message);
      throw error;
    }
    this.#target = undefined;
    this.#following = false;
    this.#view = {};
    return this;
  }
  /**
   * Chooses the objects whose Follow button the camera menu offers, by body, id, path or group already added to the scene (else `unknown-body`); the others offer Focus only. An empty list offers Follow on none.
   * Default: every body, path and group. A scene whose opening view follows an object (`follow`) must list it, else the scene throws `bad-camera` when it is built.
   * @example
   * scene.camera.setFollowChoices(["moon"]);
   */
  setFollowChoices(ids: readonly (BodyRef | BodyId)[]): this {
    this.#editable();
    if (!Array.isArray(ids)) throw new SceneError("bad-camera", "camera.setFollowChoices: give a list of bodies or ids");
    const named = ids.map((item) => (typeof item === "string" ? item : item?.id));
    for (const id of named) if (typeof id !== "string" || !this.#has(id)) throw new SceneError("unknown-body", `camera.setFollowChoices("${String(id)}"): no body or trajectory with that id has been added to the scene`);
    this.#followIds = Object.freeze([...new Set(named)]);
    return this;
  }
  /**
   * Chooses the bodies whose "Look out from" entry the camera menu offers, by body, id or path already added to the scene (else `unknown-body`); the entry stands inside the body and looks out, and any other camera entry leaves it.
   * Default: none. An empty list offers none. The opening view is separate: `lookOut` opens looking out whether or not the body is listed.
   * @example
   * scene.camera.setLookOutChoices(["earth", "mars"]);
   */
  setLookOutChoices(ids: readonly (BodyRef | BodyId)[]): this {
    this.#editable();
    if (!Array.isArray(ids)) throw new SceneError("bad-camera", "camera.setLookOutChoices: give a list of bodies or ids");
    const named = ids.map((item) => (typeof item === "string" ? item : item?.id));
    for (const id of named) if (typeof id !== "string" || !this.#has(id)) throw new SceneError("unknown-body", `camera.setLookOutChoices("${String(id)}"): no body or trajectory with that id has been added to the scene`);
    this.#lookOutIds = Object.freeze([...new Set(named)]);
    return this;
  }
  /**
   * Sets how far the viewer can zoom out from what they look at, in Earth radii (the scene's scaled unit); a finite number above 0, else `bad-camera`.
   * Also sets the camera's far plane (where drawing stops) to 2.5 times `distance`, so what lies out to the reach is still drawn; `farEarthRadii` (a finite number at least `distance`, in Earth radii) sets the far plane itself instead.
   * Labels reach as far: a body's label stays shown at any distance the camera can take. Without this call the camera frames the scene as before.
   * `setReach` and `fitOrbit` set the same limit, so the later call wins and replaces the earlier one.
   */
  setReach(distance: number, options: { readonly farEarthRadii?: number } = {}): this {
    this.#editable();
    if (!(typeof distance === "number" && Number.isFinite(distance) && distance > 0)) throw new SceneError("bad-camera", `camera.setReach: distance must be a finite number above 0, got ${String(distance)}`);
    const far = options.farEarthRadii;
    if (far !== undefined && !(typeof far === "number" && Number.isFinite(far) && far >= distance)) throw new SceneError("bad-camera", `camera.setReach: farEarthRadii must be a finite number of at least the distance (${distance}), got ${String(far)}`);
    this.#reach = distance;
    this.#far = far;
    this.#fit = undefined;
    return this;
  }
  /**
   * Sets the farthest zoom-out so the whole orbit of a body circling the Sun (a planet, or a comet or asteroid from `addBodyFromElements`, already added to the scene) fits the canvas
   * from any view direction: the orbit's farthest Sun distance divided by the sine of the narrower half field of view of the canvas (vertical 45 degrees, or horizontal from the
   * canvas's width over height), with 10 percent to spare. The viewer fits again whenever the canvas changes shape, such as a phone turning or a window resizing; the far plane follows
   * as for `setReach`. The opening view does not move. Any other body throws `bad-camera` naming it; an id not in the scene throws `unknown-body`. `setReach` and `fitOrbit` set the
   * same limit, so the later call wins and replaces the earlier one.
   * @example
   * scene.camera.fitOrbit("c-2025-a1");
   */
  fitOrbit(body: BodyRef | BodyId): this {
    this.#editable();
    const id = typeof body === "string" ? body : body.id;
    if (!this.#has(id)) throw new SceneError("unknown-body", `camera.fitOrbit("${id}"): no body or trajectory with that id has been added to the scene`);
    if (!this.#circlesSun(id)) throw new SceneError("bad-camera", `camera.fitOrbit("${id}"): "${id}" is not a body that circles the Sun (a planet, a comet or one added with addBodyFromElements)`);
    this.#fit = id;
    this.#reach = undefined;
    this.#far = undefined;
    return this;
  }
  /** The body `fitOrbit` fits the zoom-out to, if any. */
  get fitted(): string | undefined { return this.#fit; }
  /** The farthest zoom-out set with `setReach`, if any. */
  get reachEarthRadii(): number | undefined { return this.#reach; }
  /** The far plane set with `setReach`'s `farEarthRadii`, if any. */
  get farEarthRadii(): number | undefined { return this.#far; }
  /** The pose `setStartView` set, if it is the last opening call. */
  get pose(): CameraPose | undefined { return this.#pose; }
  /** The objects offering Follow (`setFollowChoices`); undefined: every one. */
  get followChoices(): readonly string[] | undefined { return this.#followIds; }
  /** The bodies offering "Look out from" (`setLookOutChoices`); none by default. */
  get lookOutChoices(): readonly string[] { return this.#lookOutIds; }
  get target(): string | undefined { return this.#target; }
  /** Whether the opening view follows its target (`follow`) rather than only looking at it (`focus`). */
  get following(): boolean { return this.#following; }
  get view(): FollowView { return this.#view; }
}

/** The fitted body's farthest Sun distance, read once when the viewer first needs it (a planet's reads the planet series, loaded by then); undefined when no orbit is fitted. */
export function fitFarthestKm(camera: SceneCamera, catalogue: BodyCatalogue, own: ReadonlyMap<BodyId, EccentricSampling>, openUtcMs: number): { readonly read: () => number; readonly settle: () => void } | undefined {
  const id = camera.fitted;
  if (id === undefined) return undefined;
  let km: number | undefined;
  const read = (): number => (km ??= farthestSunDistanceKm(catalogue, id, openUtcMs, own.get(id)));
  if (planetSeriesLoaded()) read();
  return { read, settle: () => void read() };
}

/** The `startCameraPresetId` entry of the experience: the camera preset the opening view follows or focuses (absent when none was asked for). */
export function startPresetEntry(camera: SceneCamera): { startCameraPresetId?: string } {
  const target = camera.target;
  return target === undefined ? {} : { startCameraPresetId: `${camera.following ? "follow" : "focus"}-${target}` };
}

/** The `startView` entry of the definition: the opening framing of the camera's target (absent when none was asked for). */
export function startViewEntry(camera: SceneCamera): Pick<ExperienceDefinition, "startView"> {
  if (camera.pose !== undefined) return { startView: { ...camera.pose } };
  const target = camera.target;
  const view = camera.view;
  return target === undefined ? {} : { startView: { focus: target, azimuthDeg: view.azimuthDeg ?? 0, elevationDeg: view.elevationDeg ?? 30, distance: view.distance ?? 40 } };
}

/** The playback and camera settings the scene asked for: looping, the farthest zoom-out and the ecliptic up. */
export function viewEntries(timeline: TimelineSetting | undefined, camera: SceneCamera, farthestKm: (() => number) | undefined, cover: (() => number) | undefined): Pick<ExperienceDefinition, "loop" | "camera" | "viewUp"> {
  const { reachEarthRadii: reach, view, target } = camera;
  return {
    ...(timeline?.loop === true ? { loop: true } : {}),
    ...(reach === undefined ? {} : { camera: { maxFocusDistance: reach, far: camera.farEarthRadii ?? reach * 2.5 } }),
    ...(farthestKm === undefined ? {} : { camera: { fitOrbit: { farthestKm } } }),
    ...(reach !== undefined || farthestKm !== undefined || cover === undefined ? {} : { camera: { cover: { farthestKm: cover } } }),
    ...(view.up === undefined || target === undefined ? {} : { viewUp: view.up }),
  };
}

/** The camera menu: Overview, Focus for every body and path, Follow for every one unless `setFollowChoices` named fewer, and "Look out from" for the bodies `setLookOutChoices` listed (the look is toward right ascension 0, declination 0 until the visitor turns). */
export function cameraPresetsOf(objects: readonly { readonly id: string; readonly label: string }[], followChoices?: readonly string[], lookOutChoices: readonly string[] = []): ExperienceDefinition["experience"]["cameraPresets"] {
  return [
    { id: "overview", label: "Overview", request: { kind: "overview" } },
    ...objects.flatMap(({ id, label }) => [
      { id: `focus-${id}`, label: `Focus ${label}`, request: { kind: "focus" as const, target: id } },
      ...(followChoices === undefined || followChoices.includes(id) ? [{ id: `follow-${id}`, label: `Follow ${label}`, request: { kind: "follow" as const, target: id } }] : []),
      ...(lookOutChoices.includes(id) ? [{ id: `lookout-${id}`, label: `Look out from ${label}`, request: { kind: "lookOut" as const, body: id, direction: eqjUnitVector(0, 0) } }] : []),
    ]),
  ];
}
