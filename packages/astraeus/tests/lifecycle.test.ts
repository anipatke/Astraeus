// @vitest-environment happy-dom
// One lifecycle contract, run against both embedding paths (`mount` and `<AstraeusScene>`) from one case list (O-054 T-243, API-02), so the two cannot drift apart again.
// A host page is outside React's `act`: nothing here flushes effects for the viewer.
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
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
import { createRoot } from "react-dom/client";
import { AstraeusScene } from "../src/api/AstraeusScene";
import { SceneError } from "../src/api/errors";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import { viewerHandleOf, type ViewerHandle } from "../src/api/viewerHandle";
import { ViewerLink, type ViewerChange } from "../src/api/viewerLink";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

const { startUtcMs, endUtcMs } = syntheticDefinition.experience.window;
const MID = startUtcMs + Math.floor((endUtcMs - startUtcMs) / 2);
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
  rebuild(): Promise<void>;
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
    const build = (): Promise<void> => {
      try { current = mount(element, scene, { onChange: (c) => changes.push(c) }); } catch (error) { errors.push(error as Error); current = undefined; return Promise.reject(error); }
      opened.handle = current;
      return current.ready.then(() => { ready += 1; }, (error: Error) => { errors.push(error); throw error; });
    };
    const opened: Opened = {
      handle: undefined, errors, changes, readyCount: () => ready,
      ready: () => settledReady,
      unmount: () => current?.unmount(),
      rebuild: () => { current?.unmount(); settledReady = build(); return settledReady; },
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
      root.render(strict ? h(StrictMode, null, el) : el);
    };
    const wait = (): Promise<void> => new Promise<void>((ok, fail) => { waiters.push({ ok, fail }); });
    const opened: Opened = {
      handle: undefined, errors, changes, readyCount: () => ready,
      ready: () => (ready > 0 && errors.length === 0 ? Promise.resolve() : wait()),
      unmount: () => root.unmount(),
      rebuild: () => { const next = wait(); render(new Scene()); return next; },
      outcome: () => Promise.race([wait().then(() => "ready", (error: unknown) => errorCode(error)), tick(60).then(() => "silent")]),
    };
    render(scene);
    await Promise.resolve();
    await tick(0); // the commit: the ref is set
    opened.handle = ref.current ?? undefined;
    return opened;
  },
});

/** The handle's members, read from one table: a new member of `ViewerHandle` must join it (the last test fails otherwise). */
const READS = ["time", "rate", "view", "camera", "eventZones"] as const;
const CALLS: Record<string, (handle: ViewerHandle) => void> = {
  setTime: (handle) => handle.setTime(MID),
  setRate: (handle) => handle.setRate(RATE),
  setView: (handle) => handle.setView("a"),
  setCamera: (handle) => handle.setCamera({ follow: "x" }),
};
/** Listener registration is allowed at any time (the scene's own `onChange` is registered before `ready`); what is promised is that nothing is called after unmount. */
const LISTENERS = ["onChange", "onEventZone"] as const;
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
    expect(opened.handle!.time).toBeDefined();
    opened.handle!.setTime(MID);
    expect(opened.handle!.time).toBe(MID);
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
    expect(opened.handle!.time).toBe(MID);
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
    opened.handle!.onChange((c) => heard.push(c.time));
    opened.handle!.setTime(MID);
    stop();
    const reports = report.mock.calls.length;
    opened.handle!.setTime(MID + 1000);
    expect(heard).toEqual([MID, MID + 1000]);
    expect(report.mock.calls.length).toBe(reports);
    opened.unmount();
  });
  it.todo("a mounted scene is frozen (T-245)");
  it.todo("setPlaying (T-246)");
  it.todo("onSelect (T-247)");
  it.todo("onCameraChange (T-248)");
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
    expect(opened.handle!.time).toBe(MID);
    opened.unmount();
    expectUnusable(opened.handle!);
  });
});

describe("the handle member table", () => {
  it("lists every member of ViewerHandle, so a new member must join the lifecycle cases", () => {
    const members = new Set<string>();
    for (const key in viewerHandleOf(new ViewerLink())) members.add(key);
    expect([...members].sort()).toEqual([...READS, ...Object.keys(CALLS), ...LISTENERS].sort());
  });
});
