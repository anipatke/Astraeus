// Scene targets: what the camera can focus on and where labels sit, across bodies, paths and groups.
import type { BodyId } from "../core/body";
import type { ScalePolicy } from "../core/scalePolicy";
import type { FocusId } from "./CameraController";
import { stateIfInBounds } from "./mission";
import type { PathView } from "./PathView";
import type { PointsView } from "./PointsView";
import type { RenderVector } from "./renderCoordinates";
import type { ScenePlacement } from "./sceneLayout";
import type { TrackedBodyView } from "./TrackedBodyView";

/** What a focus, camera or label id can name in one frame: a catalogued body, a point group, a path or a tracked body. */
export interface SceneTargets {
  /** The catalogued body an id names: the Sun's shell item stands for the Sun body. */
  readonly bodyIdFor: (id: string) => BodyId | null;
  /** Where each drawn body was placed this frame, measured from the scene centre. */
  readonly placed: ReadonlyMap<BodyId, RenderVector>;
  readonly absoluteOf: (id: BodyId) => RenderVector;
  readonly groupViews: readonly PointsView[];
  readonly sunCentredViews: readonly PathView[];
  readonly trackedViews: readonly TrackedBodyView[];
  readonly timeUtcMs: number;
  readonly policy: ScalePolicy;
  readonly placement: ScenePlacement;
}

/** Where a focus target is; throws for an id nothing in the scene answers to. */
export function focusAbsoluteOf(targets: SceneTargets, focus: FocusId): RenderVector {
  const body = targets.bodyIdFor(focus);
  if (body !== null) return targets.absoluteOf(body);
  const group = targets.groupViews.find((candidate) => candidate.id === focus);
  if (group) return group.absolute();
  const sunCentred = targets.sunCentredViews.find((candidate) => candidate.id === focus);
  if (sunCentred) return sunCentred.absolute();
  const view = targets.trackedViews.find((candidate) => candidate.body.id === focus);
  if (!view) throw new RangeError(`unknown focus target "${focus}"`);
  return view.absolute(targets.timeUtcMs, targets.policy, targets.placement);
}

export function canFocus(targets: SceneTargets, focus: FocusId): boolean {
  try { focusAbsoluteOf(targets, focus); return true; } catch { return false; }
}

/** The point group or path an id names, which the camera frames by its extent. */
export function framedViewOf(targets: SceneTargets, id: string): PointsView | PathView | undefined {
  return targets.groupViews.find((candidate) => candidate.id === id) ?? targets.sunCentredViews.find((candidate) => candidate.id === id);
}

/** Where a label or story marker for an id is anchored, or null when that thing is not drawn now. */
export function labelPositionOf(targets: SceneTargets, id: string): RenderVector | null {
  const body = targets.bodyIdFor(id);
  if (body !== null) return targets.placed.get(body) ?? null;
  const group = targets.groupViews.find((candidate) => candidate.id === id);
  if (group !== undefined) return group.drawn ? group.absolute() : null;
  const sunCentred = targets.sunCentredViews.find((candidate) => candidate.id === id);
  if (sunCentred !== undefined) return sunCentred.labelAnchor();
  const view = targets.trackedViews.find((candidate) => candidate.body.id === id);
  if (view === undefined || stateIfInBounds(view.body, targets.timeUtcMs) === null) return null;
  return view.absolute(targets.timeUtcMs, targets.policy, targets.placement);
}
