// @vitest-environment happy-dom
// O-065 T-295: sky figures, outlines and the two reference circles, on made-up figures only (ARCH-03). The call and its refusals (one cause per code, API-05), the star lookup at scene build,
// the reads, the drawing at infinity above the Sun's glow, the switches, and the labels joining the one name layout.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PerspectiveCamera } from "three";
import { Scene, SceneError, earth, moon } from "astraeus";
import { definitionOf } from "./definitionOf";
import { starIdTable, type StarCatalogue } from "../src/assets/sky";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { SceneLabelLayer, SKY_LABEL_PRIORITY } from "../src/app/SceneLabels";
import { SkyFiguresView } from "../src/app/SkyFiguresView";
import { celestialEquatorSegments, DEFAULT_SKY_LINES, eclipticSegments, meanDirection, DEFAULT_SKY_COLOURS, type SkyFigureLayer } from "../src/app/skyFigures";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";
import { TRACK_LAYER } from "../src/app/TrackedBodyView";

const catalogue: StarCatalogue = { stars: [[10, 20, 3, 0.5, 900001], [30, 40, 4, null, 900002], [50, -10, 5, null]] };
vi.mock("../src/assets/sky", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/assets/sky")>();
  return { ...actual, loadStarCatalogue: vi.fn(async () => state.catalogue) };
});
const state = vi.hoisted(() => ({ catalogue: null as null | { stars: readonly (readonly (number | null)[])[] } }));

const base = () => new Scene().addBody(earth).addBody(moon);
const kite = { id: "kite", label: "The Kite", segments: [[{ raDeg: 10, decDeg: 20 }, { raDeg: 20, decDeg: 30 }], [{ raDeg: 20, decDeg: 30 }, { raDeg: 30, decDeg: 20 }]] } as const;
const ring = { id: "ring", label: "The Ring", kind: "boundary", points: [{ raDeg: 0, decDeg: 0 }, { raDeg: 20, decDeg: 0 }, { raDeg: 10, decDeg: 15 }] } as const;
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "no error"; };
const call = (figure: unknown) => base().addSkyFigures([figure as never]);

beforeEach(() => { state.catalogue = catalogue as never; });
afterEach(() => vi.clearAllMocks());

describe("Scene.addSkyFigures: the call", () => {
  it("adds figures and outlines in order and reads them back (id, label, kind)", () => {
    const scene = base().addSkyFigures([kite]).addSkyFigures([ring]);
    expect(scene.skyFigures).toEqual([{ id: "kite", label: "The Kite", kind: "figure" }, { id: "ring", label: "The Ring", kind: "boundary" }]);
    expect(Object.isFrozen(scene.skyFigures)).toBe(true);
  });
  it.each([
    ["not a list", undefined],
    ["an empty list", []],
    ["a figure that is not an object", [3]],
    ["no id", [{ ...kite, id: "" }]],
    ["no label", [{ ...kite, label: undefined }]],
    ["an unknown kind", [{ ...kite, kind: "line" }]],
    ["a figure with no segments", [{ id: "a", label: "A" }]],
    ["a figure with an empty segment list", [{ id: "a", label: "A", segments: [] }]],
    ["a figure given points", [{ ...kite, points: ring.points }]],
    ["a segment that is not a pair", [{ id: "a", label: "A", segments: [[{ star: 1 }]] }]],
    ["an end that is neither a star nor a position", [{ id: "a", label: "A", segments: [[{ star: 1 }, { raDeg: 1 }]] }]],
    ["a star number that is not a positive whole number", [{ id: "a", label: "A", segments: [[{ star: 1.5 }, { star: 2 }]] }]],
    ["a declination beyond 90", [{ id: "a", label: "A", segments: [[{ star: 1 }, { raDeg: 1, decDeg: 95 }]] }]],
    ["a boundary with two points", [{ ...ring, points: ring.points.slice(0, 2) }]],
    ["a boundary with no points", [{ id: "a", label: "A", kind: "boundary" }]],
    ["a boundary given segments", [{ ...ring, segments: kite.segments }]],
    ["a bad point", [{ ...ring, points: [...ring.points.slice(0, 2), { raDeg: 1 }] }]],
    ["a bad labelAt", [{ ...kite, labelAt: { raDeg: 1 } }]],
  ])("refuses %s with bad-sky-figure", (_name, figures) => {
    expect(codeOf(() => base().addSkyFigures(figures as never))).toBe("bad-sky-figure");
  });
  it("names the figure and the field in the message", () => {
    expect(() => call({ ...kite, label: "" })).toThrow(/addSkyFigures\("kite"\): label must be a non-empty text/);
  });
  it("adds none of a call when one figure in it is bad", () => {
    const scene = base();
    expect(codeOf(() => scene.addSkyFigures([kite, { ...ring, points: [] }] as never))).toBe("bad-sky-figure");
    expect(scene.skyFigures).toEqual([]);
  });
  it("throws duplicate-id for a repeat, inside a call, across calls, or against a body, path or group, and keeps what was there", () => {
    const scene = base().addSkyFigures([kite]);
    expect(codeOf(() => scene.addSkyFigures([kite]))).toBe("duplicate-id");
    expect(codeOf(() => scene.addSkyFigures([ring, { ...ring }]))).toBe("duplicate-id");
    expect(codeOf(() => scene.addSkyFigures([{ ...kite, id: "earth" }]))).toBe("duplicate-id");
    expect(scene.skyFigures.map(({ id }) => id)).toEqual(["kite"]);
    expect(codeOf(() => scene.addBody("mars"))).toBe("no error");
    expect(codeOf(() => new Scene().addSkyFigures([{ ...kite, id: "mars" }]).addBody("mars"))).toBe("duplicate-id");
  });
  it("refuses an edit once a viewer has taken the scene, as every other add does", async () => {
    const { markMounted } = await import("../src/api/sceneFreeze");
    const scene = base();
    markMounted(scene);
    expect(codeOf(() => scene.addSkyFigures([kite]))).toBe("scene-mounted");
  });
  it("keeps its own copy: editing the input afterwards changes nothing", () => {
    const input = { id: "a", label: "A", segments: [[{ raDeg: 1, decDeg: 2 }, { raDeg: 3, decDeg: 4 }]] };
    const scene = base().addSkyFigures([input as never]);
    input.label = "changed";
    expect(scene.skyFigures[0]!.label).toBe("A");
  });
});

