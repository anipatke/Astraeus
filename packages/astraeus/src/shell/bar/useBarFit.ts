// Measures the bar for the fit rule. Job: read the row's available width and gap and every item's width per form from a hidden measuring row, re-read when the
// viewer, a font or a label changes (a ResizeObserver), and hand the numbers to the pure `fitBar`. It decides nothing itself.
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { BarForm, BarItem } from "./barItems";
import { fitBar, type BarFit } from "./fitBar";

interface Measured {
  readonly width: number;
  readonly gap: number;
  readonly widths: Readonly<Record<string, Readonly<Partial<Record<BarForm, number>>>>>;
}

const NOTHING: Measured = { width: 0, gap: 0, widths: {} };
const px = (value: string): number => {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

/** The measuring row's ghosts (`data-ghost-id`, `data-ghost-form`), the row's content width and its gap, as numbers. Widths round up so a fit never overflows by a fraction. */
function measureBar(row: HTMLElement | null, ghosts: HTMLElement | null): Measured {
  if (row === null || ghosts === null) return NOTHING;
  const style = getComputedStyle(row);
  const widths: Record<string, Partial<Record<BarForm, number>>> = {};
  for (const element of ghosts.querySelectorAll<HTMLElement>("[data-ghost-id]")) {
    const id = element.dataset.ghostId!;
    (widths[id] ??= {})[element.dataset.ghostForm as BarForm] = Math.ceil(element.getBoundingClientRect().width);
  }
  return {
    width: Math.floor(
      row.getBoundingClientRect().width -
        px(style.paddingLeft) -
        px(style.paddingRight) -
        px(style.borderLeftWidth) -
        px(style.borderRightWidth),
    ),
    gap: px(style.columnGap),
    widths,
  };
}

export interface BarFitting {
  readonly fit: BarFit;
  readonly rowRef: RefObject<HTMLDivElement | null>;
  readonly ghostsRef: RefObject<HTMLDivElement | null>;
}

/** The fit for these items. Before anything is measured (first paint, a page with no layout) the width is 0 and the rule moves nothing. */
export function useBarFit(items: readonly BarItem[], phone: boolean): BarFitting {
  const rowRef = useRef<HTMLDivElement>(null);
  const ghostsRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<Measured>(NOTHING);
  const signature = JSON.stringify(items.map((item) => [item.id, item.forms]));
  useLayoutEffect(() => {
    const read = () => {
      const next = measureBar(rowRef.current, ghostsRef.current);
      setMeasured((was) => (JSON.stringify(was) === JSON.stringify(next) ? was : next));
    };
    read();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(read);
    if (rowRef.current !== null) observer?.observe(rowRef.current);
    // Every ghost is watched: a font or label change resizes it, not the (zero-height) row that holds them.
    ghostsRef.current?.querySelectorAll("[data-ghost-id]").forEach((ghost) => observer?.observe(ghost));
    return () => observer?.disconnect();
  }, [signature, phone]);
  return { fit: fitBar({ ...measured, phone, items }), rowRef, ghostsRef };
}
