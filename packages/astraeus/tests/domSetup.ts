// The pretend page for fast screen-part tests (O-038 T-143). A test file opts in with `// @vitest-environment happy-dom`; this helper mounts the real
// shell on a made-up experience (ARCH-03) with a real clock behind it, so a test presses controls and reads what the shell then shows.
import { createElement, useRef, useState, type ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SimulationClock, type ClockSnapshot } from "../src/core/clock";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { catalogue } from "../src/assets/catalogue";
import { createSceneResolver } from "../src/app/sceneLayout";
import { AstraeusShell } from "../src/shell/AstraeusShell";
import type { ExperienceCameraPreset, ExperienceConfig } from "../src/shell/experience";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import type { PhoneLayoutSettings } from "../src/shell/phoneLayout";
import type { StoryPanelSettings } from "../src/shell/useStoryPanels";
import type { DisplaySwitchItem } from "../src/shell/DisplaySwitches";
import type { ExperienceSwitch } from "../src/shell/SwitchControl";
import type { ScaleChoice } from "../src/shell/scaleModel";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export interface Mounted {
  readonly container: HTMLElement;
  readonly cameraRequests: ExperienceCameraPreset["request"][];
  readonly clock: SimulationClock;
  readonly selected: () => string;
  /** Lets `ms` of real time pass for the clock (it only moves while playing) and draws the shell as the app does every frame. */
  readonly advance: (ms: number) => void;
  /** Asks the shell to open a story panel, as a scene marker press does. */
  readonly requestPanel: (id: string) => void;
  readonly scale: () => string;
  readonly unmount: () => void;
}

export interface MountOptions {
  readonly experience?: ExperienceConfig;
  readonly phone?: boolean;
  readonly embedded?: boolean;
  readonly reducedMotion?: boolean;
  readonly developerTools?: ReactNode;
  readonly scaleChoices?: readonly ScaleChoice[];
  readonly phoneLayout?: PhoneLayoutSettings;
  readonly storyPanelSettings?: StoryPanelSettings;
  /** A made-up choice between versions, shown first in the top bar. */
  readonly switcher?: ExperienceSwitch;
  /** Made-up display switches (their `on` is the start; pressing one flips it, as the app would). */
  readonly displaySwitches?: readonly DisplaySwitchItem[];
}

/** Tells the page whether it is a phone, framed or asked for reduced motion: the three things the shell reads from its window. */
export function pretendScreen({ phone = false, embedded = false, reducedMotion = false }: Pick<MountOptions, "phone" | "embedded" | "reducedMotion">): void {
  window.matchMedia = ((query: string) => ({
    media: query,
    matches: query.includes("max-width: 700px") ? phone : query.includes("prefers-reduced-motion") ? reducedMotion : false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
    onchange: null,
  })) as unknown as typeof window.matchMedia;
  Object.defineProperty(window, "top", { value: embedded ? ({} as Window) : window, configurable: true });
}

