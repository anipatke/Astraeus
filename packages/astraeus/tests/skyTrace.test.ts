// O-065 T-297: tracing a sky figure when the app asks. Made-up figures only (ARCH-03); the frame stage is tested on its own (CODE-02).
import { afterEach, describe, expect, it, vi } from "vitest";
import { SceneError } from "astraeus";
import { checkedTrace } from "../src/api/skyTraceInput";
import { ViewerLink } from "../src/api/viewerLink";
import { DEFAULT_TRACE_SECONDS, TRACE_FADE_SECONDS, stepTrace, type SkyTraceRun } from "../src/core/skyTrace";
import { DEFAULT_SKY_COLOURS, prefersReducedMotion } from "../src/app/skyFigures";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import { SkyFiguresView } from "../src/app/SkyFiguresView";
import { advanceSkyTraces, type FrameContext } from "../src/app/sceneFrame";
import { FAKE_PRESENTATION } from "./helpers/viewerPresentation";
import { makeContext } from "./helpers/frameContext";

afterEach(() => vi.unstubAllGlobals());

const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "no error"; };
const run = (over: Partial<SkyTraceRun> = {}): SkyTraceRun => ({ seconds: 4, after: "stay", reduced: false, elapsed: 0, ...over });
// A made-up figure of three segments along the equator: (1,0,0) -> (0,1,0) -> (-1,0,0) -> (0,-1,0).
const kite = { id: "kite", label: "The Kite", kind: "figure", labelAt: [1, 0, 0], segments: [[[1, 0, 0], [0, 1, 0]], [[0, 1, 0], [-1, 0, 0]], [[-1, 0, 0], [0, -1, 0]]] } as never;
const ring = { id: "ring", label: "The Ring", kind: "boundary", labelAt: [0, 1, 0], segments: [[[1, 0, 0], [0, 1, 0]]] } as never;

describe("stepTrace", () => {
  it("draws the share of the figure the elapsed time has reached, in real seconds", () => {
    const r = run();
    expect(stepTrace(r, 1).drawn).toBeCloseTo(0.25);
    expect(stepTrace(r, 1).drawn).toBeCloseTo(0.5);
    expect(stepTrace(r, 2)).toMatchObject({ drawn: 1, done: false });
  });
  it("stay keeps the figure and stops asking for frames once fully drawn", () => {
    const r = run({ seconds: 1 });
    expect(stepTrace(r, 2)).toMatchObject({ drawn: 1, fade: 0, done: false, moving: true }); // the step that finishes it
    expect(stepTrace(r, 1)).toMatchObject({ drawn: 1, fade: 0, done: false, moving: false });
  });
  it("clear is done the step the trace completes", () => {
    const r = run({ seconds: 1, after: "clear" });
    expect(stepTrace(r, 0.5).done).toBe(false);
    expect(stepTrace(r, 0.5).done).toBe(true);
  });
  it("fade eases to 1 over the fade time, then is done", () => {
    const r = run({ seconds: 1, after: "fade" });
    stepTrace(r, 1);
    expect(stepTrace(r, TRACE_FADE_SECONDS / 2)).toMatchObject({ fade: 0.5, done: false });
    expect(stepTrace(r, TRACE_FADE_SECONDS)).toMatchObject({ fade: 1, done: true });
  });
  it("reduced motion shows the whole figure from the first step, holds it for the trace time, then applies after (a fade is a step)", () => {
    const r = run({ seconds: 2, after: "fade", reduced: true });
    expect(stepTrace(r, 0.1)).toMatchObject({ drawn: 1, done: false });
    expect(stepTrace(r, 2)).toMatchObject({ done: true });
    const stays = run({ seconds: 2, reduced: true });
    expect(stepTrace(stays, 3)).toMatchObject({ drawn: 1, done: false });
  });
});

