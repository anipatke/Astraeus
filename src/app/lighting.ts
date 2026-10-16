import type { BodyId } from "../core/body";
import { directionFromCenterToSun } from "../core/illumination";
import type { StateResolver } from "../core/stateResolver";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";

// How the Sun lights a scene: each lit body is lit only by its own Sun direction, one render pass per body. (A single shared Sun light
// was measured against this in T-049 and removed in T-068; the comparison switch `?lighting=` and `?sunLight=` went with it.)

/** Each body's own physical direction to the Sun, in render axes, before any readable compression. Works over any set of catalogued bodies except the Sun itself, which has no direction to itself. */
export function bodyLightDirections(bodies: readonly BodyId[], resolver: StateResolver, timeUtcMs: number): Map<BodyId, RenderVector> {
  const directions = new Map<BodyId, RenderVector>();
  for (const id of bodies) {
    directions.set(id, eqjToRenderVector(directionFromCenterToSun(resolver.sunFrom(id, timeUtcMs))));
  }
  return directions;
}
