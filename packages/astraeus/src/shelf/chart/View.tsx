// Part: the chart's view, drawn inside a panel as one SVG: bars on a shared x scale, a y scale from the largest count, labelled mark lines and its ends, with the axis label as a wrapping caption under it. It must not set a place,
// layer or raw colour or size (a bin's colour is the story's, passed as a custom property), take a tap, or open another part.
import { useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import type { ShelfBlock, ShelfRuntime } from "../../app/shelfContract";
import type { ChartData, ChartState } from "./factory";
import { extentOf } from "./factory";
import { useCell } from "../useCell";
import { placeMarkRows } from "./markRows";

const WIDTH = 320,
  HEIGHT = 136,
  LEFT = 8,
  RIGHT = 312,
  TOP = 22,
  BASE = 118;
/** The row pitch when no label height is measured (the default 11-unit label font); measured, the pitch is the tallest label box, so rows follow the host's text size. */
const ROW = 12,
  CHAR = 6;
const count = (value: number): string => value.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** The marks the chart draws: those inside the current bins' extent. One definition for the drawing and the summary. */
export function drawnMarks(marks: ChartData["marks"], bins: ChartState["bins"]): ChartData["marks"] {
  const extent = extentOf(bins);
  return marks.filter((mark) => mark.value >= extent.low && mark.value <= extent.high);
}

/** The short text a screen reader gets in place of the bars; it names the marks drawn, in order of value. */
export function chartSummary(axisLabel: string, state: ChartState, marks: ChartData["marks"]): string {
  const extent = extentOf(state.bins);
  const named = [...drawnMarks(marks, state.bins)].sort((a, b) => a.value - b.value);
  const largest = state.bins.reduce((best, bin) => (bin.count > best.count ? bin : best));
  const lit =
    state.highlight === undefined
      ? undefined
      : state.bins.filter((bin) => bin.high > state.highlight!.low && bin.low < state.highlight!.high).length;
  return (
    `Bar chart of ${axisLabel}: ${state.bins.length} bars from ${count(extent.low)} to ${count(extent.high)}; the largest, ${count(largest.low)} to ${count(largest.high)}, holds ${count(largest.count)}` +
    (named.length === 0 ? "" : `; marks: ${named.map((mark) => `${mark.label} at ${count(mark.value)}`).join(", ")}`) +
    (state.highlight === undefined
      ? "."
      : `; ${count(state.highlight.low)} to ${count(state.highlight.high)} is highlighted (${lit} bars).`)
  );
}

/** The block's bars, read live from this viewer's cell. */
export function ChartView({ block, runtime }: { readonly block: ShelfBlock; readonly runtime: ShelfRuntime }) {
  const cell = useCell(runtime, block);
  const state = useSyncExternalStore(cell.subscribe, cell.get) as ChartState;
  const { axisLabel, marks } = block.data as ChartData;
  const extent = extentOf(state.bins);
  const top = Math.max(...state.bins.map((bin) => bin.count));
  const x = (value: number): number => LEFT + ((value - extent.low) / (extent.high - extent.low)) * (RIGHT - LEFT);
  const height = (value: number): number => (top === 0 ? 0 : (value / top) * (BASE - TOP));
  const dim = (bin: ChartState["bins"][number]): boolean =>
    state.highlight !== undefined && (bin.high <= state.highlight.low || bin.low >= state.highlight.high);
  const shown = drawnMarks(marks, state.bins);
  const key = shown.map((mark) => mark.label).join("\u0000");
  const texts = useRef<(SVGTextElement | null)[]>([]);
  const [measured, setMeasured] = useState<{ key: string; widths: number[]; height: number }>({
    key: "",
    widths: [],
    height: 0,
  });
  // The measure key is what can change a label's size: the label texts and the label's computed font. A key is measured once; what the chart's own drawing does afterwards (rows, height, a scrollbar) never feeds back, and a measure that disagrees for a key already taken is ignored.
  const taken = useRef("");
  // After every draw on purpose: the host's text size can change with no change of props; the key check makes the pass a no-op unless the text or font changed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const first = texts.current[0];
    const style = first && typeof getComputedStyle === "function" ? getComputedStyle(first) : undefined;
    const fullKey = `${key}\u0001${style?.fontSize ?? ""}\u0001${style?.fontFamily ?? ""}`;
    if (taken.current === fullKey) return;
    taken.current = fullKey;
    const widths = shown.map((_, index) => {
      const text = texts.current[index];
      const width = text && typeof text.getComputedTextLength === "function" ? text.getComputedTextLength() : 0;
      return width > 0 ? width : 0;
    });
    const height = Math.max(
      0,
      ...shown.map((_, index) => {
        const text = texts.current[index];
        const box = text && typeof text.getBBox === "function" ? text.getBBox().height : 0;
        return box > 0 ? box : 0;
      }),
    );
    setMeasured({ key, widths, height });
  });
  const widths = shown.map((mark, index) =>
    measured.key === key && measured.widths[index] > 0 ? measured.widths[index] : mark.label.length * CHAR,
  );
  const placed = placeMarkRows(
    shown.map((mark, index) => ({ x: x(mark.value), width: widths[index] })),
    WIDTH,
  );
  const row = measured.key === key && measured.height > 0 ? measured.height : ROW;
  const extra = Math.max(0, ...placed.map((p) => p.row)) * row;
  const plot = extra > 0 ? `translate(0 ${extra})` : undefined;
  return (
    <div className="shelf-chart" data-shelf-block={block.id}>
      <svg
        className="shelf-chart-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT + extra}`}
        role="img"
        aria-label={chartSummary(axisLabel, state, marks)}
      >
        <g transform={plot}>
          {state.bins.map((bin, index) => (
            <rect
              key={index}
              className={dim(bin) ? "shelf-chart-bar is-dim" : "shelf-chart-bar"}
              data-shelf-bar={index}
              style={bin.color === undefined ? undefined : ({ "--shelf-colour": bin.color } as CSSProperties)}
              x={x(bin.low)}
              y={BASE - height(bin.count)}
              width={Math.max(x(bin.high) - x(bin.low) - 1, 0.5)}
              height={height(bin.count)}
            />
          ))}
          <line className="shelf-chart-axis" x1={LEFT} x2={RIGHT} y1={BASE} y2={BASE} />
          <text className="shelf-chart-tick" x={LEFT} y={BASE + 13} textAnchor="start">
            {count(extent.low)}
          </text>
          <text className="shelf-chart-tick" x={RIGHT} y={BASE + 13} textAnchor="end">
            {count(extent.high)}
          </text>
        </g>
        {shown.map((mark, index) => {
          const labelY = TOP - 8 + extra - placed[index].row * row;
          return (
            <g key={index} className="shelf-chart-mark" data-shelf-mark={index}>
              <line x1={x(mark.value)} x2={x(mark.value)} y1={labelY + 4} y2={BASE + extra} />
              <text
                ref={(node) => {
                  texts.current[index] = node;
                }}
                x={x(mark.value) > WIDTH / 2 ? placed[index].right : placed[index].left}
                y={labelY}
                textAnchor={x(mark.value) > WIDTH / 2 ? "end" : "start"}
              >
                {mark.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="shelf-chart-label" aria-hidden="true">
        {axisLabel}
      </div>
    </div>
  );
}
