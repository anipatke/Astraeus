import type { ReactNode } from "react";
import type { SimulationClock } from "../core/clock";
import type { StateResolver } from "../core/stateResolver";
import type { PointGroup } from "../core/pointGroup";
import type { TimeBounds, Trajectory } from "../core/trajectory";
import type { EccentricSampling } from "../core/sunCentredSources";
import type { BodyId, CenterId } from "../core/body";
import { catalogue as builtInCatalogue, rootBodyId, type BodyAsset, type BodyCatalogue } from "../assets/catalogue";
import type { SystemComposition } from "../assets/compositions";
import type { BodyVisual } from "../assets/visual";
import type { Metric } from "../shell/metrics";
import type { ExperienceConfig, ExperienceObject } from "../shell/experience";
import { scaleChoicesFor, type ScaleId } from "../shell/scaleModel";
import type { TrackedBody } from "./mission";
import type { SkySettings } from "../assets/sky";
import { validateBodySet, type BodySetLayer } from "./bodySet";

/** Generic scene parts an experience opts into. Nothing here names a mission. */
export type SceneLayerId = "tracked-bodies" | "points" | "sun-centred";

/** What the generic app owns and hands to the experience's factories. */
export interface ExperienceRuntime {
  readonly clock: SimulationClock;
  /** The one resolver every position in the mount comes from; a metric reads a body's state through it. */
  readonly resolver: StateResolver;
  readonly catalogue: BodyCatalogue;
}

/** One developer-tools section; the app draws the heading and the experience supplies the body. */
export interface DeveloperSection {
  readonly id: string;
  readonly heading: string;
  /** Sections sit around the generic scene instrumentation and display settings. */
  readonly placement: "before-scene" | "after-scene";
  readonly render: (runtime: ExperienceRuntime) => ReactNode;
}

/**
 * One group the `points` layer draws as dots and the shell lists as a single item.
 * Members are never individually pickable. Select, focus and follow target the group's
 * representative point, which is always the centroid of its members at the last refill.
 */
export interface GroupLayer {
  readonly group: PointGroup;
  /**
   * The group's one shell item. Its id is also the camera focus id, so the experience's
   * camera presets target it. Provenance and availability default to the group's own.
   */
  readonly object: ExperienceObject;
  readonly color: string;
  /** Dot size in screen pixels; defaults to 2.5. */
  readonly pointSizePx?: number;
  /**
   * Presentation only: the span (simulation milliseconds) between the two exact fills the points layer
   * holds. Each frame draws a straight-line blend of them, and one new fill happens per span while the
   * clock plays on. A longer span fills less often but drifts further from the exact positions between
   * fills. Defaults to five minutes. The group's State is unchanged.
   */
  readonly refillAfterMs?: number;
  /**
   * Presentation only: milliseconds per frame the points layer may spend computing the next fill ahead of time,
   * so a large group does not hitch for a whole frame at each fill. 0 turns that off (every fill is made whole in
   * one frame). Only groups that can fill a range of members and hold more than 1,024 are spread. Defaults to 8.
   */
  readonly refillSliceMs?: number;
}

/**
 * The Sun's shell item in a Sun-centred scene. The Sun itself is the catalogue's: its colour and marker size are the
 * record's, and an experience that wants another marker size says so in `visualOverrides`, not here. Focusing it frames
 * every declared path.
 */
export interface SunBody {
  /** The Sun's one shell item. Its id is also the camera focus id. */
  readonly object: ExperienceObject;
}

/**
 * A per-body presentation change for one experience: any appearance field of the body's record, an enlargement for the
 * solar-system scale, or hiding the body. It cannot touch state, so no metric, position or label distance reads it.
 */
export type VisualOverride = Partial<BodyVisual> & {
  /** Radius multiplier applied under the solar-system scale (at least 1); the experience states it in the body's info. */
  readonly exaggeration?: number;
  /** False leaves the body out of the scene (it still resolves as a centre). */
  readonly visible?: boolean;
};

/** A rolling span: a window this wide, centred on the clock time and resampled as the clock moves. */
export interface RollingSpan {
  readonly windowMs: number;
}

