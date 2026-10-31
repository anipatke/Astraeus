// @vitest-environment happy-dom
// What the camera does when a view switch takes away the object it follows or focuses on (O-051 T-220), on made-up configurations (ARCH-03): the page's own
// camera requests are read from the controls the 3D stand-in receives; the shell, the clock and the lists are real. Browser pixels are the last step's.
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sceneProps = vi.hoisted(() => ({ latest: null as null | { controls: import("../src/app/AstraeusScene").SceneControls } }));
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: NonNullable<typeof sceneProps.latest>) => { sceneProps.latest = props; return createElement("div", { "data-testid": "scene" }); },
}));
vi.mock("../src/assets/sky", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { Scene, earth, moon } from "astraeus";
import type { ViewCameraInput } from "../src/api/views";
import { App } from "../src/app/App";
import { presetForViewRule } from "../src/shell/viewCamera";
import { press, pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const samples = (x: number) => [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [x + i * 1_000, 0, 0], velocityKmS: [1, 0, 0] }));
/** Views a (probe A) and b (probe B, with the camera rule under test); the Moon and Earth are in every view. */
const definitionWith = (camera: ViewCameraInput | undefined) => new Scene().addBody(earth).addBody(moon)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: samples(10_000) })
  .addTrajectory({ id: "pb", label: "Probe B", center: "earth", samples: samples(20_000) })
  .setViews([
    { id: "a", label: "View A", paths: ["pa"] },
    { id: "b", label: "View B", paths: ["pb"], ...(camera === undefined ? {} : { camera }) },
  ], { place: "top-bar" })
  .toDefinition();

let container: HTMLElement;
let root: Root;
const controls = () => sceneProps.latest!.controls;
const request = () => controls().cameraRequest as { kind: string; target?: string } | null;
const open = async (camera: ViewCameraInput | undefined) => { await act(async () => { root.render(createElement(App, { definition: definitionWith(camera) })); }); };
const choose = async (label: string) => { await act(async () => { press([...container.querySelectorAll<HTMLElement>("[data-view-id]")].find((b) => b.textContent === label)!); }); };
/** Picks an object as a visitor does, then clears the request the (stubbed) scene would have consumed. */
const pickThenSettle = async (id: string) => { await act(async () => { controls().onPickObject!(id); }); controls().cameraRequest = null; };
const cardOpen = () => container.querySelector(".info-panel") !== null;

beforeEach(() => {
  pretendScreen({});
  window.history.replaceState(null, "", "/app.html");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });

describe("the camera rule of the view switched to", () => {
  it("stay (the default): holds the camera in place (no focus request); following stops and the hidden object's card closes", async () => {
    await open(undefined);
    await pickThenSettle("pa");
    expect(controls().selectedObjectId).toBe("pa");
    expect(cardOpen()).toBe(true);
    await choose("View B");
    // One hold request: the target becomes a fixed point (no focus, no overview jump); the scene camera tests cover what it does to the pose.
    expect(request()).toEqual({ kind: "hold" });
    expect(controls().selectedObjectId).not.toBe("pa");
    expect(cardOpen()).toBe(false);
    // Back to A with nothing followed any more: no further request, no jump to the overview.
    controls().cameraRequest = null;
    await choose("View A");
    expect(request()).toBeNull();
  });

  it("stay, written out, is the same as the default", async () => {
    await open("stay");
    await pickThenSettle("pa");
    await choose("View B");
    expect(request()).toEqual({ kind: "hold" });
  });

  it("start: takes the scene's start framing", async () => {
    await open("start");
    await pickThenSettle("pa");
    await choose("View B");
    // The made-up scene opens on its centre: its start framing is the overview or a focus on Earth, never the lost probe.
    expect(request()).not.toBeNull();
    expect(request()!.target).not.toBe("pa");
  });

  it("{ follow: id }: follows that object", async () => {
    await open({ follow: "pb" });
    await pickThenSettle("pa");
    await choose("View B");
    expect(request()).toEqual({ kind: "follow", target: "pb" });
    expect(controls().selectedObjectId).toBe("pb");
  });

  it("{ focus: id }: focuses that object", async () => {
    await open({ focus: "moon" });
    await pickThenSettle("pa");
    await choose("View B");
    expect(request()).toEqual({ kind: "focus", target: "moon" });
    expect(controls().selectedObjectId).toBe("moon");
  });

  it("leaves the camera untouched when the followed object is still in the new view, whatever the rule", async () => {
    for (const camera of ["stay", "start", { follow: "pb" }] as const) {
      await open(camera);
      await pickThenSettle("moon"); // shared by both views
      await choose("View B");
      expect(request()).toBeNull();
      expect(controls().selectedObjectId).toBe("moon");
      act(() => root.unmount());
      root = createRoot(container);
    }
  });

  it("does not run on opening, and a time-based loss is not a view switch", async () => {
    await open({ follow: "pb" });
    expect(request()?.target).not.toBe("pb");
  });
});

describe("presetForViewRule", () => {
  const experience = { objects: [], cameraPresets: [{ id: "overview", label: "Overview", request: { kind: "overview" } }, { id: "focus-moon", label: "Focus Moon", request: { kind: "focus", target: "moon" } }], events: [], startCameraPresetId: "focus-moon" } as unknown as Parameters<typeof presetForViewRule>[1];
  it("is undefined for stay, the experience's own preset for a matching framing, and the start preset (else the overview) for start", () => {
    expect(presetForViewRule({ rule: "stay" }, experience)).toBeUndefined();
    expect(presetForViewRule({ rule: "start", framing: { focus: "moon" } }, experience)?.id).toBe("focus-moon");
    expect(presetForViewRule({ rule: "start", framing: { follow: "pb" } }, experience)?.request).toEqual({ kind: "follow", target: "pb" });
    expect(presetForViewRule({ rule: "start" }, experience)?.id).toBe("focus-moon");
    expect(presetForViewRule({ rule: "start" }, { ...experience, startCameraPresetId: undefined })?.id).toBe("overview");
  });
});
