// The marker look and the placement formulas are lifted from Planetary Explorer (commit 84f8d3e): HotspotMarker.tsx (the ringed dot, 10 px,
// 14 px and filled when selected, placed at 1.02 of the radius), src/entities/hotspot.ts (latLonToXYZ) and src/shared/utils/mathUtils.ts
// (isFeatureVisible and its tolerance). The donor draws each marker as a drei Html element; here one DOM layer moves them each frame.
import { Vector3, type Camera, type Object3D } from "three";
import { projectedRadiusPx } from "./bodyDraw";
import type { BodyFeatureSet } from "../shell/bodyFeatures";
import { featureColor, featureKey } from "../shell/bodyFeatures";

/** The donor's `latLonToXYZ`, verbatim: a point on a sphere of `radius`, in the body's own frame (Three.js SphereGeometry UV layout). */
export function latLonToXYZ(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180); // polar angle from +Y
  const theta = (lon + 90) * (Math.PI / 180); // azimuthal angle
  const x = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);
  return [x, y, z];
}

/** The donor's horizon rule: a marker hides once its surface point is this far past the edge. */
export const HORIZON_VISIBILITY_TOLERANCE = -0.02;

/** The donor's `isFeatureVisible`, verbatim: all positions are in the body's own frame. */
export function isFeatureVisible(
  surfaceNormal: readonly [number, number, number],
  cameraLocalPosition: readonly [number, number, number],
  sphereRadius: number,
  tolerance = HORIZON_VISIBILITY_TOLERANCE,
): boolean {
  const [snx, sny, snz] = surfaceNormal;
  const [clx, cly, clz] = cameraLocalPosition;
  const spx = snx * sphereRadius;
  const spy = sny * sphereRadius;
  const spz = snz * sphereRadius;
  const tcx = clx - spx;
  const tcy = cly - spy;
  const tcz = clz - spz;
  const len = Math.sqrt(tcx * tcx + tcy * tcy + tcz * tcz);
  if (len === 0) return false;
  return (snx * (tcx / len)) + (sny * (tcy / len)) + (snz * (tcz / len)) >= tolerance;
}

/** The donor's marker radius: markers sit just above the surface. */
export const MARKER_RADIUS_MULTIPLIER = 1.02;

/**
 * Presentation only. A body drawn narrower than this many screen pixels shows no markers (they would crowd into a smudge); the donor's
 * moon fills the screen, so it has no such rule. Live through `?featurepx=`.
 */
export const DEFAULT_FEATURE_MIN_BODY_PX = 60;

/** `?featurepx=<n>` sets the narrowest body that still shows its markers; an unusable value keeps the default with a console warning. */
export function featureMinBodyPxFromSearch(search: string, fallback: number = DEFAULT_FEATURE_MIN_BODY_PX): number {
  const raw = new URLSearchParams(search).get("featurepx");
  if (raw === null) return fallback;
  const value = raw.trim() === "" ? Number.NaN : Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 2000) {
    console.warn(`?featurepx=${raw} ignored: the value must be a number from 0 to 2000`);
    return fallback;
  }
  return value;
}

/**
 * The shell's own panels, which own their screen areas: a marker whose point falls under one is hidden, so a marker never shows through or
 * competes with the information panel, the moons sheet and its button, the timeline, the top bar, story panels or the phone drawers.
 * (Presentation only; the selectors are the shell's layout classes, not any experience's.)
 */
export const FEATURE_OCCLUDER_SELECTOR = [".info-panel", ".moons-sheet", ".moons-toggle", ".timeline-bar", ".shell-toolbar", ".story-panel", ".controls-drawer", ".controls-pill", ".drawer-handle", ".developer-tools", ".developer-mode-toggle", ".timeline-drawer"].join(", ");
/** How often the panels' areas are re-measured, ms (panels slide and resize; a frame-by-frame measure would cost layout every frame). */
const OCCLUDER_REFRESH_MS = 200;
/** Half the marker's tap target: a marker this close to a panel's edge is hidden too, so its tap target never reaches under the panel. */
const OCCLUDER_MARGIN_PX = 5;
/** A name label this close to the canvas edge flips to stay on screen. */
const LABEL_EDGE_PX = 90;

/** One tagged place as the scene draws it. */
export interface FeatureMarkerSpec {
  readonly key: string;
  readonly bodyId: string;
  readonly name: string;
  readonly color: string;
  readonly latitude: number;
  readonly longitude: number;
}

