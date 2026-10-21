// Scene frame: one frame of the scene as named stages over one frame context. The React component keeps refs and effects; the work is here.
import type { DirectionalLight, PerspectiveCamera } from "three";
import type { BodyId } from "../core/body";
import type { ScalePolicy } from "../core/scalePolicy";
import type { BodyAsset, BodyCatalogue } from "../assets/catalogue";
import { hideBootLoader } from "../shell/bootLoader";
import type { AnchorLabelLayer } from "./AnchorLabels";
import type { BodyParts } from "./BodyView";
import { drawnRadii } from "./bodyDraw";
import type { BodySetLabelLayer } from "./BodySetLabels";
import { DEFAULT_BODY_SET_LOOK, familyColorOf, type BodySetLayer, type BodySetLook } from "./bodySet";
import { poseCamera, resolveCamera, type OrbitCameraState } from "./CameraController";
import { DEFAULT_CAMERA_FAR } from "./experienceDefinition";
import { DEFAULT_FEATURE_MIN_BODY_PX, type FeatureHost, type FeatureMarkerLayer } from "./FeatureMarkers";
import type { FloatingOrigin } from "./floatingOrigin";
import type { PathView } from "./PathView";
import type { RenderVector } from "./renderCoordinates";
import { rescaleCameraForPolicy, stepCameraTarget } from "./sceneCamera";
import type { SceneControls, SceneReadout, SceneRuntime } from "./AstraeusScene";
import { buildFrameReadout, publishBodyData, publishPathData, publishPointsData, publishSceneData, recordFrameStats } from "./sceneDebug";
import { focusRadius, type SceneFrame } from "./sceneFraming";
import { bodyScreenReadouts, placeBodies, swapSmallBodiesToMarkers, type BodyRefs } from "./sceneBodies";
import { publishBodySets } from "./sceneBodySets";
import type { useSceneViews } from "./sceneHooks";
import { bodyAbsolute, placeComposition, type PlacedComposition, type ScenePlacement } from "./sceneLayout";
import { placeBodyLights } from "./sceneLights";
import { clampHoverBrightness, HOVER_BRIGHTNESS_DEFAULT, hoverTarget, pickCandidatesOf, type PickCandidate } from "./scenePicking";
import type { SceneLabelLayer } from "./SceneLabels";
import { updateSky } from "./sceneSky";
import { focusAbsoluteOf, labelPositionOf, type SceneTargets } from "./sceneTargets";
import type { StoryMarkerLayer } from "./StoryMarkers";
import { viewFromAngles } from "./viewLink";
import { EQUATORIAL_UP } from "./viewUp";

/** Floating-origin rebase threshold in scaled units (Earth radii). */
const REBASE_THRESHOLD = 1;

/** What survives from one frame to the next. The component owns one and hands it to every frame. */
export interface FrameState {
  started: boolean;
  /** The composition's span of the previous frame, in scaled units. */
  spanScaled: number;
  lastPolicyId: ScalePolicy["id"];
  lastUp: RenderVector | null;
  /** What a tap can select this frame (see `scenePicking.ts`). */
  pickables: readonly PickCandidate[];
  /** The mouse's place over the canvas in CSS px while it hovers with no button down; null for touch, a drag or outside. */
  hoverPoint: { x: number; y: number } | null;
}

export function createFrameState(policyId: ScalePolicy["id"]): FrameState {
  return { started: false, spanScaled: 6, lastPolicyId: policyId, lastUp: null, pickables: [], hoverPoint: null };
}

/** The DOM layers the frame updates; each is absent until its host mounts it. */
export interface FrameLayers {
  readonly bodySetLabels: { current: BodySetLabelLayer[] };
  readonly anchorLabels: { current: AnchorLabelLayer | null };
  readonly sceneLabels: { current: SceneLabelLayer | null };
  readonly storyMarkers: { current: StoryMarkerLayer | null };
  readonly featureMarkers: { current: FeatureMarkerLayer | null };
}