/** Presses an element the way a person does: pointer down and up, then the click. */
export function press(element: Element): void {
  act(() => {
    element.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

export function pressKey(target: Element | Document, key: string): void {
  act(() => {
    target.dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  });
}

export function change(element: HTMLSelectElement | HTMLInputElement, value: string): void {
  act(() => {
    const prototype = Object.getPrototypeOf(element) as object;
    Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(element, value);
    element.dispatchEvent(new window.Event(element instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
    element.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
}

export function byLabel(container: ParentNode, label: string | RegExp): HTMLElement {
  const found = findAllByLabel(container, label)[0];
  if (found === undefined) throw new Error(`no element labelled ${String(label)}`);
  return found;
}

export function findAllByLabel(container: ParentNode, label: string | RegExp): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>("[aria-label]")].filter((element) => {
    const name = element.getAttribute("aria-label") ?? "";
    return typeof label === "string" ? name === label : label.test(name);
  });
}

export function $(container: ParentNode, selector: string): HTMLElement {
  const found = container.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`nothing matches ${selector}`);
  return found;
}

interface Probe { selected: string; scale: string; refresh: () => void; requestPanel: (id: string) => void }

function Host({ options, clock, probe }: { readonly options: MountOptions; readonly clock: SimulationClock; readonly probe: Mounted["cameraRequests"] & Probe }) {
  const [panelRequest, setPanelRequest] = useState<{ id: string; serial: number } | null>(null);
  const [snapshot, setSnapshot] = useState<ClockSnapshot>(() => clock.snapshot());
  const [developer, setDeveloper] = useState(false);
  const [scaleId, setScaleId] = useState(options.scaleChoices?.[0]?.id ?? "true-scale");
  const selected = useRef("");
  const refresh = () => setSnapshot(clock.snapshot());
  probe.refresh = refresh;
  probe.requestPanel = (id) => setPanelRequest((previous) => ({ id, serial: (previous?.serial ?? 0) + 1 }));
  const [flipped, setFlipped] = useState<ReadonlySet<string>>(new Set());
  const displaySwitches = options.displaySwitches?.map((item) => ({ ...item, on: item.on !== flipped.has(item.id), onToggle: () => { item.onToggle(); setFlipped((was) => new Set(was.has(item.id) ? [...was].filter((id) => id !== item.id) : [...was, item.id])); } }));
  const experience = options.experience ?? syntheticDefinition.experience;
  const resolver = useRef(createSceneResolver(createOrbAstronomyAdapter()));
  const metrics = useRef(syntheticDefinition.createMetrics({ clock, resolver: resolver.current, catalogue }));
  probe.scale = scaleId;
  return createElement(AstraeusShell, {
    experience,
    snapshot,
    developerMode: developer,
    onDeveloperModeChange: setDeveloper,
    onTogglePlayback: () => { if (clock.playing) clock.pause(); else clock.play(); refresh(); },
    onRateChange: (rate: number | "auto") => { if (rate !== "auto") clock.setRate(rate); refresh(); },
    onSeek: (timeUtcMs: number) => { clock.seek(timeUtcMs); refresh(); },
    onCameraRequest: (request: ExperienceCameraPreset["request"]) => { probe.push(request); },
    onSelectionChange: (id: string) => { selected.current = id; probe.selected = id; },
    onSetPlaying: (playing: boolean) => { if (playing) clock.play(); else clock.pause(); refresh(); },
    panelRequest,
    scaleId,
    onScaleChange: setScaleId,
    scaleChoices: options.scaleChoices,
    metricsFor: metrics.current,
    developerTools: options.developerTools,
    phoneLayout: options.phoneLayout,
    storyPanelSettings: options.storyPanelSettings,
    switcher: options.switcher,
    displaySwitches,
    children: null,
  });
}

/** Mounts the shell on the made-up experience (paused) and returns it for presses and reads. */
export function mountShell(options: MountOptions = {}): Mounted {
  pretendScreen(options);
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const experience = options.experience ?? syntheticDefinition.experience;
  let monotonicMs = 1_000;
  const clock = new SimulationClock(syntheticDefinition.clock.startUtcMs, () => monotonicMs);
  clock.setRate(experience.rates?.[0] ?? syntheticDefinition.clock.rate);
  const probe = [] as unknown as Mounted["cameraRequests"] & Probe;
  act(() => { root.render(createElement(Host, { options, clock, probe })); });
  return {
    container,
    cameraRequests: probe,
    clock,
    selected: () => probe.selected,
    advance: (ms) => { monotonicMs += ms; act(() => probe.refresh()); },
    requestPanel: (id) => { act(() => probe.requestPanel(id)); },
    scale: () => probe.scale,
    unmount: () => { act(() => root.unmount()); container.remove(); },
  };
}

/** A drag on a handle: the pointer goes down, moves `dy` px down the screen (negative: up) and lifts; the click that follows a swipe is swallowed by the handle. */
export function swipe(element: Element, dy: number): void {
  act(() => {
    element.dispatchEvent(new window.PointerEvent("pointerdown", { bubbles: true, clientY: 300, pointerId: 1 }));
    element.dispatchEvent(new window.PointerEvent("pointerup", { bubbles: true, clientY: 300 + dy, pointerId: 1 }));
  });
  if (Math.abs(dy) < 30) return;
  press(element);
}

/** A finger drag on a sheet (touchstart, touchend `dy` px lower). */
export function touchDrag(element: Element, dy: number): void {
  const touch = (y: number) => [{ clientY: y }];
  const fire = (type: string, y: number) => {
    const event = new window.Event(type, { bubbles: true }) as Event & { touches: unknown; changedTouches: unknown };
    event.touches = touch(y);
    event.changedTouches = touch(y);
    element.dispatchEvent(event);
  };
  act(() => { fire("touchstart", 100); fire("touchmove", 100 + dy); fire("touchend", 100 + dy); });
}

export function selectObject(container: ParentNode, id: string): void {
  const picker = $(container, "select.object-picker") as HTMLSelectElement;
  act(() => {
    picker.value = id;
    picker.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
}
