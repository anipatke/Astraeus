// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { placeMarkRows } from "../src/shelf/chart/markRows";
import { ChartView } from "../src/shelf/chart/View";
import { chart } from "../src/shelf/chart/factory";
import { blockOf } from "../src/shelf/part";

const LONG = "A forty-four character mark label for a test";
type Proto = { getComputedTextLength?: () => number; getBBox?: () => { height: number } };
const proto = SVGTextElement.prototype as unknown as Proto;
const saved = { len: proto.getComputedTextLength, box: proto.getBBox };
afterEach(() => {
  proto.getComputedTextLength = saved.len;
  if (saved.box) proto.getBBox = saved.box;
  else delete proto.getBBox;
});

const bins = Array.from({ length: 40 }, (_, i) => ({ low: 2 + i * 0.05, high: 2.05 + i * 0.05, count: 1 + (i % 7) }));
const block = chart({
  id: "b34",
  axisLabel: "Semi-major axis (au)",
  bins,
  marks: [
    { value: 2.5, label: "3:1" },
    { value: 2.52, label: "8:3" },
    { value: 2.54, label: "11:4" },
    { value: 2.82, label: LONG },
  ],
});
function draw(style?: string): { host: HTMLElement; svg: SVGSVGElement } {
  const host = document.createElement("div");
  if (style) host.setAttribute("style", style);
  document.body.append(host);
  flushSync(() =>
    createRoot(host).render(createElement(ChartView, { block: blockOf(block), runtime: { element: () => undefined } })),
  );
  return { host, svg: host.querySelector("svg") as SVGSVGElement };
}
const tops = (svg: SVGSVGElement): number[] =>
  [...svg.querySelectorAll(".shelf-chart-mark text")].map((t) => Number(t.getAttribute("y")));

describe("chart labels settle in one pass (O-100 T-455)", () => {
  it("draws the belt's chart when the label width depends on the chart's height", () => {
    expect(LONG.length).toBe(44);
    proto.getBBox = () => ({ height: 14 });
    proto.getComputedTextLength = function (this: SVGTextElement) {
      const text = this.textContent ?? "";
      if (text !== LONG) return text.length * 6;
      const h = Number((this.closest("svg")?.getAttribute("viewBox") ?? "0 0 320 156").split(" ")[3]);
      return h > 156 + 2 * 14 ? 205 : 225;
    };
    const { svg } = draw();
    expect(document.body.contains(svg)).toBe(true);
    const first = svg.getAttribute("viewBox");
    expect(svg.getAttribute("viewBox")).toBe(first);
  });
  it("places the long label in the row the pure layout gives for the measured widths", () => {
    proto.getBBox = () => ({ height: 14 });
    proto.getComputedTextLength = function (this: SVGTextElement) {
      return (this.textContent ?? "").length * 5;
    };
    const { svg } = draw();
    const x = (v: number): number => 8 + ((v - 2) / 2) * 304;
    const placed = placeMarkRows(
      [2.5, 2.52, 2.54, 2.82].map((v, i) => ({ x: x(v), width: [3, 3, 4, 44][i] * 5 })),
      320,
    );
    const rows = placed.map((p) => p.row);
    const ys = tops(svg);
    const extra = Math.max(...rows) * 14;
    expect(ys).toEqual(rows.map((r) => 22 - 8 + extra - r * 14));
    expect(svg.getAttribute("viewBox")).toBe(`0 0 320 ${136 + extra}`);
  });
  it("measures again once for a font-size change and not for a repeat render", () => {
    let calls = 0;
    proto.getBBox = () => ({ height: 14 });
    proto.getComputedTextLength = function (this: SVGTextElement) {
      calls++;
      const size = parseFloat(getComputedStyle(this).fontSize) || 11;
      return (this.textContent ?? "").length * (size / 2);
    };
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const render = (): void =>
      flushSync(() =>
        root.render(createElement(ChartView, { block: blockOf(block), runtime: { element: () => undefined } })),
      );
    host.setAttribute("style", "font-size: 11px");
    render();
    const base = calls;
    const placedAt = (): string[] =>
      [...host.querySelectorAll(".shelf-chart-mark text")].map((t) => `${t.getAttribute("x")},${t.getAttribute("y")}`);
    const before = placedAt();
    render();
    expect(calls).toBe(base);
    host.setAttribute("style", "font-size: 22px");
    render();
    expect(calls).toBeGreaterThan(base);
    const after = calls;
    expect(placedAt()).not.toEqual(before);
    render();
    expect(calls).toBe(after);
  });
});
