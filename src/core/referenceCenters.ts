import type { AstronomyAdapter } from "./astronomyAdapter";
import { assertCenterId } from "./body";
import { earthOrientationFromEcefToEqj } from "./bodyOrientation";
import { createCenteredPosition, createState, EQJ, type CenteredPosition, type State } from "./state";

function sameEpochAndFrame(a: CenteredPosition, b: CenteredPosition): void {
  if (a.timeUtcMs !== b.timeUtcMs) throw new RangeError("center composition requires identical timestamps");
  if (a.frame !== b.frame) throw new RangeError("center composition requires identical frames");
}

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
    frame: bodyFromOrigin.frame,
    positionKm: [
      bodyFromOrigin.positionKm[0] + originFromCenter.positionKm[0],
      bodyFromOrigin.positionKm[1] + originFromCenter.positionKm[1],
      bodyFromOrigin.positionKm[2] + originFromCenter.positionKm[2],
    ],
  });
}

export function inverseCenteredPosition(position: CenteredPosition): CenteredPosition {
  assertCenterId(position.body);
  return createCenteredPosition({
    body: position.center,
    center: position.body,
    timeUtcMs: position.timeUtcMs,
    frame: position.frame,
    positionKm: [-position.positionKm[0], -position.positionKm[1], -position.positionKm[2]],
  });
}

export function earthStateAt(adapter: AstronomyAdapter, timeUtcMs: number): State {
  return createState({
    body: "earth",
    center: "sun",
    timeUtcMs,
    frame: EQJ,
    positionKm: adapter.earthPositionFromSunKm(timeUtcMs),
    orientation: earthOrientationFromEcefToEqj(adapter.earthFixedToEqjMatrix(timeUtcMs)),
  });
}

export function sunPositionFromEarthAt(adapter: AstronomyAdapter, timeUtcMs: number): CenteredPosition {
  return createCenteredPosition({
    body: "sun",
    center: "earth",
    timeUtcMs,
    frame: EQJ,
    positionKm: adapter.sunPositionFromEarthKm(timeUtcMs),
  });
}
