// O-075 T-318: which camera buttons a scene offers (Focus, Follow, Look out, Overview) and a switch's own label, each through the definition `Scene` builds and the shell parts that draw it (ARCH-03).
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, type DataSource } from "astraeus";
import { catalogue } from "../src/assets/catalogue";
import { definitionOf } from "../src/api/definitionOf";
import { displaySwitchItems, type SwitchBindings } from "../src/app/displaySwitches";
import { DisplaySwitches } from "../src/shell/DisplaySwitches";
import { ObjectControls } from "../src/shell/ObjectControls";

const codeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error);
  }
  return "no error";
};
const everything: DataSource = { name: "made-up", provides: catalogue.ids() };
const base = () => new Scene().addBody(earth).addBody(moon);
const opening = (open: "focus" | "follow", choose: "setFocusChoices" | "setFollowChoices") => {
  const s = base();
  s.camera[open]("earth")[choose](["moon"]);
  return s;
};
const TIME = Date.UTC(2026, 3, 1);

/** The camera buttons the bar draws with `id` selected. */
function barButtons(scene: Scene, id: string): string[] {
  const { experience } = definitionOf(scene, [everything]);
  const html = renderToStaticMarkup(
    createElement(ObjectControls, {
      experience,
      timeUtcMs: TIME,
      selectedObjectId: id,
      activePresetId: null,
      onSelectObject: () => undefined,
      onCameraPreset: () => undefined,
      infoOpen: false,
      onToggleInfo: () => undefined,
      infoPanelId: "info",
    }),
  );
  return [...html.matchAll(/data-camera-preset="([^"]+)"/g)].map((match) => match[1]!);
}

describe("camera button choices, for every kind of preset", () => {
  const ALL = ["focus-earth", "focus-moon", "follow-earth", "follow-moon"];
  // [kind, how to set it, buttons with earth selected, buttons with moon selected] (overview shows whichever body is selected)
  it.each([
    [
      "focus: default",
      (s: Scene) => s,
      ["focus-earth", "follow-earth", "overview"],
      ["focus-moon", "follow-moon", "overview"],
    ],
    [
      "focus: empty",
      (s: Scene) => s.camera.setFocusChoices([]) && s,
      ["follow-earth", "overview"],
      ["follow-moon", "overview"],
    ],
    [
      "focus: partial",
      (s: Scene) => s.camera.setFocusChoices([moon]) && s,
      ["follow-earth", "overview"],
      ["focus-moon", "follow-moon", "overview"],
    ],
    [
      "follow: empty",
      (s: Scene) => s.camera.setFollowChoices([]) && s,
      ["focus-earth", "overview"],
      ["focus-moon", "overview"],
    ],
    [
      "follow: partial",
      (s: Scene) => s.camera.setFollowChoices(["earth"]) && s,
      ["focus-earth", "follow-earth", "overview"],
      ["focus-moon", "overview"],
    ],
    [
      "look-out: default",
      (s: Scene) => s,
      ["focus-earth", "follow-earth", "overview"],
      ["focus-moon", "follow-moon", "overview"],
    ],
    [
      "look-out: empty",
      (s: Scene) => s.camera.setLookOutChoices([]) && s,
      ["focus-earth", "follow-earth", "overview"],
      ["focus-moon", "follow-moon", "overview"],
    ],
    [
      "look-out: partial",
      (s: Scene) => s.camera.setLookOutChoices(["earth"]) && s,
      ["focus-earth", "follow-earth", "lookout-earth", "overview"],
      ["focus-moon", "follow-moon", "overview"],
    ],
    [
      "overview: default",
      (s: Scene) => s,
      ["focus-earth", "follow-earth", "overview"],
      ["focus-moon", "follow-moon", "overview"],
    ],
    [
      "overview: off",
      (s: Scene) => s.camera.setOverview(false) && s,
      ["focus-earth", "follow-earth"],
      ["focus-moon", "follow-moon"],
    ],
    [
      "sky only: every choice empty",
      (s: Scene) =>
        s.camera.setFocusChoices([]).setFollowChoices([]).setOverview(false).setLookOutChoices(["earth"]) && s,
      ["lookout-earth"],
      [],
    ],
  ])("%s", (_name, apply, withEarth, withMoon) => {
    const scene = apply(base());
    expect(barButtons(scene, "earth")).toEqual(withEarth);
    expect(barButtons(scene, "moon")).toEqual(withMoon);
    const ids = definitionOf(scene, [everything]).experience.cameraPresets.map((preset) => preset.id);
    expect(ids.filter((id) => id !== "overview" && !id.startsWith("lookout-")).every((id) => ALL.includes(id))).toBe(
      true,
    );
  });

  it("changes nothing for a scene that makes no choice: every preset and no focusListed flag", () => {
    const { experience } = definitionOf(base(), [everything]);
    expect(experience.cameraPresets.map((preset) => preset.id)).toEqual([
      "overview",
      "focus-earth",
      "follow-earth",
      "focus-moon",
      "follow-moon",
    ]);
    expect(experience.focusListed).toBeUndefined();
  });

  it.each([
    ["an unknown focus choice", () => base().camera.setFocusChoices(["mars"]), /^unknown-body: camera.setFocusChoices/],
    [
      "a focus choice that is not a list",
      () => base().camera.setFocusChoices("earth" as never),
      /^bad-camera: camera.setFocusChoices/,
    ],
    [
      "an overview that is not true or false",
      () => base().camera.setOverview("no" as never),
      /^bad-camera: camera.setOverview/,
    ],
    [
      "an opening focus the choices leave out",
      () => definitionOf(opening("focus", "setFocusChoices"), [everything]),
      /^bad-camera: camera.focus\("earth"\).*setFocusChoices/,
    ],
    [
      "an opening follow the choices leave out",
      () => definitionOf(opening("follow", "setFollowChoices"), [everything]),
      /^bad-camera: camera.follow\("earth"\)/,
    ],
  ])("refuses %s", (_name, call, message) => {
    expect(codeOf(call)).toMatch(message);
  });

  it("accepts an opening focus the choices list", () => {
    const s = base();
    s.camera.focus("earth").setFocusChoices(["earth"]);
    expect(definitionOf(s, [everything]).experience.startCameraPresetId).toBe("focus-earth");
  });
});

