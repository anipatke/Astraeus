// @vitest-environment happy-dom
// O-092 T-429: `useSceneViews` frees every view it built when the scene unmounts, and only its own (a second viewer of the same runtime keeps drawing).
// Mocks as sceneHooksDom.test.ts: there is no GPU, so the frame hooks are recorders and the renderer is a stand-in.
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PICTURES } from "astraeus-data";
import { Texture, TextureLoader } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@react-three/fiber", () => ({ useFrame: () => undefined, useThree: () => ({}) }));
const sky = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("../src/assets/sky", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/assets/sky")>()),
  loadStarCatalogue: sky.load,
}));
vi.mock("../src/app/sceneFrame", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/app/sceneFrame")>()),
  runFrame: vi.fn(),
}));

import { catalogue } from "../src/assets/catalogue";
import type { SceneRuntime } from "../src/app/AstraeusScene";
import { createSceneResolver } from "../src/app/sceneLayout";
import { useSceneViews, useSkyStars } from "../src/app/sceneHooks";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { SimulationClock } from "../src/core/clock";
import {
  MADE_UP_STARS,
  belt,
  bodySetLayer,
  listen,
  owned,
  pathLayer,
  skyFigureLayers,
  trackedBody,
} from "./disposalFixtures";
import type { WebGLRenderer } from "three";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const gl = { getPixelRatio: () => 1, capabilities: { getMaxAnisotropy: () => 1 } } as unknown as WebGLRenderer;
const runtime = {
  clock: new SimulationClock(Date.UTC(2030, 0, 1)),
  resolver: createSceneResolver(createOrbAstronomyAdapter(), catalogue),
  catalogue,
  bodies: ["earth", "moon"],
  sceneCenter: "earth",
  trackedBodies: [trackedBody()],
  groups: [belt(2500)],
  paths: [pathLayer],
  composition: { paths: [{ body: "moon", spanMs: 27 * 86_400_000 }] },
  bodySets: [bodySetLayer()],
  sky: { visible: true, starBrightness: 1, milkyWayBrightness: 1, milkyWay: true },
  pictures: PICTURES,
  skyFigures: skyFigureLayers(),
} as unknown as SceneRuntime;

type Views = ReturnType<typeof useSceneViews>;
const roots: Root[] = [];
beforeEach(() => {
  sky.load.mockResolvedValue(null);
  vi.spyOn(TextureLoader.prototype, "load").mockImplementation(() => new Texture());
});
afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  vi.restoreAllMocks();
});

/** Mounts one viewer's views; hands back everything they own and how to unmount just this viewer. */
function mountViewer(): { readonly objects: ReturnType<typeof owned>; readonly unmount: () => void } {
  let views!: Views;
  const Probe = () => {
    views = useSceneViews(runtime, gl);
    useSkyStars(canvas, views.skyView); // the sky view is freed by the hook that loads its stars
    return null;
  };
  const canvas = document.createElement("canvas");
  const root = createRoot(document.createElement("div"));
  roots.push(root);
  act(() => root.render(createElement(Probe)));
  views.skyView!.requestPicture();
  views.skyView!.setStars(MADE_UP_STARS);
  const groups = [
    ...views.trackedViews.map((v) => v.group),
    ...views.groupViews.map((v) => v.group),
    ...views.sunCentredViews.map((v) => v.group),
    ...views.compositionPaths.map((v) => v.group),
    views.skyView!.group,
    views.skyFiguresView.group,
    ...views.bodySetViews.map((v) => v.group),
    ...views.orbitSetViews.map((v) => v.group),
  ];
  expect(views.trackedViews.length + views.groupViews.length + views.compositionPaths.length).toBe(3);
  return { objects: owned(...groups), unmount: () => act(() => root.unmount()) };
}

describe("useSceneViews frees what its views own", () => {
  it("disposes the objects of every view when the scene unmounts", () => {
    const viewer = mountViewer();
    const heard = listen(viewer.objects);
    expect(heard.size).toBeGreaterThan(20);
    viewer.unmount();
    for (const [object, count] of heard) expect(count, `${object.type} ${object.uuid}`).toBeGreaterThanOrEqual(1);
  });

  it("leaves a second viewer of the same runtime drawing until it too unmounts", () => {
    const first = mountViewer();
    const second = mountViewer();
    for (const object of first.objects) expect(second.objects.has(object)).toBe(false);
    const heardFirst = listen(first.objects);
    const heardSecond = listen(second.objects);
    first.unmount();
    for (const count of heardFirst.values()) expect(count).toBeGreaterThanOrEqual(1);
    for (const count of heardSecond.values()) expect(count).toBe(0);
    second.unmount();
    for (const count of heardSecond.values()) expect(count).toBeGreaterThanOrEqual(1);
  });
});
