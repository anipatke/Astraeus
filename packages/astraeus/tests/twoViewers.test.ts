// @vitest-environment happy-dom
// Two viewers on one page (O-055 T-250, API-03): every pairing of the two embedding paths (`mount`, `<AstraeusScene>` in its own React root) runs one case list.
// What holds today is asserted; what later O-055 steps fix is `it.fails` / `it.todo`, named for the Task that fixes it. Only the 3D canvas is a stand-in (it hands each
// viewer's scene controls back through its own element); the scene, the data and the viewer are real. A host page is outside React's `act`.
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const controlsOf = vi.hoisted(() => new WeakMap<Element, import("../src/app/AstraeusScene").SceneControls>());
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: { controls: import("../src/app/AstraeusScene").SceneControls }) => createElement("div", { "data-testid": "scene", ref: (el: HTMLDivElement | null) => { if (el) controlsOf.set(el, props.controls); } }),
}));
vi.mock("../src/assets/sky", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { createElement as h, type ReactElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { earth, moon } from "../src/api/bodies";
import { AstraeusScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import { viewerHandleOf, type ViewerHandle } from "../src/api/viewerHandle";
import { ViewerLink, type ViewerChange, type CameraPose } from "../src/api/viewerLink";
import type { SelectionChange } from "../src/api/viewerSelection";
import { pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const DAY = 86_400_000;
const path = (x: number) => [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [x + i * 1_000, 0, 0], velocityKmS: [1, 0, 0] }));
/** Views a (probe A) and b (probe B); the Moon and Earth are in every view. Built fresh for each viewer. */
const makeScene = () => new Scene().addBody(earth).addBody(moon)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: path(10_000) })
  .addTrajectory({ id: "pb", label: "Probe B", center: "earth", samples: path(20_000) })
  .setViews([{ id: "a", label: "View A", paths: ["pa"] }, { id: "b", label: "View B", paths: ["pb"] }], { place: "top-bar" })
  .setTimeline({ start: T0, end: T0 + 100 * DAY, rate: 60, rates: [60, 3600] });

/** One opened viewer, the same shape through either path. */
interface Viewer {
  readonly handle: ViewerHandle;
  readonly element: HTMLElement;
  unmount(): void;
}
interface Adapter { readonly name: string; open(): Promise<Viewer>; }

const newElement = (): HTMLElement => { const element = document.createElement("div"); document.body.append(element); return element; };

const mountAdapter: Adapter = {
  name: "mount",
  async open() {
    const element = newElement();
    const mounted = mount(element, makeScene());
    await mounted.ready;
    return { handle: mounted, element, unmount: () => mounted.unmount() };
  },
};

const sceneAdapter: Adapter = {
  name: "AstraeusScene",
  async open() {
    const element = newElement();
    const root = createRoot(element);
    const ref: { current: ViewerHandle | null } = { current: null };
    const ready = new Promise<void>((resolve, reject) => {
      const el: ReactElement = h(AstraeusScene, { scene: makeScene(), ref, onReady: () => resolve(), onError: reject });
      flushSync(() => root.render(el));
    });
    await ready;
    return { handle: ref.current!, element, unmount: () => flushSync(() => root.unmount()) };
  },
};

interface Pairing { readonly name: string; readonly first: Adapter; readonly second: Adapter; }
const PAIRINGS: readonly Pairing[] = [
  { name: "mount + mount", first: mountAdapter, second: mountAdapter },
  { name: "AstraeusScene + AstraeusScene", first: sceneAdapter, second: sceneAdapter },
  { name: "mount + AstraeusScene", first: mountAdapter, second: sceneAdapter },
];

/** What a viewer's own listeners heard. */
interface Heard { readonly changes: ViewerChange[]; readonly selects: SelectionChange[]; readonly cameras: CameraPose[]; }
function listen(handle: ViewerHandle): Heard {
  const heard: Heard = { changes: [], selects: [], cameras: [] };
  handle.onChange((c) => heard.changes.push(c));
  handle.onSelect((c) => heard.selects.push(c));
  handle.onCameraChange((c) => heard.cameras.push(c));
  return heard;
}
const total = (heard: Heard): number => heard.changes.length + heard.selects.length + heard.cameras.length;

/** Every read of the handle at one moment, as a plain value. */
const snapshot = (handle: ViewerHandle) => ({
  time: handle.time, rate: handle.rate, playing: handle.playing, view: handle.view, camera: handle.camera, eventZones: handle.eventZones, selected: handle.selected,
});

/** The scene's stand-in for a camera standing here (the real scene writes it every frame). */
const standAt = (viewer: Viewer, pose: CameraPose): void => {
  controlsOf.get(viewer.element.querySelector("[data-testid=scene]")!)!.viewReadout = pose;
};
const cameraRequest = (viewer: Viewer) => controlsOf.get(viewer.element.querySelector("[data-testid=scene]")!)!.cameraRequest;

