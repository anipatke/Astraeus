// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { placeMarkRows } from "../src/shelf/chart/markRows";
import { ChartView } from "../src/shelf/chart/View";
import { chart } from "../src/shelf/chart/factory";
import { blockOf } from "../src/shelf/part";

const W = 320;
const x = (v: number): number => 8 + ((v - 2) / 1.5) * 304;
const KIRKWOOD = [2.5, 2.82, 2.96, 3.28].map((v) => ({ x: x(v), width: 34 }));

describe("placeMarkRows (O-097 T-450)", () => {
  it("never overlaps two boxes in a row and keeps every box inside the chart for the Kirkwood marks", () => {
    const placed = placeMarkRows(KIRKWOOD, W);
    expect(Math.max(...placed.map((p) => p.row))).toBeGreaterThan(0);
    placed.forEach((a, i) =>
      placed.forEach((b, j) => {
        if (i < j && a.row === b.row) expect(a.right <= b.left || b.right <= a.left).toBe(true);
      }),
    );
    for (const p of placed) {
      expect(p.left).toBeGreaterThanOrEqual(0);
      expect(p.right).toBeLessThanOrEqual(W);
    }
  });
  it("keeps far-apart marks in row 0 and a single mark in row 0", () => {
    expect(
      placeMarkRows(
        [
          { x: 20, width: 30 },
          { x: 160, width: 30 },
          { x: 300, width: 30 },
        ],
        W,
      ).map((p) => p.row),
    ).toEqual([0, 0, 0]);
    expect(placeMarkRows([{ x: 100, width: 30 }], W)[0].row).toBe(0);
  });
  it("moves a label at either edge inside", () => {
    const [left, right] = placeMarkRows(
      [
        { x: 0, width: 30 },
        { x: 320, width: 30 },
      ],
      W,
    );
    expect(left.left).toBe(0);
    expect(right.right).toBe(320);
    const [edgeRight] = placeMarkRows([{ x: 310, width: 40 }], 300);
    expect(edgeRight.right).toBeLessThanOrEqual(300);
  });
});

function render(marks: { value: number; label: string }[]): SVGSVGElement {
  const host = document.createElement("div");
  document.body.append(host);
  // happy-dom draws nothing: give every label the width a narrow panel would (the 320-unit chart scaled down).
  (SVGTextElement.prototype as unknown as { getComputedTextLength: () => number }).getComputedTextLength = () => 34;
  const block = chart({ id: "k", axisLabel: "Axis", bins: [{ low: 2, high: 3.5, count: 4 }], marks });
  flushSync(() =>
    createRoot(host).render(createElement(ChartView, { block: blockOf(block), runtime: { element: () => undefined } })),
  );
  return host.querySelector("svg") as SVGSVGElement;
}

describe("ChartView mark rows (O-097 T-450)", () => {
  it("puts clustered labels on different y and grows the viewBox", () => {
    const svg = render([2.5, 2.82, 2.96, 3.28].map((value, i) => ({ value, label: ["3:1", "5:2", "7:3", "2:1"][i] })));
    const ys = [...svg.querySelectorAll(".shelf-chart-mark text")].map((t) => t.getAttribute("y"));
    expect(new Set(ys).size).toBeGreaterThan(1);
    const [, , , height] = svg.getAttribute("viewBox")!.split(" ").map(Number);
    expect(height).toBeGreaterThan(156);
  });
  it("keeps a one-mark chart at 0 0 320 156", () => {
    const svg = render([{ value: 3, label: "Limit" }]);
    expect(svg.getAttribute("viewBox")).toBe("0 0 320 156");
    expect(svg.querySelector(".shelf-chart-mark text")!.getAttribute("y")).toBe("14");
  });
});
