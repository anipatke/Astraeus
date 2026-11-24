// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { ChartView } from "../src/shelf/chart/View";
import { chart } from "../src/shelf/chart/factory";
import { blockOf } from "../src/shelf/part";

const LONG = "Size of the body in an invented unit that is long enough to need several lines in a narrow panel";

function render(axisLabel: string): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  const block = chart({ id: "a", axisLabel, bins: [{ low: 2, high: 3.5, count: 4 }] });
  flushSync(() =>
    createRoot(host).render(createElement(ChartView, { block: blockOf(block), runtime: { element: () => undefined } })),
  );
  return host;
}

describe("ChartView axis label caption (O-100 T-457)", () => {
  it("draws the axis label as an HTML caption outside the SVG, hidden from readers, and keeps it in the summary", () => {
    const host = render(LONG);
    const caption = host.querySelector(".shelf-chart > .shelf-chart-label") as HTMLElement;
    expect(caption.tagName).toBe("DIV");
    expect(caption.textContent).toBe(LONG);
    expect(caption.getAttribute("aria-hidden")).toBe("true");
    expect(host.querySelector("svg .shelf-chart-label")).toBeNull();
    expect(host.querySelector("svg")!.getAttribute("aria-label")).toContain(LONG);
  });
  it("shortens a one-row chart to the height under the end ticks", () => {
    expect(render("Axis").querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 320 136");
  });
});
