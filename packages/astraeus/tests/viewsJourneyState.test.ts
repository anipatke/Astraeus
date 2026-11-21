// @vitest-environment happy-dom
// The state and text checks of the browser step `journey-views.mjs` (O-086 T-387), proved without a browser on the made-up views scene the dev page opens (`?experience=synthetic-views`):
// the bar's three views in order and the opening view, then for each view what the Object list, the timeline's events and its story panel markers hold, and that a visitor's switch leaves the clock and the speed
// where they were. The 3D scene is a stand-in; the shell, the clock and the lists are real. What needs a real browser stays in the step: the view choice's fit and button size, the camera's stay and follow
// readouts and the drawn path of each probe. The host's change records (a visitor's switch heard as the visitor's, setView as the host's) are proved in viewerHostDom.test.ts.
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sceneProps = vi.hoisted(() => ({
  latest: null as null | { controls: import("../src/app/AstraeusScene").SceneControls },
}));
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: NonNullable<typeof sceneProps.latest>) => {
    sceneProps.latest = props;
    return createElement("div", { "data-testid": "scene" });
  },
}));
vi.mock("../src/assets/sky", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/assets/sky")>()),
  loadStarCatalogue: vi.fn().mockResolvedValue(null),
}));

import { App } from "../src/app/App";
import { press, pretendScreen } from "./domSetup";
import { syntheticViewsDefinition } from "./synthetic/syntheticViewsDefinition";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** What each view shows, as the browser step lists it (ids of the Object list, the timeline's events, the panel markers). */
const IN_VIEW = {
  a: {
    bodies: ["earth", "probe-a"],
    hiddenBodies: ["probe-b"],
    events: ["Probe A event", "Shared event"],
    hiddenEvents: ["Probe B event"],
    panels: ["panel-a", "panel-shared"],
  },
  b: {
    bodies: ["earth", "probe-b"],
    hiddenBodies: ["probe-a"],
    events: ["Probe B event", "Shared event"],
    hiddenEvents: ["Probe A event"],
    panels: ["panel-b", "panel-shared"],
  },
  both: {
    bodies: ["earth", "probe-a", "probe-b"],
    hiddenBodies: [],
    events: ["Probe A event", "Probe B event", "Shared event"],
    hiddenEvents: [],
    panels: ["panel-a", "panel-b", "panel-shared"],
  },
} as const;

let container: HTMLElement;
let root: Root;
const open = async () => {
  await act(async () => {
    root.render(createElement(App, { definition: syntheticViewsDefinition }));
  });
  // The viewer opens playing; the browser step pauses it first (ensurePaused), so the clock can be compared exactly.
  await act(async () => {
    press(container.querySelector<HTMLElement>(".timeline-play")!);
  });
};
const viewButtons = () => [...container.querySelectorAll<HTMLElement>("[data-view-choice] button[data-view-id]")];
const choose = async (id: string) => {
  await act(async () => {
    press(viewButtons().find((button) => button.dataset.viewId === id)!);
  });
};
const shownView = () => viewButtons().find((button) => button.getAttribute("aria-pressed") === "true")?.dataset.viewId;
const bodyOptions = () =>
  [...container.querySelectorAll<HTMLOptionElement>("select.object-picker option")].map((option) => option.value);
const eventRows = () =>
  [...container.querySelectorAll(".timeline-expanded li button")].map((row) => row.textContent ?? "").join("\n");
const panelMarkerIds = () =>
  [...container.querySelectorAll(".timeline-panel-marker")]
    .map((marker) => marker.getAttribute("data-panel-id"))
    .sort();
const clock = () =>
  (
    sceneProps.latest as unknown as { runtime: { clock: { snapshot(): { timeUtcMs: number; rate: number } } } }
  ).runtime.clock.snapshot();

beforeEach(() => {
  pretendScreen({});
  window.history.replaceState(null, "", "/app.html");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("the made-up views scene, as the views browser step reads it", () => {
  it("offers the three views in order, labelled, and opens on the first", async () => {
    await open();
    expect(viewButtons().map((button) => [button.dataset.viewId, button.textContent?.trim()])).toEqual([
      ["a", "Probe A"],
      ["b", "Probe B"],
      ["both", "Both"],
    ]);
    expect(shownView()).toBe("a");
  });

  it.each(["b", "both", "a"] as const)(
    "switching to %s shows its objects, events and panel markers, and leaves the clock and the speed",
    async (id) => {
      await open();
      const before = clock();
      await choose(id);
      const want = IN_VIEW[id];
      expect(shownView()).toBe(id);
      const menu = bodyOptions();
      for (const body of want.bodies) expect(menu, `the Object list holds ${body}`).toContain(body);
      for (const body of want.hiddenBodies) expect(menu, `the Object list leaves out ${body}`).not.toContain(body);
      const rows = eventRows();
      for (const event of want.events) expect(rows, `the timeline lists "${event}"`).toContain(event);
      for (const event of want.hiddenEvents) expect(rows, `the timeline leaves out "${event}"`).not.toContain(event);
      expect(panelMarkerIds()).toEqual([...want.panels].sort());
      expect(clock()).toEqual(before);
    },
  );

  it("opens on view a with the first view's objects, events and panel markers", async () => {
    await open();
    const want = IN_VIEW.a;
    const menu = bodyOptions();
    for (const body of want.bodies) expect(menu).toContain(body);
    for (const body of want.hiddenBodies) expect(menu).not.toContain(body);
    expect(eventRows()).not.toContain("Probe B event");
    expect(panelMarkerIds()).toEqual([...want.panels].sort());
  });
});
