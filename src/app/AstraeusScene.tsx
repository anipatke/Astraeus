import { EQUATORIAL_UP } from "./viewUp";
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { DirectionalLight, Group, PerspectiveCamera } from "three";
import type { SimulationClock } from "../core/clock";
import type { BodyId } from "../core/body";
import type { ScalePolicy } from "../core/scalePolicy";
import type { PathView } from "./PathView";
import type { StateResolver } from "../core/stateResolver";
import { AnchorLabelLayer } from "./AnchorLabels";
import { catalogue as builtInCatalogue, rootBodyId, type BodyAsset, type BodyCatalogue } from "../assets/catalogue";
import type { SystemComposition } from "../assets/compositions";
import { BodyView, type BodyParts } from "./BodyView";
import type { BodyMarkerSettings, GlowLook } from "./bodyDraw";
import type { OrbitLook } from "../assets/orbitLook";
import {
  attachOrbitGestures,
  createOrbitCameraState,
  poseCamera,
  resolveCamera,
  type CameraRequest,
  type OrbitCameraState,
} from "./CameraController";
import type { DebugReadout } from "./DebugOverlay";
import { FloatingOrigin } from "./floatingOrigin";
import { assetWithOverride, DEFAULT_CAMERA_FAR, type CameraReach, type GroupLayer, type PathLayer, type SunBody, type VisualOverride } from "./experienceDefinition";
import type { TrackedBody } from "./mission";
import { LayeredRender } from "./LayeredRender";
import type { RenderVector } from "./renderCoordinates";
import { rescaleCameraForPolicy, stepCameraTarget } from "./sceneCamera";
import { buildFrameReadout, publishBodyData, publishPathData, publishPointsData, publishSceneData, recordFrameStats } from "./sceneDebug";
import { bodyAbsolute, placeComposition, readoutPairOf, type ScenePlacement } from "./sceneLayout";
import { bodyScreenReadouts, placeBodies, swapSmallBodiesToMarkers, type BodyRefs } from "./sceneBodies";
import { placeBodyLights } from "./sceneLights";
import { useHostLayer, useSceneViews, useSkyStars } from "./sceneHooks";
import { updateSky } from "./sceneSky";
import { focusAbsoluteOf, labelPositionOf, type SceneTargets } from "./sceneTargets";
import { viewFromAngles, type StartView } from "./viewLink";
import {
  assignBodyLayers,
  focusLimits,
  focusRadius,
  START_CAMERA_DISTANCE,
  type SceneFrame,
} from "./sceneFraming";
import type { FrameStats } from "./frameStats";
import type { GroupFill } from "./FrameRateSection";
import { TRACK_LAYER } from "./TrackedBodyView";
import { SceneLabelLayer } from "./SceneLabels";
import { BodySetLabelLayer } from "./BodySetLabels";
import { DEFAULT_BODY_SET_LOOK, familyColorOf, type BodySetLayer, type BodySetLook } from "./bodySet";
import { publishBodySets } from "./sceneBodySets";
import type { RingLook } from "../assets/rings";
import { StoryMarkerLayer, type StoryMarkerSpec } from "./StoryMarkers";
import { hideBootLoader } from "../shell/bootLoader";
import type { ExperienceObject } from "../shell/experience";

/** Floating-origin rebase threshold in scaled units (Earth radii). */
const REBASE_THRESHOLD = 1;

