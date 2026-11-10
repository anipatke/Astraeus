import { cameraRequestOf, checkCameraIds } from "./cameraRequest";
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

  /** The camera pose, or undefined before the viewer is drawn and after it is gone; before its first frame it is the opening camera, or undefined when the opening look-out turns toward an id (resolved on that frame). */
  get camera(): CameraPose | undefined { return this.access.control()?.readCamera(); }

  /**
   * Points the camera: `{ follow: id }` keeps the distance, `{ focus: id }` frames the object, `{ lookOut: id, direction?, fovDeg? }` stands inside a body looking out,
   * a pose (from `camera`, either kind) puts the camera back where it was read (an orbit pose relative to its object).
   * Every id must be an object the showing view shows (a look-out `direction` may name a sky figure too); an unknown or hidden id, a direction or field of view out of range, or a malformed argument, throws `bad-camera`.
   * Before the viewer is drawn or after it is gone, `not-mounted`. The move eases in as a view's camera rule does.
   */
  setCamera(target: CameraTarget): void {
    const control = this.access.open("setCamera");
    const request = cameraRequestOf(target, "setCamera", this.camera);
    checkCameraIds(request, "setCamera", control.cameraTargets(), (control.skyFigures ?? []).map(({ id }) => id));
    control.setCamera(request);
  }
}