/** Which transformation rule a path is drawn by; see `pathRules.ts`. */
export type PathRule =
  /** The shape the source traces about `center`, carried with that centre to where it is from the scene centre at the clock time. */
  | { readonly kind: "orbit"; readonly center?: CenterId }
  /** Where the body was. `relative`: each sample from the scene centre at its own time. `inertial`: each sample in the root frame at its own time, then from the scene centre at the display time. */
  | { readonly kind: "trail"; readonly frame: "relative" | "inertial" };

/** What a path is drawn from: a rule, a state source, a span and a colour. Any source that answers `stateAt` works (published elements, a recorded trajectory, the resolver). */
export type PathSpec = PathRule & {
  readonly color: string;
  readonly source: Trajectory;
  /** Absolute times, or a window about the clock. */
  readonly span: TimeBounds | RollingSpan;
  /**
   * Number of samples along the span; defaults to 256 (181 for a rolling span, which must be odd so the clock time is a vertex; 512 when
   * `sampling` is given, since an eccentric orbit needs the density).
   */
  readonly samples?: number;
  /**
   * For a highly eccentric orbit: space the samples evenly in eccentric anomaly instead of in time, so the sharp end near periapsis is
   * not drawn with a few long chords. Fixed spans only. Absent means evenly spaced in time.
   */
  readonly sampling?: EccentricSampling;
};

/**
 * A path an experience declares, with its one shell item. Its id is also the camera focus id; it needs provenance. The orbit's
 * samples are about its `center` (default the source's own centre); a trail's about the source's own centre.
 */
export type PathLayer = PathSpec & {
  readonly object: ExperienceObject;
};

/**
 * How far the camera may reach, in scaled units (Earth radii). Both fields are optional: an omitted
 * field keeps the scene's own value, so an experience that declares nothing frames exactly as before.
 */
export interface CameraReach {
  /** Farthest camera-to-focus distance the viewer can zoom out to. */
  readonly maxFocusDistance?: number;
  /** Far clipping plane; must exceed `maxFocusDistance` when both are given. */
  readonly far?: number;
}

/** The scene's far plane when an experience declares none. */
export const DEFAULT_CAMERA_FAR = 5_000;

/**
 * The plug-in contract: everything the generic app needs to mount one experience.
 * It grows from ExperienceConfig and TrackedBody; it never makes a body mandatory.
 */
