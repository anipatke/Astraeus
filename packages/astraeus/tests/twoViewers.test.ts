// @vitest-environment happy-dom
// Two viewers on one page (O-055 T-250, API-03): every pairing of the two embedding paths (`mount`, `<AstraeusScene>` in its own React root) runs one case list.
// What holds today is asserted; what later O-055 steps fix is `it.fails` / `it.todo`, named for the Task that fixes it. Only the 3D canvas is a stand-in (it hands each
// viewer's scene controls back through its own element); the scene, the data and the viewer are real. A host page is outside React's `act`.
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const controlsOf = vi.hoisted(() => new WeakMap<Element, import("../src/app/AstraeusScene").SceneControls>());
const runtimeOf = vi.hoisted(() => new WeakMap<Element, import("../src/app/AstraeusScene").SceneRuntime>());
const coverClaimOf = vi.hoisted(() => new WeakMap<Element, unknown>());
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: { controls: import("../src/app/AstraeusScene").SceneControls; runtime: import("../src/app/AstraeusScene").SceneRuntime; claimCover?: unknown }) => createElement("div", { "data-testid": "scene", ref: (el: HTMLDivElement | null) => { if (el) { controlsOf.set(el, props.controls); runtimeOf.set(el, props.runtime); coverClaimOf.set(el, props.claimCover); } } }),
}));
vi.mock("../src/assets/sky", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { createElement as h, type ReactElement } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { earth, io, jupiter, moon } from "../src/api/bodies";
import { JUPITER_MOON_SYSTEM } from "../src/core/bodies/jupiterMoons";
import type { DataSource } from "../src/api/data";
import { readBytes, readJson } from "../tools/import/test-io.mjs";
import { moonDataFolder } from "./moonData";
import { AstraeusScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import { viewerHandleOf, type ViewerHandle } from "../src/api/viewerHandle";
import { ViewerLink, type ViewerChange, type CameraPose } from "../src/api/viewerLink";
import type { SelectionChange } from "../src/api/viewerSelection";
import { pretendScreen } from "./domSetup";
import { PICTURES } from "astraeus-data";
import { describeBody } from "../src/app/bodyDraw";
import { catalogue } from "../src/assets/catalogue";
import { milkyWayPicture } from "../src/assets/sky";
import { trueScale } from "../src/core/scalePolicy";

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
  .setSwitches({ labels: { place: "top-bar" } })
  .setTimeline({ start: T0, end: T0 + 100 * DAY, rate: 60, rates: [60, 3600] });

/** One opened viewer, the same shape through either path. */
interface Viewer {
  readonly handle: ViewerHandle;
  readonly element: HTMLElement;
  unmount(): void;
}
/** A viewer opens with the made-up scene unless it is given another (and the data packages that scene needs). */
interface OpenWith { readonly scene?: Scene; readonly data?: readonly DataSource[]; readonly developerTools?: boolean; }
interface Adapter {
  readonly name: string;
  open(options?: OpenWith): Promise<Viewer>;
  /** Gives an open viewer a new scene the way a host does with this path (a rebuilt `<AstraeusScene>`; `mount` has no rebuild: unmount and mount again), resolving once the new scene is ready. */
  replace(viewer: Viewer, options: OpenWith): Promise<Viewer>;
}

const newElement = (): HTMLElement => { const element = document.createElement("div"); document.body.append(element); return element; };

const mountAdapter: Adapter = {
  name: "mount",
  async open(options = {}) {
    const element = newElement();
    const mounted = mount(element, options.scene ?? makeScene(), { ...(options.data === undefined ? {} : { data: options.data }), ...(options.developerTools === undefined ? {} : { developerTools: options.developerTools }) });
    await mounted.ready;
    return { handle: mounted, element, unmount: () => mounted.unmount() };
  },
  async replace(viewer, options) {
    viewer.unmount();
    return this.open(options);
  },
};

const sceneAdapter: Adapter = {
  name: "AstraeusScene",
  async open(options = {}) {
    const element = newElement();
    const root = createRoot(element);
    const ref: { current: ViewerHandle | null } = { current: null };
    const opened = await renderScene(root, ref, options);
    return { handle: ref.current!, element, unmount: () => flushSync(() => root.unmount()), ...(opened ? { root, ref } : {}) } as Viewer;
  },
  async replace(viewer, options) {
    const { root, ref } = viewer as Viewer & { root: Root; ref: { current: ViewerHandle | null } };
    await renderScene(root, ref, options);
    return viewer;
  },
};

/** Renders (or re-renders) `<AstraeusScene>` in a root and resolves when that scene's `onReady` fires. */
function renderScene(root: Root, ref: { current: ViewerHandle | null }, options: OpenWith): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    const el: ReactElement = h(AstraeusScene, { scene: options.scene ?? makeScene(), ref, ...(options.data === undefined ? {} : { data: options.data }), ...(options.developerTools === undefined ? {} : { developerTools: options.developerTools }), onReady: () => resolve(true), onError: reject });
    flushSync(() => root.render(el));
  });
}

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
  time: handle.time, rate: handle.rate, playing: handle.playing, view: handle.view, camera: handle.camera, eventZones: handle.eventZones, selected: handle.selected, look: handle.look, scale: handle.scale, switches: handle.switches,
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
  setLook: { call: (v) => v.handle.setLook({ starBrightness: 1.5 }), reads: (hd) => expect(hd.look?.starBrightness).toBe(1.5), hears: "changes" },
  setScale: { call: (v) => v.handle.setScale("readable-scale"), reads: (hd) => expect(hd.scale).toBe("readable-scale"), hears: "changes" },
  setSwitch: { call: (v) => v.handle.setSwitch("labels", false), reads: (hd) => expect(hd.switches).toEqual({ labels: false }), hears: "changes" },
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