export function featureMarkerSpecs(sets: readonly BodyFeatureSet[] | undefined): readonly FeatureMarkerSpec[] {
  return (sets ?? []).flatMap((set) => set.features.map((feature): FeatureMarkerSpec => ({
    key: featureKey(set.bodyId, feature.id),
    bodyId: set.bodyId,
    name: feature.name,
    color: featureColor(set, feature),
    latitude: feature.latitude,
    longitude: feature.longitude,
  })));
}

/** A body's drawn sphere as the markers need it: its group (carrying the body's orientation and picture turn) and drawn radius in scene units. */
export interface FeatureHost {
  readonly sphere: Object3D;
  readonly radius: number;
}

/** What one frame decides for one marker: hidden, or where on screen (pixels). */
export type FeaturePlacement = { readonly key: string; readonly screen: { readonly x: number; readonly y: number } | null };

/** A marker's place in its body's frame; `position` is the donor's `latLonToXYZ(lat, lon, radius * 1.02)`, remade only when the drawn radius changes. */
interface Entry {
  readonly spec: FeatureMarkerSpec;
  readonly key: string;
  readonly normal: readonly [number, number, number];
  position: [number, number, number];
  positionRadius: number;
  readonly element: HTMLButtonElement;
}

const scratchLocal = new Vector3();
const scratchCamera = new Vector3();
const scratchCentre = new Vector3();

/**
 * Where every marker of one body is this frame. A marker is hidden when its body is not drawn as a sphere, is narrower than `minBodyPx`, or
 * its point is on the far side (the donor's rule), and otherwise is projected from the body's own frame through `host.sphere`, so it
 * turns with the body and with the picture exactly as the texture does.
 */
export function placeBodyFeatures(
  entries: readonly { readonly key: string; readonly position: readonly [number, number, number]; readonly normal: readonly [number, number, number] }[],
  host: FeatureHost | null,
  camera: Camera,
  fovDeg: number,
  widthPx: number,
  heightPx: number,
  minBodyPx: number,
): FeaturePlacement[] {
  if (host === null || !host.sphere.visible) return entries.map((entry) => ({ key: entry.key, screen: null }));
  host.sphere.updateWorldMatrix(true, false);
  camera.getWorldPosition(scratchCamera);
  scratchCentre.setFromMatrixPosition(host.sphere.matrixWorld);
  if (projectedRadiusPx(host.radius, scratchCamera.distanceTo(scratchCentre), fovDeg, heightPx) < minBodyPx) return entries.map((entry) => ({ key: entry.key, screen: null }));
  const cameraLocal = host.sphere.worldToLocal(scratchLocal.copy(scratchCamera)).toArray() as [number, number, number];
  return entries.map((entry) => {
    if (!isFeatureVisible(entry.normal, cameraLocal, host.radius)) return { key: entry.key, screen: null };
    scratchLocal.fromArray(entry.position).applyMatrix4(host.sphere.matrixWorld).project(camera);
    if (scratchLocal.z < -1 || scratchLocal.z > 1 || Math.abs(scratchLocal.x) > 1 || Math.abs(scratchLocal.y) > 1) return { key: entry.key, screen: null };
    return { key: entry.key, screen: { x: ((scratchLocal.x + 1) / 2) * widthPx, y: ((1 - scratchLocal.y) / 2) * heightPx } };
  });
}

/** The scene readout for the browser checks: each marker on screen, as fractions of the canvas, rounded. */
export interface FeatureMarkerReadout {
  readonly total: number;
  readonly shown: readonly { readonly key: string; readonly x: number; readonly y: number }[];
}

/**
 * App adapter that draws a tappable marker (after Planetary Explorer's HotspotMarker) on each tagged place of each body in `specs`. A marker shows
 * only while its body is drawn as a sphere, wide enough, and the place faces the camera; a press on it never reaches the camera controls.
 */
export class FeatureMarkerLayer {
  readonly #root = document.createElement("div");
  readonly #byBody = new Map<string, Entry[]>();
  readonly #total: number;
  #lastReadout = "";
  #occluders: { left: number; top: number; right: number; bottom: number }[] = [];
  #measuredAt = Number.NEGATIVE_INFINITY;
  #selectedKey: string | null = null;

