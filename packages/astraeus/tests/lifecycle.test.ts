// @vitest-environment happy-dom
// One lifecycle contract, run against both embedding paths (`mount` and `<AstraeusScene>`) from one case list (O-054 T-243, API-02), so the two cannot drift apart again.
// A host page is outside React's `act`: nothing here flushes effects for the viewer.
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sceneProps = vi.hoisted(() => ({ latest: null as null | { controls: import("../src/app/AstraeusScene").SceneControls } }));
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: NonNullable<typeof sceneProps.latest>) => { sceneProps.latest = props; return createElement("div", { "data-testid": "scene" }); },
}));
const prepared = vi.hoisted(() => ({ fail: false, gate: undefined as undefined | Promise<void>, real: false }));
vi.mock("../src/api/prepared", async () => {
  const { syntheticDefinition } = await import("../src/synthetic/syntheticDefinition");
  const actual = await vi.importActual<typeof import("../src/api/prepared")>("../src/api/prepared");
  return {
    prepareScene: (scene: import("../src/api/scene").Scene, data?: readonly import("../src/api/scene").DataSource[]) => {
      if (prepared.real) return actual.prepareScene(scene, data);
      return { definition: { ...syntheticDefinition }, ready: prepared.fail ? Promise.reject(new Error("load failed")) : (prepared.gate ?? Promise.resolve()) };
    },
  };
});

