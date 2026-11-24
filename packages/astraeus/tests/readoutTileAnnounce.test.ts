// @vitest-environment happy-dom
// O-098 T-453: the readout tile speaks its shown value. The tile's one polite status is empty when drawn, hears the label and value at most once every 2 s (trailing, ending on the latest value) and is drawn once, outside the strip button and the sheet.
// The line's own text carries the value as the app words it and every mark. Made-up parts on the pretend page (ARCH-03); the cell stands in for the viewer's, as the control writes it.
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readoutTile } from "astraeus";
import { makeCell, type ShelfCell, type ShelfRuntime } from "../src/app/shelfContract";
import { partOf } from "../src/shelf/part";
import type { ReadoutTileState } from "../src/shelf/readoutTile/factory";
import { $, mountShell, press, type Mounted } from "./domSetup";

const scale = { low: 1, high: 100, value: 10, stretch: "log", marks: [{ value: 50, label: "Half" }] } as const;
const tile = partOf(readoutTile({ id: "gap", label: "Gap", value: "4 units", scale } as never));

describe("the readout tile's polite status", () => {
  let m: Mounted;
  let cells: Map<string, ShelfCell>;
  const runtime: ShelfRuntime = {
    element: () => undefined,
    cell: (block) => {
      if (!cells.has(block.id)) cells.set(block.id, makeCell(block.initial));
      return cells.get(block.id)!;
    },
  };
  const setValue = (value: string) =>
    act(() => {
      const cell = cells.get("gap")!;
      cell.set({ ...(cell.get() as ReadoutTileState), value });
    });
  const status = () => m.container.querySelectorAll<HTMLElement>('[role="status"]');
  const said = () => $(m.container, '[role="status"]').textContent;
  const mount = (phone = false) => {
    m = mountShell({ phone, shelfParts: [tile], shelfRuntime: runtime });
  };
  beforeEach(() => {
    vi.useFakeTimers();
    cells = new Map();
  });
  afterEach(() => {
    m.unmount();
    vi.useRealTimers();
  });

  it("first draw: the status element exists and is empty", () => {
    mount();
    expect(status()).toHaveLength(1);
    expect(said()).toBe("");
    vi.advanceTimersByTime(5000);
    expect(said()).toBe("");
  });

  it("one change is silent until 2,000 ms, then said once", () => {
    mount();
    setValue("5 units");
    vi.advanceTimersByTime(1999);
    expect(said()).toBe("");
    vi.advanceTimersByTime(1);
    expect(said()).toBe("Gap: 5 units");
  });

  it("ten changes within 2 s make one update with the last value; a further change updates again 2 s later", () => {
    mount();
    for (let i = 1; i <= 10; i++) {
      setValue(`${i} units`);
      vi.advanceTimersByTime(150);
    }
    expect(said()).toBe("");
    vi.advanceTimersByTime(500);
    expect(said()).toBe("Gap: 10 units");
    setValue("11 units");
    vi.advanceTimersByTime(1999);
    expect(said()).toBe("Gap: 10 units");
    vi.advanceTimersByTime(1);
    expect(said()).toBe("Gap: 11 units");
  });

  it("the same text, the dot alone and the facts say nothing", () => {
    mount();
    setValue("4 units");
    act(() => {
      const cell = cells.get("gap")!;
      cell.set({ ...(cell.get() as ReadoutTileState), scaleValue: 20 });
      cell.set({ ...(cell.get() as ReadoutTileState), facts: [{ label: "Speed", value: "7" }] });
    });
    vi.advanceTimersByTime(5000);
    expect(said()).toBe("");
  });

  it("a change that returns to the spoken text within the window says nothing", () => {
    mount();
    setValue("5 units");
    setValue("4 units");
    vi.advanceTimersByTime(2000);
    expect(said()).toBe("");
  });

  it("phone with the sheet open: one status element, outside the strip button and the sheet", () => {
    mount(true);
    press($(m.container, "button.tile-strip-button"));
    expect(m.container.querySelector("[data-tile-sheet]")).not.toBeNull();
    expect(status()).toHaveLength(1);
    expect(status()[0]!.closest("button.tile-strip-button")).toBeNull();
    expect(status()[0]!.closest("[data-tile-sheet]")).toBeNull();
    setValue("6 units");
    vi.advanceTimersByTime(2000);
    expect(said()).toBe("Gap: 6 units");
  });

  it("unmount with a change pending: no update and no timer left", () => {
    mount();
    setValue("5 units");
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    m.unmount();
    expect(vi.getTimerCount()).toBe(0);
    m = mountShell({ shelfParts: [], shelfRuntime: runtime });
  });

  it("the line's aria-label carries the value text and every mark", () => {
    mount();
    expect($(m.container, '[role="img"]').getAttribute("aria-label")).toBe(
      "Gap: 4 units, on a log scale from 1 to 100; marks: Half at 50",
    );
    setValue("5 units");
    expect($(m.container, '[role="img"]').getAttribute("aria-label")).toContain("Gap: 5 units, on a log scale");
  });

  it("two viewers: a change in one viewer updates only its status element", () => {
    const first = new Map<string, ShelfCell>();
    const second = new Map<string, ShelfCell>();
    const run = (store: Map<string, ShelfCell>): ShelfRuntime => ({
      element: () => undefined,
      cell: (block) => {
        if (!store.has(block.id)) store.set(block.id, makeCell(block.initial));
        return store.get(block.id)!;
      },
    });
    m = mountShell({ shelfParts: [tile], shelfRuntime: run(first) });
    const other = mountShell({ shelfParts: [tile], shelfRuntime: run(second) });
    act(() => {
      const cell = first.get("gap")!;
      cell.set({ ...(cell.get() as ReadoutTileState), value: "8 units" });
    });
    vi.advanceTimersByTime(2000);
    expect(m.container.querySelector('[role="status"]')!.textContent).toBe("Gap: 8 units");
    expect(other.container.querySelector('[role="status"]')!.textContent).toBe("");
    other.unmount();
  });
});
