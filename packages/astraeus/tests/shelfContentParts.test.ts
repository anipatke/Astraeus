// O-080 T-334: the shelf's first content parts (`explainer`, `actions`, `filterChips`, `colourKey`). Each factory refuses a malformed field alone with `bad-part` naming it, a descriptor is frozen,
// copies its input and is shared between scenes, and an action's camera is checked as a story panel's is (shape at the call, ids when the scene is built), each on a made-up scene (ARCH-03).
// The viewer, the handle and the two embedding paths run in lifecycle.test.ts and twoViewers.test.ts.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, actions, colourKey, earth, explainer, filterChips, panel } from "astraeus";
import { definitionOf } from "../src/api/definitionOf";
import { blockOf } from "../src/shelf/part";
import type { ActionsData } from "../src/shelf/actions/factory";

const made = [{ name: "made-up", provides: ["earth"] }] as const;
const base = () => new Scene().addBody(earth);
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };
const holding = (...blocks: Parameters<typeof panel>[0]["blocks"]) => panel({ id: "p", button: { label: "P" }, title: "P", blocks });

/** One row per factory: a good input, and each field broken alone with the message it must carry. */
const FACTORIES = [
  {
    name: "explainer", make: (change: Record<string, unknown> = {}) => explainer({ id: "e", paragraphs: ["One."], ...change } as never),
    bad: [
      [{ id: "" }, /id must be a non-empty string/], [{ paragraphs: "x" }, /paragraphs must be a list of non-empty strings/], [{ paragraphs: [""] }, /paragraphs must be a list/],
      [{ heading: "" }, /heading must be a non-empty string/], [{ notes: [3] }, /notes must be a list of non-empty strings/], [{ paragraphs: [] }, /an empty explainer shows nothing/],
    ],
  },
  {
    name: "actions", make: (change: Record<string, unknown> = {}) => actions({ id: "a", actions: [{ id: "go", label: "Go" }], ...change } as never),
    bad: [
      [{ id: 4 }, /id must be a non-empty string/], [{ actions: [] }, /actions must be a non-empty list/], [{ actions: ["x"] }, /actions\[0\] must be/],
      [{ actions: [{ id: "", label: "Go" }] }, /actions\[0\]\.id must be a non-empty string/], [{ actions: [{ id: "go", label: "" }] }, /actions\[0\]\.label must be a non-empty string/],
      [{ actions: [{ id: "go", label: "A" }, { id: "go", label: "B" }] }, /actions\[1\]\.id "go" is used twice/],
      [{ actions: [{ id: "go", label: "Go", camera: { focus: "" } }] }, /actions\[0\]\.camera is not a camera target/], [{ actions: [{ id: "go", label: "Go", camera: "earth" }] }, /actions\[0\]\.camera is not a camera target/],
    ],
  },
  {
    name: "filterChips", make: (change: Record<string, unknown> = {}) => filterChips({ id: "f", choices: [{ value: "a", label: "A" }, { value: "b", label: "B" }], ...change } as never),
    bad: [
      [{ id: "" }, /id must be a non-empty string/], [{ choices: [] }, /choices must be a non-empty list/], [{ choices: [{ value: "", label: "A" }] }, /choices\[0\]\.value must be a non-empty string/],
      [{ choices: [{ value: "a", label: "" }] }, /choices\[0\]\.label must be a non-empty string/], [{ choices: [{ value: "a", label: "A" }, { value: "a", label: "B" }] }, /choices\[1\]\.value "a" is used twice/],
      [{ choices: [{ value: "a", label: "A", color: "loud" }] }, /choices\[0\]\.color must be a CSS colour text/], [{ multiple: "yes" }, /multiple must be true or false/],
      [{ selected: "a" }, /selected must be a list of choice values/], [{ selected: ["zz"] }, /selected "zz" is not one of the choices/], [{ selected: ["a", "b"] }, /single-choice row/],
      [{ selected: ["a", "a"], multiple: true }, /names a value twice/], [{ label: "" }, /label must be a non-empty string/],
    ],
  },
  {
    name: "colourKey", make: (change: Record<string, unknown> = {}) => colourKey({ id: "k", entries: [{ label: "Belt", color: "#8fb4ff" }], ...change } as never),
    bad: [
      [{ id: "" }, /id must be a non-empty string/], [{ entries: "x" }, /entries must be a list/], [{ entries: ["x"] }, /entries\[0\] must be/], [{ entries: [{ label: "", color: "red" }] }, /entries\[0\]\.label must be a non-empty string/],
      [{ entries: [{ label: "A", color: "loud" }] }, /entries\[0\]\.color must be a CSS colour text/], [{ entries: [{ label: "A", color: "red", count: -1 }] }, /entries\[0\]\.count must be a number of 0 or more/],
      [{ entries: [{ label: "A", color: "red", count: Number.NaN }] }, /entries\[0\]\.count/], [{ entries: [{ label: "A", color: "red", note: "" }] }, /entries\[0\]\.note must be a non-empty string/],
    ],
  },
] as const;

