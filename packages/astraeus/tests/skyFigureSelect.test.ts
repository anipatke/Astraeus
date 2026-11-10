// @vitest-environment happy-dom
// O-066 T-299: selecting a sky figure. The card fields and their refusals at the call, the reads, the screen lines a tap tests (and which figures are tappable), the emphasis lines and name
// colour of the selected figure, and the object-menu rule. Made-up figures only (ARCH-03); the tap rule itself is in scenePicking.test.ts and the full path in lifecycle.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PerspectiveCamera, type LineBasicMaterial, type LineSegments } from "three";
import { Scene, SceneError, earth } from "astraeus";
import { definitionOf } from "./definitionOf";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { SceneLabelLayer } from "../src/app/SceneLabels";
import { SkyFiguresView } from "../src/app/SkyFiguresView";
import { DEFAULT_SKY_COLOURS, DEFAULT_SKY_LINES, type SkyFigureLayer } from "../src/app/skyFigures";
import { listedFigures, skyFigureById } from "../src/shell/objectModel";
import { infoView } from "../src/shell/infoModel";
import { pickSkyFigure } from "../src/app/scenePicking";

const kite = { id: "kite", label: "The Kite", segments: [[{ raDeg: 10, decDeg: 20 }, { raDeg: 20, decDeg: 30 }]] } as const;
const base = () => new Scene().addBody(earth);
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "no error"; };
const call = (extra: object) => () => base().addSkyFigures([{ ...kite, ...extra } as never]);

describe("addSkyFigures: the card fields", () => {
  it("reads description, facts, listed and provenance back, with sources added after the provenance's own", () => {
    const scene = base().addSkyFigures([{ ...kite, description: "A made-up kite.", facts: [{ label: "Stars", value: "2" }], sources: ["Invented 2026"], provenance: { sourceType: "illustrative", sources: ["Mine"], accuracy: "None", notes: "" }, listed: false }]);
    const [read] = scene.skyFigures;
    expect(read).toMatchObject({ id: "kite", description: "A made-up kite.", facts: [{ label: "Stars", value: "2" }], listed: false });
    expect(read!.provenance.sources).toEqual(["Mine", "Invented 2026"]);
    expect(Object.isFrozen(read)).toBe(true);
  });
  it("defaults to listed, no words and an illustrative provenance supplied by the caller", () => {
    const [read] = base().addSkyFigures([kite]).skyFigures;
    expect(read).toMatchObject({ listed: true });
    expect(read).not.toHaveProperty("description");
    expect(read).not.toHaveProperty("facts");
    expect(read!.provenance).toMatchObject({ sourceType: "illustrative", sources: ["Supplied by the caller"] });
  });
  it.each([
    ["empty description", { description: "" }], ["number description", { description: 4 }], ["facts not a list", { facts: "x" }], ["fact without a value", { facts: [{ label: "a" }] }],
    ["empty source", { sources: [""] }], ["sources not a list", { sources: "x" }], ["listed not a boolean", { listed: "no" }], ["bad provenance type", { provenance: { sourceType: "guess", sources: [], accuracy: "", notes: "" } }],
  ])("%s throws bad-sky-figure", (_label, extra) => {
    expect(codeOf(call(extra))).toBe("bad-sky-figure");
  });
  it("hands the shell one card per figure (no star list needed) under the same listing rule as bodies", () => {
    const { experience } = definitionOf(base().addSkyFigures([{ ...kite, description: "A made-up kite." }, { ...kite, id: "quiet", label: "Quiet", listed: false }]));
    expect(experience.skyFigures!.map(({ id, listed }) => [id, listed])).toEqual([["kite", true], ["quiet", false]]);
    expect(listedFigures(experience, "").map(({ id }) => id)).toEqual(["kite"]);
    expect(listedFigures(experience, "quiet").map(({ id }) => id)).toEqual(["kite", "quiet"]); // the selected one shows even when unlisted
    expect(skyFigureById(experience, "kite")?.label).toBe("The Kite");
    expect(definitionOf(base()).experience.skyFigures).toBeUndefined();
  });
  it("shows the card through the one info model: title, description, facts and provenance badge text", () => {
    const { experience } = definitionOf(base().addSkyFigures([{ ...kite, description: "A made-up kite.", facts: [{ label: "Stars", value: "2" }] }]));
    const view = infoView(experience, { kind: "object", id: "kite" });
    expect(view).toMatchObject({ title: "The Kite", description: "A made-up kite.", facts: [{ label: "Stars", value: "2" }], provenance: { status: "Illustrative" } });
    expect(infoView(experience, { kind: "object", id: "nope" })).toBeNull();
  });
});

