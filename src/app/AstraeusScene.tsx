import { EQUATORIAL_UP, orbitAnglesFor, orbitBasis } from "./viewUp";
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { DirectionalLight, Group, PerspectiveCamera, PointLight } from "three";
import type { SimulationClock } from "../core/clock";
import type { BodyId } from "../core/body";
import type { ScalePolicy } from "../core/scalePolicy";
import type { StateResolver } from "../core/stateResolver";
import { AnchorLabelLayer } from "./AnchorLabels";
import { catalogue, rootBodyId, type BodyAsset } from "../assets/catalogue";
import type { SystemComposition } from "../assets/compositions";
import { BodyView, type BodyParts } from "./BodyView";
import { drawnRadii, drawsAsMarker, projectedRadiusPx, type BodyMarkerSettings, type GlowLook } from "./bodyDraw";
import {
  attachOrbitGestures,
  clampDistance,
  createOrbitCameraState,
  poseCamera,
  resolveCamera,
  switchFocus,
  type CameraRequest,
  type FocusId,
  type OrbitCameraState,
} from "./CameraController";
import { buildDebugReadout, type DebugReadout } from "./DebugOverlay";
import { FloatingOrigin } from "./floatingOrigin";
import { assetWithOverride, DEFAULT_CAMERA_FAR, type CameraReach, type GroupLayer, type PathLayer, type SunBody, type VisualOverride } from "./experienceDefinition";
import { stateIfInBounds, type TrackedBody } from "./mission";
import { bodyLightDirections, DEFAULT_LIGHTING, sunScaledPosition, type LightingModel, type SunLightStrength } from "./lighting";
import type { RenderVector } from "./renderCoordinates";
import { bodyAbsolute, placeBody, placeComposition, readoutPairOf, type ScenePlacement } from "./sceneLayout";
import {
  assignBodyLayers,
  defaultDistance,
  fitDistance,
  focusLimits,
  focusRadius,
  GROUP_FRAMING,
  scaleLength,
  TRACKED_DEFAULT_DISTANCE,
  type SceneFrame,
} from "./sceneFraming";
import type { FrameStats } from "./frameStats";
import type { GroupFill } from "./FrameRateSection";
import { PointsView } from "./PointsView";
import { SkyView } from "./SkyView";
import { loadStarCatalogue } from "../assets/sky";
import { COMPOSITION_PATH_STYLE, PathView, compositionPathLayer, createPathViews, pathReachKm } from "./PathView";
import { TRACK_LAYER, TrackedBodyView } from "./TrackedBodyView";
import { SceneLabelLayer } from "./SceneLabels";
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
  /** The Sun's shell item, if the experience declares one; the Sun itself is the catalogue's. */
  readonly sun?: SunBody;
  /** The experience's per-body presentation overrides, laid over the catalogue's records. */
  readonly overrides?: ReadonlyMap<BodyId, VisualOverride>;
  /** Paths the `sun-centred` layer draws; empty when the experience has none. */
  readonly paths?: readonly PathLayer[];
  /** The experience's declared camera reach; empty keeps the built-in limits. */
  readonly cameraReach: CameraReach;
  /** How the Sun lights the scene; absent means each body is lit by its own Sun direction. */
  readonly lighting?: LightingModel;
  /** Single Sun light only: its strength; absent takes the strongest of the lit bodies' own values. */
  readonly sunLight?: SunLightStrength | null;
  /** The sky behind the scene: whether it is drawn and how bright. Absent means no sky. */
  readonly sky?: { readonly visible: boolean; readonly starBrightness: number; readonly milkyWayBrightness: number; readonly milkyWay: boolean };
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
  selectedObjectId: string;
  /** Frame timing, set only while Developer mode is on; null means nothing is measured. */
  frameStats: FrameStats | null;
  /** Each group's refill count, written by the scene while `frameStats` is set; read by the Developer tools poll. */
  readonly groupFills: GroupFill[];
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
  const layers = useMemo(() => assignBodyLayers(runtime.bodies, TRACK_LAYER), [runtime.bodies]);
  const lightLayers = useMemo(() => runtime.bodies.filter((id) => catalogue.get(id).visual.light !== undefined).map((id) => layers.get(id)!), [runtime.bodies, layers]);
  return (
    <Canvas
      camera={{ fov: 45, near: 0.05, far: runtime.cameraReach.far ?? DEFAULT_CAMERA_FAR }}
      gl={{ antialias: true }}
      style={{ background: "#000000" }}
      data-testid="earth-moon-canvas"
      data-scene-center={runtime.sceneCenter}
      data-bodies={runtime.bodies.join(",")}
      data-lighting={runtime.lighting ?? DEFAULT_LIGHTING}
      data-composition-paths={runtime.composition?.paths?.length ?? 0}
      data-point-groups={runtime.groups.length}
      data-sun-centred={(runtime.sun === undefined ? 0 : 1) + (runtime.paths?.length ?? 0)}
    >
      <SceneContents {...props} layers={layers} />
      <LayeredRender lightLayers={lightLayers} merged={runtime.lighting === "single-sun"} />
    </Canvas>
  );
}