describe("what the scene builds from figures", () => {
  it("places figures that name no star at once, as unit directions, with the label at the mean direction by default", () => {
    const { skyFigures } = definitionOf(base().addSkyFigures([kite, ring]));
    expect(skyFigures!.map(({ id, kind }) => [id, kind])).toEqual([["kite", "figure"], ["ring", "boundary"]]);
    const [first] = skyFigures!;
    expect(first!.segments).toHaveLength(2);
    for (const [from] of first!.segments) expect(Math.hypot(...from)).toBeCloseTo(1, 12);
    expect(Math.hypot(...first!.labelAt)).toBeCloseTo(1, 12);
    expect(skyFigures![1]!.segments).toHaveLength(3); // a closed loop of three points has three sides
    const [last, joined] = skyFigures![1]!.segments[2]!; // the last point joins the first
    expect(last).toEqual(skyFigures![1]!.segments[1]![1]);
    expect(joined).toEqual(skyFigures![1]!.segments[0]![0]);
  });
  it("puts the label where labelAt says", () => {
    const { skyFigures } = definitionOf(base().addSkyFigures([{ ...kite, labelAt: { raDeg: 90, decDeg: 0 } }]));
    expect(skyFigures![0]!.labelAt[0]).toBeCloseTo(0, 12);
    expect(skyFigures![0]!.labelAt[1]).toBeCloseTo(1, 12);
  });
  it("has no sky figures entry when none were added", () => {
    expect(definitionOf(base()).skyFigures).toBeUndefined();
  });
  it("places a star end from the star list in prepare, and the star list is not read when no end names a star", async () => {
    const { loadStarCatalogue } = await import("../src/assets/sky");
    const plain = definitionOf(base().addSkyFigures([kite]));
    await plain.prepare?.();
    expect(loadStarCatalogue).not.toHaveBeenCalled();
    const withStar = definitionOf(base().addSkyFigures([{ id: "pair", label: "Pair", segments: [[{ star: 900001 }, { star: 900002 }]] }]));
    expect(withStar.skyFigures).toEqual([]); // not yet: the list loads asynchronously
    await withStar.prepare?.();
    await withStar.prepare?.(); // a second prepare adds nothing more
    expect(withStar.skyFigures).toHaveLength(1);
    const table = starIdTable(catalogue.stars as never);
    expect(withStar.skyFigures![0]!.segments[0]).toEqual([table.get(900001)!.direction, table.get(900002)!.direction]);
  });
  it("throws unknown-star when scene is built with a star number the list does not hold, naming the number", async () => {
    const definition = definitionOf(base().addSkyFigures([{ id: "pair", label: "Pair", segments: [[{ star: 900001 }, { star: 777 }]] }]));
    await expect(definition.prepare?.()).rejects.toMatchObject({ code: "unknown-star", message: expect.stringContaining("star 777") });
  });
  it("throws missing-data when the star list cannot be read", async () => {
    state.catalogue = null;
    const definition = definitionOf(base().addSkyFigures([{ id: "pair", label: "Pair", segments: [[{ star: 900001 }, { raDeg: 1, decDeg: 1 }]] }]));
    await expect(definition.prepare?.()).rejects.toMatchObject({ code: "missing-data" });
  });
  it("carries the four switch names and their placement, with the figures on and the rest off by default", () => {
    expect(DEFAULT_SKY_LINES).toEqual({ figures: true, boundaries: false, ecliptic: false, celestialEquator: false });
    expect(definitionOf(base().addSkyFigures([kite]).setSwitches({ skyFigures: { place: "top-bar" }, ecliptic: { place: "panel", on: true } })).displaySwitches).toEqual({ skyFigures: { place: "top-bar" }, ecliptic: { place: "panel", on: true } });
  });
});

