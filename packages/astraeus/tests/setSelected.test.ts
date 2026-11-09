// @vitest-environment happy-dom
// O-061 T-287: `setSelected(id | undefined)`, each input alone, on both embedding paths (`mount`, `AstraeusScene`), through the real shell on a made-up scene (ARCH-03).
// The 3D canvas is a stand-in. Each row is one host call and what it must do: select, clear, re-select, a hidden/unknown/empty/non-string id, before ready, after unmount, straight after ready, inside an `onChange` view switch.
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
vi.mock("../src/assets/sky", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { earth } from "../src/api/bodies";
import { AstraeusScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import type { ViewerHandle } from "../src/api/viewerHandle";
import type { SelectionChange } from "../src/api/viewerSelection";
import { drawn, pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const samples = (x: number) => [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [x + i * 1_000, 0, 0], velocityKmS: [1, 0, 0] }));
/** View a shows probe A, view b probe B (its rule frames and selects B), view c probe B with the camera staying. Earth is in every view. */
const makeScene = () => new Scene().addBody(earth)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: samples(10_000) })
  .addTrajectory({ id: "pb", label: "Probe B", center: "earth", samples: samples(20_000) })
  .setViews([
    { id: "a", label: "View A", objects: ["pa"] },
    { id: "b", label: "View B", objects: ["pb"], camera: { focus: "pb" } },
    { id: "c", label: "View C", objects: ["pb"] },
  ], { place: "top-bar" });

let host: HTMLElement;
let root: Root | undefined;
beforeEach(() => {
  pretendScreen({});
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(() => { if (root) act(() => root!.unmount()); root = undefined; host.remove(); vi.unstubAllGlobals(); vi.useRealTimers(); });

interface Started { readonly handle: ViewerHandle; readonly ready: Promise<void>; readonly stop: () => void }
const PATHS: readonly (readonly [string, () => Started])[] = [
  ["mount", () => { const m = mount(host, makeScene()); return { handle: m, ready: m.ready, stop: () => m.unmount() }; }],
  ["AstraeusScene", () => {
    let got: ViewerHandle | undefined;
    let told!: () => void;
    const ready = new Promise<void>((resolve) => { told = resolve; });
    root = createRoot(host);
    act(() => root!.render(createElement(AstraeusScene, { scene: makeScene(), onReady: (h: ViewerHandle) => { got = h; told(); } })));
    const handle = new Proxy({} as ViewerHandle, { get: (_t, key) => Reflect.get(got!, key) });
    return { handle, ready, stop: () => { act(() => root!.unmount()); root = undefined; } };
  }],
];
const heardOf = (handle: ViewerHandle) => { const heard: SelectionChange[] = []; handle.onSelect((c) => heard.push(c)); return heard; };
const seen = (heard: SelectionChange[]) => heard.map((c) => [c.object, c.cause]);
const settle = () => act(async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); });
const refused = (call: () => void, code: string) => { try { call(); } catch (error) { expect((error as { code?: string }).code).toBe(code); return; } throw new Error("expected a SceneError"); };