/** Takes over rendering so each lit body is lit only by its own Sun direction, one pass per body. */
function LayeredRender({ lightLayers, merged }: { readonly lightLayers: readonly number[]; readonly merged: boolean }) {
  useFrame(({ gl, scene, camera }) => {
    const previousAutoClear = gl.autoClear;
    const previousMask = camera.layers.mask;
    gl.autoClear = false;
    gl.clear();
    if (merged) {
      // One Sun light lights every body, so every body is drawn in one pass.
      camera.layers.mask = lightLayers.reduce((mask, layer) => mask | (1 << layer), 1);
      gl.render(scene, camera);
      camera.layers.mask = 1 << TRACK_LAYER;
      gl.render(scene, camera);
      camera.layers.mask = previousMask;
      gl.autoClear = previousAutoClear;
      return;
    }
    // Layer 0 (paths) is drawn with the first body's pass, then every later body's pass shares the depth buffer.
    lightLayers.forEach((layer, index) => {
      camera.layers.mask = (index === 0 ? 1 : 0) | (1 << layer);
      gl.render(scene, camera);
    });
    if (lightLayers.length === 0) {
      camera.layers.mask = 1;
      gl.render(scene, camera);
    }
    camera.layers.mask = 1 << TRACK_LAYER;
    gl.render(scene, camera);
    camera.layers.mask = previousMask;
    gl.autoClear = previousAutoClear;
  }, 1);
  return null;
}

interface SceneContentsProps extends Props {
  readonly layers: ReadonlyMap<BodyId, number>;
}

