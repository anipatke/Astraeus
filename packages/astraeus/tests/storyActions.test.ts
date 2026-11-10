// @vitest-environment happy-dom
// O-066 T-301: a story panel's actions (camera, select, trace), a look-out turned toward a sky figure, and an event that names a sky figure. Made-up figures and stories only (ARCH-03);
// the opening of a panel in a running viewer is in lifecycle.test.ts (both embedding paths, API-02).
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, type StoryPanelInput } from "astraeus";
import { definitionOf } from "../src/api/definitionOf";
import { cameraRequestOf } from "../src/api/cameraRequest";
import { ViewerLink } from "../src/api/viewerLink";
import { aimAtFigure } from "../src/app/skyFigures";
import { FAKE_PRESENTATION, FAKE_PRESENTATION_CONTROL } from "./helpers/viewerPresentation";
import { mountShell, press } from "./domSetup";

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const kite = { id: "kite", label: "The Kite", segments: [[{ raDeg: 10, decDeg: 20 }, { raDeg: 20, decDeg: 30 }]] } as const;
const base = () => new Scene().addBody(earth).addBody(moon).addSkyFigures([kite]);
const made = { sourceType: "illustrative", sources: ["Made up"], accuracy: "None claimed.", notes: "Made up." } as const;
const step = (id: string, extra: Partial<StoryPanelInput> = {}): StoryPanelInput => ({ id, title: `Title ${id}`, body: "A made-up line.", provenance: made, ...extra });
const errorOf = (fn: () => unknown): { code: string; message: string } => { try { fn(); } catch (error) { return error instanceof SceneError ? { code: error.code, message: error.message } : { code: "other", message: String(error) }; } return { code: "none", message: "" }; };
const stepsOf = (scene: Scene) => definitionOf(scene).experience.storyPanels!.steps!;

describe("panel actions: what a panel carries", () => {
  it("carries camera, select and trace on a step and on a moment panel, in the order they apply, with the trace defaults filled", () => {
    const scene = base().addStoryPanels([
      step("a", { object: "kite", camera: { lookOut: "earth", direction: "kite", fovDeg: 40 }, select: true, trace: true }),
      step("b", { object: "kite", trace: { durationSeconds: 3, after: "fade" } }),
      step("c", { camera: { focus: "moon" } }),
      { ...step("m"), at: { time: T0 + 10 * MIN }, object: "kite", select: true },
    ]).setTimeline({ start: T0, end: T0 + 60 * MIN });
    const set = definitionOf(scene).experience.storyPanels!;
    const [a, b, c] = set.steps!;
    expect(Object.keys(a!).filter((key) => ["camera", "select", "trace"].includes(key))).toEqual(["camera", "select", "trace"]);
    expect(a).toMatchObject({ camera: { kind: "lookOut", body: "earth", direction: "kite", fovDeg: 40 }, select: true, trace: { seconds: 2, after: "stay" }, objectId: "kite" });
    expect(b).toMatchObject({ trace: { seconds: 3, after: "fade" } });
    expect(b).not.toHaveProperty("select");
    expect(c).toMatchObject({ camera: { kind: "focus", target: "moon" } });
    expect(set.panels[0]).toMatchObject({ id: "m", select: true, objectId: "kite" });
  });
  it("a panel without these fields has none of them (unchanged)", () => {
    const [plain] = stepsOf(base().addStoryPanels([step("plain", { object: "moon" })]));
    for (const key of ["camera", "select", "trace"]) expect(plain).not.toHaveProperty(key);
  });
  it("a look-out with no direction keeps the one looked along (no direction in the request)", () => {
    const [a] = stepsOf(base().addStoryPanels([step("a", { camera: { lookOut: "earth", fovDeg: 30 } })]));
    expect(a!.camera).toEqual({ kind: "lookOut", body: "earth", fovDeg: 30 });
  });
  it("a panel's object may name a sky figure, and scene.panels reads it", () => {
    expect(base().addStoryPanels([step("a", { object: "kite" })]).panels[0]!.object).toBe("kite");
  });
});

