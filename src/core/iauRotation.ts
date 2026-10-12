import { quaternionFromMatrix } from "./bodyOrientation";
import type { Quaternion } from "./state";

/**
 * Pole and prime-meridian constants from the IAU Working Group on Cartographic Coordinates and Rotational Elements.
 * Angles are degrees; pole angles change per Julian century (36525 days) and the prime meridian per day, both from J2000 TDB.
 */
export interface IauRotationElements {
  readonly poleRaDeg: readonly [constant: number, perCentury: number];
  readonly poleDecDeg: readonly [constant: number, perCentury: number];
  readonly primeMeridianDeg: readonly [constant: number, perDay: number];
  /** Where the numbers come from, kept with them so a definition cannot carry data without its source. */
  readonly citation: string;
}

const RADIANS = Math.PI / 180;
const DAYS_PER_CENTURY = 36_525;

export function assertIauRotationElements(elements: IauRotationElements): void {
  for (const pair of [elements.poleRaDeg, elements.poleDecDeg, elements.primeMeridianDeg]) {
    if (pair.length !== 2 || pair.some((value) => !Number.isFinite(value))) throw new TypeError("IAU rotation elements must be finite [constant, rate] pairs");
  }
  if (elements.citation.trim() === "") throw new TypeError("IAU rotation elements need a citation");
}

/** Pole direction (RA, Dec in radians) and prime-meridian angle W (radians, unwrapped) at `daysSinceJ2000` (TT, standing in for TDB). */
export function iauAnglesAt(elements: IauRotationElements, daysSinceJ2000: number): { raRad: number; decRad: number; wRad: number } {
  const centuries = daysSinceJ2000 / DAYS_PER_CENTURY;
  return {
    raRad: (elements.poleRaDeg[0] + elements.poleRaDeg[1] * centuries) * RADIANS,
    decRad: (elements.poleDecDeg[0] + elements.poleDecDeg[1] * centuries) * RADIANS,
    wRad: (elements.primeMeridianDeg[0] + elements.primeMeridianDeg[1] * daysSinceJ2000) * RADIANS,
  };
}

/**
 * Body-to-EQJ rotation, row-major: body +Z is the north pole, +X the prime meridian on the body equator and +Y
 * completes a right-handed basis (the IAU east direction for a prograde rotator). Equivalent to Rz(ra+90°)·Rx(90°−dec)·Rz(W).
 */
export function iauBodyToEqjMatrix(elements: IauRotationElements, daysSinceJ2000: number): Float64Array {
  assertIauRotationElements(elements);
  if (!Number.isFinite(daysSinceJ2000)) throw new RangeError("daysSinceJ2000 must be finite");
  const { raRad, decRad, wRad } = iauAnglesAt(elements, daysSinceJ2000);
  const pole = [Math.cos(decRad) * Math.cos(raRad), Math.cos(decRad) * Math.sin(raRad), Math.sin(decRad)];
  const node = [-Math.sin(raRad), Math.cos(raRad), 0];
  const poleCrossNode = [
    pole[1] * node[2] - pole[2] * node[1],
    pole[2] * node[0] - pole[0] * node[2],
    pole[0] * node[1] - pole[1] * node[0],
  ];
  const x = node.map((value, k) => value * Math.cos(wRad) + poleCrossNode[k] * Math.sin(wRad));
  const y = [
    pole[1] * x[2] - pole[2] * x[1],
    pole[2] * x[0] - pole[0] * x[2],
    pole[0] * x[1] - pole[1] * x[0],
  ];
  return Float64Array.of(x[0], y[0], pole[0], x[1], y[1], pole[1], x[2], y[2], pole[2]);
}

export function iauOrientation(elements: IauRotationElements, daysSinceJ2000: number): Quaternion {
  return quaternionFromMatrix(iauBodyToEqjMatrix(elements, daysSinceJ2000));
}
