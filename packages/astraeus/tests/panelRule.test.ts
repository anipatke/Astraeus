// The panel rule (viewer-interface note, section 5): every row of the close table is a named case, wide and phone. Pure: no DOM.
import { describe, expect, it } from "vitest";
import { NO_PANELS, reducePanels, topmost, type Layout, type PanelAction, type PanelState } from "../src/shell/panels/panelRule";

const state = (over: Partial<PanelState>): PanelState => ({ ...NO_PANELS, ...over });
const apply = (from: PanelState, action: PanelAction, layout: Layout) => reducePanels(from, action, layout);
const LAYOUTS: readonly Layout[] = ["wide", "phone"];

describe.each(LAYOUTS)("the close table, %s", (layout) => {
  it("any occupant of left closes the other left occupant (card over moons, moons over card)", () => {
    expect(apply(state({ left: "moons" }), { type: "open", occupant: "card" }, layout).left).toBe("card");
    expect(apply(state({ left: "card" }), { type: "open", occupant: "moons" }, layout).left).toBe("moons");
  });

  it("a story panel opening keeps one story place: newest wins, and the left occupant stays", () => {
    const next = apply(state({ story: true, left: "card" }), { type: "open", occupant: "story" }, layout);
    expect(next).toMatchObject({ story: true, left: "card" });
  });

  it("a detail sheet or left card covers the story panel and keeps it open", () => {
    expect(apply(state({ story: true }), { type: "open", occupant: "card" }, layout)).toMatchObject({ left: "card", story: true });
    expect(apply(state({ story: true }), { type: "open", occupant: "moons" }, layout)).toMatchObject({ left: "moons", story: true });
  });

  it("the menu opening closes the timeline drawer and pop-ups, and no panel", () => {
    const next = apply(state({ timeline: true, popup: "scale-menu", left: "card", story: true }), { type: "open", occupant: "menu" }, layout);
    expect(next).toEqual(state({ menu: true, left: "card", story: true }));
  });

  it("the timeline drawer opening closes the menu and pop-ups, and no panel", () => {
    const next = apply(state({ menu: true, popup: "display", left: "moons", story: true }), { type: "open", occupant: "timeline" }, layout);
    expect(next).toEqual(state({ timeline: true, left: "moons", story: true }));
  });

  it("any pop-up closes the other pop-up", () => {
    expect(apply(state({ popup: "scale-menu" }), { type: "openPopup", id: "display" }, layout).popup).toBe("display");
  });

  it("an item chosen inside the menu closes the menu, and the timeline drawer likewise", () => {
    expect(apply(state({ menu: true, left: "card" }), { type: "chooseInDrawer", drawer: "menu" }, layout)).toEqual(state({ left: "card" }));
    expect(apply(state({ timeline: true }), { type: "chooseInDrawer", drawer: "timeline" }, layout)).toEqual(NO_PANELS);
  });

  it("a view switch closes a card whose object the view drops and a story panel the view does not show, only when told", () => {
    const open = state({ left: "card", story: true });
    expect(apply(open, { type: "viewSwitch", dropsCard: true, dropsStory: false }, layout)).toEqual(state({ story: true }));
    expect(apply(open, { type: "viewSwitch", dropsCard: false, dropsStory: true }, layout)).toEqual(state({ left: "card" }));
    expect(apply(open, { type: "viewSwitch", dropsCard: false, dropsStory: false }, layout)).toEqual(open);
    expect(apply(state({ left: "moons" }), { type: "viewSwitch", dropsCard: true, dropsStory: false }, layout).left).toBe("moons");
  });

  it("an outside press closes the open pop-up and nothing else", () => {
    const next = apply(state({ popup: "scale-help", left: "card", menu: true }), { type: "outsidePress" }, layout);
    expect(next).toEqual(state({ left: "card", menu: true }));
  });

  it("Escape closes the topmost only: pop-up, then drawer, then detail (left), then story", () => {
    let now = state({ popup: "display", menu: true, left: "card", story: true });
    now = apply(now, { type: "escape" }, layout);
    expect(now).toEqual(state({ menu: true, left: "card", story: true }));
    now = apply(now, { type: "escape" }, layout);
    expect(now).toEqual(state({ left: "card", story: true }));
    now = apply(now, { type: "escape" }, layout);
    expect(now).toEqual(state({ story: true }));
    now = apply(now, { type: "escape" }, layout);
    expect(now).toEqual(NO_PANELS);
    expect(apply(now, { type: "escape" }, layout)).toBe(now);
  });

  it("Escape closes the timeline drawer above a card", () => {
    expect(topmost(state({ timeline: true, left: "card" }))).toEqual({ occupant: "timeline" });
  });

  it("closing one occupant closes only it", () => {
    expect(apply(state({ left: "card", story: true }), { type: "close", occupant: "card" }, layout)).toEqual(state({ story: true }));
    expect(apply(state({ left: "moons" }), { type: "close", occupant: "card" }, layout).left).toBe("moons");
  });
});

describe("the developer place", () => {
  it("wide: the developer panel closes nothing and nothing closes it (it shifts left of the right place)", () => {
    const open = state({ left: "card", story: true });
    expect(apply(open, { type: "open", occupant: "developer" }, "wide")).toEqual({ ...open, developer: true });
    expect(apply(state({ developer: true }), { type: "open", occupant: "card" }, "wide")).toMatchObject({ developer: true, left: "card" });
  });

  it("phone: the developer panel is a detail sheet, so it replaces a card or moons sheet and is replaced by one; the story sheet stays", () => {
    expect(apply(state({ left: "card", story: true }), { type: "open", occupant: "developer" }, "phone")).toEqual(state({ developer: true, story: true }));
    expect(apply(state({ developer: true, story: true }), { type: "open", occupant: "moons" }, "phone")).toEqual(state({ left: "moons", story: true }));
  });

  it("Escape does not close the developer panel (it never did)", () => {
    expect(topmost(state({ developer: true }))).toBeNull();
  });
});

describe("the wide drop-down closes on an outside press (note section 6, change 9)", () => {
  it("wide: with no pop-up open, an outside press closes the menu and nothing else", () => {
    expect(apply(state({ menu: true, left: "card", story: true }), { type: "outsidePress" }, "wide")).toEqual(state({ left: "card", story: true }));
  });
  it("phone: the drawer stays open on an outside press (it has its own handle)", () => {
    expect(apply(state({ menu: true }), { type: "outsidePress" }, "phone")).toEqual(state({ menu: true }));
  });
  it("wide: with a pop-up open, the first outside press closes only the pop-up, the second the menu", () => {
    const first = apply(state({ menu: true, popup: "scale-help" }), { type: "outsidePress" }, "wide");
    expect(first).toEqual(state({ menu: true }));
    expect(apply(first, { type: "outsidePress" }, "wide")).toEqual(state({}));
  });
});
