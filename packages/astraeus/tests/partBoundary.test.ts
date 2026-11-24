// @vitest-environment happy-dom
// O-100 T-456 (TEST-02): a shelf part whose view throws shows a short message in its own place and the rest of the viewer stays; the error is reported to the page once.
// The failing views are the real colour key and readout tile views made to throw for one block id each, so the descriptors are the factories' own.
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
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
  };
});

import { flushSync } from "react-dom";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import { earth } from "../src/api/bodies";
import { panel } from "../src/shelf/panel/factory";
import { explainer } from "../src/shelf/explainer/factory";
import { colourKey } from "../src/shelf/colourKey/factory";
import { readoutTile } from "../src/shelf/readoutTile/factory";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

const tick = (ms = 10) => new Promise<void>((resolve) => setTimeout(resolve, ms));
async function until(check: () => void, timeoutMs = 2000): Promise<void> {
  const end = Date.now() + timeoutMs;
  for (;;) {
    try {
      check();
      return;
    } catch (error) {
      if (Date.now() > end) throw error;
    }
    await tick();
  }
}

const reported: unknown[] = [];
const MESSAGE = "This part could not be drawn.";
beforeEach(() => {
  reported.length = 0;
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  vi.stubGlobal("reportError", (error: unknown) => reported.push(error));
  // React logs a caught render error to the console; the report under test is the page's.
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("a failing shelf part (O-100 T-456)", () => {
  it("a block whose view throws shows the message in its place; the viewer, the panel's title and Close and the sibling block stay", async () => {
    const scene = new Scene().addBody(earth).addParts([
      panel({
        id: "notes",
        button: { label: "Notes" },
        title: "Notes",
        blocks: [
          explainer({ id: "intro", paragraphs: ["Working paragraph."] }),
          colourKey({ id: "broken", entries: [{ label: "A", color: "#ff0000" }] }),
        ],
      }),
    ]);
    const element = document.createElement("div");
    document.body.append(element);
    const handle = mount(element, scene);
    await handle.ready;
    flushSync(() => document.querySelector<HTMLElement>('[data-story-button="notes"]')!.click());
    await until(() => expect(document.querySelector("[data-shelf-panel]")).not.toBeNull());
    const shelf = document.querySelector("[data-shelf-panel]")!;
    expect(shelf.textContent).toContain("Working paragraph.");
    expect(shelf.querySelector("h2")!.textContent).toBe("Notes");
    expect(shelf.querySelector('[aria-label="Close Notes"]')).not.toBeNull();
    expect(shelf.querySelector('[role="status"]')!.textContent).toBe(MESSAGE);
    expect(shelf.querySelector('[data-shelf-block="broken"]')).toBeNull();
    expect(element.querySelector(".canvas-host")).not.toBeNull();
    expect(document.querySelector('[data-story-button="notes"]')).not.toBeNull();
    expect(reported).toHaveLength(1);
    expect((reported[0] as Error).message).toBe("key view failed");
    handle.unmount();
  });

  it("a tile whose view throws shows the message in the tile area; the viewer stays and the error is reported once", async () => {
    const scene = new Scene().addBody(earth).addParts([readoutTile({ id: "broken-tile", label: "Gap", value: "4" })]);
    const element = document.createElement("div");
    document.body.append(element);
    const handle = mount(element, scene);
    await handle.ready;
    await until(() => expect(document.querySelector('[data-area="tile"] [role="status"]')).not.toBeNull());
    expect(document.querySelector('[data-area="tile"] [role="status"]')!.textContent).toBe(MESSAGE);
    expect(element.querySelector(".canvas-host")).not.toBeNull();
    expect(reported).toHaveLength(1);
    expect((reported[0] as Error).message).toBe("tile view failed");
    handle.unmount();
  });
});
