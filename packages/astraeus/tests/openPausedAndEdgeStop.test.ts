// @vitest-environment happy-dom
// O-073 T-314: open paused, stop exactly on a timeline edge, a panel at the end, and a zero-length trace clear waking a redraw. Made-up scenes only (ARCH-03).
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
vi.mock("../src/assets/sky", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/assets/sky")>()),
  loadStarCatalogue: vi.fn().mockResolvedValue(null),
}));

import { earth } from "../src/api/bodies";
import { AstraeusScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import type { ViewerHandle } from "../src/api/viewerHandle";
import { SimulationClock } from "../src/core/clock";
import { CrossingTracker } from "../src/shell/storyPanels";
import { SkyFiguresView } from "../src/app/SkyFiguresView";
import { advanceSkyTraces, type FrameContext } from "../src/app/sceneFrame";
import { makeContext } from "./helpers/frameContext";
import { drawn, pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const END = T0 + 60 * MIN;
const codeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return (error as { code?: string }).code ?? String(error);
  }
  return "no error";
};
const scene = (playing?: boolean) =>
  new Scene()
    .addBody(earth)
    .setTimeline({ start: T0, end: END, rate: 60, ...(playing === undefined ? {} : { playing }) });

describe("setTimeline playing", () => {
  it.each([
    ["a string", "no"],
    ["a number", 0],
    ["null", null],
  ])("refuses %s as playing with bad-timeline", (_name, value) => {
    expect(codeOf(() => scene(value as never).timeline)).toBe("bad-timeline");
  });
  it.each([
    [undefined, true],
    [true, true],
    [false, false],
  ])("states playing %s on scene.timeline as %s", (given, read) => {
    expect(scene(given).timeline.playing).toBe(read);
  });
});

let host: HTMLElement;
let root: Root | undefined;
beforeEach(() => {
  pretendScreen({});
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(() => {
  if (root) act(() => root!.unmount());
  root = undefined;
  host.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

type Start = (playing: boolean | undefined) => { handle: ViewerHandle; stop: () => void; ready: Promise<void> };
const PATHS: readonly (readonly [string, Start])[] = [
  [
    "mount",
    (playing) => {
      const m = mount(host, scene(playing));
      return { handle: m, stop: () => m.unmount(), ready: m.ready };
    },
  ],
  [
    "AstraeusScene",
    (playing) => {
      let got: ViewerHandle | undefined;
      root = createRoot(host);
      act(() =>
        root!.render(
          createElement(AstraeusScene, {
            scene: scene(playing),
            onReady: (h: ViewerHandle) => {
              got = h;
            },
          }),
        ),
      );
      const handle = new Proxy({} as ViewerHandle, { get: (_t, key) => Reflect.get(got!, key) });
      return {
        handle,
        stop: () => {
          act(() => root!.unmount());
          root = undefined;
        },
        ready: vi.waitFor(() => expect(got).toBeDefined()),
      };
    },
  ],
];

describe.each(PATHS)("%s: the opening play state", (_name, start) => {
  it.each([
    [false, false],
    [undefined, true],
  ])("playing %s opens with the viewer playing = %s, the clock still on the opening time", async (given, expected) => {
    const { handle, stop, ready } = start(given);
    await drawn({ ready });
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(handle.playing).toBe(expected);
    if (!expected) expect(handle.timeUtcMs).toBe(T0);
    stop();
  });
});

describe("a stop on the timeline's edge", () => {
  it.each([
    ["end, forward", 1, END, END + 1_000, END],
    ["start, backward", -1, T0, T0 + 1_000, T0],
  ])(
    "a clock whose monotonic source ticks between reads stops exactly on the %s",
    (_name, rate, edge, from, expected) => {
      let monotonicMs = 0;
      const clock = new SimulationClock(from, () => (monotonicMs += 7));
      clock.setRate(rate * 2_000);
      clock.play();
      expect(clock.stopWithin({ startUtcMs: T0, endUtcMs: END })).toBe(true);
      expect(clock.now()).toBe(expected);
      expect(clock.playing).toBe(false);
      expect(edge).toBe(expected);
    },
  );

  const panels = [{ id: "last", timeUtcMs: END }] as never;
  it("opens the panel at the end when playback was seen playing and then stops there", () => {
    const tracker = new CrossingTracker(END - 5 * MIN);
    expect(tracker.advance(panels, END - MIN, true, true)).toBeNull();
    expect(tracker.advance(panels, END, false, true)?.id).toBe("last");
    expect(tracker.advance(panels, END, false, true)).toBeNull();
  });
  it("opens nothing for a host or visitor seek to the end, paused or playing", () => {
    for (const playingBefore of [false, true]) {
      const tracker = new CrossingTracker(T0);
      tracker.advance(panels, T0 + MIN, playingBefore, true);
      tracker.rebase(END);
      expect(tracker.advance(panels, END, false, true)).toBeNull();
    }
  });
});

describe("a zero-length sky trace clear", () => {
  const kite = {
    id: "kite",
    label: "The Kite",
    kind: "figure",
    labelAt: [1, 0, 0],
    segments: [
      [
        [1, 0, 0],
        [0, 1, 0],
      ],
    ],
  } as never;
  it("wakes the draw rule and removes the lines on a paused, still frame", () => {
    const { ctx } = makeContext();
    const view = new SkyFiguresView([kite]);
    const framed = { ...ctx, delta: 0, views: { ...ctx.views, skyFiguresView: view } } as FrameContext;
    framed.controls.skyTraces.push({ id: "kite", seconds: 3, after: "stay", reduced: false });
    advanceSkyTraces(framed);
    expect(view.group.children.some((child) => child.name === "sky-trace:kite")).toBe(true);
    const before = framed.state.wakes;
    framed.controls.skyTraces.push({ id: "kite", seconds: 0, reduced: false });
    advanceSkyTraces(framed);
    expect(framed.state.wakes).toBeGreaterThan(before);
    expect(view.group.children.some((child) => child.name === "sky-trace:kite")).toBe(false);
  });
});
