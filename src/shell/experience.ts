import type { TimelineEvent } from "../core/events";
import type { TimeBounds } from "../core/trajectory";

export interface ExperienceObject {
  readonly id: string;
  readonly label: string;
  readonly color?: string;
  /** Omit for objects that are always available. */
  readonly availability?: TimeBounds;
  /** Higher values win when projected labels would overlap. */
  readonly labelPriority?: number;
  /** Hide this label when its object is farther from the camera than this render distance. */
  readonly labelMaxDistance?: number;
}

export type ExperienceCameraRequest =
  | { readonly kind: "overview" }
  | { readonly kind: "focus" | "follow"; readonly target: string };

export interface ExperienceCameraPreset {
  readonly id: string;
  readonly label: string;
  readonly request: ExperienceCameraRequest;
}

/** The labels and timeline data a reusable viewer shell needs from an experience. */
export interface ExperienceConfig {
  readonly objects: readonly ExperienceObject[];
  readonly cameraPresets: readonly ExperienceCameraPreset[];
  readonly events: readonly TimelineEvent[];
  readonly window: TimeBounds;
  readonly rates: readonly number[];
}