describe.each(PATHS)("%s: setSelected", (_name, start) => {
  it("selects a shown object and reports it once with cause host", async () => {
    const { handle, ready, stop } = start(); await drawn({ ready });
    const heard = heardOf(handle);
    act(() => handle.setSelected("pa"));
    expect(handle.selected).toBe("pa");
    await settle();
    expect(handle.selected).toBe("pa");
    expect(seen(heard)).toEqual([["pa", "host"]]);
    stop();
  });

  it("opens the selected object's card as a visitor's menu choice does, and a clear closes it", async () => {
    const { handle, ready, stop } = start(); await drawn({ ready });
    expect(host.querySelector(".info-panel")).toBeNull();
    act(() => handle.setSelected("pa"));
    await settle();
    expect(host.querySelector(".info-panel")?.textContent).toContain("Probe A");
    act(() => handle.setSelected(undefined));
    await settle();
    expect(host.querySelector(".info-panel")).toBeNull();
    stop();
  });

  it("clears the selection (selected undefined, onSelect without an object, cause host) and it stays cleared", async () => {
    const { handle, ready, stop } = start(); await drawn({ ready });
    act(() => handle.setSelected("pa"));
    const heard = heardOf(handle);
    act(() => handle.setSelected(undefined));
    await settle();
    expect(handle.selected).toBeUndefined();
    expect(seen(heard)).toEqual([[undefined, "host"]]);
    act(() => { vi.advanceTimersByTime(500); });
    expect(handle.selected).toBeUndefined();
    expect(seen(heard)).toHaveLength(1);
    act(() => handle.setSelected("earth"));
    expect(handle.selected).toBe("earth");
    stop();
  });

  it("selecting the object already selected reports nothing", async () => {
    const { handle, ready, stop } = start(); await drawn({ ready });
    act(() => handle.setSelected("pa"));
    const heard = heardOf(handle);
    act(() => handle.setSelected("pa"));
    await settle();
    expect(heard).toEqual([]);
    expect(handle.selected).toBe("pa");
    stop();
  });

  it.each([["unknown id", "nope"], ["empty id", ""], ["number", 42], ["null", null], ["object", {}]])("%s throws bad-selection and changes nothing", async (_label, bad) => {
    const { handle, ready, stop } = start(); await drawn({ ready });
    act(() => handle.setSelected("pa"));
    const heard = heardOf(handle);
    refused(() => handle.setSelected(bad as never), "bad-selection");
    await settle();
    expect(handle.selected).toBe("pa");
    expect(heard).toEqual([]);
    stop();
  });

  it("an object the showing view hides throws bad-selection; it is allowed again in the view that shows it", async () => {
    const { handle, ready, stop } = start(); await drawn({ ready });
    act(() => handle.setView("c"));
    refused(() => handle.setSelected("pa"), "bad-selection");
    act(() => handle.setView("a"));
    act(() => handle.setSelected("pa"));
    expect(handle.selected).toBe("pa");
    stop();
  });

  it("after unmount throws not-mounted", async () => {
    const { handle, ready, stop } = start(); await drawn({ ready });
    stop();
    refused(() => handle.setSelected("pa"), "not-mounted");
    refused(() => handle.setSelected(undefined), "not-mounted");
  });

  it("straight after ready, before the first frame, the selection holds", async () => {
    const { handle, ready, stop } = start();
    await settle(); await ready;
    const heard = heardOf(handle);
    act(() => handle.setSelected("pa"));
    expect(handle.selected).toBe("pa");
    await settle();
    act(() => { vi.advanceTimersByTime(500); });
    expect(handle.selected).toBe("pa");
    expect(seen(heard)).toEqual([["pa", "host"]]);
    stop();
  });

  it("inside the onChange report of a view switch the selection holds over the view's own framing", async () => {
    const { handle, ready, stop } = start(); await drawn({ ready });
    act(() => handle.setSelected("pa"));
    const heard = heardOf(handle);
    handle.onChange((change) => { if (change.view === "b" && change.cause === "host") handle.setSelected("earth"); });
    act(() => handle.setView("b")); // the view's rule would frame and select pb
    await settle();
    act(() => { vi.advanceTimersByTime(500); });
    expect(handle.view).toBe("b");
    expect(handle.selected).toBe("earth");
    expect(seen(heard).at(-1)).toEqual(["earth", "host"]);
    stop();
  });

  it("inside the onChange report of a view switch, a clear holds too", async () => {
    const { handle, ready, stop } = start(); await drawn({ ready });
    handle.onChange((change) => { if (change.view === "c" && change.cause === "host") handle.setSelected(undefined); });
    act(() => handle.setView("c")); // the shell would otherwise pick a fallback for the dropped probe
    await settle();
    act(() => { vi.advanceTimersByTime(500); });
    expect(handle.selected).toBeUndefined();
    stop();
  });
});

describe("mount: before ready", () => {
  it("setSelected before ready throws not-mounted", () => {
    const m = mount(host, makeScene());
    refused(() => m.setSelected("pa"), "not-mounted");
    m.unmount();
  });
});
