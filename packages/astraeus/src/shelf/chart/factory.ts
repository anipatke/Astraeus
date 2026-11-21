// The chart part: a bar chart of counts the app gives, with an axis label, optional labelled marks and an optional highlighted range. Job: check its input and build the descriptor that carries
// its view and its control. It must not know what the counts mean (the story's words say that), fetch data or hear a tap: the bars take none.
import type { ShelfBlock } from "../../app/shelfContract";
import { badPart, checkedColour, checkedId, checkedInput, checkedItems, checkedText, registered, type BlockPart } from "../part";
import { ChartView } from "./View";

/** One bar: the counted range `low` up to `high`, and how many fell in it. */
export interface ChartBin {
  readonly low: number;
  readonly high: number;
  /** How many (0 or more). */
  readonly count: number;
  /** The bar's own CSS colour; the shared accent when absent. */
  readonly color?: string;
}

/** A labelled line at the `value` on the chart's axis. */
export interface ChartMark {
  readonly value: number;
  readonly label: string;
}

/** A range of the axis; bars wholly outside it are dimmed. */
export interface ChartRange {
  readonly low: number;
  readonly high: number;
}

/** What `chart` takes. */
export interface ChartInput {
  /** Unique among part and block ids in the scene. */
  readonly id: string;
  /** The bars, left to right; at least one. */
  readonly bins: readonly ChartBin[];
  /** What the axis measures, with its unit (for example "Semi-major axis (AU)"). */
  readonly axisLabel: string;
  /** Labelled lines on the axis; a mark outside the bins' range is not drawn. */
  readonly marks?: readonly ChartMark[];
  /** Starts with bars outside this range dimmed; it must lie within the bins' range. */
  readonly highlight?: ChartRange;
}

/** What `handle.part(chart)` gives for one viewer. */
export interface ChartControl {
  /** Replaces the bars, silently. A highlight the new bins' range no longer holds is dropped. */
  setBins(bins: readonly ChartBin[]): void;
  /** Dims the bars outside `range`, or shows them all when `undefined`; silently. The range must lie within the bins' range. */
  setHighlight(range: ChartRange | undefined): void;
}

/** What one viewer's chart shows and changes. */
export interface ChartState { readonly bins: readonly ChartBin[]; readonly highlight?: ChartRange }

/** What the chart was given that never changes. */
export interface ChartData { readonly axisLabel: string; readonly marks: readonly ChartMark[] }

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const binsOf = (value: unknown, who: string): readonly ChartBin[] => checkedItems(value, who, "bins", "{ low, high, count, color? } objects", (record, at) => {
  const { low, high, count } = record;
  if (!finite(low) || !finite(high)) throw badPart(who, `${at}.low and ${at}.high must be finite numbers`);
  if (low >= high) throw badPart(who, `${at}.low must be less than ${at}.high`);
  if (!finite(count) || count < 0) throw badPart(who, `${at}.count must be a number of 0 or more`);
  return Object.freeze({ low, high, count, ...(record.color === undefined ? {} : { color: checkedColour(record.color, who, `${at}.color`) }) });
});

const marksOf = (value: unknown, who: string): readonly ChartMark[] => value === undefined ? Object.freeze([]) : checkedItems(value, who, "marks", "{ value, label } objects", (record, at) => {
  if (!finite(record.value)) throw badPart(who, `${at}.value must be a finite number`);
  return Object.freeze({ value: record.value, label: checkedText(record.label, who, `${at}.label`) });
}, true);

/** The range of the axis the bins cover. */
export const extentOf = (bins: readonly ChartBin[]): ChartRange => ({ low: Math.min(...bins.map((bin) => bin.low)), high: Math.max(...bins.map((bin) => bin.high)) });

/** True when `range` lies within what `bins` cover. */
const fits = (range: ChartRange, bins: readonly ChartBin[]): boolean => { const extent = extentOf(bins); return range.low >= extent.low && range.high <= extent.high; };

const rangeOf = (value: unknown, who: string, bins: readonly ChartBin[]): ChartRange => {
  const record = value as { low?: unknown; high?: unknown } | null;
  if (typeof record !== "object" || record === null || Array.isArray(record) || !finite(record.low) || !finite(record.high)) throw badPart(who, "highlight must be a { low, high } object of finite numbers");
  if (record.low >= record.high) throw badPart(who, "highlight.low must be less than highlight.high");
  if (!fits({ low: record.low, high: record.high }, bins)) throw badPart(who, "highlight must lie within the bins' range");
  return Object.freeze({ low: record.low, high: record.high });
};

/**
 * A bar chart of counts the app gives: bars from `bins`, an axis label, optional labelled marks and an optional highlighted range; `handle.part(block)` gives `setBins` and `setHighlight`, both silent.
 * Drawn as SVG from the shared look; the bars take no taps.
 * @shelf
 * @example
 * chart({ id: "sizes", axisLabel: "Diameter (km)", bins: [{ low: 0, high: 10, count: 40 }, { low: 10, high: 20, count: 12 }], marks: [{ value: 10, label: "Limit" }] })
 */
export function chart(input: ChartInput): BlockPart<"chart"> {
  const who = "chart";
  const fields = checkedInput(input, who, "an { id, bins, axisLabel } object");
  const bins = binsOf(fields.bins, who);
  const state: ChartState = Object.freeze({ bins, ...(fields.highlight === undefined ? {} : { highlight: rangeOf(fields.highlight, who, bins) }) });
  const block: ShelfBlock = {
    kind: "chart", id: checkedId(fields, who), view: ChartView,
    data: Object.freeze({ axisLabel: checkedText(fields.axisLabel, who, "axisLabel"), marks: marksOf(fields.marks, who) } satisfies ChartData),
    initial: state,
    control: (link) => ({
      setBins: (next: readonly ChartBin[]) => {
        const nextBins = binsOf(next, "ChartControl.setBins");
        const cell = link.cell("ChartControl.setBins");
        const kept = (cell.get() as ChartState).highlight;
        cell.set(Object.freeze({ bins: nextBins, ...(kept !== undefined && fits(kept, nextBins) ? { highlight: kept } : {}) }) satisfies ChartState);
      },
      setHighlight: (range: ChartRange | undefined) => {
        const cell = link.cell("ChartControl.setHighlight");
        const current = cell.get() as ChartState;
        const highlight = range === undefined ? undefined : rangeOf(range, "ChartControl.setHighlight", current.bins);
        cell.set(Object.freeze({ bins: current.bins, ...(highlight === undefined ? {} : { highlight }) }) satisfies ChartState);
      },
    } satisfies ChartControl),
  };
  return registered(block) as unknown as BlockPart<"chart">;
}
