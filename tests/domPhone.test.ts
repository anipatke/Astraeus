// @vitest-environment happy-dom
// The phone layout on the pretend page (O-038 T-143): the two drawers, the information and story sheets, Sources, the speed slider, reduced motion and the developer folds.
// Stands in for the behaviour scenarios of browser-phone.mjs. Sizes and positions are the owner's look on the preview; here only what happens when a control is pressed.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Collapsible } from "../src/shell/Collapsible";
import { $, byLabel, change, mountShell, press, pressKey, selectObject, swipe, touchDrag, type Mounted } from "./domSetup";

let m: Mounted;
afterEach(() => { m.unmount(); });
const drawers = () => ({
  controls: $(m.container, "#controls-drawer").getAttribute("data-open") === "true",
  timeline: $(m.container, "#timeline-drawer").getAttribute("data-open") === "true",
});
const pill = () => $(m.container, "button.controls-pill");
const controlsHandle = () => $(m.container, "button.drawer-handle-bottom");
const timelineHandle = () => $(m.container, "button.drawer-handle-top");
const phone = (options = {}) => { m = mountShell({ phone: true, ...options }); };

describe("the phone shows only its small chrome (browser-phone: layout)", () => {
  it("shows the name pill with the picked object, the cog, and both drawers closed", () => {
    phone();
    expect(m.container.querySelector("main")!.getAttribute("data-phone")).toBe("true");
    expect(pill().textContent).toContain("Earth");
    expect(byLabel(m.container, "Developer mode")).toBeTruthy();
    expect(drawers()).toEqual({ controls: false, timeline: false });
  });
  it("follows a pick with the pill's name", () => {
    phone();
    selectObject(m.container, "survey-marker");
    expect(pill().textContent).toContain("Survey marker");
  });
});

describe("the top drawer (browser-phone: top drawer; browser-shell: phone object list)", () => {
  it("opens on a tap on the pill and closes on a tap on the handle", () => {
    phone();
    press(pill());
    expect(drawers()).toEqual({ controls: true, timeline: false });
    expect(pill().getAttribute("aria-expanded")).toBe("true");
    press(controlsHandle());
    expect(drawers()).toEqual({ controls: false, timeline: false });
  });
  it("opens on a swipe down on the pill and closes on a swipe up on the handle", () => {
    phone();
    swipe(pill(), 120);
    expect(drawers().controls).toBe(true);
    swipe(controlsHandle(), -120);
    expect(drawers().controls).toBe(false);
  });
  it("closes on Escape", () => {
    phone();
    press(pill());
    pressKey(document, "Escape");
    expect(drawers().controls).toBe(false);
  });
  it("stays open when the object list is opened (owner bug, 2026-10-18) and closes only on a pick", () => {
    phone();
    press(pill());
    press($(m.container, "select.object-picker"));
    expect(drawers().controls).toBe(true);
    selectObject(m.container, "moon");
    expect(drawers().controls).toBe(false);
  });
  it("keeps the object list inside the drawer, which carries the closed state for the stylesheet to hide", () => {
    phone();
    expect($(m.container, "#controls-drawer").contains($(m.container, "select.object-picker"))).toBe(true);
    expect($(m.container, "#controls-drawer").getAttribute("data-open")).toBe("false");
  });
});

describe("the timeline drawer (browser-phone: timeline drawer)", () => {
  it("opens and closes on a tap on its handle, showing the events context and the Up next list", () => {
    phone();
    expect($(m.container, "#timeline-drawer").getAttribute("data-open")).toBe("false");
    press(timelineHandle());
    expect(drawers()).toEqual({ controls: false, timeline: true });
    expect($(m.container, "#timeline-drawer").textContent).toMatch(/Just happened|Up next/);
    expect($(m.container, "#timeline-drawer").textContent).toMatch(/Up next/);
    press(timelineHandle());
    expect(drawers().timeline).toBe(false);
  });
  it("opens on a swipe up and closes on a swipe down", () => {
    phone();
    swipe(timelineHandle(), -120);
    expect(drawers().timeline).toBe(true);
    swipe(timelineHandle(), 120);
    expect(drawers().timeline).toBe(false);
  });
  it("shares the screen: opening the top drawer closes the timeline drawer", () => {
    phone();
    press(timelineHandle());
    press(pill());
    expect(drawers()).toEqual({ controls: true, timeline: false });
  });
  it("drives the playback speed from its slider", () => {
    phone();
    const slider = byLabel(m.container, "Speed slider") as HTMLInputElement;
    const before = m.clock.rate;
    change(slider, slider.max);
    const fast = m.clock.rate;
    change(slider, "0");
    expect(fast).not.toBe(before);
    expect(m.clock.rate).not.toBe(fast);
  });
  it("keeps the time and the playing state through opening and closing both drawers", () => {
    phone();
    const before = { time: m.clock.now(), playing: m.clock.playing };
    press(pill()); press(controlsHandle()); press(timelineHandle()); press(timelineHandle());
    expect({ time: m.clock.now(), playing: m.clock.playing }).toEqual(before);
  });
  it("a drag on the scene opens no drawer", () => {
    phone();
    const scene = $(m.container, ".shell-canvas");
    act(() => {
      scene.dispatchEvent(new window.PointerEvent("pointerdown", { bubbles: true, clientY: 300 }));
      scene.dispatchEvent(new window.PointerEvent("pointermove", { bubbles: true, clientY: 420 }));
      scene.dispatchEvent(new window.PointerEvent("pointerup", { bubbles: true, clientY: 420 }));
    });
    expect(drawers()).toEqual({ controls: false, timeline: false });
  });
});

