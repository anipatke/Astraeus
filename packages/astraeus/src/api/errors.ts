/** Why a scene call was refused; `code` is stable so a caller can branch on it. */
export type SceneErrorCode =
  /** A body or path id is not in the catalogue or the scene. */
  | "unknown-body"
  /** An id is already used in the scene, so the new body, path, group, orbit line, activity, event or story panel cannot take it. */
  | "duplicate-id"
  /** A moment is not a valid time, or lies outside the span it must fall in. */
  | "bad-time"
  /** A path (`addTrajectory`) is malformed: its id, provider, bounds, plane, spans or line stretches. */
  | "bad-trajectory"
  /** A data package passed to the viewer is malformed, for example moon positions that name a planet without a moon system. */
  | "bad-data"
  /** The scale is not one of the engine's scales, or does not suit this scene. */
  | "bad-scale"
  /** Position data a body needs was not given to the viewer: pass its data package. */
  | "missing-data"
  /** The viewer is not drawn yet, or has been unmounted: a handle call before `ready` or after `unmount`. */
  | "not-mounted"
  /** The timeline reaches outside the years a body's data package covers. */
  | "out-of-span"
  /** The scene was edited after a viewer took it; build a new scene instead. */
  | "scene-mounted"
  /** The scene has no bodies to show. */
  | "empty-scene"
  /** An orbital-elements record, or the element to mount into, is malformed. */
  | "bad-element"
  /** An orbit line was asked for a body whose data give no closed orbit, or about a body not in the scene. */
  | "no-orbit"
  /** A path anchor is malformed, repeated or outside the path. */
  | "bad-anchor"
  /** A readout is of an unknown kind, or lacks or misnames the body or activity it measures. */
  | "bad-readout"
  /** An event is malformed or names an object that is not in the scene. */
  | "bad-event"
  /** The story panels are malformed. */
  | "bad-panels"
  /** The timeline, its pacing or its speeds are malformed, or a call needs pacing the scene lacks. */
  | "bad-timeline"
  /** A display switch is unknown or malformed. */
  | "bad-switch"
  /** An option of `addBody` is malformed. */
  | "bad-body"
  /** A point group is malformed or refers to a body that is not in the scene. */
  | "bad-group"
  /** A body set (`addBodySet`) is malformed, or names a centre, moon, body or balance point the scene cannot draw it with. */
  | "bad-body-set"
  /** The moon panel (`setMoonPanel`) is malformed, or names a moon the scene does not hold. */
  | "bad-moon-panel"
  /** The picker (`setPicker`, `setPick`) is malformed, or a pick names an option it does not have. */
  | "bad-picker"
  /** A body's places (`addPlaces`) are malformed, or name a body the scene does not hold. */
  | "bad-places"
  /** An activity curve is malformed. */
  | "bad-activity"
  /** A camera call or pose is malformed, or names an object the view cannot show. */
  | "bad-camera"
  /** A scene view is malformed, repeated, or not one of the scene's views. */
  | "bad-view"
  /** `setSelected` was given something other than an id of an object the showing view shows, or `undefined`. */
  | "bad-selection"
  /** A look (`setLook`) is unknown or out of its range. */
  | "bad-look"
  /** An input field was given under a name it no longer has; the message names the old field and its replacement. */
  | "renamed";

/** The one error the public API throws for bad input; the message names the offending value. */
export class SceneError extends RangeError {
  readonly code: SceneErrorCode;
  constructor(code: SceneErrorCode, message: string) {
    super(message);
    this.name = "SceneError";
    this.code = code;
  }
}
