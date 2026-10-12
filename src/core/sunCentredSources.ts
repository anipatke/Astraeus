import type { AstronomyAdapter } from "./astronomyAdapter";
import type { BodyId, CenterId } from "./body";
import type { ElementPlane, OrbitElements } from "./orbitGroup";
import { assertWithinBounds, GroupElementsError } from "./pointGroup";
import { earthStateAt } from "./referenceCenters";
import { assertUtcUnixMs, createState, EQJ, type State } from "./state";
import type { TimeBounds, Trajectory } from "./trajectory";
import type { TwoBodyAdapter } from "./twoBodyAdapter";

const RADIANS = Math.PI / 180;

function assertCentre(native: CenterId, center: CenterId): void {
  if (center !== native) throw new RangeError(`this Trajectory is ${native === "sun" ? "Sun-centred" : `centred on "${native}"`}; centre "${center}" is not offered`);
}

export interface TwoBodyTrajectoryInput {
  readonly body: BodyId;
  /** The body the elements orbit; its definition must carry a gravitational parameter. Defaults to the Sun. */
  readonly center?: CenterId;
  /** Plane the elements are expressed in; positions are always output in EQJ. */
  readonly plane: ElementPlane;
  /** Instant at which the elements hold. */
  readonly epochUtcMs: number;
  readonly elements: OrbitElements;
  readonly bounds?: TimeBounds;
}

/**
 * A Trajectory about one centre (the Sun unless named) from classical elements under unperturbed two-body motion. It is a state
 * source like any other: a path, a label or a group centre can be drawn from it without orbit maths of their own.
 */
export function createTwoBodyTrajectory(input: TwoBodyTrajectoryInput, adapter: TwoBodyAdapter): Trajectory {
  assertUtcUnixMs(input.epochUtcMs);
  const { elements } = input;
  const native = input.center ?? "sun";
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
  }, native);
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
    stateAt(timeUtcMs: number, center: CenterId = native): State {
      assertCentre(native, center);
      assertUtcUnixMs(timeUtcMs);
      assertWithinBounds(bounds, timeUtcMs);
      const position = new Float64Array(3);
      adapter.propagateMemberInto(states, 0, (timeUtcMs - epochUtcMs) / 1000, native, position);
      return createState({ body, center: native, timeUtcMs, frame: EQJ, positionKm: position, orientation: null });
    },
  });
}

/** Earth's own Sun-centred state from the astronomy adapter's Earth–Sun geometry, as a Trajectory. */
export function createEarthSunTrajectory(adapter: AstronomyAdapter): Trajectory {
  return Object.freeze({
    body: "earth",
    stateAt(timeUtcMs: number, center: CenterId = "sun"): State {
      assertCentre("sun", center);
      return earthStateAt(adapter, timeUtcMs);
    },
  });
}

/** A path's sample times: `count` evenly spaced from the span's start to its end inclusive, rounded to whole milliseconds. */
export function pathTimesUtcMs(span: TimeBounds, count: number): number[] {
  if (!Number.isInteger(count) || count < 2) throw new RangeError(`a path needs at least 2 samples, got ${count}`);
  assertUtcUnixMs(span.startUtcMs);
  assertUtcUnixMs(span.endUtcMs);
  if (!(span.endUtcMs > span.startUtcMs)) throw new RangeError("a path span must end after it starts");
  const times: number[] = [];
  for (let k = 0; k < count; k += 1) times.push(Math.round(span.startUtcMs + ((span.endUtcMs - span.startUtcMs) * k) / (count - 1)));
  return times;
}

/**
 * Sample times of a window `windowMs` wide centred on `centerUtcMs`: `count` evenly spaced, the centre exactly one of them
 * (so the clock time is always a vertex). The count must be odd.
 */
export function windowTimesUtcMs(centerUtcMs: number, windowMs: number, count: number): number[] {
  assertUtcUnixMs(centerUtcMs);
  if (!Number.isInteger(count) || count < 3 || count % 2 === 0) throw new RangeError("a window needs an odd sample count of at least 3 so the centre is a sample");
  if (!(windowMs > 0) || !Number.isFinite(windowMs)) throw new RangeError("a window needs a positive finite width");
  const half = (count - 1) / 2;
  const times: number[] = [];
  for (let index = 0; index < count; index += 1) {
    times.push(index === half ? centerUtcMs : Math.round(centerUtcMs + ((index - half) / half) * (windowMs / 2)));
  }
  return times;
}

/** Positions (km, EQJ) of a state source about `center` at the given times: 3 values per time. */
export function samplePositionsKm(source: Trajectory, timesUtcMs: readonly number[], center?: CenterId): Float64Array {
  const out = new Float64Array(3 * timesUtcMs.length);
  timesUtcMs.forEach((time, k) => out.set(source.stateAt(time, center).positionKm, 3 * k));
  return out;
}

/**
 * Positions (km, EQJ, about `center`, default the source's own) of a state source at `count` evenly spaced times from the span's start to
 * its end inclusive: 3 × count values. This is all a path is; no orbit maths lives here.
 */
export function samplePathKm(source: Trajectory, span: TimeBounds, count: number, center?: CenterId): Float64Array {
  return samplePositionsKm(source, pathTimesUtcMs(span, count), center);
}