import { createElement as h, StrictMode, type ReactElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { AstraeusScene } from "../src/api/AstraeusScene";
import { SceneError } from "../src/api/errors";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import { SceneCamera } from "../src/api/planCamera";
import { earth } from "../src/api/bodies";
import { viewerHandleOf, type ViewerHandle } from "../src/api/viewerHandle";
import { ViewerLink, type CameraPose, type ViewerChange } from "../src/api/viewerLink";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { definitionOf, missingDataOf } from "../src/api/definitionOf";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

const { startUtcMs, endUtcMs } = syntheticDefinition.experience.window;
const MID = startUtcMs + Math.floor((endUtcMs - startUtcMs) / 2);
const MID_2026 = Date.UTC(2026, 5, 1);
const RATE = syntheticDefinition.experience.rates[0];
const tick = (ms = 20) => new Promise<void>((resolve) => setTimeout(resolve, ms)); // setTimeout stays real; only the interval clock is held

/** What a host sees of one opened scene, the same through either path. */
interface Opened {
  /** The handle; undefined when the scene could not be built (mount threw). */
  handle: ViewerHandle | undefined;
  /** Errors the host was told of, in order (mount: the throw and a rejected `ready`; React: `onError`). */
  readonly errors: Error[];
  /** Times the host heard "usable" (mount: `ready` resolved; React: `onReady`). */
  readonly readyCount: () => number;
  /** Every `onChange` the host registered with the scene itself (option / prop), not through the handle. */
  readonly changes: ViewerChange[];
  /** Resolves when the host has heard `ready` / `onReady` the next time; rejects when it hears an error. */
  readonly ready: () => Promise<void>;
  /** Unmounts the scene. */
  unmount(): void;
  /** Builds the scene again (mount: unmount and mount; React: a new `scene` prop) and resolves when it is usable again. */
  rebuild(next?: Scene): Promise<void>;
  /** Waits for the host to hear nothing (`"silent"`) or reports the error code / "ready" it hears. */
  outcome(): Promise<string>;
}
interface Driver { readonly name: string; open(scene: Scene): Promise<Opened>; readonly silentOnEarlyUnmount: boolean; }

const errorCode = (error: unknown): string => (error instanceof SceneError ? error.code : error instanceof Error ? error.message : String(error));

const mountDriver: Driver = {
  name: "mount",
  silentOnEarlyUnmount: false,
  async open(scene) {
    const element = document.createElement("div");
    document.body.append(element);
    const errors: Error[] = [];
    const changes: ViewerChange[] = [];
    let ready = 0;
    let current: ReturnType<typeof mount> | undefined;
    const build = (shown: Scene = scene): Promise<void> => {
      try { current = mount(element, shown, { onChange: (c) => changes.push(c) }); } catch (error) { errors.push(error as Error); current = undefined; return Promise.reject(error); }
      opened.handle = current;
      return current.ready.then(() => { ready += 1; }, (error: Error) => { errors.push(error); throw error; });
    };
    const opened: Opened = {
      handle: undefined, errors, changes, readyCount: () => ready,
      ready: () => settledReady,
      unmount: () => current?.unmount(),
      rebuild: (next) => { current?.unmount(); settledReady = build(next); return settledReady; },
      outcome: () => settledReady.then(() => "ready", (error: unknown) => errorCode(error)),
    };
    let settledReady = build();
    settledReady.catch(() => undefined);
    return opened;
  },
};

const reactDriver = (strict: boolean): Driver => ({
  name: strict ? "AstraeusScene (StrictMode)" : "AstraeusScene",
  silentOnEarlyUnmount: true,
  async open(scene) {
    const element = document.createElement("div");
    document.body.append(element);
    const root = createRoot(element);
    const errors: Error[] = [];
    const changes: ViewerChange[] = [];
    const ref: { current: ViewerHandle | null } = { current: null };
    let ready = 0;
    let waiters: Array<{ ok: () => void; fail: (e: Error) => void }> = [];
    const render = (s: Scene): void => {
      const el: ReactElement = h(AstraeusScene, {
        scene: s, ref, onChange: (c: ViewerChange) => changes.push(c),
        onReady: () => { ready += 1; waiters.splice(0).forEach((w) => w.ok()); },
        onError: (e: Error) => { errors.push(e); waiters.splice(0).forEach((w) => w.fail(e)); },
      });
      flushSync(() => root.render(strict ? h(StrictMode, null, el) : el));
    };
    const wait = (): Promise<void> => new Promise<void>((ok, fail) => { waiters.push({ ok, fail }); });
    const opened: Opened = {
      handle: undefined, errors, changes, readyCount: () => ready,
      ready: () => (ready > 0 && errors.length === 0 ? Promise.resolve() : wait()),
      unmount: () => root.unmount(),
      rebuild: (next) => { const heard = wait(); render(next ?? new Scene()); return heard; },
      outcome: () => Promise.race([wait().then(() => "ready", (error: unknown) => errorCode(error)), tick(60).then(() => "silent")]),
    };
    render(scene); // flushSync: the commit has happened, so the ref is set
    opened.handle = ref.current ?? undefined;
    return opened;
  },
});

/** The handle's members, read from one table: a new member of `ViewerHandle` must join it (the last test fails otherwise). */
const READS = ["timeUtcMs", "rate", "playing", "view", "camera", "eventZones", "selected", "look", "scale", "switches", "pick"] as const;
const CALLS: Record<string, (handle: ViewerHandle) => void> = {
  setTime: (handle) => handle.setTime(MID),
  setRate: (handle) => handle.setRate(RATE),
  setPlaying: (handle) => handle.setPlaying(true),
  setView: (handle) => handle.setView("a"),
  setCamera: (handle) => handle.setCamera({ follow: "x" }),
  setLook: (handle) => handle.setLook({ starBrightness: 1.2 }),
  setScale: (handle) => handle.setScale("readable-scale"),
  setSwitch: (handle) => handle.setSwitch("labels", false),
  setPick: (handle) => handle.setPick("b"),
};
/** Listener registration is allowed at any time (the scene's own `onChange` is registered before `ready`); what is promised is that nothing is called after unmount. */
const LISTENERS = ["onChange", "onEventZone", "onSelect", "onCameraChange", "onFirstDraw", "onPick"] as const;
const codeOf = (run: () => void): string | undefined => { try { run(); } catch (error) { return errorCode(error); } return undefined; };
const expectUnusable = (handle: ViewerHandle): void => {
  for (const read of READS) expect(handle[read], read).toBeUndefined();
  for (const [name, call] of Object.entries(CALLS)) expect(codeOf(() => call(handle)), name).toBe("not-mounted");
  for (const name of LISTENERS) expect(typeof handle[name](() => undefined), name).toBe("function");
};

let release: (() => void) | undefined;
beforeEach(() => {
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  prepared.fail = false; prepared.real = false;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  prepared.gate = gate;
});
afterEach(() => { document.body.innerHTML = ""; prepared.fail = false; prepared.real = false; prepared.gate = undefined; vi.unstubAllGlobals(); vi.useRealTimers(); });
const openNow = () => { prepared.gate = undefined; };

describe.each([mountDriver, reactDriver(false)])("lifecycle: $name", (driver) => {
  it("build fault: an empty scene reports empty-scene (mount throws, React calls onError) and the handle stays unusable", async () => {
    prepared.real = true; openNow();
    const opened = await driver.open(new Scene());
    await tick();
    expect(opened.errors.map(errorCode)).toEqual(["empty-scene"]);
    expect(opened.readyCount()).toBe(0);
    if (opened.handle !== undefined) expectUnusable(opened.handle);
    opened.unmount();
  });

  it("load fault: the host hears the error, never ready, and the handle stays unusable", async () => {
    prepared.fail = true; openNow();
    const opened = await driver.open(new Scene());
    await tick();
    expect(opened.errors.map((e) => e.message)).toEqual(["load failed"]);
    expect(opened.readyCount()).toBe(0);
    expectUnusable(opened.handle!);
    opened.unmount();
  });

  it("unmount before the load finishes: no ready; mount's ready rejects not-mounted, React fires neither onReady nor onError", async () => {
    const opened = await driver.open(new Scene()); // the gate holds the load
    opened.unmount();
    release!();
    expect(await opened.outcome()).toBe(driver.silentOnEarlyUnmount ? "silent" : "not-mounted");
    expect(opened.readyCount()).toBe(0);
    expect(driver.silentOnEarlyUnmount ? opened.errors : []).toEqual([]);
    expectUnusable(opened.handle!);
  });

  it("unmount after the load but before the viewer attaches: ready never resolves; mount's rejects not-mounted, React fires neither callback", async () => {
    const opened = await driver.open(new Scene());
    release!();
    await Promise.resolve(); await Promise.resolve(); // loaded and rendering; the viewer's effect has not run
    opened.unmount();
    expect(await opened.outcome()).toBe(driver.silentOnEarlyUnmount ? "silent" : "not-mounted");
    expect(opened.readyCount()).toBe(0);
    expectUnusable(opened.handle!);
  });

  it("every handle member before ready throws not-mounted / reads undefined, and works once ready", async () => {
    const opened = await driver.open(new Scene());
    expectUnusable(opened.handle!);
    release!();
    await opened.ready();
    expect(opened.handle!.timeUtcMs).toBeDefined();
    opened.handle!.setTime(MID);
    expect(opened.handle!.timeUtcMs).toBe(MID);
    opened.unmount();
  });

  it("every handle member after unmount throws not-mounted / reads undefined", async () => {
    openNow();
    const opened = await driver.open(new Scene());
    await opened.ready();
    opened.unmount();
    expectUnusable(opened.handle!);
  });

  it("no onChange or onEventZone callback arrives after unmount, from the handle or from the scene's own onChange", async () => {
    openNow();
    const opened = await driver.open(new Scene());
    await opened.ready();
    const heard: string[] = [];
    opened.handle!.onChange(() => heard.push("change"));
    opened.handle!.onEventZone(() => heard.push("zone"));
    opened.handle!.setTime(MID);
    expect(heard).toContain("change");
    opened.unmount();
    const before = { heard: heard.length, own: opened.changes.length };
    vi.advanceTimersByTime(2000); await tick();
    expect({ heard: heard.length, own: opened.changes.length }).toEqual(before);
  });

  it("a rebuild works: the host is told ready again and the handle reads and sets (mount: unmount and mount again; React: a new scene prop)", async () => {
    openNow();
    const opened = await driver.open(new Scene());
    await opened.ready();
    await opened.rebuild();
    expect(opened.readyCount()).toBe(2);
    opened.handle!.setTime(MID);
    expect(opened.handle!.timeUtcMs).toBe(MID);
    opened.unmount();
    expectUnusable(opened.handle!);
  });

  it("a throwing onChange listener does not stop the next one, the scene's own onChange or the page; reportError receives the error", async () => {
    openNow();
    const report = vi.fn();
    vi.stubGlobal("reportError", report);
    const opened = await driver.open(new Scene());
    await opened.ready();
    const boom = new Error("listener boom");
    const heard: string[] = [];
    opened.handle!.onChange(() => { throw boom; });
    opened.handle!.onChange(() => heard.push("second"));
    opened.handle!.setTime(MID);
    expect(heard).toEqual(["second"]);
    expect(opened.changes.length).toBeGreaterThan(0);
    expect(report).toHaveBeenCalledWith(boom);
    opened.unmount();
  });
  it("a listener added by the handle after a throwing one still hears later changes, and stopping the throwing one silences its reports", async () => {
    openNow();
    const report = vi.fn();
    vi.stubGlobal("reportError", report);
    const opened = await driver.open(new Scene());
    await opened.ready();
    const stop = opened.handle!.onChange(() => { throw new Error("again"); });
    const heard: number[] = [];
    opened.handle!.onChange((c) => heard.push(c.timeUtcMs));
    opened.handle!.setTime(MID);
    stop();
    const reports = report.mock.calls.length;
    opened.handle!.setTime(MID + 1000);
    expect(heard).toEqual([MID, MID + 1000]);
    expect(report.mock.calls.length).toBe(reports);
    opened.unmount();
  });
  it("a mounted scene is frozen: an edit after ready throws scene-mounted, reads still answer, and a failed build leaves the scene editable", async () => {
    prepared.real = true; openNow();
    const failed = await driver.open(new Scene());
    await tick();
    expect(failed.errors.map(errorCode)).toEqual(["empty-scene"]);
    failed.unmount();
    const scene = new Scene().addBody("earth");
    const opened = await driver.open(scene);
    await opened.ready();
    expect(codeOf(() => scene.addBody("moon"))).toBe("scene-mounted");
    expect(codeOf(() => scene.camera.setReach(10))).toBe("scene-mounted");
    expect(missingDataOf(scene)).toEqual(expect.any(Array));
    opened.unmount();
    expect(codeOf(() => scene.setTime("2026-01-01T00:00:00Z"))).toBe("scene-mounted");
  });
  it("setPlaying: pauses and plays, onChange hears cause host, a non-boolean throws bad-timeline, and unmount makes it not-mounted", async () => {
    openNow();
    const opened = await driver.open(new Scene());
    await opened.ready();
    const handle = opened.handle!;
    expect(typeof handle.playing).toBe("boolean");
    const heard: Array<{ playing: boolean; cause: string }> = [];
    handle.onChange((c) => heard.push({ playing: c.playing, cause: c.cause }));
    handle.setPlaying(false);
    expect(handle.playing).toBe(false);
    handle.setPlaying(true);
    expect(handle.playing).toBe(true);
    expect(heard).toEqual([{ playing: false, cause: "host" }, { playing: true, cause: "host" }]);
    expect(codeOf(() => handle.setPlaying("yes" as unknown as boolean))).toBe("bad-timeline");
    opened.unmount();
    expectUnusable(handle);
  });
  it("setLook, setScale and setSwitch: set then read, onChange hears cause host, a bad argument throws its code, and unmount makes them not-mounted", async () => {
    openNow();
    const opened = await driver.open(new Scene());
    await opened.ready();
    const handle = opened.handle!;
    expect(handle.look?.starBrightness).toBe(1);
    const heard: Array<{ scale: string; stars: number; cause: string }> = [];
    handle.onChange((c) => heard.push({ scale: c.scale, stars: c.look.starBrightness, cause: c.cause }));
    handle.setLook({ starBrightness: 1.5, sunGlow: { sizePx: 90 } });
    expect(handle.look?.starBrightness).toBe(1.5);
    handle.setLook({ markerSwapRadiusPx: 5 }); // the whole look is replaced: the star brightness is back to its default
    expect(handle.look).toMatchObject({ starBrightness: 1, markerSwapRadiusPx: 5 });
    handle.setScale("readable-scale");
    expect(handle.scale).toBe("readable-scale");
    expect(heard.map((c) => c.cause)).toEqual(["host", "host", "host"]);
    expect(heard.map((c) => c.stars)).toEqual([1.5, 1, 1]);
    expect(heard.at(-1)?.scale).toBe("readable-scale");
    expect(codeOf(() => handle.setLook({ starBrightness: 9 }))).toBe("bad-look");
    expect(codeOf(() => handle.setScale("nope"))).toBe("bad-scale");
    expect(codeOf(() => handle.setSwitch("labels", false))).toBe("bad-switch"); // this scene placed no switches
    expect(handle.switches).toEqual({});
    opened.unmount();
    expectUnusable(handle);
  });

  it("onSelect: reads the opening selection without reporting it, hears a visitor's pick once, and hears nothing after unmount", async () => {
    openNow();
    const opened = await driver.open(new Scene());
    await opened.ready();
    const handle = opened.handle!;
    const heard: Array<{ object?: string; cause: string }> = [];
    handle.onSelect((c) => heard.push({ ...(c.object === undefined ? {} : { object: c.object }), cause: c.cause }));
    expect(handle.selected).toBe("earth");
    expect(heard).toEqual([]);
    const picker = document.querySelector<HTMLSelectElement>("[aria-label='Select object']")!;
    const pickMoon = (): void => {
      flushSync(() => {
        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(picker), "value")!.set!.call(picker, "moon");
        picker.dispatchEvent(new window.Event("change", { bubbles: true }));
      });
    };
    pickMoon();
    expect(handle.selected).toBe("moon");
    expect(heard).toEqual([{ object: "moon", cause: "visitor" }]);
    opened.unmount();
    expect(handle.selected).toBeUndefined();
    expect(heard.length).toBe(1);
  });
  it("onPick and setPick (O-059 T-269): the picker opens on its value, a visitor's press is heard once and moves nothing, setPick moves the pressed option alone, a throwing listener spares the next, and nothing is heard after unmount", async () => {
    prepared.real = true; openNow();
    const scene = new Scene().addBody(earth).setPicker({ id: "world", label: "World", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }], value: "a" });
    const opened = await driver.open(scene);
    await opened.ready();
    const handle = opened.handle!;
    const reported: unknown[] = [];
    vi.stubGlobal("reportError", (error: unknown) => reported.push(error));
    const pressed = (value: string): string | null => document.querySelector(`[data-switch-value='${value}']`)!.getAttribute("aria-pressed");
    expect(handle.pick).toBe("a");
    expect(pressed("a")).toBe("true");
    const heard: unknown[] = [];
    const changes: unknown[] = [];
    handle.onPick(() => { throw new Error("host bug"); });
    handle.onPick((c) => heard.push(c));
    handle.onChange((c) => changes.push(c));
    flushSync(() => document.querySelector<HTMLButtonElement>("[data-switch-value='a']")!.click()); // the pressed one: nothing
    expect(heard).toEqual([]);
    flushSync(() => document.querySelector<HTMLButtonElement>("[data-switch-value='b']")!.click());
    expect(heard).toEqual([{ picker: "world", value: "b" }]);
    expect(reported).toHaveLength(1);
    expect(handle.pick, "the host decides: a press moves nothing").toBe("a");
    expect(pressed("b")).toBe("false");
    flushSync(() => handle.setPick("b"));
    expect(handle.pick).toBe("b");
    expect(pressed("b")).toBe("true");
    expect(pressed("a")).toBe("false");
    expect(heard, "setPick tells no one").toHaveLength(1);
    expect(changes, "the clock is untouched").toEqual([]);
    expect(codeOf(() => handle.setPick("nope"))).toBe("bad-picker");
    expect(handle.pick).toBe("b");
    opened.unmount();
    expect(handle.pick).toBeUndefined();
    expect(codeOf(() => handle.setPick("a"))).toBe("not-mounted");
    expect(heard).toHaveLength(1);
  });

  it("setPick on a scene without a picker throws bad-picker, and pick reads undefined", async () => {
    openNow();
    const opened = await driver.open(new Scene());
    await opened.ready();
    expect(opened.handle!.pick).toBeUndefined();
    expect(codeOf(() => opened.handle!.setPick("a"))).toBe("bad-picker");
    opened.unmount();
  });

  it("a host keeps the clock across a choice with public calls: it reads time in onPick and sets it on the next scene, whichever path opened it", async () => {
    prepared.real = true; openNow();
    const picker = { id: "world", label: "World", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }], value: "a" } as const;
    const start = Date.UTC(2026, 5, 1);
    const sceneFor = (value: "a" | "b"): Scene => new Scene().addBody(earth).setTimeline({ start, end: start + 10 * 86_400_000 }).setPicker({ ...picker, value });
    const opened = await driver.open(sceneFor("a"));
    await opened.ready();
    opened.handle!.setTime(start + 3 * 86_400_000);
    let kept: number | undefined;
    opened.handle!.onPick(() => { kept = opened.handle!.timeUtcMs; });
    flushSync(() => document.querySelector<HTMLButtonElement>("[data-switch-value='b']")!.click());
    expect(kept).toBe(start + 3 * 86_400_000);
    // The host builds the next scene however its path does (mount: a new mount; React: a new scene prop) and puts the time back.
    await opened.rebuild(sceneFor("b"));
    expect(opened.handle!.pick).toBe("b");
    opened.handle!.setTime(kept!);
    expect(opened.handle!.timeUtcMs).toBe(start + 3 * 86_400_000);
    opened.unmount();
  });

  it("onCameraChange: reads the opening pose without reporting it, reports each change once (at most every 100 ms), nothing when unchanged or after unmount, and a throwing listener spares the others", async () => {
    openNow();
    const opened = await driver.open(new Scene());
    await opened.ready();
    const handle = opened.handle!;
    const heard: CameraPose[] = [];
    const other: CameraPose[] = [];
    handle.onCameraChange(() => { throw new Error("listener fault"); });
    handle.onCameraChange((pose) => heard.push(pose));
    const stop = handle.onCameraChange((pose) => other.push(pose));
    const report = vi.fn();
    vi.stubGlobal("reportError", report);
    const opening = handle.camera!;
    const standAt = (azimuthDeg: number): void => { sceneProps.latest!.controls.viewReadout = { ...opening, azimuthDeg }; };
    vi.advanceTimersByTime(100);
    expect(heard).toEqual([]); // the opening pose is read, not reported
    standAt(10);
    vi.advanceTimersByTime(100);
    expect(heard).toEqual([{ ...opening, azimuthDeg: 10 }]);
    expect(other).toEqual(heard);
    vi.advanceTimersByTime(300); // settled: nothing more
    expect(heard.length).toBe(1);
    standAt(20); vi.advanceTimersByTime(100); standAt(30); vi.advanceTimersByTime(100); // a pose moving every tick: one report per tick
    expect(heard.map((pose) => pose.azimuthDeg)).toEqual([10, 20, 30]);
    stop();
    standAt(40); vi.advanceTimersByTime(100);
    expect(heard.length).toBe(4);
    expect(other.length).toBe(3);
    expect(report).toHaveBeenCalledTimes(4); // the throwing listener is reported to the page after every report, not swallowed
    opened.unmount();
    standAt(50); vi.advanceTimersByTime(300);
    expect(heard.length).toBe(4);
    expectUnusable(handle);
  });
});

