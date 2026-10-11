import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, Group, Line, LineBasicMaterial, type DirectionalLight } from "three";
import type { SimulationClock } from "../core/clock";
import type { AstronomyAdapter } from "../core/astronomyAdapter";
import { EARTH, MOON } from "../core/body";
import { directionFromCenterToSun, directionToSun } from "../core/illumination";
import type { MoonTrajectory } from "../core/moonTrajectory";
import { earthStateAt, sunPositionFromEarthAt } from "../core/referenceCenters";
import type { ScalePolicy } from "../core/scalePolicy";
import type { State } from "../core/state";
import { AnchorLabelLayer } from "./AnchorLabels";
import { catalogue } from "../assets/catalogue";
import { BodyView } from "./BodyView";
import {
  attachOrbitGestures,
  clampDistance,
  createOrbitCameraState,
  poseCamera,
  resolveCamera,
  switchFocus,
  type FocusId,
  type CameraRequest,
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
import { bodyAbsolutes, placeBodies, type SceneHierarchy } from "./sceneLayout";
import type { FrameStats } from "./frameStats";
import type { GroupFill } from "./FrameRateSection";
import { PointsView } from "./PointsView";
import { createSunCentredViews } from "./SunCentredView";
import { TRACK_LAYER, TrackedBodyView } from "./TrackedBodyView";
import { SceneLabelLayer } from "./SceneLabels";
import type { ExperienceObject } from "../shell/experience";

// Render passes: Earth (layer 1) and Moon (layer 2) each get their own physical Sun direction.
const EARTH_LAYER = 1;
const MOON_LAYER = 2;
const EARTH_ASSET = catalogue.get("earth");
const MOON_ASSET = catalogue.get("moon");
const EARTH_LIGHT = EARTH_ASSET.visual.light!;
const MOON_LIGHT = MOON_ASSET.visual.light!;
/** Floating-origin rebase threshold in scaled units (Earth radii). */
const REBASE_THRESHOLD = 1;
/** Camera framing span in Earth radii when the Earth–Moon layer is off and there is no Moon distance to frame by. */
const BARE_SCENE_SPAN = 60;

export interface SceneRuntime {
  readonly clock: SimulationClock;
  readonly adapter: AstronomyAdapter;
  readonly trajectory: MoonTrajectory;
  /** Bodies the `tracked-bodies` layer draws; empty when the experience has none. */
  readonly trackedBodies: readonly TrackedBody[];
  /** Groups the `points` layer draws as dots; empty when the experience has none. */
  readonly groups: readonly GroupLayer[];
  /** The Sun the `sun-centred` layer draws, if the experience declares one. */
  readonly sun?: SunBody;
  /** Paths the `sun-centred` layer draws; empty when the experience has none. */
  readonly paths?: readonly PathLayer[];
  /** Whether the `earth-moon` layer is mounted: Earth and Moon meshes, their lights and the Moon path. */
  readonly earthMoon: boolean;
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
  return (
    <Canvas
      camera={{ fov: 45, near: 0.05, far: props.runtime.cameraReach.far ?? DEFAULT_CAMERA_FAR }}
      gl={{ antialias: true }}
      style={{ background: "#000000" }}
      data-testid="earth-moon-canvas"
      data-earth-moon={props.runtime.earthMoon}
      data-point-groups={props.runtime.groups.length}
      data-sun-centred={(props.runtime.sun === undefined ? 0 : 1) + (props.runtime.paths?.length ?? 0)}
    >
      <SceneContents {...props} />
      <LayeredRender />
    </Canvas>
  );
}

/** Takes over rendering so each body is lit only by its own Sun direction. */
function LayeredRender() {
  useFrame(({ gl, scene, camera }) => {
    const previousAutoClear = gl.autoClear;
    const previousMask = camera.layers.mask;
    gl.autoClear = false;
    gl.clear();
    // Layer 0 (path) is drawn with Earth's pass, then the Moon pass shares the depth buffer.
    camera.layers.mask = 1 | (1 << EARTH_LAYER);
    gl.render(scene, camera);
    camera.layers.mask = 1 << MOON_LAYER;
    gl.render(scene, camera);
    camera.layers.mask = 1 << TRACK_LAYER;
    gl.render(scene, camera);
    camera.layers.mask = previousMask;
    gl.autoClear = previousAutoClear;
  }, 1);
  return null;
}

function SceneContents({ runtime, controls, readout }: Props) {
  const { gl, camera, size } = useThree();
  const rootRef = useRef<Group>(null);
  const earthGroupRef = useRef<Group>(null);
  const earthMeshRef = useRef<Group>(null);
  const moonGroupRef = useRef<Group>(null);
  const moonMeshRef = useRef<Group>(null);
  const earthLightRef = useRef<DirectionalLight>(null);
  const moonLightRef = useRef<DirectionalLight>(null);

  const origin = useMemo(() => new FloatingOrigin(), []);
  const orbit = useRef<OrbitCameraState>(createOrbitCameraState(16));
  const moonDistanceScaled = useRef(6);
  const lastPolicyId = useRef(controls.policy.id);
  const pathState = useRef<{ samples: OrbitPathSamples | null; mappedFor: string; mapped: Float64Array | null; builtRealMs: number }>({
    samples: null,
    mappedFor: "",
    mapped: null,
    builtRealMs: Number.NEGATIVE_INFINITY,
  });

  const trackedViews = useMemo(() => runtime.trackedBodies.map((body) => new TrackedBodyView(body)), [runtime.trackedBodies]);
  const groupViews = useMemo(() => runtime.groups.map((layer) => new PointsView(layer)), [runtime.groups]);
  const sunCentredViews = useMemo(() => createSunCentredViews(runtime.sun, runtime.paths ?? []), [runtime.sun, runtime.paths]);
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

  const pathLine = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(DEFAULT_PATH_SAMPLES * 3), 3));
    const line = new Line(geometry, new LineBasicMaterial({ color: "#f0e6da", transparent: true, opacity: 0.45 }));
    line.frustumCulled = false;
    return line;
  }, []);

  useEffect(() => {
    const limits = () => {
      const moonRadius = controls.policy.mapRadius(MOON.radiusKm);
      return focusLimits(orbit.current.focus, moonRadius, moonDistanceScaled.current, runtime.cameraReach);
    };
    return attachOrbitGestures(gl.domElement, orbit.current, limits);
  }, [gl, controls]);

  useFrame((_state, delta) => {
    const earthGroup = earthGroupRef.current;
    const earthMesh = earthMeshRef.current;
    const moonGroup = moonGroupRef.current;
    const moonMesh = moonMeshRef.current;
    const root = rootRef.current;
    if (!root) return;
    const { clock, adapter, trajectory, earthMoon } = runtime;
    if (earthMoon && (!earthGroup || !earthMesh || !moonGroup || !moonMesh)) return;

    const policy = controls.policy;
    const t = clock.now();
    const moonFromEarth = earthMoon ? trajectory.stateAt(t, "earth") : null;
    const camState = orbit.current;
    for (const view of groupViews) view.sync(t, adapter, policy);
    for (const view of sunCentredViews) view.sync(t, adapter, policy);
    if (controls.frameStats !== null) {
      controls.frameStats.tick(performance.now());
      groupViews.forEach((view, i) => {
        const fill = controls.groupFills[i];
        if (fill === undefined) controls.groupFills[i] = { id: view.id, count: view.fillCount };
        else fill.count = view.fillCount;
      });
    }
    // Without the layer, "earth" is only the Earth-centred origin that tracked bodies are measured from.
    const absolutes = moonFromEarth === null
      ? { earthAbsolute: eqjToRenderVector(policy.mapPosition([0, 0, 0])), moonAbsolute: eqjToRenderVector(policy.mapPosition([0, 0, 0])) }
      : bodyAbsolutes(moonFromEarth, policy);
    const moonDistance = moonFromEarth === null ? BARE_SCENE_SPAN : Math.hypot(
      absolutes.moonAbsolute[0] - absolutes.earthAbsolute[0],
      absolutes.moonAbsolute[1] - absolutes.earthAbsolute[1],
      absolutes.moonAbsolute[2] - absolutes.earthAbsolute[2],
    );
    if (policy.id !== lastPolicyId.current) {
      // Keep the same relative framing when the visual scale changes; physical state is untouched.
      // Moon framing depends on its radius, which both policies map identically.
      if (camState.focus === "earth") camState.distance *= moonDistance / moonDistanceScaled.current;
      for (let i = 0; i < 3; i += 1) camState.transition[i] *= moonDistance / moonDistanceScaled.current;
      lastPolicyId.current = policy.id;
    }
    moonDistanceScaled.current = moonDistance;

    const moonRadius = policy.mapRadius(MOON.radiusKm);
    const focusAbsolute = (focus: FocusId): RenderVector => {
      if (focus === "earth") return absolutes.earthAbsolute;
      if (focus === "moon") return absolutes.moonAbsolute;
      const group = groupViews.find((candidate) => candidate.id === focus);
      if (group) return group.absolute();
      const sunCentred = sunCentredViews.find((candidate) => candidate.id === focus);
      if (sunCentred) return sunCentred.absolute();
      const view = trackedViews.find((candidate) => candidate.body.id === focus);
      if (!view) throw new RangeError(`unknown focus target "${focus}"`);
      return view.absolute(t, policy);
    };

    if (controls.cameraRequest) {
      const request = controls.cameraRequest;
      controls.cameraRequest = null;
      const target = request.kind === "overview" ? "earth" : request.target;
      switchFocus(camState, target, focusAbsolute(target));
      const framedGroup = groupViews.find((candidate) => candidate.id === target) ?? sunCentredViews.find((candidate) => candidate.id === target);
      if (request.kind !== "follow") {
        camState.targetDistance = framedGroup
          ? Math.max(TRACKED_DEFAULT_DISTANCE, GROUP_FRAMING * framedGroup.extentUnits(policy))
          : defaultDistance(target, moonRadius, moonDistance);
      }
      if (request.kind === "focus" && target === "moon") {
        // Start on the Earth side of the Moon so the phase reads as an Earth observer sees it.
        const toEarth = [
          absolutes.earthAbsolute[0] - absolutes.moonAbsolute[0],
          absolutes.earthAbsolute[1] - absolutes.moonAbsolute[1],
          absolutes.earthAbsolute[2] - absolutes.moonAbsolute[2],
        ];
        camState.targetElevation = Math.asin(toEarth[1] / moonDistance);
        camState.targetAzimuth = Math.atan2(toEarth[0], toEarth[2]);
      }
    }
    const limits = focusLimits(camState.focus, moonRadius, moonDistance, runtime.cameraReach);
    camState.distance = clampDistance(camState.distance, limits);
    camState.targetDistance = clampDistance(camState.targetDistance, limits);

    resolveCamera(camState, focusAbsolute(camState.focus), origin, delta, REBASE_THRESHOLD);
    let earth: State | null = null;
    if (moonFromEarth !== null && earthGroup && earthMesh && moonGroup && moonMesh) {
      earth = earthStateAt(adapter, t);
      const hierarchy: SceneHierarchy = { root, earthGroup, earthMesh, moonGroup, moonMesh };
      placeBodies(hierarchy, earth, moonFromEarth, policy, origin);
    }
    poseCamera(
      camera as import("three").PerspectiveCamera,
      camState,
      focusRadius(camState.focus, policy, moonRadius),
      origin,
      runtime.cameraReach.far ?? DEFAULT_CAMERA_FAR,
    );
    for (const view of trackedViews) view.update(t, policy, origin, camera);
    for (const view of groupViews) view.place(origin);
    for (const view of sunCentredViews) view.place(origin);
    anchorLabels.current?.update(controls.showAnchorLabels, camera, size.width, size.height);
    sceneLabels.current?.update((id) => {
      if (id === "earth" || id === "moon") return earthMoon ? absolutes[id === "earth" ? "earthAbsolute" : "moonAbsolute"] : null;
      const group = groupViews.find((candidate) => candidate.id === id);
      if (group !== undefined) return group.drawn ? group.absolute() : null;
      const sunCentred = sunCentredViews.find((candidate) => candidate.id === id);
      if (sunCentred !== undefined) return sunCentred.labelAnchor();
      const view = trackedViews.find((candidate) => candidate.body.id === id);
      if (view === undefined || stateIfInBounds(view.body, t) === null) return null;
      return view.absolute(t, policy);
    }, camera, size.width, size.height, origin, controls.selectedObjectId);

    if (moonFromEarth === null || earth === null) {
      readout.current = null;
      return;
    }
    // Physical Sun directions (before any readable compression) drive each body's own light.
    const sunFromEarth = sunPositionFromEarthAt(adapter, t);
    const earthSun = eqjToRenderVector(directionFromCenterToSun(sunFromEarth));
    const moonSun = eqjToRenderVector(directionToSun(moonFromEarth, sunFromEarth));
    earthLightRef.current?.position.set(earthSun[0], earthSun[1], earthSun[2]);
    moonLightRef.current?.position.set(moonSun[0], moonSun[1], moonSun[2]);

    updatePath(pathState.current, pathLine, runtime.trajectory, policy, origin, t);

    readout.current = buildDebugReadout({
      timeUtcMs: t,
      rate: clock.rate,
      policy,
      earth,
      moonFromEarth,
      sunFromEarth,
      placed: absolutes,
      renderedDistanceUnits: moonDistance,
      origin,
    });
  });

  return (
    <group ref={rootRef}>
      {runtime.earthMoon && (
        <>
          <BodyView asset={EARTH_ASSET} policy={controls.policy} layer={EARTH_LAYER} groupRef={earthGroupRef} orientRef={earthMeshRef} />
          <BodyView asset={MOON_ASSET} policy={controls.policy} layer={MOON_LAYER} groupRef={moonGroupRef} orientRef={moonMeshRef} />
          <primitive object={pathLine} />
          <ambientLight layers={EARTH_LAYER} intensity={EARTH_LIGHT.ambient} />
          <directionalLight ref={earthLightRef} layers={EARTH_LAYER} intensity={EARTH_LIGHT.directional} />
          <ambientLight layers={MOON_LAYER} intensity={MOON_LIGHT.ambient} />
          <directionalLight ref={moonLightRef} layers={MOON_LAYER} intensity={MOON_LIGHT.directional} />
        </>
      )}
      {trackedViews.map((view) => <primitive key={view.body.id} object={view.group} />)}
      {groupViews.map((view) => <primitive key={view.id} object={view.group} />)}
      {sunCentredViews.map((view) => <primitive key={view.id} object={view.group} />)}
    </group>
  );
}

