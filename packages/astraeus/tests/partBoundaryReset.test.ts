// @vitest-environment happy-dom
// O-100 I-208 (T-456 Done When, TEST-02): a part's boundary resets when its part is drawn again. After one view's readout tile fails, a view switch to another view's working tile draws that tile
// (card on a wide viewer, strip on a phone), and switching back fails afresh with one further report; a panel whose block failed, closed and reopened, draws the block's boundary afresh.
// The failing views are the real readout tile and colour key views made to throw for one block id each, as in partBoundary.test.ts.
import { vi } from "vitest";

vi.mock("../src/shelf/colourKey/View", async () => {
  const actual = await vi.importActual<typeof import("../src/shelf/colourKey/View")>("../src/shelf/colourKey/View");
  return {
    ColourKeyView: (props: Parameters<typeof actual.ColourKeyView>[0]) => {
      if (props.block.id === "broken") throw new Error("key view failed");
      return actual.ColourKeyView(props);
    },
  };
});
vi.mock("../src/shelf/readoutTile/View", async () => {
  const actual = await vi.importActual<typeof import("../src/shelf/readoutTile/View")>("../src/shelf/readoutTile/View");
  return {
    ...actual,
    ReadoutTileView: (props: Parameters<typeof actual.ReadoutTileView>[0]) => {
      if (props.block.id === "broken-tile") throw new Error("tile view failed");
      return actual.ReadoutTileView(props);
    },
    ReadoutTileStrip: (props: Parameters<typeof actual.ReadoutTileStrip>[0]) => {
      if (props.block.id === "broken-tile") throw new Error("tile strip failed");
      return actual.ReadoutTileStrip(props);
    },
  };
});

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { partOf } from "../src/shelf/part";
import { panel } from "../src/shelf/panel/factory";
import { explainer } from "../src/shelf/explainer/factory";
import { colourKey } from "../src/shelf/colourKey/factory";
import { readoutTile } from "../src/shelf/readoutTile/factory";
import { $, mountShell, press, type Mounted } from "./domSetup";

const MESSAGE = "This part could not be drawn.";
const reported: unknown[] = [];
let m: Mounted;
beforeEach(() => {
  reported.length = 0;
  vi.stubGlobal("reportError", (error: unknown) => reported.push(error));
  // React logs a caught render error to the console; the report under test is the page's.
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  m.unmount();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("a part's boundary resets when its part is drawn again (O-100 I-208)", () => {
  const broken = partOf(readoutTile({ id: "broken-tile", label: "Gap", value: "4 units" }));
  const ok = partOf(readoutTile({ id: "ok", label: "Fine gap", value: "7 units" }));
  const area = () => $(m.container, '[data-area="tile"]');

  it.each([
    { width: "wide", phone: false, drawn: "section.tile-card", error: "tile view failed" },
    { width: "phone", phone: true, drawn: "button.tile-strip-button", error: "tile strip failed" },
  ])(
    "$width: a view switch from a failed tile to a working one draws it; switching back fails afresh",
    ({ phone, drawn, error }) => {
      m = mountShell({ phone, shelfParts: [broken] });
      expect($(area(), drawn).textContent).toBe(MESSAGE);
      expect(reported).toHaveLength(1);

      m.showParts([ok]);
      const shown = $(area(), drawn).textContent;
      expect(shown).toContain("Fine gap");
      expect(shown).toContain("7 units");
      expect(area().textContent).not.toContain(MESSAGE);
      expect(area().querySelector(".part-failed")).toBeNull();
      expect(reported).toHaveLength(1);

      m.showParts([broken]);
      expect($(area(), drawn).textContent).toBe(MESSAGE);
      expect(reported).toHaveLength(2);
      expect((reported[1] as Error).message).toBe(error);
    },
  );

  it("a panel whose block failed, closed and reopened, draws the block's boundary afresh", () => {
    const notes = partOf(
      panel({
        id: "notes",
        button: { label: "Notes" },
        title: "Notes",
        blocks: [
          explainer({ id: "intro", paragraphs: ["Working paragraph."] }),
          colourKey({ id: "broken", entries: [{ label: "A", color: "#ff0000" }] }),
        ],
      }),
    );
    m = mountShell({ shelfParts: [notes] });
    const open = () => press($(m.container, '[data-story-button="notes"]'));
    const failed = () => m.container.querySelectorAll("[data-shelf-panel] .part-failed");
    open();
    expect(failed()).toHaveLength(1);
    expect(failed()[0]!.textContent).toBe(MESSAGE);
    expect($(m.container, "[data-shelf-panel]").textContent).toContain("Working paragraph.");
    expect(reported).toHaveLength(1);
    press($(m.container, '[aria-label="Close Notes"]'));
    expect(m.container.querySelector("[data-shelf-panel]")).toBeNull();
    open();
    expect(failed()).toHaveLength(1);
    expect(failed()[0]!.textContent).toBe(MESSAGE);
    expect(reported).toHaveLength(2);
    expect((reported[1] as Error).message).toBe("key view failed");
  });
});
