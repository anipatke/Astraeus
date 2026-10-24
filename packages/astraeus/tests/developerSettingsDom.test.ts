// @vitest-environment happy-dom
// The Developer tools' settings bodies (DeveloperSettings.tsx): each is mounted inside a small stateful host the way App holds the state, and the
// tests press and drag its controls, then read both the page and the scene's live controls that the change is written to.
import { createElement, act, useState, type MutableRefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SceneControls } from "../src/app/AstraeusScene";
import { DEFAULT_BODY_SET_LOOK, type BodySetLayer, type BodySetLook } from "../src/app/bodySet";
import { LabelSettings, MoonsAndRingsSettings, SkyAndSunSettings, StoryPanelSettings, UnderTheHoodSettings, ViewLinkReadout } from "../src/app/DeveloperSettings";
import type { GlowLook } from "../src/app/bodyDraw";
import type { RingLook, RingSystem } from "../src/assets/rings";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;
beforeEach(() => { container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });

const show = (element: ReturnType<typeof createElement>) => act(() => root.render(element));
const liveControls = (extra: Partial<SceneControls> = {}) => ({ current: { ...extra } as SceneControls }) as MutableRefObject<SceneControls>;
const button = (name: string) => [...container.querySelectorAll("button")].find((b) => b.textContent === name)!;
const press = (el: Element) => act(() => { (el as HTMLElement).click(); });
const slider = (label: string) => container.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
const out = (id: string) => container.querySelector(`[data-testid="${id}"]`)!.textContent;
/** Moves a range or colour input the way a user does: sets the value through the native setter and fires the input event React listens for. */
function change(input: HTMLInputElement, value: string): void {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("StoryPanelSettings", () => {
  function Host({ controls }: { controls: { auto: boolean[]; pause: number[] } }) {
    const [auto, setAuto] = useState(false);
    const [pause, setPause] = useState(0);
    return createElement(StoryPanelSettings, { storyAutoOpen: auto, setStoryAutoOpen: (on: boolean) => { controls.auto.push(on); setAuto(on); }, storyPauseSeconds: pause, setStoryPauseSeconds: (s: number) => { controls.pause.push(s); setPause(s); } });
  }
  it("toggles opening panels automatically and shows the pause as off, then in seconds", () => {
    const log = { auto: [] as boolean[], pause: [] as number[] };
    show(createElement(Host, { controls: log }));
    expect(button("Open panels automatically").getAttribute("aria-pressed")).toBe("false");
    expect(out("story-pause-value")).toBe("off");
    press(button("Open panels automatically"));
    expect(button("Open panels automatically").getAttribute("aria-pressed")).toBe("true");
    change(slider("Story panel pause"), "2.5");
    expect(log).toEqual({ auto: [true], pause: [2.5] });
    expect(out("story-pause-value")).toBe("2.5");
  });
});

describe("SkyAndSunSettings", () => {
  function Host({ controls, visible, glow }: { controls: MutableRefObject<SceneControls>; visible: boolean; glow: GlowLook | null }) {
    const [illuminateAll, setIlluminateAll] = useState(false);
    const [glowShown, setGlowShown] = useState<GlowLook | null>(glow);
    const [milkyWayOn, setMilkyWayOn] = useState(true);
    const [stars, setStars] = useState(1);
    const [milky, setMilky] = useState(1);
    return createElement(SkyAndSunSettings, { illuminateAll, setIlluminateAll, visible, glowShown, setGlowShown: (look: GlowLook) => setGlowShown(look), controls, milkyWayOn, setMilkyWayOn, starBrightness: stars, setStarBrightness: setStars, milkyWayBrightness: milky, setMilkyWayBrightness: setMilky });
  }
  it("writes lighting, Milky Way and brightness choices to the live scene controls and shows the new values", () => {
    const controls = liveControls();
    show(createElement(Host, { controls, visible: true, glow: null }));
    press(button("Illuminate all"));
    expect(controls.current.illuminateAll).toBe(true);
    expect(button("Illuminate all").getAttribute("aria-pressed")).toBe("true");
    press(button("Milky Way picture"));
    expect(controls.current.showMilkyWay).toBe(false);
    change(slider("Star brightness"), "1.5");
    change(slider("Milky Way brightness"), "0.25");
    expect(controls.current.starBrightness).toBe(1.5);
    expect(controls.current.milkyWayBrightness).toBe(0.25);
    expect(out("star-brightness-value")).toBe("1.50");
    expect(out("milky-way-brightness-value")).toBe("0.25");
    expect(container.querySelector('[aria-labelledby="setting-group-glow"]')).toBeNull(); // no Sun halo: no glow group
  });

  it("leaves the sky group out when the sky is not shown", () => {
    show(createElement(Host, { controls: liveControls(), visible: false, glow: null }));
    expect(container.querySelector("#setting-group-sky")).toBeNull();
    expect(container.querySelector("#setting-group-lighting")).not.toBeNull();
  });

  it("changes the Sun halo's size, brightness and reach on the live look", () => {
    const glow: GlowLook = { sizePx: 100, brightness: 1, scale: 2 };
    const controls = liveControls({ glowLook: { ...glow } });
    show(createElement(Host, { controls, visible: true, glow }));
    change(slider("Sun glow size"), "150");
    change(slider("Sun glow brightness"), "0.5");
    change(slider("Sun glow reach"), "3");
    expect(controls.current.glowLook).toEqual({ sizePx: 150, brightness: 0.5, scale: 3 });
    expect([out("sun-glow-size-value"), out("sun-glow-brightness-value"), out("sun-glow-scale-value")]).toEqual(["150", "0.50", "3.0"]);
  });
});

describe("LabelSettings", () => {
  function Host({ controls, toggles, tracked }: { controls: MutableRefObject<SceneControls>; toggles: { id: string; label: string }[]; tracked: number }) {
    const [hover, setHover] = useState(1.4);
    const [anchors, setAnchors] = useState(false);
    const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set(["moon"]));
    return createElement(LabelSettings, { controls, hoverBrightness: hover, setHoverBrightness: setHover, labelToggles: toggles, trackedCount: tracked, anchorLabels: anchors, setAnchorLabels: setAnchors, hiddenLabels: hidden, setHiddenLabels: setHidden });
  }
  it("sets the hover brightness, toggles anchor labels and each named label, keeping the hidden set in step", () => {
    const controls = liveControls({ hiddenLabels: new Set(["moon"]) }); // the scene starts with the Moon's label hidden, as the page's own state does
    show(createElement(Host, { controls, toggles: [{ id: "moon", label: "Moon" }, { id: "sun", label: "Sun" }], tracked: 2 }));
    expect(button("Moon label").getAttribute("aria-pressed")).toBe("false"); // starts hidden
    expect(button("Sun label").getAttribute("aria-pressed")).toBe("true");
    change(slider("Hover name brightness"), "2");
    expect(controls.current.hoverBrightness).toBe(2);
    expect(out("hover-brightness-value")).toBe("2.00");
    press(button("Anchor labels"));
    expect(controls.current.showAnchorLabels).toBe(true);
    press(button("Moon label"));
    press(button("Sun label"));
    expect(button("Moon label").getAttribute("aria-pressed")).toBe("true");
    expect(button("Sun label").getAttribute("aria-pressed")).toBe("false");
    expect([...controls.current.hiddenLabels!]).toEqual(["sun"]);
  });

  it("shows no button row when there is nothing to toggle, and no anchor button without tracked bodies", () => {
    show(createElement(Host, { controls: liveControls(), toggles: [], tracked: 0 }));
    expect(container.querySelectorAll("button")).toHaveLength(0);
    show(createElement(Host, { controls: liveControls(), toggles: [{ id: "sun", label: "Sun" }], tracked: 0 }));
    expect([...container.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["Sun label"]);
  });
});

describe("MoonsAndRingsSettings", () => {
  const layer = { id: "jup", families: [{ id: "gal", label: "Galilean", color: "#112233" }, { id: "irr", label: "Irregular", color: "#445566" }] } as unknown as BodySetLayer;
  const rings: RingSystem = { body: "saturn", sources: [], bands: [{ id: "b", label: "B ring", innerKm: 1, outerKm: 2, color: "#aabbcc", opacity: 0.8 }] };
  function Host({ controls, sets, systems }: { controls: MutableRefObject<SceneControls>; sets: readonly BodySetLayer[]; systems: readonly RingSystem[] }) {
    const [setLook, setSetLook] = useState<BodySetLook>(DEFAULT_BODY_SET_LOOK);
    const [ringLook, setRingLook] = useState<RingLook>({});
    const changeSetLook = (change: Partial<BodySetLook>) => { const next = { ...setLook, ...change }; controls.current.bodySetLook = next; setSetLook(next); };
    const changeRing = (band: string, change: { color?: string; opacity?: number }) => { const next = { ...ringLook, [band]: { ...ringLook[band], ...change } }; controls.current.ringLook = next; setRingLook(next); };
    return createElement(MoonsAndRingsSettings, { bodySets: sets, ringSystems: systems, setLook, changeSetLook, ringLook, changeRing, controls, setSetLook, setRingLook });
  }

  it("shows nothing for a scene with no moon sets and no rings", () => {
    show(createElement(Host, { controls: liveControls(), sets: [], systems: [] }));
    expect(container.textContent).toBe("");
  });

  it("lists a colour per moon family, applies dot and orbit changes, and resets the moons to the defaults", () => {
    const controls = liveControls();
    show(createElement(Host, { controls, sets: [layer], systems: [] }));
    expect(out("body-set-family-gal")).toBe("#112233");
    expect(out("body-set-family-irr")).toBe("#445566");
    change(slider("Small moon dot size"), "4");
    expect(controls.current.bodySetLook!.dotPx).toBe(4);
    expect(out("body-set-dot-px")).toBe("4.0");
    press(button("Moon orbits"));
    expect(controls.current.bodySetLook!.orbitsOn).toBe(!DEFAULT_BODY_SET_LOOK.orbitsOn);
    change(container.querySelector<HTMLInputElement>('input[aria-label="Galilean orbit colour"]')!, "#ff0000");
    expect(out("body-set-family-gal")).toBe("#ff0000");
    expect(controls.current.bodySetLook!.familyColors).toMatchObject({ gal: "#ff0000" });
    press(button("Reset moons"));
    expect(controls.current.bodySetLook).toBeUndefined();
    expect(out("body-set-dot-px")).toBe(DEFAULT_BODY_SET_LOOK.dotPx.toFixed(1));
    expect(out("body-set-family-gal")).toBe("#112233");
  });

  it("changes a ring band's colour and opacity on the live look and resets them", () => {
    const controls = liveControls();
    show(createElement(Host, { controls, sets: [], systems: [rings] }));
    expect(out("ring-b-opacity")).toBe("0.800");
    change(slider("B ring: opacity"), "0.3");
    change(container.querySelector<HTMLInputElement>('input[aria-label="B ring colour"]')!, "#00ff00");
    expect(controls.current.ringLook).toEqual({ b: { opacity: 0.3, color: "#00ff00" } });
    expect(out("ring-b-opacity")).toBe("0.300");
    expect(out("ring-b-color")).toBe("#00ff00");
    press(button("Reset rings"));
    expect(controls.current.ringLook).toBeUndefined();
    expect(out("ring-b-opacity")).toBe("0.800");
  });
});

describe("ViewLinkReadout", () => {
  const view = { focus: "io", azimuthDeg: 10, elevationDeg: 20, distance: 5 };
  it("states the view, scale and up, and the link with a copied or not-copied message", () => {
    show(createElement(ViewLinkReadout, { viewNow: view, viewLink: { url: "https://x/app?view=io", copied: true }, scale: "solar", upChoice: "ecliptic" }));
    expect(out("view-values")).toBe("View: io,10,20,5 (focus, azimuth °, elevation °, distance) · scale solar · up ecliptic");
    expect(container.querySelector<HTMLInputElement>('[data-testid="view-link"]')!.value).toBe("https://x/app?view=io");
    expect(container.textContent).toContain("Copied to the clipboard.");
    show(createElement(ViewLinkReadout, { viewNow: view, viewLink: { url: "u", copied: false }, scale: "solar", upChoice: "ecliptic" }));
    expect(container.textContent).toContain("Clipboard unavailable");
  });
  it("shows nothing before a view is read or a link made", () => {
    show(createElement(ViewLinkReadout, { viewNow: null, viewLink: null, scale: "s", upChoice: "equatorial" }));
    expect(container.textContent).toBe("");
  });
  it("selects the whole link when its field is focused", () => {
    show(createElement(ViewLinkReadout, { viewNow: null, viewLink: { url: "abc", copied: true }, scale: "s", upChoice: "equatorial" }));
    const field = container.querySelector<HTMLInputElement>('[data-testid="view-link"]')!;
    const select = vi.spyOn(field, "select");
    act(() => { field.dispatchEvent(new FocusEvent("focusin", { bubbles: true })); });
    expect(select).toHaveBeenCalled();
  });
});

describe("UnderTheHoodSettings", () => {
  it("offers each alternate data set as a button, marks the active one, and reloads the page with its address parameter", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { href: "http://localhost/app.html?x=1", assign, search: "?x=1" });
    show(createElement(UnderTheHoodSettings, { hud: null, frames: null, fills: [], fpsHistory: [], alternates: [{ param: "data", value: "a", label: "Set A", active: true }, { param: "data", value: "b", label: "Set B", active: false }] }));
    expect(button("Set A").getAttribute("aria-pressed")).toBe("true");
    expect(button("Set B").getAttribute("aria-pressed")).toBe("false");
    press(button("Set B"));
    expect(assign).toHaveBeenCalledExactlyOnceWith("http://localhost/app.html?x=1&data=b");
    vi.unstubAllGlobals();
  });
  it("leaves out the Data group when there are no alternates", () => {
    show(createElement(UnderTheHoodSettings, { hud: null, frames: null, fills: [], fpsHistory: [], alternates: undefined }));
    expect(container.querySelector("#setting-group-data")).toBeNull();
  });
});
