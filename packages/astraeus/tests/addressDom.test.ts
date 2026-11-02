// @vitest-environment happy-dom
// The page address (O-052 T-223): a viewer reads and writes it only when the host turned `address` on. Made-up configurations (ARCH-03); the 3D scene is a stand-in
// that records the controls the page hands it, the shell, the clock and the address handling are real.
import { createElement, act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";

const sceneProps = vi.hoisted(() => ({ latest: null as null | { controls: import("../src/app/AstraeusScene").SceneControls } }));
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: NonNullable<typeof sceneProps.latest>) => { sceneProps.latest = props; return createElement("div", { "data-testid": "scene" }); },
}));
vi.mock("../src/assets/sky", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));
const prepared = vi.hoisted(() => ({ definition: null as null | import("../src/app/experienceDefinition").ExperienceDefinition }));
vi.mock("../src/api/prepared", () => ({ prepareScene: () => ({ definition: prepared.definition, ready: Promise.resolve() }) }));

import { Scene, earth, moon } from "astraeus";
import { App } from "../src/app/App";
import { AstraeusScene as HostScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { press, pretendScreen, drawn, byLabel } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const LINKED_T = "2026-03-01T00:20:00.000Z";
const MIN = 60_000;
const samples = (x: number) => [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [x + i * 1_000, 0, 0], velocityKmS: [1, 0, 0] }));
const sceneWithViews = () => new Scene().addBody(earth).addBody(moon)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: samples(10_000) })
  .addTrajectory({ id: "pb", label: "Probe B", center: "earth", samples: samples(20_000) })
  .setViews([{ id: "a", label: "View A", paths: ["pa"] }, { id: "b", label: "View B", paths: ["pb"] }], { place: "top-bar" });
const definition = sceneWithViews().toDefinition();

let container: HTMLElement;
let root: Root;
const controls = () => sceneProps.latest!.controls;
const visit = (search: string) => window.history.replaceState(null, "", `/page.html${search}`);
const open = async (address?: boolean) => { await act(async () => { root.render(createElement(App, { definition, developerTools: true, ...(address === undefined ? {} : { address }) })); }); };
const pressed = () => [...container.querySelectorAll<HTMLElement>("[data-view-id]")].filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.dataset.viewId);
const openDeveloper = async () => {
  press(byLabel(container, "Developer mode"));
  for (let tries = 0; tries < 100 && (container.querySelector(".developer-loading") !== null || tries === 0); tries += 1) await act(async () => { await new Promise((done) => setTimeout(done, 20)); });
};
const LINK = "?view=earth,40,20,5&t=" + LINKED_T + "&scale=readable-scale&up=ecliptic&show=b&stars=3&milkyway=off&sky=off&labels=earth:off&loop=on&markerpx=9&featurepx=7&loadfade=2.5";

beforeEach(() => {
  pretendScreen({});
  prepared.definition = definition;
  sceneProps.latest = null;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); visit(""); });

