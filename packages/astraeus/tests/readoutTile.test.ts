// @vitest-environment happy-dom
// O-081 T-338: the readout tile. The factory refuses a malformed field alone with `bad-part` naming it, the descriptor is frozen and shared, `addParts` takes it (ids unique, a tile never in a panel, at most one tile in a view),
// and the shell draws it in its own place: the card on a wide viewer, the strip and the sheet on a phone. Made-up parts on the pretend page (ARCH-03). Both embedding paths and two viewers: lifecycle.test.ts, twoViewers.test.ts.
import { afterEach, describe, expect, it } from "vitest";
import { Scene, SceneError, customBlock, earth, explainer, panel, readoutTile } from "astraeus";
import { definitionOf } from "../src/api/definitionOf";
import { blockOf, partOf } from "../src/shelf/part";
import { $, mountShell, press, pressKey, type Mounted } from "./domSetup";

const made = [{ name: "made-up", provides: ["earth"] }] as const;
const base = () => new Scene().addBody(earth);
const codeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error);
  }
  return "no error";
};
const scale = { low: 1, high: 100, value: 10, stretch: "log", marks: [{ value: 50, label: "Half" }] } as const;
const make = (change: Record<string, unknown> = {}) =>
  readoutTile({
    id: "t",
    label: "Gap",
    value: "4 units",
    scale,
    facts: [{ label: "Speed", value: "7" }],
    ...change,
  } as never);

