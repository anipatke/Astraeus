import type { ReactNode } from "react";
import type { AstronomyAdapter } from "../core/astronomyAdapter";
import type { SimulationClock } from "../core/clock";
import type { MoonTrajectory } from "../core/moonTrajectory";
import type { PointGroup } from "../core/pointGroup";
import type { TimeBounds, Trajectory } from "../core/trajectory";
import type { BodyId, CenterId } from "../core/body";
import { catalogue } from "../assets/catalogue";
import { earthMoonSystem, type SystemComposition } from "../assets/compositions";
import type { Metric } from "../shell/metrics";
import type { ExperienceConfig, ExperienceObject } from "../shell/experience";
import type { TrackedBody } from "./mission";

/** Generic scene parts an experience opts into. Nothing here names a mission. */
export type SceneLayerId = "earth-moon" | "tracked-bodies" | "points" | "sun-centred";

/** What the generic app owns and hands to the experience's factories. */
export interface ExperienceRuntime {
  readonly clock: SimulationClock;
  readonly adapter: AstronomyAdapter;
  /** Earth-centred Moon trajectory for the `earth-moon` layer. */
  readonly moon: MoonTrajectory;
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
}

/**
 * The Sun as a drawn body: a marker at the Sun's composed position. Its size is a presentation choice in screen
 * pixels, not a physical radius, and the info panel says so. Focusing it frames every declared path.
 */
export interface SunBody {
  /** The Sun's one shell item. Its id is also the camera focus id. */
  readonly object: ExperienceObject;
  readonly color: string;
  /** Marker size in screen pixels; defaults to 9. */
  readonly markerSizePx?: number;
}

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
  /** Number of samples along the span; defaults to 256 (181 for a rolling span, which must be odd so the clock time is a vertex). */
  readonly samples?: number;
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
  readonly experience: ExperienceConfig;
  readonly clock: { readonly startUtcMs: number; readonly rate: number };
  /** Layers the scene mounts, e.g. the tracked-body list. The `earth-moon` layer is an alias for `composition: earthMoonSystem`. */
  readonly sceneLayers: readonly SceneLayerId[];
  /** The catalogued bodies the scene draws, one view each. Absent: none (unless the `earth-moon` alias is listed). */
  readonly composition?: SystemComposition;
  /** The catalogued body at the scene's zero. Presentation only; defaults to the composition's own centre, else Earth. */
  readonly sceneCenter?: BodyId;
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

/** The composition the scene mounts: the declared one, else Earth and the Moon for the `earth-moon` alias, else none. */
export function compositionOf(definition: ExperienceDefinition): SystemComposition | undefined {
  if (definition.composition !== undefined) return definition.composition;
  return definition.sceneLayers.includes("earth-moon") ? earthMoonSystem : undefined;
}

/**
 * The catalogued body at the scene's zero. A scene with no composition keeps Earth as its zero, the origin that
 * tracked bodies and groups are measured from. Throws for a centre the catalogue lacks or the composition omits.
 */
export function sceneCenterOf(definition: ExperienceDefinition): BodyId {
  const composition = compositionOf(definition);
  const centre = definition.sceneCenter ?? composition?.defaultCenter ?? "earth";
  if (!catalogue.has(centre)) throw new RangeError(`sceneCenter "${centre}" is not in the catalogue`);
  if (composition !== undefined && !composition.bodies.includes(centre)) {
    throw new RangeError(`sceneCenter "${centre}" is not one of composition "${composition.id}" bodies (${composition.bodies.join(", ")})`);
  }
  return centre;
}

/** The bodies the scene draws, in draw order: the composition's, plus the Sun when a Sun is declared and not already listed. */
export function mountedBodiesOf(definition: ExperienceDefinition): readonly BodyId[] {
  const bodies = [...(compositionOf(definition)?.bodies ?? [])];
  if (sunCentredOf(definition).sun !== undefined && !bodies.includes("sun")) bodies.push("sun");
  return bodies;
}