describe("AstraeusScene's onPick prop (O-059 T-269, API-02)", () => {
  it("is called with the picker id and value for a visitor's press, not for the pressed option, moves nothing, and a new scene's value is pressed after a rebuild", async () => {
    prepared.real = true; openNow();
    const heard: unknown[] = [];
    const ref: { current: ViewerHandle | null } = { current: null };
    const sceneFor = (value: string): Scene => new Scene().addBody(earth).setPicker({ id: "world", label: "World", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }], value });
    const root = createRoot(document.body.appendChild(document.createElement("div")));
    const ready = (scene: Scene): Promise<void> => new Promise<void>((ok, fail) => {
      flushSync(() => root.render(h(AstraeusScene, { scene, ref, onPick: (change) => heard.push(change), onReady: () => ok(), onError: fail })));
    });
    await ready(sceneFor("a"));
    flushSync(() => document.querySelector<HTMLButtonElement>("[data-switch-value='a']")!.click());
    expect(heard).toEqual([]);
    flushSync(() => document.querySelector<HTMLButtonElement>("[data-switch-value='b']")!.click());
    expect(heard).toEqual([{ picker: "world", value: "b" }]);
    expect(ref.current!.pick).toBe("a");
    await ready(sceneFor("b"));
    expect(ref.current!.pick).toBe("b");
    root.unmount();
  });
});

