// @vitest-environment happy-dom
// T-329 (viewer-interface note, section 5): the screen-level part of the panel rule. Every panel sits in its area, and opening one closes exactly what the close table
// says, through the real shell. The pure table is tests/panelRule.test.ts. Two viewers keep separate state (API-03).
import { act, createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { syntheticDefinition } from "./synthetic/syntheticDefinition";
import { scaleChoicesFor } from "../src/shell/scaleModel";
import { jupiterMoonPanel } from "./helpers/jupiterMoonPanel";
import { $, mountShell, press, pressKey, type Mounted } from "./domSetup";

const PANEL_ID = syntheticDefinition.experience.storyPanels!.panels[0]!.id;
const SWITCHES = [{ id: "labels", label: "Labels", place: "panel" as const, on: true, onToggle: () => undefined }];
const SCALES = scaleChoicesFor(["true-scale", "readable-scale"]);
const MOON_EXPERIENCE = { ...syntheticDefinition.experience, moonFamilies: jupiterMoonPanel() };

let viewers: Mounted[] = [];
afterEach(() => {
  for (const m of viewers) m.unmount();
  viewers = [];
});
const mount = (options: Parameters<typeof mountShell>[0] = {}): Mounted => {
  const m = mountShell(options);
  viewers.push(m);
  return m;
};
const inArea = (m: Mounted, area: string, selector: string) =>
  m.container.querySelector(`[data-area="${area}"] ${selector}`) !== null;
const pointerDown = (target: Element) =>
  act(() => {
    target.dispatchEvent(new window.Event("pointerdown", { bubbles: true }));
  });
const card = (m: Mounted) => m.container.querySelector(".info-panel") !== null;
const moonsOpen = (m: Mounted) => $(m.container, ".moons-sheet").getAttribute("data-open") === "true";
const menuOpen = (m: Mounted) => $(m.container, ".controls-drawer").getAttribute("data-open") === "true";

describe("every panel sits in its area", () => {
  it("wide: the card and moons sheet in left, the story panel in right, the developer panel in developer, the timeline in timeline, the bar in bar", () => {
    const m = mount({ experience: MOON_EXPERIENCE, developerTools: createElement("p", null, "tools") });
    press($(m.container, ".object-info-toggle"));
    m.requestPanel(PANEL_ID);
    press($(m.container, ".developer-mode-toggle"));
    expect(inArea(m, "left", ".info-panel")).toBe(true);
    expect(inArea(m, "left", ".moons-sheet")).toBe(true);
    expect(inArea(m, "right", ".story-panel")).toBe(true);
    expect(inArea(m, "developer", ".developer-tools")).toBe(true);
    expect(inArea(m, "timeline", ".timeline-bar")).toBe(true);
    expect(inArea(m, "bar", ".top-bar")).toBe(true);
  });

  it("phone: the controls drawer in menu", () => {
    const m = mount({ phone: true });
    expect(inArea(m, "menu", ".controls-drawer")).toBe(true);
    expect(m.container.querySelector("main")!.getAttribute("data-phone")).toBe("true");
  });
});

describe("what opening a panel closes (the close table through the shell)", () => {
  it("wide: the moons sheet and the card share the left place", () => {
    const m = mount({ experience: MOON_EXPERIENCE });
    press($(m.container, ".object-info-toggle"));
    expect(card(m)).toBe(true);
    press($(m.container, ".moons-toggle"));
    expect(moonsOpen(m)).toBe(true);
    expect(card(m)).toBe(false);
    press($(m.container, ".object-info-toggle"));
    expect(card(m)).toBe(true);
    expect(moonsOpen(m)).toBe(false);
  });

  it("phone, change 7: the moons list is a sheet opened from the menu; opening the menu closes no panel; choosing the moons button closes the menu", () => {
    const m = mount({ phone: true, experience: MOON_EXPERIENCE });
    m.requestPanel(PANEL_ID);
    press($(m.container, "button.bar-menu-button"));
    expect(menuOpen(m)).toBe(true);
    expect(m.container.querySelector(".story-panel")).not.toBeNull();
    expect(inArea(m, "left", ".moon-panel") || inArea(m, "left", ".moons-sheet")).toBe(true);
    expect($(m.container, ".controls-drawer").querySelector(".moon-panel")).toBeNull();
    press($(m.container, ".moons-toggle"));
    expect(menuOpen(m)).toBe(false);
    expect(moonsOpen(m)).toBe(true);
    expect(m.container.querySelector(".story-panel")).not.toBeNull();
  });

  it("phone: a detail sheet (the card) covers the story sheet and keeps it open", () => {
    const m = mount({ phone: true });
    m.requestPanel(PANEL_ID);
    press($(m.container, "button.bar-menu-button"));
    press($(m.container, ".object-info-toggle"));
    expect(card(m)).toBe(true);
    expect(m.container.querySelector(".story-panel")).not.toBeNull();
  });

  it("one small pop-up at a time: opening the Display panel closes the scale explanation, and the scale menu opening closes it", () => {
    const m = mount({ displaySwitches: SWITCHES, scaleChoices: SCALES });
    const help = $(m.container, ".scale-info");
    const display = $(m.container, ".switch-panel-toggle");
    press(help);
    expect(help.getAttribute("aria-expanded")).toBe("true");
    press(display);
    expect(display.getAttribute("aria-expanded")).toBe("true");
    expect(help.getAttribute("aria-expanded")).toBe("false");
    press(help);
    expect(display.getAttribute("aria-expanded")).toBe("false");
  });

  it("the Display panel closes on a press outside it, and not on a press inside it", () => {
    const m = mount({ displaySwitches: SWITCHES });
    const display = $(m.container, ".switch-panel-toggle");
    press(display);
    pointerDown($(m.container, ".switch-panel"));
    expect(display.getAttribute("aria-expanded")).toBe("true");
    pointerDown(document.body);
    expect(display.getAttribute("aria-expanded")).toBe("false");
  });

  it("the timeline's Events list is a pop-up: it opens on its summary and closes on Escape (change: it did not before)", () => {
    const m = mount();
    const events = $(m.container, "details.timeline-event-list") as HTMLDetailsElement;
    press($(events, "summary"));
    expect(events.open).toBe(true);
    pressKey(events, "Escape");
    expect(events.open).toBe(false);
  });

  it("phone: the menu closes the timeline drawer, and the timeline drawer closes the menu", () => {
    const m = mount({ phone: true });
    const drawerOpen = () => $(m.container, ".timeline-drawer").getAttribute("data-open") === "true";
    press($(m.container, "button.drawer-handle-top"));
    expect(drawerOpen()).toBe(true);
    press($(m.container, "button.bar-menu-button"));
    expect(menuOpen(m)).toBe(true);
    expect(drawerOpen()).toBe(false);
    press($(m.container, "button.drawer-handle-top"));
    expect(drawerOpen()).toBe(true);
    expect(menuOpen(m)).toBe(false);
  });

  it("phone, change 11: the developer panel is a detail sheet: opening it closes the card, and the card closes it", () => {
    const m = mount({ phone: true, developerTools: createElement("p", null, "tools") });
    press($(m.container, "button.bar-menu-button"));
    press($(m.container, ".object-info-toggle"));
    expect(card(m)).toBe(true);
    press($(m.container, ".developer-mode-toggle"));
    expect(card(m)).toBe(false);
    expect($(m.container, ".developer-mode-toggle").getAttribute("aria-pressed")).toBe("true");
    press($(m.container, "button.bar-menu-button"));
    press($(m.container, ".object-info-toggle"));
    expect(card(m)).toBe(true);
    expect($(m.container, ".developer-mode-toggle").getAttribute("aria-pressed")).toBe("false");
  });

  it("Escape closes the topmost only: the card first, then the story panel", () => {
    const m = mount();
    m.requestPanel(PANEL_ID);
    press($(m.container, ".object-info-toggle"));
    pressKey(document.body, "Escape");
    expect(card(m)).toBe(false);
    expect(m.container.querySelector(".story-panel")).not.toBeNull();
    pressKey(document.body, "Escape");
    expect(m.container.querySelector(".story-panel")).toBeNull();
  });
});

describe("two viewers keep separate panel state (API-03)", () => {
  it("a card, a pop-up and a drawer opened in one viewer change nothing in the other", () => {
    const a = mount({ displaySwitches: SWITCHES });
    const b = mount({ displaySwitches: SWITCHES });
    press($(a.container, ".object-info-toggle"));
    press($(a.container, ".switch-panel-toggle"));
    expect(card(a)).toBe(true);
    expect(card(b)).toBe(false);
    expect($(b.container, ".switch-panel-toggle").getAttribute("aria-expanded")).toBe("false");
    // A press in B is outside A: A's pop-up closes, its card stays; B's own pop-up opens on its own press.
    pointerDown($(b.container, ".switch-panel-toggle"));
    expect($(a.container, ".switch-panel-toggle").getAttribute("aria-expanded")).toBe("false");
    press($(b.container, ".switch-panel-toggle"));
    expect($(b.container, ".switch-panel-toggle").getAttribute("aria-expanded")).toBe("true");
    expect(card(a)).toBe(true);
  });
});
