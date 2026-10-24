// @vitest-environment happy-dom
// BodyView, the component that draws one catalogued body: a sphere with its stand-in dot, a marker, a halo or rings. There is no GPU here, so the
// react-three-fiber frame hook is a recorder and the page's plain elements stand in for the scene's groups; the tests read what the component
// hands the scene (the sphere and its dot, the halo look each frame, the ring readout on the canvas) and what it leaves out.
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Group, Sprite, Vector3 } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const frame = vi.hoisted(() => ({ callbacks: [] as ((state: unknown) => void)[] }));
vi.mock("@react-three/fiber", () => ({ useFrame: (callback: (state: unknown) => void) => { frame.callbacks.push(callback); } }));
vi.mock("../src/app/BodyMesh", () => ({ BodyMesh: (props: { radius: number }) => createElement("div", { "data-testid": "body-mesh", "data-radius": String(props.radius) }) }));
vi.mock("../src/app/AtmosphereGlow", () => ({ AtmosphereGlow: () => createElement("div", { "data-testid": "atmosphere" }) }));
const glowSpy = vi.hoisted(() => ({ calls: [] as unknown[][] }));
vi.mock("../src/app/bodyDraw", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/app/bodyDraw")>();
  return { ...original, applyGlowLook: (...args: Parameters<typeof original.applyGlowLook>) => { glowSpy.calls.push(args); return original.applyGlowLook(...args); } };
});

import { BodyView, type BodyParts } from "../src/app/BodyView";
import { catalogue } from "../src/assets/catalogue";
import { releaseGlowTexture } from "../src/app/bodyDraw";
import { createSolarSystemScale } from "../src/core/scalePolicy";
import type { RingSystem } from "../src/assets/rings";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  frame.callbacks.length = 0;
  glowSpy.calls.length = 0;
  const gradient = { addColorStop: vi.fn() };
  // A canvas context that accepts every drawing call and records none; gradients are the same quiet stub.
  const quiet: CanvasRenderingContext2D = new Proxy({} as CanvasRenderingContext2D, { get: (_t, key) => (key === "createRadialGradient" || key === "createLinearGradient" ? () => gradient : () => undefined), set: () => true });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(quiet as never);
  vi.spyOn(console, "error").mockImplementation(() => undefined); // react-dom does not know the scene's group and primitive tags
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); releaseGlowTexture(); });

const policy = createSolarSystemScale({ exaggeration: {}, defaultExaggeration: 1 });
const show = (props: Partial<Parameters<typeof BodyView>[0]> & { asset: Parameters<typeof BodyView>[0]["asset"] }) =>
  act(() => root.render(createElement(BodyView, { policy, layer: 1, markerLayer: 2, ...props })));
const runFrames = (state: unknown) => act(() => { for (const callback of frame.callbacks) callback(state); });

describe("BodyView as a sphere", () => {
  it("draws the sphere at its drawn radius with its atmosphere, and hands the scene the sphere and a hidden stand-in dot", () => {
    const onParts = vi.fn<(parts: BodyParts | null) => void>();
    show({ asset: catalogue.get("earth"), onParts });
    expect(container.querySelector('[data-testid="body-mesh"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="atmosphere"]')).not.toBeNull();
    expect(onParts).toHaveBeenCalledTimes(1);
    const parts = onParts.mock.calls[0]![0]!;
    expect(parts.marker).toBeInstanceOf(Group);
    expect(parts.marker.visible).toBe(false);
    const layered: boolean[] = [];
    parts.marker.traverse((node) => { if (node !== parts.marker) layered.push(node.layers.isEnabled(2)); });
    expect(layered.length).toBeGreaterThan(0);
    expect(layered.every(Boolean)).toBe(true); // the dot lives on the marker layer
    expect(parts.sphere).toBeTruthy();
    act(() => root.unmount());
    expect(onParts).toHaveBeenLastCalledWith(null);
    root = createRoot(container);
  });

  it("draws no atmosphere for a body without one", () => {
    show({ asset: catalogue.get("moon") });
    expect(container.querySelector('[data-testid="body-mesh"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="atmosphere"]')).toBeNull();
  });
});

