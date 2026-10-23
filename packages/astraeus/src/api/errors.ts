/** Why a scene call was refused; `code` is stable so a caller can branch on it. */
export type SceneErrorCode = "unknown-body" | "duplicate-id" | "bad-time" | "bad-trajectory" | "bad-scale" | "missing-data" | "empty-scene" | "bad-element" | "no-orbit" | "bad-anchor" | "bad-readout" | "bad-event" | "bad-panels" | "bad-timeline" | "bad-switch" | "bad-body" | "bad-group";

/** The one error the public API throws for bad input; the message names the offending value. */
export class SceneError extends RangeError {
  readonly code: SceneErrorCode;
  constructor(code: SceneErrorCode, message: string) {
    super(message);
    this.name = "SceneError";
    this.code = code;
  }
}