describe("tapping and emphasising a drawn figure", () => {
  // Camera looks along render -z, which is EQJ +y; a segment about EQJ (0, 1, 0) stands in the middle of the screen.
  const camera = new PerspectiveCamera(60, 4 / 3, 0.1, 1000);
  camera.position.set(0, 0, 0);
  camera.lookAt(0, 0, -1);
  const front = (from: number, to: number): SkyFigureLayer["segments"] => [[[from, 1, 0], [to, 1, 0]]];
  const layer = (id: string, extra: Partial<SkyFigureLayer> = {}): SkyFigureLayer => ({ id, label: id, kind: "figure", segments: front(-0.1, 0.1), labelAt: [0, 1, 0], ...extra });
  const box = { left: 0, top: 0 };

  it("projects each tappable figure's lines to screen px (the middle line crosses the middle of the canvas)", () => {
    const view = new SkyFiguresView([layer("kite")]);
    const [figure] = view.screenFigures(camera, 800, 600, DEFAULT_SKY_LINES, undefined, box);
    expect(figure!.id).toBe("kite");
    const [x1, y1, x2, y2] = figure!.lines[0]!;
    expect(y1).toBeCloseTo(300, 0);
    expect(y2).toBeCloseTo(300, 0);
    expect(x1).toBeLessThan(400);
    expect(x2).toBeGreaterThan(400);
    expect(pickSkyFigure([figure!], 400, 310)).toBe("kite");
    expect(pickSkyFigure([figure!], 400, 450)).toBeNull();
  });
  it("carries the shown name's rectangle, from page px to canvas px", () => {
    const view = new SkyFiguresView([layer("kite")]);
    const [figure] = view.screenFigures(camera, 800, 600, DEFAULT_SKY_LINES, new Map([["kite", { left: 150, top: 80, right: 210, bottom: 100 }]]), { left: 100, top: 50 });
    expect(figure!.label).toEqual({ left: 50, top: 30, right: 110, bottom: 50 });
  });
  it("leaves out a figure whose switch is off, and a figure shown only when traced until a trace shows it", () => {
    const view = new SkyFiguresView([layer("kite"), layer("ring", { kind: "boundary" }), layer("hidden", { whenTraced: true })]);
    const ids = (on = DEFAULT_SKY_LINES) => view.screenFigures(camera, 800, 600, on, undefined, box).map(({ id }) => id);
    expect(ids()).toEqual(["kite"]);
    expect(ids({ ...DEFAULT_SKY_LINES, boundaries: true })).toEqual(["kite", "ring"]);
    expect(ids({ ...DEFAULT_SKY_LINES, figures: false })).toEqual([]);
    view.startTrace({ id: "hidden", seconds: 1, after: "stay", reduced: false });
    expect(ids()).toEqual(["kite", "hidden"]);
  });
  it("keeps a long line with both ends off screen, drops one wholly behind the camera, and keeps the visible part of one with an end behind", () => {
    const view = new SkyFiguresView([layer("long", { segments: front(-5, 5) }), layer("behind", { segments: [[[0, -1, 0], [0.1, -1, 0]]] }), layer("half", { segments: [[[0, 1, 0], [1, -1, 0]]] })]);
    const lines = (id: string) => view.screenFigures(camera, 800, 600, DEFAULT_SKY_LINES, undefined, box).find((figure) => figure.id === id)!.lines;
    const [x1, , x2] = lines("long")[0]!;
    expect(x1).toBeLessThan(0);
    expect(x2).toBeGreaterThan(800);
    expect(pickSkyFigure(view.screenFigures(camera, 800, 600, DEFAULT_SKY_LINES, undefined, box).filter((f) => f.id === "long"), 400, 310)).toBe("long");
    expect(lines("behind")).toEqual([]);
    expect(lines("half")).toHaveLength(1);
    expect(pickSkyFigure(view.screenFigures(camera, 800, 600, DEFAULT_SKY_LINES, undefined, box).filter((f) => f.id === "half"), 600, 305)).toBe("half");
  });
  it("draws the selected figure's lines over it in the look's selected colour, moves them with the selection and removes them when a body is selected", () => {
    const view = new SkyFiguresView([layer("kite"), layer("other")]);
    const emphasis = () => view.group.children.filter((child) => child.name.startsWith("sky-selected:")) as LineSegments[];
    view.place(camera, DEFAULT_SKY_LINES, DEFAULT_SKY_COLOURS, "earth");
    expect(emphasis()).toHaveLength(0);
    view.place(camera, DEFAULT_SKY_LINES, DEFAULT_SKY_COLOURS, "kite");
    expect(emphasis().map((line) => line.name)).toEqual(["sky-selected:kite"]);
    expect((emphasis()[0]!.material as LineBasicMaterial).color.getHexString()).toBe(DEFAULT_SKY_COLOURS.selected.slice(1));
    view.place(camera, DEFAULT_SKY_LINES, { ...DEFAULT_SKY_COLOURS, selected: "#ff0000" }, "kite");
    expect((emphasis()[0]!.material as LineBasicMaterial).color.getHexString()).toBe("ff0000");
    view.place(camera, DEFAULT_SKY_LINES, DEFAULT_SKY_COLOURS, "other");
    expect(emphasis().map((line) => line.name)).toEqual(["sky-selected:other"]);
    view.place(camera, DEFAULT_SKY_LINES, DEFAULT_SKY_COLOURS, "earth");
    expect(emphasis()).toHaveLength(0);
  });
  it("hides the emphasis with the figure's switch", () => {
    const view = new SkyFiguresView([layer("kite")]);
    view.place(camera, { ...DEFAULT_SKY_LINES, figures: false }, DEFAULT_SKY_COLOURS, "kite");
    expect(view.shown).toEqual([]);
  });
});

describe("the selected figure's name", () => {
  let host: HTMLElement;
  beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); });
  afterEach(() => { host.remove(); vi.restoreAllMocks(); });
  it("takes the look's selected colour while selected and its own or the look's label colour after", () => {
    const camera = new PerspectiveCamera(60, 4 / 3, 0.1, 1000);
    camera.lookAt(0, 0, -1);
    const layer = new SceneLabelLayer(host, [], [{ id: "kite", label: "kite", kind: "figure", direction: [0, 0, -1] }]);
    const colourOf = () => host.querySelector<HTMLElement>('[data-label-id="kite"]')!.style.getPropertyValue("--label-color");
    const draw = (selected: string) => layer.update(() => null, camera, 800, 600, new FloatingOrigin(), selected, undefined, { on: DEFAULT_SKY_LINES, labelColor: "#abcdef", selectedColor: "#fedcba", distance: 500 });
    draw("");
    expect(colourOf()).toBe("#abcdef");
    draw("kite");
    expect(colourOf()).toBe("#fedcba");
    draw("earth");
    expect(colourOf()).toBe("#abcdef");
    layer.dispose();
  });
});