export interface ExperienceDefinition {
  /** The experience's name, shown in the page heading once it opens ("<label> · Astraeus"). Absent: the heading stays "Astraeus". */
  readonly label?: string;
  readonly experience: ExperienceConfig;
  readonly clock: { readonly startUtcMs: number; readonly rate: number };
  /** Layers the scene mounts, e.g. the tracked-body list. */
  readonly sceneLayers: readonly SceneLayerId[];
  /** The catalogued bodies the scene draws, one view each. Absent: none, as in the bodiless fixture. */
  readonly composition?: SystemComposition;
  /** The catalogue this experience draws from: the built-in one plus bodies it defines itself. Absent: the built-in catalogue. */
  readonly catalogue?: BodyCatalogue;
  /** The catalogued body at the scene's zero. Presentation only; defaults to the composition's own centre, else Earth. */
  readonly sceneCenter?: BodyId;
  /** Per-body presentation overrides; state is untouched. */
  readonly visualOverrides?: Readonly<Record<BodyId, VisualOverride>>;
  /** The scale choices offered, in order; the first is the starting one. Default: true and readable scale. */
  readonly scaleChoices?: readonly ScaleId[];
  /** Drawn only when the `tracked-bodies` layer is listed. */
  readonly trackedBodies: readonly TrackedBody[];
  /** Drawn only when the `points` layer is listed. */
  readonly groups?: readonly GroupLayer[];
  /** The Sun as a drawn body; drawn only when the `sun-centred` layer is listed. */
  readonly sun?: SunBody;
  /** Paths of Sun-centred objects; drawn only when the `sun-centred` layer is listed. */
  readonly paths?: readonly PathLayer[];
  readonly createMetrics: (runtime: ExperienceRuntime) => (objectId: string, timeUtcMs: number) => readonly Metric[];
  readonly developerSections?: readonly DeveloperSection[];
  /** Optional camera reach; omitted, the scene keeps its built-in limits. */
  readonly camera?: CameraReach;
  /**
   * Looping playback (default off): while playing, reaching the end of `experience.window` wraps to the start and plays on, so a group
   * bounded by the window is never left past its end. Presentation of time only; the user can still seek, pause and switch it off.
   */
  readonly loop?: boolean;
  /**
   * Alternative versions of the same experience for comparison, shown as buttons in Developer > Display settings: choosing one reloads the page with
   * `?param=value` (the experience is built again from the address). Absent: none.
   */
  readonly alternates?: readonly { readonly label: string; readonly param: string; readonly value: string; readonly active: boolean }[];
  /** A choice between versions of this experience, shown in the top bar and the phone drawer: choosing one opens it again with `?param=value` (the camera view and time of the old address are dropped). Absent: none. */
  readonly switcher?: import("../shell/SwitchControl").ExperienceSwitch;
  /** Which direction the camera treats as up (default "equatorial", celestial north; "ecliptic" orbits about the ecliptic pole so the planets' plane reads flat). */
  readonly viewUp?: import("./viewUp").ViewUp;
  /** The camera view to open on (focus id, azimuth and elevation in degrees, distance in scaled units). Absent: the usual opening. `?view=` overrides it. */
  readonly startView?: import("./viewLink").StartView;
  /** The sky behind the scene (stars and the Milky Way, at infinity). On at full brightness unless this says otherwise; presentation only. */
  readonly sky?: SkySettings;
  /** Many small bodies drawn as batches (dots with a pixel floor, balls close up, names on demand, orbit lines by family). Absent: none. */
  readonly bodySets?: readonly BodySetLayer[];
  /** Data to load before the scene mounts (for example the curve-fit chunks of the window). The entry awaits it once. */
  readonly prepare?: () => Promise<void>;
}

/** The body sets the scene draws, validated; empty when the experience declares none. */
export function bodySetsOf(definition: ExperienceDefinition): readonly BodySetLayer[] {
  const layers = definition.bodySets ?? [];
  if (new Set(layers.map((layer) => layer.id)).size !== layers.length) throw new RangeError("body set ids must be unique");
  return layers.map(validateBodySet);
}

/** The product name the page heading starts with, before any experience opens. */
export const PAGE_TITLE = "Astraeus";

/** The page heading for an open experience: its own label before the product name; the product name alone when it declares none. */
export function pageTitleOf(definition: Pick<ExperienceDefinition, "label">): string {
  return definition.label === undefined || definition.label.trim() === "" ? PAGE_TITLE : `${definition.label} · ${PAGE_TITLE}`;
}

/** Checks a declared camera reach, naming the offending field. Returns it unchanged. */
export function validateCameraReach(reach: CameraReach): CameraReach {
  for (const field of ["maxFocusDistance", "far"] as const) {
    const value = reach[field];
    if (value === undefined) continue;
    if (!Number.isFinite(value)) throw new RangeError(`camera.${field} must be finite, got ${value}`);
    if (value <= 0) throw new RangeError(`camera.${field} must be positive, got ${value}`);
  }
  if (reach.maxFocusDistance !== undefined && reach.far !== undefined && reach.far <= reach.maxFocusDistance) {
    throw new RangeError(`camera.far (${reach.far}) must exceed camera.maxFocusDistance (${reach.maxFocusDistance})`);
  }
  return reach;
}

/** The validated camera reach an experience declares, or an empty reach when it declares none. */
export function cameraReachOf(definition: ExperienceDefinition): CameraReach {
  return definition.camera === undefined ? {} : validateCameraReach(definition.camera);
}

/** The catalogue the experience draws from: its own extension when it declares one, else the built-in catalogue. */
export function catalogueOf(definition: ExperienceDefinition): BodyCatalogue {
  return definition.catalogue ?? builtInCatalogue;
}

/** The composition the scene mounts: the declared one, else none. */
export function compositionOf(definition: ExperienceDefinition): SystemComposition | undefined {
  return definition.composition;
}