/** A planet's moon data from the committed fits, behind a counting fetch (the real `prepareScene` reaches `installData`; only the network is stubbed). */
function stubMoonData() {
  const folder = moonDataFolder("jupiter");
  const index = readJson(`${folder}index.json`) as { bodies: { chunks: { path: string }[] }[] };
  const chunkUrls: Record<string, string> = Object.fromEntries(index.bodies.flatMap((body) => body.chunks.map(({ path }) => [path, `${folder}${path}`])));
  const fetched: string[] = [];
  JUPITER_MOON_SYSTEM.install(null);
  vi.stubGlobal("fetch", async (url: string) => {
    if (!url.startsWith(folder)) throw new Error("offline");
    fetched.push(url);
    const bytes = readBytes(url) as Uint8Array;
    return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
  });
  const data: DataSource[] = [{ name: "astraeus-data-jupiter", provides: ["io"], moonPositions: { centre: "jupiter", loadIndex: async () => index, chunkUrls } }];
  return {
    data,
    fetched,
    /** Io answers in both years, and no chunk file was fetched twice. */
    expectBoth: () => {
      const set = JUPITER_MOON_SYSTEM.ephemeris();
      expect(() => set.stateOf("io", Date.parse("2020-03-15T00:00:00Z"))).not.toThrow();
      expect(() => set.stateOf("io", Date.parse("2023-03-15T00:00:00Z"))).not.toThrow();
      expect(new Set(fetched).size).toBe(fetched.length);
    },
  };
}
const jupiterScene = (year: number) => new Scene().addBody(jupiter).addBody(io)
  .setTimeline({ start: Date.UTC(year, 2, 1), end: Date.UTC(year, 2, 20), rate: 60, rates: [60, 3600] });