type Setter = {
  [K in keyof ViewerHandle as ViewerHandle[K] extends (...args: never[]) => void ? (K extends `set${string}` ? K : never) : never]: true;
};
interface Row {
  /** Makes the call on one viewer. */
  readonly call: (viewer: Viewer) => void;
  /** What that viewer's handle then reads. */
  readonly reads: (handle: ViewerHandle) => void;
  /** Which of that viewer's own listeners must have heard it. */
  readonly hears: "changes" | "cameras";
  /** What the scene would do after the call, when the stand-in has to do it. */
  readonly settle?: (viewer: Viewer) => void;
}
const CAMERA_POSE: CameraPose = { focus: "moon", azimuthDeg: 10, elevationDeg: 20, distance: 30 };
/** One row per setter on the handle: a new setter must join this table (the type fails otherwise). */
const SETTERS: Record<keyof Setter, Row> = {
  setTime: { call: (v) => v.handle.setTime(T0 + DAY), reads: (hd) => expect(hd.time).toBe(T0 + DAY), hears: "changes" },
  setRate: { call: (v) => v.handle.setRate(3600), reads: (hd) => expect(hd.rate).toBe(3600), hears: "changes" },
  setPlaying: { call: (v) => v.handle.setPlaying(true), reads: (hd) => expect(hd.playing).toBe(true), hears: "changes" },
  setView: { call: (v) => v.handle.setView("b"), reads: (hd) => expect(hd.view).toBe("b"), hears: "changes" },
  setCamera: {
    call: (v) => v.handle.setCamera({ focus: "moon" }),
    settle: (v) => { expect(cameraRequest(v)).toEqual({ kind: "focus", target: "moon" }); standAt(v, CAMERA_POSE); vi.advanceTimersByTime(300); },
    reads: (hd) => expect(hd.camera).toEqual(CAMERA_POSE),
    hears: "cameras",
  },
};

const OPENING_POSE: CameraPose = { focus: "earth", azimuthDeg: 0, elevationDeg: 0, distance: 5 };

let open: Viewer[] = [];
async function openPair(pairing: Pairing): Promise<[Viewer, Viewer]> {
  const first = await pairing.first.open();
  open.push(first);
  const second = await pairing.second.open();
  open.push(second);
  first.handle.setPlaying(false); second.handle.setPlaying(false); // a scene opens playing; both are held still so a clock moving is a leak, not playback
  standAt(first, OPENING_POSE); standAt(second, OPENING_POSE);
  vi.advanceTimersByTime(300); // each viewer takes the opening pose as its own before any listener is added
  return [first, second];
}

beforeEach(() => {
  pretendScreen({});
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] }); // the clock is held still: times are exact
});
afterEach(() => {
  for (const viewer of open) viewer.unmount();
  open = [];
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe.each(PAIRINGS)("two viewers on one page: $name", (pairing) => {
  describe.each(Object.entries(SETTERS))("%s on viewer A", (_name, row) => {
    it("changes A's reads and listeners, and leaves B's reads and listeners as they were", async () => {
      const [a, b] = await openPair(pairing);
      const heardA = listen(a.handle);
      const heardB = listen(b.handle);
      const before = snapshot(b.handle);
      row.call(a);
      row.settle?.(a);
      row.reads(a.handle);
      expect(heardA[row.hears].length).toBeGreaterThan(0);
      expect(snapshot(b.handle)).toEqual(before);
      expect(total(heardB)).toBe(0);
      expect(cameraRequest(b)).toBeNull();
    });
  });

  it("the setter table has a row for every setter the handle has", () => {
    const names = Object.keys(SETTERS).sort();
    const fromHandle = Object.keys(viewerHandleOf(new ViewerLink())).filter((key) => key.startsWith("set")).sort();
    expect(names).toEqual(fromHandle);
  });

  it("A's visitor choosing an object is heard by A's onSelect only", async () => {
    const [a, b] = await openPair(pairing);
    const heardA = listen(a.handle);
    const heardB = listen(b.handle);
    const menu = a.element.querySelector<HTMLSelectElement>('[aria-label="Select object"]')!;
    const choice = ["moon", "pa", "earth"].find((id) => id !== a.handle.selected)!;
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(menu), "value")!.set!.call(menu, choice);
    menu.dispatchEvent(new window.Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(heardA.selects.map((c) => c.object)).toEqual([choice]));
    expect(a.handle.selected).toBe(choice);
    expect(heardB.selects).toEqual([]);
    expect(total(heardB)).toBe(0);
  });

  it("unmounting A leaves B's handle working and B's page in place", async () => {
    const [a, b] = await openPair(pairing);
    const heardB = listen(b.handle);
    a.unmount();
    expect(a.handle.time).toBeUndefined();
    expect(b.element.querySelector("[data-testid=scene]")).not.toBeNull();
    expect(b.handle.time).toBeDefined();
    b.handle.setTime(T0 + 2 * DAY);
    expect(b.handle.time).toBe(T0 + 2 * DAY);
    expect(heardB.changes.length).toBeGreaterThan(0);
  });

  it("mounting A again beside B works, and B is untouched by it", async () => {
    const [a, b] = await openPair(pairing);
    a.unmount();
    const before = snapshot(b.handle);
    const again = await pairing.first.open();
    open.push(again);
    expect(again.handle.time).toBeDefined();
    again.handle.setTime(T0 + 3 * DAY);
    expect(again.handle.time).toBe(T0 + 3 * DAY);
    expect(snapshot(b.handle)).toEqual(before);
  });

  // Expected to fail today: both viewers draw the same fixed ids (info-panel, controls-drawer, ...). T-254 gives every id an owner-scoped name; then this passes and `.fails` comes off.
  it.fails("T-254 fixes: no element id repeats in a document holding both viewers", async () => {
    await openPair(pairing);
    const ids = [...document.body.querySelectorAll("[id]")].map((el) => el.id);
    const repeated = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(repeated).toEqual([]);
  });

  it.todo("T-251: two scenes of the same planet's moons at different years both get their moons");
  it.todo("T-252: each viewer draws only its own data packages' pictures");
  it.todo("T-253: developerTools on one viewer and off on the other");
  it.todo("T-255: Escape closes only the panel of the viewer it was pressed in");
  it.todo("T-255: the loading cover is not touched by an outside host's viewer");
});
