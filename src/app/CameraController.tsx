// Interaction adapted in spirit from planetary-explorer useGestures.ts / CameraController.tsx
// (drag-to-rotate, wheel and pinch zoom, tweened focus). Donor store and mesh rotation are not
// imported: gestures here change only the camera and its target.
import { PerspectiveCamera } from "three";
import type { FloatingOrigin } from "./floatingOrigin";
import type { RenderVector } from "./renderCoordinates";

/** "earth", "moon", or the id of any tracked trajectory body. */
export type FocusId = string;

/** Focus re-frames the target; follow keeps the current framing; overview frames Earth and Moon. */
export type CameraRequest =
  | { readonly kind: "focus" | "follow"; readonly target: FocusId }
  | { readonly kind: "overview" };

export interface OrbitCameraState {
  azimuth: number;
  targetAzimuth: number;
  elevation: number;
  targetElevation: number;
  /** Camera-to-target distance in scaled units (Earth radii). */
  distance: number;
  targetDistance: number;
  focus: FocusId;
  /** Decaying offset that tweens the displayed target from the previous focus to the new one. */
  transition: [number, number, number];
  /** Scaled absolute camera/target positions (Float64, render axes) for the latest frame. */
  cameraAbsolute: [number, number, number];
  targetAbsolute: [number, number, number];
}

export function createOrbitCameraState(distance: number): OrbitCameraState {
  return {
    azimuth: Math.PI * 1.2,
    targetAzimuth: Math.PI * 1.2,
    elevation: 0.25,
    targetElevation: 0.25,
    distance,
    targetDistance: distance,
    focus: "earth",
    transition: [0, 0, 0],
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

/** Pointer, wheel and pinch handlers: camera-only. `limits` is read at event time. */
export function attachOrbitGestures(
  element: HTMLElement,
  state: OrbitCameraState,
  getLimits: () => DistanceLimits,
): () => void {
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchDistance: number | null = null;

  const onPointerDown = (event: PointerEvent) => {
    element.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) pinchDistance = pointerSpread(pointers);
  };

  const onPointerMove = (event: PointerEvent) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, next);
    if (pointers.size >= 2) {
      const spread = pointerSpread(pointers);
      if (pinchDistance !== null) {
        state.distance = clampDistance(state.distance * Math.exp(-(spread - pinchDistance) * PINCH_SENSITIVITY), getLimits());
        cancelCameraTransition(state);
      }
      pinchDistance = spread;
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

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    state.distance = clampDistance(state.distance * Math.exp(event.deltaY * WHEEL_SENSITIVITY), getLimits());
    cancelCameraTransition(state);
  };

  element.addEventListener("pointerdown", onPointerDown);
  element.addEventListener("pointermove", onPointerMove);
  element.addEventListener("pointerup", onPointerEnd);
  element.addEventListener("pointercancel", onPointerEnd);
  element.addEventListener("wheel", onWheel, { passive: false });
  return () => {
    element.removeEventListener("pointerdown", onPointerDown);
    element.removeEventListener("pointermove", onPointerMove);
    element.removeEventListener("pointerup", onPointerEnd);
    element.removeEventListener("pointercancel", onPointerEnd);
    element.removeEventListener("wheel", onWheel);
  };
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
  if (focus === state.focus) return;
  for (let i = 0; i < 3; i += 1) state.transition[i] = state.targetAbsolute[i] - newTargetAbsolute[i];
  state.focus = focus;
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
  const cosEl = Math.cos(state.elevation);
  const offset: RenderVector = [
    state.distance * cosEl * Math.sin(state.azimuth),
    state.distance * Math.sin(state.elevation),
    state.distance * cosEl * Math.cos(state.azimuth),
  ];
  for (let i = 0; i < 3; i += 1) state.cameraAbsolute[i] = state.targetAbsolute[i] + offset[i];
  origin.rebaseIfFar(state.targetAbsolute, rebaseThreshold);
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
): void {
  const [cx, cy, cz] = origin.toLocal(state.cameraAbsolute);
  const [tx, ty, tz] = origin.toLocal(state.targetAbsolute);
  camera.position.set(cx, cy, cz);
  camera.lookAt(tx, ty, tz);
  camera.near = Math.max(1e-3, 0.1 * (state.distance - focusRadius));
  camera.far = 5_000;
  camera.updateProjectionMatrix();
}
