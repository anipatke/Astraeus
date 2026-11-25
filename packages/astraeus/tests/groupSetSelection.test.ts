// @vitest-environment happy-dom
// O-101 T-462: a host label that selects several groups (`addLabels`) is a selection of its own, on both embedding paths (API-02, TEST-01, ARCH-03; made-up scenes only).
// The 3D scene is a stand-in that records the controls the page hands it; the shell, the host handle and the picking rule are real.
import { createElement, createElement as h } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync as flush } from "react-dom";

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

import { createRoot } from "react-dom/client";
import { AstraeusScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import { earth, moon } from "../src/api/bodies";
import type { GroupInput } from "../src/api/group";
import type { ViewerHandle } from "../src/api/viewerHandle";
import type { ViewerChange } from "../src/api/viewerLink";
import { createOrbitCameraState } from "../src/app/CameraController";
import { GroupSetTarget } from "../src/app/GroupSetTarget";
import { HostLabelPlacer, routeLabelPick } from "../src/app/hostLabels";
import type { PointsView } from "../src/app/PointsView";
import { pickCandidatesOf } from "../src/app/scenePicking";
import { attachScenePointer, type PointerState } from "../src/app/scenePointer";
import { focusAbsoluteOf, framedViewOf, type SceneTargets } from "../src/app/sceneTargets";
import { trueScale } from "../src/presentation/scalePolicy";
import { pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

const T0 = Date.parse("2026-01-01T00:00:00Z");
const tick = (ms = 20) => new Promise<void>((resolve) => setTimeout(resolve, ms));
async function until(check: () => void, timeoutMs = 2000): Promise<void> {
  const end = Date.now() + timeoutMs;
  for (;;) {
    try {
      check();
      return;
    } catch (error) {
      if (Date.now() > end) throw error;
    }
    await tick(10);
  }
}
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
const scene = (): Scene =>
  new Scene()
    .addBody(earth)
    .addBody(moon)
    .setTime(T0)
    .addGroup(group("belt-a"))
    .addGroup(group("belt-b"))
    .setViews(
      [
        { id: "swarm", label: "Swarm", objects: ["belt-a", "belt-b", "earth"] },
        { id: "plain", label: "Plain", objects: ["earth"] },
      ],
      { place: "top-bar" },
    )
    .addLabels([
      {
        id: "both",
        label: "Both belts",
        anchor: { groups: ["belt-a", "belt-b"] },
        selects: { groups: ["belt-a", "belt-b"] },
        description: "Two made-up belts taken together.",
        provenance: made,
      },
    ]);

interface Opened {
  handle: ViewerHandle;
  unmount(): void;
}
interface Driver {
  readonly name: string;
  open(): Promise<Opened>;
}
const mountDriver: Driver = {
  name: "mount",
  async open() {
    const element = document.createElement("div");
    document.body.append(element);
    const handle = mount(element, scene(), {});
    await handle.ready;
    return { handle, unmount: () => handle.unmount() };
  },
};
const reactDriver: Driver = {
  name: "AstraeusScene",
  async open() {
    const element = document.createElement("div");
    document.body.append(element);
    const root = createRoot(element);
    const ref: { current: ViewerHandle | null } = { current: null };
    let ready = false;
    flush(() => root.render(h(AstraeusScene, { scene: scene(), ref, onReady: () => (ready = true) })));
    await until(() => expect(ready).toBe(true));
    return { handle: ref.current!, unmount: () => root.unmount() };
  },
};

const controls = () => sceneProps.latest!.controls;
const card = () => document.querySelector(".info-panel");
const listOffers = (label: string): boolean =>
  [...document.querySelectorAll(".object-picker option")].some((option) => option.textContent === label);
const LABEL_RECT = { left: 140, top: 100, right: 240, bottom: 120 };

let opened: Opened | undefined;
beforeEach(() => {
  pretendScreen({});
  window.history.replaceState(null, "", "/app.html");
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
});
afterEach(() => {
  opened?.unmount();
  opened = undefined;
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** A canvas with the label's rectangle as the shown name, the way the scene lists pick targets, and the page's pick as the tap's result. */
function canvasWithLabel(): {
  canvas: HTMLCanvasElement;
  orbit: ReturnType<typeof createOrbitCameraState>;
  detach: () => void;
} {
  const canvas = document.createElement("canvas");
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
  const state: PointerState = {
    pickables: pickCandidatesOf({
      objects: controls().labelObjects,
      bodyIdFor: () => null,
      bodyScreens: [],
      widthPx: 800,
      heightPx: 600,
      labelRects: new Map([["both", LABEL_RECT]]),
      labelTargets: new HostLabelPlacer(controls().hostLabels!).tapTargets,
      canvas,
      bodySetViews: [],
    }),
    hoverPoint: null,
  };
  const orbit = createOrbitCameraState(16, "earth");
  const detach = attachScenePointer(
    canvas,
    orbit,
    state,
    () => ({ min: 1, max: 100 }),
    (id, options) => routeLabelPick(controls(), id, options),
  );
  return { canvas, orbit, detach };
}
const fire = (canvas: HTMLCanvasElement, type: string, x: number, y: number, buttons = 0): void => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { clientX: x, clientY: y, pointerId: 1, pointerType: "mouse", button: 0, buttons });
  canvas.dispatchEvent(event);
};
const MID = { x: (LABEL_RECT.left + LABEL_RECT.right) / 2, y: (LABEL_RECT.top + LABEL_RECT.bottom) / 2 };

describe.each([mountDriver, reactDriver])("a label that selects several groups: $name", (driver) => {
  it("setSelected(<label id>) selects it and reports one host change", async () => {
    opened = await driver.open();
    const { handle } = opened;
    const heard: { object?: string; cause: string }[] = [];
    handle.onSelect((change) => heard.push(change));
    handle.setSelected("both");
    await until(() => expect(handle.selected).toBe("both"));
    expect(heard).toEqual([expect.objectContaining({ object: "both", cause: "host" })]);
  });

  it("a tap on it is a visitor selection and opens the label's own card on a wide screen", async () => {
    opened = await driver.open();
    const { handle } = opened;
    const heard: ViewerChange[] | { object?: string; cause: string }[] = [];
    handle.onSelect((change) => (heard as { object?: string; cause: string }[]).push(change));
    await until(() => expect(controls().hostLabels).toBeDefined());
    const { canvas, detach } = canvasWithLabel();
    fire(canvas, "pointerdown", MID.x, MID.y);
    fire(canvas, "pointerup", MID.x, MID.y);
    detach();
    await until(() => expect(handle.selected).toBe("both"));
    expect(heard).toEqual([expect.objectContaining({ object: "both", cause: "visitor" })]);
    await until(() => expect(card()).not.toBeNull());
    expect(card()!.querySelector("h2")!.textContent).toBe("Both belts");
    expect(card()!.textContent).toContain("Two made-up belts taken together.");
    expect(card()!.textContent).toContain("Made up");
  });

  it("the Object list does not offer it until it is selected", async () => {
    opened = await driver.open();
    await until(() => expect(listOffers("belt-a")).toBe(true));
    expect(listOffers("Both belts")).toBe(false);
    opened.handle.setSelected("both");
    await until(() => expect(listOffers("Both belts")).toBe(true));
  });

  it("a view hiding all its groups hides it, and selecting it is bad-selection", async () => {
    opened = await driver.open();
    const { handle } = opened;
    handle.setView("plain");
    await until(() => expect(handle.view).toBe("plain"));
    await until(() => expect(controls().viewHidden?.objects.has("both")).toBe(true));
    expect(() => handle.setSelected("both")).toThrowError(expect.objectContaining({ code: "bad-selection" }));
    handle.setView("swarm");
    await until(() => expect(controls().viewHidden?.objects.has("both")).toBe(false));
    expect(() => handle.setSelected("both")).not.toThrow();
  });

  it("a drag from the label moves the camera and selects nothing", async () => {
    opened = await driver.open();
    const { handle } = opened;
    await until(() => expect(controls().hostLabels).toBeDefined());
    const { canvas, orbit, detach } = canvasWithLabel();
    const azimuth = orbit.azimuth;
    fire(canvas, "pointerdown", MID.x, MID.y);
    fire(canvas, "pointermove", MID.x + 60, MID.y + 20, 1);
    fire(canvas, "pointerup", MID.x + 60, MID.y + 20);
    detach();
    expect(orbit.azimuth).not.toBe(azimuth);
    expect(handle.selected).not.toBe("both");
    expect(card()).toBeNull();
  });
});

/** A made-up view of one group for the camera's questions: where its centroid is, how far its dots reach, how many there are. */
const view = (id: string, at: [number, number, number], extent: number, count: number, drawn = true): PointsView =>
  ({
    id,
    drawn,
    absolute: () => at,
    extentUnits: () => extent,
    layer: { group: { count } },
  }) as unknown as PointsView;

describe("the camera on a label that selects several groups", () => {
  const placer = () => new HostLabelPlacer(sceneLabels());
  const sceneLabels = () => {
    sceneProps.latest = null;
    return [
      {
        id: "both",
        label: "Both",
        labelPriority: 80,
        anchor: { groups: ["a", "b"] },
        selects: { groups: ["a", "b"] },
      },
      { id: "one", label: "One", labelPriority: 80, anchor: { groups: ["a"] }, selects: { groups: ["a"] } },
    ] as const;
  };
  const a = view("a", [0, 0, 0], 2, 1);
  const b = view("b", [10, 0, 0], 3, 3);
  const targets = (): SceneTargets =>
    ({
      bodyIdFor: () => null,
      placed: new Map(),
      absoluteOf: () => [0, 0, 0],
      groupViews: [a, b],
      sunCentredViews: [],
      trackedViews: [],
      hostLabels: placer(),
      timeUtcMs: 0,
      policy: trueScale,
      placement: {} as SceneTargets["placement"],
    }) as SceneTargets;

  it("focuses the member-weighted mean of the centroids and frames every group's dots", () => {
    const t = targets();
    const mean = focusAbsoluteOf(t, "both");
    expect(mean).toEqual([7.5, 0, 0]);
    const framed = framedViewOf(t, "both") as GroupSetTarget;
    expect(framed).toBeInstanceOf(GroupSetTarget);
    const radius = framed.extentUnits(trueScale);
    for (const g of [a, b]) {
      const c = g.absolute();
      expect(Math.hypot(c[0] - mean[0], c[1] - mean[1], c[2] - mean[2]) + g.extentUnits(trueScale)).toBeLessThanOrEqual(
        radius,
      );
    }
    expect(radius).toBe(7.5 + 2);
  });

  it("is drawn while any group is, and a single-group label is no set", () => {
    const t = targets();
    expect((framedViewOf(t, "both") as GroupSetTarget).drawn).toBe(true);
    expect(new GroupSetTarget("x", [view("a", [0, 0, 0], 1, 1, false)]).drawn).toBe(false);
    expect(framedViewOf(t, "one")).toBeUndefined();
    expect(() => focusAbsoluteOf(t, "one")).toThrow(RangeError);
  });
});
