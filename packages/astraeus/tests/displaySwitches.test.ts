// @vitest-environment happy-dom
// Display switches a story places (O-041 T-170), proved on made-up scenes and a made-up shell (ARCH-03): the Scene call and its refusals, each place, each starting state, the
// switch and the Developer drawer's own buttons staying in step, and the top bar and phone drawer showing them.
import { afterEach, describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon } from "astraeus";
import { displaySwitchItems, labelsOn, orbitLinesOn, orbitStart, type SwitchBindings } from "../src/app/displaySwitches";
import { hiddenLabelsFrom } from "../src/app/App";
import type { DisplaySwitchItem } from "../src/shell/DisplaySwitches";
import { $, byLabel, mountShell, press, pressKey, type Mounted } from "./domSetup";

const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "no error"; };
const base = () => new Scene().addBody(earth).addBody(moon, { orbit: true });

describe("Scene.setSwitches", () => {
  it("places nothing by default, so the definition carries no switches", () => {
    expect(base().toDefinition().displaySwitches).toBeUndefined();
  });
  it.each(["top-bar", "panel", "developer"] as const)("accepts the place %s", (place) => {
    expect(base().setSwitches({ orbitLines: { place } }).toDefinition().displaySwitches).toEqual({ orbitLines: { place } });
  });
  it.each([true, false])("keeps a starting state of %s", (on) => {
    expect(base().setSwitches({ milkyWay: { place: "panel", on } }).toDefinition().displaySwitches?.milkyWay).toEqual({ place: "panel", on });
  });
  it("lays later calls over earlier ones, switch by switch", () => {
    const placed = base().setSwitches({ orbitLines: { place: "top-bar" }, labels: { place: "panel" } }).setSwitches({ labels: { place: "developer", on: false } }).toDefinition().displaySwitches;
    expect(placed).toEqual({ orbitLines: { place: "top-bar" }, labels: { place: "developer", on: false } });
  });
  it.each([
    ["a switch that does not exist", () => base().setSwitches({ stars: { place: "panel" } } as never)],
    ["a place that does not exist", () => base().setSwitches({ labels: { place: "sidebar" } } as never)],
    ["no place", () => base().setSwitches({ labels: {} } as never)],
    ["a switch that is not an object", () => base().setSwitches({ labels: "top-bar" } as never)],
    ["a starting state that is not true or false", () => base().setSwitches({ labels: { place: "panel", on: "yes" } } as never)],
    ["no object at all", () => base().setSwitches(undefined as never)],
  ])("refuses %s with bad-switch", (_name, call) => { expect(codeOf(call)).toBe("bad-switch"); });
  it("names the offending switch in the message", () => {
    expect(() => base().setSwitches({ labels: { place: "sidebar" } } as never)).toThrow(/labels\.place must be one of top-bar, panel, developer/);
  });
});

describe("switches and the Developer drawer share one state", () => {
  const make = (over: { orbit?: { baseOn: boolean; arcOn: boolean }; moons?: boolean; sky?: boolean; hidden?: string[]; anchors?: boolean } = {}) => {
    const state = { orbit: over.orbit ?? { baseOn: true, arcOn: true }, moons: over.moons ?? true, sky: over.sky ?? true, hidden: new Set(over.hidden ?? []), anchors: over.anchors ?? false };
    const bindings = (): SwitchBindings => ({
      settings: { orbitLines: { place: "top-bar" }, labels: { place: "panel" }, milkyWay: { place: "developer" } },
      orbit: { present: true, look: state.orbit, set: (change) => { state.orbit = { ...state.orbit, ...change }; } },
      moons: { present: true, look: { orbitsOn: state.moons }, set: (change) => { state.moons = change.orbitsOn ?? state.moons; } },
      sky: { present: true, on: state.sky, set: (on) => { state.sky = on; } },
      labels: { objectIds: ["earth", "moon"], hidden: state.hidden, setHidden: (hidden) => { state.hidden = new Set(hidden); }, anchorsPresent: true, anchors: state.anchors, setAnchors: (on) => { state.anchors = on; } },
    });
    return { state, items: () => displaySwitchItems(bindings()) };
  };
  const item = (items: readonly DisplaySwitchItem[], id: string) => items.find((candidate) => candidate.id === id)!;

  it("shows only the top-bar and panel switches, in a fixed order", () => {
    expect(make().items().map(({ id, place }) => [id, place])).toEqual([["orbitLines", "top-bar"], ["labels", "panel"]]);
  });
  it("turns the orbit ring, trailing arc and moon orbits off and on together", () => {
    const { state, items } = make();
    item(items(), "orbitLines").onToggle();
    expect(state.orbit).toEqual({ baseOn: false, arcOn: false });
    expect(state.moons).toBe(false);
    expect(item(items(), "orbitLines").on).toBe(false);
    item(items(), "orbitLines").onToggle();
    expect(state.orbit).toEqual({ baseOn: true, arcOn: true });
    expect(state.moons).toBe(true);
  });
  it("follows a Developer button: one orbit layer still on keeps the switch on, all off turns it off", () => {
    expect(item(make({ orbit: { baseOn: false, arcOn: true }, moons: false }).items(), "orbitLines").on).toBe(true);
    expect(item(make({ orbit: { baseOn: false, arcOn: false }, moons: false }).items(), "orbitLines").on).toBe(false);
    expect(orbitLinesOn({ baseOn: false, arcOn: false }, true)).toBe(true);
  });
  it("turns every label and the anchor labels off and on, and follows the Developer buttons", () => {
    const { state, items } = make();
    item(items(), "labels").onToggle();
    expect([...state.hidden].sort()).toEqual(["earth", "moon"]);
    expect(state.anchors).toBe(false);
    expect(item(items(), "labels").on).toBe(false);
    item(items(), "labels").onToggle();
    expect(state.hidden.size).toBe(0);
    expect(state.anchors).toBe(true);
    expect(labelsOn(["earth", "moon"], new Set(["earth", "moon"]), true)).toBe(true);
    expect(item(make({ hidden: ["earth"] }).items(), "labels").on).toBe(true);
  });
  it("leaves out a switch the scene has nothing for", () => {
    const bindings = make().items;
    const none = displaySwitchItems({ settings: { orbitLines: { place: "top-bar" }, milkyWay: { place: "panel" } }, orbit: { present: false, look: { baseOn: true, arcOn: true }, set: () => undefined }, moons: { present: false, look: { orbitsOn: true }, set: () => undefined }, sky: { present: false, on: true, set: () => undefined }, labels: { objectIds: [], hidden: new Set(), setHidden: () => undefined, anchorsPresent: false, anchors: false, setAnchors: () => undefined } });
    expect(bindings().length).toBe(2);
    expect(none).toEqual([]);
  });
  it("starts orbit lines off only when asked, and hides labels at the start through the same address rule", () => {
    expect(orbitStart({ place: "panel", on: false })?.look).toEqual({ baseOn: false, arcOn: false });
    expect(orbitStart({ place: "panel", on: true })).toBeUndefined();
    expect(orbitStart(undefined)).toBeUndefined();
    const objects = [{ id: "earth", showLabel: false }, { id: "moon", showLabel: false }];
    expect([...hiddenLabelsFrom("", objects)].sort()).toEqual(["earth", "moon"]);
    expect([...hiddenLabelsFrom("?labels=moon:on", objects)]).toEqual(["earth"]);
  });
});

