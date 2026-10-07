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