describe("checkedTrace", () => {
  const known = ["kite", "ring"];
  it("fills the defaults", () => { expect(checkedTrace("kite", undefined, known)).toEqual({ id: "kite", seconds: DEFAULT_TRACE_SECONDS, after: "stay" }); });
  it("takes seconds and after", () => { expect(checkedTrace("ring", { durationSeconds: 0.1, after: "clear" }, known)).toEqual({ id: "ring", seconds: 0.1, after: "clear" }); });
  it.each([["an unknown id", "nope"], ["a non-string id", 4], ["any id when the scene has none", "kite"]])("%s throws unknown-sky-figure", (name, id) => {
    expect(codeOf(() => checkedTrace(id, undefined, name.startsWith("any") ? [] : known))).toBe("unknown-sky-figure");
  });
  it.each([
    ["seconds 0", { durationSeconds: 0 }], ["seconds below the range", { durationSeconds: 0.09 }], ["seconds above the range", { durationSeconds: 61 }], ["seconds NaN", { durationSeconds: Number.NaN }],
    ["seconds text", { durationSeconds: "3" }], ["after unknown", { after: "linger" }], ["an unknown option", { speed: 2 }], ["options text", "stay"], ["options null", null],
  ])("%s throws bad-sky-trace", (_name, options) => {
    expect(codeOf(() => checkedTrace("kite", options, known))).toBe("bad-sky-trace");
  });
});

describe("the host link's traceSkyFigure", () => {
  it("checks, then hands the viewer the figure, seconds and after; not-mounted before attach", () => {
    const link = new ViewerLink();
    expect(codeOf(() => link.traceSkyFigure("kite"))).toBe("not-mounted");
    const heard: unknown[] = [];
    link.attach({ ...(FAKE_PRESENTATION as object), window: { startUtcMs: 0, endUtcMs: 10 }, events: [], rates: [1], paced: false, playable: true, setPlaying: () => undefined, read: () => ({ timeUtcMs: 1, rate: 1, playing: false, ...FAKE_PRESENTATION }), seek: () => undefined, setRate: () => undefined,
      views: [], setView: () => undefined, cameraTargets: () => [], readCamera: () => undefined, setSelected: () => undefined, setCamera: () => undefined, scales: [], setScale: () => undefined, setLook: () => undefined, setSwitch: () => undefined,
      skyFigures: [{ id: "kite", label: "The Kite", kind: "figure" }], traceSkyFigure: (...args: unknown[]) => heard.push(args) } as never);
    link.traceSkyFigure("kite");
    link.traceSkyFigure("kite", { durationSeconds: 3, after: "fade" });
    expect(codeOf(() => link.traceSkyFigure("ring"))).toBe("unknown-sky-figure");
    expect(heard).toEqual([["kite", DEFAULT_TRACE_SECONDS, "stay"], ["kite", 3, "fade"]]);
  });
});

