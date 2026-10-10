import type { ReactNode } from "react";
import type { AstronomyAdapter } from "../core/astronomyAdapter";
import type { SimulationClock } from "../core/clock";
import type { MoonTrajectory } from "../core/moonTrajectory";
import type { PointGroup } from "../core/pointGroup";
import type { Metric } from "../shell/metrics";
import type { ExperienceConfig, ExperienceObject } from "../shell/experience";
import type { TrackedBody } from "./mission";

/** Generic scene parts an experience opts into. Nothing here names a mission. */
export type SceneLayerId = "earth-moon" | "tracked-bodies" | "points";

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
  readonly createMetrics: (runtime: ExperienceRuntime) => (objectId: string, timeUtcMs: number) => readonly Metric[];
  readonly developerSections?: readonly DeveloperSection[];
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

/** The experience config the shell receives: its own objects plus one item per drawn group, never listed twice. */
export function experienceWithGroups(definition: ExperienceDefinition): ExperienceConfig {
  const groups = groupsOf(definition);
  if (groups.length === 0) return definition.experience;
  const known = new Set(definition.experience.objects.map((object) => object.id));
  const added = groups
    .filter((layer) => !known.has(layer.object.id))
    .map(({ group, object }): ExperienceObject => ({
      ...object,
      availability: object.availability ?? group.bounds,
      provenance: object.provenance ?? group.provenance,
    }));
  return { ...definition.experience, objects: [...definition.experience.objects, ...added] };
}
