// A frame context on made-up Earth and Moon, shared by the frame tests (tests/sceneFrame.test.ts) and the site's loading-cover chain test.
import { Group, PerspectiveCamera } from "three";
import { createOrbAstronomyAdapter } from "../../src/core/astronomyAdapter";
import { SimulationClock } from "../../src/core/clock";
import { readableScale } from "../../src/core/scalePolicy";
import type { BodyId } from "../../src/core/body";
import { catalogue } from "../../src/assets/catalogue";
import { createOrbitCameraState } from "../../src/app/CameraController";
import { FloatingOrigin } from "../../src/app/floatingOrigin";
import type { SceneControls, SceneRuntime } from "../../src/app/AstraeusScene";
import { createFrameState, type FrameContext, type FrameLayers } from "../../src/app/sceneFrame";
import { createSceneResolver } from "../../src/app/sceneLayout";
import { DEFAULT_SKY_LINES } from "../../src/app/skyFigures";
import { SkyFiguresView } from "../../src/app/SkyFiguresView";
import { DEFAULT_BODY_MARKER } from "../../src/app/bodyDraw";

export const T0 = Date.UTC(2026, 0, 1);
export const BODIES: BodyId[] = ["earth", "moon"];
export const resolver = createSceneResolver(createOrbAstronomyAdapter());

function fakeCanvas(): HTMLCanvasElement {
  return { dataset: {}, style: { cursor: "" }, getBoundingClientRect: () => ({ left: 0, top: 0 }) } as unknown as HTMLCanvasElement;
}

export function makeContext(over: { controls?: Partial<SceneControls>; runtime?: Partial<SceneRuntime>; clock?: SimulationClock } = {}) {
  const clock = over.clock ?? new SimulationClock(T0);
  const runtime = { clock, resolver, bodies: BODIES, sceneCenter: "earth", trackedBodies: [], groups: [], cameraReach: {}, ...over.runtime } as SceneRuntime;
  const controls = { policy: readableScale, cameraRequest: null, showAnchorLabels: false, showMilkyWay: false, skyLines: { ...DEFAULT_SKY_LINES }, bodyMarker: DEFAULT_BODY_MARKER, starBrightness: 1, milkyWayBrightness: 1, labelObjects: [{ id: "earth", label: "Earth" }], selectedObjectId: "earth", frameStats: null, groupFills: [], ...over.controls } as SceneControls;
  const groups = new Map<BodyId, Group>(BODIES.map((id) => [id, new Group()]));
  const orients = new Map<BodyId, Group>(BODIES.map((id) => [id, new Group()]));
  const layers: FrameLayers = { bodySetLabels: { current: [] }, anchorLabels: { current: null }, sceneLabels: { current: null }, storyMarkers: { current: null }, featureMarkers: { current: null } };
  const camera = new PerspectiveCamera(45, 1, 0.05, 1000);
  const ctx: FrameContext = {
    runtime, controls, readout: { current: null }, catalogue, camera, canvas: fakeCanvas(), size: { width: 800, height: 600 }, origin: new FloatingOrigin(),
    orbit: createOrbitCameraState(16, "earth"), state: createFrameState(controls.policy.id), delta: 0.016, assets: BODIES.map((id) => catalogue.get(id)),
    bodyRefs: { groups, orients, parts: new Map() }, lightRefs: new Map(), placement: { resolver, center: "earth" },
    views: { trackedViews: [], groupViews: [], sunCentredViews: [], compositionPaths: [], skyView: null, skyFiguresView: new SkyFiguresView([]), bodySetViews: [], orbitSetViews: [] },
    layers, bodyFamilies: [], bodyIdFor: (id) => (catalogue.has(id) ? id : null), readoutPair: { parent: "earth", child: "moon" }, pairLabels: undefined,
  };
  return { ctx, clock, groups };
}
