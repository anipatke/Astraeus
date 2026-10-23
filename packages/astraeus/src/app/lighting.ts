import type { BodyId } from "../core/body";
import { directionFromCenterToSun } from "../core/illumination";
import type { StateResolver } from "../core/stateResolver";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";

// How the Sun lights a scene: each lit body is lit only by its own Sun direction, one render pass per body. (A single shared Sun light
// was measured against this in T-049 and removed in T-068; the comparison switch `?lighting=` and `?sunLight=` went with it.)

/** The settings switch starts off: bodies are lit by true sunlight. */
export const DEFAULT_ILLUMINATE_ALL = false;

/** Where one body's light comes from: along `toSun` (true sunlight) or, when `illuminateAll` is on, from the camera's side of the body so the face toward the viewer is lit with its shading kept. All positions are in the same local render axes; a camera on the body itself keeps sunlight. */
export function chooseLightDirection(toSun: RenderVector, bodyLocal: RenderVector, cameraLocal: RenderVector, illuminateAll: boolean): RenderVector {
  if (!illuminateAll) return toSun;
  const dx = cameraLocal[0] - bodyLocal[0];
  const dy = cameraLocal[1] - bodyLocal[1];
  const dz = cameraLocal[2] - bodyLocal[2];
  const length = Math.hypot(dx, dy, dz);
  return length > 0 && Number.isFinite(length) ? [dx / length, dy / length, dz / length] : toSun;
}

/** Each body's own physical direction to the Sun, in render axes, before any readable compression. Works over any set of catalogued bodies except the Sun itself, which has no direction to itself. */
export function bodyLightDirections(bodies: readonly BodyId[], resolver: StateResolver, timeUtcMs: number): Map<BodyId, RenderVector> {
  const directions = new Map<BodyId, RenderVector>();
  for (const id of bodies) {
    directions.set(id, eqjToRenderVector(directionFromCenterToSun(resolver.sunFrom(id, timeUtcMs))));
  }
  return directions;
}