describe("lifecycle: AstraeusScene under StrictMode", () => {
  it("onReady fires once, the handle works after the replayed effects, and unmount makes it unusable", async () => {
    openNow();
    const opened = await reactDriver(true).open(new Scene());
    await opened.ready();
    await tick();
    expect(opened.readyCount()).toBe(1);
    expect(opened.errors).toEqual([]);
    opened.handle!.setTime(MID);
    expect(opened.handle!.timeUtcMs).toBe(MID);
    opened.unmount();
    expectUnusable(opened.handle!);
  });
});

/** Every method that edits a scene or its camera, found by name so a future mutator cannot escape the freeze. */
const mutators = (proto: object): string[] => Object.getOwnPropertyNames(proto).filter((name) => /^(add|set|follow|focus|fitOrbit)/.test(name) && typeof Object.getOwnPropertyDescriptor(proto, name)?.value === "function");

describe("a mounted scene is frozen", () => {
  it("every add, set, follow, focus and fitOrbit method of Scene and SceneCamera throws scene-mounted after mount; reads still answer", () => {
    prepared.real = true; openNow();
    const scene = new Scene().addBody("earth").addBody("moon");
    const sceneMethods = mutators(Scene.prototype);
    const cameraMethods = mutators(SceneCamera.prototype);
    expect(sceneMethods.length).toBeGreaterThanOrEqual(12);
    expect(cameraMethods.sort()).toEqual(["fitOrbit", "focus", "follow", "setFollowChoices", "setReach", "setStartView"]);
    const element = document.createElement("div");
    document.body.append(element);
    const viewer = mount(element, scene);
    for (const name of sceneMethods) expect(codeOf(() => (scene as unknown as Record<string, (...a: unknown[]) => unknown>)[name]()), `scene.${name}`).toBe("scene-mounted");
    for (const name of cameraMethods) expect(codeOf(() => (scene.camera as unknown as Record<string, (...a: unknown[]) => unknown>)[name]("earth")), `camera.${name}`).toBe("scene-mounted");
    expect(scene.stateOf("earth", MID_2026).positionKm).toHaveLength(3);
    expect(scene.provenanceOf("earth")).toBeDefined();
    expect(missingDataOf(scene)).toEqual(expect.any(Array));
    expect(scene.camera.target).toBeUndefined();
    expect(scene.camera.following).toBe(false);
    expect(scene.camera.reachEarthRadii).toBeUndefined();
    expect(scene.camera.fitted).toBeUndefined();
    expect(scene.camera.view).toEqual({});
    viewer.unmount();
  });

  it("toDefinition on its own does not freeze", () => {
    const scene = new Scene().addBody("earth");
    definitionOf(scene);
    expect(() => scene.addBody("moon")).not.toThrow();
  });

  it("the same frozen scene mounts into a second element and both draw", async () => {
    prepared.real = true; openNow();
    const scene = new Scene().addBody("earth");
    const a = document.createElement("div");
    const b = document.createElement("div");
    document.body.append(a, b);
    const first = mount(a, scene);
    await first.ready;
    const second = mount(b, scene);
    await second.ready;
    await tick();
    expect(a.querySelector("[data-testid=scene]")).not.toBeNull();
    expect(b.querySelector("[data-testid=scene]")).not.toBeNull();
    first.unmount();
    second.unmount();
  });
});

