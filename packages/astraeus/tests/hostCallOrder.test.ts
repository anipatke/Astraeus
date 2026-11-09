// @vitest-environment happy-dom
// Host calls that must always land (O-061 T-284, I-150 with I-153, and I-151), written as a host page makes them on a made-up scene (ARCH-03), on both embedding paths:
// `mount` and `AstraeusScene` (handle from `ref` / `onReady`). The 3D scene is a stand-in that exposes the controls the page hands it (as hostCameraDom.test.ts does); the one real
// first-frame camera step (`stepCameraTarget`) is run on those controls where a call made before the first frame matters.
// A case that reproduces a lost call is `it.fails`, naming its Issue; it turns into a plain `it` when T-285 / T-286 fix it. See the Task's Technical Evidence for each cause.
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sceneProps = vi.hoisted(() => ({ latest: null as null | { controls: import("../src/app/AstraeusScene").SceneControls } }));
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: NonNullable<typeof sceneProps.latest>) => { sceneProps.latest = props; return createElement("div", { "data-testid": "scene" }); },
}));
vi.mock("../src/assets/sky", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { AstraeusScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import { earth, moon } from "../src/api/bodies";
import type { ViewerHandle } from "../src/api/viewerHandle";
import type { ViewerChange } from "../src/api/viewerLink";
import { catalogue } from "../src/assets/catalogue";
import { readableScale } from "../src/core/scalePolicy";
import { createOrbitCameraState } from "../src/app/CameraController";
import { stepCameraTarget } from "../src/app/sceneCamera";
import type { SceneTargets } from "../src/app/sceneTargets";
import type { RenderVector } from "../src/app/renderCoordinates";
import { EQUATORIAL_UP } from "../src/app/viewUp";
import { $, drawn, pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const samples = (x: number) => [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [x + i * 1_000, 0, 0], velocityKmS: [1, 0, 0] }));
const made = { sourceType: "observed", sources: ["A made-up source"], accuracy: "None claimed.", notes: "Made up." } as const;
/** Views a (probe A) and b (probe B); Earth and the Moon are in every view. `rule` is view b's camera rule. */
const makeScene = (rule: unknown = "stay") => new Scene().addBody(earth).addBody(moon)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: samples(10_000) })
  .addTrajectory({ id: "pb", label: "Probe B", center: "earth", samples: samples(20_000) })
  .setViews([{ id: "a", label: "View A", objects: ["pa"] }, { id: "b", label: "View B", objects: ["pb"], camera: rule as never }], { place: "top-bar" });

let host: HTMLElement;
let root: Root | undefined;
beforeEach(() => {
  pretendScreen({});
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(() => { if (root) act(() => root!.unmount()); root = undefined; host.remove(); sceneProps.latest = null; vi.unstubAllGlobals(); vi.useRealTimers(); });

const controls = () => sceneProps.latest!.controls;
const settle = () => act(async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); });

/** Runs the scene's real first-frame camera step on the controls the page handed it, as the 3D scene does on its first frame; returns where the camera ends up. */
function firstFrame(): string {
  const positions = new Map<string, RenderVector>([["earth", [0, 0, 0]], ["moon", [60, 0, 0]]]);
  const targets = { bodyIdFor: (id: string) => (catalogue.has(id) ? id : null), placed: positions, absoluteOf: (id: string) => positions.get(id) ?? [0, 0, 0], groupViews: [], sunCentredViews: [], trackedViews: [], bodySetViews: [], timeUtcMs: 0, policy: readableScale, placement: {} } as unknown as SceneTargets;
  const camState = createOrbitCameraState(16, "earth");
  return stepCameraTarget({ camState, controls: controls(), targets, frame: { centre: "earth", span: 60, bodies: catalogue }, catalogue, reach: {}, fovDeg: 45, viewUp: EQUATORIAL_UP, firstFrame: true, previousUp: null } as never);
}

/** How each embedding path hands the page its handle once `ready` has resolved: `mount` returns it, `AstraeusScene` gives it to `onReady` (and `ref`). */
interface Path { readonly name: string; readonly start: (scene: Scene, onReady: (handle: ViewerHandle) => void) => Promise<ViewerHandle> }
const paths: readonly Path[] = [
  { name: "mount", start: async (scene, onReady) => { const handle = mount(host, scene); await drawn(handle); await handle.ready.then(() => onReady(handle)); return handle; } },
  { name: "AstraeusScene", start: async (scene, onReady) => {
    const ref: { current: ViewerHandle | null } = { current: null };
    root = createRoot(host);
    await act(async () => { root!.render(createElement(AstraeusScene, { scene, ref, onReady, onError: (e: Error) => { throw e; } })); });
    await settle();
    return ref.current!;
  } },
];