describe("the top bar and the switch panel", () => {
  let m: Mounted;
  afterEach(() => { m.unmount(); });
  const calls: string[] = [];
  const items = (): DisplaySwitchItem[] => [
    { id: "orbitLines", label: "Orbit lines", place: "top-bar", on: true, onToggle: () => { calls.push("orbitLines"); } },
    { id: "labels", label: "Labels", place: "panel", on: false, onToggle: () => { calls.push("labels"); } },
    { id: "milkyWay", label: "Milky Way", place: "panel", on: true, onToggle: () => { calls.push("milkyWay"); } },
  ];

  it("draws nothing extra when no switch is placed", () => {
    m = mountShell();
    expect(m.container.querySelector(".display-switches")).toBeNull();
    expect(m.container.querySelector("[data-display-switch]")).toBeNull();
  });
  it("draws a top-bar switch as a pressed button with its name, and flips it when pressed", () => {
    calls.length = 0;
    m = mountShell({ displaySwitches: items() });
    const button = byLabel(m.container, "Orbit lines");
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    press(button);
    expect(calls).toEqual(["orbitLines"]);
    expect(byLabel(m.container, "Orbit lines").getAttribute("aria-pressed")).toBe("false");
  });
  it("keeps panel switches in one panel opened from a Display button, with their pressed states", () => {
    calls.length = 0;
    m = mountShell({ displaySwitches: items() });
    const toggle = byLabel(m.container, "Switch panel");
    const panel = $(m.container, ".switch-panel");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(panel.hasAttribute("hidden")).toBe(true);
    press(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hasAttribute("hidden")).toBe(false);
    const rows = [...panel.querySelectorAll("button")];
    expect(rows.map((row) => [row.textContent, row.getAttribute("aria-pressed")])).toEqual([["Labels", "false"], ["Milky Way", "true"]]);
    press(rows[0]!);
    expect(calls).toEqual(["labels"]);
    expect($(m.container, ".switch-panel button").getAttribute("aria-pressed")).toBe("true");
    pressKey(document, "Escape");
    expect($(m.container, ".switch-panel").hasAttribute("hidden")).toBe(true);
  });
  it("shows a panel switch nowhere in the bar itself, and a bar switch nowhere in the panel", () => {
    m = mountShell({ displaySwitches: items() });
    expect($(m.container, ".switch-panel").querySelector('[data-display-switch="orbitLines"]')).toBeNull();
    expect(m.container.querySelectorAll('.top-bar [data-display-switch="labels"]').length).toBe(1);
    expect(m.container.querySelectorAll(".top-bar > .display-switches > .display-switch").length).toBe(1);
  });
  it("puts the same controls in the phone drawer, closing the drawer after a bar switch", () => {
    m = mountShell({ phone: true, displaySwitches: items() });
    const drawer = $(m.container, "#controls-drawer");
    press($(m.container, "button.controls-pill"));
    expect(drawer.getAttribute("data-open")).toBe("true");
    expect(drawer.querySelector('[aria-label="Orbit lines"]')).not.toBeNull();
    expect(drawer.querySelector(".switch-panel")).not.toBeNull();
    press(byLabel(drawer, "Orbit lines"));
    expect(drawer.getAttribute("data-open")).toBe("false");
  });
});