describe("readoutTile checks its input at the call (bad-part)", () => {
  it.each([
    [{ id: "" }, /id must be a non-empty string/],
    [{ label: "" }, /label must be a non-empty string/],
    [{ label: 3 }, /label must be a non-empty string/],
    [{ value: "" }, /value must be a non-empty string/],
    [{ scale: "x" }, /give scale as/],
    [{ scale: { ...scale, low: Number.NaN } }, /scale\.low and scale\.high must be finite/],
    [{ scale: { ...scale, high: Number.POSITIVE_INFINITY } }, /finite numbers/],
    [{ scale: { ...scale, low: 100, high: 1 } }, /scale\.low must be less than scale\.high/],
    [{ scale: { ...scale, high: 1 } }, /scale\.low must be less than scale\.high/],
    [{ scale: { ...scale, value: 101 } }, /scale\.value must be a finite number from/],
    [{ scale: { ...scale, value: Number.NaN } }, /scale\.value must be a finite number/],
    [{ scale: { ...scale, stretch: "sqrt" } }, /stretch must be "linear" or "log"/],
    [{ scale: { ...scale, low: 0, value: 1 } }, /a log scale needs scale\.low above 0/],
    [{ scale: { ...scale, low: -1, value: 1 } }, /a log scale needs/],
    [{ scale: { ...scale, marks: "x" } }, /scale\.marks must be a list/],
    [{ scale: { ...scale, marks: ["x"] } }, /scale\.marks\[0\] must be/],
    [
      { scale: { ...scale, marks: [{ value: 500, label: "Far" }] } },
      /scale\.marks\[0\]\.value must be a finite number from/,
    ],
    [{ scale: { ...scale, marks: [{ value: Number.NaN, label: "A" }] } }, /marks\[0\]\.value/],
    [{ scale: { ...scale, marks: [{ value: 5, label: "" }] } }, /scale\.marks\[0\]\.label must be a non-empty string/],
    [{ facts: "x" }, /facts must be a list/],
    [{ facts: ["x"] }, /facts\[0\] must be/],
    [{ facts: [{ label: "", value: "1" }] }, /facts\[0\]\.label must be a non-empty string/],
    [{ facts: [{ label: "A", value: "" }] }, /facts\[0\]\.value/],
    [{ facts: Array.from({ length: 5 }, (_, i) => ({ label: `L${i}`, value: "1" })) }, /facts holds at most 4/],
  ] as const)("refuses %j", (change, message) => {
    const text = codeOf(() => make(change as Record<string, unknown>));
    expect(text).toMatch(/^bad-part: readoutTile: /);
    expect(text).toMatch(message);
  });

  it("is not a plain object", () => {
    expect(codeOf(() => readoutTile(undefined as never))).toMatch(/^bad-part: readoutTile: give an \{/);
    expect(codeOf(() => readoutTile([] as never))).toMatch(/^bad-part/);
  });

  it("makes a frozen descriptor that copies its input and needs neither scale nor facts", () => {
    const marks = [{ value: 50, label: "Half" }];
    const part = readoutTile({ id: "t", label: "Gap", value: "4", scale: { low: 1, high: 100, value: 10, marks } });
    marks[0]!.label = "changed";
    marks.push({ value: 60, label: "late" });
    expect(Object.isFrozen(part)).toBe(true);
    const inner = blockOf(part as never).data as { scale: { stretch: string; marks: { label: string }[] } };
    expect([inner.scale.stretch, inner.scale.marks.map((mark) => mark.label)]).toEqual(["linear", ["Half"]]);
    const bare = readoutTile({ id: "u", label: "A", value: "1" });
    expect(blockOf(bare as never).initial).toEqual({ value: "1", facts: [] });
    expect(partOf(bare).label).toBe("A");
  });
});

describe("addParts takes a tile", () => {
  it("accepts a tile beside a panel, keeps the order, and shares the descriptor between scenes", () => {
    const tile = make();
    const hold = panel({
      id: "notes",
      button: { label: "Notes" },
      title: "Notes",
      blocks: [customBlock({ id: "body" })],
    });
    const one = base().addParts([hold, tile]);
    expect(definitionOf(one, [...made]).parts!.map((part) => part.id)).toEqual(["notes", "t"]);
    expect(definitionOf(base().addParts([tile]), [...made]).parts![0]).toBe(
      definitionOf(base().addParts([tile]), [...made]).parts![0],
    );
  });
  it("refuses an id used by a part or a block (duplicate-id) and a tile inside a panel (bad-part)", () => {
    expect(codeOf(() => base().addParts([make(), make()]))).toMatch(/^duplicate-id: addParts: "t"/);
    const hold = panel({
      id: "p",
      button: { label: "P" },
      title: "P",
      blocks: [explainer({ id: "t", paragraphs: ["x"] })],
    });
    expect(codeOf(() => base().addParts([hold, make()]))).toMatch(/^duplicate-id/);
    expect(codeOf(() => panel({ id: "p", button: { label: "P" }, title: "P", blocks: [make() as never] }))).toMatch(
      /^bad-part: panel: a panel cannot hold a readoutTile/,
    );
    expect(codeOf(() => base().addParts([{ kind: "readoutTile", id: "x", label: "X" } as never]))).toMatch(
      /^bad-part: addParts: parts\[0\]/,
    );
  });
  it("one tile per view: two tiles that would show in one view are refused naming both; each in its own view is fine", () => {
    const a = make({ id: "a" }),
      b = make({ id: "b" });
    expect(codeOf(() => definitionOf(base().addParts([a, b]), [...made]))).toMatch(
      /^bad-part: addParts: the readoutTiles "a" and "b" would show in the same view/,
    );
    const views = (panels: [string[], string[]]) =>
      base()
        .addParts([a, b])
        .setViews(
          [
            { id: "v1", label: "One", panels: panels[0] },
            { id: "v2", label: "Two", panels: panels[1] },
          ],
          { place: "top-bar", start: "v1" },
        );
    expect(codeOf(() => definitionOf(views([["a"], ["b"]]), [...made]))).toBe("no error");
    expect(codeOf(() => definitionOf(views([["a", "b"], []]), [...made]))).toMatch(
      /^bad-part: addParts: the readoutTiles "a" and "b"/,
    );
    // a tile no view lists shows in every view, so it meets the other tile there
    expect(
      codeOf(() =>
        definitionOf(
          base()
            .addParts([a, b])
            .setViews(
              [
                { id: "v1", label: "One", panels: ["a"] },
                { id: "v2", label: "Two", panels: [] },
              ],
              { place: "top-bar", start: "v1" },
            ),
          [...made],
        ),
      ),
    ).toMatch(/^bad-part: addParts: the readoutTiles "a" and "b"/);
    expect(
      codeOf(() =>
        definitionOf(
          base()
            .addParts([a, make({ id: "c" })])
            .setViews(
              [
                { id: "v1", label: "One" },
                { id: "v2", label: "Two" },
              ],
              { place: "top-bar", start: "v1" },
            ),
          [...made],
        ),
      ),
    ).toMatch(/^bad-part/);
  });
});

describe("the shell draws the tile in its own place", () => {
  let m: Mounted;
  afterEach(() => m.unmount());
  const one = partOf(make({ id: "one", label: "Gap one", value: "4 units" }));
  const two = partOf(make({ id: "two", label: "Gap two", value: "9 units", scale: undefined, facts: [] }));
  const hold = partOf(
    panel({ id: "notes", button: { label: "Notes" }, title: "Notes", blocks: [customBlock({ id: "body" })] }),
  );
  const about = { title: "The belt" };
  const area = () => m.container.querySelector<HTMLElement>('[data-area="tile"]');

  it("wide: the full tile sits in the tile area, always shown, with no strip, and About opens in the left place beside it", () => {
    m = mountShell({ about, shelfParts: [hold, one] });
    expect(area()!.querySelector('[data-shelf-tile="one"]')).not.toBeNull();
    expect(area()!.querySelector("[data-shelf-tile-strip]")).toBeNull();
    expect(area()!.querySelector("button")).toBeNull();
    expect($(area()!, "[data-shelf-tile-value]").textContent).toBe("4 units");
    expect(area()!.querySelectorAll("[data-shelf-tile-dot]")).toHaveLength(1);
    expect(area()!.querySelector('[data-shelf-tile-mark="0"]')!.textContent).toBe("Half");
    expect([...area()!.querySelectorAll(".shelf-tile-fact")].map((fact) => fact.textContent)).toEqual(["Speed7"]);
    press($(m.container, "[data-bar-title]"));
    expect(area()).not.toBeNull();
    expect(m.container.querySelector('[data-area="left"] [data-about]')).not.toBeNull();
    expect(area()!.parentElement).toBe(m.container.querySelector(".astraeus-areas"));
  });

  it("no tile in the showing view: no tile area; a view switch shows the other view's tile", () => {
    m = mountShell({ about, shelfParts: [hold] });
    expect(area()).toBeNull();
    m.showParts([hold, one]);
    expect($(area()!, "[data-shelf-tile-value]").textContent).toBe("4 units");
    m.showParts([hold, two]);
    expect($(area()!, "[data-shelf-tile-value]").textContent).toBe("9 units");
    expect(area()!.querySelector("[data-shelf-tile-dot]")).toBeNull();
    m.showParts([hold]);
    expect(area()).toBeNull();
  });

  it("phone: a one-line strip with the label and value; a tap opens the sheet, Escape closes it, About replaces it, a view switch to another tile closes it", () => {
    m = mountShell({ about, phone: true, shelfParts: [hold, one] });
    const strip = () => $(area()!, "button.tile-strip-button");
    expect(strip().textContent).toBe("Gap one4 units");
    expect(strip().getAttribute("aria-expanded")).toBe("false");
    expect(area()!.querySelector("[data-shelf-tile-dot]")).toBeNull();
    expect(m.container.querySelector("[data-tile-sheet]")).toBeNull();
    press(strip());
    expect(strip().getAttribute("aria-expanded")).toBe("true");
    const sheet = $(m.container, "[data-tile-sheet]");
    expect(sheet.id).toBe(strip().getAttribute("aria-controls"));
    expect(sheet.querySelector("[data-shelf-tile-dot]")).not.toBeNull();
    pressKey(document, "Escape");
    expect(m.container.querySelector("[data-tile-sheet]")).toBeNull();
    press(strip());
    press($(m.container, "[data-bar-title]"));
    expect(m.container.querySelector("[data-tile-sheet]")).toBeNull();
    expect(m.container.querySelector("[data-about]")).not.toBeNull();
    press(strip());
    expect(m.container.querySelector("[data-about]")).toBeNull();
    m.showParts([hold, two]);
    expect(m.container.querySelector("[data-tile-sheet]")).toBeNull();
    expect($(area()!, "button.tile-strip-button").textContent).toBe("Gap two9 units");
    press($(m.container, "button.tile-strip-button"));
    press($(m.container, ".info-panel-close"));
    expect(m.container.querySelector("[data-tile-sheet]")).toBeNull();
  });
});