describe.each(FACTORIES)("$name checks its input at the call (bad-part)", ({ name, make, bad }) => {
  it("is not a plain object", () => {
    expect(codeOf(() => ({ explainer, actions, filterChips, colourKey })[name as "explainer"](undefined as never))).toMatch(new RegExp(`^bad-part: ${name}: give an? \\{`));
    expect(codeOf(() => ({ explainer, actions, filterChips, colourKey })[name as "explainer"]([] as never))).toMatch(/^bad-part/);
  });

  it.each(bad.map((row) => [JSON.stringify(row[0]), row[0], row[1]] as const))("refuses %s", (_label, change, message) => {
    const text = codeOf(() => make(change as Record<string, unknown>));
    expect(text).toMatch(/^bad-part: /);
    expect(text).toMatch(message);
    expect(text).toContain(`${name}:`);
  });

  it("makes a frozen descriptor a panel accepts, shared between scenes", () => {
    const part = make();
    expect(Object.isFrozen(part)).toBe(true);
    expect(blockOf(part as never).kind).toBe(name);
    const holder = holding(part as never);
    expect(definitionOf(base().addParts([holder]), [...made]).parts).toHaveLength(1);
    expect(definitionOf(base().addParts([holder]), [...made]).parts![0]).toBe(definitionOf(base().addParts([holder]), [...made]).parts![0]);
  });
});

describe("a descriptor keeps no reference to the caller's objects", () => {
  it("chips, key rows, paragraphs and actions are copied at the call", () => {
    const choices = [{ value: "a", label: "A" }];
    const entries = [{ label: "Belt", color: "#8fb4ff" }];
    const paragraphs = ["One."];
    const list = [{ id: "go", label: "Go" }];
    const chips = filterChips({ id: "f", choices });
    const key = colourKey({ id: "k", entries });
    const text = explainer({ id: "e", paragraphs });
    const buttons = actions({ id: "a", actions: list });
    choices.push({ value: "b", label: "B" }); entries[0].label = "changed"; paragraphs.push("late"); list[0].label = "changed";
    expect((blockOf(chips as never).initial as { choices: unknown[] }).choices).toHaveLength(1);
    expect((blockOf(key as never).initial as { entries: { label: string }[] }).entries[0].label).toBe("Belt");
    expect((blockOf(text as never).initial as { paragraphs: string[] }).paragraphs).toEqual(["One."]);
    expect((blockOf(buttons as never).data as ActionsData).actions[0].label).toBe("Go");
    expect(Object.isFrozen(blockOf(chips as never).initial)).toBe(true);
  });
});

describe("a part's ids are checked with the scene's (duplicate-id), and an action's camera ids when the scene is built (bad-part)", () => {
  it("a block id used twice in a scene is duplicate-id, across panels and kinds", () => {
    const one = holding(explainer({ id: "same", paragraphs: ["x"] }));
    const two = panel({ id: "q", button: { label: "Q" }, title: "Q", blocks: [colourKey({ id: "same", entries: [] })] });
    expect(codeOf(() => base().addParts([one, two]))).toMatch(/^duplicate-id/);
  });

  it("an action's camera naming an object the scene lacks is refused when the scene is built, naming the action", () => {
    const fly = (camera: unknown) => holding(actions({ id: "fly", actions: [{ id: "to", label: "To", camera: camera as never }] }));
    expect(() => definitionOf(base().addParts([fly({ focus: "earth" })]), [...made])).not.toThrow();
    expect(codeOf(() => definitionOf(base().addParts([fly({ focus: "ceres" })]), [...made]))).toMatch(/^bad-part: actions "fly": action "to" camera names "ceres"/);
    expect(codeOf(() => definitionOf(base().addParts([fly({ lookOut: "earth", direction: "nowhere" })]), [...made]))).toMatch(/^bad-part: actions "fly": action "to" camera turns toward "nowhere"/);
    expect(() => definitionOf(base().addParts([fly({ focus: "earth", azimuthDeg: 10, elevationDeg: 20, distance: 5 })]), [...made])).not.toThrow();
  });

  it("a colour key may start empty and a chip row may start with a value lit", () => {
    expect(colourKey({ id: "k", entries: [] })).toMatchObject({ kind: "colourKey" });
    const chips = filterChips({ id: "f", choices: [{ value: "a", label: "A" }, { value: "b", label: "B" }], multiple: true, selected: ["b", "a"] });
    expect((blockOf(chips as never).initial as { selected: string[] }).selected).toEqual(["a", "b"]);
  });
});
