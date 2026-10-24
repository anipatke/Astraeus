// @vitest-environment happy-dom
// The halo drawing rules (bodyDraw), the anchor-label layer, the scene's small id helpers and the two effect hooks that wake the draw rule
// and mount a host layer. Pretend page; the canvas gradient is a recording stub.
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";
import { DefaultLoadingManager, PerspectiveCamera, Vector3 } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { catalogue } from "../src/assets/catalogue";
import { AnchorLabelLayer, projectToScreen } from "../src/app/AnchorLabels";
import { applyGlowLook, baseGlowOf, createGlow, DEFAULT_GLOW_SCALE, glowLookFromSearch, glowSizePx, pxToUnits, releaseGlowTexture, type GlowLook } from "../src/app/bodyDraw";
import { createFrameState } from "../src/app/sceneFrame";
import { bodyIdOf, refFor, useDrawWakes } from "../src/app/sceneContentsHooks";
import { useHostLayer } from "../src/app/sceneHooks";
import type { TrackedBodyView } from "../src/app/TrackedBodyView";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  const gradient = { addColorStop: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ createRadialGradient: () => gradient, fillRect: vi.fn(), set fillStyle(_v: unknown) { /* recorded by nothing */ } } as unknown as CanvasRenderingContext2D);
});
afterEach(() => { vi.restoreAllMocks(); releaseGlowTexture(); });

const look: GlowLook = { sizePx: 40, brightness: 1, scale: 2 };

describe("halo settings", () => {
  it("sizes the halo as the larger of the setting and scale times the disc, ignoring a non-finite disc", () => {
    expect(glowSizePx(look, 10)).toBe(40);
    expect(glowSizePx(look, 100)).toBe(200);
    expect(glowSizePx(look, Number.POSITIVE_INFINITY)).toBe(40);
  });

  it("converts pixels to world units through the field of view", () => {
    expect(pxToUnits(400, 10, 90, 800)).toBeCloseTo(10, 9); // 400 px is half the 800 px height; at 10 units a 90 degree view spans 20
  });

  it("takes the first record's halo as the base, with the default scale when it states none", () => {
    expect(baseGlowOf([catalogue.get("earth")])).toBeNull();
    const withGlow = { ...catalogue.get("earth"), visual: { ...catalogue.get("earth").visual, glow: { sizePx: 90, brightness: 0.7 } } };
    expect(baseGlowOf([catalogue.get("earth"), withGlow])).toEqual({ sizePx: 90, brightness: 0.7, scale: DEFAULT_GLOW_SCALE });
  });

  it("lets the address override each setting, and warns and keeps the base for an unusable value", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(glowLookFromSearch("?sunglow=120&sunbrightness=1.5&sunglowscale=3", look)).toEqual({ sizePx: 120, brightness: 1.5, scale: 3 });
    expect(glowLookFromSearch("", look)).toEqual(look);
    expect(glowLookFromSearch("?sunglow=900&sunbrightness=abc&sunglowscale=", look)).toEqual(look);
    expect(warn).toHaveBeenCalledTimes(3);
  });
});