/** The scale choices to offer: the declared ones validated, or none declared (the shell's own pair). */
export function scaleChoiceIdsOf(definition: ExperienceDefinition): readonly ScaleId[] | undefined {
  const ids = definition.scaleChoices;
  if (ids === undefined) return undefined;
  if (ids.length === 0) throw new RangeError("scaleChoices must name at least one choice");
  if (new Set(ids).size !== ids.length) throw new RangeError(`scaleChoices lists a choice twice: ${ids.join(", ")}`);
  scaleChoicesFor(ids);
  return ids;
}

/** The validated overrides: every body catalogued, every enlargement finite and at least 1. Empty when none are declared. */
export function visualOverridesOf(definition: ExperienceDefinition): ReadonlyMap<BodyId, VisualOverride> {
  const overrides = new Map<BodyId, VisualOverride>();
  const catalogue = catalogueOf(definition);
  for (const [id, override] of Object.entries(definition.visualOverrides ?? {})) {
    if (!catalogue.has(id)) throw new RangeError(`visualOverrides names "${id}", which the catalogue lacks`);
    const factor = override.exaggeration;
    if (factor !== undefined && !(Number.isFinite(factor) && factor >= 1)) throw new RangeError(`visualOverrides.${id}.exaggeration must be finite and at least 1, got ${factor}`);
    overrides.set(id, override);
  }
  return overrides;
}

/** A catalogued body as this experience draws it: the record with its overrides laid over the appearance. */
export function assetWithOverride(asset: BodyAsset, override: VisualOverride | undefined): BodyAsset {
  if (override === undefined) return asset;
  const { exaggeration: _exaggeration, visible: _visible, marker, material, ...rest } = override;
  const visual: BodyVisual = {
    ...asset.visual,
    ...rest,
    material: { ...asset.visual.material, ...material },
    ...(marker === undefined && asset.visual.marker === undefined ? {} : { marker: { ...asset.visual.marker, ...marker } as { sizePx: number } }),
  };
  return { ...asset, visual };
}

/**
 * The catalogued body at the scene's zero: the declared one, else the composition's own centre. A scene with no
 * composition has to say which body its tracked bodies and groups are measured from. Throws for a centre the catalogue lacks,
 * the composition omits, or none declared.
 */
export function sceneCenterOf(definition: ExperienceDefinition): BodyId {
  const composition = compositionOf(definition);
  const centre = definition.sceneCenter ?? composition?.defaultCenter;
  if (centre === undefined) throw new RangeError("an experience with no composition must declare its sceneCenter");
  if (!catalogueOf(definition).has(centre)) throw new RangeError(`sceneCenter "${centre}" is not in the catalogue`);
  if (composition !== undefined && !composition.bodies.includes(centre)) {
    throw new RangeError(`sceneCenter "${centre}" is not one of composition "${composition.id}" bodies (${composition.bodies.join(", ")})`);
  }
  return centre;
}

/** The bodies the scene draws, in draw order: the composition's, plus the Sun when a Sun is declared and not already listed. */
export function mountedBodiesOf(definition: ExperienceDefinition): readonly BodyId[] {
  const bodies = [...(compositionOf(definition)?.bodies ?? [])];
  const root = rootBodyId(catalogueOf(definition));
  if (sunCentredOf(definition).sun !== undefined && !bodies.includes(root)) bodies.push(root);
  const overrides = visualOverridesOf(definition);
  return bodies.filter((id) => overrides.get(id)?.visible !== false);
}

/**
 * The object the shell starts with selected: the scene's own centre when the experience lists it, else its first
 * shell item (a group, path or tracked body included). Never a body the experience does not mount.
 */
export function initialObjectIdOf(definition: ExperienceDefinition): string {
  const objects = experienceWithGroups(definition).objects;
  const centre = sceneCenterOf(definition);
  return objects.some((object) => object.id === centre) ? centre : objects[0]?.id ?? centre;
}

/** The tracked bodies the scene should draw: none unless the layer is listed. */
export function trackedBodiesOf(definition: ExperienceDefinition): readonly TrackedBody[] {
  return definition.sceneLayers.includes("tracked-bodies") ? definition.trackedBodies : [];
}

