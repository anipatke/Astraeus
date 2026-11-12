// @vitest-environment happy-dom
// O-071 T-311: an object outside its `shownDuring` span leaves the object menu, cannot be selected or aimed at, and a selection it held is dropped with the move's cause.
// The lifecycle runs on both embedding paths (mount and AstraeusScene, API-02) over made-up scenes only (ARCH-03); the 3D canvas is a stand-in.
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sceneProps = vi.hoisted(() => ({ latest: undefined as undefined | { controls: { cameraRequest?: unknown } } }));
vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: (props: { controls: { cameraRequest?: unknown } }) => { sceneProps.latest = props; return createElement("div", { "data-testid": "scene" }); } }));
vi.mock("../src/assets/sky", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { earth } from "../src/api/bodies";
import { AstraeusScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import type { ViewerHandle } from "../src/api/viewerHandle";
import type { SelectionChange } from "../src/api/viewerSelection";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { $, byLabel, change, drawn, mountShell, pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const DAY = 86_400_000;
/** Probe A is shown until the edge, probe B from it; both paths run the whole timeline, so only `shownDuring` moves them. */
const EDGE = T0 + 10 * MIN;
const path = (id: string, label: string, shownDuring: { start?: number; end?: number }) => ({
  id, label, center: "earth", shownDuring,
  samples: [0, 100].map((i) => ({ time: T0 + i * DAY, positionKm: [20_000 + i * 10, 0, 0], velocityKmS: [1, 0, 0] })),
});
const makeScene = () => new Scene().addBody(earth)
  .addTrajectory(path("pa", "Probe A", { end: EDGE }))
  .addTrajectory(path("pb", "Probe B", { start: EDGE }))
  .setTimeline({ start: T0, end: T0 + 100 * DAY, rate: 60, rates: [60, 86_400] });

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

const menu = () => [...(byLabel(host, "Select object") as HTMLSelectElement).options].map((option) => option.value);
const pick = (id: string) => change(byLabel(host, "Select object") as HTMLSelectElement, id);
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return (error as { code?: string }).code ?? String(error); } return "no error"; };

type Start = () => { handle: ViewerHandle; stop: () => void; ready: Promise<void> };
const PATHS: readonly (readonly [string, Start])[] = [
  ["mount", () => { const m = mount(host, makeScene()); return { handle: m, stop: () => m.unmount(), ready: m.ready }; }],
  ["AstraeusScene", () => {
    let got: ViewerHandle | undefined;
    root = createRoot(host);
    act(() => root!.render(createElement(AstraeusScene, { scene: makeScene(), onReady: (h: ViewerHandle) => { got = h; } })));
    const handle = new Proxy({} as ViewerHandle, { get: (_t, key) => Reflect.get(got!, key) });
    return { handle, stop: () => { act(() => root!.unmount()); root = undefined; }, ready: vi.waitFor(() => expect(got).toBeDefined()) };
  }],
];

describe.each(PATHS)("%s: an object's shown time", (_name, start) => {
  it("lists only the objects shown at the clock time, before, at and after the edge", async () => {
    const { handle, stop, ready } = start(); await drawn({ ready });
    act(() => { handle.setPlaying(false); handle.setTime(EDGE - 1); });
    expect(menu()).toContain("pa");
    expect(menu()).not.toContain("pb");
    act(() => handle.setTime(EDGE));
    expect(menu()).not.toContain("pa");
    expect(menu()).toContain("pb");
    expect(host.textContent).not.toContain("Unavailable");
    act(() => handle.setTime(EDGE + 5 * DAY));
    expect(menu()).toEqual(expect.arrayContaining(["earth", "pb"]));
    expect(menu()).not.toContain("pa");
    stop();
  });

  it("refuses setSelected and setCamera for an object outside its span, as for a view-hidden one", async () => {
    const { handle, stop, ready } = start(); await drawn({ ready });
    act(() => { handle.setPlaying(false); handle.setTime(EDGE - 1); });
    expect(codeOf(() => handle.setSelected("pb"))).toBe("bad-selection");
    expect(codeOf(() => handle.setCamera({ focus: "pb" }))).toBe("bad-camera");
    expect(codeOf(() => handle.setCamera({ lookOut: "earth", direction: "pb" }))).toBe("bad-camera");
    expect(codeOf(() => handle.setSelected("pa"))).toBe("no error");
    act(() => handle.setTime(EDGE));
    expect(codeOf(() => handle.setSelected("pa"))).toBe("bad-selection");
    expect(codeOf(() => handle.setCamera({ follow: "pa" }))).toBe("bad-camera");
    expect(codeOf(() => handle.setSelected("pb"))).toBe("no error");
    expect(codeOf(() => handle.setCamera({ follow: "pb" }))).toBe("no error");
    stop();
  });

  it("drops a selection that leaves its span with the move's cause, and keeps the camera pose", async () => {
    const drops: readonly (readonly [string, (handle: ViewerHandle) => void, string])[] = [
      ["host setTime", (h) => { act(() => h.setTime(EDGE + MIN)); }, "host"],
      ["visitor time change", () => { const scrub = byLabel(host, "Seek timeline") as HTMLInputElement; act(() => change(scrub, scrub.max)); }, "visitor"],
      ["playback", (h) => { act(() => h.setPlaying(true)); for (let i = 0; i < 300 && h.selected === "pa"; i++) act(() => { vi.advanceTimersByTime(100); }); }, "playback"],
    ];
    for (const [name, move, cause] of drops) {
      const { handle, stop, ready } = start(); await drawn({ ready });
      const heard: SelectionChange[] = [];
      handle.onSelect((c) => heard.push(c));
      act(() => { handle.setPlaying(false); handle.setTime(name === "playback" ? EDGE - MIN : T0 + MIN); });
      pick("pa");
      expect(handle.selected, name).toBe("pa");
      const pose = JSON.stringify(handle.camera);
      move(handle);
      // The drop is reported once, by the move's cause; the fallback is the first object shown (the planet), never the object that starts at the edge.
      expect(heard.map((c) => [c.object, c.cause]), name).toEqual([["pa", "visitor"], ["earth", cause]]);
      expect(handle.selected, name).toBe("earth");
      expect(menu(), name).not.toContain("pa");
      expect(JSON.stringify(handle.camera), name).toBe(pose);
      stop();
      if (root) { host.replaceChildren(); }
    }
  });
});

describe("the phone drawer's object menu", () => {
  it("lists only the objects shown at the clock time", async () => {
    pretendScreen({ phone: true });
    const m = mount(host, makeScene());
    await drawn({ ready: m.ready });
    act(() => { m.setPlaying(false); m.setTime(EDGE - 1); });
    expect(menu()).toContain("pa");
    expect(menu()).not.toContain("pb");
    act(() => m.setTime(EDGE));
    expect(menu()).not.toContain("pa");
    expect(menu()).toContain("pb");
    m.unmount();
  });
});

describe("the shell: the camera at a drop", () => {
  it("keeps the pose (a hold, no overview request) when the followed object leaves its span", () => {
    const base = syntheticDefinition.experience;
    const marker = base.objects.find((object) => object.id === "survey-marker")!;
    const start = base.window.startUtcMs;
    const edge = start + 30 * MIN;
    const experience = { ...base, objects: base.objects.map((object) => (object === marker ? { ...marker, shownDuring: { endUtcMs: edge } } : object)) };
    const shell = mountShell({ experience });
    act(() => change($(shell.container, "select.object-picker") as HTMLSelectElement, "survey-marker"));
    act(() => { $(shell.container, '[data-camera-preset*="follow"]').click(); });
    expect(shell.selected()).toBe("survey-marker");
    const requestsBefore = shell.cameraRequests.length;
    shell.clock.seek(edge);
    shell.advance(0);
    expect(shell.selected()).not.toBe("survey-marker");
    expect(shell.holds()).toBe(1);
    expect(shell.cameraRequests.slice(requestsBefore).some((request) => request.kind === "overview")).toBe(false);
    shell.unmount();
  });
});

describe("a story step's camera and an object outside its shown time", () => {
  it("leaves the camera request unchanged when a step opens while the object is not shown, and makes it once the object is shown", async () => {
    const made = { sourceType: "illustrative", sources: ["Made up"], accuracy: "None claimed.", notes: "Made up." } as const;
    const step = (id: string) => ({ id, title: `Step ${id}`, body: "A made-up line.", provenance: made, camera: { focus: "pb" } });
    const m = mount(host, makeScene().addStoryPanels([step("s1"), step("s2")]));
    await drawn({ ready: m.ready });
    const controls = () => sceneProps.latest!.controls;
    // The first step opens with the viewer, while pb (shown from the edge) is not shown: the step opens, its camera request is skipped.
    expect(m.panel).toBe("s1");
    expect(controls().cameraRequest).not.toEqual({ kind: "focus", target: "pb" });
    act(() => { m.setPlaying(false); m.setTime(EDGE - 1); });
    act(() => m.setPanel("s2"));
    expect(m.panel).toBe("s2");
    expect(controls().cameraRequest).not.toEqual({ kind: "focus", target: "pb" });
    act(() => m.setPanel("s1"));
    act(() => m.setTime(EDGE));
    act(() => m.setPanel("s2"));
    expect(m.panel).toBe("s2");
    expect(controls().cameraRequest).toEqual({ kind: "focus", target: "pb" });
    m.unmount();
  });
});

// I-175: a camera aimed by a host `setCamera` or a story panel's `camera` holds its pose and stops following when its object leaves its span, as the preset path does.
describe.each(PATHS)("%s: a camera aimed at an object that leaves its span", (_name) => {
  const made = { sourceType: "illustrative", sources: ["Made up"], accuracy: "None claimed.", notes: "Made up." } as const;
  const withStep = () => makeScene().addStoryPanels([{ id: "s1", title: "Step s1", body: "A made-up line.", provenance: made, camera: { follow: "pa" } }]);
  const aims: readonly (readonly [string, (handle: ViewerHandle) => void])[] = [
    ["setCamera", (h) => { act(() => h.setCamera({ follow: "pa" })); }],
    ["story panel camera", (h) => { act(() => h.setPanel("s1")); }],
  ];
  const moves: readonly (readonly [string, (handle: ViewerHandle, cameraRequest: () => unknown) => void])[] = [
    ["host setTime", (h) => { act(() => h.setTime(EDGE + MIN)); }],
    ["visitor time change", () => { const scrub = byLabel(host, "Seek timeline") as HTMLInputElement; act(() => change(scrub, scrub.max)); }],
    ["playback", (h, request) => { act(() => h.setPlaying(true)); for (let i = 0; i < 300 && JSON.stringify(request()).includes("follow"); i++) act(() => { vi.advanceTimersByTime(100); }); }],
  ];
  const cases = aims.flatMap(([aim, aimAt]) => moves.map(([move, doMove]) => [aim, aimAt, move, doMove] as const));
  it.each(cases.map((c) => ({ title: `${c[0]} then ${c[2]}`, c })))("$title: the request becomes a hold", async ({ c: [aim, aimAt, move, doMove] }) => {
    // The scene differs per aim, so it is started here rather than by `start`.
    let handle: ViewerHandle; let stop: () => void; let ready: Promise<void>;
    if (_name === "mount") { const m = mount(host, aim === "setCamera" ? makeScene() : withStep()); handle = m; stop = () => m.unmount(); ready = m.ready; }
    else {
      let got: ViewerHandle | undefined;
      root = createRoot(host);
      act(() => root!.render(createElement(AstraeusScene, { scene: aim === "setCamera" ? makeScene() : withStep(), onReady: (h: ViewerHandle) => { got = h; } })));
      handle = new Proxy({} as ViewerHandle, { get: (_t, key) => Reflect.get(got!, key) });
      stop = () => { act(() => root!.unmount()); root = undefined; };
      ready = vi.waitFor(() => expect(got).toBeDefined());
    }
    await drawn({ ready });
    const request = () => sceneProps.latest!.controls.cameraRequest;
    act(() => { handle.setPlaying(false); handle.setTime(move === "playback" ? EDGE - MIN : T0 + MIN); });
    aimAt(handle);
    expect(request(), `${aim} aimed`).toEqual({ kind: "follow", target: "pa" });
    doMove(handle, request);
    expect(request(), `${aim} then ${move}`).toEqual({ kind: "hold" });
    stop();
    if (root) host.replaceChildren();
  });
});
