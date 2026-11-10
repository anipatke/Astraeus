// Interaction adapted in spirit from planetary-explorer useGestures.ts / CameraController.tsx
// (drag-to-rotate, wheel and pinch zoom, tweened focus). Donor store and mesh rotation are not
// imported: gestures here change only the camera and its target.
import { PerspectiveCamera } from "three";
import type { FloatingOrigin } from "./floatingOrigin";
import type { RenderVector } from "./renderCoordinates";
import { TapTracker, type PickPointer } from "./scenePicking";
import { EQUATORIAL_UP, orbitBasis } from "./viewUp";
import { CAMERA_FOV_DEG } from "./sceneFraming";
import { directionAt, LOOK_OUT_NEAR, panLookOut, zoomLookOut, type LookOutState } from "./lookOut";
import type { StartView } from "./viewLink";

/** The id of a catalogued body, or of any tracked trajectory body, group or path. */
export type FocusId = string;

/** Focus re-frames the target; follow keeps the current framing; overview frames Earth and Moon. */
export type CameraRequest =
  | { readonly kind: "focus" | "follow"; readonly target: FocusId }
  | { readonly kind: "overview" }
  /** Holds the camera where it is: its target becomes the point it looks at now, fixed in the scene frame; the pose is kept. A later focus, follow or overview request replaces it. */
  | { readonly kind: "hold" }
  /**
   * Stands the camera at the centre of `body` looking out: the direction is a unit vector in EQJ or an object id to turn toward (absent: the direction already looked along, else right ascension 0, declination 0), and `fovDeg` (default: the current one, else 60) is the zoom.
   * Camera-only. A focus, follow, overview or pose request puts the orbit camera back; a hold is ignored while looking out.
   */
  | { readonly kind: "lookOut"; readonly body: FocusId; readonly direction?: readonly [number, number, number] | FocusId; readonly fovDeg?: number }
  /** Puts the camera back on a pose read earlier: it follows the pose's object and eases to its angles and distance (the offset is the object's own, so a moving object is followed from where it is now). */
  | { readonly kind: "pose"; readonly view: StartView };

export interface OrbitCameraState {
  azimuth: number;
  targetAzimuth: number;
  elevation: number;
  targetElevation: number;
  /** Camera-to-target distance in scaled units (Earth radii). */
  distance: number;
  targetDistance: number;
  focus: FocusId;
  /** Set by a `hold` request: the target stays at this scaled point (scene frame, render axes) whatever `focus` does, until a new focus request clears it. */
  fixedPoint: [number, number, number] | null;
  /** Decaying offset that tweens the displayed target from the previous focus to the new one. */
  transition: [number, number, number];
  /** Set while the camera stands inside `focus` looking out: the field of view, with azimuth and elevation as the look direction. Null is the orbit camera. */
  lookOut: LookOutState | null;
  /** Scaled absolute camera/target positions (Float64, render axes) for the latest frame. */
  cameraAbsolute: [number, number, number];
  targetAbsolute: [number, number, number];
}

export function createOrbitCameraState(distance: number, focus: FocusId): OrbitCameraState {
  return {
    azimuth: Math.PI * 1.2,
    targetAzimuth: Math.PI * 1.2,
    elevation: 0.25,
    targetElevation: 0.25,
    distance,
    targetDistance: distance,
    focus,
    fixedPoint: null,
    transition: [0, 0, 0],
    lookOut: null,
    cameraAbsolute: [0, 0, 0],
    targetAbsolute: [0, 0, 0],
  };
}

const MAX_ELEVATION = Math.PI * 0.47;
const DRAG_SENSITIVITY = 1.6;
const TOUCH_DRAG_SENSITIVITY = 0.95;
const WHEEL_SENSITIVITY = 0.0012;
const PINCH_SENSITIVITY = 0.006;
const TRANSITION_RATE_PER_S = 5;

export interface DistanceLimits {
  readonly min: number;
  readonly max: number;
}

export function clampDistance(distance: number, limits: DistanceLimits): number {
  return Math.min(limits.max, Math.max(limits.min, distance));
}

