import type { CameraRequest } from "../app/CameraController";
import { eqjUnitVector, validateSkyDirection, validateSkyFov, validateStartView } from "../core/startView";
import { SceneError } from "./errors";
import { callListeners } from "./listeners";
import type { CameraPose, CameraTarget, LinkAccess } from "./viewerLink";

/** The shortest time between two reports, a little under the viewer's 100 ms tick so a tick is never skipped. */
const MIN_GAP_MS = 80;

/** Whether two readings say the same: both orbit or both sky, with every field equal (a reading's keys always come in one order). */
const samePose = (a: CameraPose, b: CameraPose): boolean => JSON.stringify(a) === JSON.stringify(b);

/** The host link's camera: the pose read and `setCamera`, with its request check. */
export class ViewerCamera {
  readonly #listeners = new Set<(camera: CameraPose) => void>();
  /** The pose last read or reported; undefined until the viewer is attached and has drawn a frame. */
  #last: CameraPose | undefined;
  /** When the last report went out (`performance.now()`), so a burst of publishes reports at most about ten times a second. */
  #reportedAt = -Infinity;

  constructor(private readonly access: LinkAccess) {}

  /** The viewer attached (the opening pose is read, not reported) or detached (nothing is known). */
  reset(): void { this.#last = this.access.control()?.readCamera(); }

  clearListeners(): void { this.#listeners.clear(); }

  /** Calls `listener` with the new pose when the camera's object, angles or distance change (at most about ten times a second); returns the function that stops it. */
  onCameraChange(listener: (camera: CameraPose) => void): () => void {
    this.#listeners.add(listener);
    return () => { this.#listeners.delete(listener); };
  }

  /** A viewer publish (its tick, or a host or visitor action): reports the pose when it differs from the last one. */
  publish(): void {
    const control = this.access.control();
    if (control === undefined) return;
    const pose = control.readCamera();
    if (pose === undefined) return;
    const last = this.#last;
    if (last === undefined) { this.#last = pose; return; } // the first frame's pose is the opening one
    if (samePose(pose, last)) return;
    const now = performance.now();
    if (now - this.#reportedAt < MIN_GAP_MS) return; // the next tick reports it
    this.#last = pose;
    this.#reportedAt = now;
    callListeners(this.#listeners, pose);
  }

  /** The camera pose, or undefined before the viewer is drawn and after it is gone; before its first frame it is the opening camera. */
  get camera(): CameraPose | undefined { return this.access.control()?.readCamera(); }

  /**
   * Points the camera: `{ follow: id }` keeps the distance, `{ focus: id }` frames the object, `{ lookOut: id, direction?, fovDeg? }` stands inside a body looking out,
   * a pose (from `camera`, either kind) puts the camera back where it was read (an orbit pose relative to its object).
   * Every id must be an object the showing view shows; an unknown or hidden id, a direction or field of view out of range, or a malformed argument, throws `bad-camera`.
   * Before the viewer is drawn or after it is gone, `not-mounted`. The move eases in as a view's camera rule does.
   */
  setCamera(target: CameraTarget): void {
    const control = this.access.open("setCamera");
    const request = this.#request(target);
    const known = control.cameraTargets();
    for (const id of idsOf(request)) {
      if (!known.includes(id)) throw new SceneError("bad-camera", `setCamera: "${id}" is not an object the showing view shows (${known.join(", ")})`);
    }
    control.setCamera(request);
  }

  #request(target: unknown): CameraRequest {
    const bad = (why: string) => new SceneError("bad-camera", `setCamera: ${why}; give { follow: id }, { focus: id }, { lookOut: id, direction?, fovDeg? } or a pose from camera`);
    if (typeof target !== "object" || target === null || Array.isArray(target)) throw bad(`${String(target)} is not an object`);
    const record = target as Record<string, unknown>;
    if ("lookOut" in record) return this.#lookOut(record, bad);
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
  #lookOut(record: Record<string, unknown>, bad: (why: string) => SceneError): CameraRequest {
    const body = record.lookOut;
    if (typeof body !== "string" || body === "") throw bad("lookOut must name a non-empty body id");
    for (const key of Object.keys(record)) if (!["lookOut", "direction", "fovDeg", "raDeg", "decDeg"].includes(key)) throw bad(`${key} is not a look-out field`);
    try {
      const fovDeg = record.fovDeg === undefined ? undefined : validateSkyFov(record.fovDeg, "lookOut");
      const direction = lookDirection(record, body, this.camera, bad);
      return { kind: "lookOut", body, direction, ...(fovDeg === undefined ? {} : { fovDeg }) };
    } catch (cause) {
      throw cause instanceof RangeError ? bad(cause.message) : cause;
    }
  }
}

/** The object ids a request names, which must all be objects the showing view shows. */
function idsOf(request: CameraRequest): readonly string[] {
  switch (request.kind) {
    case "pose": return [request.view.focus];
    case "lookOut": return typeof request.direction === "string" ? [request.body, request.direction] : [request.body];
    case "overview": case "hold": return [];
    default: return [request.target];
  }
}

/** The look direction a look-out target names: `raDeg` and `decDeg` together (a sky pose), `direction` as a position or an object id, else the one already looked along (else right ascension 0, declination 0). Throws a `bad-camera` SceneError (or a RangeError from the range checks, which the caller turns into one). */
function lookDirection(record: Record<string, unknown>, body: string, now: CameraPose | undefined, bad: (why: string) => SceneError): readonly [number, number, number] | string {
  const flat = "raDeg" in record || "decDeg" in record;
  const given = record.direction;
  if (flat && given !== undefined) throw bad("give direction or raDeg and decDeg, not both");
  if (flat) return pointOf(record.raDeg, record.decDeg, "lookOut");
  if (typeof given === "string") {
    if (given === "" || given === body) throw bad("direction must name an object other than the body looked out from");
    return given;
  }
  if (given === undefined) return now !== undefined && "lookOut" in now ? pointOf(now.raDeg, now.decDeg, "lookOut") : pointOf(0, 0, "lookOut");
  if (typeof given !== "object" || given === null || Array.isArray(given) || Object.keys(given).some((key) => key !== "raDeg" && key !== "decDeg")) throw bad("direction must be { raDeg, decDeg } or an object id");
  const position = given as Record<string, unknown>;
  return pointOf(position.raDeg, position.decDeg, "direction");
}

const pointOf = (raDeg: unknown, decDeg: unknown, where: string): [number, number, number] => {
  const checked = validateSkyDirection(raDeg, decDeg, where);
  return eqjUnitVector(checked.raDeg, checked.decDeg);
};
