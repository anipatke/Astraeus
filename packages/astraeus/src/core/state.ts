import { assertCenterId, type BodyId, type CenterId } from "./body";
import { EARTH } from "./bodies/earth";
import { MOON } from "./bodies/moon";
import { SUN } from "./bodies/sun";

export const EQJ = "EQJ" as const;
export type FrameId = typeof EQJ;
export type Quaternion = readonly [x: number, y: number, z: number, w: number];

export interface CenteredPosition {
  readonly body: BodyId;
  readonly center: CenterId;
  readonly timeUtcMs: number;
  readonly frame: FrameId;
  readonly positionKm: Float64Array;
  readonly velocityKmS?: Float64Array;
}

/** Where a body is at one moment, as the engine reports it: position (and velocity when known) in km about a centre, in the EQJ frame, with its attitude when modelled. */
export interface State extends CenteredPosition {
  /** Body-fixed +X/+Y/+Z axes expressed in EQJ; null means this body's attitude is not modeled. */
  readonly orientation: Quaternion | null;
}

export interface StateInput {
  readonly body: BodyId;
  readonly center: CenterId;
  readonly timeUtcMs: number;
  readonly frame?: FrameId;
  readonly positionKm: ArrayLike<number>;
  readonly velocityKmS?: ArrayLike<number>;
  readonly orientation: Quaternion | null;
}

const MAX_DATE_MS = 8.64e15;

export function assertUtcUnixMs(timeUtcMs: number): void {
  if (!Number.isSafeInteger(timeUtcMs) || Math.abs(timeUtcMs) > MAX_DATE_MS) {
    throw new RangeError("timeUtcMs must be an integer JavaScript UTC Unix-millisecond value");
  }
}

function copyVector(value: ArrayLike<number>, label: string): Float64Array {
  if (value.length !== 3) throw new TypeError(`${label} must contain exactly three coordinates`);
  const result = Float64Array.from(value);
  for (const component of result) {
    if (!Number.isFinite(component)) throw new TypeError(`${label} coordinates must be finite`);
  }
  return result;
}

function copyQuaternion(value: Quaternion | null): Quaternion | null {
  if (value === null) return null;
  if (value.length !== 4 || value.some((component) => !Number.isFinite(component))) {
    throw new TypeError("orientation must contain four finite quaternion components");
  }
  const magnitude = Math.hypot(...value);
  if (magnitude < 1e-12) throw new RangeError("orientation quaternion must be non-zero");
  const normalized = value.map((component) => component / magnitude) as [number, number, number, number];
  return Object.freeze(normalized);
}

export function createCenteredPosition(input: Omit<StateInput, "orientation">): CenteredPosition {
  assertUtcUnixMs(input.timeUtcMs);
  assertCenterId(input.center);
  const positionKm = copyVector(input.positionKm, "positionKm");
  const velocityKmS = input.velocityKmS === undefined
    ? undefined
    : copyVector(input.velocityKmS, "velocityKmS");
  if (input.body === input.center
    && (positionKm.some((component) => component !== 0) || velocityKmS?.some((component) => component !== 0))) {
    throw new RangeError("a body can be positioned relative to itself only at exactly zero");
  }
  const frame = input.frame ?? EQJ;
  if (frame !== EQJ) throw new RangeError("this spike's scientific states use the EQJ frame only");
  return Object.freeze({
    body: input.body,
    center: input.center,
    timeUtcMs: input.timeUtcMs,
    frame,
    positionKm,
    ...(velocityKmS === undefined ? {} : { velocityKmS }),
  });
}

/** Whether a body's definition says its State must carry a modelled orientation. */
export type OrientationRule = (body: BodyId) => boolean;

const BUILT_IN_ORIENTED: ReadonlySet<BodyId> = new Set(
  [SUN, EARTH, MOON].filter((definition) => definition.orientation !== "none").map((definition) => definition.id),
);

// The resolver supplies the rule for its own catalogue; callers outside a resolver get the three built-in bodies.
const builtInRule: OrientationRule = (body) => BUILT_IN_ORIENTED.has(body);

export function createState(input: StateInput, requiresOrientation: OrientationRule = builtInRule): State {
  const position = createCenteredPosition(input);
  if (requiresOrientation(input.body) && input.orientation === null) {
    throw new TypeError(`${input.body} State requires a modeled orientation`);
  }
  return Object.freeze({ ...position, orientation: copyQuaternion(input.orientation) });
}