describe("the reference circles", () => {
  it("draws the equator at declination 0 and the ecliptic tilted by the engine's own obliquity (one constant)", () => {
    for (const [from] of celestialEquatorSegments()) expect(from[2]).toBeCloseTo(0, 12);
    const m = createOrbTwoBodyAdapter().eclipticJ2000ToEqjMatrix();
    const pole = [m[2]!, m[5]!, m[8]!];
    for (const [from, to] of eclipticSegments()) {
      expect(from[0] * pole[0]! + from[1] * pole[1]! + from[2] * pole[2]!).toBeCloseTo(0, 12);
      expect(Math.hypot(...to)).toBeCloseTo(1, 12);
    }
    expect(Math.acos(pole[2]!) * 180 / Math.PI).toBeCloseTo(23.4393, 3);
  });
  it("joins end to end all the way round", () => {
    const circle = eclipticSegments();
    expect(circle).toHaveLength(180);
    expect(circle.at(-1)![1][0]).toBeCloseTo(circle[0]![0][0], 12);
    expect(circle.at(-1)![1][1]).toBeCloseTo(circle[0]![0][1], 12);
  });
  it("takes the mean direction of opposite directions as the first one", () => {
    expect(meanDirection([[1, 0, 0], [-1, 0, 0]])).toEqual([1, 0, 0]);
  });
});

describe("SkyFiguresView: drawn at infinity, above the Sun's glow", () => {
  const layers = (): readonly SkyFigureLayer[] => definitionOf(base().addSkyFigures([kite, ring])).skyFigures!;
  const camera = new PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(5, 6, 7);

  it("stands on the camera and sits between its planes, so only the camera's turn moves it", () => {
    const view = new SkyFiguresView(layers());
    view.place(camera, DEFAULT_SKY_LINES, DEFAULT_SKY_COLOURS);
    expect(view.group.position.toArray()).toEqual([5, 6, 7]);
    expect(view.group.scale.x).toBeCloseTo(0.5 * (0.1 + 1000), 9);
  });
  it("draws on the last render pass, after every body and its halo, tests depth but writes none", () => {
    const view = new SkyFiguresView(layers());
    view.place(camera, { ...DEFAULT_SKY_LINES, boundaries: true }, DEFAULT_SKY_COLOURS);
    expect(view.group.children.length).toBe(2);
    for (const child of view.group.children) {
      expect(child.layers.mask).toBe(1 << TRACK_LAYER);
      const material = (child as unknown as { material: { depthTest: boolean; depthWrite: boolean } }).material;
      expect(material.depthTest).toBe(true);
      expect(material.depthWrite).toBe(false);
    }
  });
  it("shows each kind by its switch, and builds the circles only when first switched on", () => {
    const view = new SkyFiguresView(layers());
    view.place(camera, DEFAULT_SKY_LINES, DEFAULT_SKY_COLOURS);
    expect(view.shown).toEqual(["sky-figures"]);
    view.place(camera, { figures: false, boundaries: true, ecliptic: true, celestialEquator: true }, DEFAULT_SKY_COLOURS);
    expect([...view.shown].sort()).toEqual(["sky-boundaries", "sky-celestial-equator", "sky-ecliptic"]);
    view.place(camera, { figures: true, boundaries: false, ecliptic: false, celestialEquator: true }, DEFAULT_SKY_COLOURS);
    expect([...view.shown].sort()).toEqual(["sky-celestial-equator", "sky-figures"]);
  });
  it("paints the lines in the look's colours (defaults stated in one place) and repaints when they change, leaving a figure with its own colour alone", () => {
    const view = new SkyFiguresView([...layers(), { ...layers()[0]!, id: "own", color: "#123456" }]);
    const colourOf = (name: string) => (view.group.getObjectByName(name) as unknown as { material: { color: { getHexString(): string } } }).material.color.getHexString();
    view.place(camera, { ...DEFAULT_SKY_LINES, boundaries: true }, DEFAULT_SKY_COLOURS);
    expect(colourOf("sky-figures")).toBe(DEFAULT_SKY_COLOURS.figure.slice(1));
    expect(colourOf("sky-boundaries")).toBe(DEFAULT_SKY_COLOURS.boundary.slice(1));
    view.place(camera, { ...DEFAULT_SKY_LINES, boundaries: true }, { ...DEFAULT_SKY_COLOURS, figure: "#ff0000", boundary: "rgb(0, 255, 0)" });
    expect(colourOf("sky-figures")).toBe("ff0000");
    expect(colourOf("sky-boundaries")).toBe("00ff00");
    expect(colourOf("sky-figures:own")).toBe("123456");
  });
  it("has nothing to draw for a scene with no figures except what is switched on, and disposes cleanly", () => {
    const view = new SkyFiguresView([]);
    view.place(camera, { ...DEFAULT_SKY_LINES, ecliptic: true }, DEFAULT_SKY_COLOURS);
    expect(view.shown).toEqual(["sky-ecliptic"]);
    expect(() => view.dispose()).not.toThrow();
    expect(view.group.children).toHaveLength(0);
  });
});

