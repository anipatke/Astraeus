// @vitest-environment happy-dom
// O-092 T-429: a BodyView frees its marker dot, stand-in dot and halo when it unmounts, and only its own. Mocks as bodyViewDom.test.ts; the made
// objects are caught as `bodyDraw` hands them out, so each test listens for `dispose` on exactly what the view built.
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { Group, Sprite } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@react-three/fiber", () => ({ useFrame: () => undefined }));
vi.mock("../src/app/BodyMesh", () => ({ BodyMesh: () => null }));
vi.mock("../src/app/AtmosphereGlow", () => ({ AtmosphereGlow: () => null }));
const made = vi.hoisted(() => ({ groups: [] as unknown[], glows: [] as unknown[] }));
vi.mock("../src/app/bodyDraw", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/app/bodyDraw")>();
  return {
    ...original,
    createMarker: (...args: Parameters<typeof original.createMarker>) => {
      const result = original.createMarker(...args);
      made.groups.push(result.group);
      return result;
    },
    createGlow: (...args: Parameters<typeof original.createGlow>) => {
      const glow = original.createGlow(...args);
      made.glows.push(glow);
      return glow;
    },
  };
});

import { BodyView } from "../src/app/BodyView";
import { catalogue } from "../src/assets/catalogue";
import { createSolarSystemScale } from "../src/presentation/scalePolicy";
import { listen, owned } from "./disposalFixtures";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];
beforeEach(() => {
  made.groups.length = 0;
  made.glows.length = 0;
  const gradient = { addColorStop: vi.fn() };
  const quiet: CanvasRenderingContext2D = new Proxy({} as CanvasRenderingContext2D, {
    get: (_t, key) =>
      key === "createRadialGradient" || key === "createLinearGradient" ? () => gradient : () => undefined,
    set: () => true,
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(quiet as never);
  vi.spyOn(console, "error").mockImplementation(() => undefined); // react-dom does not know the scene's group and primitive tags
});
afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  vi.restoreAllMocks();
});

const policy = createSolarSystemScale({ exaggeration: {}, defaultExaggeration: 1 });
const moon = catalogue.get("moon");
const assets = {
  "a marker body": { ...moon, visual: { ...moon.visual, kind: "marker" as const } },
  "a sphere body (stand-in dot)": catalogue.get("earth"),
  "a body with a halo": catalogue.get("sun"),
};

/** Mounts one BodyView; hands back the dots and halo it built and how to unmount it. */
function mount(asset: (typeof assets)[keyof typeof assets]) {
  const root = createRoot(document.createElement("div"));
  roots.push(root);
  act(() => root.render(createElement(BodyView, { asset, policy, layer: 1, markerLayer: 2 })));
  const built = [...(made.groups as Group[]), ...(made.glows as Sprite[])].splice(0);
  made.groups.length = 0;
  made.glows.length = 0;
  return { objects: owned(...built), unmount: () => act(() => root.unmount()) };
}

describe("BodyView frees what it built", () => {
  it.each(Object.entries(assets))("%s: its dots and halo hear dispose on unmount", (_name, asset) => {
    const view = mount(asset);
    expect(view.objects.size).toBeGreaterThan(0);
    const heard = listen(view.objects);
    view.unmount();
    for (const [object, count] of heard) expect(count, `${object.type} ${object.uuid}`).toBeGreaterThanOrEqual(1);
  });

  it.each(Object.entries(assets))(
    "%s: two views of one asset share nothing, and one's unmount leaves the other's alone",
    (_name, asset) => {
      const first = mount(asset);
      const second = mount(asset);
      for (const object of first.objects) expect(second.objects.has(object)).toBe(false);
      const heardFirst = listen(first.objects);
      const heardSecond = listen(second.objects);
      first.unmount();
      for (const count of heardFirst.values()) expect(count).toBeGreaterThanOrEqual(1);
      for (const count of heardSecond.values()) expect(count).toBe(0);
      second.unmount();
      for (const count of heardSecond.values()) expect(count).toBeGreaterThanOrEqual(1);
    },
  );
});
