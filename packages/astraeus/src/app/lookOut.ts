// Look-out camera: standing at a body's centre and turning to look around the sky. Camera-only state; nothing in State is read or written.
import type { RenderVector } from "./renderCoordinates";

/** What a camera that stands inside a body carries beyond the orbit angles: the field of view is its zoom. The look direction is the orbit state's azimuth and elevation about the up in force. */
export interface LookOutState {
  /** Vertical field of view in degrees, within `LOOK_OUT_FOV_RANGE_DEG`. */
  fovDeg: number;
}

export const LOOK_OUT_FOV_RANGE_DEG = { min: 5, max: 100 } as const;
export const LOOK_OUT_OPENING_FOV_DEG = 60;
/** The nearest the look-out camera draws: positive, and far inside anything a sky shows. */
export const LOOK_OUT_NEAR = 1e-3;
const MAX_LOOK_ELEVATION = (89 * Math.PI) / 180;
/** Azimuth turns faster near the zenith; the pan divides by cos(elevation) down to this floor so a drag stays under the finger without running away at the pole. */
const MIN_PAN_COS = 0.1;

export function clampFov(fovDeg: number): number {
  return Math.min(LOOK_OUT_FOV_RANGE_DEG.max, Math.max(LOOK_OUT_FOV_RANGE_DEG.min, fovDeg));
}

export function clampLookElevation(elevation: number): number {
  return Math.max(-MAX_LOOK_ELEVATION, Math.min(MAX_LOOK_ELEVATION, elevation));
}

/** The angles a look-out pan changes. */
export interface LookAngles {
  azimuth: number;
  elevation: number;
}

/**
 * Direct manipulation: a drag of `dxPx`, `dyPx` moves the sky with the pointer, so the view turns the other way. One viewport height spans the field of view,
 * which makes a narrow view pan slowly. Azimuth grows leftwards about the up in force, elevation upwards.
 */
export function panLookOut(angles: LookAngles, fovDeg: number, dxPx: number, dyPx: number, heightPx: number): void {
  const perPx = ((fovDeg * Math.PI) / 180) / heightPx;
  angles.azimuth += (dxPx * perPx) / Math.max(MIN_PAN_COS, Math.cos(angles.elevation));
  angles.elevation = clampLookElevation(angles.elevation + dyPx * perPx);
}

/** A wheel or pinch factor above 1 widens the view, below 1 narrows it. */
export function zoomLookOut(look: LookOutState, factor: number): void {
  look.fovDeg = clampFov(look.fovDeg * factor);
}

/** The unit direction at `azimuth` and `elevation` about `up`, given the orbit basis: the one rule the orbit offset and the look direction share. */
export function directionAt(azimuth: number, elevation: number, east: RenderVector, south: RenderVector, up: RenderVector): RenderVector {
  const cosEl = Math.cos(elevation);
  const [sa, ca, se] = [Math.sin(azimuth), Math.cos(azimuth), Math.sin(elevation)];
  return [0, 1, 2].map((k) => cosEl * (sa * east[k] + ca * south[k]) + se * up[k]) as RenderVector;
}
