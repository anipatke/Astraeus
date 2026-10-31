// @vitest-environment happy-dom
// A viewer with paced playback (O-047 T-201, I-112): it follows the pacing, a picked speed wins until Auto or setRate("auto") gives it back, and the menu says so.
// The 3D scene is stubbed (no GPU here); the real viewer, its timeline and its clock run on the synthetic definition with pacing laid over it.
import { act, createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
vi.mock("../src/api/prepared", async () => {
  const { syntheticDefinition } = await import("../src/synthetic/syntheticDefinition");
  const { startUtcMs, endUtcMs } = syntheticDefinition.experience.window;
  const mid = startUtcMs + Math.floor((endUtcMs - startUtcMs) / 2);
  // Cruise at the third offered speed; a stretch from the middle to the end at a made-up in-between speed 7, eased over a minute.
  const pacing = { baseRate: syntheticDefinition.experience.rates[2]!, zones: [{ fromUtcMs: mid, toUtcMs: endUtcMs, rate: 7, rampMs: 60_000 }] };
  return { prepareScene: () => ({ definition: { ...syntheticDefinition, clock: { ...syntheticDefinition.clock, rate: 60 }, pacing }, ready: Promise.resolve() }) };
});

import { SceneError } from "../src/api/errors";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import type { ViewerChange } from "../src/api/viewerLink";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { byLabel, change } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { startUtcMs, endUtcMs } = syntheticDefinition.experience.window;
const MID = startUtcMs + Math.floor((endUtcMs - startUtcMs) / 2);
const RATES = syntheticDefinition.experience.rates;
let host: HTMLElement;
beforeEach(() => {
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(() => { host.remove(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const codeOf = (run: () => void): string | undefined => { try { run(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return undefined; };
const menu = () => byLabel(host, "Playback speed") as HTMLSelectElement;

describe("paced playback in the viewer", () => {
  it("opens at the cruise rate, follows the pacing as time moves, and the menu shows Auto", async () => {
    const seen: ViewerChange[] = [];
    const handle = mount(host, new Scene(), { onChange: (c) => seen.push(c) });
    await act(async () => { await handle.ready; });
    expect(handle.rate).toBe(RATES[2]);
    expect(menu().value).toBe("auto");
    expect([...menu().options].map((o) => o.value)).toEqual(["auto", ...[...RATES].sort((a, b) => a - b).map(String)]);
    act(() => handle.setTime(MID + 120_000)); // well inside the slow stretch, past its ramp
    act(() => { vi.advanceTimersByTime(100); });
    expect(handle.rate).toBeCloseTo(7, 6);
    expect(seen.at(-1)).toMatchObject({ cause: "playback" });
    expect(seen.at(-1)!.rate).toBeCloseTo(7, 6);
    act(() => handle.setTime(startUtcMs + 1000));
    act(() => { vi.advanceTimersByTime(100); });
    expect(handle.rate).toBeCloseTo(RATES[2]!, 6);
    handle.unmount();
  });

  it("lets a visitor's speed win until Auto, and the host's too until setRate(\"auto\")", async () => {
    const handle = mount(host, new Scene());
    await act(async () => { await handle.ready; });
    act(() => change(menu(), String(RATES[0])));
    expect(menu().value).toBe(String(RATES[0]));
    act(() => handle.setTime(MID + 120_000));
    act(() => { vi.advanceTimersByTime(300); });
    expect(handle.rate).toBe(RATES[0]); // pacing would say 7
    act(() => change(menu(), "auto"));
    act(() => { vi.advanceTimersByTime(100); });
    expect(handle.rate).toBeCloseTo(7, 6);
    expect(menu().value).toBe("auto");

    act(() => handle.setRate(RATES[1]!));
    act(() => { vi.advanceTimersByTime(300); });
    expect(handle.rate).toBe(RATES[1]);
    expect(codeOf(() => handle.setRate(7))).toBe("bad-timeline"); // in-between speeds are pacing's, never set by hand
    act(() => handle.setRate("auto"));
    expect(handle.rate).toBeCloseTo(7, 6);
    handle.unmount();
  });
});
