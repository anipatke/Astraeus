// @vitest-environment happy-dom
// O-089 T-420: one table of the paths that change the selected object, on both embedding paths (`mount`, `AstraeusScene`), through the real App and shell on a made-up scene (ARCH-03).
// Only the 3D canvas is a stand-in; it records the controls the page hands the scene, so each row reads what the scene would see. A row checks the handle's read, the `onSelect` reports (object and cause),
// the scene's `selectedObjectId`, the object picker's value and whether the object's card is open.
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

import { earth } from "../src/api/bodies";
import { AstraeusScene } from "../src/api/AstraeusScene";
import { mount } from "../src/api/mount";
import { Scene } from "../src/api/scene";
import type { ViewerHandle } from "../src/api/viewerHandle";
import type { SelectionChange } from "../src/api/viewerSelection";
import { createSelection } from "../src/shell/selection/selection";
import { $, byLabel, change, drawn, mountShell, press, pretendScreen } from "./domSetup";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const DAY = 86_400_000;
const provenance = {
  sourceType: "observed",
  sources: ["A made-up source"],
  accuracy: "None claimed.",
  notes: "Made up.",
} as const;
/** View a shows probe A, view b probe B (its rule frames and selects B), view c probe B with the camera staying. The kite is a sky figure; "Rise" is an event about probe A; two steps select probe A and the kite. */
const makeScene = () =>
  new Scene()
    .addBody(earth)
    .addTrajectory({
      id: "pa",
      label: "Probe A",
      center: "earth",
      samples: [0, 1, 2, 3].map((i) => ({
        time: T0 + i * 10 * MIN,
        positionKm: [10_000 + i * 1_000, 0, 0],
        velocityKmS: [1, 0, 0],
      })),
    })
    .addTrajectory({
      id: "pb",
      label: "Probe B",
      center: "earth",
      samples: [0, 100].map((i) => ({
        time: T0 + i * DAY,
        positionKm: [20_000 + i * 10, 0, 0],
        velocityKmS: [1, 0, 0],
      })),
    })
    .addSkyFigures([
      {
        id: "kite",
        label: "The Kite",
        segments: [
          [
            { raDeg: 10, decDeg: 20 },
            { raDeg: 20, decDeg: 30 },
          ],
        ],
      },
    ])
    .addEvents([{ id: "rise", label: "Rise", time: T0 + 20 * MIN, object: "pa" }])
    .addStoryPanels([
      { id: "s1", title: "One", body: "One.", provenance, object: "pa", select: true },
      { id: "s2", title: "Two", body: "Two.", provenance, object: "kite", select: true },
    ])
    .setViews(
      [
        { id: "a", label: "View A", objects: ["pa"] },
        { id: "b", label: "View B", objects: ["pb"], camera: { focus: "pb" } },
        { id: "c", label: "View C", objects: ["pb"] },
      ],
      { place: "top-bar" },
    )
    .setTimeline({ start: T0, end: T0 + 100 * DAY, rate: 86_400, rates: [60, 86_400] });

let host: HTMLElement;
let root: Root | undefined;
beforeEach(() => {
  pretendScreen({});
  vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  host = document.createElement("div");
  document.body.append(host);
  sceneProps.latest = null;
});
afterEach(() => {
  if (root) act(() => root!.unmount());
  root = undefined;
  host.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const controls = () => sceneProps.latest!.controls;
const picker = () => (byLabel(host, "Select object") as HTMLSelectElement).value;
const cardOpen = () => host.querySelector(".info-panel") !== null;
const settle = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });
const pick = (id: string) => change(byLabel(host, "Select object") as HTMLSelectElement, id);
const viewButton = (id: string) => press($(host, `[data-view-id="${id}"]`));

interface Seen {
  readonly selected: string | undefined;
  readonly heard: readonly (readonly [string | undefined, string])[];
  readonly scene: string;
  readonly picker: string;
  readonly card: boolean;
}
const seenNow = (handle: ViewerHandle, heard: SelectionChange[]): Seen => ({
  selected: handle.selected,
  heard: heard.map((c) => [c.object, c.cause]),
  scene: controls().selectedObjectId,
  picker: picker(),
  card: cardOpen(),
});
const paused = (handle: ViewerHandle, at = T0 + 5 * MIN) =>
  act(() => {
    handle.setPlaying(false);
    handle.setTime(at);
  });

