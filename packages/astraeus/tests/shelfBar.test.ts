// @vitest-environment happy-dom
// O-080 T-333: a shelf panel is a `story` item in the bar and the `left` occupant of the panel rule, drawn by the part's own view. Made-up parts on the pretend page (ARCH-03);
// widths are stubbed as in barDom.test.ts (a ghost is 10 px per character plus 20). The rule's own rows are in the last block; the handle and both embedding paths are in lifecycle.test.ts.
import { afterEach, describe, expect, it, vi } from "vitest";
import { customBlock, panel } from "astraeus";
import { partOf } from "../src/shelf/part";
import type { ShelfPart } from "../src/app/shelfContract";
import { NO_PANELS, reducePanels, topmost, type Layout, type PanelState } from "../src/shell/panels/panelRule";
import { $, mountShell, press, pressKey, type Mounted } from "./domSetup";

let m: Mounted;
afterEach(() => { m.unmount(); vi.restoreAllMocks(); });

const part = (id: string, label: string, shortLabel?: string): ShelfPart => partOf(panel({ id, button: shortLabel === undefined ? { label } : { label, shortLabel }, title: `${label} panel`, blocks: [customBlock({ id: `${id}-body` })] }));
const gaps = part("gaps", "Kirkwood gaps", "Gaps");
const empty = part("empty", "How empty is it?", "How empty?");
const row = () => $(m.container, '[data-area="bar"] .top-bar');
const buttons = (scope: ParentNode) => [...scope.querySelectorAll<HTMLElement>("[data-story-button]")].map((b) => b.getAttribute("data-story-button"));
const left = () => m.container.querySelector<HTMLElement>('[data-area="left"] [data-shelf-panel]');
const button = (id: string) => $(m.container, `[data-story-button="${id}"]`);
const about = { title: "The belt", status: "Now" };

function laidOut(width: number): void {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const ghost = this.hasAttribute("data-ghost-id");
    const w = ghost ? [...this.children].reduce((sum, child) => sum + (child.textContent ?? "").length * 10 + 20, 0) : this.classList.contains("top-bar") ? width : 0;
    return { width: w, height: 0, top: 0, left: 0, right: w, bottom: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
  });
}

describe("the story buttons", () => {
  it("wide: two buttons in the row, in the scene's order, with their full labels, and no menu", () => {
    laidOut(1244);
    m = mountShell({ about, shelfParts: [gaps, empty] });
    expect(buttons(row())).toEqual(["gaps", "empty"]);
    expect(row().querySelector('[data-story-button="gaps"] [aria-hidden]')!.textContent).toBe("Kirkwood gaps");
    expect(m.container.querySelector("button.bar-menu-button")).toBeNull();
    // the title is before them, the engine controls after
    const order = [...row().children].map((child) => (child.matches("[data-story-button]") ? "story" : child.matches("[data-bar-title]") ? "title" : "other"));
    expect(order.indexOf("title")).toBeLessThan(order.indexOf("story"));
  });

  it("a scene with no parts draws no story button", () => {
    laidOut(1244);
    m = mountShell({ about });
    expect(buttons(m.container)).toEqual([]);
  });

  it("phone, tight row: the first button keeps its place with its short label and the second is in the menu under \"This story\"", () => {
    // a narrow row: the title is "i", the buttons are short, and the second one does not fit
    laidOut(200);
    m = mountShell({ phone: true, about, shelfParts: [gaps, empty] });
    expect(buttons(row())).toEqual(["gaps"]);
    expect($(row(), '[data-story-button="gaps"] [aria-hidden]').textContent).toBe("Gaps");
    press($(m.container, "button.bar-menu-button"));
    const story = $(m.container, ".controls-drawer .bar-menu-story");
    expect(story.getAttribute("aria-label")).toBe("This story");
    expect(buttons(story)).toEqual(["empty"]);
    expect(story.textContent).toContain("How empty is it?");
  });

  it("an item chosen in the menu closes the menu and opens its panel", () => {
    laidOut(200);
    m = mountShell({ phone: true, about, shelfParts: [gaps, empty] });
    press($(m.container, "button.bar-menu-button"));
    press($(m.container, ".bar-menu-story [data-story-button]"));
    expect($(m.container, "button.bar-menu-button").getAttribute("aria-expanded")).toBe("false");
    expect(left()!.getAttribute("data-shelf-panel")).toBe("empty");
  });
});