export interface SceneRuntime {
  /** The render-frame up vector the camera orbits about (default celestial north; see `viewUp.ts`). */
  readonly up?: RenderVector;
  /** The window looping playback wraps within: the experience's own timeline window. */
  readonly loopWindow?: { readonly startUtcMs: number; readonly endUtcMs: number };
  readonly clock: SimulationClock;
  /** The one resolver every position in the scene comes from. */
  readonly resolver: StateResolver;
  /** The catalogue the bodies come from; absent means the built-in one. */
  readonly catalogue?: BodyCatalogue;
  /** The catalogued bodies drawn, one view each, in draw order. */
  readonly bodies: readonly BodyId[];
  /** The composition the bodies come from, if the experience declares one; its paths are drawn. */
  readonly composition?: SystemComposition;
  /** The catalogued body at the scene's zero. */
  readonly sceneCenter: BodyId;
  /** Bodies the `tracked-bodies` layer draws; empty when the experience has none. */
  readonly trackedBodies: readonly TrackedBody[];
  /** Groups the `points` layer draws as dots; empty when the experience has none. */
  readonly groups: readonly GroupLayer[];
  /** Body sets drawn as batches of dots, balls and orbit lines; absent or empty when the experience has none. */
  readonly bodySets?: readonly BodySetLayer[];
  /** The Sun's shell item, if the experience declares one; the Sun itself is the catalogue's. */
  readonly sun?: SunBody;
  /** The experience's per-body presentation overrides, laid over the catalogue's records. */
  readonly overrides?: ReadonlyMap<BodyId, VisualOverride>;
  /** Paths the `sun-centred` layer draws; empty when the experience has none. */
  readonly paths?: readonly PathLayer[];
  /** The experience's declared camera reach; empty keeps the built-in limits. */
  readonly cameraReach: CameraReach;
  /** The sky behind the scene: whether it is drawn and how bright. Absent means no sky. */
  readonly sky?: { readonly visible: boolean; readonly starBrightness: number; readonly milkyWayBrightness: number; readonly milkyWay: boolean };
}

/** Diagnostic for the browser checks: how far the first orbit arc's head is from its body's drawn position, as a share of the orbit's size (`data-orbit-head-gap`) and its longest segment as a share of the same (`data-orbit-arc-segment`). */
function publishOrbitHeadGap(canvas: HTMLCanvasElement, views: readonly PathView[], absoluteOf: (id: BodyId) => RenderVector, policy: ScalePolicy): void {
  const view = views.find((candidate) => candidate.arcHeadAbsolute() !== null);
  const head = view?.arcHeadAbsolute() ?? null;
  if (view === undefined || head === null) return;
  const body = absoluteOf(view.layer.source.body as BodyId);
  const extent = view.extentUnits(policy);
  canvas.dataset.orbitArcSegment = String(extent > 0 ? view.arcLongestSegment() / extent : 0);
  canvas.dataset.orbitHeadGap = String(extent > 0 ? Math.hypot(head[0] - body[0], head[1] - body[1], head[2] - body[2]) / extent : 0);
}

export interface SceneControls {
  policy: ScalePolicy;
  cameraRequest: CameraRequest | null;
  /** Presentation only: show source-anchor ID labels beside the anchor dots. */
  showAnchorLabels: boolean;
  /** Presentation only: draw the Milky Way picture behind the stars (the stars are always drawn while the sky is). */
  showMilkyWay: boolean;
  /** Presentation only: when a sphere is too small to see it is drawn as a marker (see `drawsAsMarker`). */
  bodyMarker: BodyMarkerSettings;
  /** Presentation only: the live halo settings of a body whose record has a glow (the Sun). */
  glowLook?: GlowLook;
  /** Presentation only: live changes to the orbit look of every composition path, over each path's own settings (Developer > Display settings). */
  orbitLook?: Partial<OrbitLook>;
  /** Presentation only: the live look of the body sets (dots, names, orbit lines and family colours). Absent: the defaults. */
  bodySetLook?: BodySetLook;
  /** Presentation only: live colour and opacity per ring band, over the data's own. */
  ringLook?: RingLook;
  /** Presentation only: live sky strengths, 0 to 2, set from Developer > Display settings. */
  starBrightness: number;
  milkyWayBrightness: number;
  /** Looping playback is on (live; set from the experience, `?loop=` and Developer > Display settings). Needs `SceneRuntime.loopWindow`. */
  loop?: boolean;
  /** The render-frame up vector now in force (live; Developer > Display settings). Absent: the runtime's own. Switching it re-poses the camera in place. */
  up?: RenderVector;
  /** Ids of objects whose label is switched off (live). Their objects stay listed and selectable. */
  hiddenLabels?: Set<string>;
  readonly labelObjects: readonly ExperienceObject[];
  /** Objects that story panels name; each gets a marker that reopens its panel. */
  readonly storyMarkers?: readonly StoryMarkerSpec[];
  /** Called with the panel id when a story marker is pressed. */
  onStoryMarker?: (panelId: string) => void;
  /** The story panel now open, so its marker reads as pressed. */
  openStoryPanelId?: string | null;
  selectedObjectId: string;
  /** Frame timing, set only while Developer mode is on; null means nothing is measured. */
  frameStats: FrameStats | null;
  /** Each group's refill count, written by the scene while `frameStats` is set; read by the Developer tools poll. */
  readonly groupFills: GroupFill[];
  /** The view to open on (from `?view=` or the experience's `startView`). Used once, on the first frame; absent: today's opening. */
  startView?: StartView;
  /** The camera's current view, written every frame by the scene for "Copy view link". */
  viewReadout?: StartView;
}