describe("BodyView as a marker", () => {
  const dot = { ...catalogue.get("moon"), visual: { ...catalogue.get("moon").visual, kind: "marker" as const } };

  it("draws a dot and no sphere for a marker body, and never hands the scene parts", () => {
    const onParts = vi.fn();
    show({ asset: dot, onParts });
    expect(container.querySelector('[data-testid="body-mesh"]')).toBeNull();
    expect(onParts).not.toHaveBeenCalled();
  });

  it("draws the Sun as an unlit sphere with a halo and no dot, and sizes the halo from the live look each frame", () => {
    const sun = catalogue.get("sun");
    show({ asset: sun, glowLook: { sizePx: 90, brightness: 0.5, scale: 3 } });
    expect(container.querySelector('[data-testid="body-mesh"]')).not.toBeNull(); // emissive: its disc is drawn
    runFrames({ camera: { position: new Vector3(0, 0, 40), fov: 50 }, size: { height: 800 }, gl: { domElement: document.createElement("canvas") } });
    expect(glowSpy.calls).toHaveLength(1);
    const [sprite, look, color, view] = glowSpy.calls[0]! as [Sprite, unknown, string, Record<string, number>];
    expect(sprite).toBeInstanceOf(Sprite);
    expect(look).toEqual({ sizePx: 90, brightness: 0.5, scale: 3 });
    expect(color).toBe(sun.visual.material.color);
    expect(view).toMatchObject({ distanceUnits: 40, fovDeg: 50, viewportHeightPx: 800 });
    expect(view.bodyRadiusUnits).toBeGreaterThan(0);
  });

  it("falls back to the record's own halo when the page gives no live look", () => {
    const sun = catalogue.get("sun");
    show({ asset: sun });
    runFrames({ camera: { position: new Vector3(0, 0, 40), fov: 50 }, size: { height: 800 }, gl: { domElement: document.createElement("canvas") } });
    expect(glowSpy.calls[0]![1]).toEqual({ sizePx: sun.visual.glow!.sizePx, brightness: sun.visual.glow!.brightness, scale: 2.5 });
  });

  it("applies no halo for a body whose record has none", () => {
    show({ asset: dot });
    runFrames({ camera: { position: new Vector3(0, 0, 40), fov: 50 }, size: { height: 800 }, gl: { domElement: document.createElement("canvas") } });
    expect(glowSpy.calls).toHaveLength(0);
  });
});

describe("BodyView with rings", () => {
  const rings: RingSystem = { body: "earth", sources: [], bands: [{ id: "a", label: "A", innerKm: 7000, outerKm: 9000, color: "#ffffff", opacity: 0.6 }] };
  const ringed = { ...catalogue.get("earth"), visual: { ...catalogue.get("earth").visual, rings } };

  it("publishes the ring bands on the canvas as the live look changes them, and only rewrites the readout when it changed", () => {
    let look: Record<string, { opacity: number }> | undefined;
    show({ asset: ringed, ringLookOf: () => look });
    const canvas = document.createElement("canvas");
    const state = { gl: { domElement: canvas }, camera: { position: new Vector3(0, 0, 10), fov: 50 }, size: { height: 600 } };
    runFrames(state);
    const first = JSON.parse(canvas.dataset.ringBands!);
    expect(first.bands).toHaveLength(1);
    expect(first.bands[0]).toMatchObject({ id: "a", innerKm: 7000, outerKm: 9000, opacity: 0.6 });
    look = { a: { opacity: 0.2 } };
    runFrames(state);
    expect(JSON.parse(canvas.dataset.ringBands!).bands[0].opacity).toBe(0.2);
  });

  it("draws no ring disc for a body without rings", () => {
    show({ asset: catalogue.get("earth") });
    const canvas = document.createElement("canvas");
    runFrames({ gl: { domElement: canvas }, camera: { position: new Vector3(0, 0, 10), fov: 50 }, size: { height: 600 } });
    expect(canvas.dataset.ringBands).toBeUndefined();
  });
});