/** The groups the scene should draw: none unless the layer is listed; a repeated shell id keeps its first group. */
export function groupsOf(definition: ExperienceDefinition): readonly GroupLayer[] {
  if (!definition.sceneLayers.includes("points")) return [];
  const seen = new Set<string>();
  return (definition.groups ?? []).filter((layer) => {
    if (seen.has(layer.object.id)) return false;
    seen.add(layer.object.id);
    return true;
  });
}

export const DEFAULT_PATH_SAMPLE_COUNT = 256;
/** Default sample count of a path spaced by eccentric anomaly: at 256 an e = 0.96 orbit is only about ten times finer than by time, at 512 about sixteen. */
export const DEFAULT_ECCENTRIC_SAMPLE_COUNT = 512;
/** Default sample count of a rolling span (the Moon's monthly loop). */
export const DEFAULT_WINDOW_SAMPLE_COUNT = 181;

export const isRollingSpan = (span: PathSpec["span"]): span is RollingSpan => "windowMs" in span;

type PathFault = typeof TypeError | typeof RangeError;

/** Throws `fault` with `message` unless `ok`: one line per field check. */
const must = (ok: boolean, fault: PathFault, message: string): void => {
  if (!ok) throw new fault(message);
};
const isPositiveFinite = (value: number): boolean => value > 0 && Number.isFinite(value);

function checkPathRule(id: string, path: PathSpec, catalogue: BodyCatalogue): void {
  const rule = path as { kind?: unknown; frame?: unknown; center?: unknown };
  must(rule.kind === "orbit" || rule.kind === "trail", TypeError, `path "${id}" kind must be "orbit" or "trail", got ${String(rule.kind)}`);
  must(rule.kind !== "trail" || rule.frame === "relative" || rule.frame === "inertial", TypeError, `path "${id}" frame must be "relative" or "inertial", got ${String(rule.frame)}`);
  must(rule.kind !== "orbit" || rule.center === undefined || (typeof rule.center === "string" && catalogue.has(rule.center)), RangeError, `path "${id}" center "${String(rule.center)}" is not a catalogued body`);
  must(typeof path.source?.stateAt === "function", TypeError, `path "${id}" source must be a Trajectory with stateAt`);
}

function checkRollingSpan(id: string, path: PathSpec, span: RollingSpan): void {
  must(isPositiveFinite(span.windowMs), RangeError, `path "${id}" span windowMs must be positive and finite`);
  const samples = path.samples ?? DEFAULT_WINDOW_SAMPLE_COUNT;
  must(Number.isInteger(samples) && samples >= 3 && samples % 2 === 1, RangeError, `path "${id}" samples must be an odd whole number of at least 3 for a rolling span, got ${samples}`);
  must(path.sampling === undefined, RangeError, `path "${id}" sampling by eccentric anomaly needs a fixed span, not a rolling window`);
}

/** Checks a fixed span and its sampling, and returns the span start the source is probed at. */
function checkFixedSpan(id: string, path: PathSpec, span: TimeBounds | undefined): number {
  const { startUtcMs, endUtcMs } = span ?? ({} as TimeBounds); // a missing span fails the finite check below
  if (path.sampling !== undefined) {
    const { eccentricity, periodMs, periapsisUtcMs } = path.sampling;
    must(eccentricity >= 0 && eccentricity < 1, RangeError, `path "${id}" sampling eccentricity must be at least 0 and below 1, got ${eccentricity}`);
    must(isPositiveFinite(periodMs), RangeError, `path "${id}" sampling periodMs must be positive and finite`);
    must(Number.isFinite(periapsisUtcMs), RangeError, `path "${id}" sampling periapsisUtcMs must be finite`);
  }
  must(Number.isFinite(startUtcMs) && Number.isFinite(endUtcMs), RangeError, `path "${id}" span needs finite start and end times`);
  must(endUtcMs > startUtcMs, RangeError, `path "${id}" span must end after it starts`);
  const samples = path.samples ?? (path.sampling === undefined ? DEFAULT_PATH_SAMPLE_COUNT : DEFAULT_ECCENTRIC_SAMPLE_COUNT);
  must(Number.isInteger(samples) && samples >= 2, RangeError, `path "${id}" samples must be a whole number of at least 2, got ${samples}`);
  return startUtcMs;
}