describe.each(paths)("host calls straight after ready, before the first frame ($name)", ({ start }) => {
  // The call runs in the ready callback: no frame has been drawn yet (the stand-in scene never draws one; `firstFrame()` plays it).
  it("setTime and setView take effect", async () => {
    let seen: Array<string | number | undefined> = [];
    const handle = await start(makeScene(), (h) => { h.setTime(T0 + 20 * MIN); h.setView("b"); seen = [h.timeUtcMs, h.view]; });
    expect(seen).toEqual([T0 + 20 * MIN, "b"]);
    expect(handle.timeUtcMs).toBe(T0 + 20 * MIN);
    expect(handle.view).toBe("b");
  });

  it("setCamera is accepted (does not throw) and reaches the scene's request", async () => {
    await start(makeScene(), (h) => h.setCamera({ follow: "moon" }));
    expect(controls().cameraRequest).toEqual({ kind: "follow", target: "moon" });
  });

  // I-150: the scene's first frame (sceneCamera.openFirstFrame) opens on the scene's start view and clears any pending request, so a host's follow is lost.
  it.fails("setCamera in a scene that opens on a start view still takes effect after the first frame (I-150)", async () => {
    const scene = makeScene();
    scene.camera.follow("earth");
    await start(scene, (h) => h.setCamera({ follow: "moon" }));
    expect(firstFrame()).toBe("moon");
  });

  it("without a start view the same call survives the first frame", async () => {
    await start(makeScene(), (h) => h.setCamera({ follow: "moon" }));
    expect(firstFrame()).toBe("moon");
  });
});

describe.each(paths)("host calls from inside an onChange that reports a view switch ($name)", ({ start }) => {
  /** The scene opens following Probe A (view a); the visitor presses View B, which hides it; the page answers the report with `answer`. */
  const switchWith = async (answer: (handle: ViewerHandle, change: ViewerChange) => void, rule: unknown = "stay") => {
    const scene = makeScene(rule);
    scene.camera.follow("pa");
    const handle = await start(scene, () => undefined);
    let reported = 0;
    handle.onChange((change) => { if (change.view === "b" && reported++ === 0) answer(handle, change); });
    controls().cameraRequest = null; // the opening framing was consumed by the first frame
    act(() => { $(host, '[data-view-id="b"]').dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true })); });
    await settle();
    expect(reported).toBeGreaterThan(0);
    return handle;
  };

  // I-150: the view's camera rule runs in the shell's effect after the render, so its request (hold, for `stay`) replaces the page's request made earlier, inside onChange.
  it.fails("setCamera lands and is not replaced by the view's own camera rule (I-150)", async () => {
    await switchWith((h) => h.setCamera({ follow: "pb" }));
    expect(controls().cameraRequest).toEqual({ kind: "follow", target: "pb" });
  });

  it("setTime lands", async () => {
    const handle = await switchWith((h) => h.setTime(T0 + 25 * MIN));
    expect(handle.timeUtcMs).toBe(T0 + 25 * MIN);
  });

  it("setView to a third place lands, and the view reads as the last call made", async () => {
    const handle = await switchWith((h) => h.setView("a"));
    expect(handle.view).toBe("a");
  });
});

describe.each(paths)("a view's follow rule on a planet another view also shows ($name)", ({ start }) => {
  // Earth and the Moon are in both views. The camera follows Earth in view a; view b's rule says follow the Moon.
  // I-153: the rule only runs when the followed object is not in the new view (AstraeusShell effect, `target === undefined`), so a shared planet never triggers it.
  it.fails("switching to the view makes the camera follow what its rule names (I-150 / I-153)", async () => {
    const scene = makeScene({ follow: "moon" });
    scene.camera.follow("earth");
    const handle = await start(scene, () => undefined);
    controls().cameraRequest = null;
    act(() => handle.setView("b"));
    await settle();
    expect(controls().cameraRequest).toEqual({ kind: "follow", target: "moon" });
  });

  it("still applies when the followed object is not in the new view", async () => {
    const scene = makeScene({ follow: "moon" });
    scene.camera.follow("pa");
    const handle = await start(scene, () => undefined);
    controls().cameraRequest = null;
    act(() => handle.setView("b"));
    await settle();
    expect(controls().cameraRequest).toEqual({ kind: "follow", target: "moon" });
  });
});

describe.each(paths)("a host setTime against a visitor seek for story panels ($name)", ({ start }) => {
  const withPanel = () => new Scene().addBody(earth).addBody(moon)
    .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: samples(10_000) })
    .addStoryPanels([{ id: "p1", at: { time: T0 + 10 * MIN }, title: "Title p1", body: ["A line."], provenance: made } as never]);
  const panelOpen = () => host.querySelector(".story-panel") !== null;

  it("a visitor seek across a panel while playing opens nothing (the baseline)", async () => {
    await start(withPanel(), (h) => h.setPlaying(true));
    const slider = $(host, 'input[aria-label="Seek timeline"]') as HTMLInputElement;
    act(() => {
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(slider), "value")?.set?.call(slider, String(T0 + 15 * MIN));
      slider.dispatchEvent(new window.Event("change", { bubbles: true }));
    });
    expect(panelOpen()).toBe(false);
  });

  // I-151: the shell's `seek` re-bases the story crossing check (`story.noteSeek`); the host's `seek` handed to the link (App.tsx `seekTo`) does not, so playback appears to cross the panel.
  it.fails("a host setTime across a panel while playing opens nothing, as a visitor seek does (I-151)", async () => {
    const handle = await start(withPanel(), (h) => h.setPlaying(true));
    act(() => handle.setTime(T0 + 15 * MIN));
    expect(panelOpen()).toBe(false);
  });
});
