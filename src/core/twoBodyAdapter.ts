import { GM, elementsToState, propagateKepler } from "@lizard-isana/orb/kepler";
import { transformationMatrix } from "@lizard-isana/orb/frames";
import { AstroInstant } from "@lizard-isana/orb/time";
import type { CenterId } from "./body";

/** Classical orbital elements, angles in radians, in whichever plane the caller names. */
export interface ClassicalElements {
  readonly semiMajorAxisKm: number;
  readonly eccentricity: number;
  readonly inclinationRad: number;
  readonly raanRad: number;
  readonly argumentOfPeriapsisRad: number;
  readonly trueAnomalyRad: number;
}

/** Unperturbed two-body motion about a natural centre; positions are km, velocities km/s. */
export interface TwoBodyAdapter {
  /** Rotation (row-major 3×3) taking ecliptic-J2000 vectors to EQJ. */
  eclipticJ2000ToEqjMatrix(): Float64Array;
  /** Cartesian state for elements, in the same plane the elements are expressed in. */
  elementsToState(elements: ClassicalElements, center: CenterId): { position: Float64Array; velocity: Float64Array };
  /**
   * Writes member `member`'s position `dtSeconds` after its initial state into `out[3 × member ..]`.
   * `initialStates` holds six values per member: position then velocity.
   */
  propagateMemberInto(
    initialStates: Float64Array,
    member: number,
    dtSeconds: number,
    center: CenterId,
    out: Float64Array,
  ): void;
}

// The library keeps a table of centre gravitational parameters; reading from it keeps one source of truth.
export function createOrbTwoBodyAdapter(): TwoBodyAdapter {
  const eclipticToEqj = Float64Array.from(
    transformationMatrix("ecliptic-j2000", "equatorial-j2000", AstroInstant.fromUnixMs(0)),
  );
  const adapter: TwoBodyAdapter = {
    eclipticJ2000ToEqjMatrix(): Float64Array {
      return Float64Array.from(eclipticToEqj);
    },

    elementsToState(elements: ClassicalElements, center: CenterId) {
      const state = elementsToState({
        semiMajorAxis: elements.semiMajorAxisKm,
        eccentricity: elements.eccentricity,
        inclination: elements.inclinationRad,
        raan: elements.raanRad,
        argumentOfPeriapsis: elements.argumentOfPeriapsisRad,
        trueAnomaly: elements.trueAnomalyRad,
      }, GM[center]);
      return { position: Float64Array.from(state.r), velocity: Float64Array.from(state.v) };
    },

    propagateMemberInto(initialStates, member, dtSeconds, center, out) {
      const o = 6 * member;
      const next = propagateKepler(
        [initialStates[o], initialStates[o + 1], initialStates[o + 2]],
        [initialStates[o + 3], initialStates[o + 4], initialStates[o + 5]],
        dtSeconds,
        GM[center],
      );
      out[3 * member] = next.r[0];
      out[3 * member + 1] = next.r[1];
      out[3 * member + 2] = next.r[2];
    },
  };
  return Object.freeze(adapter);
}
