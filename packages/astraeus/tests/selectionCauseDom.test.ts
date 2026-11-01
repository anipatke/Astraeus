// @vitest-environment happy-dom
// O-054 I-137: the cause onSelect names for a selection that time drops, on a real Scene and the real prepareScene (only the 3D canvas is a stand-in): a path whose samples
// span 30 minutes on a 100-day timeline loses its selection when the clock leaves it. The cause is whatever moved the clock, the one onChange names.
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
import { byLabel, change, drawn, pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const DAY = 86_400_000;
const makeScene = () => new Scene().addBody(earth)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [10_000 + i * 1_000, 0, 0], velocityKmS: [1, 0, 0] })) })
  .setTimeline({ start: T0, end: T0 + 100 * DAY, rate: 86_400, rates: [60, 86_400] });

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

const pick = (id: string) => change(byLabel(host, "Select object") as HTMLSelectElement, id);
const causes = (heard: SelectionChange[]) => heard.map((c) => [c.object, c.cause]);

/** The probe is selected with the clock paused five minutes in (or at `at`). */
async function selectedProbe(handle: ViewerHandle, heard: SelectionChange[], at = T0 + 5 * MIN): Promise<void> {
  handle.onSelect((c) => heard.push(c));
  act(() => { handle.setPlaying(false); handle.setTime(at); });
  pick("pa");
  expect(handle.selected).toBe("pa");
}

describe.each([
  ["mount", (): { handle: ViewerHandle; stop: () => void; ready: Promise<void> } => { const m = mount(host, makeScene()); return { handle: m, stop: () => m.unmount(), ready: m.ready }; }],
  ["AstraeusScene", (): { handle: ViewerHandle; stop: () => void; ready: Promise<void> } => {
    let got: ViewerHandle | undefined;
    root = createRoot(host);
    act(() => root!.render(createElement(AstraeusScene, { scene: makeScene(), onReady: (h: ViewerHandle) => { got = h; } })));
    const handle = new Proxy({} as ViewerHandle, { get: (_t, key) => Reflect.get(got!, key) });
    return { handle, stop: () => { act(() => root!.unmount()); root = undefined; }, ready: vi.waitFor(() => expect(got).toBeDefined()) };
  }],
] as const)("%s: a path shorter than the timeline", (_name, start) => {
  it("a host setTime past the path's end reports host", async () => {
    const { handle, stop, ready } = start(); await drawn({ ready });
    const heard: SelectionChange[] = [];
    await selectedProbe(handle, heard);
    act(() => handle.setTime(T0 + 50 * DAY));
    expect(causes(heard)).toEqual([["pa", "visitor"], ["earth", "host"]]);
    act(() => { vi.advanceTimersByTime(500); });
    expect(heard.length).toBe(2); // nothing more is reported while nothing changes
    stop();
  });

  it("the clock running past the path's end reports playback", async () => {
    const { handle, stop, ready } = start(); await drawn({ ready });
    const heard: SelectionChange[] = [];
    await selectedProbe(handle, heard, T0 + 29 * MIN);
    act(() => handle.setPlaying(true));
    for (let i = 0; i < 200 && heard.length < 2; i++) act(() => { vi.advanceTimersByTime(100); });
    expect(causes(heard)).toEqual([["pa", "visitor"], ["earth", "playback"]]);
    stop();
  });

  it("a visitor's timeline seek past the end reports visitor, even after a host move", async () => {
    const { handle, stop, ready } = start(); await drawn({ ready });
    const heard: SelectionChange[] = [];
    await selectedProbe(handle, heard);
    act(() => handle.setTime(T0 + 6 * MIN)); // the selection survives a host move
    expect(heard.length).toBe(1);
    const scrub = byLabel(host, "Seek timeline") as HTMLInputElement;
    act(() => change(scrub, scrub.max));
    expect(causes(heard)).toEqual([["pa", "visitor"], ["earth", "visitor"]]);
    stop();
  });
});