type Row = {
  readonly name: string;
  readonly phone?: boolean;
  readonly run: (handle: ViewerHandle) => void | Promise<void>;
  readonly expected: Seen;
};
const focusSelected = () => press($(host, '[data-camera-preset*="focus"]'));
const nextStep = () => press($(host, ".story-panel-next"));
const goToRise = () => press($(host, "[aria-label='Go to Rise']"));
const ROWS: readonly Row[] = [
  {
    name: "menu choice",
    run: () => pick("pa"),
    expected: { selected: "pa", heard: [["pa", "visitor"]], scene: "pa", picker: "pa", card: true },
  },
  {
    name: "menu choice of a sky figure",
    run: () => pick("kite"),
    expected: { selected: "kite", heard: [["kite", "visitor"]], scene: "kite", picker: "kite", card: true },
  },
  {
    name: "scene pick",
    run: () => act(() => controls().onPickObject!("pa")),
    expected: { selected: "pa", heard: [["pa", "visitor"]], scene: "pa", picker: "pa", card: true },
  },
  {
    name: "scene pick on a phone",
    phone: true,
    run: () => act(() => controls().onPickObject!("pa")),
    expected: { selected: "pa", heard: [["pa", "visitor"]], scene: "pa", picker: "pa", card: false },
  },
  {
    name: "pick from a look-out camera (keepSky)",
    run: () => act(() => controls().onPickObject!("pa", { keepSky: true })),
    expected: { selected: "pa", heard: [["pa", "visitor"]], scene: "pa", picker: "pa", card: true },
  },
  {
    name: "sky figure tapped in the scene",
    run: () => act(() => controls().onPickObject!("kite")),
    expected: { selected: "kite", heard: [["kite", "visitor"]], scene: "kite", picker: "kite", card: true },
  },
  {
    name: "event Go to",
    run: () => goToRise(),
    expected: { selected: "pa", heard: [["pa", "visitor"]], scene: "pa", picker: "pa", card: true },
  },
  {
    name: "view switch that drops the object",
    run: () => {
      pick("pa");
      viewButton("c");
    },
    expected: {
      selected: "earth",
      heard: [
        ["pa", "visitor"],
        ["earth", "visitor"],
      ],
      scene: "earth",
      picker: "earth",
      card: false,
    },
  },
  {
    name: "view switch with a framing rule",
    run: () => {
      pick("pa");
      focusSelected();
      viewButton("b");
    },
    expected: {
      selected: "pb",
      heard: [
        ["pa", "visitor"],
        ["earth", "visitor"],
        ["pb", "visitor"],
      ],
      scene: "pb",
      picker: "pb",
      card: false,
    },
  },
  {
    name: "story step select (wide)",
    run: () => nextStep(),
    expected: { selected: "kite", heard: [], scene: "kite", picker: "kite", card: true },
  },
  {
    name: "story step select (phone)",
    phone: true,
    run: () => nextStep(),
    expected: { selected: "kite", heard: [], scene: "kite", picker: "kite", card: false },
  },
  {
    name: "host setSelected id",
    run: (h) => act(() => h.setSelected("pa")),
    expected: { selected: "pa", heard: [["pa", "host"]], scene: "pa", picker: "pa", card: true },
  },
  {
    name: "host setSelected, the same id",
    run: (h) => {
      act(() => h.setSelected("pa"));
      act(() => h.setSelected("pa"));
    },
    expected: { selected: "pa", heard: [["pa", "host"]], scene: "pa", picker: "pa", card: true },
  },
  {
    name: "host setSelected clear",
    run: (h) => {
      act(() => h.setSelected("pa"));
      act(() => h.setSelected(undefined));
    },
    expected: {
      selected: undefined,
      heard: [
        ["pa", "host"],
        [undefined, "host"],
      ],
      scene: "",
      picker: "earth",
      card: false,
    },
  },
];

const PATHS = [
  [
    "mount",
    (): { handle: ViewerHandle; stop: () => void; ready: Promise<void> } => {
      const m = mount(host, makeScene());
      return { handle: m, stop: () => m.unmount(), ready: m.ready };
    },
  ],
  [
    "AstraeusScene",
    (): { handle: ViewerHandle; stop: () => void; ready: Promise<void> } => {
      let got: ViewerHandle | undefined;
      root = createRoot(host);
      act(() =>
        root!.render(
          createElement(AstraeusScene, {
            scene: makeScene(),
            onReady: (h: ViewerHandle) => {
              got = h;
            },
          }),
        ),
      );
      const handle = new Proxy({} as ViewerHandle, { get: (_t, key) => Reflect.get(got!, key) });
      return {
        handle,
        stop: () => {
          act(() => root!.unmount());
          root = undefined;
        },
        ready: vi.waitFor(() => expect(got).toBeDefined()),
      };
    },
  ],
] as const;

describe.each(PATHS)("%s: who owns the selection", (_name, start) => {
  it.each(ROWS)("$name", async ({ run, expected, phone }) => {
    pretendScreen({ phone: phone === true });
    const { handle, stop, ready } = start();
    await drawn({ ready });
    paused(handle);
    pick("earth"); // every row starts from the same other object, card closed: the scene opens on pa
    press(byLabel(host, "Close information"));
    const heard: SelectionChange[] = [];
    handle.onSelect((c) => heard.push(c));
    await run(handle);
    await settle();
    expect(seenNow(handle, heard)).toEqual(expected);
    stop();
  });
});

describe.each(PATHS)("%s: the scene's read of the selection", (_name, start) => {
  it("is an own enumerable control that follows a host setSelected made while the clock is paused (the draw rule walks the controls with for...in)", async () => {
    const { handle, stop, ready } = start();
    await drawn({ ready });
    paused(handle);
    expect(Object.keys(controls())).toContain("selectedObjectId");
    const walked: string[] = [];
    for (const key in controls()) walked.push(key);
    expect(walked).toContain("selectedObjectId");
    act(() => handle.setSelected("earth"));
    expect(controls().selectedObjectId).toBe("earth");
    act(() => handle.setSelected("pa"));
    expect(controls().selectedObjectId).toBe("pa");
    stop();
  });
});

describe("the shell reads the store, not a prop", () => {
  it("a selection.ask made outside React (no prop change) moves the object picker to the new id and opens the card", () => {
    const selection = createSelection("earth");
    const m = mountShell({ selection });
    const select = () => byLabel(m.container, "Select object") as HTMLSelectElement;
    expect(select().value).toBe("earth");
    act(() => selection.ask("survey-marker", false));
    expect(select().value).toBe("survey-marker");
    expect(m.selected()).toBe("survey-marker");
    expect(m.container.querySelector(".info-panel")).not.toBeNull();
    act(() => selection.choose("earth", "visitor"));
    expect(select().value).toBe("earth");
    m.unmount();
  });
});
