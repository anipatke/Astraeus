import type { ExperienceCameraPreset, ExperienceConfig, ExperienceObject } from "./experience";

export type CameraMode = "overview" | "focus" | "follow";

export function isObjectAvailable(object: ExperienceObject, timeUtcMs: number): boolean {
  const bounds = object.availability;
  return bounds === undefined || (timeUtcMs >= bounds.startUtcMs && timeUtcMs <= bounds.endUtcMs);
}

export function availableObjectById(
  experience: ExperienceConfig,
  id: string,
  timeUtcMs: number,
): ExperienceObject | undefined {
  const object = experience.objects.find((candidate) => candidate.id === id);
  return object !== undefined && isObjectAvailable(object, timeUtcMs) ? object : undefined;
}

export function firstAvailableObject(
  experience: ExperienceConfig,
  timeUtcMs: number,
): ExperienceObject | undefined {
  return experience.objects.find((object) => isObjectAvailable(object, timeUtcMs));
}

/**
 * The Focus button for an object: the experience's own focus preset when it has one, otherwise a plain focus on the object, so every
 * listed object can be focused from the top bar (owner, 2026-10-18: the big moons had no focus button).
 */
export function focusPresetFor(experience: ExperienceConfig, object: { readonly id: string; readonly label: string }): ExperienceCameraPreset {
  return findCameraPreset(experience, "focus", object.id) ?? { id: `focus-${object.id}`, label: `Focus ${object.label}`, request: { kind: "focus", target: object.id } };
}

export function findCameraPreset(
  experience: ExperienceConfig,
  mode: CameraMode,
  target?: string,
): ExperienceCameraPreset | undefined {
  return experience.cameraPresets.find((preset) => {
    const request = preset.request;
    if (request.kind === "overview") return mode === "overview";
    return request.kind === mode && request.target === target;
  });
}

/** The objects the Object list offers: the listed ones, and the selected one even when unlisted so the list never shows a blank. */
export function listedObjects(experience: ExperienceConfig, selectedId: string): readonly ExperienceObject[] {
  return experience.objects.filter((object) => object.listed !== false || object.id === selectedId);
}

/** Unlisted objects that belong to `id` (an orbit line to its body), for the related buttons in the top bar. */
export function relatedObjects(experience: ExperienceConfig, id: string): readonly ExperienceObject[] {
  return experience.objects.filter((object) => object.listed === false && object.partOf === id);
}