describe("advanceSkyTraces (stage 4c, O-065)", () => {
  const framed = (delta: number, layers: readonly never[] = [kite, ring]) => {
    const { ctx } = makeContext();
    const view = new SkyFiguresView(layers);
    return { ctx: { ...ctx, delta, views: { ...ctx.views, skyFiguresView: view } } as FrameContext, view };
  };
  const request = (over: object = {}) => ({ id: "kite", seconds: 3, after: "stay" as const, reduced: false, ...over });
  const overlay = (view: SkyFiguresView) => view.group.children.find((child) => child.name === "sky-trace:kite") as import("three").LineSegments | undefined;

  it("takes the asked traces in call order and empties the queue", () => {
    const { ctx, view } = framed(0.5);
    ctx.controls.skyTraces.push(request(), request({ id: "ring" }));
    advanceSkyTraces(ctx);
    expect(ctx.controls.skyTraces).toEqual([]);
    expect(view.group.children.map((child) => child.name)).toEqual(expect.arrayContaining(["sky-trace:kite", "sky-trace:ring"]));
  });

  it("draws segments in order, the last one growing from its first end, over the real seconds given", () => {
    const { ctx, view } = framed(0.5);
    ctx.controls.skyTraces.push(request());
    advanceSkyTraces(ctx); // 0.5 s of 3 s: one sixth of the figure, so half of the first segment
    const line = overlay(view)!;
    expect(line.geometry.drawRange).toEqual({ start: 0, count: 2 });
    const [from, to] = [eqjToRenderVector([1, 0, 0]), eqjToRenderVector([0, 1, 0])];
    const mid = [0, 1, 2].map((axis) => from[axis]! + (to[axis]! - from[axis]!) / 2);
    const length = Math.hypot(...(mid as [number, number, number]));
    const array = Array.from(line.geometry.getAttribute("position").array);
    expect(array.slice(0, 3)).toEqual(Array.from(from));
    array.slice(3, 6).forEach((value, axis) => expect(value).toBeCloseTo(mid[axis]! / length, 5));
    for (let i = 0; i < 4; i += 1) advanceSkyTraces(ctx); // 2.5 s: five sixths: into the third segment
    expect(line.geometry.drawRange.count).toBe(6);
    advanceSkyTraces(ctx); // 3 s
    expect(line.geometry.drawRange.count).toBe(6);
    const last = eqjToRenderVector([0, -1, 0]);
    Array.from(line.geometry.getAttribute("position").array).slice(15, 18).forEach((value, axis) => expect(value).toBeCloseTo(last[axis]!, 5)); // the third segment reached its second end
  });

  it("uses the traced colour, and the faded one while fading, from the looks", () => {
    const { ctx, view } = framed(1);
    ctx.controls.skyTraces.push(request({ seconds: 1, after: "fade" }));
    advanceSkyTraces(ctx); // done drawing: fade starts next step
    const material = overlay(view)!.material as import("three").LineBasicMaterial;
    expect(material.color.getHexString()).toBe(DEFAULT_SKY_COLOURS.traced.slice(1));
    (ctx as { delta: number }).delta = TRACE_FADE_SECONDS;
    advanceSkyTraces(ctx);
    expect(overlay(view)).toBeUndefined(); // faded away and removed
  });

  it("stay keeps the lines, clear removes them, and a second request for a figure restarts it", () => {
    const { ctx, view } = framed(5);
    ctx.controls.skyTraces.push(request());
    advanceSkyTraces(ctx);
    expect(overlay(view)).toBeDefined();
    advanceSkyTraces(ctx);
    expect(overlay(view)).toBeDefined();
    const first = overlay(view);
    (ctx as { delta: number }).delta = 0.1;
    ctx.controls.skyTraces.push(request({ seconds: 10 }));
    advanceSkyTraces(ctx);
    expect(overlay(view)).not.toBe(first);
    expect(overlay(view)!.geometry.drawRange.count).toBe(2);
    (ctx as { delta: number }).delta = 20;
    ctx.controls.skyTraces.push(request({ after: "clear", seconds: 1 }));
    advanceSkyTraces(ctx);
    expect(overlay(view)).toBeUndefined();
  });

  it("reduced motion draws the whole figure at once and still applies after", () => {
    const { ctx, view } = framed(0.01);
    ctx.controls.skyTraces.push(request({ reduced: true, after: "clear" }));
    advanceSkyTraces(ctx);
    expect(overlay(view)!.geometry.drawRange.count).toBe(6);
    (ctx as { delta: number }).delta = 3;
    advanceSkyTraces(ctx);
    expect(overlay(view)).toBeUndefined();
  });

  it("follows the figure's switch: with it off the trace runs unseen, with it on it shows", () => {
    const { ctx, view } = framed(0.5);
    ctx.controls.skyLines = { ...ctx.controls.skyLines, figures: false };
    ctx.controls.skyTraces.push(request());
    advanceSkyTraces(ctx);
    expect(overlay(view)!.visible).toBe(false);
    ctx.controls.skyLines = { ...ctx.controls.skyLines, figures: true };
    advanceSkyTraces(ctx);
    expect(overlay(view)!.visible).toBe(true);
  });

  it("wakes the draw rule while a trace moves and not once a stay trace is complete", () => {
    const { ctx } = framed(1);
    ctx.controls.skyTraces.push(request({ seconds: 2 }));
    advanceSkyTraces(ctx);
    advanceSkyTraces(ctx);
    const woken = ctx.state.wakes;
    expect(woken).toBe(2);
    advanceSkyTraces(ctx);
    expect(ctx.state.wakes).toBe(woken);
  });

  it("ignores an id the view does not hold, and never reads the scene clock", () => {
    const { ctx, view } = framed(1);
    const snapshot = vi.spyOn(ctx.runtime.clock, "snapshot");
    ctx.controls.skyTraces.push(request({ id: "gone" }));
    advanceSkyTraces(ctx);
    expect(view.group.children.some((child) => child.name.startsWith("sky-trace"))).toBe(false);
    expect(snapshot).not.toHaveBeenCalled();
  });
});

