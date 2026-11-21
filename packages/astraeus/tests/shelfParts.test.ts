// O-080 T-333: the shelf's groundwork, first parts: `panel` and `customBlock` factories, `Scene.addParts` and view scoping. Each input is changed alone on a made-up scene (ARCH-03).
// The handle (`handle.part`) and the viewer run on both embedding paths in lifecycle.test.ts and twoViewers.test.ts; the bar and the panel in shelfBar.test.ts and panelRule.test.ts.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, customBlock, earth, panel, type PanelInput } from "astraeus";
import { definitionOf } from "../src/api/definitionOf";
import { partOf } from "../src/shelf/part";

const made = [{ name: "made-up", provides: ["earth"] }] as const;
const base = () => new Scene().addBody(earth);
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };
const gaps = () => panel({ id: "gaps", button: { label: "Kirkwood gaps", shortLabel: "Gaps" }, title: "The Kirkwood gaps", blocks: [customBlock({ id: "gaps-body" })] });
const empty = () => panel({ id: "empty", button: { label: "How empty is it?" }, title: "How empty?", blocks: [customBlock({ id: "empty-body" })] });
const input = (change: Record<string, unknown> = {}): PanelInput => ({ id: "p", button: { label: "P" }, title: "P", blocks: [customBlock({ id: "p-body" })], ...change } as PanelInput);

describe("the factories check their input at the call (bad-part)", () => {
  it("customBlock needs a plain { id } object with a non-empty id", () => {
    expect(codeOf(() => customBlock(undefined as never))).toMatch(/^bad-part: customBlock: give a \{ id \} object/);
    expect(codeOf(() => customBlock([] as never))).toMatch(/^bad-part/);
    expect(codeOf(() => customBlock({ id: "" }))).toMatch(/^bad-part: customBlock: id must be a non-empty string/);
    expect(codeOf(() => customBlock({ id: 3 } as never))).toMatch(/^bad-part/);
    expect(customBlock({ id: "ok" })).toMatchObject({ kind: "customBlock", id: "ok" });
  });

  it("panel refuses each malformed field alone, naming it", () => {
    expect(codeOf(() => panel(undefined as never))).toMatch(/^bad-part: panel: give a \{ id, button, title, blocks \} object/);
    expect(codeOf(() => panel(input({ id: "" })))).toMatch(/^bad-part: .*id must be a non-empty string/);
    expect(codeOf(() => panel(input({ button: undefined })))).toMatch(/^bad-part: .*button as \{ label, shortLabel\? \}/);
    expect(codeOf(() => panel(input({ button: { label: "" } })))).toMatch(/^bad-part: .*button\.label must be a non-empty string/);
    expect(codeOf(() => panel(input({ button: { label: "P", shortLabel: "" } })))).toMatch(/^bad-part: .*button\.shortLabel must be a non-empty string/);
    expect(codeOf(() => panel(input({ title: "" })))).toMatch(/^bad-part: .*title must be a non-empty string/);
    expect(codeOf(() => panel(input({ blocks: [] })))).toMatch(/^bad-part: .*blocks must be a non-empty list/);
    expect(codeOf(() => panel(input({ blocks: "x" })))).toMatch(/^bad-part: .*blocks must be a non-empty list/);
  });

  it("a block that no factory made, or a panel inside a panel, is refused", () => {
    expect(codeOf(() => panel(input({ blocks: [{ kind: "customBlock", id: "fake" }] })))).toMatch(/^bad-part: .*blocks\[0\] is not a block made by a shelf factory/);
    expect(codeOf(() => panel(input({ blocks: [gaps()] })))).toMatch(/^bad-part: .*cannot hold a panel/);
  });

  it("a descriptor is frozen, keeps no reference to the caller's objects, and is shared between scenes", () => {
    const button = { label: "A", shortLabel: "a" };
    const blocks = [customBlock({ id: "a-body" })];
    const part = panel({ id: "a", button, title: "A", blocks });
    button.label = "changed";
    blocks.push(customBlock({ id: "late" }));
    expect(Object.isFrozen(part)).toBe(true);
    expect(Object.isFrozen(part.button)).toBe(true);
    expect(Object.isFrozen(part.blocks)).toBe(true);
    expect(partOf(part).button).toEqual({ label: "A", shortLabel: "a" });
    expect(partOf(part).blocks.map((block) => block.id)).toEqual(["a-body"]);
    const one = base().addParts([part]);
    const two = base().addParts([part]);
    expect(definitionOf(one, [...made]).parts).toHaveLength(1);
    expect(definitionOf(two, [...made]).parts![0]).toBe(definitionOf(one, [...made]).parts![0]);
  });
});