/** A tracked body is a point: the camera may come very close and is framed in Earth radii. */
const TRACKED_MIN_DISTANCE = 0.002;
const TRACKED_DEFAULT_DISTANCE = 0.3;
/** A focused group is framed at this many times its widest member's distance from the centroid. */
const GROUP_FRAMING = 2.5;

/** Zoom limits per focus kind; a declared reach replaces only the farthest distance. */
export function focusLimits(focus: FocusId, moonRadiusScaled: number, moonDistanceScaled: number, declared: CameraReach) {
  const reach = declared.maxFocusDistance ?? Math.max(30, moonDistanceScaled * 3.5);
  if (focus === "earth") return { min: 1.15, max: reach };
  if (focus === "moon") return { min: moonRadiusScaled * 1.6, max: reach };
  return { min: TRACKED_MIN_DISTANCE, max: reach };
}

function defaultDistance(focus: FocusId, moonRadiusScaled: number, moonDistanceScaled: number): number {
  if (focus === "earth") return Math.max(3.2, moonDistanceScaled * 2.4);
  return focus === "moon" ? moonRadiusScaled * 4 : TRACKED_DEFAULT_DISTANCE;
}

function focusRadius(focus: FocusId, policy: ScalePolicy, moonRadiusScaled: number): number {
  if (focus === "earth") return policy.mapRadius(EARTH.radiusKm);
  return focus === "moon" ? moonRadiusScaled : 0;
}

function updatePath(
  state: { samples: OrbitPathSamples | null; mappedFor: string; mapped: Float64Array | null; builtRealMs: number },
  line: Line,
  trajectory: MoonTrajectory,
  policy: ScalePolicy,
  origin: FloatingOrigin,
  timeUtcMs: number,
): void {
  const realNow = performance.now();
  let rebuilt = false;
  if (pathNeedsRefresh(state.samples, timeUtcMs, realNow, state.builtRealMs)) {
    state.samples = sampleOrbitPath(trajectory, timeUtcMs);
    state.builtRealMs = realNow;
    rebuilt = true;
  }
  const samples = state.samples;
  if (!samples) return;
  if (rebuilt || state.mappedFor !== policy.id || state.mapped === null) {
    state.mapped = mapOrbitPath(samples, policy);
    state.mappedFor = policy.id;
  }
  const positions = line.geometry.getAttribute("position") as BufferAttribute;
  const mapped = state.mapped;
  const local: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < samples.timesUtcMs.length; i += 1) {
    origin.toLocal(eqjToRenderVector(mapped.subarray(i * 3, i * 3 + 3)), local);
    positions.setXYZ(i, local[0], local[1], local[2]);
  }
  positions.needsUpdate = true;
}