describe("a switch's own label shows in the bar and the panel", () => {
  const noSkyLines = {
    figures: true,
    boundaries: true,
    on: { figures: true, boundaries: true, ecliptic: false, celestialEquator: false },
    set: () => undefined,
  };
  const bindings = (settings: SwitchBindings["settings"]): SwitchBindings => ({
    settings,
    orbit: { present: false, look: { baseOn: true, arcOn: true }, set: () => undefined },
    moons: { present: false, look: { orbitsOn: true }, set: () => undefined },
    sky: { present: false, on: true, set: () => undefined },
    skyLines: noSkyLines,
    labels: {
      objectIds: [],
      hidden: new Set(),
      setHidden: () => undefined,
      anchorsPresent: false,
      anchors: false,
      setAnchors: () => undefined,
    },
  });
  const drawn = (settings: SwitchBindings["settings"]) =>
    renderToStaticMarkup(createElement(DisplaySwitches, { switches: displaySwitchItems(bindings(settings)) }));
  it.each([
    [
      "top-bar",
      "own label",
      { skyBoundaries: { place: "top-bar", label: "Constellation outlines" } } as const,
      ["Constellation outlines"],
      ["Sky outlines"],
    ],
    [
      "panel",
      "own label",
      { skyBoundaries: { place: "panel", label: "Constellation outlines" } } as const,
      ["Constellation outlines"],
      ["Sky outlines"],
    ],
    [
      "top-bar",
      "built-in label",
      { skyBoundaries: { place: "top-bar" } } as const,
      ["Sky outlines"],
      ["Constellation outlines"],
    ],
    [
      "panel",
      "built-in label",
      { skyBoundaries: { place: "panel" } } as const,
      ["Sky outlines"],
      ["Constellation outlines"],
    ],
  ])("%s, %s", (_place, _kind, settings, shown, absent) => {
    const html = drawn(settings);
    for (const text of shown) expect(html).toContain(text);
    for (const text of absent) expect(html).not.toContain(text);
  });
  it("is trimmed and replaced whole by a later call, so a later call without a label returns the built-in name", () => {
    const scene = base().setSwitches({ labels: { place: "top-bar", label: "  Names  " } });
    expect(definitionOf(scene, [everything]).displaySwitches?.labels).toEqual({ place: "top-bar", label: "Names" });
    scene.setSwitches({ labels: { place: "top-bar" } });
    expect(definitionOf(scene, [everything]).displaySwitches?.labels).toEqual({ place: "top-bar" });
  });
  it.each([
    ["empty", ""],
    ["blank", "   "],
    ["a number", 3],
  ])("refuses a label that is %s with bad-switch", (_name, label) => {
    expect(codeOf(() => base().setSwitches({ labels: { place: "panel", label } } as never))).toMatch(
      /^bad-switch: setSwitches: labels\.label/,
    );
  });
});
