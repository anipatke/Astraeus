import type { CameraRequest } from "../app/CameraController";
import { eqjUnitVector, validateSkyDirection, validateSkyFov, validateSkyPosition, validateStartView } from "../core/startView";
import { SceneError } from "./errors";
import type { CameraPose } from "./viewerLink";

/**
 * Checks the shape of a camera target (what `setCamera` takes) and turns it into the request the scene camera runs; a malformed one throws `bad-camera` leading with `call`.
 * It does not look at the scene: which ids exist is the caller's check. A look-out target without a direction takes the one `now` looks along while looking out, else right ascension 0, declination 0;
 * with `keepDirection` it is left out of the request instead, and the camera keeps its own when the request runs (a story panel's camera, decided as it opens).
 */
export function cameraRequestOf(target: unknown, call: string, now: CameraPose | undefined, keepDirection = false): CameraRequest {
  const bad = (why: string) => new SceneError("bad-camera", `${call}: ${why}; give { follow: id }, { focus: id }, { lookOut: id, direction?, fovDeg? } or a pose from camera`);
  if (typeof target !== "object" || target === null || Array.isArray(target)) throw bad(`${String(target)} is not an object`);
  const record = target as Record<string, unknown>;
  if ("lookOut" in record) return lookOutOf(record, now, keepDirection, bad);
  // A pose names its object with `focus` too; its angle and distance fields tell it from `{ focus: id }`.
  const isPose = ["azimuthDeg", "elevationDeg", "distance"].some((key) => key in record) || !("follow" in record || "focus" in record);
  const named = (["follow", "focus"] as const).filter((key) => key in record);
  if (isPose) {
    try { return { kind: "pose", view: validateStartView(record, "pose") }; } catch (cause) { throw bad(cause instanceof Error ? cause.message : "a malformed pose"); }
  }
  const id = record[named[0]];
  if (named.length > 1 || Object.keys(record).length > 1 || typeof id !== "string" || id === "") throw bad("the target must be exactly one of follow or focus, naming a non-empty id");
  return { kind: named[0], target: id };
}

/** A look-out target or a sky pose: the body, a direction (`direction`, or `raDeg` and `decDeg` together), and a field of view. */
function lookOutOf(record: Record<string, unknown>, now: CameraPose | undefined, keepDirection: boolean, bad: (why: string) => SceneError): CameraRequest {
  const body = record.lookOut;
  if (typeof body !== "string" || body === "") throw bad("lookOut must name a non-empty body id");
  for (const key of Object.keys(record)) if (!["lookOut", "direction", "fovDeg", "raDeg", "decDeg"].includes(key)) throw bad(`${key} is not a look-out field`);
  try {
    const fovDeg = record.fovDeg === undefined ? undefined : validateSkyFov(record.fovDeg, "lookOut");
    const direction = lookDirection(record, body, now, keepDirection, bad);
    return { kind: "lookOut", body, ...(direction === undefined ? {} : { direction }), ...(fovDeg === undefined ? {} : { fovDeg }) };
  } catch (cause) {
    throw cause instanceof RangeError ? bad(cause.message) : cause;
  }
}

/** The look direction a look-out target names: `raDeg` and `decDeg` together (a sky pose), `direction` as a position or an object id, else the one already looked along (else right ascension 0, declination 0). Throws a `bad-camera` SceneError (or a RangeError from the range checks, which the caller turns into one). */
function lookDirection(record: Record<string, unknown>, body: string, now: CameraPose | undefined, keepDirection: boolean, bad: (why: string) => SceneError): readonly [number, number, number] | string | undefined {
  const flat = "raDeg" in record || "decDeg" in record;
  const given = record.direction;
  if (flat && given !== undefined) throw bad("give direction or raDeg and decDeg, not both");
  if (flat) return pointOf(record.raDeg, record.decDeg, "lookOut");
  if (typeof given === "string") {
    if (given === "" || given === body) throw bad("direction must name an object other than the body looked out from");
    return given;
  }
  if (given === undefined && keepDirection) return undefined;
  if (given === undefined) return now !== undefined && "lookOut" in now ? pointOf(now.raDeg, now.decDeg, "lookOut") : pointOf(0, 0, "lookOut");
  const position = validateSkyPosition(given, "direction");
  return eqjUnitVector(position.raDeg, position.decDeg);
}

const pointOf = (raDeg: unknown, decDeg: unknown, where: string): [number, number, number] => {
  const checked = validateSkyDirection(raDeg, decDeg, where);
  return eqjUnitVector(checked.raDeg, checked.decDeg);
};
