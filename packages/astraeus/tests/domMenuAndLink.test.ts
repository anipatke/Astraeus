// @vitest-environment happy-dom
// The three-scale menu and "Copy view link" on the pretend page (O-038 T-143). Stand in for browser-scale-menu.mjs and browser-view-link.mjs.
import { createElement, useState } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { ViewLinkReadout } from "../src/app/DeveloperSettings";
import { shareViewLink } from "../src/app/address";
import { formatView, parseView, viewFromSearch, type SkyView, type StartView } from "../src/app/viewLink";
import { ScaleControl } from "../src/shell/ScaleControl";
import { scaleChoicesFor } from "../src/shell/scaleModel";
import { $, press, pressKey } from "./domSetup";

let root: Root | undefined;
let host: HTMLElement | undefined;
afterEach(() => { act(() => root?.unmount()); host?.remove(); root = undefined; });
const mount = (node: React.ReactElement) => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(node));
  return host;
};

describe("the scale menu (browser-scale-menu)", () => {
  const choices = scaleChoicesFor(["true-scale", "readable-scale", "solar-system"]);
  function Menu() {
    const [id, setId] = useState("true-scale");
    return createElement(ScaleControl, { scaleId: id, onScaleChange: setId, choices });
  }
  const open = () => {
    const page = mount(createElement(Menu));
    return { page, trigger: $(page, ".scale-menu-trigger"), menu: $(page, '[role="menu"]'), items: [...page.querySelectorAll<HTMLElement>('[role="menuitemradio"]')] };
  };
  const focused = () => (document.activeElement as HTMLElement | null)?.getAttribute("data-scale");

  it("is closed by default, opens on a press, and puts focus on the current scale", () => {
    const { trigger, menu } = open();
    expect(menu.hidden).toBe(true);
    press(trigger);
    expect(menu.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(focused()).toBe("true-scale");
  });

  it("opens on ArrowDown from the button", () => {
    const { trigger, menu } = open();
    pressKey(trigger, "ArrowDown");
    expect(menu.hidden).toBe(false);
  });

  it("moves with ArrowDown and ArrowUp (wrapping) and jumps with Home and End", () => {
    const { trigger, menu } = open();
    press(trigger);
    pressKey(menu, "ArrowDown");
    expect(focused()).toBe("readable-scale");
    pressKey(menu, "End");
    expect(focused()).toBe("solar-system");
    pressKey(menu, "ArrowDown");
    expect(focused()).toBe("true-scale");
    pressKey(menu, "ArrowUp");
    expect(focused()).toBe("solar-system");
    pressKey(menu, "Home");
    expect(focused()).toBe("true-scale");
  });

  it("closes on Escape and gives the focus back to the button", () => {
    const { trigger, menu } = open();
    press(trigger);
    pressKey(menu, "Escape");
    expect(menu.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
    expect(trigger.textContent).toContain("True");
  });

  it("chooses on Enter (a click on the focused item), closes, and renames the button", () => {
    const { trigger, menu } = open();
    pressKey(trigger, "ArrowDown");
    pressKey(menu, "ArrowDown");
    press(document.activeElement!);
    expect(trigger.textContent).toContain("Readable");
    expect(menu.hidden).toBe(true);
    expect(trigger.getAttribute("aria-label")).toBe("Scale: Readable, choose another");
  });

  it("closes on a press outside, and chooses the third scale by name", () => {
    const { page, trigger, menu, items } = open();
    press(trigger);
    act(() => { document.body.dispatchEvent(new window.Event("pointerdown", { bubbles: true })); });
    expect(menu.hidden).toBe(true);
    press(trigger);
    press(items.find((item) => item.textContent === "Solar system")!);
    expect($(page, ".scale-menu-trigger").textContent).toContain("Solar system");
  });
});

describe("Copy view link (browser-view-link)", () => {
  const view: StartView = { focus: "earth", azimuthDeg: 120.5, elevationDeg: 24.25, distance: 3.5 };
  const state = { view, scaleId: "readable-scale", up: "ecliptic", timeUtcMs: Date.UTC(2016, 5, 1, 12, 0, 30) };
  const withClipboard = (writeText: (text: string) => Promise<void>) => Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

  it("carries the view, time, scale and up direction, puts the link on the clipboard and in the address", async () => {
    let clip = "";
    withClipboard(async (text) => { clip = text; });
    window.history.replaceState(null, "", "/app.html?experience=synthetic");
    const shared = await shareViewLink(state);
    expect(shared.copied).toBe(true);
    expect(shared.url).toMatch(/[?&]view=earth,[\d.]+,[-\d.]+,[\d.]+/);
    expect(shared.url).toMatch(/[?&]t=\d{4}-\d\d-\d\dT[\d:.]+Z/);
    expect(shared.url).toMatch(/[?&]scale=readable-scale/);
    expect(shared.url).toMatch(/[?&]up=ecliptic/);
    expect(shared.url).toContain("experience=synthetic");
    expect(clip).toBe(shared.url);
    expect(new URL(window.location.href).searchParams.get("view")).toBe(new URL(shared.url).searchParams.get("view"));
  });

  it("opens in a fresh page at the same view (focus, angles, distance)", async () => {
    withClipboard(async () => undefined);
    const shared = await shareViewLink(state);
    const restored = viewFromSearch(new URL(shared.url).search)! as StartView;
    expect(restored.focus).toBe(view.focus);
    expect(restored.azimuthDeg).toBeCloseTo(view.azimuthDeg, 1);
    expect(restored.elevationDeg).toBeCloseTo(view.elevationDeg, 1);
    expect(restored.distance / view.distance).toBeCloseTo(1, 2);
  });

  it("shows the link in a selectable field with a note when the clipboard refuses", async () => {
    withClipboard(() => Promise.reject(new Error("denied")));
    const shared = await shareViewLink(state);
    expect(shared.copied).toBe(false);
    const page = mount(createElement(ViewLinkReadout, { viewNow: view, viewLink: shared, scale: "readable-scale", upChoice: "ecliptic" }));
    expect(($(page, '[data-testid="view-link"]') as HTMLInputElement).value).toContain("view=");
    expect($(page, ".view-link-field span").textContent).toMatch(/Clipboard unavailable/);
    expect($(page, '[data-testid="view-values"]').textContent).toContain("View: earth,");
  });

  it("says Copied to the clipboard when it worked", () => {
    const page = mount(createElement(ViewLinkReadout, { viewNow: null, viewLink: { url: "http://x/?view=a", copied: true }, scale: "true-scale", upChoice: "ecliptic" }));
    expect($(page, ".view-link-field span").textContent).toBe("Copied to the clipboard.");
  });

  it("carries a sky view (body, right ascension, declination, field of view) and opens looking out from the same link", async () => {
    withClipboard(async () => undefined);
    const sky: SkyView = { lookOut: "mars", raDeg: 210.5, decDeg: -12.25, fovDeg: 45 };
    const shared = await shareViewLink({ ...state, view: sky });
    expect(new URL(shared.url).searchParams.get("view")).toBe("mars,210.5,-12.25,45,sky");
    expect(viewFromSearch(new URL(shared.url).search)).toEqual(sky);
    expect(parseView(formatView({ lookOut: "a b", raDeg: 0, decDeg: 90, fovDeg: 5 }))).toEqual({ lookOut: "a b", raDeg: 0, decDeg: 90, fovDeg: 5 });
    expect(parseView("earth,360,0,60,sky")).toMatchObject({ raDeg: 0 }); // the right ascension wraps, as the azimuth does
    const page = mount(createElement(ViewLinkReadout, { viewNow: sky, viewLink: shared, scale: "readable-scale", upChoice: "ecliptic" }));
    expect($(page, '[data-testid="view-values"]').textContent).toContain("View: mars,210.5,-12.25,45,sky (body, right ascension");
  });

  it("refuses a bad sky view as a bad orbit view is refused, and still tells the two kinds apart by the fifth part", () => {
    for (const text of ["earth,10,95,60,sky", "earth,10,0,4,sky", "earth,10,0,101,sky", "earth,x,0,60,sky", "earth,10,0,,sky", ",10,0,60,sky", "earth,10,0,60,orbit", "earth,10,0,60,sky,extra"]) {
      expect(() => parseView(text), text).toThrow(RangeError);
      expect(viewFromSearch(`?view=${text}`), text).toBeUndefined();
    }
    expect(parseView("earth,10,20,3")).toMatchObject({ focus: "earth", distance: 3 });
  });

  it("opens the experience as usual on a malformed link", () => {
    expect(viewFromSearch("?experience=synthetic&view=nonsense")).toBeUndefined();
    expect(() => parseView("nonsense")).toThrow(RangeError);
    expect(formatView(view)).toContain("earth");
  });
});
