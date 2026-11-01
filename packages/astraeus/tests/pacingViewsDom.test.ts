// @vitest-environment happy-dom
// Pacing follows views in the viewer (O-052 T-224): switching view eases the paced rate, a seek lands on it at once, a chosen speed wins until "auto",
// and onChange reports the eased rates with cause "playback". Made-up two-probe scene; the 3D scene is a stand-in.
import { act, createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));

import { Scene, earth } from "astraeus";
import { mount } from "../src/api/mount";
import type { ViewerChange } from "../src/api/viewerLink";
import { drawn } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const DAY = 86_400_000;
const T0 = Date.UTC(2030, 0, 1);
const at = (days: number) => new Date(T0 + days * DAY).toISOString();
const samples = (x: number) => [0, 1].map((i) => ({ time: T0 + i * 100 * DAY, positionKm: [x + i, 0, 0], velocityKmS: [1, 0, 0] }));
const scene = () => new Scene().addBody(earth)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: samples(10_000) })
  .addTrajectory({ id: "pb", label: "Probe B", center: "earth", samples: samples(20_000) })
  .addEvents([{ id: "ea", label: "A flyby", time: at(20), type: "flyby" }, { id: "eb", label: "B flyby", time: at(50), type: "flyby" }])
  .setViews([{ id: "a", label: "A", paths: ["pa"], events: ["ea"] }, { id: "b", label: "B", paths: ["pb"], events: ["eb"] }], { place: "top-bar" })
  .setTimeline({ start: at(0), end: at(100), rate: 86_400, rates: [60, 86_400], pacing: [{ near: { type: "flyby", within: 86_400 }, rate: 60 }] });

let host: HTMLElement;
beforeEach(() => {
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(() => { host.remove(); vi.unstubAllGlobals(); vi.useRealTimers(); });
const tick = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe("pacing follows the showing view in the viewer", () => {
  it("opens at the opening view's rate, eases to the new view's rate over about a second, and reports it as playback", async () => {
    const seen: ViewerChange[] = [];
    const handle = mount(host, scene(), { onChange: (c) => seen.push(c) });
    await drawn(handle);
    act(() => handle.setTime(T0 + 20 * DAY));
    tick(100);
    expect(handle.rate).toBeCloseTo(60, 6); // view A slows at its event
    act(() => handle.setView("b")); // B has no event here: the paced rate heads for 86 400
    tick(100);
    expect(handle.rate).toBeGreaterThan(60);
    expect(handle.rate).toBeLessThan(86_400); // eased, not jumped
    expect(seen.at(-1)).toMatchObject({ cause: "playback" });
    tick(1200);
    expect(handle.rate).toBeCloseTo(86_400, 3);
    handle.unmount();
  });

  it("a seek lands on the paced rate at once, and a chosen speed wins until auto", async () => {
    const handle = mount(host, scene());
    await drawn(handle);
    act(() => handle.setTime(T0 + 20 * DAY));
    tick(100);
    act(() => handle.setView("b"));
    act(() => handle.setTime(T0 + 20 * DAY)); // seek mid-ease
    expect(handle.rate).toBeCloseTo(86_400, 6);
    act(() => handle.setRate(60));
    act(() => handle.setView("a"));
    tick(1500);
    expect(handle.rate).toBe(60);
    act(() => handle.setRate("auto"));
    expect(handle.rate).toBeCloseTo(60, 6); // view A at its event, immediately
    handle.unmount();
  });
});
