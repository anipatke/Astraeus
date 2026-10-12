import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, Group, Line, LineBasicMaterial, type DirectionalLight } from "three";
import type { SimulationClock } from "../core/clock";
import type { BodyId } from "../core/body";
import { directionFromCenterToSun } from "../core/illumination";
import type { ScalePolicy } from "../core/scalePolicy";
import type { StateResolver } from "../core/stateResolver";
import type { Trajectory } from "../core/trajectory";
import { AnchorLabelLayer } from "./AnchorLabels";
import { catalogue, type BodyAsset } from "../assets/catalogue";
import type { CompositionPath, SystemComposition } from "../assets/compositions";
import { BodyView } from "./BodyView";
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
import { DEFAULT_CAMERA_FAR, type CameraReach, type GroupLayer, type PathLayer, type SunBody } from "./experienceDefinition";
import { stateIfInBounds, type TrackedBody } from "./mission";
import {
  DEFAULT_PATH_SAMPLES,
  mapOrbitPath,
  pathNeedsRefresh,
  sampleOrbitPath,
  type OrbitPathSamples,
} from "./orbitPath";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import { bodyAbsolute, placeBody, placeComposition, sceneOffsetKm, type ScenePlacement } from "./sceneLayout";
import {
  assignBodyLayers,
  defaultDistance,
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
import { createSunCentredViews, pathReachKm } from "./SunCentredView";
import { TRACK_LAYER, TrackedBodyView } from "./TrackedBodyView";
import { SceneLabelLayer } from "./SceneLabels";
import type { ExperienceObject } from "../shell/experience";

/** Floating-origin rebase threshold in scaled units (Earth radii). */
const REBASE_THRESHOLD = 1;

export interface SceneRuntime {
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
  /** Presentation of the Sun body (colour, marker size) and its shell item, if the experience declares one. */
  readonly sun?: SunBody;
  /** Paths the `sun-centred` layer draws; empty when the experience has none. */
  readonly paths?: readonly PathLayer[];
  /** The experience's declared camera reach; empty keeps the built-in limits. */
  readonly cameraReach: CameraReach;
}

export interface SceneControls {
  policy: ScalePolicy;
  cameraRequest: CameraRequest | null;
  /** Presentation only: show source-anchor ID labels beside the anchor dots. */
  showAnchorLabels: boolean;
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
      data-earth-moon={runtime.bodies.includes("earth") && runtime.bodies.includes("moon")}
      data-scene-center={runtime.sceneCenter}
      data-bodies={runtime.bodies.join(",")}
      data-point-groups={runtime.groups.length}
      data-sun-centred={(runtime.sun === undefined ? 0 : 1) + (runtime.paths?.length ?? 0)}
    >
      <SceneContents {...props} layers={layers} />
      <LayeredRender lightLayers={lightLayers} />
    </Canvas>
  );
}