describe("panel actions: bad shapes and bad names throw bad-panels naming the panel", () => {
  it.each([
    ["a camera that is not a target", { camera: 5 }, "a", "camera"],
    ["a camera with two kinds", { camera: { follow: "moon", focus: "earth" } }, "a", "camera"],
    ["a look-out direction out of range", { camera: { lookOut: "earth", direction: { raDeg: 1, decDeg: 99 } } }, "a", "camera"],
    ["a select that is not true or false", { object: "moon", select: "yes" }, "a", "select"],
    ["a select with no object", { select: true }, "a", "select"],
    ["a trace with no object", { trace: true }, "a", "trace"],
    ["trace options out of range", { object: "kite", trace: { durationSeconds: 0 } }, "a", "trace"],
    ["trace options with an unknown key", { object: "kite", trace: { speed: 2 } }, "a", "trace"],
    ["a trace that is text", { object: "kite", trace: "now" }, "a", "trace"],
  ])("%s", (_name, extra, id, field) => {
    const failure = errorOf(() => base().addStoryPanels([step(id, extra as Partial<StoryPanelInput>)]));
    expect(failure.code).toBe("bad-panels");
    expect(failure.message).toContain(`story panel ${id}`);
    expect(failure.message).toContain(field);
  });
  it.each([
    ["a camera naming a body the scene lacks", { camera: { focus: "ghost" } }],
    ["a look-out turning toward something that is neither", { camera: { lookOut: "earth", direction: "ghost" } }],
    ["a look-out from a sky figure", { camera: { lookOut: "kite" } }],
    ["a trace of a body", { object: "moon", trace: true }],
    ["an object the scene lacks", { object: "ghost" }],
  ])("at the build: %s", (_name, extra) => {
    const scene = base().addStoryPanels([step("a", extra as Partial<StoryPanelInput>)]);
    const failure = errorOf(() => definitionOf(scene));
    expect(failure).toMatchObject({ code: "bad-panels" });
    expect(failure.message).toContain("story panel a");
  });
});

describe("a look-out may turn toward a sky figure", () => {
  it("cameraRequestOf keeps the figure id as the direction, and leaves it out only when asked to keep", () => {
    expect(cameraRequestOf({ lookOut: "earth", direction: "kite" }, "setCamera", undefined)).toEqual({ kind: "lookOut", body: "earth", direction: "kite" });
    expect(cameraRequestOf({ lookOut: "earth" }, "setCamera", undefined)).toMatchObject({ kind: "lookOut", direction: [1, 0, 0] });
    expect(cameraRequestOf({ lookOut: "earth" }, "setCamera", undefined, true)).toEqual({ kind: "lookOut", body: "earth" });
    expect(errorOf(() => cameraRequestOf({ lookOut: "earth", direction: "earth" }, "setCamera", undefined)).code).toBe("bad-camera");
  });
  it("aimAtFigure turns a figure id into its label point and leaves everything else alone", () => {
    const figures = [{ id: "kite", labelAt: [0, 1, 0] as const }];
    expect(aimAtFigure({ kind: "lookOut", body: "earth", direction: "kite", fovDeg: 30 }, figures)).toEqual({ kind: "lookOut", body: "earth", direction: [0, 1, 0], fovDeg: 30 });
    const body = { kind: "lookOut", body: "earth", direction: "moon" } as const;
    expect(aimAtFigure(body, figures)).toBe(body);
    const focus = { kind: "focus", target: "kite" } as const;
    expect(aimAtFigure(focus, figures)).toBe(focus);
  });
  it("setCamera accepts a figure id the viewer draws and still refuses an unknown one with bad-camera", () => {
    const link = new ViewerLink();
    const asked: unknown[] = [];
    link.attach({
      ...FAKE_PRESENTATION_CONTROL, window: { startUtcMs: 0, endUtcMs: 10 }, events: [], rates: [1], paced: false, playable: true, setPlaying: () => undefined,
      read: () => ({ timeUtcMs: 1, rate: 1, playing: false, ...FAKE_PRESENTATION }), seek: () => undefined, setRate: () => undefined, views: [], setView: () => undefined,
      cameraTargets: () => ["earth", "moon"], readCamera: () => undefined, setCamera: (request: unknown) => { asked.push(request); },
      skyFigures: [{ id: "kite", label: "The Kite", kind: "figure", listed: true, provenance: made }],
    } as never);
    link.setCamera({ lookOut: "earth", direction: "kite" });
    expect(asked).toEqual([{ kind: "lookOut", body: "earth", direction: "kite" }]);
    expect(errorOf(() => link.setCamera({ lookOut: "earth", direction: "ghost" })).code).toBe("bad-camera");
    expect(errorOf(() => link.setCamera({ focus: "kite" })).code).toBe("bad-camera"); // a figure is a direction, not a place to frame
  });
});

describe("an event that names a sky figure", () => {
  const scene = () => base().addEvents([{ id: "rise", label: "Rise", time: T0 + 20 * MIN, object: "kite" }]);
  it("is accepted, and a name that is neither a body nor a figure is refused naming the event", () => {
    expect(definitionOf(scene()).experience.events[0]!.object).toBe("kite");
    const failure = errorOf(() => definitionOf(base().addEvents([{ id: "ghost", label: "G", time: T0, object: "ghost" }])));
    expect(failure.code).toBe("bad-event");
    expect(failure.message).toContain('"ghost"');
  });
  it("Go to seeks and selects the figure, and leaves the camera alone", () => {
    const m = mountShell({ experience: definitionOf(scene()).experience });
    const before = m.cameraRequests.length;
    press([...m.container.querySelectorAll<HTMLElement>(".timeline-expanded li button")].find((row) => row.textContent?.includes("Rise"))!);
    expect(m.selected()).toBe("kite");
    expect(m.clock.now()).toBe(T0 + 20 * MIN);
    expect(m.cameraRequests.length).toBe(before);
    m.unmount();
  });
});
