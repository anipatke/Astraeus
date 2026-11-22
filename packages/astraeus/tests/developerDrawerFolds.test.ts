// @vitest-environment happy-dom
// The Developer drawer's folds on both embedding paths (O-089 T-418, TEST-01, TEST-03): `mount` and the React `AstraeusScene`, one row per made-up scene kind.
// Each row opens the drawer and pins the folds (ids and titles, in order), the fold open by default, every `data-testid` inside the drawer and the "Copy view link" button;
// then it moves one control per fold and reads the value from the scene's live controls (the scene component is a stand-in that records them), and closes the drawer.
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SceneControls } from "../src/app/AstraeusScene";

const sceneProps = vi.hoisted(() => ({ controls: null as null | import("../src/app/AstraeusScene").SceneControls }));
vi.mock("../src/app/AstraeusScene", () => ({
  AstraeusScene: (props: { controls: import("../src/app/AstraeusScene").SceneControls }) => {
    sceneProps.controls = props.controls;
    return createElement("div", { "data-testid": "scene" });
  },
}));
vi.mock("../src/assets/sky", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/assets/sky")>()),
  loadStarCatalogue: vi.fn().mockResolvedValue(null),
}));

import { Scene, earth, moon, saturn, type StoryPanelInput } from "astraeus";
import { mount } from "../src/api/mount";
import { AstraeusScene as ReactScene } from "../src/api/AstraeusScene";
import { pretendScreen } from "./domSetup";
import { waitForDeveloperDrawer } from "./helpers/developerDrawer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const made = {
  sourceType: "illustrative",
  sources: ["Made up"],
  accuracy: "None claimed.",
  notes: "Made up.",
} as const;
const panel = (id: string): StoryPanelInput => ({
  id,
  at: { time: T0 + 5 * MIN },
  title: `Title ${id}`,
  body: "A made-up line.",
  provenance: made,
});
const swarm = {
  id: "swarm",
  families: [{ id: "inner", label: "Inner swarm" }],
  provenance: made,
  members: [0, 1, 2].map((k) => ({
    id: `bit-${k}`,
    label: `Bit ${k}`,
    radiusKm: 4,
    family: "inner",
    elements: {
      semiMajorAxisKm: 30_000 + 4_000 * k,
      eccentricity: 0.05,
      inclinationDeg: 3,
      raanDeg: 20,
      argumentOfPeriapsisDeg: 40,
      trueAnomalyDeg: 10 + 30 * k,
    },
  })),
  centerGmKm3S2: 4.0e5,
};
const kite = {
  id: "kite",
  label: "The Kite",
  segments: [
    [
      { raDeg: 10, decDeg: 20 },
      { raDeg: 20, decDeg: 30 },
    ],
  ],
} as const;
const base = () => new Scene().setTime(T0).addBody(earth).addBody(moon);

const CAMERA = ["body-marker-value", "load-fade-value"];
const GLOW = [
  "glow-color-value",
  "glow-played-value",
  "glow-min-value",
  "glow-steady-value",
  "glow-curve-value",
  "glow-floor-value",
  "glow-thickness-value",
  "glow-halo-value",
];
const SKY = ["star-brightness-value", "milky-way-brightness-value"];
const LABELS = [
  "hover-brightness-value",
  "label-size-value",
  "label-font",
  "sky-colour-figure",
  "sky-colour-label",
  "sky-colour-boundary",
  "sky-colour-ecliptic",
  "sky-colour-equator",
  "sky-colour-traced",
  "sky-colour-faded",
  "sky-colour-selected",
];
const PHONE = [
  "phone-animation-value",
  "phone-controls-height-value",
  "phone-timeline-height-value",
  "phone-sheet-height-value",
  "phone-swipe-value",
];
const ORBIT = [
  "orbit-base-opacity-value",
  "orbit-end-fade-value",
  "orbit-arc-fraction-value",
  "orbit-arc-peak-value",
  "orbit-arc-exponent-value",
  "orbit-arc-segments-value",
  "orbit-arc-width-value",
  "orbit-arc-max-width-value",
  "orbit-zoom-boost-base-value",
  "orbit-zoom-boost-arc-value",
];
const MOON_SET = [
  "body-set-dot-px",
  "body-set-dot-color",
  "body-set-label-px",
  "body-set-orbit-opacity",
  "body-set-orbit-boost",
  "body-set-highlight-color",
  "body-set-highlight-gain",
  "body-set-family-inner",
];
const RINGS = ["d", "c", "b", "cassini", "a", "g"].flatMap((band) => [`ring-${band}-color`, `ring-${band}-opacity`]);
const FRAME = ["frame-rate"];