/** Everything one frame reads: nothing here is React state. */
export interface FrameContext {
  readonly runtime: SceneRuntime;
  readonly controls: SceneControls;
  readonly readout: { current: SceneReadout | null };
  readonly catalogue: BodyCatalogue;
  readonly camera: PerspectiveCamera;
  readonly canvas: HTMLCanvasElement;
  readonly size: { readonly width: number; readonly height: number };
  readonly origin: FloatingOrigin;
  readonly orbit: OrbitCameraState;
  readonly state: FrameState;
  readonly delta: number;
  readonly assets: readonly BodyAsset[];
  readonly bodyRefs: BodyRefs;
  readonly lightRefs: ReadonlyMap<BodyId, DirectionalLight>;
  readonly placement: ScenePlacement;
  readonly views: ReturnType<typeof useSceneViews>;
  readonly layers: FrameLayers;
  readonly bodyFamilies: readonly { readonly layer: BodySetLayer; readonly body: string; readonly family: string }[];
  readonly bodyIdFor: (id: string) => BodyId | null;
  readonly readoutPair: { readonly parent: BodyId; readonly child: BodyId } | null;
  readonly pairLabels: { readonly parent: string; readonly child: string } | undefined;
}

/** What the stages after the placement need: the placed composition and where any body stands. */
export interface PlacedScene {
  readonly composed: PlacedComposition;
  readonly absoluteOf: (id: BodyId) => RenderVector;
  readonly span: number;
}

/** What the stages after the camera step need. */
export interface CameraStep {
  readonly targets: SceneTargets;
}

/** The render-frame up vector in force this frame. */
export function viewUpOf(ctx: Pick<FrameContext, "runtime" | "controls">): RenderVector {
  return ctx.controls.up ?? ctx.runtime.up ?? EQUATORIAL_UP;
}

/** A frame is drawn only once every body's group and orientation node is mounted. */
export function bodiesMounted(runtime: SceneRuntime, refs: BodyRefs): boolean {
  return runtime.bodies.every((id) => refs.groups.has(id) && refs.orients.has(id));
}

/** Stage 0: the time of this frame; looping playback wraps inside its window first. */
export function frameTime(runtime: SceneRuntime, controls: Pick<SceneControls, "loop">): number {
  if (controls.loop === true && runtime.loopWindow !== undefined) runtime.clock.wrapWithin(runtime.loopWindow);
  return runtime.clock.now();
}

/** Stage 1: brings every view to the time of the frame. Returns the live body-set look. */
export function syncViews(ctx: FrameContext, t: number): BodySetLook {
  const { controls, runtime, placement, views } = ctx;
  const policy = controls.policy;
  const setLook = controls.bodySetLook ?? DEFAULT_BODY_SET_LOOK;
  for (const view of views.groupViews) view.sync(t, placement, policy);
  for (const view of views.sunCentredViews) view.sync(t, placement, policy);
  for (const view of views.compositionPaths) {
    if (view.defaultLook !== null) view.setLook({ ...view.defaultLook, ...controls.orbitLook });
    const owned = ctx.bodyFamilies.find((entry) => `${entry.body}-orbit` === view.id);
    if (owned !== undefined) view.setColor(setLook.highlightFamily === owned.family ? setLook.highlightColor : familyColorOf(owned.layer, setLook, owned.family));
    view.sync(t, placement, policy);
  }
  for (const view of views.bodySetViews) view.sync(t, placement, policy, runtime.resolver);
  for (const view of views.orbitSetViews) view.sync(t, placement, policy, setLook.orbitsOn);
  recordFrameStats(controls.frameStats, controls.groupFills, views.groupViews);
  return setLook;
}

/** Stage 2: places the composition about the scene centre and keeps the camera's framing when the scale policy changed. */
export function placeScene(ctx: FrameContext, t: number): PlacedScene {
  const { runtime, placement, state } = ctx;
  const policy = ctx.controls.policy;
  // Every drawn body, and the centre even when it is not drawn, measured from the scene centre.
  const composed = placeComposition(runtime.bodies, placement, policy, t);
  const absoluteOf = (id: BodyId): RenderVector => composed.absolutes.get(id) ?? bodyAbsolute(runtime.resolver.stateOf(id, t, runtime.sceneCenter).positionKm, policy);
  const span = composed.span;
  if (policy.id !== state.lastPolicyId) {
    rescaleCameraForPolicy(ctx.orbit, runtime.sceneCenter, span / state.spanScaled);
    state.lastPolicyId = policy.id;
  }
  state.spanScaled = span;
  return { composed, absoluteOf, span };
}

