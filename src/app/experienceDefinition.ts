import type { ReactNode } from "react";
import type { AstronomyAdapter } from "../core/astronomyAdapter";
import type { SimulationClock } from "../core/clock";
import type { MoonTrajectory } from "../core/moonTrajectory";
import type { PointGroup } from "../core/pointGroup";
import type { TimeBounds, Trajectory } from "../core/trajectory";
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

/**
 * The path of a Sun-centred object: the positions of a state source sampled over a span, drawn as a line.
 * Any source that answers `stateAt(time, "sun")` works (published elements, Earth's own geometry, a recorded
 * trajectory); the path adds no orbit maths of its own. The line is Sun-fixed, so it is placed at the Sun's
 * position at the clock time, not each sample's own time.
 */
export interface PathLayer {
  /** The path's one shell item. Its id is also the camera focus id; it needs provenance. */
  readonly object: ExperienceObject;
  readonly color: string;
  readonly source: Trajectory;
  readonly span: TimeBounds;
  /** Number of samples along the span; defaults to 256. */
  readonly samples?: number;
}

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
  /** Layers the scene mounts, e.g. the Earth/Moon bodies and the tracked-body list. */
  readonly sceneLayers: readonly SceneLayerId[];
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

/** Whether the scene mounts the Earth and Moon bodies. */
export function usesEarthMoon(definition: ExperienceDefinition): boolean {
  return definition.sceneLayers.includes("earth-moon");
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

/**
 * Checks the Sun and path declarations and returns them, naming the offending item and field: empty or repeated id,
 * missing provenance, a source that cannot answer a Sun-centred state, an empty or reversed span, or a bad sample count.
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
    if (typeof path.source?.stateAt !== "function") throw new TypeError(`path "${id}" source must be a Trajectory with stateAt`);
    const { startUtcMs, endUtcMs } = path.span ?? {};
    if (!Number.isFinite(startUtcMs) || !Number.isFinite(endUtcMs)) throw new RangeError(`path "${id}" span needs finite start and end times`);
    if (!(endUtcMs > startUtcMs)) throw new RangeError(`path "${id}" span must end after it starts`);
    const samples = path.samples ?? DEFAULT_PATH_SAMPLE_COUNT;
    if (!Number.isInteger(samples) || samples < 2) throw new RangeError(`path "${id}" samples must be a whole number of at least 2, got ${samples}`);
    try {
      path.source.stateAt(startUtcMs, "sun");
    } catch (error) {
      throw new TypeError(`path "${id}" source cannot give a Sun-centred state at the span start: ${error instanceof Error ? error.message : String(error)}`);
    }
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
