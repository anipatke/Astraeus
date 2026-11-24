// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { chartSummary, ChartView } from "../src/shelf/chart/View";
import { chart, type ChartState } from "../src/shelf/chart/factory";
import { makeCell } from "../src/app/shelfContract";
import { blockOf } from "../src/shelf/part";

const KIRKWOOD = [
  { value: 2.82, label: "5:2" },
  { value: 3.28, label: "2:1" },
  { value: 2.5, label: "3:1" },
  { value: 2.96, label: "7:3" },
];
const CLAUSE = "marks: 3:1 at 2.5, 5:2 at 2.82, 7:3 at 2.96, 2:1 at 3.28";
const state = (extra: Partial<ChartState> = {}): ChartState => ({ bins: [{ low: 2, high: 3.5, count: 4 }], ...extra });

describe("chartSummary names its marks (O-098 T-454)", () => {
  it("lists the Kirkwood marks in value order", () => {
    expect(chartSummary("Axis", state(), KIRKWOOD)).toContain(CLAUSE);
  });
  it("adds no clause when no mark is drawn", () => {
    expect(chartSummary("Axis", state(), [])).not.toContain("marks:");
  });
  it("leaves out a mark outside the current bins", () => {
    const text = chartSummary("Axis", state(), [...KIRKWOOD, { value: 9, label: "Far" }]);
    expect(text).toContain(CLAUSE);
    expect(text).not.toContain("Far");
  });
  it("puts the marks before the highlight clause", () => {
    const text = chartSummary("Axis", state({ highlight: { low: 2, high: 3 } }), KIRKWOOD);
    expect(text.indexOf("marks:")).toBeGreaterThan(-1);
    expect(text.indexOf("marks:")).toBeLessThan(text.indexOf("is highlighted"));
  });
});

describe("ChartView aria-label (O-098 T-454)", () => {
  it("shows the clause and loses a mark the new bins no longer cover", () => {
    const block = blockOf(
      chart({ id: "k", axisLabel: "Axis", bins: [{ low: 2, high: 3.5, count: 4 }], marks: KIRKWOOD }),
    );
    const cell = makeCell(block.initial);
    const host = document.createElement("div");
    document.body.append(host);
    flushSync(() =>
      createRoot(host).render(
        createElement(ChartView, { block, runtime: { element: () => undefined, cell: () => cell } }),
      ),
    );
    const label = () => host.querySelector("svg")!.getAttribute("aria-label")!;
    expect(label()).toContain(CLAUSE);
    flushSync(() => cell.set({ bins: [{ low: 2, high: 3, count: 4 }] }));
    expect(label()).toContain("marks: 3:1 at 2.5, 5:2 at 2.82, 7:3 at 2.96");
    expect(label()).not.toContain("2:1");
  });
});
