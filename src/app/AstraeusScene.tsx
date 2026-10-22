import { createFrameState, type FrameState } from "./sceneFrame";
import { useBodyRefs, useOverlayLayers, useSceneDerived, useScenePointer, useSceneFrame, refFor } from "./sceneContentsHooks";
import { useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import type { DirectionalLight, Group } from "three";
import type { SimulationClock } from "../core/clock";
import type { BodyId } from "../core/body";
import type { ScalePolicy } from "../core/scalePolicy";
import type { StateResolver } from "../core/stateResolver";
import { catalogue as builtInCatalogue, type BodyAsset, type BodyCatalogue } from "../assets/catalogue";
import type { SystemComposition } from "../assets/compositions";
import { BodyView, type BodyParts } from "./BodyView";
import { type BodyMarkerSettings, type GlowLook } from "./bodyDraw";
import type { OrbitLook } from "../assets/orbitLook";
import {
  createOrbitCameraState,
  type CameraRequest,
  type OrbitCameraState,
} from "./CameraController";
import type { DebugReadout } from "./DebugOverlay";
import { FloatingOrigin } from "./floatingOrigin";
import { DEFAULT_CAMERA_FAR, type CameraReach, type GroupLayer, type PathLayer, type SunBody, type VisualOverride } from "./experienceDefinition";
import type { TrackedBody } from "./mission";
import { LayeredRender } from "./LayeredRender";
import type { RenderVector } from "./renderCoordinates";
import { useSceneViews, useSkyStars } from "./sceneHooks";
import type { StartView } from "./viewLink";
import {
  assignBodyLayers,
  START_CAMERA_DISTANCE,
} from "./sceneFraming";
import type { FrameStats } from "./frameStats";
import type { GroupFill } from "./FrameRateSection";
import { TRACK_LAYER } from "./TrackedBodyView";
import { type BodySetLayer, type BodySetLook } from "./bodySet";
import type { RingLook } from "../assets/rings";
import { type StoryMarkerSpec } from "./StoryMarkers";
import { type FeatureMarkerSpec } from "./FeatureMarkers";
import type { ExperienceObject } from "../shell/experience";

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
  /** Presentation only: how much a name brightens under a hovering mouse, 1 to 3 (Developer > Labels). Absent: the default. */
  hoverBrightness?: number;
  /** Presentation only: live colour and opacity per ring band, over the data's own. */
  ringLook?: RingLook;
  /** Presentation only: live sky strengths, 0 to 2, set from Developer > Display settings. */
  starBrightness: number;
  milkyWayBrightness: number;
  /** Presentation only: light every body from the camera's side, keeping its shading (Developer > Sky and Sun). Off: true sunlight. */
  illuminateAll: boolean;
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
  /** Called with an object's id when a tap or click lands on a body, a body-set member or a shown name. The shell flies to it like its picker does. */
  onPickObject?: (id: string) => void;
  /** Tagged places on bodies (a body package's features); each gets a marker drawn on its body that opens the place's information. */
  readonly featureMarkers?: readonly FeatureMarkerSpec[];
  /** Called with the place's key when a feature marker is pressed. */
  onFeatureMarker?: (key: string) => void;
  /** The place whose information is open, so its marker reads as selected. */
  openFeatureKey?: string | null;
  /** Presentation only: a body narrower than this many screen pixels shows no feature markers. Absent: `DEFAULT_FEATURE_MIN_BODY_PX`. */
  featureMinBodyPx?: number;
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
  const { gl } = useThree();
  const rootRef = useRef<Group>(null);
  const { groupRefs, orientRefs, lightRefs, partsFor, bodyRefs } = useBodyRefs(runtime);
  const ringLookOf = useMemo(() => () => controls.ringLook, [controls]);
  const origin = useMemo(() => new FloatingOrigin(), []);
  const orbit = useRef<OrbitCameraState>(createOrbitCameraState(START_CAMERA_DISTANCE, runtime.sceneCenter));
  const frameState = useRef<FrameState>(createFrameState(controls.policy.id));
  const { placement, readoutPair, pairLabels, assets, bodyFamilies } = useSceneDerived(runtime, catalogue);
  const views = useSceneViews(runtime, gl);
  const { trackedViews, groupViews, compositionPaths, skyView, bodySetViews, orbitSetViews, sunCentredViews } = views;
  useSkyStars(gl.domElement, skyView);
  const layerRefs = useOverlayLayers(gl.domElement, controls, trackedViews, bodySetViews);
  useScenePointer(gl.domElement, runtime, controls, catalogue, orbit, frameState);
  useSceneFrame(rootRef, { runtime, controls, readout, catalogue, origin, orbit, state: frameState, assets, bodyRefs, lightRefs, placement, views, layers: layerRefs, bodyFamilies, readoutPair, pairLabels });

  return (
    <group ref={rootRef}>
      {assets.map((asset) => (
        <SceneBody key={asset.definition.id} asset={asset} layer={layers.get(asset.definition.id)!} controls={controls} ringLookOf={ringLookOf} onParts={partsFor.get(asset.definition.id)} groupRef={refFor(groupRefs.current, asset.definition.id)} orientRef={refFor(orientRefs.current, asset.definition.id)} lightRef={refFor(lightRefs.current, asset.definition.id)} />
      ))}
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

interface SceneBodyProps {
  readonly asset: BodyAsset;
  readonly layer: number;
  readonly controls: SceneControls;
  readonly ringLookOf: () => RingLook | undefined;
  readonly onParts: ((parts: BodyParts | null) => void) | undefined;
  readonly groupRef: (node: Group | null) => void;
  readonly orientRef: (node: Group | null) => void;
  readonly lightRef: (node: DirectionalLight | null) => void;
}

/** One catalogued body: its view and, when its record has a light, the ambient and directional light on its layer. */
function SceneBody({ asset, layer, controls, ringLookOf, onParts, groupRef, orientRef, lightRef }: SceneBodyProps) {
  const light = asset.visual.light;
  return (
    <group>
      <BodyView asset={asset} policy={controls.policy} layer={layer} markerLayer={TRACK_LAYER} markerPx={controls.bodyMarker.markerPx} glowLook={controls.glowLook} ringLookOf={ringLookOf} onParts={onParts} groupRef={groupRef} orientRef={orientRef} />
      {light !== undefined && (
        <>
          <ambientLight layers={layer} intensity={light.ambient} />
          <directionalLight ref={lightRef} layers={layer} intensity={light.directional} />
        </>
      )}
    </group>
  );
}
