// Scene contents hooks: the refs, DOM layers, pointer listeners and frame callback `SceneContents` wires together.
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { DefaultLoadingManager, type DirectionalLight, type Group, type PerspectiveCamera } from "three";
import type { BodyId } from "../core/body";
import { rootBodyId, type BodyAsset, type BodyCatalogue } from "../assets/catalogue";
import { AnchorLabelLayer } from "./AnchorLabels";
import type { SceneControls, SceneReadout, SceneRuntime } from "./AstraeusScene";
import { BodySetLabelLayer } from "./BodySetLabels";
import type { BodyParts } from "./BodyView";
import { releaseGlowTexture } from "./bodyDraw";
import { type OrbitCameraState } from "./CameraController";
import { assetWithOverride } from "./experienceDefinition";
import { FeatureMarkerLayer } from "./FeatureMarkers";
import type { FloatingOrigin } from "./floatingOrigin";
import type { BodyRefs } from "./sceneBodies";
import { bodiesMounted, runFrame, type FrameLayers, type FrameState } from "./sceneFrame";
import { focusLimits } from "./sceneFraming";
import { useHostLayer, type useSceneViews } from "./sceneHooks";
import { readoutPairOf, type ScenePlacement } from "./sceneLayout";
import { SceneLabelLayer } from "./SceneLabels";
import { attachScenePointer } from "./scenePointer";
import { StoryMarkerLayer } from "./StoryMarkers";
import type { BodySetView } from "./BodySetView";
import { releaseAnchorSprite, type TrackedBodyView } from "./TrackedBodyView";

/** The catalogued body a focus or label id names: the Sun's shell item stands for the Sun body. */
export function bodyIdOf(runtime: { readonly sun?: { readonly object: { readonly id: string } } }, catalogue: BodyCatalogue, id: string): BodyId | null {
  if (runtime.sun !== undefined && id === runtime.sun.object.id) return rootBodyId();
  return catalogue.has(id) ? id : null;
}

/** Ref callback that keeps `map[id]` pointing at the mounted node. */
export function refFor<T>(map: Map<BodyId, T>, id: BodyId) {
  return (node: T | null) => {
    if (node === null) map.delete(id);
    else map.set(id, node);
  };
}

/** The mounted nodes of every body: groups, orientation nodes, lights and body parts, with one stable parts callback per body. */
export function useBodyRefs(runtime: SceneRuntime) {
  const groupRefs = useRef(new Map<BodyId, Group>());
  const orientRefs = useRef(new Map<BodyId, Group>());
  const lightRefs = useRef(new Map<BodyId, DirectionalLight>());
  const partsRefs = useRef(new Map<BodyId, BodyParts>());
  // One stable callback per body, so a body's effect is not re-run by every render.
  const partsFor = useMemo(() => new Map(runtime.bodies.map((id) => [id, refFor(partsRefs.current, id)] as const)), [runtime.bodies]);
  const bodyRefs: BodyRefs = { groups: groupRefs.current, orients: orientRefs.current, parts: partsRefs.current };
  return { groupRefs, orientRefs, lightRefs, partsFor, bodyRefs };
}

/** What the scene derives from its runtime: the placement, the readout pair and its labels, the body assets and the families of bodies drawn outside the sets. */
export function useSceneDerived(runtime: SceneRuntime, catalogue: BodyCatalogue) {
  const placement = useMemo<ScenePlacement>(() => ({ resolver: runtime.resolver, center: runtime.sceneCenter }), [runtime.resolver, runtime.sceneCenter]);
  const readoutPair = useMemo(() => readoutPairOf(runtime.bodies, catalogue), [runtime.bodies, catalogue]);
  const pairLabels = useMemo(() => (readoutPair === null ? undefined : { parent: catalogue.get(readoutPair.parent).definition.label, child: catalogue.get(readoutPair.child).definition.label }), [readoutPair, catalogue]);
  const assets = useMemo<readonly BodyAsset[]>(() => runtime.bodies.map((id) => assetWithOverride(catalogue.get(id), runtime.overrides?.get(id))), [runtime.bodies, runtime.overrides, catalogue]);
  const bodyFamilies = useMemo(() => (runtime.bodySets ?? []).flatMap((layer) => Object.entries(layer.bodyFamilies ?? {}).map(([body, family]) => ({ layer, body, family }))), [runtime.bodySets]);
  return { placement, readoutPair, pairLabels, assets, bodyFamilies };
}