describe("Scene.addParts", () => {
  it("appends in the order added, and the definition carries the parts (absent when none)", () => {
    expect(definitionOf(base(), [...made]).parts).toBeUndefined();
    const scene = base().addParts([gaps()]).addParts([empty()]);
    expect(definitionOf(scene, [...made]).parts!.map((part) => part.id)).toEqual(["gaps", "empty"]);
    expect(definitionOf(scene, [...made]).parts![0]!.view).toBeTypeOf("function");
  });

  it("refuses a value no shelf factory made with bad-part, naming the item, and a non-list", () => {
    expect(codeOf(() => base().addParts({ kind: "panel", id: "x", button: { label: "X" }, title: "X", blocks: [] } as never))).toMatch(/^bad-part: addParts: give a list/);
    expect(codeOf(() => base().addParts([{ kind: "panel", id: "x", button: { label: "X" }, title: "X", blocks: [] }] as never))).toMatch(/^bad-part: addParts: parts\[0\] is not a part made by a shelf factory/);
    expect(codeOf(() => base().addParts([customBlock({ id: "loose" })] as never))).toMatch(/^bad-part: addParts: parts\[0\].*blocks go in a panel's blocks/);
    expect(codeOf(() => base().addParts([gaps(), null] as never))).toMatch(/^bad-part: addParts: parts\[1\]/);
  });

  it("duplicate-id across part and block ids, in one call or across calls, and a failed call adds nothing", () => {
    const scene = base().addParts([gaps()]);
    expect(codeOf(() => scene.addParts([gaps()]))).toMatch(/^duplicate-id: addParts: "gaps"/);
    expect(codeOf(() => scene.addParts([panel({ id: "other", button: { label: "O" }, title: "O", blocks: [customBlock({ id: "gaps" })] })]))).toMatch(/^duplicate-id: .*"gaps"/);
    expect(codeOf(() => scene.addParts([panel({ id: "gaps-body", button: { label: "O" }, title: "O", blocks: [customBlock({ id: "o-body" })] })]))).toMatch(/^duplicate-id: .*"gaps-body"/);
    expect(codeOf(() => base().addParts([empty(), empty()]))).toMatch(/^duplicate-id/);
    // the same block object in two panels is the same id twice
    const shared = customBlock({ id: "shared" });
    expect(codeOf(() => base().addParts([panel({ id: "a", button: { label: "A" }, title: "A", blocks: [shared] }), panel({ id: "b", button: { label: "B" }, title: "B", blocks: [shared] })]))).toMatch(/^duplicate-id: .*"shared"/);
    const partial = base();
    expect(codeOf(() => partial.addParts([empty(), empty()]))).toMatch(/^duplicate-id/);
    expect(definitionOf(partial, [...made]).parts).toBeUndefined();
    expect(definitionOf(scene, [...made]).parts!.map((part) => part.id)).toEqual(["gaps"]);
  });

  it("a part id that is also a story panel's id is a duplicate-id when the scene is built", () => {
    const story = { id: "gaps", title: "Gaps", body: "A line.", provenance: { sourceType: "illustrative" as const, sources: ["Made up"], accuracy: "None.", notes: "Made up." } };
    const scene = base().setTime("2026-01-01T00:00:00Z").addStoryPanels([{ ...story, at: { time: new Date("2026-01-01T00:00:00Z") } }]).addParts([gaps()]);
    expect(codeOf(() => definitionOf(scene, [...made]))).toMatch(/^duplicate-id: addParts: "gaps" is also the id of a story panel/);
  });
});

describe("view scoping reuses the view rule (ViewInput.panels)", () => {
  const viewed = () => base().addParts([gaps(), empty()]).setViews([{ id: "a", label: "A" }, { id: "b", label: "B", panels: ["gaps"] }], { place: "top-bar" });

  it("a part id some view lists shows only in those views; an unlisted part shows in every view", () => {
    const views = definitionOf(viewed(), [...made]).views!.views;
    expect([...views[0]!.panels].sort()).toEqual(["empty"]);
    expect([...views[1]!.panels].sort()).toEqual(["empty", "gaps"]);
    expect(viewed().views!.items.map((item) => [item.id, [...item.panels].sort()])).toEqual([["a", ["empty"]], ["b", ["empty", "gaps"]]]);
  });

  it("an id that is neither a story panel nor a part stays bad-view", () => {
    expect(codeOf(() => base().addParts([gaps()]).setViews([{ id: "a", label: "A", panels: ["nope"] }], { place: "top-bar" }).views)).toMatch(/^bad-view: .*"nope"/);
  });
});
