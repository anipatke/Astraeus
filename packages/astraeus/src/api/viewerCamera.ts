import type { CameraRequest } from "../app/CameraController";
import { validateStartView } from "../core/startView";
import { SceneError } from "./errors";
import { callListeners } from "./listeners";
import type { CameraPose, CameraTarget, LinkAccess } from "./viewerLink";

/** The shortest time between two reports, a little under the viewer's 100 ms tick so a tick is never skipped. */
const MIN_GAP_MS = 80;

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
    if (pose.focus === last.focus && pose.azimuthDeg === last.azimuthDeg && pose.elevationDeg === last.elevationDeg && pose.distance === last.distance) return;
    const now = performance.now();
    if (now - this.#reportedAt < MIN_GAP_MS) return; // the next tick reports it
    this.#last = pose;
    this.#reportedAt = now;
    callListeners(this.#listeners, pose);
  }

  /** The camera pose, or undefined before the viewer is drawn and after it is gone; before its first frame it is the opening camera. */
  get camera(): CameraPose | undefined { return this.access.control()?.readCamera(); }

  /**
   * Points the camera: `{ follow: id }` keeps the distance, `{ focus: id }` frames the object, a pose (from `camera`) puts the camera back where it was read,
   * relative to its object. The id must be an object the showing view shows; an unknown or hidden id, or a malformed argument, throws `bad-camera`.
   * Before the viewer is drawn or after it is gone, `not-mounted`. The move eases in as a view's camera rule does.
   */
  setCamera(target: CameraTarget): void {
    const control = this.access.open("setCamera");
    const request = this.#request(target);
    const id = request.kind === "pose" ? request.view.focus : request.kind === "lookOut" ? request.body : request.kind === "overview" || request.kind === "hold" ? "" : request.target;
    if (!control.cameraTargets().includes(id)) {
      throw new SceneError("bad-camera", `setCamera: "${id}" is not an object the showing view shows (${control.cameraTargets().join(", ")})`);
    }
    control.setCamera(request);
  }

  #request(target: unknown): CameraRequest {
    const bad = (why: string) => new SceneError("bad-camera", `setCamera: ${why}; give { follow: id }, { focus: id } or a pose from camera`);
    if (typeof target !== "object" || target === null || Array.isArray(target)) throw bad(`${String(target)} is not an object`);
    const record = target as Record<string, unknown>;
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
}
