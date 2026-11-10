// Scene camera: orbit-camera state, rescaling when the scale policy changes, and the per-frame target step.
import type { BodyCatalogue } from "../assets/catalogue";
import type { BodyId } from "../core/body";
import {
  clampDistance,
  switchFocus,
  type CameraRequest,
  type LookOutRequest,
  type OrbitCameraState,
} from "./CameraController";
import type { CameraReach } from "./experienceDefinition";
import { PathView, pathReachKm } from "./PathView";
import type { RenderVector } from "./renderCoordinates";
import {
  defaultDistance,
  fitDistance,
  focusLimits,
  GROUP_FRAMING,
  scaleLength,
  startsInsideFocus,
  TRACKED_DEFAULT_DISTANCE,
  type SceneFrame,
} from "./sceneFraming";
import { canFocus, focusAbsoluteOf, framedViewOf, type SceneTargets } from "./sceneTargets";
import { clampFov, clampLookElevation, LOOK_OUT_OPENING_FOV_DEG } from "./lookOut";
import { eqjToRenderVector } from "./renderCoordinates";
import { orbitAnglesFor, orbitBasis } from "./viewUp";
import type { StartView } from "./viewLink";
import { eqjUnitVector, isSkyView, type CameraView } from "../core/startView";

/** What the scene opens on: a view in numbers, or a look-out request whose direction is an id, resolved on the first frame as a `setCamera` look-out is (the figure aim already applied, `aimAtFigure`). */
export type OpeningView = CameraView | LookOutRequest;

/** The two control fields the camera step reads and clears. */
export interface CameraControls {
  startView?: OpeningView;
  cameraRequest: CameraRequest | null;
  /** The host's last `setCamera`, kept apart from `cameraRequest` so the opening view and a view's own camera rule cannot discard it (the host-call order rule). */
  hostCameraRequest?: CameraRequest | null;
}

export interface CameraStepInput {
  readonly camState: OrbitCameraState;
  readonly controls: CameraControls;
  readonly targets: SceneTargets;
  readonly frame: SceneFrame;
  readonly catalogue: BodyCatalogue;
  readonly reach: CameraReach;
  readonly fovDeg: number;
  readonly viewUp: RenderVector;
  /** True on the first frame only (the opening view applies once). */
  readonly firstFrame: boolean;
  /** The up direction of the previous frame; null before the first. */
  readonly previousUp: RenderVector | null;
}

/** Keeps the same relative framing when the visual scale changes (physical state is untouched). */
export function rescaleCameraForPolicy(camState: OrbitCameraState, sceneCenter: BodyId, factor: number): void {
  if (camState.focus === sceneCenter) camState.distance *= factor;
  for (let i = 0; i < 3; i += 1) camState.transition[i] *= factor;
  if (camState.fixedPoint !== null) for (let i = 0; i < 3; i += 1) camState.fixedPoint[i] *= factor;
}

/** Where the camera's target is this frame: the held point after a `hold` request, else the focus. */
export function cameraTargetAbsolute(camState: OrbitCameraState, targets: SceneTargets): RenderVector {
  return camState.fixedPoint ?? focusAbsoluteOf(targets, camState.focus);
}

/** An explicit start view wins over the overview rule: the camera opens exactly there (the zoom limits still apply). */
function applyStartView(camState: OrbitCameraState, view: StartView): void {
  camState.focus = view.focus;
  camState.transition.fill(0);
  camState.azimuth = camState.targetAzimuth = (view.azimuthDeg * Math.PI) / 180;
  camState.elevation = camState.targetElevation = (view.elevationDeg * Math.PI) / 180;
  camState.distance = camState.targetDistance = view.distance;
}

/**
 * The first frame: a start distance below what the centre body allows (a large centre body) would be clamped up to its closest approach,
 * so the experience opens on a close-up of that body. It opens at its overview instead (I-028); other experiences start as before.
 * Returns whether it opened at the overview.
 */
