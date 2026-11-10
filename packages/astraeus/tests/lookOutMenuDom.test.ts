// @vitest-environment happy-dom
// O-064 T-293: the camera menu's "Look out from" entry on made-up scenes: the entries come from `scene.camera.setLookOutChoices`, sit with Focus and Follow on the bar,
// ask the viewer for a look-out request, and every other camera entry asks for its own request, which leaves the sky view (the viewer's own handling is in lookOut.test.ts).
import { afterEach, describe, expect, it } from "vitest";
import { Scene, SceneError, earth, mars, moon, type DataSource } from "astraeus";
import { catalogue } from "../src/assets/catalogue";
import { definitionOf } from "../src/api/definitionOf";
import { eqjUnitVector } from "../src/core/startView";
import { $, press, mountShell, type Mounted } from "./domSetup";

const everything: DataSource = { name: "made-up", provides: catalogue.ids() };
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };
const scene = () => new Scene().addBody(earth).addBody(mars).addBody(moon);
const presetsOf = (s: Scene) => definitionOf(s, [everything]).experience.cameraPresets;

let m: Mounted | undefined;
afterEach(() => { m?.unmount(); m = undefined; });

describe("SceneCamera.setLookOutChoices", () => {
  it("offers no Look out entry by default; the list given adds one for each listed body, labelled, after its Focus and Follow", () => {
    expect(presetsOf(scene()).filter((preset) => preset.request.kind === "lookOut")).toEqual([]);
    const some = scene();
    some.camera.setLookOutChoices([earth, "mars"]);
    const entries = presetsOf(some).filter((preset) => preset.request.kind === "lookOut");
    expect(entries.map((preset) => [preset.id, preset.label])).toEqual([["lookout-earth", "Look out from Earth"], ["lookout-mars", "Look out from Mars"]]);
    expect(entries[0]!.request).toEqual({ kind: "lookOut", body: "earth", direction: eqjUnitVector(0, 0) });
    const ids = presetsOf(some).map((preset) => preset.id);
    expect(ids.indexOf("lookout-earth")).toBe(ids.indexOf("follow-earth") + 1);
    const none = scene();
    none.camera.setLookOutChoices([]);
    expect(presetsOf(none).some((preset) => preset.request.kind === "lookOut")).toBe(false);
  });

  it("checks the list at the call: a body not added is unknown-body, and a later list replaces an earlier one", () => {
    expect(codeOf(() => scene().camera.setLookOutChoices(["venus"]))).toMatch(/^unknown-body: camera.setLookOutChoices/);
    expect(codeOf(() => scene().camera.setLookOutChoices("earth" as never))).toMatch(/^bad-camera: camera.setLookOutChoices/);
    const again = scene();
    again.camera.setLookOutChoices(["earth"]).setLookOutChoices(["mars"]);
    expect(presetsOf(again).filter((preset) => preset.request.kind === "lookOut").map((preset) => preset.id)).toEqual(["lookout-mars"]);
  });
});

describe("the camera menu with Look out entries", () => {
  const open = () => {
    const s = scene();
    s.camera.setLookOutChoices(["earth", "mars"]);
    m = mountShell({ experience: definitionOf(s, [everything]).experience });
    return m;
  };
  const pick = (id: string) => {
    const picker = $(m!.container, "select.object-picker") as HTMLSelectElement;
    picker.value = id;
    picker.dispatchEvent(new window.Event("change", { bubbles: true }));
  };
  const preset = (id: string) => m!.container.querySelector<HTMLElement>(`[data-camera-preset="${id}"]`);

  it("shows Look out for a listed body only, beside Focus and Follow, and asks for a look-out request that marks it pressed", () => {
    open();
    pick("earth");
    expect(preset("lookout-earth")).not.toBeNull();
    expect(preset("lookout-earth")!.getAttribute("aria-label")).toBe("Look out from Earth");
    expect(preset("lookout-earth")!.closest(".object-camera-actions")).toBe(preset("focus-earth")!.closest(".object-camera-actions"));
    press(preset("lookout-earth")!);
    expect(m!.cameraRequests.at(-1)).toEqual({ kind: "lookOut", body: "earth", direction: eqjUnitVector(0, 0) });
    expect(preset("lookout-earth")!.getAttribute("aria-pressed")).toBe("true");
    pick("moon");
    expect(preset("lookout-moon")).toBeNull();
    pick("mars");
    expect(preset("lookout-mars")).not.toBeNull();
  });

  it("leaves the sky view by Focus, Follow or Overview: each asks for its own request and the Look out entry is no longer pressed", () => {
    open();
    pick("mars");
    for (const [id, request] of [["focus-mars", { kind: "focus", target: "mars" }], ["follow-mars", { kind: "follow", target: "mars" }], ["overview", { kind: "overview" }]] as const) {
      press(preset("lookout-mars")!);
      expect(preset("lookout-mars")!.getAttribute("aria-pressed")).toBe("true");
      press(preset(id)!);
      expect(m!.cameraRequests.at(-1)).toEqual(request);
      expect(preset("lookout-mars")!.getAttribute("aria-pressed")).toBe("false");
    }
  });
});
