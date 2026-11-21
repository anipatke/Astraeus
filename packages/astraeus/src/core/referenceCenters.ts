import type { AstronomyAdapter } from "./astronomyAdapter";
import { assertCenterId } from "./body";
import { earthOrientationFromEcefToEqj } from "./bodyOrientation";
import { createCenteredPosition, createState, EQJ, type CenteredPosition, type State } from "./state";

function sameEpochAndFrame(a: CenteredPosition, b: CenteredPosition): void {
  if (a.timeUtcMs !== b.timeUtcMs) throw new RangeError("center composition requires identical timestamps");
  if (a.plane !== b.plane) throw new RangeError("center composition requires identical frames");
}

/** Component-wise `a + sign * b`, or undefined when either velocity is missing (a leg without velocity breaks the chain). */
function combineVelocity(
  a: Float64Array | undefined,
  b: Float64Array | undefined,
  sign: 1 | -1,
): Float64Array | undefined {
  if (a === undefined || b === undefined) return undefined;
  return Float64Array.of(a[0] + sign * b[0], a[1] + sign * b[1], a[2] + sign * b[2]);
}

/** Position, and velocity when both inputs carry one, of the first body about the second input's centre. */
export function composeCenteredPositions(
  bodyFromOrigin: CenteredPosition,
  originFromCenter: CenteredPosition,
): CenteredPosition {
  sameEpochAndFrame(bodyFromOrigin, originFromCenter);
  if (bodyFromOrigin.center !== originFromCenter.body) {
    throw new RangeError("center composition requires the second body's identity to match the first center");
  }
  return createCenteredPosition({
    body: bodyFromOrigin.body,
    center: originFromCenter.center,
    timeUtcMs: bodyFromOrigin.timeUtcMs,
    plane: bodyFromOrigin.plane,
    positionKm: [
      bodyFromOrigin.positionKm[0] + originFromCenter.positionKm[0],
      bodyFromOrigin.positionKm[1] + originFromCenter.positionKm[1],
      bodyFromOrigin.positionKm[2] + originFromCenter.positionKm[2],
    ],
    ...velocityField(combineVelocity(bodyFromOrigin.velocityKmS, originFromCenter.velocityKmS, 1)),
  });
}

function velocityField(velocityKmS: Float64Array | undefined): { velocityKmS?: Float64Array } {
  return velocityKmS === undefined ? {} : { velocityKmS };
}

export function inverseCenteredPosition(position: CenteredPosition): CenteredPosition {
  assertCenterId(position.body);
  return createCenteredPosition({
    body: position.center,
    center: position.body,
    timeUtcMs: position.timeUtcMs,
    plane: position.plane,
    positionKm: [-position.positionKm[0], -position.positionKm[1], -position.positionKm[2]],
    ...velocityField(
      position.velocityKmS &&
        Float64Array.of(-position.velocityKmS[0], -position.velocityKmS[1], -position.velocityKmS[2]),
    ),
  });
}

export function earthStateAt(adapter: AstronomyAdapter, timeUtcMs: number): State {
  return createState({
    body: "earth",
    center: "sun",
    timeUtcMs,
    plane: EQJ,
    positionKm: adapter.earthPositionFromSunKm(timeUtcMs),
    orientation: earthOrientationFromEcefToEqj(adapter.earthFixedToEqjMatrix(timeUtcMs)),
  });
}

export function sunPositionFromEarthAt(adapter: AstronomyAdapter, timeUtcMs: number): CenteredPosition {
  return createCenteredPosition({
    body: "sun",
    center: "earth",
    timeUtcMs,
    plane: EQJ,
    positionKm: adapter.sunPositionFromEarthKm(timeUtcMs),
  });
}