/**
 * Pointer, wheel and pinch handlers: camera-only. `limits` is read at event time. `onTap` hears a press that was a tap and not a drag or pinch
 * (the shared `TapTracker` rule), with its position in CSS px from the element's top left.
 */
export function attachOrbitGestures(
  element: HTMLElement,
  state: OrbitCameraState,
  getLimits: () => DistanceLimits,
  onTap?: (x: number, y: number, pointer: PickPointer) => void,
): () => void {
  const pointers = new Map<number, { x: number; y: number }>();
  const taps = new TapTracker();
  let pinchDistance: number | null = null;
  const pointerKind = (event: PointerEvent): PickPointer => (event.pointerType === "mouse" ? "mouse" : "touch");
  const at = (event: PointerEvent) => {
    const box = element.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };

  const onPointerDown = (event: PointerEvent) => {
    element.setPointerCapture(event.pointerId);
    // Only the main mouse button can tap: a secondary press starts at NaN, which no release is ever within the slop of.
    const { x, y } = at(event);
    const primary = event.pointerType !== "mouse" || event.button === 0;
    taps.down(event.pointerId, primary ? x : Number.NaN, primary ? y : Number.NaN, pointerKind(event));
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) pinchDistance = pointerSpread(pointers);
  };

  const onPointerMove = (event: PointerEvent) => {
    taps.move(event.pointerId, at(event).x, at(event).y);
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, next);
    if (pointers.size >= 2) {
      const spread = pointerSpread(pointers);
      if (pinchDistance !== null) {
        zoomBy(state, Math.exp(-(spread - pinchDistance) * PINCH_SENSITIVITY), getLimits());
      }
      pinchDistance = spread;
      return;
    }
    if (state.lookOut !== null) {
      panLookOut(state, state.lookOut.fovDeg, next.x - previous.x, next.y - previous.y, window.innerHeight);
      cancelCameraTransition(state);
      return;
    }
    const sensitivity = event.pointerType === "touch" ? TOUCH_DRAG_SENSITIVITY : DRAG_SENSITIVITY;
    state.azimuth -= ((next.x - previous.x) / window.innerWidth) * Math.PI * 2 * sensitivity;
    state.elevation = Math.max(
      -MAX_ELEVATION,
      Math.min(MAX_ELEVATION, state.elevation + ((next.y - previous.y) / window.innerHeight) * Math.PI * sensitivity),
    );
    cancelCameraTransition(state);
  };

  const onPointerEnd = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchDistance = null;
  };
  const onPointerUp = (event: PointerEvent) => {
    const { x, y } = at(event);
    const tap = taps.up(event.pointerId, x, y);
    onPointerEnd(event);
    if (tap !== null) onTap?.(tap.x, tap.y, pointerKind(event));
  };
  const onPointerCancel = (event: PointerEvent) => {
    taps.cancel(event.pointerId);
    onPointerEnd(event);
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    zoomBy(state, Math.exp(event.deltaY * WHEEL_SENSITIVITY), getLimits());
  };

  element.addEventListener("pointerdown", onPointerDown);
  element.addEventListener("pointermove", onPointerMove);
  element.addEventListener("pointerup", onPointerUp);
  element.addEventListener("pointercancel", onPointerCancel);
  element.addEventListener("wheel", onWheel, { passive: false });
  return () => {
    element.removeEventListener("pointerdown", onPointerDown);
    element.removeEventListener("pointermove", onPointerMove);
    element.removeEventListener("pointerup", onPointerUp);
    element.removeEventListener("pointercancel", onPointerCancel);
    element.removeEventListener("wheel", onWheel);
  };
}

/** A wheel or pinch step: the distance in orbit, the field of view while looking out. */
function zoomBy(state: OrbitCameraState, factor: number, limits: DistanceLimits): void {
  if (state.lookOut !== null) zoomLookOut(state.lookOut, factor);
  else state.distance = clampDistance(state.distance * factor, limits);
  cancelCameraTransition(state);
}