describe("sky labels join the one name layout", () => {
  let host: HTMLElement;
  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(this.style.transform);
      const x = m === null ? 0 : Number(m[1]);
      const y = m === null ? 0 : Number(m[2]);
      return { left: x, top: y, right: x + 80, bottom: y + 20, width: 80, height: 20, x, y, toJSON: () => ({}) } as DOMRect;
    });
  });
  afterEach(() => { host.remove(); vi.restoreAllMocks(); });
  const camera = new PerspectiveCamera(60, 4 / 3, 0.1, 1000);
  camera.position.set(0, 0, 0);
  camera.lookAt(0, 0, -1);
  const spec = (id: string, kind: "figure" | "boundary", direction: [number, number, number]) => ({ id, label: id, color: "#fff", kind, direction });
  const hiddenOf = (id: string) => host.querySelector<HTMLElement>(`[data-label-id="${id}"]`)!.hidden;
  const frame = (layer: SceneLabelLayer, on = DEFAULT_SKY_LINES) => layer.update(() => null, camera, 800, 600, new FloatingOrigin(), "", undefined, { on, labelColor: "#abcdef", distance: 500 });

  it("is one layer: the sky label is an entry of the object label layer, ranked below every object", () => {
    const layer = new SceneLabelLayer(host, [], [spec("kite", "figure", [0, 0, -1])]);
    expect(host.querySelectorAll(".scene-labels")).toHaveLength(1);
    frame(layer);
    expect(hiddenOf("kite")).toBe(false);
    expect(SKY_LABEL_PRIORITY.figure).toBeLessThan(0);
    expect(SKY_LABEL_PRIORITY.boundary).toBeLessThan(SKY_LABEL_PRIORITY.figure);
    layer.dispose();
  });
  it("hides a label behind the camera, and one whose kind is switched off", () => {
    const layer = new SceneLabelLayer(host, [], [spec("front", "figure", [0, 0, -1]), spec("behind", "figure", [0, 0, 1]), spec("outline", "boundary", [0, 0, -1])]);
    frame(layer);
    expect(hiddenOf("front")).toBe(false);
    expect(hiddenOf("behind")).toBe(true);
    expect(hiddenOf("outline")).toBe(true);
    frame(layer, { ...DEFAULT_SKY_LINES, boundaries: true, figures: false });
    expect(hiddenOf("front")).toBe(true);
    layer.dispose();
  });
  it("keeps a body's name over a sky name when they collide (no overlap)", () => {
    const body = { id: "earth", label: "Earth", color: "#fff", labelPriority: 0 } as never;
    const layer = new SceneLabelLayer(host, [body], [spec("kite", "figure", [0, 0, -1])]);
    layer.update((id) => (id === "earth" ? [0, 0, -50] : null), camera, 800, 600, new FloatingOrigin(), "", undefined, { on: DEFAULT_SKY_LINES, labelColor: "#abcdef", distance: 500 });
    expect(hiddenOf("earth")).toBe(false);
    expect(hiddenOf("kite")).toBe(true);
    layer.dispose();
  });
  it("draws no sky label when nobody passes the sky frame", () => {
    const layer = new SceneLabelLayer(host, [], [spec("kite", "figure", [0, 0, -1])]);
    layer.update(() => null, camera, 800, 600, new FloatingOrigin(), "");
    expect(hiddenOf("kite")).toBe(true);
    layer.dispose();
  });
});
