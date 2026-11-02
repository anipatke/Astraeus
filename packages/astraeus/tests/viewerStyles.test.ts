// @vitest-environment happy-dom
// The viewer's main stylesheets stay inside the viewer (O-055 T-256, API-03). The test environment does not apply imported stylesheets, so the test injects the
// source CSS files into a <style> element itself, then checks a host page with its own body font, colour and button rule before, during and after a viewer.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
vi.mock("../src/api/prepared", async () => {
  const { syntheticDefinition } = await import("../src/synthetic/syntheticDefinition");
  return { prepareScene: () => ({ definition: { ...syntheticDefinition, label: "Made-up survey" }, ready: Promise.resolve() }) };
});

import { AstraeusScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import { drawn } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SRC = join(process.cwd(), "packages", "astraeus", "src");
const SHEETS = ["app/style.css", "shell/controls.css", "shell/style.css", "shell/phone.css", "shell/embedded.css", "shell/TopBar.css", "shell/TimelineBar.css"];
const HOST_CSS = "body { font-family: Georgia, serif; color: rgb(10, 20, 30); } button { border: 3px dotted rgb(1, 2, 3); padding: 7px; }";
const PROPS = ["font-family", "color", "background-color", "margin-top", "position", "overflow", "height", "color-scheme", "border-top-width", "padding-top", "font-size"];

const snapshot = (elements: Record<string, Element>): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [name, element] of Object.entries(elements)) {
    const style = getComputedStyle(element);
    for (const property of PROPS) out[`${name} ${property}`] = style.getPropertyValue(property);
  }
  return out;
};

/** The nearest ancestor of `element` that is positioned: what an absolutely positioned `element` is placed against. */
const containingBlock = (element: Element): Element => {
  for (let up = element.parentElement; up !== null; up = up.parentElement) if (getComputedStyle(up).position !== "static") return up;
  return document.documentElement;
};

let hostStyle: HTMLStyleElement;
let viewerStyle: HTMLStyleElement;
let page: HTMLElement;
let hostButton: HTMLButtonElement;
beforeEach(() => {
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  hostStyle = document.createElement("style");
  hostStyle.textContent = HOST_CSS;
  document.head.append(hostStyle);
  page = document.createElement("div");
  hostButton = document.createElement("button");
  hostButton.textContent = "Host button";
  document.body.append(page, hostButton);
});
afterEach(() => { viewerStyle?.remove(); hostStyle.remove(); page.remove(); hostButton.remove(); vi.unstubAllGlobals(); });

const injectViewerSheets = (): void => {
  viewerStyle = document.createElement("style");
  viewerStyle.textContent = SHEETS.map((file) => readFileSync(join(SRC, file), "utf8")).join("\n");
  document.head.append(viewerStyle);
};

describe("the test environment applies a stylesheet", () => {
  it("restyles the host's button for an unscoped rule, so the checks below can fail", () => {
    const control = document.createElement("style");
    control.textContent = "button { padding: 33px; }";
    document.head.append(control);
    expect(getComputedStyle(hostButton).paddingTop).toBe("33px");
    control.remove();
    expect(getComputedStyle(hostButton).paddingTop).toBe("7px");
  });
});

/** Both ways in: `mount` on an element, and the React `AstraeusScene` (whose wrapper is the element). */
const ENTRIES: ReadonlyArray<{ readonly name: string; readonly start: (element: HTMLElement) => Promise<{ readonly stop: () => void; readonly area: () => HTMLElement }> }> = [
  {
    name: "mount",
    start: async (element) => {
      const handle = mount(element, new Scene());
      await drawn(handle);
      return { stop: () => { act(() => { handle.unmount(); }); }, area: () => element };
    },
  },
  {
    name: "AstraeusScene",
    start: async (element) => {
      const root: Root = createRoot(element);
      await act(async () => { root.render(createElement(AstraeusScene, { scene: new Scene() })); await Promise.resolve(); });
      await act(async () => { await new Promise((done) => setTimeout(done, 0)); });
      return { stop: () => { act(() => root.unmount()); }, area: () => element.firstElementChild as HTMLElement };
    },
  },
];