describe("the halo sprite", () => {
  const view = (distanceUnits: number) => ({ distanceUnits, fovDeg: 90, viewportHeightPx: 800, bodyRadiusUnits: 1 });

  it("is additive, on the given layer, drawn last", () => {
    const sprite = createGlow("#ffcc00", 4);
    expect(sprite.renderOrder).toBe(1000);
    expect(sprite.layers.isEnabled(4)).toBe(true);
    expect(sprite.material.transparent).toBe(true);
    expect(sprite.frustumCulled).toBe(false);
  });

  it("sizes in world units, goes behind a big disc, tints once per setting, and hides at zero strength", () => {
    const sprite = createGlow("#ffffff", 0);
    // far: the disc is 2 * 1 * 400 / 100 = 8 px across, so the 40 px setting wins and the halo is drawn over everything
    const far = applyGlowLook(sprite, look, "#808080", view(100));
    expect(far).toBe(40);
    expect(sprite.scale.x).toBeCloseTo(pxToUnits(40, 100, 90, 800), 9);
    expect(sprite.material.depthTest).toBe(false);
    expect(sprite.visible).toBe(true);
    expect(sprite.material.opacity).toBe(1);
    // near: the disc is 800 px across, over the behind-disc limit, and the halo is scale times it
    const near = applyGlowLook(sprite, look, "#808080", view(1));
    expect(near).toBeCloseTo(1600, 6);
    expect(sprite.material.depthTest).toBe(true);
    // the tint is cached: dimming changes it, the same setting again does not
    const dim = { ...look, brightness: 0.5 };
    applyGlowLook(sprite, dim, "#808080", view(100));
    expect(sprite.material.opacity).toBe(0.5);
    const colour = sprite.material.color.getHex();
    sprite.material.color.set("#ff0000");
    applyGlowLook(sprite, dim, "#808080", view(100));
    expect(sprite.material.color.getHex()).toBe(0xff0000); // not rewritten
    expect(colour).not.toBe(0xff0000);
    applyGlowLook(sprite, { ...look, brightness: 0 }, "#808080", view(100));
    expect(sprite.visible).toBe(false);
    applyGlowLook(sprite, { ...look, sizePx: 0, scale: 0 }, "#808080", view(100));
    expect(sprite.visible).toBe(false);
  });

  it("shares one soft picture between halos until it is released, then makes a new one", () => {
    const a = createGlow("#fff", 0);
    const b = createGlow("#fff", 0);
    expect(a.material.map).toBe(b.material.map);
    const first = a.material.map;
    releaseGlowTexture();
    expect(createGlow("#fff", 0).material.map).not.toBe(first);
  });
});

describe("anchor labels", () => {
  const cam = () => { const c = new PerspectiveCamera(60, 1, 0.1, 100); c.position.set(0, 0, 10); c.lookAt(0, 0, 0); return c; };

  it("projects a point to pixels, and gives null behind the camera or off the edge", () => {
    expect(projectToScreen(new Vector3(0, 0, 0), cam(), 800, 600)).toEqual({ x: 400, y: 300 });
    const up = projectToScreen(new Vector3(0, 1, 0), cam(), 800, 600)!;
    expect(up.x).toBe(400);
    expect(up.y).toBeLessThan(300);
    expect(projectToScreen(new Vector3(0, 0, 50), cam(), 800, 600)).toBeNull();
    expect(projectToScreen(new Vector3(100, 0, 0), cam(), 800, 600)).toBeNull();
  });

  it("makes a coloured span per anchor and places only those whose body is shown and in view", () => {
    const host = document.createElement("div");
    const views = [
      { anchorLabels: ["Launch", "Splashdown"], body: { color: "#00ff00" }, group: { visible: true }, anchorLocalPosition: (i: number, out: Vector3) => out.set(i === 0 ? 0 : 500, 0, 0) },
      { anchorLabels: null, body: { color: "#fff" }, group: { visible: true }, anchorLocalPosition: (_i: number, out: Vector3) => out },
      { anchorLabels: ["Hidden"], body: { color: "#fff" }, group: { visible: false }, anchorLocalPosition: (_i: number, out: Vector3) => out },
    ] as unknown as TrackedBodyView[];
    const layer = new AnchorLabelLayer(host, views);
    const spans = [...host.querySelectorAll<HTMLElement>(".anchor-label")];
    expect(spans.map((s) => s.textContent)).toEqual(["Launch", "Splashdown", "Hidden"]);
    expect(spans[0]!.style.color).toBe("#00ff00");
    expect(host.querySelector<HTMLElement>(".anchor-labels")!.hidden).toBe(true);
    layer.update(true, cam(), 800, 600);
    expect(host.querySelector<HTMLElement>(".anchor-labels")!.hidden).toBe(false);
    expect(spans.map((s) => s.hidden)).toEqual([false, true, true]);
    expect(spans[0]!.style.transform).toBe("translate(400.0px, 300.0px)");
    layer.update(false, cam(), 800, 600);
    expect(host.querySelector<HTMLElement>(".anchor-labels")!.hidden).toBe(true);
    layer.dispose();
    expect(host.querySelector(".anchor-labels")).toBeNull();
  });
});