  constructor(host: HTMLElement, specs: readonly FeatureMarkerSpec[], onPress: (key: string) => void) {
    this.#root.className = "feature-markers";
    for (const spec of specs) {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "feature-marker";
      element.dataset.featureKey = spec.key;
      element.setAttribute("aria-label", spec.name);
      element.setAttribute("aria-pressed", "false");
      element.dataset.name = spec.name;
      element.title = spec.name;
      element.hidden = true;
      element.style.setProperty("--feature-color", spec.color);
      element.addEventListener("pointerdown", (event) => event.stopPropagation());
      element.addEventListener("click", (event) => { event.stopPropagation(); onPress(spec.key); });
      this.#root.appendChild(element);
      const entry: Entry = { spec, key: spec.key, normal: normalOf(spec), position: [0, 0, 0], positionRadius: Number.NaN, element };
      const list = this.#byBody.get(spec.bodyId);
      if (list === undefined) this.#byBody.set(spec.bodyId, [entry]);
      else list.push(entry);
    }
    this.#total = specs.length;
    host.appendChild(this.#root);
  }

  /** Moves every marker for this frame; `hostOf` names a body's drawn sphere (null when it is not drawn as one). Returns the readout when it changed. */
  update(hostOf: (bodyId: string) => FeatureHost | null, camera: Camera, fovDeg: number, widthPx: number, heightPx: number, selectedKey: string | null, minBodyPx: number): FeatureMarkerReadout | null {
    camera.updateMatrixWorld(true);
    this.#measureOccluders();
    const shown: { key: string; x: number; y: number }[] = [];
    for (const [bodyId, entries] of this.#byBody) {
      const host = hostOf(bodyId);
      if (host !== null) {
        for (const entry of entries) {
          if (entry.positionRadius === host.radius) continue;
          entry.position = latLonToXYZ(entry.spec.latitude, entry.spec.longitude, host.radius * MARKER_RADIUS_MULTIPLIER);
          entry.positionRadius = host.radius;
        }
      }
      const placed = placeBodyFeatures(entries, host, camera, fovDeg, widthPx, heightPx, minBodyPx);
      placed.forEach((placement, index) => {
        const { element } = entries[index]!;
        const screen = placement.screen !== null && !this.#covered(placement.screen.x, placement.screen.y) ? placement.screen : null;
        element.hidden = screen === null;
        if (screen === null) return;
        element.dataset.edgeX = screen.x < LABEL_EDGE_PX ? "left" : screen.x > widthPx - LABEL_EDGE_PX ? "right" : "";
        element.dataset.edgeY = screen.y < 40 ? "top" : "";
        element.style.transform = `translate(${screen.x}px, ${screen.y}px) translate(-50%, -50%)`;
        shown.push({ key: placement.key, x: Math.round((screen.x / widthPx) * 1000) / 1000, y: Math.round((screen.y / heightPx) * 1000) / 1000 });
      });
    }
    if (selectedKey !== this.#selectedKey) {
      this.#selectedKey = selectedKey;
      for (const entries of this.#byBody.values()) for (const { spec, element } of entries) element.setAttribute("aria-pressed", String(spec.key === selectedKey));
    }
    const readout: FeatureMarkerReadout = { total: this.#total, shown };
    const text = JSON.stringify(readout);
    if (text === this.#lastReadout) return null;
    this.#lastReadout = text;
    return readout;
  }

  /** Re-measures the shell panels' areas, in this layer's own coordinates, a few times a second. */
  #measureOccluders(): void {
    const now = performance.now();
    if (now - this.#measuredAt < OCCLUDER_REFRESH_MS) return;
    this.#measuredAt = now;
    const origin = this.#root.getBoundingClientRect();
    this.#occluders = [...document.querySelectorAll(FEATURE_OCCLUDER_SELECTOR)].flatMap((element) => {
      if (this.#root.contains(element)) return [];
      const box = element.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) return [];
      return [{ left: box.left - origin.left - OCCLUDER_MARGIN_PX, top: box.top - origin.top - OCCLUDER_MARGIN_PX, right: box.right - origin.left + OCCLUDER_MARGIN_PX, bottom: box.bottom - origin.top + OCCLUDER_MARGIN_PX }];
    });
  }

  #covered(x: number, y: number): boolean {
    return this.#occluders.some((box) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom);
  }

  dispose(): void {
    this.#root.remove();
  }
}

/** The donor's surface normal for a place: `new Vector3(...latLonToXYZ(lat, lon, 1)).normalize()`. */
function normalOf(spec: FeatureMarkerSpec): [number, number, number] {
  return new Vector3(...latLonToXYZ(spec.latitude, spec.longitude, 1)).normalize().toArray() as [number, number, number];
}
