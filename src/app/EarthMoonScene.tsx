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
import { AnchorLabelLayer } from "./AnchorLabels";
import { AtmosphereGlow, EARTH_ATMOSPHERE } from "./AtmosphereGlow";
import { BodyMesh, EARTH_MATERIAL, MOON_MATERIAL } from "./BodyMesh";
import {
  attachOrbitGestures,
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
import type { MissionConfig } from "./mission";
import {
  DEFAULT_PATH_SAMPLES,
  mapOrbitPath,
  pathNeedsRefresh,
  sampleOrbitPath,
  type OrbitPathSamples,
} from "./orbitPath";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import { bodyAbsolutes, placeBodies, type SceneHierarchy } from "./sceneLayout";
import { TRACK_LAYER, TrackedBodyView } from "./TrackedBodyView";
import earthTextureUrl from "./assets/textures/earth-2k.jpg";
import moonTextureUrl from "./assets/textures/moon-orig-2k.jpg";

// Render passes: Earth (layer 1) and Moon (layer 2) each get their own physical Sun direction.
const EARTH_LAYER = 1;
const MOON_LAYER = 2;
/** Floating-origin rebase threshold in scaled units (Earth radii). */
const REBASE_THRESHOLD = 1;

export interface SceneRuntime {
  readonly clock: SimulationClock;
  readonly adapter: AstronomyAdapter;
  readonly trajectory: MoonTrajectory;
  readonly mission: MissionConfig;
}

export interface SceneControls {
  policy: ScalePolicy;
  cameraRequest: CameraRequest | null;
  /** Presentation only: show source-anchor ID labels beside the anchor dots. */
  showAnchorLabels: boolean;
}

export type SceneReadout = DebugReadout;

interface Props {
  readonly runtime: SceneRuntime;
  readonly controls: SceneControls;
  readonly readout: { current: SceneReadout | null };
  /** Changes when the scale policy changes so mesh radii re-render. */
  readonly scaleId: ScalePolicy["id"];
}

export function EarthMoonScene(props: Props) {
  return (
    <Canvas
      camera={{ fov: 45, near: 0.05, far: 5000 }}
      gl={{ antialias: true }}
      style={{ background: "#000000" }}
      data-testid="earth-moon-canvas"
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

  const trackedViews = useMemo(() => runtime.mission.bodies.map((body) => new TrackedBodyView(body)), [runtime.mission]);
  const anchorLabels = useRef<AnchorLabelLayer | null>(null);

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
      return focusLimits(orbit.current.focus, moonRadius, moonDistanceScaled.current);
    };
    return attachOrbitGestures(gl.domElement, orbit.current, limits);
  }, [gl, controls]);

  useFrame((_state, delta) => {
    const earthGroup = earthGroupRef.current;
    const earthMesh = earthMeshRef.current;
    const moonGroup = moonGroupRef.current;
    const moonMesh = moonMeshRef.current;
    const root = rootRef.current;
    if (!root || !earthGroup || !earthMesh || !moonGroup || !moonMesh) return;

    const { clock, adapter, trajectory } = runtime;
    const policy = controls.policy;
    const t = clock.now();
    const moonFromEarth = trajectory.stateAt(t, "earth");
    const earth = earthStateAt(adapter, t);
    const sunFromEarth = sunPositionFromEarthAt(adapter, t);

    const camState = orbit.current;
    const absolutes = bodyAbsolutes(moonFromEarth, policy);
    const moonDistance = Math.hypot(
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
      const view = trackedViews.find((candidate) => candidate.body.id === focus);
      if (!view) throw new RangeError(`unknown focus target "${focus}"`);
      return view.absolute(t, policy);
    };

    if (controls.cameraRequest) {
      const request = controls.cameraRequest;
      controls.cameraRequest = null;
      const target = request.kind === "overview" ? "earth" : request.target;
      switchFocus(camState, target, focusAbsolute(target));
      if (request.kind !== "follow") camState.distance = defaultDistance(target, moonRadius, moonDistance);
      if (request.kind === "focus" && target === "moon") {
        // Start on the Earth side of the Moon so the phase reads as an Earth observer sees it.
        const toEarth = [
          absolutes.earthAbsolute[0] - absolutes.moonAbsolute[0],
          absolutes.earthAbsolute[1] - absolutes.moonAbsolute[1],
          absolutes.earthAbsolute[2] - absolutes.moonAbsolute[2],
        ];
        camState.elevation = Math.asin(toEarth[1] / moonDistance);
        camState.azimuth = Math.atan2(toEarth[0], toEarth[2]);
      }
    }
    const limits = focusLimits(camState.focus, moonRadius, moonDistance);
    camState.distance = Math.min(limits.max, Math.max(limits.min, camState.distance));

    resolveCamera(camState, focusAbsolute(camState.focus), origin, delta, REBASE_THRESHOLD);
    const hierarchy: SceneHierarchy = { root, earthGroup, earthMesh, moonGroup, moonMesh };
    placeBodies(hierarchy, earth, moonFromEarth, policy, origin);
    poseCamera(
      camera as import("three").PerspectiveCamera,
      camState,
      focusRadius(camState.focus, policy, moonRadius),
      origin,
    );
    for (const view of trackedViews) view.update(t, policy, origin, camera);
    anchorLabels.current?.update(controls.showAnchorLabels, camera, size.width, size.height);

    // Physical Sun directions (before any readable compression) drive each body's own light.
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

  const earthRadius = controls.policy.mapRadius(EARTH.radiusKm);
  const moonRadius = controls.policy.mapRadius(MOON.radiusKm);

  return (
    <group ref={rootRef}>
      <group ref={earthGroupRef}>
        <group ref={earthMeshRef}>
          <BodyMesh radius={earthRadius} textureUrl={earthTextureUrl} material={EARTH_MATERIAL} layer={EARTH_LAYER} />
          <AtmosphereGlow radius={earthRadius} atmosphere={EARTH_ATMOSPHERE} layer={EARTH_LAYER} />
        </group>
      </group>
      <group ref={moonGroupRef}>
        <group ref={moonMeshRef}>
          <BodyMesh radius={moonRadius} textureUrl={moonTextureUrl} material={MOON_MATERIAL} layer={MOON_LAYER} />
        </group>
      </group>
      <primitive object={pathLine} />
      {trackedViews.map((view) => <primitive key={view.body.id} object={view.group} />)}
      <ambientLight layers={EARTH_LAYER} intensity={0.18} />
      <directionalLight ref={earthLightRef} layers={EARTH_LAYER} intensity={1.8} />
      <ambientLight layers={MOON_LAYER} intensity={0.08} />
      <directionalLight ref={moonLightRef} layers={MOON_LAYER} intensity={1.4} />
    </group>
  );
}

/** A tracked body is a point: the camera may come very close and is framed in Earth radii. */
const TRACKED_MIN_DISTANCE = 0.002;
const TRACKED_DEFAULT_DISTANCE = 0.3;

function focusLimits(focus: FocusId, moonRadiusScaled: number, moonDistanceScaled: number) {
  const reach = Math.max(30, moonDistanceScaled * 3.5);
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