describe("a figure shown only when traced (O-065 T-298)", () => {
  const hidden = { ...(kite as object), whenTraced: true } as never;
  const framed = (delta: number) => {
    const { ctx } = makeContext();
    const view = new SkyFiguresView([hidden, ring]);
    return { ctx: { ...ctx, delta, views: { ...ctx.views, skyFiguresView: view } } as FrameContext, view };
  };
  const request = (over: object = {}) => ({ id: "kite", seconds: 2, after: "stay" as const, reduced: false, ...over });
  const names = (view: SkyFiguresView) => view.group.children.map((child) => child.name);

  it("draws no lines and no label before a trace (the always-shown outline still draws)", () => {
    const { ctx, view } = framed(0.5);
    advanceSkyTraces(ctx);
    expect(names(view)).toEqual(["sky-boundaries"]);
    expect(view.labelOpacity("kite")).toBe(0);
    expect(view.labelOpacity("ring")).toBe(1);
    expect(view.labels.find((label) => label.id === "kite")?.whenTraced).toBe(true);
  });
  it("shows the label and the growing lines once a trace starts", () => {
    const { ctx, view } = framed(0.5);
    ctx.controls.skyTraces.push(request());
    advanceSkyTraces(ctx);
    expect(names(view)).toContain("sky-trace:kite");
    expect(view.labelOpacity("kite")).toBe(1);
  });
  it("stay keeps lines and label", () => {
    const { ctx, view } = framed(3);
    ctx.controls.skyTraces.push(request());
    advanceSkyTraces(ctx);
    advanceSkyTraces(ctx);
    expect(names(view)).toContain("sky-trace:kite");
    expect(view.labelOpacity("kite")).toBe(1);
  });
  it("fade dims the label with the lines, then both are gone", () => {
    const { ctx, view } = framed(2);
    ctx.controls.skyTraces.push(request({ after: "fade" }));
    advanceSkyTraces(ctx); // drawn
    (ctx as { delta: number }).delta = TRACE_FADE_SECONDS / 2;
    advanceSkyTraces(ctx);
    expect(view.labelOpacity("kite")).toBeCloseTo(0.5);
    (ctx as { delta: number }).delta = TRACE_FADE_SECONDS;
    advanceSkyTraces(ctx);
    expect(names(view)).not.toContain("sky-trace:kite");
    expect(view.labelOpacity("kite")).toBe(0);
  });
  it("clear removes lines and label at once; tracing again restarts from nothing", () => {
    const { ctx, view } = framed(2);
    ctx.controls.skyTraces.push(request({ after: "clear" }));
    advanceSkyTraces(ctx);
    expect(names(view)).not.toContain("sky-trace:kite");
    expect(view.labelOpacity("kite")).toBe(0);
    (ctx as { delta: number }).delta = 0.1;
    ctx.controls.skyTraces.push(request({ seconds: 10 }));
    advanceSkyTraces(ctx);
    const line = view.group.children.find((child) => child.name === "sky-trace:kite") as import("three").LineSegments;
    expect(line.geometry.drawRange.count).toBe(2);
    expect(view.labelOpacity("kite")).toBe(1);
  });
  it("reduced motion shows it at once, then applies after", () => {
    const { ctx, view } = framed(0.01);
    ctx.controls.skyTraces.push(request({ reduced: true, after: "clear" }));
    advanceSkyTraces(ctx);
    expect((view.group.children.find((child) => child.name === "sky-trace:kite") as import("three").LineSegments).geometry.drawRange.count).toBe(6);
    expect(view.labelOpacity("kite")).toBe(1);
    (ctx as { delta: number }).delta = 3;
    advanceSkyTraces(ctx);
    expect(view.labelOpacity("kite")).toBe(0);
  });
  it("the kind switch hides the traced lines when off", () => {
    const { ctx, view } = framed(0.5);
    ctx.controls.skyLines = { ...ctx.controls.skyLines, figures: false };
    ctx.controls.skyTraces.push(request());
    advanceSkyTraces(ctx);
    expect(view.shown).not.toContain("sky-trace:kite");
  });
});

describe("prefersReducedMotion", () => {
  it("reads the system setting and is false where the browser cannot say", () => {
    expect(prefersReducedMotion()).toBe(false);
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduce") }));
    expect(prefersReducedMotion()).toBe(true);
  });
});
