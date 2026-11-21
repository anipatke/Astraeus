// Part: the chart's view, drawn inside a panel as one SVG: bars on a shared x scale, a y scale from the largest count, labelled mark lines, the axis label and its ends. It must not set a place,
// layer or raw colour or size (a bin's colour is the story's, passed as a custom property), take a tap, or open another part.
import { useSyncExternalStore, type CSSProperties } from "react";
import type { ShelfBlock, ShelfRuntime } from "../../app/shelfContract";
import type { ChartData, ChartState } from "./factory";
import { extentOf } from "./factory";
import { useCell } from "../useCell";

const WIDTH = 320,
  HEIGHT = 156,
  LEFT = 8,
  RIGHT = 312,
  TOP = 22,
  BASE = 118;
const count = (value: number): string => value.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** The short text a screen reader gets in place of the bars. */
export function chartSummary(axisLabel: string, state: ChartState): string {
  const extent = extentOf(state.bins);
  const largest = state.bins.reduce((best, bin) => (bin.count > best.count ? bin : best));
  const lit =
    state.highlight === undefined
      ? undefined
      : state.bins.filter((bin) => bin.high > state.highlight!.low && bin.low < state.highlight!.high).length;
  return (
    `Bar chart of ${axisLabel}: ${state.bins.length} bars from ${count(extent.low)} to ${count(extent.high)}; the largest, ${count(largest.low)} to ${count(largest.high)}, holds ${count(largest.count)}` +
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
  return (
    <div className="shelf-chart" data-shelf-block={block.id}>
      <svg
        className="shelf-chart-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={chartSummary(axisLabel, state)}
      >
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
        {marks
          .filter((mark) => mark.value >= extent.low && mark.value <= extent.high)
          .map((mark, index) => (
            <g key={index} className="shelf-chart-mark" data-shelf-mark={index}>
              <line x1={x(mark.value)} x2={x(mark.value)} y1={TOP - 4} y2={BASE} />
              <text x={x(mark.value)} y={TOP - 8} textAnchor={x(mark.value) > WIDTH / 2 ? "end" : "start"}>
                {mark.label}
              </text>
            </g>
          ))}
        <text className="shelf-chart-tick" x={LEFT} y={BASE + 13} textAnchor="start">
          {count(extent.low)}
        </text>
        <text className="shelf-chart-tick" x={RIGHT} y={BASE + 13} textAnchor="end">
          {count(extent.high)}
        </text>
        <text className="shelf-chart-label" x={WIDTH / 2} y={HEIGHT - 6} textAnchor="middle">
          {axisLabel}
        </text>
      </svg>
    </div>
  );
}