function SceneContents({ runtime, controls, readout, layers }: SceneContentsProps) {
  const { gl, camera, size } = useThree();
  const rootRef = useRef<Group>(null);
  const groupRefs = useRef(new Map<BodyId, Group>());
  const orientRefs = useRef(new Map<BodyId, Group>());
  const lightRefs = useRef(new Map<BodyId, DirectionalLight>());
  const sunLight = useRef<PointLight>(null);
  const singleSun = runtime.lighting === "single-sun";
  const placed = useRef<ReadonlyMap<BodyId, RenderVector>>(new Map());
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

  const origin = useMemo(() => new FloatingOrigin(), []);
  const orbit = useRef<OrbitCameraState>(createOrbitCameraState(16, runtime.sceneCenter));
  const spanScaled = useRef(6);
  const lastPolicyId = useRef(controls.policy.id);
  const lastUp = useRef<RenderVector | null>(null);
  const placement = useMemo<ScenePlacement>(() => ({ resolver: runtime.resolver, center: runtime.sceneCenter }), [runtime.resolver, runtime.sceneCenter]);
  const readoutPair = useMemo(() => readoutPairOf(runtime.bodies), [runtime.bodies]);
  const pairLabels = useMemo(() => (readoutPair === null ? undefined : { parent: catalogue.get(readoutPair.parent).definition.label, child: catalogue.get(readoutPair.child).definition.label }), [readoutPair]);
  const assets = useMemo<readonly BodyAsset[]>(() => runtime.bodies.map((id) => assetWithOverride(catalogue.get(id), runtime.overrides?.get(id))), [runtime.bodies, runtime.overrides]);

  const trackedViews = useMemo(() => runtime.trackedBodies.map((body) => new TrackedBodyView(body)), [runtime.trackedBodies]);
  const groupViews = useMemo(() => runtime.groups.map((layer) => new PointsView(layer)), [runtime.groups]);
  const sunCentredViews = useMemo(() => createPathViews(runtime.paths ?? []), [runtime.paths]);
  const compositionPaths = useMemo(() => (runtime.composition?.paths ?? []).map((path) => new PathView(compositionPathLayer(path, runtime.resolver), COMPOSITION_PATH_STYLE)), [runtime.composition, runtime.resolver]);
  const skyView = useMemo(() => (runtime.sky?.visible ? new SkyView({ starBrightness: runtime.sky.starBrightness, milkyWayBrightness: runtime.sky.milkyWayBrightness, pixelRatio: gl.getPixelRatio(), maxAnisotropy: gl.capabilities.getMaxAnisotropy(), milkyWay: runtime.sky.milkyWay }) : null), [runtime.sky, gl]);
  const anchorLabels = useRef<AnchorLabelLayer | null>(null);
  const sceneLabels = useRef<SceneLabelLayer | null>(null);

  // The stars load from the local file when it exists; without it the Milky Way is drawn alone.
  useEffect(() => {
    if (skyView === null) return undefined;
    let cancelled = false;
    gl.domElement.dataset.skyStars = "0";
    void loadStarCatalogue().then((loaded) => {
      if (cancelled || loaded === null) return;
      skyView.setStars(loaded.stars);
      gl.domElement.dataset.skyStars = String(skyView.starCount);
    });
    return () => {
      cancelled = true;
      delete gl.domElement.dataset.skyStars;
      delete gl.domElement.dataset.skyPicture;
      delete gl.domElement.dataset.skyStarBrightness;
      skyView.dispose();
    };
  }, [gl, skyView]);

  useEffect(() => {
    const host = gl.domElement.parentElement;
    if (host === null) return undefined;
    const layer = new AnchorLabelLayer(host, trackedViews);
    anchorLabels.current = layer;
    return () => {
      layer.dispose();
      anchorLabels.current = null;
    };
  }, [gl, trackedViews]);

  useEffect(() => {
    const host = gl.domElement.parentElement;
    if (host === null) return undefined;
    const layer = new SceneLabelLayer(host, controls.labelObjects);
    sceneLabels.current = layer;
    return () => {
      layer.dispose();
      sceneLabels.current = null;
    };
  }, [gl, controls.labelObjects]);

  /** The catalogued body a focus or label id names: the Sun's shell item stands for the Sun body. */
  const bodyIdFor = (id: string): BodyId | null => {
    if (runtime.sun !== undefined && id === runtime.sun.object.id) return rootBodyId();
    return catalogue.has(id) ? id : null;
  };

  useEffect(() => {
    const limits = () => focusLimits(bodyIdFor(orbit.current.focus) ?? orbit.current.focus, { centre: runtime.sceneCenter, span: spanScaled.current }, controls.policy, runtime.cameraReach);
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
    for (const view of compositionPaths) view.sync(t, placement, policy);
    if (controls.frameStats !== null) {
      controls.frameStats.tick(performance.now());
      groupViews.forEach((view, i) => {
        const fill = controls.groupFills[i];
        if (fill === undefined) controls.groupFills[i] = { id: view.id, count: view.fillCount };
        else fill.count = view.fillCount;
      });
    }
    // Every drawn body, and the centre even when it is not drawn, measured from the scene centre.
    const composed = placeComposition(runtime.bodies, placement, policy, t);
    placed.current = composed.absolutes;
    const absoluteOf = (id: BodyId): RenderVector =>
      composed.absolutes.get(id) ?? bodyAbsolute(resolver.stateOf(id, t, sceneCenter).positionKm, policy);
    const span = composed.span;
    if (policy.id !== lastPolicyId.current) {
      // Keep the same relative framing when the visual scale changes; physical state is untouched.
      if (camState.focus === sceneCenter) camState.distance *= span / spanScaled.current;
      for (let i = 0; i < 3; i += 1) camState.transition[i] *= span / spanScaled.current;
      lastPolicyId.current = policy.id;
    }
    spanScaled.current = span;
    const frame: SceneFrame = { centre: sceneCenter, span };

    const focusAbsolute = (focus: FocusId): RenderVector => {
      const body = bodyIdFor(focus);
      if (body !== null) return absoluteOf(body);
      const group = groupViews.find((candidate) => candidate.id === focus);
      if (group) return group.absolute();
      const sunCentred = sunCentredViews.find((candidate) => candidate.id === focus);
      if (sunCentred) return sunCentred.absolute();
      const view = trackedViews.find((candidate) => candidate.body.id === focus);
      if (!view) throw new RangeError(`unknown focus target "${focus}"`);
      return view.absolute(t, policy, placement);
    };

    if (controls.cameraRequest) {
      const request = controls.cameraRequest;
      controls.cameraRequest = null;
      const target = request.kind === "overview" ? sceneCenter : request.target;
      const targetBody = bodyIdFor(target);
      switchFocus(camState, target, focusAbsolute(target));
      const framedGroup = groupViews.find((candidate) => candidate.id === target) ?? sunCentredViews.find((candidate) => candidate.id === target);
      if (request.kind !== "follow") {
        if (framedGroup) {
          const extent = framedGroup.extentUnits(policy);
          const whole = framedGroup instanceof PathView && framedGroup.fitsWhole;
          camState.targetDistance = Math.max(TRACKED_DEFAULT_DISTANCE, whole ? fitDistance(extent, (camera as PerspectiveCamera).fov) : GROUP_FRAMING * extent);
        } else if (targetBody !== null && catalogue.get(targetBody).visual.kind === "marker") {
          // A marker is a point: it is framed by how far the declared paths reach from it.
          const reachKm = pathReachKm(sunCentredViews);
          camState.targetDistance = Math.max(TRACKED_DEFAULT_DISTANCE, GROUP_FRAMING * scaleLength(policy, reachKm));
        } else {
          camState.targetDistance = defaultDistance(targetBody ?? target, frame, policy);
        }
      }
      const parent = targetBody === null ? undefined : catalogue.get(targetBody).definition.parentId;
      if (request.kind === "focus" && targetBody !== null && targetBody !== sceneCenter && parent !== undefined && placed.current.has(parent)) {
        // Start on the side of the body that faces its parent, so a phase reads as an observer on the parent sees it.
        const at = placed.current.get(targetBody)!;
        const from = placed.current.get(parent)!;
        const toParent = [from[0] - at[0], from[1] - at[1], from[2] - at[2]];
        const distance = Math.hypot(toParent[0], toParent[1], toParent[2]);
        const { east, south } = orbitBasis(viewUp);
        const along = (axis: RenderVector): number => toParent[0] * axis[0] + toParent[1] * axis[1] + toParent[2] * axis[2];
        camState.targetElevation = Math.asin(along(viewUp) / distance);
        camState.targetAzimuth = Math.atan2(along(east), along(south));
      }
    }
    // A change of up direction keeps the camera where it is: the same offset from the target is re-expressed in the new orbit basis.
    if (lastUp.current !== null && lastUp.current.some((v, k) => v !== viewUp[k])) {
      const offset = [0, 1, 2].map((k) => camState.cameraAbsolute[k] - camState.targetAbsolute[k]);
      const angles = orbitAnglesFor(offset as RenderVector, viewUp);
      if (angles !== null) {
        camState.elevation = camState.targetElevation = angles.elevation;
        camState.azimuth = camState.targetAzimuth = angles.azimuth;
      }
    }
    lastUp.current = viewUp;
    const focusBody = bodyIdFor(camState.focus) ?? camState.focus;
    const limits = focusLimits(focusBody, frame, policy, runtime.cameraReach);
    camState.distance = clampDistance(camState.distance, limits);
    camState.targetDistance = clampDistance(camState.targetDistance, limits);

    resolveCamera(camState, focusAbsolute(camState.focus), origin, delta, REBASE_THRESHOLD, viewUp);
    for (const asset of assets) {
      const id = asset.definition.id;
      const state = composed.states.get(id)!;
      const mesh = asset.definition.orientation === "none" ? null : orientRefs.current.get(id)!;
      placeBody(groupRefs.current.get(id)!, mesh, state, state.positionKm, asset.visual.textureYawRad ?? 0, policy, origin);
    }
    poseCamera(
      camera as import("three").PerspectiveCamera,
      camState,
      focusRadius(focusBody, policy),
      origin,
      runtime.cameraReach.far ?? DEFAULT_CAMERA_FAR,
      viewUp,
    );
    // The marker rule: a sphere that would be under a few pixels across is drawn as a marker at the same place. Presentation only.
    const swapped: BodyId[] = [];
    for (const asset of assets) {
      const parts = partsRefs.current.get(asset.definition.id);
      if (parts === undefined) continue;
      const at = groupRefs.current.get(asset.definition.id)!.position;
      const radiusPx = projectedRadiusPx(drawnRadii(asset.definition, policy).equatorial, at.distanceTo(camera.position), (camera as PerspectiveCamera).fov, size.height);
      const marker = drawsAsMarker(radiusPx, controls.bodyMarker);
      parts.sphere.visible = !marker;
      parts.marker.visible = marker;
      if (marker) swapped.push(asset.definition.id);
    }
    const swappedList = swapped.join(",");
    if (gl.domElement.dataset.markerBodies !== swappedList) gl.domElement.dataset.markerBodies = swappedList;
    const upText = `${viewUp[0].toFixed(6)},${viewUp[1].toFixed(6)},${viewUp[2].toFixed(6)}`;
    if (gl.domElement.dataset.cameraUp !== upText) gl.domElement.dataset.cameraUp = upText;
    const threshold = String(controls.bodyMarker.minSpherePx);
    if (gl.domElement.dataset.markerPx !== threshold) gl.domElement.dataset.markerPx = threshold;
    if (skyView !== null) {
      skyView.follow(camera as PerspectiveCamera);
      skyView.setPictureVisible(controls.showMilkyWay);
      skyView.setStarBrightness(controls.starBrightness);
      skyView.setMilkyWayBrightness(controls.milkyWayBrightness);
      const starGain = String(controls.starBrightness);
      if (gl.domElement.dataset.skyStarBrightness !== starGain) gl.domElement.dataset.skyStarBrightness = starGain;
      const picture = controls.showMilkyWay ? "on" : "off";
      if (gl.domElement.dataset.skyPicture !== picture) gl.domElement.dataset.skyPicture = picture;
      // Developer mode reads the sky back so the invariance can be checked from outside (orientation in, screen position out).
      if (controls.frameStats !== null) gl.domElement.dataset.skyProbe = JSON.stringify(skyView.probe(camera));
    }
    for (const view of trackedViews) view.update(t, policy, origin, camera, placement);
    for (const view of groupViews) view.place(origin);
    for (const view of sunCentredViews) view.place(origin);
    for (const view of compositionPaths) view.place(origin);
    anchorLabels.current?.update(controls.showAnchorLabels, camera, size.width, size.height);
    sceneLabels.current?.update((id) => {
      const body = bodyIdFor(id);
      if (body !== null) return placed.current.get(body) ?? null;
      const group = groupViews.find((candidate) => candidate.id === id);
      if (group !== undefined) return group.drawn ? group.absolute() : null;
      const sunCentred = sunCentredViews.find((candidate) => candidate.id === id);
      if (sunCentred !== undefined) return sunCentred.labelAnchor();
      const view = trackedViews.find((candidate) => candidate.body.id === id);
      if (view === undefined || stateIfInBounds(view.body, t) === null) return null;
      return view.absolute(t, policy, placement);
    }, camera, size.width, size.height, origin, controls.selectedObjectId, controls.hiddenLabels);

    if (singleSun) {
      // One point light at the Sun's scaled position, expressed from the floating origin like every other position.
      const at = origin.toLocal(sunScaledPosition(resolver, sceneCenter, policy, t));
      sunLight.current?.position.set(at[0], at[1], at[2]);
    } else {
      // Each lit body is lit along its own physical Sun direction (before any readable compression).
      const directions: Map<BodyId, RenderVector> = bodyLightDirections(assets.filter((asset) => lightRefs.current.has(asset.definition.id)).map((asset) => asset.definition.id), resolver, t);
      for (const asset of assets) {
        const light = lightRefs.current.get(asset.definition.id);
        const toSun = directions.get(asset.definition.id);
        if (light === undefined || toSun === undefined) continue;
        light.position.set(toSun[0], toSun[1], toSun[2]);
      }
    }

    if (readoutPair === null) {
      readout.current = null;
      return;
    }
    const earthAbsolute = absoluteOf(readoutPair.parent);
    const moonAbsolute = absoluteOf(readoutPair.child);
    readout.current = buildDebugReadout({
      pair: pairLabels,
      timeUtcMs: t,
      rate: clock.rate,
      policy,
      earth: resolver.stateOf(readoutPair.parent, t, rootBodyId()),
      moonFromEarth: resolver.stateOf(readoutPair.child, t, readoutPair.parent),
      sunFromEarth: resolver.sunFrom(readoutPair.parent, t),
      placed: { earthAbsolute, moonAbsolute },
      renderedDistanceUnits: Math.hypot(moonAbsolute[0] - earthAbsolute[0], moonAbsolute[1] - earthAbsolute[1], moonAbsolute[2] - earthAbsolute[2]),
      origin,
    });
  });

  const lit = assets.map((asset) => asset.visual.light).filter((light) => light !== undefined);
  const sunStrength: SunLightStrength = runtime.sunLight ?? { ambient: Math.max(0, ...lit.map((light) => light.ambient)), directional: Math.max(0, ...lit.map((light) => light.directional)) };
  return (
    <group ref={rootRef}>
      {singleSun && lit.length > 0 && (
        <>
          <ambientLight layers={0} intensity={sunStrength.ambient} />
          <pointLight ref={sunLight} layers={0} decay={0} intensity={sunStrength.directional} />
        </>
      )}
      {assets.map((asset) => {
        const id = asset.definition.id;
        const layer = layers.get(id)!;
        const light = asset.visual.light;
        return (
          <group key={id}>
            <BodyView asset={asset} policy={controls.policy} layer={layer} markerLayer={TRACK_LAYER} markerPx={controls.bodyMarker.markerPx} glowLook={controls.glowLook} onParts={partsFor.get(id)} groupRef={refFor(groupRefs.current, id)} orientRef={refFor(orientRefs.current, id)} />
            {light !== undefined && !singleSun && (
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
    </group>
  );
}