describe("the information sheet (browser-phone: information sheet)", () => {
  const openInfo = () => { phone(); selectObject(m.container, "survey-marker"); press(byLabel(m.container, "Close information")); press(pill()); press(byLabel(m.container, /^Information about /)); };
  it("opening information closes the top drawer", () => {
    openInfo();
    expect(m.container.querySelector("#info-panel")).not.toBeNull();
    expect(drawers().controls).toBe(false);
  });
  it("keeps its sources in the page, closed, and one tap opens them", () => {
    openInfo();
    const sources = $(m.container, "#info-panel .sources-section") as HTMLDetailsElement;
    expect(sources.open).toBe(false);
    expect(sources.querySelectorAll("li").length).toBeGreaterThan(0);
    press($(sources, "summary"));
    expect(sources.open).toBe(true);
  });
  it("is dismissed by a swipe down on the sheet, and a short drag keeps it", () => {
    openInfo();
    const sheet = $(m.container, "#info-panel");
    touchDrag(sheet, 30);
    expect(m.container.querySelector("#info-panel")).not.toBeNull();
    touchDrag(sheet, 160);
    expect(m.container.querySelector("#info-panel")).toBeNull();
  });
});

describe("a story panel on a phone (browser-phone: story panel; browser-story-panels: phone)", () => {
  const openStory = () => { phone(); press($(m.container, ".timeline-panel-marker")); };
  it("opens from its timeline marker with Sources closed and the source lines in the page", () => {
    openStory();
    const sources = $(m.container, ".story-panel .sources-section") as HTMLDetailsElement;
    expect(sources.open).toBe(false);
    expect(sources.querySelectorAll("li").length).toBeGreaterThanOrEqual(1);
    press($(sources, "summary"));
    expect(sources.open).toBe(true);
  });
  it("is dismissed by a swipe down, kept by a short drag, and closed by Escape", () => {
    openStory();
    const sheet = $(m.container, ".story-panel");
    touchDrag(sheet, 30);
    expect(m.container.querySelector(".story-panel")).not.toBeNull();
    touchDrag(sheet, 160);
    expect(m.container.querySelector(".story-panel")).toBeNull();
    press($(m.container, ".timeline-panel-marker"));
    pressKey(document, "Escape");
    expect(m.container.querySelector(".story-panel")).toBeNull();
  });
});

describe("the phone settings and reduced motion (browser-phone: settings, reduced motion)", () => {
  it("hands the animation setting to the drawers as a stylesheet number", () => {
    phone({ phoneLayout: { animationMs: 0, timelineDrawerMaxPercent: 55, controlsDrawerMaxPercent: 60, sheetMaxPercent: 50, swipeThresholdPx: 30 } });
    expect(($(m.container, "main") as HTMLElement).style.getPropertyValue("--drawer-ms")).toBe("0ms");
  });
  it("uses the swipe distance setting: a swipe shorter than it is a tap", () => {
    phone({ phoneLayout: { animationMs: 0, timelineDrawerMaxPercent: 55, controlsDrawerMaxPercent: 60, sheetMaxPercent: 50, swipeThresholdPx: 100 } });
    swipe(pill(), 60);
    expect(drawers().controls).toBe(true); // a 60 px move under a 100 px threshold counts as a tap, which opens
    press(controlsHandle());
    swipe(pill(), 150);
    expect(drawers().controls).toBe(true);
  });
  it("removes the drawer animation under reduced motion (stylesheet) and respects the safe-area insets", () => {
    const css = readFileSync(resolve(process.cwd(), "src/shell/phone.css"), "utf8");
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.controls-drawer[^}]*\.timeline-drawer[^}]*transition: none/);
    for (const edge of ["top", "bottom", "left", "right"]) expect(css, edge).toContain(`env(safe-area-inset-${edge}`);
  });
  it("mounts and opens a drawer with reduced motion asked for", () => {
    phone({ reducedMotion: true });
    press(pill());
    expect(drawers().controls).toBe(true);
  });
});

describe("the developer folds (browser-phone: developer groups)", () => {
  it("opens and folds a group with one press, and remembers it for the next visit", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const render = () => {
      const root = createRoot(host);
      act(() => root.render(createElement(Collapsible, { id: "t143-group", title: "Group", defaultOpen: false, children: createElement("p", null, "inside") })));
      return root;
    };
    window.localStorage.clear();
    let root = render();
    const toggle = () => $(host, "[data-fold-toggle]");
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    press(toggle());
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    act(() => root.unmount());
    root = render();
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    press(toggle());
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    act(() => root.unmount());
    host.remove();
    m = mountShell({ phone: true });
  });
});