describe("the handle member table", () => {
  it("lists every member of ViewerHandle, so a new member must join the lifecycle cases", () => {
    const members = new Set<string>();
    for (const key in viewerHandleOf(new ViewerLink())) members.add(key);
    expect([...members].sort()).toEqual([...READS, ...Object.keys(CALLS), ...LISTENERS].sort());
  });
});

describe("mount's ready and unhandled rejections (O-054 T-249, owner 2026-11-01: only the expected taken-down-early case is hidden)", () => {
  let seen: unknown[];
  let saved: Array<(...args: unknown[]) => void>;
  const listener = (reason: unknown) => { seen.push(reason); };
  beforeEach(() => {
    seen = [];
    saved = process.listeners("unhandledRejection") as Array<(...args: unknown[]) => void>; // vitest's own handler would fail the run on the expected one
    process.removeAllListeners("unhandledRejection");
    process.on("unhandledRejection", listener);
  });
  afterEach(() => {
    process.off("unhandledRejection", listener);
    for (const fn of saved) process.on("unhandledRejection", fn);
    prepared.fail = false; prepared.gate = undefined;
  });
  const host = () => document.body.appendChild(document.createElement("div"));
  const settle = () => tick(60);

  it("an unawaited early unmount raises no unhandled rejection", async () => {
    let release!: () => void;
    prepared.gate = new Promise<void>((resolve) => { release = resolve; });
    const handle = mount(host(), new Scene());
    handle.unmount();
    release();
    await settle();
    expect(seen).toEqual([]);
  });

  it("an unawaited load failure is an unhandled rejection", async () => {
    prepared.fail = true;
    mount(host(), new Scene());
    await settle();
    expect(seen.map((reason) => (reason as Error).message)).toEqual(["load failed"]);
  });

  it("awaited, both still reject, and an awaited failure is not also reported as unhandled", async () => {
    prepared.fail = true;
    const failed = mount(host(), new Scene());
    await expect(failed.ready).rejects.toThrow("load failed");
    prepared.fail = false;
    let release!: () => void;
    prepared.gate = new Promise<void>((resolve) => { release = resolve; });
    const early = mount(host(), new Scene());
    early.unmount();
    release();
    await expect(early.ready).rejects.toMatchObject({ code: "not-mounted" });
    await settle();
    expect(seen).toEqual([]);
  });
});
