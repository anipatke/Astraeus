// The bar's one fit rule (viewer-interface note, section 4). Job: given the available width, the gap and every item's measured width per form, decide each item's
// place (row or menu) and form. Pure: no React, no DOM, no timers; the widths are measured elsewhere (`useBarFit.ts`).
import { MENU_ITEM_ID, type BarForm, type BarItem } from "./barItems";

export interface Placement {
  readonly place: "row" | "menu";
  readonly form: BarForm;
}

export interface FitInput {
  /** The row's available width. Zero or less means "not measured yet": nothing is moved. */
  readonly width: number;
  /** The space between row items. */
  readonly gap: number;
  /** A phone keeps every engine item in the menu. */
  readonly phone: boolean;
  readonly items: readonly BarItem[];
  /** Measured widths by item id and form; a missing form uses the item's full width, a missing item 0. */
  readonly widths: Readonly<Record<string, Readonly<Partial<Record<BarForm, number>>>>>;
}

export interface BarFit {
  readonly placements: Readonly<Record<string, Placement>>;
  /** The menu button is on the row: the menu holds at least one item. */
  readonly menuButton: boolean;
  /** The width the row takes, as the rule counts it. */
  readonly total: number;
  readonly fits: boolean;
}

/** Decides the bar. The steps (while the row is wider than `width`, take the next one that applies): short labels; engine items to the menu, lowest priority first; short title; "i"; story buttons to the menu from the end; the switch as a drop-down; then give the title its longer forms back. */
export function fitBar({ width, gap, phone, items, widths }: FitInput): BarFit {
  const place = new Map<string, Placement>(
    items.map((item) => [item.id, { place: item.kind === "engine" && phone ? "menu" : "row", form: "full" }]),
  );
  const get = (item: BarItem): Placement => place.get(item.id)!;
  const set = (item: BarItem, next: Partial<Placement>): void => {
    place.set(item.id, { ...get(item), ...next });
  };
  const widthOf = (item: BarItem): number => widths[item.id]?.[get(item).form] ?? widths[item.id]?.full ?? 0;
  const menuHolds = (): boolean => items.some((item) => item.kind !== "menu" && get(item).place === "menu");
  const inRow = (item: BarItem): boolean => get(item).place === "row" && (item.kind !== "menu" || menuHolds());
  const total = (): number => {
    const row = items.filter(inRow);
    return row.reduce((sum, item) => sum + widthOf(item), 0) + gap * Math.max(0, row.length - 1);
  };
  const has = (item: BarItem, form: BarForm): boolean => item.forms[form] !== undefined;

  const shorten = (): boolean => {
    const wanting = items.filter(
      (item) => (item.kind === "switch" || item.kind === "story") && has(item, "short") && get(item).form === "full",
    );
    wanting.forEach((item) => set(item, { form: "short" }));
    return wanting.length > 0;
  };
  const moveEngine = (): boolean => {
    const rows = items.filter((item) => item.kind === "engine" && get(item).place === "row");
    // Highest priority number leaves first; among equals, the last in the row.
    const next = rows.reduce<BarItem | undefined>(
      (best, item) => (best === undefined || item.priority >= best.priority ? item : best),
      undefined,
    );
    if (next === undefined) return false;
    set(next, { place: "menu" });
    return true;
  };
  const titleTo = (from: BarForm, to: BarForm) => (): boolean => {
    const title = items.find((item) => item.kind === "title" && get(item).form === from && has(item, to));
    if (title === undefined) return false;
    set(title, { form: to });
    return true;
  };
  const moveStory = (): boolean => {
    const rows = items.filter((item) => item.kind === "story" && get(item).place === "row");
    const next = rows.reduce<BarItem | undefined>(
      (best, item) => (best === undefined || item.priority >= best.priority ? item : best),
      undefined,
    );
    if (next === undefined) return false;
    set(next, { place: "menu" });
    return true;
  };
  const compact = (): boolean => {
    const next = items.find((item) => item.kind === "switch" && get(item).form !== "compact");
    if (next === undefined) return false;
    set(next, { form: "compact" });
    return true;
  };
  // A title the story put in "i" goes straight there when it has no short form.
  const titleToI = (): boolean => {
    const title = items.find((item) => item.kind === "title" && get(item).form !== "i");
    if (title === undefined) return false;
    set(title, { form: "i" });
    return true;
  };
  const steps = [shorten, moveEngine, titleTo("full", "short"), titleToI, moveStory, compact];

  if (width > 0) {
    while (total() > width && steps.some((step) => step())) {
      /* each pass takes the first step that applies */
    }
    const title = items.find((item) => item.kind === "title");
    if (title !== undefined && get(title).form !== "full") {
      const order: readonly BarForm[] = ["full", "short"];
      const current = get(title).form;
      for (const form of order.slice(0, current === "i" ? 2 : order.indexOf(current))) {
        if (!has(title, form)) continue;
        set(title, { form });
        if (total() <= width) break;
        set(title, { form: current });
      }
    }
  }

  const menuButton = menuHolds();
  const placements: Record<string, Placement> = {};
  for (const item of items)
    placements[item.id] = item.id === MENU_ITEM_ID && !menuButton ? { place: "menu", form: "full" } : get(item);
  const used = total();
  return { placements, menuButton, total: used, fits: width <= 0 || used <= width };
}