describe("the panel through the panel rule", () => {
  it("opens at the left, closing About; the other button replaces it; its own button and Escape close it", () => {
    laidOut(1244);
    m = mountShell({ about, shelfParts: [gaps, empty] });
    press($(m.container, "[data-bar-title]"));
    expect(m.container.querySelector("[data-about]")).not.toBeNull();
    press(button("gaps"));
    expect(left()!.getAttribute("data-shelf-panel")).toBe("gaps");
    expect(m.container.querySelector("[data-about]")).toBeNull();
    expect(button("gaps").getAttribute("aria-expanded")).toBe("true");
    expect(button("gaps").getAttribute("aria-controls")).toBe(left()!.id);
    expect($(left()!, "h2").textContent).toBe("Kirkwood gaps panel");
    press(button("empty"));
    expect(left()!.getAttribute("data-shelf-panel")).toBe("empty");
    expect(button("gaps").getAttribute("aria-expanded")).toBe("false");
    press(button("empty"));
    expect(left()).toBeNull();
    press(button("gaps"));
    pressKey(document, "Escape");
    expect(left()).toBeNull();
    expect(m.shelfChanges).toEqual([null, "gaps", "empty", null, "gaps", null]);
  });

  it("About opened over it replaces it, and the Close button closes it", () => {
    laidOut(1244);
    m = mountShell({ about, shelfParts: [gaps] });
    press(button("gaps"));
    press($(m.container, "[data-bar-title]"));
    expect(left()).toBeNull();
    expect(m.container.querySelector("[data-about]")).not.toBeNull();
    press(button("gaps"));
    expect(m.container.querySelector("[data-about]")).toBeNull();
    press($(left()!, ".info-panel-close"));
    expect(left()).toBeNull();
  });

  it("a view that does not show the open panel closes it (a part listed only in the other view)", () => {
    laidOut(1244);
    m = mountShell({ about, shelfParts: [gaps, empty] });
    press(button("gaps"));
    expect(left()).not.toBeNull();
    m.showParts([empty]); // view A: gaps is not shown
    expect(left()).toBeNull();
    expect(buttons(row())).toEqual(["empty"]);
    m.showParts([gaps, empty]); // back in view B: the panel stays closed
    expect(left()).toBeNull();
    expect(buttons(row())).toEqual(["gaps", "empty"]);
    expect(m.shelfChanges.at(-1)).toBeNull();
  });

  it("a custom block's element is handed to the panel, and what the host put in it survives closing and reopening", () => {
    laidOut(1244);
    const element = document.createElement("div");
    m = mountShell({ about, shelfParts: [gaps], shelfRuntime: { element: (id) => (id === "gaps-body" ? element : undefined) } });
    expect(element.isConnected).toBe(false);
    press(button("gaps"));
    expect(element.isConnected).toBe(true);
    expect(element.parentElement!.getAttribute("data-shelf-block")).toBe("gaps-body");
    element.append("host content");
    press(button("gaps"));
    expect(element.isConnected).toBe(false);
    expect(element.textContent).toBe("host content");
    press(button("gaps"));
    expect(element.isConnected).toBe(true);
    expect(element.textContent).toBe("host content");
  });

  it("a phone shows it as the detail sheet in the left place (the same rule), and the title place still opens About over it", () => {
    laidOut(1000);
    m = mountShell({ phone: true, about, shelfParts: [gaps] });
    press(button("gaps"));
    expect(left()!.classList.contains("info-panel")).toBe(true);
    press($(m.container, "[data-bar-title]"));
    expect(left()).toBeNull();
  });
});

describe("the panel rule's shelf rows", () => {
  const open = (state: PanelState, occupant: Parameters<typeof reducePanels>[1] extends infer A ? (A extends { type: "open"; occupant: infer O } ? O : never) : never, layout: Layout = "wide") => reducePanels(state, { type: "open", occupant }, layout);

  it.each(["wide", "phone"] as const)("%s: a shelf panel takes the left place from About, a card and the moons, and any of them takes it back", (layout) => {
    for (const other of ["about", "card", "moons"] as const) {
      const shelf = open(open(NO_PANELS, other, layout), "shelf:gaps", layout);
      expect(shelf.left).toBe("shelf:gaps");
      expect(open(shelf, other, layout).left).toBe(other);
    }
    expect(open(open(NO_PANELS, "shelf:a", layout), "shelf:b", layout).left).toBe("shelf:b");
  });

  it("opening one keeps the story panel (wide: and the developer column; a phone's detail sheet replaces the developer sheet)", () => {
    const base: PanelState = { ...NO_PANELS, story: true, developer: true };
    expect(open(base, "shelf:gaps", "wide")).toMatchObject({ left: "shelf:gaps", story: true, developer: true });
    expect(open(base, "shelf:gaps", "phone")).toMatchObject({ left: "shelf:gaps", story: true, developer: false });
  });

  it("close, Escape (topmost: detail above story) and a view switch that drops it", () => {
    const on = open({ ...NO_PANELS, story: true }, "shelf:gaps");
    expect(topmost(on)).toEqual({ occupant: "shelf:gaps" });
    expect(reducePanels(on, { type: "escape" }, "wide")).toMatchObject({ left: null, story: true });
    expect(reducePanels(on, { type: "close", occupant: "shelf:gaps" }, "wide").left).toBeNull();
    expect(reducePanels(on, { type: "close", occupant: "shelf:other" }, "wide").left).toBe("shelf:gaps");
    expect(reducePanels(on, { type: "viewSwitch", dropsCard: false, dropsStory: false, dropsShelf: true }, "wide").left).toBeNull();
    expect(reducePanels(on, { type: "viewSwitch", dropsCard: true, dropsStory: false }, "wide").left).toBe("shelf:gaps");
    const card = open(NO_PANELS, "card");
    expect(reducePanels(card, { type: "viewSwitch", dropsCard: false, dropsStory: false, dropsShelf: true }, "wide").left).toBe("card");
  });
});
