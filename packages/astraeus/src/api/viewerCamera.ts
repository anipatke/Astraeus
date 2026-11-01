import type { CameraRequest } from "../app/CameraController";
import { validateStartView } from "../core/startView";
import { SceneError } from "./errors";
import type { CameraPose, CameraTarget, LinkAccess } from "./viewerLink";

/** The host link's camera: the pose read and `setCamera`, with its request check. */
export class ViewerCamera {
  constructor(private readonly access: LinkAccess) {}

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
    const id = request.kind === "pose" ? request.view.focus : request.kind === "overview" || request.kind === "hold" ? "" : request.target;
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
