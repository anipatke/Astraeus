import type { AstronomyAdapter } from "../../src/core/astronomyAdapter";
import type { NormalisedAnchor } from "./anchors";
import { integrateDrivenSpan, tableAt, type EarthState, type StateTable } from "./dynamics";
import { add, norm, scale, sub, type Vec3 } from "./vec";

const VELOCITY_TOLERANCE_KM_S = 1e-9;
const MAX_ACCELERATION_CORRECTIONS = 20;

export interface PhysicalBurn {
  readonly table: StateTable;
  readonly constantAccelerationKmS2: Vec3;
  readonly endState: EarthState;
  readonly cutoffPositionResidualKm: number;
  readonly cutoffVelocityResidualMs: number;
}

/** Fit one constant inertial acceleration so the gravity-integrated burn reaches the cutoff velocity. */
export function solvePhysicalBurn(
  adapter: AstronomyAdapter,
  from: NormalisedAnchor,
  to: NormalisedAnchor,
  stepS: number,
): PhysicalBurn {
  if (from.refBody !== to.refBody) throw new RangeError(`burn ${from.id}>${to.id} spans two reference bodies`);
  const durationS = (to.timeUtcMs - from.timeUtcMs) / 1000;
  if (!(durationS > 0)) throw new RangeError(`burn ${from.id}>${to.id} must have a positive duration`);

  let thrust: Vec3 = [0, 0, 0];
  let table: StateTable | undefined;
  let endState: EarthState | undefined;
  let velocityResidual: Vec3 | undefined;
  for (let iteration = 0; iteration < MAX_ACCELERATION_CORRECTIONS; iteration += 1) {
    table = integrateDrivenSpan(adapter, from.earthCentred, from.timeUtcMs, to.timeUtcMs, stepS, thrust);
    endState = tableAt(table, to.timeUtcMs);
    velocityResidual = sub(to.earthCentred.v, endState.v);
    if (norm(velocityResidual) <= VELOCITY_TOLERANCE_KM_S) break;
    thrust = add(thrust, scale(velocityResidual, 1 / durationS));
  }

  if (table === undefined || endState === undefined || velocityResidual === undefined || norm(velocityResidual) > VELOCITY_TOLERANCE_KM_S) {
    const residual = velocityResidual === undefined ? Infinity : norm(velocityResidual);
    throw new RangeError(`burn ${from.id}>${to.id} did not converge to cutoff velocity (residual ${residual} km/s)`);
  }

  return {
    table,
    constantAccelerationKmS2: thrust,
    endState,
    cutoffPositionResidualKm: norm(sub(endState.r, to.earthCentred.r)),
    cutoffVelocityResidualMs: norm(velocityResidual) * 1000,
  };
}