/** Takes over rendering so each lit body is lit only by its own Sun direction, one pass per body. */
function LayeredRender({ lightLayers }: { readonly lightLayers: readonly number[] }) {
  useFrame(({ gl, scene, camera }) => {
    const previousAutoClear = gl.autoClear;
    const previousMask = camera.layers.mask;
    gl.autoClear = false;
    gl.clear();
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

interface OrbitLine {
  readonly path: CompositionPath;
  readonly parent: BodyId;
  readonly source: Trajectory;
  readonly line: Line;
  samples: OrbitPathSamples | null;
  mappedFor: string;
  mapped: Float64Array | null;
  builtRealMs: number;
}

function createOrbitLine(path: CompositionPath, resolver: StateResolver): OrbitLine {
  const parent = catalogue.get(path.body).definition.parentId;
  if (parent === undefined) throw new RangeError(`path body "${path.body}" has no parent to orbit`);
  const geometry = new BufferGeometry();
  const count = path.samples ?? DEFAULT_PATH_SAMPLES;
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
  const line = new Line(geometry, new LineBasicMaterial({ color: "#f0e6da", transparent: true, opacity: 0.45 }));
  line.frustumCulled = false;
  // The body's positions about its parent, from the resolver: the centre argument sampleOrbitPath passes is the parent already.
  const source: Trajectory = { body: path.body, stateAt: (timeUtcMs) => resolver.stateOf(path.body, timeUtcMs, parent) };
  return { path, parent, source, line, samples: null, mappedFor: "", mapped: null, builtRealMs: Number.NEGATIVE_INFINITY };
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
  const placed = useRef<ReadonlyMap<BodyId, RenderVector>>(new Map());
  const refFor = (map: Map<BodyId, Group>, id: BodyId) => (node: Group | null) => {
    if (node === null) map.delete(id);
    else map.set(id, node);
  };

  const origin = useMemo(() => new FloatingOrigin(), []);
  const orbit = useRef<OrbitCameraState>(createOrbitCameraState(16));
  const spanScaled = useRef(6);
  const lastPolicyId = useRef(controls.policy.id);
  const placement = useMemo<ScenePlacement>(() => ({ resolver: runtime.resolver, center: runtime.sceneCenter }), [runtime.resolver, runtime.sceneCenter]);
  const assets = useMemo<readonly BodyAsset[]>(() => runtime.bodies.map((id) => catalogue.get(id)), [runtime.bodies]);

  const trackedViews = useMemo(() => runtime.trackedBodies.map((body) => new TrackedBodyView(body)), [runtime.trackedBodies]);
  const groupViews = useMemo(() => runtime.groups.map((layer) => new PointsView(layer)), [runtime.groups]);
  const sunCentredViews = useMemo(() => createSunCentredViews(runtime.paths ?? []), [runtime.paths]);
  const orbitLines = useMemo(() => (runtime.composition?.paths ?? []).map((path) => createOrbitLine(path, runtime.resolver)), [runtime.composition, runtime.resolver]);
  const anchorLabels = useRef<AnchorLabelLayer | null>(null);
  const sceneLabels = useRef<SceneLabelLayer | null>(null);

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
    if (runtime.sun !== undefined && id === runtime.sun.object.id) return "sun";
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
    for (const id of runtime.bodies) if (!groupRefs.current.has(id) || !orientRefs.current.has(id)) return;

    const policy = controls.policy;
    const t = clock.now();
    const camState = orbit.current;
    for (const view of groupViews) view.sync(t, placement, policy);
    for (const view of sunCentredViews) view.sync(t, placement, policy);
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
          camState.targetDistance = Math.max(TRACKED_DEFAULT_DISTANCE, GROUP_FRAMING * framedGroup.extentUnits(policy));
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
        camState.targetElevation = Math.asin(toParent[1] / distance);
        camState.targetAzimuth = Math.atan2(toParent[0], toParent[2]);
      }
    }
    const focusBody = bodyIdFor(camState.focus) ?? camState.focus;
    const limits = focusLimits(focusBody, frame, policy, runtime.cameraReach);
    camState.distance = clampDistance(camState.distance, limits);
    camState.targetDistance = clampDistance(camState.targetDistance, limits);

    resolveCamera(camState, focusAbsolute(camState.focus), origin, delta, REBASE_THRESHOLD);
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
    );
    for (const view of trackedViews) view.update(t, policy, origin, camera, placement);
    for (const view of groupViews) view.place(origin);
    for (const view of sunCentredViews) view.place(origin);
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
    }, camera, size.width, size.height, origin, controls.selectedObjectId);

    // Each lit body is lit along its own physical Sun direction (before any readable compression).
    for (const asset of assets) {
      const light = lightRefs.current.get(asset.definition.id);
      if (light === undefined) continue;
      const toSun = eqjToRenderVector(directionFromCenterToSun(resolver.sunFrom(asset.definition.id, t)));
      light.position.set(toSun[0], toSun[1], toSun[2]);
    }
    for (const line of orbitLines) updateOrbitLine(line, placement, policy, origin, t);

    if (!runtime.bodies.includes("earth") || !runtime.bodies.includes("moon")) {
      readout.current = null;
      return;
    }
    const earthAbsolute = absoluteOf("earth");
    const moonAbsolute = absoluteOf("moon");
    readout.current = buildDebugReadout({
      timeUtcMs: t,
      rate: clock.rate,
      policy,
      earth: resolver.stateOf("earth", t, "sun"),
      moonFromEarth: resolver.stateOf("moon", t, "earth"),
      sunFromEarth: resolver.sunFrom("earth", t),
      placed: { earthAbsolute, moonAbsolute },
      renderedDistanceUnits: Math.hypot(moonAbsolute[0] - earthAbsolute[0], moonAbsolute[1] - earthAbsolute[1], moonAbsolute[2] - earthAbsolute[2]),
      origin,
    });
  });

  return (
    <group ref={rootRef}>
      {assets.map((asset) => {
        const id = asset.definition.id;
        const layer = layers.get(id)!;
        const light = asset.visual.light;
        const override = id === "sun" && runtime.sun !== undefined ? { color: runtime.sun.color, sizePx: runtime.sun.markerSizePx } : undefined;
        return (
          <group key={id}>
            <BodyView asset={asset} policy={controls.policy} layer={layer} groupRef={refFor(groupRefs.current, id)} orientRef={refFor(orientRefs.current, id)} markerOverride={override} />
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
      {orbitLines.map((orbitLine) => <primitive key={orbitLine.path.body} object={orbitLine.line} />)}
      {trackedViews.map((view) => <primitive key={view.body.id} object={view.group} />)}
      {groupViews.map((view) => <primitive key={view.id} object={view.group} />)}
      {sunCentredViews.map((view) => <primitive key={view.id} object={view.group} />)}
    </group>
  );
}

/**
 * A co-moving orbit: the body's positions about its parent over the declared span, carried with the parent, so the line
 * sits at the parent's position from the scene centre at the clock time. A scene centred on the parent draws the samples as they are.
 */
function updateOrbitLine(orbitLine: OrbitLine, placement: ScenePlacement, policy: ScalePolicy, origin: FloatingOrigin, timeUtcMs: number): void {
  const realNow = performance.now();
  let rebuilt = false;
  if (pathNeedsRefresh(orbitLine.samples, timeUtcMs, realNow, orbitLine.builtRealMs)) {
    orbitLine.samples = sampleOrbitPath(orbitLine.source, timeUtcMs, orbitLine.path.spanMs, orbitLine.path.samples);
    orbitLine.builtRealMs = realNow;
    rebuilt = true;
  }
  const samples = orbitLine.samples;
  if (!samples) return;
  const offset = sceneOffsetKm(placement, orbitLine.parent, timeUtcMs);
  let mapped: Float64Array;
  if (offset === null) {
    if (rebuilt || orbitLine.mappedFor !== policy.id || orbitLine.mapped === null) {
      orbitLine.mapped = mapOrbitPath(samples, policy);
      orbitLine.mappedFor = policy.id;
    }
    mapped = orbitLine.mapped;
  } else {
    const shifted = Float64Array.from(samples.positionsKm);
    for (let i = 0; i < shifted.length; i += 3) {
      shifted[i] += offset[0];
      shifted[i + 1] += offset[1];
      shifted[i + 2] += offset[2];
    }
    mapped = mapOrbitPath({ timesUtcMs: samples.timesUtcMs, positionsKm: shifted }, policy);
    orbitLine.mapped = null;
  }
  const positions = orbitLine.line.geometry.getAttribute("position") as BufferAttribute;
  const local: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < samples.timesUtcMs.length; i += 1) {
    origin.toLocal(eqjToRenderVector(mapped.subarray(i * 3, i * 3 + 3)), local);
    positions.setXYZ(i, local[0], local[1], local[2]);
  }
  positions.needsUpdate = true;
}
