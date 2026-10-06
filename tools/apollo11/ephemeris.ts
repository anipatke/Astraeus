import type { AstronomyAdapter } from "../../src/core/astronomyAdapter";
import { NUMERICS } from "./conventions";
import { toVec3, type Vec3 } from "./vec";

export type CenterName = "earth" | "moon";

/** Position (km) and velocity (km/s) relative to a named centre, in EQJ. */
export interface CentreState {
  readonly center: CenterName;
  readonly r: Vec3;
  readonly v: Vec3;
}

/** Astraeus Moon state about Earth; velocity is a central difference of the adapter's position. */
export function moonFromEarth(adapter: AstronomyAdapter, timeUtcMs: number): { r: Vec3; v: Vec3 } {
  const half = NUMERICS.moonVelocityHalfStepMs;
  const later = toVec3(adapter.moonPositionKm(timeUtcMs + half));
  const earlier = toVec3(adapter.moonPositionKm(timeUtcMs - half));
  const seconds = (2 * half) / 1000;
  return {
    r: toVec3(adapter.moonPositionKm(timeUtcMs)),
    v: [(later[0] - earlier[0]) / seconds, (later[1] - earlier[1]) / seconds, (later[2] - earlier[2]) / seconds],
  };
}

/** Re-expresses a state about Earth, normalising Moon-centred states with the Moon at the same instant. */
export function toEarthCentred(adapter: AstronomyAdapter, state: CentreState, timeUtcMs: number): CentreState {
  if (state.center === "earth") return state;
  const moon = moonFromEarth(adapter, timeUtcMs);
  return {
    center: "earth",
    r: [state.r[0] + moon.r[0], state.r[1] + moon.r[1], state.r[2] + moon.r[2]],
    v: [state.v[0] + moon.v[0], state.v[1] + moon.v[1], state.v[2] + moon.v[2]],
  };
}

/** The inverse of toEarthCentred for a chosen centre. */
export function toCentre(adapter: AstronomyAdapter, earth: CentreState, center: CenterName, timeUtcMs: number): CentreState {
  if (center === "earth") return earth;
  const moon = moonFromEarth(adapter, timeUtcMs);
  return {
    center,
    r: [earth.r[0] - moon.r[0], earth.r[1] - moon.r[1], earth.r[2] - moon.r[2]],
    v: [earth.v[0] - moon.v[0], earth.v[1] - moon.v[1], earth.v[2] - moon.v[2]],
  };
}