interface Kind {
  readonly name: string;
  readonly scene: () => Scene;
  readonly address: boolean;
  /** The folds in order as `id:title`, with the test ids each shows once every fold is open. */
  readonly folds: ReadonlyArray<readonly [string, readonly string[]]>;
  readonly copyButton: boolean;
}
const fold = (id: string, title: string, testIds: readonly string[]) => [`${id}:${title}`, testIds] as const;
const CAMERA_FOLD = fold("camera", "Camera and view", CAMERA);
const TIMELINE_FOLD = fold("timeline", "Timeline and stories", GLOW);
const SKY_FOLD = fold("sky-sun", "Sky and Sun", SKY);
const LABELS_FOLD = fold("labels", "Labels", LABELS);
const TAIL = [fold("phone-layout", "Phone layout", PHONE), fold("under-the-hood", "Under the hood", FRAME)];
const KINDS: readonly Kind[] = [
  {
    name: "plain",
    scene: base,
    address: false,
    folds: [CAMERA_FOLD, TIMELINE_FOLD, SKY_FOLD, LABELS_FOLD, ...TAIL],
    copyButton: false,
  },
  {
    name: "plain with the address option",
    scene: base,
    address: true,
    folds: [CAMERA_FOLD, TIMELINE_FOLD, SKY_FOLD, LABELS_FOLD, ...TAIL],
    copyButton: true,
  },
  {
    name: "orbit paths",
    scene: () => new Scene().setTime(T0).addBody(earth).addBody(moon, { orbit: true }),
    address: false,
    folds: [CAMERA_FOLD, TIMELINE_FOLD, fold("orbit-lines", "Orbit lines", ORBIT), SKY_FOLD, LABELS_FOLD, ...TAIL],
    copyButton: false,
  },
  {
    name: "body set",
    scene: () => base().addBodySet(swarm),
    address: false,
    folds: [
      CAMERA_FOLD,
      TIMELINE_FOLD,
      fold("moons-rings", "Moons and rings", MOON_SET),
      SKY_FOLD,
      LABELS_FOLD,
      ...TAIL,
    ],
    copyButton: false,
  },
  {
    name: "rings",
    scene: () => new Scene().setTime(T0).addBody(saturn),
    address: false,
    folds: [CAMERA_FOLD, TIMELINE_FOLD, fold("moons-rings", "Moons and rings", RINGS), SKY_FOLD, LABELS_FOLD, ...TAIL],
    copyButton: false,
  },
  {
    name: "sky figures",
    scene: () => base().addSkyFigures([kite]),
    address: false,
    folds: [CAMERA_FOLD, TIMELINE_FOLD, SKY_FOLD, LABELS_FOLD, ...TAIL],
    copyButton: false,
  },
  {
    name: "story panels",
    scene: () => base().addStoryPanels([panel("p1"), panel("p2")]),
    address: false,
    folds: [
      CAMERA_FOLD,
      fold("timeline", "Timeline and stories", [...GLOW, "story-pause-value"]),
      SKY_FOLD,
      LABELS_FOLD,
      ...TAIL,
    ],
    copyButton: false,
  },
];

/** One control per fold: what to move, and where the live controls (or, for the timeline glow, the page's readout) show it. */
interface Move {
  readonly fold: string;
  readonly act: (drawer: HTMLElement) => void;
  readonly read: (controls: SceneControls, drawer: HTMLElement) => unknown;
  readonly expected: unknown;
  /** Only these scene kinds (the fold shows different controls for each); default all. */
  readonly kinds?: readonly string[];
}
const withLabel = (drawer: HTMLElement, label: string | RegExp) => {
  const found = [...drawer.querySelectorAll<HTMLElement>("[aria-label]")].find((element) => {
    const name = element.getAttribute("aria-label") ?? "";
    return typeof label === "string" ? name === label : label.test(name);
  });
  if (found === undefined) throw new Error(`no control labelled ${String(label)}`);
  return found;
};
const slide = (label: string | RegExp, value: string) => (drawer: HTMLElement) => {
  const input = withLabel(drawer, label) as HTMLInputElement;
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input) as object, "value")?.set?.call(input, value);
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  input.dispatchEvent(new window.Event("change", { bubbles: true }));
};
const click = (label: string | RegExp) => (drawer: HTMLElement) =>
  withLabel(drawer, label).dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
const clickText = (text: string) => (drawer: HTMLElement) =>
  [...drawer.querySelectorAll("button")]
    .find((button) => button.textContent === text)!
    .dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
const MOVES: readonly Move[] = [
  { fold: "camera", act: clickText("Loop playback"), read: (c) => c.loop, expected: true },
  {
    fold: "timeline",
    act: slide("Timeline glow thickness", "9"),
    read: (_c, drawer) => drawer.querySelector('[data-testid="glow-thickness-value"]')?.textContent,
    expected: "9.0",
  },
  { fold: "orbit-lines", act: slide("Ring opacity", "0.5"), read: (c) => c.orbitLook?.baseOpacity, expected: 0.5 },
  {
    fold: "moons-rings",
    act: slide("Small moon dot size", "4"),
    read: (c) => c.bodySetLook?.dotPx,
    expected: 4,
    kinds: ["body set"],
  },
  {
    fold: "moons-rings",
    act: slide(/: opacity$/, "0.4"),
    read: (c) => Object.values(c.ringLook ?? {}).map((band) => band?.opacity),
    expected: [0.4],
    kinds: ["rings"],
  },
  { fold: "sky-sun", act: click("Illuminate all"), read: (c) => c.illuminateAll, expected: true },
  { fold: "labels", act: slide("Label size", "20"), read: (c) => c.labelStyle.sizePx, expected: 20 },
  { fold: "phone-layout", act: slide("Phone sheet height", "60"), read: (c) => c.sheetMaxPercent, expected: 60 },
];
void MOVES;