/** Stage 3: steps the camera's target, moves the origin, places the bodies and poses the camera. The first frame uses the start view and hides the boot loader. */
export function stepAndPoseCamera(ctx: FrameContext, t: number, placed: PlacedScene): CameraStep {
  const { runtime, controls, camera, orbit, state, catalogue, views } = ctx;
  const policy = controls.policy;
  const viewUp = viewUpOf(ctx);
  const memberRadius = (id: string): number | null => {
    for (const view of views.bodySetViews) { const r = view.memberRadiusUnits(id); if (r !== null) return r; }
    return null;
  };
  const frame: SceneFrame = { centre: runtime.sceneCenter, span: placed.span, bodies: catalogue, memberRadius };
  const targets: SceneTargets = { bodyIdFor: ctx.bodyIdFor, placed: placed.composed.absolutes, absoluteOf: placed.absoluteOf, groupViews: views.groupViews, sunCentredViews: views.sunCentredViews, trackedViews: views.trackedViews, bodySetViews: views.bodySetViews, timeUtcMs: t, policy, placement: ctx.placement };
  const firstFrame = !state.started;
  state.started = true;
  const focusBody = stepCameraTarget({ camState: orbit, controls, targets, frame, catalogue, reach: runtime.cameraReach, fovDeg: camera.fov, viewUp, firstFrame, previousUp: state.lastUp });
  state.lastUp = viewUp;
  resolveCamera(orbit, focusAbsoluteOf(targets, orbit.focus), ctx.origin, ctx.delta, REBASE_THRESHOLD, viewUp);
  placeBodies(ctx.assets, placed.composed.states, ctx.bodyRefs, policy, ctx.origin);
  poseCamera(camera, orbit, focusRadius(focusBody, policy, catalogue), ctx.origin, runtime.cameraReach.far ?? DEFAULT_CAMERA_FAR, viewUp);
  if (firstFrame) requestAnimationFrame(hideBootLoader);
  controls.viewReadout = viewFromAngles(orbit.focus, orbit.azimuth, orbit.elevation, orbit.distance);
  return { targets };
}

/** Diagnostic for the browser checks: how far the first orbit arc's head is from its body's drawn position, as a share of the orbit's size (`data-orbit-head-gap`) and its longest segment as a share of the same (`data-orbit-arc-segment`). */
export function publishOrbitHeadGap(canvas: HTMLCanvasElement, views: readonly PathView[], absoluteOf: (id: BodyId) => RenderVector, policy: ScalePolicy): void {
  const view = views.find((candidate) => candidate.arcHeadAbsolute() !== null);
  const head = view?.arcHeadAbsolute() ?? null;
  if (view === undefined || head === null) return;
  const body = absoluteOf(view.layer.source.body as BodyId);
  const extent = view.extentUnits(policy);
  canvas.dataset.orbitArcSegment = String(extent > 0 ? view.arcLongestSegment() / extent : 0);
  canvas.dataset.orbitHeadGap = String(extent > 0 ? Math.hypot(head[0] - body[0], head[1] - body[1], head[2] - body[2]) / extent : 0);
}

/** Stage 4: swaps small bodies for markers, publishes the scene's canvas readouts and updates the sky. */
export function publishCanvasReadouts(ctx: FrameContext): void {
  const { controls, camera, canvas, size, views } = ctx;
  const markerBodies = swapSmallBodiesToMarkers(ctx.assets, ctx.bodyRefs, camera, camera.fov, size.height, controls.policy, controls.bodyMarker);
  publishSceneData(canvas, { markerBodies, viewUp: viewUpOf(ctx), markerMinSpherePx: controls.bodyMarker.minSpherePx });
  if (views.skyView !== null) updateSky(views.skyView, camera, canvas, controls, controls.frameStats !== null);
}

/** Stage 5: places every view about the floating origin and publishes the views' readouts. Returns the hover brightness gain. */
export function placeViews(ctx: FrameContext, t: number, placed: PlacedScene, setLook: BodySetLook): number {
  const { controls, camera, canvas, size, views, origin } = ctx;
  const policy = controls.policy;
  for (const view of views.trackedViews) view.update(t, policy, origin, camera, ctx.placement);
  for (const view of views.groupViews) view.place(origin);
  for (const view of views.sunCentredViews) view.place(origin);
  for (const view of views.compositionPaths) view.place(origin, { fovDeg: camera.fov, viewportHeightPx: size.height });
  publishOrbitHeadGap(canvas, views.compositionPaths, placed.absoluteOf, policy);
  const trueScale = policy.id === "true-scale";
  for (const view of views.bodySetViews) view.place(origin, camera, size.width, size.height, setLook, trueScale);
  for (const view of views.orbitSetViews) view.place(origin, setLook, trueScale);
  const hoverGain = clampHoverBrightness(controls.hoverBrightness ?? HOVER_BRIGHTNESS_DEFAULT);
  for (const layer of ctx.layers.bodySetLabels.current) layer.update(setLook, hoverGain);
  publishBodySets(canvas, views.bodySetViews, views.orbitSetViews, setLook, camera, size.width, size.height);
  publishPathData(canvas, [...views.sunCentredViews, ...views.compositionPaths], camera);
  publishPointsData(canvas, views.groupViews, camera, views.bodySetViews);
  return hoverGain;
}

