import type { AstronomyAdapter } from "./astronomyAdapter";
import type { BodyId, CenterId } from "./body";
import type { ElementPlane, OrbitElements } from "./orbitGroup";
import { assertWithinBounds, GroupElementsError } from "./pointGroup";
import { earthStateAt } from "./referenceCenters";
import { assertUtcUnixMs, createState, EQJ, type State } from "./state";
import type { TimeBounds, Trajectory } from "./trajectory";
import type { TwoBodyAdapter } from "./twoBodyAdapter";

const RADIANS = Math.PI / 180;

function assertSunCentre(center: CenterId): void {
  if (center !== "sun") throw new RangeError(`this Trajectory is Sun-centred; centre "${center}" is not offered`);
}

export interface TwoBodyTrajectoryInput {
  readonly body: BodyId;
  /** Plane the elements are expressed in; positions are always output in EQJ. */
  readonly plane: ElementPlane;
  /** Instant at which the elements hold. */
  readonly epochUtcMs: number;
  readonly elements: OrbitElements;
  readonly bounds?: TimeBounds;
}

/**
 * A Sun-centred Trajectory from classical elements under unperturbed two-body motion. It is a state
 * source like any other: a path, a label or a group centre can be drawn from it without orbit maths of their own.
 */
export function createTwoBodyTrajectory(input: TwoBodyTrajectoryInput, adapter: TwoBodyAdapter): Trajectory {
  assertUtcUnixMs(input.epochUtcMs);
  const { elements } = input;
  for (const [key, value] of Object.entries(elements)) {
    if (!Number.isFinite(value)) throw new GroupElementsError(`${input.body}: ${key} must be finite`);
  }
  if (!(elements.semiMajorAxisKm > 0)) throw new GroupElementsError(`${input.body}: semiMajorAxisKm must be positive`);
  if (!(elements.eccentricity >= 0 && elements.eccentricity < 1)) {
    throw new GroupElementsError(`${input.body}: eccentricity must be at least 0 and below 1 (a bound orbit)`);
  }
  const initial = adapter.elementsToState({
    semiMajorAxisKm: elements.semiMajorAxisKm,
    eccentricity: elements.eccentricity,
    inclinationRad: elements.inclinationDeg * RADIANS,
    raanRad: elements.raanDeg * RADIANS,
    argumentOfPeriapsisRad: elements.argumentOfPeriapsisDeg * RADIANS,
    trueAnomalyRad: elements.trueAnomalyDeg * RADIANS,
  }, "sun");
  const rotation = input.plane === "ecliptic-j2000" ? adapter.eclipticJ2000ToEqjMatrix() : null;
  const states = new Float64Array(6);
  for (const [offset, vector] of [[0, initial.position], [3, initial.velocity]] as const) {
    for (let row = 0; row < 3; row += 1) {
      states[offset + row] = rotation === null
        ? vector[row]
        : rotation[3 * row] * vector[0] + rotation[3 * row + 1] * vector[1] + rotation[3 * row + 2] * vector[2];
    }
  }
  const { body, epochUtcMs, bounds } = input;
  return Object.freeze({
    body,
    ...(bounds === undefined ? {} : { bounds }),
    stateAt(timeUtcMs: number, center: CenterId = "sun"): State {
      assertSunCentre(center);
      assertUtcUnixMs(timeUtcMs);
      assertWithinBounds(bounds, timeUtcMs);
      const position = new Float64Array(3);
      adapter.propagateMemberInto(states, 0, (timeUtcMs - epochUtcMs) / 1000, "sun", position);
      return createState({ body, center: "sun", timeUtcMs, frame: EQJ, positionKm: position, orientation: null });
    },
  });
}

/** Earth's own Sun-centred state from the astronomy adapter's Earth–Sun geometry, as a Trajectory. */
export function createEarthSunTrajectory(adapter: AstronomyAdapter): Trajectory {
  return Object.freeze({
    body: "earth",
    stateAt(timeUtcMs: number, center: CenterId = "sun"): State {
      assertSunCentre(center);
      return earthStateAt(adapter, timeUtcMs);
    },
  });
}

/**
 * Positions (km, EQJ, about `center`) of a state source at `count` evenly spaced times (rounded to whole milliseconds) from the span's start to
 * its end inclusive: 3 × count values. This is all a path is; no orbit maths lives here.
 */
export function samplePathKm(source: Trajectory, span: TimeBounds, count: number, center: CenterId = "sun"): Float64Array {
  if (!Number.isInteger(count) || count < 2) throw new RangeError(`a path needs at least 2 samples, got ${count}`);
  assertUtcUnixMs(span.startUtcMs);
  assertUtcUnixMs(span.endUtcMs);
  if (!(span.endUtcMs > span.startUtcMs)) throw new RangeError("a path span must end after it starts");
  const out = new Float64Array(3 * count);
  for (let k = 0; k < count; k += 1) {
    const timeUtcMs = Math.round(span.startUtcMs + ((span.endUtcMs - span.startUtcMs) * k) / (count - 1));
    out.set(source.stateAt(timeUtcMs, center).positionKm, 3 * k);
  }
  return out;
}