/** Stops any scripted framing while keeping the viewer's current manual pose. */
export function cancelCameraTransition(state: OrbitCameraState): void {
  state.transition.fill(0);
  state.targetDistance = state.distance;
  state.targetAzimuth = state.azimuth;
  state.targetElevation = state.elevation;
}

function pointerSpread(pointers: Map<number, { x: number; y: number }>): number {
  const [a, b] = [...pointers.values()];
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Starts a tween from the currently displayed target to a new focus without moving the camera. */
export function switchFocus(state: OrbitCameraState, focus: FocusId, newTargetAbsolute: RenderVector): void {
  if (focus === state.focus && state.fixedPoint === null) return;
  for (let i = 0; i < 3; i += 1) state.transition[i] = state.targetAbsolute[i] - newTargetAbsolute[i];
  state.focus = focus;
  state.fixedPoint = null;
}

/**
 * Step 1 (before bodies are placed): computes the absolute target/camera in Float64 render axes
 * and rebases the floating origin when the target drifts away from it, so bodies and camera
 * always use the same origin within a frame. Scientific state is never read or written here.
 */
export function resolveCamera(
  state: OrbitCameraState,
  focusAbsolute: RenderVector,
  origin: FloatingOrigin,
  deltaSeconds: number,
  rebaseThreshold: number,
  up: RenderVector = EQUATORIAL_UP,
): void {
  const decay = Math.exp(-TRANSITION_RATE_PER_S * deltaSeconds);
  const blend = 1 - decay;
  state.distance += (state.targetDistance - state.distance) * blend;
  if (Math.abs(state.targetDistance - state.distance) < 1e-9) state.distance = state.targetDistance;
  state.azimuth += shortestAngleDelta(state.azimuth, state.targetAzimuth) * blend;
  state.elevation += (state.targetElevation - state.elevation) * blend;
  for (let i = 0; i < 3; i += 1) {
    state.transition[i] *= decay;
    if (Math.abs(state.transition[i]) < 1e-9) state.transition[i] = 0;
    state.targetAbsolute[i] = focusAbsolute[i] + state.transition[i];
  }
  const { east, south } = orbitBasis(up);
  const direction = directionAt(state.azimuth, state.elevation, east, south, up);
  if (state.lookOut !== null) {
    placeLookOut(state, focusAbsolute, direction);
    origin.rebaseIfFar(state.cameraAbsolute, rebaseThreshold);
    return;
  }
  for (let i = 0; i < 3; i += 1) state.cameraAbsolute[i] = state.targetAbsolute[i] + state.distance * direction[i];
  origin.rebaseIfFar(state.targetAbsolute, rebaseThreshold);
}

/** Looking out: the camera is at the body's centre and its target one unit along the look direction (a point to aim at, not a place). */
function placeLookOut(state: OrbitCameraState, bodyAbsolute: RenderVector, direction: RenderVector): void {
  for (let i = 0; i < 3; i += 1) {
    state.cameraAbsolute[i] = bodyAbsolute[i];
    state.targetAbsolute[i] = bodyAbsolute[i] + direction[i];
  }
}

function shortestAngleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

/** Step 2: writes the origin-relative camera pose and clipping planes. */
export function poseCamera(
  camera: PerspectiveCamera,
  state: OrbitCameraState,
  focusRadius: number,
  origin: FloatingOrigin,
  far = 5_000,
  up: RenderVector = EQUATORIAL_UP,
): void {
  const [cx, cy, cz] = origin.toLocal(state.cameraAbsolute);
  const [tx, ty, tz] = origin.toLocal(state.targetAbsolute);
  camera.position.set(cx, cy, cz);
  camera.up.set(up[0], up[1], up[2]);
  camera.lookAt(tx, ty, tz);
  camera.near = state.lookOut === null ? Math.max(1e-3, 0.1 * (state.distance - focusRadius)) : LOOK_OUT_NEAR;
  camera.fov = state.lookOut?.fovDeg ?? CAMERA_FOV_DEG;
  camera.far = far;
  camera.updateProjectionMatrix();
}
