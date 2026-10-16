import type { BodyId } from "../core/body";
import { directionFromCenterToSun } from "../core/illumination";
import type { ScalePolicy } from "../core/scalePolicy";
import type { StateResolver } from "../core/stateResolver";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import { bodyAbsolute } from "./sceneLayout";

/**
 * How the Sun lights a scene.
 *  - `per-body`: each lit body is lit only by its own Sun direction, one render pass per body (the default).
 *  - `single-sun`: one light at the Sun's scaled position lights every body in one pass. A measurement mode, chosen with
 *    `?lighting=single-sun`; it exists so the two can be compared (T-049), not as a user setting.
 */
export type LightingModel = "per-body" | "single-sun";

export const DEFAULT_LIGHTING: LightingModel = "per-body";

/** The model a URL query asks for; anything other than `single-sun` is the default. */
export function lightingFromSearch(search: string): LightingModel {
  return new URLSearchParams(search).get("lighting") === "single-sun" ? "single-sun" : DEFAULT_LIGHTING;
}

/** The strength of the single Sun light. */
export interface SunLightStrength {
  readonly ambient: number;
  readonly directional: number;
}

/**
 * A measurement override for the single Sun light's strength, `?sunLight=<directional>,<ambient>`; null when absent or malformed, in which
 * case the single light takes the strongest of the lit bodies' own values. It exists to separate the effect of one shared intensity from
 * the effect of the light's position when the two models are compared (T-049).
 */
export function sunLightFromSearch(search: string): SunLightStrength | null {
  const raw = new URLSearchParams(search).get("sunLight");
  if (raw === null) return null;
  const [directional, ambient] = raw.split(",").map(Number);
  return Number.isFinite(directional) && Number.isFinite(ambient) && directional >= 0 && ambient >= 0 ? { directional, ambient } : null;
}

/** Each body's own physical direction to the Sun, in render axes, before any readable compression. Works over any set of catalogued bodies except the Sun itself, which has no direction to itself. */
export function bodyLightDirections(bodies: readonly BodyId[], resolver: StateResolver, timeUtcMs: number): Map<BodyId, RenderVector> {
  const directions = new Map<BodyId, RenderVector>();
  for (const id of bodies) {
    directions.set(id, eqjToRenderVector(directionFromCenterToSun(resolver.sunFrom(id, timeUtcMs))));
  }
  return directions;
}

/** The Sun's scaled position from the scene centre, in render axes (Float64, before the floating-origin subtraction). */
export function sunScaledPosition(resolver: StateResolver, sceneCenter: BodyId, policy: ScalePolicy, timeUtcMs: number): RenderVector {
  return bodyAbsolute(resolver.sunFrom(sceneCenter, timeUtcMs).positionKm, policy);
}

function unitFrom(from: ArrayLike<number>, to: ArrayLike<number>): RenderVector {
  const x = to[0] - from[0];
  const y = to[1] - from[1];
  const z = to[2] - from[2];
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}

/**
 * The direction a body is lit from under a single point light at the Sun's scaled position: from the body's scaled position to
 * that point. Every position went through the same policy, so for a policy that scales distances uniformly (True, Readable and
 * Solar system) this is the per-body direction up to rounding.
 */
export function singleSunDirection(bodyScaled: ArrayLike<number>, sunScaled: ArrayLike<number>): RenderVector {
  return unitFrom(bodyScaled, sunScaled);
}

/**
 * The direction every body is lit from under one directional light that sits at the Sun's scaled position and points at the
 * scene centre: the centre's direction, the same for all.
 */
export function centreDirectionalDirection(centreScaled: ArrayLike<number>, sunScaled: ArrayLike<number>): RenderVector {
  return unitFrom(centreScaled, sunScaled);
}
