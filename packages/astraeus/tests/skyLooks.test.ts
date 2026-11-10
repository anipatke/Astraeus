// @vitest-environment happy-dom
// Sky line colours and the label font and size are looks (O-065 T-296): defaults, checks, the per-figure override and the one CSS-variable route to every label.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Scene } from "../src/api/scene";
import { earth } from "../src/api/bodies";
import { definitionOf } from "../src/api/definitionOf";
import { isCssColour, isFontFamily } from "../src/core/lookValues";
import { DEFAULT_LABEL_STYLE, labelStyleOf, labelStyleVars } from "../src/app/labelStyle";
import { LOOK_FIELDS, lookName, resolveLook } from "../src/app/look";
import { SceneLabelLayer } from "../src/app/SceneLabels";
import { DEFAULT_SKY_COLOURS, DEFAULT_SKY_LINES, skyColoursOf } from "../src/app/skyFigures";
import { PerspectiveCamera } from "three";
import { FloatingOrigin } from "../src/app/floatingOrigin";

const kite = { id: "kite", label: "Kite", segments: [[{ raDeg: 0, decDeg: 0 }, { raDeg: 10, decDeg: 10 }]] } as const;
const code = (run: () => unknown) => { try { run(); } catch (error) { return (error as { code?: string }).code; } return undefined; };

describe("the new looks sit in the one look table with no page-address parameter", () => {
  it("lists the sky colours and the label font and size, each without an address parameter", () => {
    const own = LOOK_FIELDS.filter((field) => field.path[0] === "skyLines" || field.path[0] === "labels");
    expect(own.map(lookName)).toEqual(["skyLines.figure", "skyLines.label", "skyLines.boundary", "skyLines.ecliptic", "skyLines.equator", "skyLines.traced", "skyLines.faded", "labels.fontFamily", "labels.sizePx"]);
    expect(own.every((field) => field.param === null)).toBe(true);
    // an address that names them changes nothing
    expect(resolveLook({ labels: { sizePx: 14 } }, "?labels=20&sizepx=20&figure=red")).toEqual({ labels: { sizePx: 14 } });
  });
  it("keeps today's label look as the default: the page's font at 12 px", () => {
    expect(DEFAULT_LABEL_STYLE).toEqual({ fontFamily: "inherit", sizePx: 12 });
    expect(labelStyleOf({})).toEqual({ fontFamily: "inherit", sizePx: 12 });
    expect(labelStyleOf({ labels: { sizePx: 18 } })).toEqual({ fontFamily: "inherit", sizePx: 18 });
    expect(skyColoursOf({ skyLines: { faded: "gray" } })).toEqual({ ...DEFAULT_SKY_COLOURS, faded: "gray" });
  });
});

describe("Scene.setLook checks the new looks", () => {
  it("takes them and passes them on to the definition", () => {
    const look = { skyLines: { figure: "#ff0000", traced: "rgb(255, 200, 0)" }, labels: { fontFamily: "Georgia, serif", sizePx: 14 } };
    expect(definitionOf(new Scene().addBody(earth).setLook(look)).look).toEqual(look);
  });
  it.each([
    ["a colour the browser cannot parse", { skyLines: { figure: "notacolour" } }],
    ["a colour that is not text", { skyLines: { ecliptic: 5 } }],
    ["an empty font", { labels: { fontFamily: "" } }],
    ["a blank font", { labels: { fontFamily: "  " } }],
    ["a size below the range", { labels: { sizePx: 4 } }],
    ["a size above the range", { labels: { sizePx: 40 } }],
    ["an unknown sky colour", { skyLines: { star: "#fff" } }],
    ["an unknown label look", { labels: { weight: 700 } }],
  ])("%s throws bad-look", (_name, look) => {
    expect(code(() => new Scene().setLook(look as never))).toBe("bad-look");
  });
  it("tells colours apart from not-colours", () => {
    for (const ok of ["#fff", "#8fb4ff", "#8fb4ff80", "rgb(1, 2, 3)", "rgba(1,2,3,0.5)", "hsl(120, 50%, 50%)", "Tomato"]) expect(isCssColour(ok)).toBe(true);
    for (const bad of ["", "fff", "#ff", "rgb(1 2 3)", "javascript:1", "red;", 3, undefined]) expect(isCssColour(bad)).toBe(false);
    expect(isFontFamily("inherit")).toBe(true);
    expect(isFontFamily("")).toBe(false);
    expect(isFontFamily("a; b")).toBe(false);
  });
});

describe("a figure's own colours, font and size", () => {
  const withKite = (extra: object) => new Scene().addBody(earth).addSkyFigures([{ ...kite, ...extra } as never]);
  it("reach the drawn figure over the looks", () => {
    const layer = definitionOf(withKite({ color: "#112233", labelColor: "#445566", labelFont: "Georgia", labelSizePx: 18 }).setLook({})).skyFigures![0]!;
    expect(layer).toMatchObject({ color: "#112233", labelColor: "#445566", labelFont: "Georgia", labelSizePx: 18 });
    expect(definitionOf(withKite({})).skyFigures![0]).not.toHaveProperty("color");
  });
  it.each([
    ["color", "nope"], ["labelColor", 7], ["labelFont", ""], ["labelSizePx", 2], ["labelSizePx", "big"],
  ])("a bad %s throws bad-sky-figure", (field, value) => {
    expect(code(() => withKite({ [field]: value }))).toBe("bad-sky-figure");
  });
});

describe("one CSS-variable route to every label", () => {
  let host: HTMLElement;
  beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); });
  afterEach(() => host.remove());
  it("turns a label style into the two variables the stylesheet reads", () => {
    expect(labelStyleVars({ fontFamily: "Georgia", sizePx: 16 })).toEqual({ "--label-font": "Georgia", "--label-size": "16px" });
    expect(labelStyleVars({})).toEqual({});
    expect(labelStyleVars(DEFAULT_LABEL_STYLE)).toEqual({}); // the default look leaves the root bare, so today's look is unchanged
  });
  it("a sky label takes the look's colour live, and a figure's own font, size and colour stay on its label", () => {
    const camera = new PerspectiveCamera(60, 4 / 3, 0.1, 1000);
    camera.lookAt(0, 0, -1);
    const layer = new SceneLabelLayer(host, [], [
      { id: "plain", label: "plain", kind: "figure", direction: [0, 0, -1] },
      { id: "own", label: "own", kind: "figure", direction: [0, 0, -1], color: "#010203", font: "Georgia", sizePx: 20 },
    ]);
    const element = (id: string) => host.querySelector<HTMLElement>(`[data-label-id="${id}"]`)!;
    const frame = (labelColor: string) => layer.update(() => null, camera, 800, 600, new FloatingOrigin(), "", undefined, { on: DEFAULT_SKY_LINES, labelColor, distance: 500 });
    frame("#aa0000");
    expect(element("plain").style.getPropertyValue("--label-color")).toBe("#aa0000");
    frame("#00bb00");
    expect(element("plain").style.getPropertyValue("--label-color")).toBe("#00bb00");
    expect(element("own").style.getPropertyValue("--label-color")).toBe("#010203");
    expect(element("own").style.getPropertyValue("--label-font")).toBe("Georgia");
    expect(element("own").style.getPropertyValue("--label-size")).toBe("20px");
    expect(element("plain").style.getPropertyValue("--label-size")).toBe("");
    layer.dispose();
  });
});
