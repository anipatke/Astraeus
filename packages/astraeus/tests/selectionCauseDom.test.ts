// @vitest-environment happy-dom
// O-054 I-137 (table-driven, one row per path that changes the selected object):  the cause onSelect names for a selection that time drops, on a real Scene and the real prepareScene (only the 3D canvas is a stand-in): a path whose samples
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
import { $, byLabel, change, drawn, press, pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const DAY = 86_400_000;
const makeScene = () => new Scene().addBody(earth)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [10_000 + i * 1_000, 0, 0], velocityKmS: [1, 0, 0] })) })
  .addTrajectory({ id: "pb", label: "Probe B", center: "earth", samples: [0, 100].map((i) => ({ time: T0 + i * DAY, positionKm: [20_000 + i * 10, 0, 0], velocityKmS: [1, 0, 0] })) })
  .setViews([
    { id: "a", label: "View A", objects: ["pa"] },
    { id: "b", label: "View B", objects: ["pb"], camera: { focus: "pb" } }, // hides pa; its rule frames pb
    { id: "c", label: "View C", objects: ["pb"] }, // hides pa; the camera stays
  ], { place: "top-bar" })
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
const viewButton = (id: string) => press($(host, `[data-view-id="${id}"]`));
/** The visitor's Focus button for the selected object, so the camera frames it (a view rule applies when the next view hides it). */
const focusSelected = () => { press($(host, '[data-camera-preset*="focus"]')); };
const causes = (heard: SelectionChange[]) => heard.map((c) => [c.object, c.cause]);

/** The probe is selected (by the visitor) with the clock paused five minutes in (or at `at`), in view a. */
function selectedProbe(handle: ViewerHandle, heard: SelectionChange[], at = T0 + 5 * MIN): void {
  handle.onSelect((c) => heard.push(c));
  act(() => { handle.setPlaying(false); handle.setTime(at); });
  pick("pa");
  expect(handle.selected).toBe("pa");
}

type Row = { readonly name: string; readonly run: (handle: ViewerHandle, heard: SelectionChange[]) => void; readonly expected: readonly (readonly [string, string])[] };
const V = ["pa", "visitor"] as const;
/** One row per path that changes the selected object (see the I-137 history). */
const ROWS: readonly Row[] = [
  { name: "host setView to a view that hides it (plain drop)", run: (h, heard) => { selectedProbe(h, heard); act(() => h.setView("c")); }, expected: [V, ["earth", "host"]] },
  { name: "visitor switch to a view that hides it (plain drop)", run: (h, heard) => { selectedProbe(h, heard); act(() => viewButton("c")); }, expected: [V, ["earth", "visitor"]] },
  { name: "host setView to a view whose camera rule frames another object", run: (h, heard) => { selectedProbe(h, heard); act(() => focusSelected()); act(() => h.setView("b")); }, expected: [V, ["earth", "host"], ["pb", "host"]] },
  { name: "visitor switch to a view whose camera rule frames another object", run: (h, heard) => { selectedProbe(h, heard); act(() => focusSelected()); act(() => viewButton("b")); }, expected: [V, ["earth", "visitor"], ["pb", "visitor"]] },
  { name: "host setTime past the path's end", run: (h, heard) => { selectedProbe(h, heard); act(() => h.setTime(T0 + 50 * DAY)); }, expected: [V, ["earth", "host"]] },
  { name: "playback past the path's end", run: (h, heard) => {
    selectedProbe(h, heard, T0 + 29 * MIN);
    act(() => h.setPlaying(true));
    for (let i = 0; i < 200 && heard.length < 2; i++) act(() => { vi.advanceTimersByTime(100); });
  }, expected: [V, ["earth", "playback"]] },
  { name: "visitor seek past the path's end, after a host move", run: (h, heard) => {
    selectedProbe(h, heard);
    act(() => h.setTime(T0 + 6 * MIN));
    const scrub = byLabel(host, "Seek timeline") as HTMLInputElement;
    act(() => change(scrub, scrub.max));
  }, expected: [V, ["earth", "visitor"]] },
  { name: "visitor pick, after a host move", run: (h, heard) => { selectedProbe(h, heard); act(() => h.setTime(T0 + 6 * MIN)); pick("earth"); }, expected: [V, ["earth", "visitor"]] },
  { name: "no change: the same pick, a host move that keeps the object, the same view, time passing", run: (h, heard) => {
    selectedProbe(h, heard);
    pick("pa");
    act(() => { h.setTime(T0 + 6 * MIN); h.setView("a"); h.setPlaying(false); });
    act(() => { vi.advanceTimersByTime(500); });
  }, expected: [V] },
];

describe.each([
  ["mount", (): { handle: ViewerHandle; stop: () => void; ready: Promise<void> } => { const m = mount(host, makeScene()); return { handle: m, stop: () => m.unmount(), ready: m.ready }; }],
  ["AstraeusScene", (): { handle: ViewerHandle; stop: () => void; ready: Promise<void> } => {
    let got: ViewerHandle | undefined;
    root = createRoot(host);
    act(() => root!.render(createElement(AstraeusScene, { scene: makeScene(), onReady: (h: ViewerHandle) => { got = h; } })));
    const handle = new Proxy({} as ViewerHandle, { get: (_t, key) => Reflect.get(got!, key) });
    return { handle, stop: () => { act(() => root!.unmount()); root = undefined; }, ready: vi.waitFor(() => expect(got).toBeDefined()) };
  }],
] as const)("%s: who moved the selection", (_name, start) => {
  it.each(ROWS)("$name", async ({ run, expected }) => {
    const { handle, stop, ready } = start(); await drawn({ ready });
    const heard: SelectionChange[] = [];
    run(handle, heard);
    expect(causes(heard)).toEqual(expected);
    stop();
  });
});