export type SceneReadout = DebugReadout;

interface Props {
  readonly runtime: SceneRuntime;
  readonly controls: SceneControls;
  readonly readout: { current: SceneReadout | null };
  /** Changes when the scale policy changes so mesh radii re-render. */
  readonly scaleId: ScalePolicy["id"];
}

export function AstraeusScene(props: Props) {
  const { runtime } = props;
  const catalogue = runtime.catalogue ?? builtInCatalogue;
  const layers = useMemo(() => assignBodyLayers(runtime.bodies, TRACK_LAYER, catalogue), [runtime.bodies, catalogue]);
  const lightLayers = useMemo(() => runtime.bodies.filter((id) => catalogue.get(id).visual.light !== undefined).map((id) => layers.get(id)!), [runtime.bodies, layers, catalogue]);
  return (
    <Canvas
      camera={{ fov: 45, near: 0.05, far: runtime.cameraReach.far ?? DEFAULT_CAMERA_FAR }}
      gl={{ antialias: true }}
      style={{ background: "#000000" }}
      data-testid="earth-moon-canvas"
      data-scene-center={runtime.sceneCenter}
      data-bodies={runtime.bodies.join(",")}
      data-lighting="per-body"
      data-composition-paths={runtime.composition?.paths?.length ?? 0}
      data-point-groups={runtime.groups.length}
      data-sun-centred={(runtime.sun === undefined ? 0 : 1) + (runtime.paths?.length ?? 0)}
      data-rings={runtime.bodies.map((id) => (runtime.overrides?.get(id)?.rings ?? catalogue.get(id).visual.rings)?.bands.length ?? 0).reduce((sum, n) => sum + n, 0)}
    >
      <SceneContents {...props} layers={layers} />
      <LayeredRender lightLayers={lightLayers} />
    </Canvas>
  );
}

interface SceneContentsProps extends Props {
  readonly layers: ReadonlyMap<BodyId, number>;
}

