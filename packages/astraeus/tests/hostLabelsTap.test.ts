// @vitest-environment happy-dom
// O-101 T-461: a tap on a host label (`addLabels`) does what its `selects` says, on a made-up scene (ARCH-03, TEST-01). The 3D scene is a stand-in that records the controls the page hands it;
// the shell, the picking rule and the canvas pointer listeners are real, so a tap goes from a pressed point to the page exactly as it does in the viewer.
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sceneProps = vi.hoisted(() => ({
  latest: null as null | { controls: import("../src/app/AstraeusScene").SceneControls },
}));
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: NonNullable<typeof sceneProps.latest>) => {
    sceneProps.latest = props;
    return createElement("div", { "data-testid": "scene" });
  },
}));
vi.mock("../src/assets/sky", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/assets/sky")>()),
  loadStarCatalogue: vi.fn().mockResolvedValue(null),
}));

import { Scene, earth, moon, customBlock, panel, type GroupInput, type LabelInput } from "astraeus";
import { App } from "../src/app/App";
import { createOrbitCameraState } from "../src/app/CameraController";
import { HostLabelPlacer, routeLabelPick } from "../src/app/hostLabels";
import { pickCandidatesOf } from "../src/app/scenePicking";
import { attachScenePointer, type PointerState } from "../src/app/scenePointer";
import { definitionOf } from "../src/api/definitionOf";
import { pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.parse("2026-01-01T00:00:00Z");
const group = (id: string): GroupInput => ({
  id,
  plane: "ecliptic-j2000",
  orbits: [0, 1, 2].map((k) => ({
    id: `${id}-${k}`,
    semiMajorAxisKm: 80_000 + 5_000 * k,
    eccentricity: 0.1,
    inclinationDeg: 5,
    raanDeg: 40,
    argumentOfPeriapsisDeg: 70,
  })),
});
const made = { sourceType: "illustrative", sources: ["Made up"], accuracy: "Not real.", notes: "" } as const;
const point = { positionKm: [1e8, 0, 0], plane: "EQJ" } as const;
const labels: readonly LabelInput[] = [
  { id: "on-group", label: "Belt A", anchor: { groups: ["belt-a"] }, selects: { groups: ["belt-a"] } },
  { id: "on-story", label: "Story", anchor: point, selects: { panel: "story-one" } },
  { id: "on-shelf", label: "Shelf", anchor: point, selects: { panel: "shelf-one" } },
  { id: "plain", label: "Plain", anchor: point },
];
const definition = () =>
  definitionOf(
    new Scene()
      .addBody(earth)
      .addBody(moon)
      .setTime(T0)
      .addGroup(group("belt-a"))
      .addGroup(group("belt-b"))
      .addStoryPanels([{ id: "story-one", title: "Story one", body: "Made up.", provenance: made }])
      .addParts([
        panel({
          id: "shelf-one",
          button: { label: "Shelf" },
          title: "Shelf one",
          blocks: [customBlock({ id: "blk" })],
        }),
      ])
      .addLabels(labels),
  );

let container: HTMLElement;
let root: Root;
let canvas: HTMLCanvasElement;
let detach: () => void;
const controls = () => sceneProps.latest!.controls;
const open = async () => {
  await act(async () => {
    root.render(createElement(App, { definition: definition() }));
  });
};

/** Where each shown label stands on the canvas (page px, the canvas's top left at 100, 50). */
const RECTS = new Map(
  ["on-group", "on-story", "on-shelf", "plain"].map((id, i) => [
    id,
    { left: 140, top: 100 + 60 * i, right: 240, bottom: 120 + 60 * i },
  ]),
);
const centre = (id: string) => {
  const r = RECTS.get(id)!;
  return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
};
function fire(type: string, at: { x: number; y: number }, buttons = 0): void {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { clientX: at.x, clientY: at.y, pointerId: 1, pointerType: "mouse", button: 0, buttons });
  canvas.dispatchEvent(event);
}

/** Mounts the page, then listens on a canvas with the shown names as pick targets, the way the scene does. */
async function openWithPointer(): Promise<ReturnType<typeof createOrbitCameraState>> {
  await open();
  // The story panel opens by itself at the start: close it, so what a tap opens is the tap's.
  await act(async () => {
    container.querySelector<HTMLElement>('[aria-label="Close story panel"]')?.click();
  });
  canvas = document.createElement("canvas");
  Object.assign(canvas, { setPointerCapture: vi.fn() });
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    right: 800,
    bottom: 600,
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
  document.body.appendChild(canvas);
  const hostLabels = new HostLabelPlacer(controls().hostLabels!);
  const state: PointerState = {
    pickables: pickCandidatesOf({
      objects: [],
      bodyIdFor: () => null,
      bodyScreens: [],
      widthPx: 800,
      heightPx: 600,
      labelRects: RECTS,
      labelTargets: hostLabels.tapTargets,
      canvas,
      bodySetViews: [],
    }),
    hoverPoint: null,
  };
  const orbit = createOrbitCameraState(16, "earth");
  detach = attachScenePointer(
    canvas,
    orbit,
    state,
    () => ({ min: 1, max: 100 }),
    (id, options) => act(() => routeLabelPick(controls(), id, options)),
  );
  return orbit;
}
async function tap(id: string): Promise<void> {
  await act(async () => {
    fire("pointerdown", centre(id));
    fire("pointerup", centre(id));
  });
}
const card = () => container.querySelector(".info-panel");
const storyOpen = () => container.querySelector('[data-panel-id="story-one"]');
const shelfOpen = () => [...container.querySelectorAll("h2")].find((h) => h.textContent === "Shelf one") ?? null;

beforeEach(() => {
  pretendScreen({});
  window.history.replaceState(null, "", "/app.html");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  detach?.();
  canvas?.remove();
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("a tap on a host label", () => {
  it.each([
    ["desktop", false],
    ["phone", true],
  ] as const)("that selects one group selects it as the Object list does (%s)", async (_name, phone) => {
    pretendScreen({ phone });
    await openWithPointer();
    await tap("on-group");
    expect(controls().selectedObjectId).toBe("belt-a");
    expect(card() !== null).toBe(!phone);
  });

  it("that selects a story panel opens it, and one that selects a shelf panel opens that", async () => {
    await openWithPointer();
    await tap("on-story");
    expect(storyOpen()).not.toBeNull();
    expect(shelfOpen()).toBeNull();
    await tap("on-shelf");
    expect(shelfOpen()).not.toBeNull();
  });

  it("with no selects selects nothing", async () => {
    await openWithPointer();
    const before = controls().selectedObjectId;
    await tap("plain");
    expect(controls().selectedObjectId).toBe(before);
    expect(card()).toBeNull();
    expect(storyOpen()).toBeNull();
    expect(shelfOpen()).toBeNull();
  });

  it.each(["on-group", "on-story", "on-shelf", "plain"])(
    "a drag starting on %s moves the camera and selects nothing",
    async (id) => {
      const orbit = await openWithPointer();
      const before = controls().selectedObjectId;
      const azimuth = orbit.azimuth;
      const from = centre(id);
      await act(async () => {
        fire("pointerdown", from);
        fire("pointermove", { x: from.x + 60, y: from.y + 20 }, 1);
        fire("pointerup", { x: from.x + 60, y: from.y + 20 });
      });
      expect(orbit.azimuth).not.toBe(azimuth);
      expect(controls().selectedObjectId).toBe(before);
      expect(card()).toBeNull();
      expect(storyOpen()).toBeNull();
      expect(shelfOpen()).toBeNull();
    },
  );
});
