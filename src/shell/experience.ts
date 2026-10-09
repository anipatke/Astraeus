import type { TimelineEvent } from "../core/events";
import type { Provenance } from "../core/provenance";
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
  /** One or two plain sentences for the info panel. */
  readonly description?: string;
  /** Where this object's data comes from. Anything reconstructed or illustrative must carry one. */
  readonly provenance?: Provenance;
  /** Published limitations, shown with the provenance. Figures come from the experience's own data. */
  readonly knownLimitations?: readonly string[];
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
  /** Where the event times come from, shown with every event. */
  readonly eventProvenance?: Provenance;
}