describe("a viewer on a host page's address", () => {
  it("by default ignores every parameter, leaves the address unchanged, never writes it and offers no copy-link button", async () => {
    visit(LINK);
    const before = window.location.href;
    const replace = vi.spyOn(window.history, "replaceState");
    await open();
    const c = controls();
    expect(c.startView).toBeUndefined();
    expect(c.up).toEqual([0, 1, 0]);
    expect(c.loop).toBe(false);
    expect(c.loadFadeSeconds).toBe(0.6);
    expect(c.bodyMarker.minSpherePx).not.toBe(9);
    expect(c.featureMinBodyPx).not.toBe(7);
    expect(c.hiddenLabels!.has("earth")).toBe(false);
    expect(pressed()).toEqual(["a"]);
    expect(container.querySelector('[data-testid="scene"]')).not.toBeNull();
    await openDeveloper();
    expect([...container.querySelectorAll("button")].some((b) => b.textContent === "Copy view link")).toBe(false);
    expect(replace).not.toHaveBeenCalled();
    expect(window.location.href).toBe(before);
  });

  it("with address on reads them", async () => {
    visit(LINK);
    await open(true);
    const c = controls();
    expect(c.startView).toMatchObject({ focus: "earth", azimuthDeg: 40, elevationDeg: 20, distance: 5 });
    expect(c.up).not.toEqual([0, 1, 0]);
    expect(c.loop).toBe(true);
    expect(c.loadFadeSeconds).toBe(2.5);
    expect(c.bodyMarker.minSpherePx).toBe(9);
    expect(c.featureMinBodyPx).toBe(7);
    expect(c.hiddenLabels!.has("earth")).toBe(true);
    expect(c.showMilkyWay).toBe(false);
    expect(pressed()).toEqual(["b"]);
  });

  it("with address on, the time in the address opens the clock there; without it the scene's own start stands", async () => {
    visit("?t=" + LINKED_T);
    await open(true);
    const linked = container.textContent;
    expect(linked).toContain("00:20");
    act(() => root.unmount());
    root = createRoot(container);
    await open();
    expect(container.textContent).not.toContain("00:20");
  });

  it("writes show=<view id> into the copied link, and opening it reads the view back", async () => {
    visit("");
    Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.resolve() }, configurable: true });
    await open(true);
    await act(async () => { press([...container.querySelectorAll<HTMLElement>("[data-view-id]")].find((b) => b.dataset.viewId === "b")!); });
    await openDeveloper();
    controls().viewReadout = { focus: "earth", azimuthDeg: 12, elevationDeg: 3, distance: 9 };
    await act(async () => { [...container.querySelectorAll("button")].find((b) => b.textContent === "Copy view link")!.click(); await Promise.resolve(); await Promise.resolve(); });
    const link = new URL(window.location.href);
    expect(link.searchParams.get("show")).toBe("b");
    act(() => root.unmount());
    root = createRoot(container);
    visit(link.search);
    await open(true);
    expect(pressed()).toEqual(["b"]);
    expect(controls().viewHidden!.objects.has("pa")).toBe(true);
    expect(controls().viewHidden!.objects.has("pb")).toBe(false);
  });

  it("falls back to the scene's start for an unknown show id, with no error", async () => {
    visit("?show=nope");
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await open(true);
    expect(pressed()).toEqual(["a"]);
    expect(errors).not.toHaveBeenCalled();
  });

  it("leaves show= out of a link from a scene without views", async () => {
    const { viewLinkSearch } = await import("../src/app/viewLink");
    const view = { focus: "earth", azimuthDeg: 1, elevationDeg: 2, distance: 3 };
    expect(viewLinkSearch("", { view, scaleId: "s", up: "ecliptic", timeUtcMs: T0 })).not.toContain("show=");
    expect(viewLinkSearch("", { view, scaleId: "s", up: "ecliptic", timeUtcMs: T0, show: "b" })).toContain("show=b");
  });
});

describe("the address option through mount and AstraeusScene", () => {
  it("mount: off by default, on when asked", async () => {
    visit(LINK);
    const host = document.createElement("div");
    document.body.append(host);
    const off = mount(host, new Scene());
    await drawn(off);
    expect(controls().startView).toBeUndefined();
    expect(off.view).toBe("a");
    act(() => { off.unmount(); });
    const on = mount(host, new Scene(), { address: true });
    await drawn(on);
    expect(controls().startView).toMatchObject({ focus: "earth" });
    expect(on.view).toBe("b");
    act(() => { on.unmount(); });
    host.remove();
  });

  it("AstraeusScene: off by default, on when asked", async () => {
    visit(LINK);
    const scene = new Scene();
    for (const [address, expected] of [[undefined, "a"], [true, "b"]] as const) {
      await act(async () => { root.render(createElement(HostScene, { scene, ...(address === undefined ? {} : { address }) })); await Promise.resolve(); });
      await act(async () => { await new Promise((done) => setTimeout(done, 0)); });
      expect(pressed()).toEqual([expected]);
      act(() => root.unmount());
      root = createRoot(container);
    }
  });
});