describe.each([mountAdapter, sceneAdapter])("one viewer given a new scene: $name", (adapter) => {
  it("T-251: the new scene's moons load though an earlier scene of the same planet loaded first", async () => {
    const moons = stubMoonData();
    const viewer = await adapter.open({ scene: jupiterScene(2020), data: moons.data });
    open.push(viewer);
    expect(() => JUPITER_MOON_SYSTEM.ephemeris().stateOf("io", Date.parse("2023-03-15T00:00:00Z"))).toThrow();
    const next = await adapter.replace(viewer, { scene: jupiterScene(2023), data: moons.data });
    open[open.indexOf(viewer)] = next;
    moons.expectBoth();
  });
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

  const repeatedIds = (): string[] => {
    const ids = [...document.body.querySelectorAll("[id]")].map((el) => el.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  };
  it("no element id repeats in a document holding both viewers (default options)", async () => {
    await openPair(pairing);
    expect(repeatedIds()).toEqual([]);
  });

  // T-254: every id is made per viewer, so with both viewers showing their info panel and their Developer drawer (every fold open) no id repeats.
  it("T-254: no element id repeats when both viewers show the Developer drawer and the info panel", async () => {
    const first = await pairing.first.open({ developerTools: true });
    open.push(first);
    const second = await pairing.second.open({ developerTools: true });
    open.push(second);
    for (const viewer of [first, second]) {
      viewer.element.querySelector<HTMLButtonElement>('button[aria-label="Developer mode"]')!.click();
      viewer.element.querySelector<HTMLButtonElement>(".object-info-toggle")!.click();
      await vi.waitFor(() => expect(viewer.element.querySelector(".developer-heading")).not.toBeNull());
      await vi.waitFor(() => expect(viewer.element.querySelector(".info-panel")).not.toBeNull());
      for (let pass = 0; pass < 3; pass += 1) for (const fold of viewer.element.querySelectorAll<HTMLButtonElement>('.developer-tools button[aria-expanded="false"]')) fold.click();
    }
    expect(document.body.querySelectorAll(".info-panel")).toHaveLength(2);
    expect(repeatedIds()).toEqual([]);
  });

  it("T-251: two scenes of the same planet's moons at different years both get their moons", async () => {
    const moons = stubMoonData();
    const first = await pairing.first.open({ scene: jupiterScene(2020), data: moons.data });
    open.push(first);
    const second = await pairing.second.open({ scene: jupiterScene(2023), data: moons.data });
    open.push(second);
    moons.expectBoth();
  });

  // T-252: the pictures a viewer draws are those of the packages passed to it. Viewer A gets astraeus-data's pictures, B gets none; each pairing runs in both load orders.
  it.each([["A loads first", true], ["B loads first", false]])("T-252: a viewer given the pictures draws them and one given none draws none (%s)", async (_order, picturedFirst) => {
    const pictured: OpenWith = { data: [{ name: "astraeus-data", provides: [], pictures: PICTURES }] };
    const plain: OpenWith = {};
    const a = picturedFirst ? await pairing.first.open(pictured) : undefined;
    if (a) open.push(a);
    const b = await (picturedFirst ? pairing.second : pairing.first).open(plain);
    open.push(b);
    const a2 = a ?? await pairing.second.open(pictured);
    if (!a) open.push(a2);
    const drawn = (viewer: Viewer) => {
      const runtime = runtimeOf.get(viewer.element.querySelector("[data-testid=scene]")!)!;
      return {
        titan: describeBody(catalogue.get("titan"), trueScale, false, runtime.pictures).textureUrl,
        venus: describeBody(catalogue.get("venus"), trueScale, true, runtime.pictures).textureUrl,
        tiles: milkyWayPicture(runtime.pictures ?? {}).tiles.length,
      };
    };
    expect(drawn(a2)).toEqual({ titan: PICTURES.titan!.url, venus: PICTURES["venus-8k"]!.url, tiles: 1 });
    expect(drawn(b)).toEqual({ titan: undefined, venus: catalogue.get("venus").visual.texture!.url, tiles: 0 });
  });

  // T-253: one viewer with the Developer tools on and one off; only the first has the cog and the drawer, and opening it opens nothing in the other.
  it("T-253: developerTools on one viewer and off on the other", async () => {
    const withTools = await pairing.first.open({ developerTools: true });
    open.push(withTools);
    const without = await pairing.second.open({ developerTools: false });
    open.push(without);
    const cog = (viewer: Viewer) => viewer.element.querySelector<HTMLButtonElement>('button[aria-label="Developer mode"]');
    const drawer = (viewer: Viewer) => viewer.element.querySelector(".developer-tools");
    expect(cog(withTools)).not.toBeNull();
    expect(cog(without)).toBeNull();
    expect(drawer(without)).toBeNull();
    cog(withTools)!.click();
    await vi.waitFor(() => expect(cog(withTools)!.getAttribute("aria-expanded")).toBe("true"));
    await vi.waitFor(() => expect(withTools.element.querySelector(".developer-heading")).not.toBeNull());
    expect(without.element.querySelector(".developer-heading, .developer-tools")).toBeNull();
    expect(cog(without)).toBeNull();
    expect(drawer(without)).toBeNull();
  });

  // T-255: the document-level Escape listeners act only for the viewer the key was pressed in (every listener x every origin is the table in escapeScope.test.ts).
  it("T-255: Escape pressed inside A's open phone drawer closes A's and leaves B's open; on the page body it closes both; in a host input neither", async () => {
    pretendScreen({ phone: true });
    const [a, b] = await openPair(pairing);
    const drawerOpen = (v: Viewer) => v.element.querySelector(".controls-drawer")!.getAttribute("data-open") === "true";
    const openBoth = () => { for (const v of [a, b]) { if (!drawerOpen(v)) flushSync(() => v.element.querySelector<HTMLButtonElement>("button.controls-pill")!.click()); } };
    const escape = (target: Element) => flushSync(() => { target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); });
    const input = document.createElement("input");
    document.body.append(input);
    openBoth();
    expect([drawerOpen(a), drawerOpen(b)]).toEqual([true, true]);
    escape(input);
    expect([drawerOpen(a), drawerOpen(b)]).toEqual([true, true]);
    escape(a.element.querySelector("main")!);
    expect([drawerOpen(a), drawerOpen(b)]).toEqual([false, true]);
    openBoth();
    escape(b.element.querySelector("main")!);
    expect([drawerOpen(a), drawerOpen(b)]).toEqual([true, false]);
    openBoth();
    escape(document.body);
    expect([drawerOpen(a), drawerOpen(b)]).toEqual([false, false]);
  });
  it("T-255: a page's own #boot is never touched, and neither viewer is handed a loading cover", async () => {
    const boot = document.createElement("div");
    boot.id = "boot";
    boot.dataset.state = "loading";
    document.body.append(boot);
    const [a, b] = await openPair(pairing);
    for (const v of [a, b]) expect(coverClaimOf.get(v.element.querySelector("[data-testid=scene]")!)).toBeUndefined();
    vi.advanceTimersByTime(5000);
    expect(document.getElementById("boot")).toBe(boot);
    expect(boot.dataset.state).toBe("loading");
  });
});
