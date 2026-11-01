// @vitest-environment happy-dom
// `ready` means usable (O-052 T-222). A host page is not inside React's `act`, so these tests await `ready` bare and never flush effects:
// the viewerHostDom tests wrap `await handle.ready` in `act(async ...)`, which runs the viewer's effects first and hid that 0.7.0 resolved `ready` before the host link attached.
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
const prepared = vi.hoisted(() => ({ views: undefined as undefined | import("../src/app/views").ViewSettings, fail: false }));
vi.mock("../src/api/prepared", async () => {
  const { syntheticDefinition } = await import("../src/synthetic/syntheticDefinition");
  return {
    prepareScene: () => ({
      definition: prepared.views === undefined ? syntheticDefinition : { ...syntheticDefinition, views: prepared.views },
      ready: prepared.fail ? Promise.reject(new Error("load failed")) : Promise.resolve(),
    }),
  };
});

import { createElement as h, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AstraeusScene } from "../src/api/AstraeusScene";
import { SceneError } from "../src/api/errors";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import type { ViewerHandle } from "../src/api/viewerHandle";
import { ViewerLink, type ViewerChange } from "../src/api/viewerLink";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";

// A real host is outside act: React schedules and flushes by itself.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

const { startUtcMs, endUtcMs } = syntheticDefinition.experience.window;
const MID = startUtcMs + Math.floor((endUtcMs - startUtcMs) / 2);
const RATES = syntheticDefinition.experience.rates;
let host: HTMLElement;
beforeEach(() => {
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] }); // the clock is held still so times are exact
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(() => { prepared.views = undefined; prepared.fail = false; host.remove(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const codeOf = (run: () => void): string | undefined => { try { run(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return undefined; };
const view = (id: string) => ({ id, label: id.toUpperCase(), camera: { rule: "stay" } as const, objects: new Set<string>(), events: new Set<string>(), panels: new Set<string>() });

describe("mount: ready means usable", () => {
  it("README time/rate example: after a bare `await ready`, time and rate are defined and setTime / setRate work", async () => {
    const handle = mount(host, new Scene());
    await handle.ready;
    expect(handle.time).toBeDefined();
    expect(handle.rate).toBeDefined();
    handle.setTime(new Date(MID));
    expect(handle.time).toBe(MID);
    handle.setRate(RATES[0]);
    expect(handle.rate).toBe(RATES[0]);
    handle.unmount();
  });

  it("README views example: after a bare `await ready`, view is defined and setView works", async () => {
    prepared.views = { place: "top-bar", start: "a", views: [view("a"), view("b")] };
    const handle = mount(host, new Scene());
    await handle.ready;
    expect(handle.view).toBe("a");
    handle.setView("b");
    expect(handle.view).toBe("b");
    handle.unmount();
  });

  it("a load failure still rejects ready, and the handle stays unusable", async () => {
    prepared.fail = true;
    const handle = mount(host, new Scene());
    await expect(handle.ready).rejects.toThrow("load failed");
    expect(codeOf(() => handle.setTime(MID))).toBe("not-mounted");
    handle.unmount();
  });

  it("(a) unmount before the data load finishes: ready rejects not-mounted, reads are undefined and calls throw not-mounted", async () => {
    const handle = mount(host, new Scene());
    handle.unmount();
    await expect(handle.ready).rejects.toMatchObject({ code: "not-mounted" });
    expect(handle.time).toBeUndefined();
    expect(codeOf(() => handle.setTime(MID))).toBe("not-mounted");
    expect(codeOf(() => handle.setView("a"))).toBe("not-mounted");
  });

  it("(b) unmount after the load but before the viewer attaches: ready rejects not-mounted instead of staying pending", async () => {
    const handle = mount(host, new Scene());
    await Promise.resolve(); await Promise.resolve(); // the load has settled and the viewer is rendering; its effect has not run
    handle.unmount();
    const outcome = await Promise.race([handle.ready.then(() => "resolved", (error: unknown) => (error instanceof SceneError ? error.code : String(error))), new Promise<string>((r) => setTimeout(() => r("pending"), 200))]);
    expect(outcome).toBe("not-mounted");
    expect(codeOf(() => handle.setTime(MID))).toBe("not-mounted");
  });
});

describe("ViewerLink.whenAttached", () => {
  const control = { events: [], window: { startUtcMs, endUtcMs }, rates: RATES, paced: false, playable: true, setPlaying: () => undefined, read: () => ({ timeUtcMs: MID, rate: RATES[0], playing: false }), seek: () => undefined, setRate: () => undefined, views: [], setView: () => undefined, cameraTargets: () => [], readCamera: () => undefined, setCamera: () => undefined };
  const settled = async (promise: Promise<void>): Promise<boolean> => Promise.race([promise.then(() => true), new Promise<boolean>((r) => setTimeout(() => r(false), 20))]);

  it("waits for attach, is resolved after it, and waits again after a detach (a rebuild)", async () => {
    const link = new ViewerLink();
    const first = link.whenAttached();
    expect(await settled(first)).toBe(false);
    link.attach(control);
    expect(await settled(first)).toBe(true);
    expect(await settled(link.whenAttached())).toBe(true);
    link.detach();
    expect(await settled(link.whenAttached())).toBe(false);
  });

  it("rejects not-mounted on close when it had not attached", async () => {
    const link = new ViewerLink();
    const wait = link.whenAttached();
    link.close();
    await expect(wait).rejects.toMatchObject({ code: "not-mounted" });
  });
});

describe("AstraeusScene: onReady fires after the link attaches", () => {
  it("the time prop has already taken effect, and the viewer is in the page, when onReady runs", async () => {
    const seen: ViewerChange[] = [];
    let atReady: { drawn: boolean; changes: number } | undefined;
    const root = createRoot(host);
    const done = new Promise<void>((resolve) => {
      root.render(h(AstraeusScene, {
        scene: new Scene(), time: MID, onChange: (c: ViewerChange) => seen.push(c),
        onReady: () => { atReady = { drawn: host.querySelector(".canvas-host") !== null, changes: seen.filter((c) => c.cause === "host").length }; resolve(); },
      }));
    });
    await done;
    expect(atReady).toEqual({ drawn: true, changes: 1 });
    root.unmount();
  });

  it("StrictMode (outside act): onReady fires once per build, only after the link attached, and a listener added through the handle still hears changes after the replayed effects", async () => {
    const calls: Array<{ handle: ViewerHandle; time: number | undefined }> = [];
    const ref: { current: ViewerHandle | null } = { current: null };
    const root = createRoot(host);
    const done = new Promise<void>((resolve) => {
      root.render(h(StrictMode, null, h(AstraeusScene, {
        scene: new Scene(), ref,
        onReady: (handle: ViewerHandle) => { calls.push({ handle, time: handle.time }); resolve(); },
      })));
    });
    await done;
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(calls).toHaveLength(1);
    expect(calls[0].time).toBeDefined();
    expect(calls[0].handle).toBe(ref.current);
    const seen: ViewerChange[] = [];
    calls[0].handle.onChange((c) => seen.push(c));
    calls[0].handle.setTime(MID);
    expect(seen.at(-1)).toMatchObject({ time: MID, cause: "host" });
    root.unmount();
    expect(calls[0].handle.time).toBeUndefined();
  });
});