/** Mounts every DOM layer the frame updates (names, anchor labels, story and feature markers) and returns the refs the frame reads. */
export function useOverlayLayers(canvas: HTMLCanvasElement, controls: SceneControls, trackedViews: readonly TrackedBodyView[], bodySetViews: readonly BodySetView[]): FrameLayers {
  const bodySetLabels = useRef<BodySetLabelLayer[]>([]);
  const anchorLabels = useRef<AnchorLabelLayer | null>(null);
  const sceneLabels = useRef<SceneLabelLayer | null>(null);
  const storyMarkers = useRef<StoryMarkerLayer | null>(null);
  const featureMarkers = useRef<FeatureMarkerLayer | null>(null);
  useEffect(() => {
    const host = canvas.parentElement;
    if (host === null) return undefined;
    const layers = bodySetViews.map((view) => new BodySetLabelLayer(host, canvas, view));
    bodySetLabels.current = layers;
    return () => { for (const layer of layers) layer.dispose(); bodySetLabels.current = []; };
  }, [canvas, bodySetViews, controls]);
  useHostLayer(canvas, anchorLabels, (host) => new AnchorLabelLayer(host, trackedViews), [canvas, trackedViews]);
  useHostLayer(canvas, sceneLabels, (host) => new SceneLabelLayer(host, controls.labelObjects), [canvas, controls.labelObjects]);
  useHostLayer(canvas, storyMarkers, (host) => (controls.storyMarkers === undefined || controls.storyMarkers.length === 0 ? null : new StoryMarkerLayer(host, controls.storyMarkers, (panelId) => controls.onStoryMarker?.(panelId))), [canvas, controls]);
  useHostLayer(canvas, featureMarkers, (host) => (controls.featureMarkers === undefined || controls.featureMarkers.length === 0 ? null : new FeatureMarkerLayer(host, controls.featureMarkers, (key) => controls.onFeatureMarker?.(key))), [canvas, controls]);
  return { bodySetLabels, anchorLabels, sceneLabels, storyMarkers, featureMarkers };
}

/** Wires the canvas's orbit gestures, hover and tap picking to the camera and frame state. */
export function useScenePointer(canvas: HTMLCanvasElement, runtime: SceneRuntime, controls: SceneControls, catalogue: BodyCatalogue, orbit: { current: OrbitCameraState }, state: { current: FrameState }): void {
  useEffect(() => {
    const limits = () => focusLimits(bodyIdOf(runtime, catalogue, orbit.current.focus) ?? orbit.current.focus, { centre: runtime.sceneCenter, span: state.current.spanScaled, bodies: catalogue }, controls.policy, runtime.cameraReach);
    return attachScenePointer(canvas, orbit.current, state.current, limits, (id) => controls.onPickObject?.(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, controls]);
}

/** What the per-frame callback reads besides the three renderer handles. */
export interface FrameInputs {
  readonly runtime: SceneRuntime;
  readonly controls: SceneControls;
  readonly readout: { current: SceneReadout | null };
  readonly catalogue: BodyCatalogue;
  readonly origin: FloatingOrigin;
  readonly orbit: { current: OrbitCameraState };
  readonly state: { current: FrameState };
  readonly assets: readonly BodyAsset[];
  readonly bodyRefs: BodyRefs;
  readonly lightRefs: { current: Map<BodyId, DirectionalLight> };
  readonly placement: ScenePlacement;
  readonly views: ReturnType<typeof useSceneViews>;
  readonly layers: FrameLayers;
  readonly bodyFamilies: ReturnType<typeof useSceneDerived>["bodyFamilies"];
  readonly readoutPair: ReturnType<typeof useSceneDerived>["readoutPair"];
  readonly pairLabels: ReturnType<typeof useSceneDerived>["pairLabels"];
}

/** Runs one frame of the scene per render frame, once every body is mounted. */
export function useSceneFrame(rootRef: { current: Group | null }, inputs: FrameInputs): void {
  const { gl, camera, size } = useThree();
  useFrame((_state, delta) => {
    // Draw by default; a finished frame (`runFrame`) may decide the picture cannot have changed.
    inputs.state.current.drawThisFrame = true;
    if (!rootRef.current || !bodiesMounted(inputs.runtime, inputs.bodyRefs)) return;
    const { orbit, state, lightRefs, ...rest } = inputs;
    runFrame({ ...rest, camera: camera as PerspectiveCamera, canvas: gl.domElement, size, orbit: orbit.current, state: state.current, delta, lightRefs: lightRefs.current, bodyIdFor: (id) => bodyIdOf(inputs.runtime, inputs.catalogue, id) });
  });
}

/**
 * The glow and anchor pictures are made once and shared by every scene, and a renderer keeps its GPU copy of a picture in a table keyed by it,
 * so a shared picture would keep every unmounted scene's renderer, canvas and page alive (a switch inside the page, O-030). When the scene unmounts
 * the pictures are disposed, which every renderer that drew them hears and forgets.
 */
export function useReleaseSharedTextures(): void {
  useEffect(() => () => { releaseGlowTexture(); releaseAnchorSprite(); }, []);
}

/**
 * Wakes the draw rule for changes the scene cannot see in its own numbers: every load that starts, progresses, ends or fails (textures, the sky
 * pictures, which are what a texture swap after a React render waits on) and a restored graphics context. Each keeps the scene drawing
 * for the idle grace after it (`IDLE_GRACE_FRAMES`).
 */
export function useDrawWakes(canvas: HTMLCanvasElement, state: { current: FrameState }): void {
  useEffect(() => {
    const wake = () => { state.current.wakes += 1; };
    const manager = DefaultLoadingManager;
    const { onStart, onProgress, onLoad, onError } = manager;
    manager.onStart = (...args) => { wake(); onStart?.(...args); };
    manager.onProgress = (...args) => { wake(); onProgress?.(...args); };
    manager.onLoad = () => { wake(); onLoad?.(); };
    manager.onError = (url) => { wake(); onError?.(url); };
    canvas.addEventListener("webglcontextrestored", wake);
    return () => {
      manager.onStart = onStart;
      manager.onProgress = onProgress;
      manager.onLoad = onLoad;
      manager.onError = onError;
      canvas.removeEventListener("webglcontextrestored", wake);
    };
  }, [canvas, state]);
}