function openFirstFrame(input: CameraStepInput): boolean {
  const { camState, controls, targets, frame, reach } = input;
  const view = controls.startView;
  // A sky view opens through the same look-out step as a request does.
  const opening = view === undefined || "kind" in view || !isSkyView(view) ? view : { kind: "lookOut", body: view.lookOut, direction: eqjUnitVector(view.raDeg, view.decDeg), fovDeg: view.fovDeg } as const;
  if (opening !== undefined && canFocus(targets, "kind" in opening ? opening.body : opening.focus)) {
    if ("kind" in opening) applyLookOut(input, opening);
    else applyStartView(camState, opening);
    // The opening view replaces any request made before the first frame, except the host's: that one is applied after it.
    controls.cameraRequest = controls.hostCameraRequest ?? null;
    return false;
  }
  if (controls.cameraRequest === null && startsInsideFocus(camState.distance, targets.bodyIdFor(camState.focus) ?? camState.focus, frame, targets.policy, reach)) {
    controls.cameraRequest = { kind: "overview" };
    return true;
  }
  return false;
}

/** How far the camera stands from a newly focused target. */
function framingDistance(input: CameraStepInput, target: string, targetBody: BodyId | null): number {
  const { targets, frame, catalogue, fovDeg } = input;
  const framed = framedViewOf(targets, target);
  if (framed) {
    const extent = framed.extentUnits(targets.policy);
    const whole = framed instanceof PathView && framed.fitsWhole;
    return Math.max(TRACKED_DEFAULT_DISTANCE, whole ? fitDistance(extent, fovDeg) : GROUP_FRAMING * extent);
  }
  if (targetBody !== null && catalogue.get(targetBody).visual.kind === "marker") {
    // A marker is a point: it is framed by how far the declared paths reach from it.
    const reachKm = pathReachKm(targets.sunCentredViews);
    return Math.max(TRACKED_DEFAULT_DISTANCE, GROUP_FRAMING * scaleLength(targets.policy, reachKm));
  }
  return defaultDistance(targetBody ?? target, frame, targets.policy);
}

/** Starts on the side of the body that faces its parent, so a phase reads as an observer on the parent sees it. */
function faceParent(camState: OrbitCameraState, targets: SceneTargets, viewUp: RenderVector, body: BodyId, parent: BodyId): void {
  const at = targets.placed.get(body)!;
  const from = targets.placed.get(parent)!;
  const toParent = [from[0] - at[0], from[1] - at[1], from[2] - at[2]];
  const distance = Math.hypot(toParent[0], toParent[1], toParent[2]);
  const { east, south } = orbitBasis(viewUp);
  const along = (axis: RenderVector): number => toParent[0] * axis[0] + toParent[1] * axis[1] + toParent[2] * axis[2];
  camState.targetElevation = Math.asin(along(viewUp) / distance);
  camState.targetAzimuth = Math.atan2(along(east), along(south));
}

/** The render-frame direction a look-out request names: an EQJ vector, or the way from the body to the object to turn toward. Null when it names no direction. */
function lookDirectionOf(input: CameraStepInput, request: LookOutRequest): RenderVector | null {
  const { targets } = input;
  let direction: RenderVector;
  if (request.direction === undefined) {
    direction = eqjToRenderVector([1, 0, 0]);
  } else if (typeof request.direction === "string") {
    if (!canFocus(targets, request.direction)) return null;
    const from = focusAbsoluteOf(targets, request.body);
    const to = focusAbsoluteOf(targets, request.direction);
    direction = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  } else {
    direction = eqjToRenderVector(request.direction);
  }
  return direction.every(Number.isFinite) && Math.hypot(...direction) > 0 ? direction : null;
}

/** Stands the camera at the body's centre looking along the requested direction; nothing happens for a body or direction it cannot resolve. */
function applyLookOut(input: CameraStepInput, request: LookOutRequest): void {
  const { camState, targets, viewUp } = input;
  if (!canFocus(targets, request.body)) return;
  // No direction: keep the one already looked along while looking out, else right ascension 0, declination 0.
  const keep = request.direction === undefined && camState.lookOut !== null;
  const direction = lookDirectionOf(input, request);
  const angles = direction === null ? null : orbitAnglesFor(direction, viewUp);
  if (angles === null && !keep) return;
  camState.focus = request.body;
  camState.fixedPoint = null;
  camState.transition.fill(0);
  if (angles !== null && !keep) {
    camState.azimuth = camState.targetAzimuth = angles.azimuth;
    camState.elevation = camState.targetElevation = clampLookElevation(angles.elevation);
  }
  camState.lookOut = { fovDeg: clampFov(request.fovDeg ?? camState.lookOut?.fovDeg ?? LOOK_OUT_OPENING_FOV_DEG) };
}