describe("scene helpers", () => {
  it("names the Sun's shell item as the root body, a catalogued id as itself, anything else as nothing", () => {
    const runtime = { sun: { object: { id: "sun-item" } } };
    expect(bodyIdOf(runtime, catalogue, "sun-item")).toBe("sun");
    expect(bodyIdOf(runtime, catalogue, "moon")).toBe("moon");
    expect(bodyIdOf(runtime, catalogue, "spacecraft")).toBeNull();
    expect(bodyIdOf({}, catalogue, "sun-item")).toBeNull();
  });

  it("keeps a map in step with mounted nodes", () => {
    const map = new Map<string, number>();
    const ref = refFor(map, "earth");
    ref(5);
    expect(map.get("earth")).toBe(5);
    ref(null);
    expect(map.has("earth")).toBe(false);
  });
});

describe("effect hooks", () => {
  it("counts a draw wake for every load event and a restored context, and puts the loading manager back on unmount", () => {
    const canvas = document.createElement("canvas");
    const state = { current: createFrameState("readable") };
    const originalOnLoad = DefaultLoadingManager.onLoad;
    const seen = vi.fn();
    DefaultLoadingManager.onStart = seen;
    const originalStart = DefaultLoadingManager.onStart;
    const root = createRoot(document.createElement("div"));
    function Probe() { useDrawWakes(canvas, state); return null; }
    act(() => root.render(createElement(Probe)));
    DefaultLoadingManager.onStart("a", 0, 1);
    DefaultLoadingManager.onProgress("a", 1, 1);
    DefaultLoadingManager.onLoad();
    DefaultLoadingManager.onError("a");
    canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect(state.current.wakes).toBe(5);
    expect(seen).toHaveBeenCalledOnce(); // the earlier handler still hears it
    act(() => root.unmount());
    expect(DefaultLoadingManager.onStart).toBe(originalStart);
    expect(DefaultLoadingManager.onLoad).toBe(originalOnLoad);
    canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect(state.current.wakes).toBe(5);
  });

  it("mounts a layer into the canvas's host, hands it to the ref, and disposes it on unmount; a null layer mounts nothing", () => {
    const host = document.createElement("div");
    const canvas = document.createElement("canvas");
    host.appendChild(canvas);
    const dispose = vi.fn();
    const ref: { current: { dispose(): void } | null } = { current: null };
    const none: { current: { dispose(): void } | null } = { current: null };
    const root = createRoot(document.createElement("div"));
    function Probe() {
      useHostLayer(canvas, ref, (h) => { expect(h).toBe(host); return { dispose }; }, [canvas]);
      useHostLayer(canvas, none, () => null, [canvas]);
      return null;
    }
    act(() => root.render(createElement(Probe)));
    expect(ref.current).not.toBeNull();
    expect(none.current).toBeNull();
    act(() => root.unmount());
    expect(dispose).toHaveBeenCalledOnce();
    expect(ref.current).toBeNull();
  });

  it("does nothing for a canvas that is not in a host", () => {
    const ref: { current: { dispose(): void } | null } = { current: null };
    const create = vi.fn(() => ({ dispose: vi.fn() }));
    const root = createRoot(document.createElement("div"));
    const orphan = document.createElement("canvas");
    function Probe() { useHostLayer(orphan, ref, create, [orphan]); return null; }
    act(() => root.render(createElement(Probe)));
    expect(create).not.toHaveBeenCalled();
    act(() => root.unmount());
  });
});
