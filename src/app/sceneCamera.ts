// Scene camera: orbit-camera state, rescaling when the scale policy changes, and the per-frame target step.
import type { BodyCatalogue } from "../assets/catalogue";
import type { BodyId } from "../core/body";
import {
  clampDistance,
  switchFocus,
  type CameraRequest,
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
import { orbitAnglesFor, orbitBasis } from "./viewUp";
import type { StartView } from "./viewLink";

/** The two control fields the camera step reads and clears. */
export interface CameraControls {
  startView?: StartView;
  cameraRequest: CameraRequest | null;
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
  if (view !== undefined && canFocus(targets, view.focus)) {
    applyStartView(camState, view);
    controls.cameraRequest = null;
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

function applyCameraRequest(input: CameraStepInput, request: CameraRequest): void {
  const { camState, targets, frame, catalogue, viewUp } = input;
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
  const offset = [0, 1, 2].map((k) => camState.cameraAbsolute[k] - camState.targetAbsolute[k]);
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