/**
 * Checks one path declaration, naming `id` and the offending field: an unknown rule or frame, an uncatalogued centre, a source that
 * cannot answer a state, an empty or reversed span (or a bad window), or a bad sample count.
 */
export function validatePathSpec(id: string, path: PathSpec, catalogue: BodyCatalogue = builtInCatalogue): void {
  checkPathRule(id, path, catalogue);
  const center = path.kind === "orbit" ? path.center : undefined;
  if (path.span !== undefined && isRollingSpan(path.span)) {
    checkRollingSpan(id, path, path.span);
    return; // a rolling span has no fixed start to probe; its source is asked at the clock time
  }
  const first = checkFixedSpan(id, path, path.span);
  try {
    path.source.stateAt(first, center);
  } catch (error) {
    throw new TypeError(`path "${id}" source cannot give a state about its centre${center === undefined ? "" : ` "${center}"`} at the span start: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Checks the Sun and path declarations and returns them, naming the offending item and field (see `validatePathSpec`),
 * an empty or repeated id or missing provenance.
 */
export function validateSunCentred(sun: SunBody | undefined, paths: readonly PathLayer[], catalogue: BodyCatalogue = builtInCatalogue): { readonly sun: SunBody | undefined; readonly paths: readonly PathLayer[] } {
  const seen = new Set<string>();
  const claim = (id: unknown, what: string): string => {
    if (typeof id !== "string" || id.length === 0) throw new TypeError(`${what} id must be non-empty`);
    if (seen.has(id)) throw new RangeError(`duplicate id "${id}" among the Sun and paths`);
    seen.add(id);
    return id;
  };
  if (sun !== undefined) {
    const id = claim(sun.object?.id, "Sun body");
    if (sun.object.provenance === undefined) throw new TypeError(`sun "${id}" needs provenance on its object`);
  }
  for (const path of paths) {
    const id = claim(path.object?.id, "path");
    if (path.object.provenance === undefined) throw new TypeError(`path "${id}" needs provenance on its object`);
    validatePathSpec(id, path, catalogue);
  }
  return { sun, paths };
}

/** The Sun and paths the scene should draw: none unless the layer is listed; validated. */
export function sunCentredOf(definition: ExperienceDefinition): { readonly sun: SunBody | undefined; readonly paths: readonly PathLayer[] } {
  if (!definition.sceneLayers.includes("sun-centred")) return { sun: undefined, paths: [] };
  return validateSunCentred(definition.sun, definition.paths ?? [], catalogueOf(definition));
}

/** The experience config the shell receives: its own objects plus one item per drawn group, Sun and path, never listed twice. */
export function experienceWithGroups(definition: ExperienceDefinition): ExperienceConfig {
  const groups = groupsOf(definition);
  const { sun, paths } = sunCentredOf(definition);
  if (groups.length === 0 && sun === undefined && paths.length === 0) return definition.experience;
  const known = new Set(definition.experience.objects.map((object) => object.id));
  const addedGroups = groups
    .filter((layer) => !known.has(layer.object.id))
    .map(({ group, object }): ExperienceObject => ({
      ...object,
      availability: object.availability ?? group.bounds,
      provenance: object.provenance ?? group.provenance,
    }));
  for (const object of addedGroups) known.add(object.id);
  // An orbit line that names the body it belongs to (`partOf`) is drawn and selectable but left out of the Object list; that body's top bar
  // offers it. An orbit with no home, and any trail, stays listed so nothing is left unreachable.
  const drawn = [
    ...(sun === undefined ? [] : [sun.object]),
    ...paths.map((path): ExperienceObject => (path.kind === "orbit" && path.object.partOf !== undefined ? { ...path.object, listed: false } : path.object)),
  ];
  const addedSunCentred = drawn.filter((object) => !known.has(object.id));
  return { ...definition.experience, objects: [...definition.experience.objects, ...addedGroups, ...addedSunCentred] };
}
