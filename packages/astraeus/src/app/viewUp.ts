import { createOrbTwoBodyAdapter } from "../core/twoBodyAdapter";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";

/** Which direction the camera treats as up: celestial north (the default, as before) or the ecliptic's north pole. */
export type ViewUp = "equatorial" | "ecliptic";

export const EQUATORIAL_UP: RenderVector = [0, 1, 0];

/**
 * The render-frame up vector. "ecliptic" is ecliptic north, the third column of the engine's ecliptic-to-EQJ matrix ((0, -sin e, cos e) in EQJ,
 * so e is the engine's own obliquity), through the fixed render-axis conversion. It only turns the camera's orbit axis: no State is rotated.
 */
export function viewUpVector(up: ViewUp | undefined): RenderVector {
  if (up !== "ecliptic") return EQUATORIAL_UP;
  const m = createOrbTwoBodyAdapter().eclipticJ2000ToEqjMatrix();
  return eqjToRenderVector([m[2], m[5], m[8]]);
}

/** The azimuth and elevation that put the camera at `offset` (from its target) when the orbit is about `up`: what keeps a camera in place when the up direction changes. */
export function orbitAnglesFor(offset: RenderVector, up: RenderVector): { readonly azimuth: number; readonly elevation: number } | null {
  const d = Math.hypot(offset[0], offset[1], offset[2]);
  if (!(d > 0)) return null;
  const { east, south } = orbitBasis(up);
  const along = (axis: RenderVector): number => offset[0] * axis[0] + offset[1] * axis[1] + offset[2] * axis[2];
  return { elevation: Math.asin(Math.max(-1, Math.min(1, along(up) / d))), azimuth: Math.atan2(along(east), along(south)) };
}

/** `?up=ecliptic` or `?up=equatorial` overrides the experience's own setting. */
export function viewUpFromSearch(search: string, fallback: ViewUp): ViewUp {
  const value = new URLSearchParams(search).get("up");
  return value === "ecliptic" || value === "equatorial" ? value : fallback;
}

/**
 * The orbit basis about `up`: `east` is render +X (so the default basis is the old one exactly) and `south` = east x up, the direction azimuth 0
 * looks from. The camera offset is d(cos el (sin az east + cos az south) + sin el up).
 */
export function orbitBasis(up: RenderVector): { readonly east: RenderVector; readonly south: RenderVector } {
  const east: RenderVector = [1, 0, 0];
  const south: RenderVector = [east[1] * up[2] - east[2] * up[1], east[2] * up[0] - east[0] * up[2], east[0] * up[1] - east[1] * up[0]];
  return { east, south };
}