let host: HTMLElement;
let stop: () => void;
beforeEach(() => {
  pretendScreen({});
  window.localStorage.clear();
  sceneProps.controls = null;
  host = document.createElement("div");
  document.body.append(host);
  stop = () => undefined;
});
afterEach(() => {
  stop();
  host.remove();
  window.history.replaceState(null, "", "/");
});

type Path = "mount" | "AstraeusScene";
async function open(path: Path, scene: Scene, address: boolean): Promise<void> {
  const options = { developerTools: true, ...(address ? { address: true } : {}) };
  if (path === "mount") {
    const mounted = mount(host, scene, options);
    stop = () => mounted.unmount();
    await mounted.ready;
  } else {
    const root = createRoot(host);
    stop = () => flushSync(() => root.unmount());
    await new Promise<void>((resolve, reject) =>
      flushSync(() =>
        root.render(createElement(ReactScene, { scene, onReady: () => resolve(), onError: reject, ...options })),
      ),
    );
  }
  await vi.waitFor(() => expect(host.querySelector(".astraeus-shell")).not.toBeNull());
}
const pause = () => new Promise((resolve) => setTimeout(resolve, 15));
async function openDrawer(): Promise<HTMLElement> {
  host.querySelector<HTMLButtonElement>('button[aria-label="Developer mode"]')!.click();
  await waitForDeveloperDrawer(host);
  return host.querySelector<HTMLElement>(".developer-tools")!;
}
const foldsOf = (drawer: HTMLElement) =>
  [...drawer.querySelectorAll<HTMLElement>(".dev-group")].map((fold) => ({
    id: fold.dataset.fold!,
    title: fold.querySelector("h3")!.textContent!,
    open: fold.querySelector("button[aria-expanded]")!.getAttribute("aria-expanded") === "true",
  }));
/** Opens every closed fold, nested ones included, letting each body arrive. */
async function openAll(drawer: HTMLElement): Promise<void> {
  for (let round = 0; round < 4; round += 1) {
    const closed = [...drawer.querySelectorAll<HTMLButtonElement>('button[aria-expanded="false"]')];
    if (closed.length === 0) return;
    for (const button of closed) button.click();
    await pause();
  }
}
const testIdsOf = (drawer: HTMLElement) =>
  Object.fromEntries(
    [...drawer.querySelectorAll<HTMLElement>(".dev-group")].map((fold) => [
      fold.dataset.fold!,
      [...fold.querySelectorAll<HTMLElement>("[data-testid]")].map((element) => element.dataset.testid!),
    ]),
  );

describe.each(["mount", "AstraeusScene"] as const)("the Developer drawer, via %s", (path) => {
  it.each(KINDS)("$name: folds, default fold, test ids and the copy-link button", async (kind) => {
    await open(path, kind.scene(), kind.address);
    const drawer = await openDrawer();
    const folds = foldsOf(drawer);
    expect(folds.map((entry) => `${entry.id}:${entry.title}`)).toEqual(kind.folds.map(([name]) => name));
    expect(folds.filter((entry) => entry.open).map((entry) => entry.id)).toEqual(["camera"]);
    await openAll(drawer);
    const ids = testIdsOf(drawer);
    for (const [name, testIds] of kind.folds) expect(ids[name.split(":")[0]!], name).toEqual(testIds);
    expect([...drawer.querySelectorAll("button")].some((b) => b.textContent === "Copy view link")).toBe(
      kind.copyButton,
    );
  });

  it.each(KINDS)("$name: one control per fold reaches the scene's live controls", async (kind) => {
    await open(path, kind.scene(), kind.address);
    const drawer = await openDrawer();
    await openAll(drawer);
    const present = new Set(foldsOf(drawer).map((entry) => entry.id));
    const moves = MOVES.filter((move) => present.has(move.fold) && (move.kinds ?? [kind.name]).includes(kind.name));
    expect(moves.length).toBeGreaterThanOrEqual(5);
    for (const move of moves) {
      move.act(drawer);
      await pause();
      expect(move.read(sceneProps.controls!, drawer), `${move.fold} (${kind.name})`).toEqual(move.expected);
    }
  });

  it("stops collecting frame timing when the drawer closes, and starts again when it reopens", async () => {
    await open(path, base(), false);
    expect(sceneProps.controls!.frameStats).toBeNull();
    const toggle = () => host.querySelector<HTMLButtonElement>('button[aria-label="Developer mode"]')!;
    await openDrawer();
    await vi.waitFor(() => expect(sceneProps.controls!.frameStats).not.toBeNull());
    toggle().click();
    await vi.waitFor(() => expect(sceneProps.controls!.frameStats).toBeNull());
    toggle().click();
    await vi.waitFor(() => expect(sceneProps.controls!.frameStats).not.toBeNull());
  });
});