describe.each(ENTRIES)("a viewer started by $name", ({ start }) => {
  it("leaves the host's html, body and own elements as they were, while mounted and after unmount", async () => {
    injectViewerSheets();
    const pageElements = () => ({ html: document.documentElement, body: document.body, page, button: hostButton });
    const before = snapshot(pageElements());
    expect(before["body font-family"]).toContain("Georgia");
    expect(before["button border-top-width"]).toBe("3px");
    const started = await start(page);
    expect(page.querySelector(".astraeus-shell")).not.toBeNull();
    expect(snapshot(pageElements())).toEqual({ ...before, "page position": expect.any(String), "page overflow": expect.any(String), "page height": expect.any(String) });
    for (const key of ["html", "body", "button"]) for (const property of PROPS) expect(snapshot(pageElements())[`${key} ${property}`]).toBe(before[`${key} ${property}`]);
    started.stop();
    for (const key of ["html", "body", "button"]) for (const property of PROPS) expect(snapshot(pageElements())[`${key} ${property}`]).toBe(before[`${key} ${property}`]);
  });

  it("puts the custom properties and base font on the viewer's root", async () => {
    injectViewerSheets();
    const started = await start(page);
    const rootStyle = getComputedStyle(page.querySelector(".astraeus-shell")!);
    expect(rootStyle.getPropertyValue("--ui-accent").trim()).toBe("#fc6323");
    expect(rootStyle.getPropertyValue("--ui-panel").trim()).toBe("rgba(13, 13, 13, .94)");
    expect(rootStyle.getPropertyValue("--perf-good").trim()).toBe("#6fcf8f");
    expect(rootStyle.fontSize).toBe("14px");
    expect(rootStyle.colorScheme).toBe("dark");
    expect(getComputedStyle(document.documentElement).getPropertyValue("--ui-accent")).toBe("");
    started.stop();
  });

  it("makes its element a containing block, and a second viewer in a 400x300 element is placed against that element only", async () => {
    injectViewerSheets();
    const small = document.createElement("div");
    small.style.cssText = "width: 400px; height: 300px";
    document.body.append(small);
    const first = await start(page);
    const second = await start(small);
    for (const area of [first.area(), second.area()]) {
      expect(getComputedStyle(area).position).toBe("relative");
      expect(getComputedStyle(area).overflow).toBe("hidden");
    }
    const shells = [...document.querySelectorAll<HTMLElement>(".astraeus-shell")];
    expect(shells).toHaveLength(2);
    for (const shell of shells) expect(getComputedStyle(shell).position).toBe("absolute");
    expect(containingBlock(page.querySelector(".astraeus-shell")!)).toBe(first.area());
    const inSmall = small.querySelector(".astraeus-shell")!;
    expect(containingBlock(inSmall)).toBe(second.area());
    // The viewer is placed against `small` (itself, or a wrapper filling it), which is 400x300; the first viewer's element is another one.
    expect([small, small.firstElementChild].includes(containingBlock(inSmall))).toBe(true);
    expect(getComputedStyle(small).width).toBe("400px");
    expect(getComputedStyle(small).height).toBe("300px");
    expect(small.contains(page)).toBe(false);
    expect(containingBlock(page.querySelector(".astraeus-shell")!)).not.toBe(second.area());
    second.stop();
    first.stop();
    small.remove();
  });

  it("keeps a position or overflow the host already chose", async () => {
    page.style.cssText = "position: absolute; overflow: auto";
    const started = await start(page);
    const area = started.area();
    expect(getComputedStyle(page).position).toBe("absolute");
    expect(getComputedStyle(page).overflow).toBe("auto");
    expect(area).toBeDefined();
    started.stop();
  });
});
