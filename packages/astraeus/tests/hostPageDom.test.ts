// @vitest-environment happy-dom
// The viewer as a guest in a host page (O-044 T-181): it leaves the page title alone, yields an Escape the host already handled, and keeps its layers inside its own stacking context.
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/app/AstraeusScene", () => ({ AstraeusScene: () => createElement("div", { "data-testid": "scene" }) }));
vi.mock("../src/api/prepared", async () => {
  const { syntheticDefinition } = await import("../src/synthetic/syntheticDefinition");
  return { prepareScene: () => ({ definition: { ...syntheticDefinition, label: "Made-up survey" }, ready: Promise.resolve() }) };
});

import { App } from "../src/app/App";
import { AstraeusScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { $, mountShell, press, pressKey, type Mounted } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement;
let root: Root | undefined;
beforeEach(() => {
  document.title = "Host";
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(() => { if (root) act(() => root!.unmount()); root = undefined; host.remove(); vi.unstubAllGlobals(); });

describe("the page title", () => {
  it("is left alone by mount, which isolates its element", async () => {
    const handle = mount(host, new Scene());
    await act(async () => { await handle.ready; });
    expect(host.childElementCount).toBeGreaterThan(0);
    expect(document.title).toBe("Host");
    expect(host.style.isolation).toBe("isolate");
    act(() => { handle.unmount(); });
  });
  it("is left alone by AstraeusScene, whose wrapper is isolated", async () => {
    root = createRoot(host);
    await act(async () => { root!.render(createElement(AstraeusScene, { scene: new Scene() })); await Promise.resolve(); });
    await act(async () => { await new Promise((done) => setTimeout(done, 0)); });
    expect(host.firstElementChild!.childElementCount).toBeGreaterThan(0);
    expect(document.title).toBe("Host");
    expect((host.firstElementChild as HTMLElement).style.isolation).toBe("isolate");
  });
  it("is still written by App on its own, and not when writeTitle is false", async () => {
    const definition = { ...syntheticDefinition, label: "Made-up survey" };
    root = createRoot(host);
    await act(async () => { root!.render(createElement(App, { definition, writeTitle: false })); });
    expect(document.title).toBe("Host");
    await act(async () => { root!.render(createElement(App, { definition })); });
    expect(document.title).toBe("Made-up survey · Astraeus");
  });
});

describe("an Escape the host already handled", () => {
  let m: Mounted;
  afterEach(() => { m.unmount(); });
  const hostTakesEscape = () => {
    const take = (event: Event) => event.preventDefault();
    window.addEventListener("keydown", take, true);
    return () => window.removeEventListener("keydown", take, true);
  };
  const panels = syntheticDefinition.experience.storyPanels!.panels;

  it("leaves an open story panel open, and an unprevented one closes it", () => {
    m = mountShell();
    m.requestPanel(panels[0].id);
    const release = hostTakesEscape();
    pressKey(document, "Escape");
    expect(m.container.querySelector(".story-panel")).not.toBeNull();
    release();
    pressKey(document, "Escape");
    expect(m.container.querySelector(".story-panel")).toBeNull();
  });
  it("leaves an open phone drawer open, and an unprevented one closes it", () => {
    m = mountShell({ phone: true });
    press($(m.container, "button.controls-pill"));
    const open = () => $(m.container, "#controls-drawer").getAttribute("data-open") === "true";
    const release = hostTakesEscape();
    pressKey(document, "Escape");
    expect(open()).toBe(true);
    release();
    pressKey(document, "Escape");
    expect(open()).toBe(false);
  });
  it("leaves an open switch panel open, and an unprevented one closes it", () => {
    m = mountShell({ displaySwitches: [{ id: "labels", label: "Labels", place: "panel", on: true, onToggle: () => undefined }] });
    press($(m.container, ".switch-panel-toggle"));
    const hidden = () => $(m.container, ".switch-panel").hasAttribute("hidden");
    const release = hostTakesEscape();
    pressKey(document, "Escape");
    expect(hidden()).toBe(false);
    release();
    pressKey(document, "Escape");
    expect(hidden()).toBe(true);
  });
});