/** A mounted body's drawn sphere and radius for the feature markers, or null when the body is not drawn as a sphere. */
export function featureHostOf(assets: readonly BodyAsset[], parts: ReadonlyMap<BodyId, BodyParts>, id: string, policy: ScalePolicy): FeatureHost | null {
  const sphere = parts.get(id as BodyId)?.sphere;
  const asset = assets.find((candidate) => candidate.definition.id === id);
  return sphere === undefined || asset === undefined ? null : { sphere, radius: drawnRadii(asset.definition, policy).equatorial };
}

/** Stage 6: updates the overlay layers (names, story and feature markers) and rebuilds what a tap or hover can pick. */
export function updateOverlays(ctx: FrameContext, t: number, step: CameraStep, hoverGain: number): void {
  const { controls, camera, canvas, size, origin, state, layers } = ctx;
  const bodyScreens = bodyScreenReadouts(ctx.assets, ctx.bodyRefs, camera, camera.fov, size.height, controls.policy, controls.glowLook);
  publishBodyData(canvas, bodyScreens);
  layers.anchorLabels.current?.update(controls.showAnchorLabels, camera, size.width, size.height);
  const positionFor = (id: string): RenderVector | null => labelPositionOf(step.targets, id);
  layers.sceneLabels.current?.update(positionFor, camera, size.width, size.height, origin, controls.selectedObjectId, controls.hiddenLabels);
  state.pickables = pickCandidatesOf({ objects: controls.labelObjects, bodyIdFor: ctx.bodyIdFor, bodyScreens, widthPx: size.width, heightPx: size.height, labelRects: layers.sceneLabels.current?.shownRects, canvas, bodySetViews: ctx.views.bodySetViews });
  const hover = state.hoverPoint === null ? null : hoverTarget(state.pickables, state.hoverPoint.x, state.hoverPoint.y, "mouse");
  canvas.style.cursor = hover === null ? "" : "pointer";
  canvas.dataset.pickHover = hover ?? "";
  layers.sceneLabels.current?.setHover(hover, hoverGain);
  layers.storyMarkers.current?.update(positionFor, camera, size.width, size.height, origin, controls.openStoryPanelId ?? null, t);
  const featureReadout = layers.featureMarkers.current?.update((id) => featureHostOf(ctx.assets, ctx.bodyRefs.parts, id, controls.policy), camera, camera.fov, size.width, size.height, controls.openFeatureKey ?? null, controls.featureMinBodyPx ?? DEFAULT_FEATURE_MIN_BODY_PX);
  if (featureReadout !== null && featureReadout !== undefined) canvas.dataset.featureMarkers = JSON.stringify(featureReadout);
}

/** Stage 7: places each body's light and builds the frame readout the shell reads. */
export function placeLightsAndReadout(ctx: FrameContext, t: number, placed: PlacedScene): void {
  const { runtime, controls } = ctx;
  placeBodyLights(ctx.assets, ctx.lightRefs, runtime.resolver, t);
  ctx.readout.current = buildFrameReadout({ pair: ctx.readoutPair, pairLabels: ctx.pairLabels, clock: runtime.clock, resolver: runtime.resolver, absoluteOf: placed.absoluteOf, timeUtcMs: t, policy: controls.policy, origin: ctx.origin });
}

/** One frame, in order. The caller has checked `bodiesMounted`. */
export function runFrame(ctx: FrameContext): void {
  const t = frameTime(ctx.runtime, ctx.controls);
  const setLook = syncViews(ctx, t);
  const placed = placeScene(ctx, t);
  const step = stepAndPoseCamera(ctx, t, placed);
  publishCanvasReadouts(ctx);
  const hoverGain = placeViews(ctx, t, placed, setLook);
  updateOverlays(ctx, t, step, hoverGain);
  placeLightsAndReadout(ctx, t, placed);
}