/** Whether the scene mounts both the Earth and the Moon. */
export function usesEarthMoon(definition: ExperienceDefinition): boolean {
  const bodies = compositionOf(definition)?.bodies ?? [];
  return bodies.includes("earth") && bodies.includes("moon");
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
/** Default sample count of a rolling span (the Moon's monthly loop). */
export const DEFAULT_WINDOW_SAMPLE_COUNT = 181;

export const isRollingSpan = (span: PathSpec["span"]): span is RollingSpan => "windowMs" in span;

/**
 * Checks one path declaration, naming `id` and the offending field: an unknown rule or frame, an uncatalogued centre, a source that
 * cannot answer a state, an empty or reversed span (or a bad window), or a bad sample count.
 */
export function validatePathSpec(id: string, path: PathSpec): void {
  const rule = path as { kind?: unknown; frame?: unknown; center?: unknown };
  if (rule.kind !== "orbit" && rule.kind !== "trail") throw new TypeError(`path "${id}" kind must be "orbit" or "trail", got ${String(rule.kind)}`);
  if (rule.kind === "trail" && rule.frame !== "relative" && rule.frame !== "inertial") {
    throw new TypeError(`path "${id}" frame must be "relative" or "inertial", got ${String(rule.frame)}`);
  }
  if (rule.kind === "orbit" && rule.center !== undefined && !(typeof rule.center === "string" && catalogue.has(rule.center))) {
    throw new RangeError(`path "${id}" center "${String(rule.center)}" is not a catalogued body`);
  }
  if (typeof path.source?.stateAt !== "function") throw new TypeError(`path "${id}" source must be a Trajectory with stateAt`);
  const center = path.kind === "orbit" ? path.center : undefined;
  let first: number;
  if (path.span !== undefined && isRollingSpan(path.span)) {
    const { windowMs } = path.span;
    if (!(windowMs > 0) || !Number.isFinite(windowMs)) throw new RangeError(`path "${id}" span windowMs must be positive and finite`);
    const samples = path.samples ?? DEFAULT_WINDOW_SAMPLE_COUNT;
    if (!Number.isInteger(samples) || samples < 3 || samples % 2 === 0) throw new RangeError(`path "${id}" samples must be an odd whole number of at least 3 for a rolling span, got ${samples}`);
    first = Number.NaN;
  } else {
    const { startUtcMs, endUtcMs } = path.span ?? {};
    if (!Number.isFinite(startUtcMs) || !Number.isFinite(endUtcMs)) throw new RangeError(`path "${id}" span needs finite start and end times`);
    if (!(endUtcMs > startUtcMs)) throw new RangeError(`path "${id}" span must end after it starts`);
    const samples = path.samples ?? DEFAULT_PATH_SAMPLE_COUNT;
    if (!Number.isInteger(samples) || samples < 2) throw new RangeError(`path "${id}" samples must be a whole number of at least 2, got ${samples}`);
    first = startUtcMs;
  }
  if (Number.isNaN(first)) return; // a rolling span has no fixed start to probe; its source is asked at the clock time
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
export function validateSunCentred(sun: SunBody | undefined, paths: readonly PathLayer[]): { readonly sun: SunBody | undefined; readonly paths: readonly PathLayer[] } {
  const seen = new Set<string>();
  const claim = (id: unknown, what: string): string => {
    if (typeof id !== "string" || id.length === 0) throw new TypeError(`${what} id must be non-empty`);
    if (seen.has(id)) throw new RangeError(`duplicate id "${id}" among the Sun and paths`);
    seen.add(id);
    return id;
  };
  if (sun !== undefined) {
    const id = claim(sun.object?.id, "sun");
    if (sun.object.provenance === undefined) throw new TypeError(`sun "${id}" needs provenance on its object`);
    if (sun.markerSizePx !== undefined && !(sun.markerSizePx > 0)) throw new RangeError(`sun "${id}" markerSizePx must be positive`);
  }
  for (const path of paths) {
    const id = claim(path.object?.id, "path");
    if (path.object.provenance === undefined) throw new TypeError(`path "${id}" needs provenance on its object`);
    validatePathSpec(id, path);
  }
  return { sun, paths };
}

/** The Sun and paths the scene should draw: none unless the layer is listed; validated. */
export function sunCentredOf(definition: ExperienceDefinition): { readonly sun: SunBody | undefined; readonly paths: readonly PathLayer[] } {
  if (!definition.sceneLayers.includes("sun-centred")) return { sun: undefined, paths: [] };
  return validateSunCentred(definition.sun, definition.paths ?? []);
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
  const drawn = [...(sun === undefined ? [] : [sun.object]), ...paths.map((path) => path.object)];
  const addedSunCentred = drawn.filter((object) => !known.has(object.id));
  return { ...definition.experience, objects: [...definition.experience.objects, ...addedGroups, ...addedSunCentred] };
}