/** Back to the orbit camera: the target tween starts from where the camera stood, not from the aiming point one unit out. */
function leaveLookOut(camState: OrbitCameraState): void {
  if (camState.lookOut === null) return;
  camState.lookOut = null;
  for (let i = 0; i < 3; i += 1) camState.targetAbsolute[i] = camState.cameraAbsolute[i];
}

function applyCameraRequest(input: CameraStepInput, request: CameraRequest): void {
  const { camState, targets, frame, catalogue, viewUp } = input;
  if (request.kind === "lookOut") return applyLookOut(input, request);
  // A hold would keep the aiming point as a place; looking out already holds the camera where it stands.
  if (request.kind === "hold" && camState.lookOut !== null) return;
  leaveLookOut(camState);
  if (request.kind === "hold") {
    // The target stops where it is (including any tween still running); angles and distance are untouched. Scene-frame state only: nothing in State changes.
    const now = cameraTargetAbsolute(camState, targets);
    camState.fixedPoint = [now[0] + camState.transition[0], now[1] + camState.transition[1], now[2] + camState.transition[2]];
    camState.transition.fill(0);
    return;
  }
  if (request.kind === "pose") {
    // The pose's offset is relative to its object, so the camera follows that object (also while it moves) and eases to the read angles and distance.
    const { view } = request;
    switchFocus(camState, view.focus, focusAbsoluteOf(targets, view.focus));
    camState.targetAzimuth = (view.azimuthDeg * Math.PI) / 180;
    camState.targetElevation = (view.elevationDeg * Math.PI) / 180;
    camState.targetDistance = view.distance;
    return;
  }
  const target = request.kind === "overview" ? frame.centre : request.target;
  const targetBody = targets.bodyIdFor(target);
  switchFocus(camState, target, focusAbsoluteOf(targets, target));
  if (request.kind !== "follow") camState.targetDistance = framingDistance(input, target, targetBody);
  const parent = targetBody === null ? undefined : catalogue.get(targetBody).definition.parentId;
  if (request.kind === "focus" && targetBody !== null && targetBody !== frame.centre && parent !== undefined && targets.placed.has(parent)) {
    faceParent(camState, targets, viewUp, targetBody, parent);
  }
}

/** A change of up direction keeps the camera where it is: the same offset from the target is re-expressed in the new orbit basis. */
function keepViewOnUpChange(camState: OrbitCameraState, previousUp: RenderVector | null, viewUp: RenderVector): void {
  if (previousUp === null || !previousUp.some((v, k) => v !== viewUp[k])) return;
  // Orbiting, the angles are of the camera's offset from its target; looking out, of the way it looks (the target is a unit ahead).
  const side = camState.lookOut === null ? 1 : -1;
  const offset = [0, 1, 2].map((k) => side * (camState.cameraAbsolute[k] - camState.targetAbsolute[k]));
  const angles = orbitAnglesFor(offset as RenderVector, viewUp);
  if (angles === null) return;
  camState.elevation = camState.targetElevation = angles.elevation;
  camState.azimuth = camState.targetAzimuth = angles.azimuth;
}

/**
 * One frame of camera decisions before the camera is posed: the opening view, a pending request, a change of up, and the zoom limits.
 * Returns the body (or other id) the camera is focused on.
 */
export function stepCameraTarget(input: CameraStepInput): string {
  const { camState, controls, targets, frame, reach, viewUp, previousUp } = input;
  const openedAtOverview = input.firstFrame && openFirstFrame(input);
  if (controls.cameraRequest) {
    const request = controls.cameraRequest;
    controls.cameraRequest = null;
    applyCameraRequest(input, request);
  }
  if (openedAtOverview) camState.distance = camState.targetDistance;
  keepViewOnUpChange(camState, previousUp, viewUp);
  const focusBody = targets.bodyIdFor(camState.focus) ?? camState.focus;
  const limits = focusLimits(focusBody, frame, targets.policy, reach);
  camState.distance = clampDistance(camState.distance, limits);
  camState.targetDistance = clampDistance(camState.targetDistance, limits);
  return focusBody;
}
