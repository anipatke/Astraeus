// @vitest-environment happy-dom
// The view choice in the viewer (O-051 T-219), on made-up configurations (ARCH-03): two made-up paths in two views plus shared bodies. The 3D scene is a stand-in
// that records the controls the page hands it; the shell, the clock and the lists are real. Pixel layout at 375x667 and 1280x720 is the browser step's; here
// the choice is shown where `place` says, in the phone drawer too.
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sceneProps = vi.hoisted(() => ({ latest: null as null | { controls: import("../src/app/AstraeusScene").SceneControls } }));
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: NonNullable<typeof sceneProps.latest>) => { sceneProps.latest = props; return createElement("div", { "data-testid": "scene" }); },
}));
vi.mock("../src/assets/sky", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/assets/sky")>()), loadStarCatalogue: vi.fn().mockResolvedValue(null) }));

import { Scene, earth, moon } from "astraeus";
import { App } from "../src/app/App";
import { press, pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const samples = (x: number) => [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [x + i * 1_000, 0, 0], velocityKmS: [1, 0, 0] }));
const panel = (id: string, object: string) => ({ id, at: { utc: "2026-03-01T00:05:00Z" }, object, title: `Title ${id}`, body: ["A line."], badge: "observed", sources: ["A made-up source"] });
const definitionAt = (place: "top-bar" | "panel") => new Scene().addBody(earth).addBody(moon)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: samples(10_000) })
  .addTrajectory({ id: "pb", label: "Probe B", center: "earth", samples: samples(20_000) })
  .addEvents([{ id: "ea", label: "A event", time: T0 + 5 * MIN }, { id: "eb", label: "B event", time: T0 + 6 * MIN }, { id: "es", label: "Shared event", time: T0 + 7 * MIN }])
  .addStoryPanels({ panels: [panel("qa", "pa"), panel("qb", "pb"), panel("qs", "earth")] })
  .setViews([
    { id: "a", label: "View A", paths: ["pa"], events: ["ea"], panels: ["qa"] },
    { id: "b", label: "View B", paths: ["pb"], events: ["eb"], panels: ["qb"] },
    { id: "both", label: "Both", paths: ["pa", "pb"], events: ["ea", "eb"], panels: ["qa", "qb"] },
  ], { place })
  .toDefinition();

let container: HTMLElement;
let root: Root;
const controls = () => sceneProps.latest!.controls;
const open = async (place: "top-bar" | "panel" = "top-bar") => { await act(async () => { root.render(createElement(App, { definition: definitionAt(place) })); }); };
const viewButton = (label: string) => [...container.querySelectorAll<HTMLElement>("[data-view-id]")].find((b) => b.textContent === label)!;
const choose = async (label: string) => { await act(async () => { press(viewButton(label)); }); };
const hiddenObjects = () => [...controls().viewHidden!.objects].sort();
const hiddenPanels = () => [...controls().viewHidden!.panels].sort();
const markerLabels = () => [...container.querySelectorAll("[data-event-id], .timeline-marker, [data-marker-key]")].map((el) => el.getAttribute("aria-label") ?? "");

beforeEach(() => {
  pretendScreen({});
  window.history.replaceState(null, "", "/app.html");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });

describe("the view choice", () => {
  it("shows one pressed button per view in the bar, the opening view pressed", async () => {
    await open();
    const group = container.querySelector('.top-bar [role="group"][aria-label="View"]')!;
    expect([...group.querySelectorAll("button")].map((b) => [b.textContent, b.getAttribute("aria-pressed")])).toEqual([["View A", "true"], ["View B", "false"], ["Both", "false"]]);
    expect(group.querySelector("button")!.className).toContain("switch-option");
  });

  it("shows the choice as rows in the switch panel when placed there, and not in the bar", async () => {
    await open("panel");
    expect(container.querySelector('.top-bar [aria-label="View"]')).toBeNull();
    expect(container.querySelector(".switch-panel")!.querySelectorAll("[data-view-id]")).toHaveLength(3);
    await choose("View B");
    expect(viewButton("View B").getAttribute("aria-pressed")).toBe("true");
  });

  it("shows the choice in the phone drawer too", async () => {
    pretendScreen({ phone: true });
    await open();
    expect(container.querySelector(".controls-drawer [data-view-choice]")).not.toBeNull();
    expect(container.querySelectorAll(".controls-drawer [data-view-id]")).toHaveLength(3);
  });

  it("hands the scene one hidden set per view, with shared bodies never hidden", async () => {
    await open();
    expect(hiddenObjects()).toEqual(["pb"]);
    expect(hiddenPanels()).toEqual(["qb"]);
    await choose("View B");
    expect(hiddenObjects()).toEqual(["pa"]);
    expect(hiddenPanels()).toEqual(["qa"]);
    await choose("Both");
    expect(hiddenObjects()).toEqual([]);
    expect(hiddenPanels()).toEqual([]);
  });

  it("lists only the view's objects in the object menu, and filters events and story panels the same way", async () => {
    await open();
    const objectNames = () => [...container.querySelectorAll<HTMLElement>("[data-object-id], option")].map((el) => el.getAttribute("data-object-id") ?? el.textContent ?? "").join(" ");
    expect(container.textContent).toContain("Probe A");
    expect(objectNames()).not.toContain("Probe B");
    await choose("View B");
    expect(objectNames()).toContain("Probe B");
    expect(objectNames()).not.toContain("Probe A");
    expect(container.innerHTML).not.toContain("A event");
    expect(markerLabels().join("|")).not.toContain("A event");
    expect(container.innerHTML).toContain("B event");
    expect(container.innerHTML).toContain("Shared event");
  });

  it("keeps time, speed and playing state across a switch", async () => {
    await open();
    // The clock readout and the speed choices (the text before the event list, which a view changes).
    const clockText = () => (container.querySelector(".timeline-bar")?.textContent ?? "").split("Playback rate")[0] + [...container.querySelectorAll("[aria-label^=\"Speed\"], [aria-pressed][data-rate]")].map((el) => el.getAttribute("aria-pressed")).join();
    const before = clockText();
    const playing = container.querySelector('[aria-label="Play"], [aria-label="Pause"]')?.getAttribute("aria-label");
    await choose("View B");
    await choose("Both");
    expect(clockText()).toBe(before);
    expect(container.querySelector('[aria-label="Play"], [aria-label="Pause"]')?.getAttribute("aria-label")).toBe(playing);
  });

  it("leaves a scene without views exactly as it was: no choice, nothing hidden", async () => {
    const { views: _views, ...plain } = definitionAt("top-bar");
    await act(async () => { root.render(createElement(App, { definition: plain })); });
    expect(container.querySelector("[data-view-choice]")).toBeNull();
    expect(controls().viewHidden!.objects.size).toBe(0);
    expect(controls().viewHidden!.panels.size).toBe(0);
  });
});

describe("a moon and its orbit line", () => {
  const moonScene = () => new Scene().addBody(earth).addBody(moon, { orbit: true })
    .setViews([{ id: "near", label: "Near", bodies: ["moon"] }, { id: "far", label: "Far", bodies: ["earth"] }, { id: "all", label: "All", bodies: ["moon", "earth"] }], { place: "top-bar" }).toDefinition();
  const openMoon = async () => { await act(async () => { root.render(createElement(App, { definition: moonScene() })); }); };
  it("hides the moon (so its label and pick target) only in the view without it, and shows it where it is shared", async () => {
    await openMoon();
    expect(hiddenObjects()).toEqual(["earth"]);
    await choose("Far");
    expect(hiddenObjects()).toContain("moon");
    expect(hiddenObjects()).not.toContain("earth");
    await choose("All");
    expect(hiddenObjects()).toEqual([]);
  });
});
