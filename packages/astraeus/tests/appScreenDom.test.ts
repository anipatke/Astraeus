// @vitest-environment happy-dom
// The main app screen (App.tsx) on the pretend page. The 3D scene component is replaced by a stand-in that records the controls the page hands it
// (a full WebGL canvas cannot run here); everything else is real: the shell, the clock, the address parsing and the lazily loaded Developer tools.
// The tests press the page's own controls and read the live controls the scene would see, plus what the page then shows.
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sceneProps = vi.hoisted(() => ({ latest: null as null | { controls: import("../src/app/AstraeusScene").SceneControls; scaleId: string; runtime: import("../src/app/AstraeusScene").SceneRuntime } }));
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: NonNullable<typeof sceneProps.latest>) => { sceneProps.latest = props; return createElement("div", { "data-testid": "scene", "data-scale": props.scaleId }); },
}));
const stars = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("../src/assets/sky", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/assets/sky")>()), loadStarCatalogue: stars.load }));

import { App, hiddenLabelsFrom, loopFromSearch } from "../src/app/App";
import { syntheticBareDefinition, syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { viewUpVector } from "../src/app/viewUp";
import type { ExperienceDefinition } from "../src/app/experienceDefinition";
import { $, byLabel, change as changeInput, press, pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;
const controls = () => sceneProps.latest!.controls;
/** Opens the page at an address, as a visitor or a copied link does. */
const visit = (search: string) => window.history.replaceState(null, "", `/app.html${search}`);
async function open(definition: ExperienceDefinition = syntheticDefinition, onOpenAddress?: (address: string) => void): Promise<void> {
  await act(async () => { root.render(createElement(App, { definition, ...(onOpenAddress === undefined ? {} : { onOpenAddress }) })); });
}
const button = (name: string | RegExp) => [...container.querySelectorAll("button")].find((b) => (typeof name === "string" ? b.textContent === name : name.test(b.textContent ?? "")))!;
/** Lets the on-demand panels a press just asked for arrive. */
async function settle(): Promise<void> {
  for (let tries = 0; tries < 100 && (container.querySelector(".developer-loading") !== null || tries === 0); tries += 1) await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
}
async function openDeveloper(): Promise<void> {
  press(byLabel(container, "Developer mode"));
  // The panels are loaded on demand: wait for the chunk, as a visitor waits for the note to go.
  for (let tries = 0; tries < 100 && container.querySelector(".developer-loading") !== null; tries += 1) await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
  expect(container.querySelector(".developer-loading")).toBeNull();
}

beforeEach(() => {
  pretendScreen({});
  stars.load.mockResolvedValue(null);
  sceneProps.latest = null;
  visit("");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.useRealTimers(); visit(""); });

describe("address helpers", () => {
  it("starts the labels hidden for objects that opt out, then lets the address turn each on or off and ignores malformed parts", () => {
    const objects = [{ id: "a", showLabel: false }, { id: "b" }, { id: "c", showLabel: true }];
    expect([...hiddenLabelsFrom("", objects)]).toEqual(["a"]);
    expect([...hiddenLabelsFrom("?labels=a:on,b:off,c:maybe,:off,d", objects)].sort()).toEqual(["b"]);
  });
  it("reads ?loop=on and ?loop=off over the experience's own setting", () => {
    expect([loopFromSearch("?loop=on", false), loopFromSearch("?loop=off", true), loopFromSearch("?loop=x", true), loopFromSearch("", false)]).toEqual([true, false, true, false]);
  });
});

describe("opening the screen", () => {
  it("names the page after the experience, mounts the shell around the scene and hands the scene its starting controls", async () => {
    await open({ ...syntheticDefinition, label: "Made-up survey" });
    expect(document.title).toBe("Made-up survey · Astraeus");
    expect($(container, '[data-testid="scene"]').parentElement!.className).toBe("canvas-host");
    expect(controls()).toMatchObject({ loop: false, cameraRequest: null, showAnchorLabels: false, illuminateAll: expect.any(Boolean), selectedObjectId: expect.any(String) });
    expect(controls().storyMarkers!.length).toBeGreaterThan(0);
    expect(controls().labelObjects.map((o) => o.id)).toContain("survey-marker");
    expect(sceneProps.latest!.runtime.bodies).toEqual(["earth", "moon"]);
  });

  it("lets the address set the starting loop, hidden labels, up direction, sky and feature-marker width", async () => {
    visit("?loop=on&labels=survey-marker:off&up=ecliptic&featurepx=120&sky=off");
    await open();
    expect(controls().loop).toBe(true);
    expect(controls().hiddenLabels!.has("survey-marker")).toBe(true);
    expect(controls().featureMinBodyPx).toBe(120);
    expect(sceneProps.latest!.runtime.sky!.visible).toBe(false);
    expect(controls().up).toEqual(viewUpVector("ecliptic"));
    expect(controls().up).not.toEqual(viewUpVector("equatorial"));
  });

  it("starts at the scale and camera view the address names", async () => {
    visit("?view=moon,30,10,5");
    await open();
    expect(controls().startView).toEqual({ focus: "moon", azimuthDeg: 30, elevationDeg: 10, distance: 5 });
  });

  it("mounts a scene that has no composition", async () => {
    await open(syntheticBareDefinition);
    expect(sceneProps.latest!.runtime.bodies).toEqual([]);
    expect(controls().storyMarkers!.length).toBeGreaterThan(0);
  });
});

describe("what the shell's controls do to the scene and the clock", () => {
  it("plays and pauses the clock from the timeline button and changes its rate from the speed picker", async () => {
    await open();
    const clock = sceneProps.latest!.runtime.clock;
    const startedPlaying = clock.playing;
    press(byLabel(container, startedPlaying ? "Pause playback" : "Play playback"));
    expect(clock.playing).toBe(!startedPlaying);
    expect(byLabel(container, startedPlaying ? "Play playback" : "Pause playback")).toBeTruthy();
    press(byLabel(container, startedPlaying ? "Play playback" : "Pause playback"));
    expect(clock.playing).toBe(startedPlaying);
    const speed = byLabel(container, "Playback speed") as HTMLSelectElement;
    const other = [...speed.options].map((o) => o.value).find((v) => Number(v) !== clock.snapshot().rate)!;
    changeInput(speed, other);
    expect(clock.snapshot().rate).toBe(Number(other));
  });

  it("sends a camera preset to the scene, and the chosen object to the scene's selection", async () => {
    await open();
    const picker = $(container, "select.object-picker") as HTMLSelectElement;
    changeInput(picker, "moon");
    expect(controls().selectedObjectId).toBe("moon");
    const preset = [...container.querySelectorAll<HTMLButtonElement>("button")].find((b) => /view|focus|follow|reset/i.test(b.textContent ?? b.title));
    expect(preset).toBeDefined();
    press(preset!);
    expect(controls().cameraRequest).not.toBeNull();
  });

  it("hears a story marker, a feature marker and a tapped object from the scene and acts on each", async () => {
    await open();
    const panelId = controls().storyMarkers![0]!.panelId;
    await act(async () => { controls().onStoryMarker!(panelId); });
    expect(controls().openStoryPanelId).toBe(panelId);
    await act(async () => { controls().onPickObject!("moon"); });
    expect(($(container, "select.object-picker") as HTMLSelectElement).value).toBe("moon");
    expect(controls().selectedObjectId).toBe("moon");
    expect(() => controls().onFeatureMarker!("moon:none")).not.toThrow();
  });

  it("opens another experience in place when the entry gave a way to, and calls the switch with the address", async () => {
    const open_ = vi.fn();
    await open({ ...syntheticDefinition, switcher: { label: "Version", param: "v", options: [{ label: "Alpha", value: "a", active: true }, { label: "Beta", value: "b", active: false }] } }, open_);
    press(button("Beta"));
    expect(open_).toHaveBeenCalledTimes(1);
    expect(new URL(open_.mock.calls[0]![0] as string, "http://localhost/").searchParams.get("v")).toBe("b");
  });
});

describe("the Developer tools", () => {
  it("stay unloaded until opened, then show a loading note, then the folds with the first open", async () => {
    await open();
    expect(container.querySelector(".hud")).toBeNull();
    expect(container.querySelector("#developer-tools")!.hasAttribute("hidden")).toBe(true);
    await openDeveloper();
    expect(container.querySelector("#developer-tools")!.hasAttribute("hidden")).toBe(false);
    expect(container.querySelector(".developer-heading h2")!.textContent).toBe("Developer tools");
    const titles = [...container.querySelectorAll(".dev-group")].map((g) => g.querySelector("summary, h3, button")?.textContent);
    expect(titles.join("|")).toMatch(/Camera and view/);
    expect(titles.join("|")).toMatch(/Under the hood/);
  });

  it("writes camera and loop choices to the scene's controls", async () => {
    await open();
    await openDeveloper();
    press(button(/Planets' plane/));
    expect(button(/Planets' plane/).getAttribute("aria-pressed")).toBe("true");
    expect(controls().up).toEqual(viewUpVector("ecliptic"));
    press(button("Loop playback"));
    expect(controls().loop).toBe(true);
    expect(button("Loop playback").getAttribute("aria-pressed")).toBe("true");
    const marker = container.querySelector<HTMLInputElement>('input[aria-label="Body marker threshold"]')!;
    changeInput(marker, "7");
    expect(controls().bodyMarker.minSpherePx).toBe(7);
    expect($(container, '[data-testid="body-marker-value"]').textContent).toBe("7.0");
  });

  it("changes the pause and automatic-opening of story panels and the timeline glow on the page", async () => {
    await open();
    await openDeveloper();
    press(button("Timeline and stories")); // folds start closed but the first
    press(button("Phone layout"));
    await settle();
    const glow = container.querySelector<HTMLInputElement>('input[aria-label="Timeline glow thickness"]')!;
    changeInput(glow, "9");
    expect($(container, '[data-testid="glow-thickness-value"]').textContent).toBe("9.0");
    const auto = button("Open panels automatically");
    const wasAuto = auto.getAttribute("aria-pressed");
    press(auto);
    expect(button("Open panels automatically").getAttribute("aria-pressed")).toBe(wasAuto === "true" ? "false" : "true");
    changeInput(container.querySelector<HTMLInputElement>('input[aria-label="Story panel pause"]')!, "3");
    expect($(container, '[data-testid="story-pause-value"]').textContent).toBe("3.0");
    const phone = container.querySelector<HTMLInputElement>('input[aria-label="Phone drawer animation"]')!;
    changeInput(phone, "300");
    expect($(container, '[data-testid="phone-animation-value"]').textContent).toBe("300");
    press(button("Reset phone layout"));
    expect($(container, '[data-testid="phone-animation-value"]').textContent).not.toBe("300");
  });

  it("copies the view link once the scene has read a view, shows it, and says when the clipboard refused", async () => {
    await open();
    await openDeveloper();
    const clipboard = (writeText: () => Promise<void>) => Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    clipboard(() => Promise.resolve());
    await act(async () => { button("Copy view link").click(); await Promise.resolve(); });
    expect(container.querySelector('[data-testid="view-link"]')).toBeNull(); // no view read yet: nothing to copy
    controls().viewReadout = { focus: "earth", azimuthDeg: 12, elevationDeg: 3, distance: 9 };
    await act(async () => { button("Copy view link").click(); await Promise.resolve(); await Promise.resolve(); });
    const link = container.querySelector<HTMLInputElement>('[data-testid="view-link"]')!;
    expect(link.value).toContain("view=earth");
    expect(container.textContent).toContain("Copied to the clipboard.");
    expect(window.location.search).toContain("view=earth");
    clipboard(() => Promise.reject(new Error("no")));
    await act(async () => { button("Copy view link").click(); await Promise.resolve(); await Promise.resolve(); });
    expect(container.textContent).toContain("Clipboard unavailable");
  });

  it("collects frame timing while open, polls the scene's readouts, and stops when closed", async () => {
    vi.useFakeTimers();
    await open();
    expect(controls().frameStats).toBeNull();
    press(byLabel(container, "Developer mode"));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(controls().frameStats).not.toBeNull();
    controls().viewReadout = { focus: "earth", azimuthDeg: 1, elevationDeg: 2, distance: 3 };
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    expect($(container, '[data-testid="view-values"]').textContent).toContain("earth,1,2,3");
    press(byLabel(container, "Developer mode"));
    expect(controls().frameStats).toBeNull();
  });

  it("wraps the clock inside the experience's window while looping", async () => {
    vi.useFakeTimers();
    visit("?loop=on");
    await open();
    const { clock, loopWindow } = sceneProps.latest!.runtime;
    clock.seek(loopWindow!.endUtcMs + 3_600_000);
    await act(async () => { await vi.advanceTimersByTimeAsync(150); });
    expect(clock.snapshot().timeUtcMs).toBeLessThanOrEqual(loopWindow!.endUtcMs);
  });
});