function SceneContents({ runtime, controls, readout, layers }: SceneContentsProps) {
  const catalogue = runtime.catalogue ?? builtInCatalogue;
  const { gl, camera, size } = useThree();
  const rootRef = useRef<Group>(null);
  const groupRefs = useRef(new Map<BodyId, Group>());
  const orientRefs = useRef(new Map<BodyId, Group>());
  const lightRefs = useRef(new Map<BodyId, DirectionalLight>());
  const refFor = (map: Map<BodyId, Group>, id: BodyId) => (node: Group | null) => {
    if (node === null) map.delete(id);
    else map.set(id, node);
  };
  const partsRefs = useRef(new Map<BodyId, BodyParts>());
  // One stable callback per body, so a body's effect is not re-run by every render.
  const partsFor = useMemo(() => new Map(runtime.bodies.map((id) => [id, (parts: BodyParts | null) => {
    if (parts === null) partsRefs.current.delete(id);
    else partsRefs.current.set(id, parts);
  }] as const)), [runtime.bodies]);

  const ringLookOf = useMemo(() => () => controls.ringLook, [controls]);
  const bodyRefs: BodyRefs = { groups: groupRefs.current, orients: orientRefs.current, parts: partsRefs.current };

  const origin = useMemo(() => new FloatingOrigin(), []);
  const orbit = useRef<OrbitCameraState>(createOrbitCameraState(START_CAMERA_DISTANCE, runtime.sceneCenter));
  const started = useRef(false);
  const spanScaled = useRef(6);
  const lastPolicyId = useRef(controls.policy.id);
  const lastUp = useRef<RenderVector | null>(null);
  const placement = useMemo<ScenePlacement>(() => ({ resolver: runtime.resolver, center: runtime.sceneCenter }), [runtime.resolver, runtime.sceneCenter]);
  const readoutPair = useMemo(() => readoutPairOf(runtime.bodies, catalogue), [runtime.bodies, catalogue]);
  const pairLabels = useMemo(() => (readoutPair === null ? undefined : { parent: catalogue.get(readoutPair.parent).definition.label, child: catalogue.get(readoutPair.child).definition.label }), [readoutPair, catalogue]);
  const assets = useMemo<readonly BodyAsset[]>(() => runtime.bodies.map((id) => assetWithOverride(catalogue.get(id), runtime.overrides?.get(id))), [runtime.bodies, runtime.overrides, catalogue]);

  const { trackedViews, groupViews, sunCentredViews, compositionPaths, skyView, bodySetViews, orbitSetViews } = useSceneViews(runtime, gl);
  const bodySetLabels = useRef<BodySetLabelLayer[]>([]);
  // Families of catalogued bodies drawn outside the sets (their own orbit lines take the family colour).
  const bodyFamilies = useMemo(() => (runtime.bodySets ?? []).flatMap((layer) => Object.entries(layer.bodyFamilies ?? {}).map(([body, family]) => ({ layer, body, family }))), [runtime.bodySets]);
  const anchorLabels = useRef<AnchorLabelLayer | null>(null);
  const sceneLabels = useRef<SceneLabelLayer | null>(null);
  const storyMarkers = useRef<StoryMarkerLayer | null>(null);

  useSkyStars(gl.domElement, skyView);
  useEffect(() => {
    const host = gl.domElement.parentElement;
    if (host === null) return undefined;
    const layers = bodySetViews.map((view) => new BodySetLabelLayer(host, gl.domElement, view, (memberId) => { controls.cameraRequest = { kind: "focus", target: memberId }; }));
    bodySetLabels.current = layers;
    return () => { for (const layer of layers) layer.dispose(); bodySetLabels.current = []; };
  }, [gl, bodySetViews, controls]);
  useHostLayer(gl.domElement, anchorLabels, (host) => new AnchorLabelLayer(host, trackedViews), [gl, trackedViews]);
  useHostLayer(gl.domElement, sceneLabels, (host) => new SceneLabelLayer(host, controls.labelObjects), [gl, controls.labelObjects]);
  useHostLayer(gl.domElement, storyMarkers, (host) => (controls.storyMarkers === undefined || controls.storyMarkers.length === 0 ? null : new StoryMarkerLayer(host, controls.storyMarkers, (panelId) => controls.onStoryMarker?.(panelId))), [gl, controls]);

  /** The catalogued body a focus or label id names: the Sun's shell item stands for the Sun body. */
  const bodyIdFor = (id: string): BodyId | null => {
    if (runtime.sun !== undefined && id === runtime.sun.object.id) return rootBodyId();
    return catalogue.has(id) ? id : null;
  };

  useEffect(() => {
    const limits = () => focusLimits(bodyIdFor(orbit.current.focus) ?? orbit.current.focus, { centre: runtime.sceneCenter, span: spanScaled.current, bodies: catalogue }, controls.policy, runtime.cameraReach);
    return attachOrbitGestures(gl.domElement, orbit.current, limits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, controls]);

  useFrame((_state, delta) => {
    const root = rootRef.current;
    if (!root) return;
    const { clock, resolver, sceneCenter } = runtime;
    const viewUp = controls.up ?? runtime.up ?? EQUATORIAL_UP;
    for (const id of runtime.bodies) if (!groupRefs.current.has(id) || !orientRefs.current.has(id)) return;

    const policy = controls.policy;
    if (controls.loop === true && runtime.loopWindow !== undefined) clock.wrapWithin(runtime.loopWindow);
    const t = clock.now();
    const camState = orbit.current;
    for (const view of groupViews) view.sync(t, placement, policy);
    for (const view of sunCentredViews) view.sync(t, placement, policy);
    const setLook = controls.bodySetLook ?? DEFAULT_BODY_SET_LOOK;
    for (const view of compositionPaths) {
      if (view.defaultLook !== null) view.setLook({ ...view.defaultLook, ...controls.orbitLook });
      const owned = bodyFamilies.find((entry) => `${entry.body}-orbit` === view.id);
      if (owned !== undefined) view.setColor(familyColorOf(owned.layer, setLook, owned.family));
      view.sync(t, placement, policy);
    }
    for (const view of bodySetViews) view.sync(t, placement, policy, resolver);
    for (const view of orbitSetViews) view.sync(t, placement, policy, setLook.orbitsOn);
    recordFrameStats(controls.frameStats, controls.groupFills, groupViews);
    // Every drawn body, and the centre even when it is not drawn, measured from the scene centre.
    const composed = placeComposition(runtime.bodies, placement, policy, t);
    const absoluteOf = (id: BodyId): RenderVector =>
      composed.absolutes.get(id) ?? bodyAbsolute(resolver.stateOf(id, t, sceneCenter).positionKm, policy);
    const span = composed.span;
    if (policy.id !== lastPolicyId.current) {
      rescaleCameraForPolicy(camState, sceneCenter, span / spanScaled.current);
      lastPolicyId.current = policy.id;
    }
    spanScaled.current = span;
    const memberRadius = (id: string): number | null => {
      for (const view of bodySetViews) { const r = view.memberRadiusUnits(id); if (r !== null) return r; }
      return null;
    };
    const frame: SceneFrame = { centre: sceneCenter, span, bodies: catalogue, memberRadius };
    const targets: SceneTargets = { bodyIdFor, placed: composed.absolutes, absoluteOf, groupViews, sunCentredViews, trackedViews, bodySetViews, timeUtcMs: t, policy, placement };

    const firstFrame = !started.current;
    started.current = true;
    const focusBody = stepCameraTarget({ camState, controls, targets, frame, catalogue, reach: runtime.cameraReach, fovDeg: (camera as PerspectiveCamera).fov, viewUp, firstFrame, previousUp: lastUp.current });
    lastUp.current = viewUp;
    resolveCamera(camState, focusAbsoluteOf(targets, camState.focus), origin, delta, REBASE_THRESHOLD, viewUp);
    placeBodies(assets, composed.states, bodyRefs, policy, origin);
    poseCamera(camera as PerspectiveCamera, camState, focusRadius(focusBody, policy, catalogue), origin, runtime.cameraReach.far ?? DEFAULT_CAMERA_FAR, viewUp);
    if (firstFrame) requestAnimationFrame(hideBootLoader);
    controls.viewReadout = viewFromAngles(camState.focus, camState.azimuth, camState.elevation, camState.distance);
    const markerBodies = swapSmallBodiesToMarkers(assets, bodyRefs, camera, (camera as PerspectiveCamera).fov, size.height, policy, controls.bodyMarker);
    publishSceneData(gl.domElement, { markerBodies, viewUp, markerMinSpherePx: controls.bodyMarker.minSpherePx });
    if (skyView !== null) updateSky(skyView, camera as PerspectiveCamera, gl.domElement, controls, controls.frameStats !== null);
    for (const view of trackedViews) view.update(t, policy, origin, camera, placement);
    for (const view of groupViews) view.place(origin);
    for (const view of sunCentredViews) view.place(origin);
    for (const view of compositionPaths) view.place(origin, { fovDeg: (camera as PerspectiveCamera).fov, viewportHeightPx: size.height });
    publishOrbitHeadGap(gl.domElement, compositionPaths, absoluteOf, policy);
    const trueScale = policy.id === "true-scale";
    for (const view of bodySetViews) view.place(origin, camera as PerspectiveCamera, size.width, size.height, setLook, trueScale);
    for (const view of orbitSetViews) view.place(origin, setLook, trueScale);
    for (const layer of bodySetLabels.current) layer.update(setLook);
    publishBodySets(gl.domElement, bodySetViews, orbitSetViews, setLook);
    publishPathData(gl.domElement, [...sunCentredViews, ...compositionPaths], camera);
    publishPointsData(gl.domElement, groupViews, camera, bodySetViews);
    publishBodyData(gl.domElement, bodyScreenReadouts(assets, bodyRefs, camera, (camera as PerspectiveCamera).fov, size.height, policy, controls.glowLook));
    anchorLabels.current?.update(controls.showAnchorLabels, camera, size.width, size.height);
    const positionFor = (id: string): RenderVector | null => labelPositionOf(targets, id);
    sceneLabels.current?.update(positionFor, camera, size.width, size.height, origin, controls.selectedObjectId, controls.hiddenLabels);
    storyMarkers.current?.update(positionFor, camera, size.width, size.height, origin, controls.openStoryPanelId ?? null, t);
    placeBodyLights(assets, lightRefs.current, resolver, t);
    readout.current = buildFrameReadout({ pair: readoutPair, pairLabels, clock, resolver, absoluteOf, timeUtcMs: t, policy, origin });
  });

  return (
    <group ref={rootRef}>
      {assets.map((asset) => {
        const id = asset.definition.id;
        const layer = layers.get(id)!;
        const light = asset.visual.light;
        return (
          <group key={id}>
            <BodyView asset={asset} policy={controls.policy} layer={layer} markerLayer={TRACK_LAYER} markerPx={controls.bodyMarker.markerPx} glowLook={controls.glowLook} ringLookOf={ringLookOf} onParts={partsFor.get(id)} groupRef={refFor(groupRefs.current, id)} orientRef={refFor(orientRefs.current, id)} />
            {light !== undefined && (
              <>
                <ambientLight layers={layer} intensity={light.ambient} />
                <directionalLight
                  ref={(node: DirectionalLight | null) => {
                    if (node === null) lightRefs.current.delete(id);
                    else lightRefs.current.set(id, node);
                  }}
                  layers={layer}
                  intensity={light.directional}
                />
              </>
            )}
          </group>
        );
      })}
      {skyView !== null && <primitive object={skyView.group} />}
      {compositionPaths.map((view) => <primitive key={view.id} object={view.group} />)}
      {trackedViews.map((view) => <primitive key={view.body.id} object={view.group} />)}
      {groupViews.map((view) => <primitive key={view.id} object={view.group} />)}
      {sunCentredViews.map((view) => <primitive key={view.id} object={view.group} />)}
      {bodySetViews.map((view) => <primitive key={view.id} object={view.group} />)}
      {orbitSetViews.map((view) => <primitive key={view.id} object={view.group} />)}
    </group>
  );
}
