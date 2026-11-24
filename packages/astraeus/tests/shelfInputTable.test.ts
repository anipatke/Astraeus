// O-096 T-448: one table of bad shelf input. Every factory is given every kind of bad input; each pair says "refused with bad-part naming the field" or "accepted" with the reason, so an uneven check cannot come back.
// The same kinds run through the setters that take the same fields, with a stub link standing in for a viewer. A guard fails when a part marked `@shelf` has no rows.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  SceneError,
  actions,
  chart,
  colourKey,
  customBlock,
  explainer,
  filterChips,
  panel,
  readoutTile,
} from "astraeus";
import { blockOf } from "../src/shelf/part";

const message = (fn: () => unknown): string => {
  try {
    fn();
  } catch (error) {
    return error instanceof SceneError ? `${error.code}: ${error.message}` : `other: ${String(error)}`;
  }
  return "accepted";
};

type Kind = "blank text" | "fraction" | "backwards range" | "overlapping range" | "out-of-range value" | "empty list";
const KINDS: readonly Kind[] = [
  "blank text",
  "fraction",
  "backwards range",
  "overlapping range",
  "out-of-range value",
  "empty list",
];

interface Row {
  readonly part: string;
  readonly kind: Kind;
  readonly field: string;
  /** Builds the part with the bad value; a string expectation is the message fragment of the `bad-part` refusal, `accepted` carries the reason. */
  readonly run: () => unknown;
  readonly expect: string | { readonly accepted: string };
}

const ok = { label: "A", color: "#8fb4ff" };
const bins = [
  { low: 0, high: 10, count: 4 },
  { low: 10, high: 20, count: 9 },
];
const chartWith = (change: object) => () => chart({ id: "c", axisLabel: "Size", bins, ...change } as never);
const tileWith = (change: object) => () => readoutTile({ id: "t", label: "L", value: "V", ...change } as never);
const scale = (marks: unknown[]) => ({ scale: { low: 0, high: 10, value: 5, marks } });
const none = (reason: string) => ({ accepted: reason });
const NO_FIELD = "no field of this kind";

const rows: Row[] = [
  // panel
  {
    part: "panel",
    kind: "blank text",
    field: "title",
    run: () => panel({ id: "p", button: { label: "B" }, title: "  ", blocks: [customBlock({ id: "b" })] }),
    expect: "title must be a non-empty string",
  },
  {
    part: "panel",
    kind: "blank text",
    field: "id",
    run: () => panel({ id: " ", button: { label: "B" }, title: "T", blocks: [customBlock({ id: "b" })] }),
    expect: "id must be a non-empty string",
  },
  {
    part: "panel",
    kind: "blank text",
    field: "button.label",
    run: () => panel({ id: "p", button: { label: " " }, title: "T", blocks: [customBlock({ id: "b" })] }),
    expect: "button.label",
  },
  {
    part: "panel",
    kind: "blank text",
    field: "button.shortLabel",
    run: () =>
      panel({ id: "p", button: { label: "B", shortLabel: " " }, title: "T", blocks: [customBlock({ id: "b" })] }),
    expect: "shortLabel",
  },
  { part: "panel", kind: "fraction", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "panel", kind: "backwards range", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "panel", kind: "overlapping range", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "panel", kind: "out-of-range value", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  {
    part: "panel",
    kind: "empty list",
    field: "blocks",
    run: () => panel({ id: "p", button: { label: "B" }, title: "T", blocks: [] }),
    expect: "blocks must be a non-empty list",
  },
  // customBlock
  {
    part: "customBlock",
    kind: "blank text",
    field: "id",
    run: () => customBlock({ id: "  " }),
    expect: "id must be a non-empty string",
  },
  { part: "customBlock", kind: "fraction", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "customBlock", kind: "backwards range", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "customBlock", kind: "overlapping range", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "customBlock", kind: "out-of-range value", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "customBlock", kind: "empty list", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  // explainer
  {
    part: "explainer",
    kind: "blank text",
    field: "paragraphs",
    run: () => explainer({ id: "e", paragraphs: ["  "] }),
    expect: "paragraphs must be a",
  },
  {
    part: "explainer",
    kind: "blank text",
    field: "heading",
    run: () => explainer({ id: "e", heading: " ", paragraphs: [] }),
    expect: "heading must be a non-empty string",
  },
  {
    part: "explainer",
    kind: "blank text",
    field: "notes",
    run: () => explainer({ id: "e", paragraphs: [], notes: [" "] }),
    expect: "notes must be a",
  },
  { part: "explainer", kind: "fraction", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "explainer", kind: "backwards range", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "explainer", kind: "overlapping range", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "explainer", kind: "out-of-range value", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  {
    part: "explainer",
    kind: "empty list",
    field: "paragraphs",
    run: () => explainer({ id: "e", heading: "H", paragraphs: [] }),
    expect: none("an empty paragraphs list is lawful beside a heading or notes"),
  },
  // actions
  {
    part: "actions",
    kind: "blank text",
    field: "actions[0].label",
    run: () => actions({ id: "a", actions: [{ id: "x", label: " " }] }),
    expect: "label must be a non-empty string",
  },
  {
    part: "actions",
    kind: "blank text",
    field: "actions[0].id",
    run: () => actions({ id: "a", actions: [{ id: " ", label: "X" }] }),
    expect: "id must be a non-empty string",
  },
  { part: "actions", kind: "fraction", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "actions", kind: "backwards range", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "actions", kind: "overlapping range", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "actions", kind: "out-of-range value", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  {
    part: "actions",
    kind: "empty list",
    field: "actions",
    run: () => actions({ id: "a", actions: [] }),
    expect: "actions must be a",
  },
  // filterChips
  {
    part: "filterChips",
    kind: "blank text",
    field: "choices[0].label",
    run: () => filterChips({ id: "f", choices: [{ value: "a", label: " " }] }),
    expect: "label must be a non-empty string",
  },
  {
    part: "filterChips",
    kind: "blank text",
    field: "choices[0].value",
    run: () => filterChips({ id: "f", choices: [{ value: " ", label: "A" }] }),
    expect: "value must be a non-empty string",
  },
  {
    part: "filterChips",
    kind: "blank text",
    field: "label",
    run: () => filterChips({ id: "f", label: " ", choices: [{ value: "a", label: "A" }] }),
    expect: "label must be a non-empty string",
  },
  { part: "filterChips", kind: "fraction", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "filterChips", kind: "backwards range", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "filterChips", kind: "overlapping range", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "filterChips", kind: "out-of-range value", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  {
    part: "filterChips",
    kind: "empty list",
    field: "choices",
    run: () => filterChips({ id: "f", choices: [] }),
    expect: "choices must be a",
  },
  // colourKey
  {
    part: "colourKey",
    kind: "blank text",
    field: "entries[0].label",
    run: () => colourKey({ id: "k", entries: [{ ...ok, label: " " }] }),
    expect: "entries[0].label must be a non-empty string",
  },
  {
    part: "colourKey",
    kind: "blank text",
    field: "entries[0].note",
    run: () => colourKey({ id: "k", entries: [{ ...ok, note: " " }] }),
    expect: "entries[0].note must be a non-empty string",
  },
  {
    part: "colourKey",
    kind: "fraction",
    field: "entries[0].count",
    run: () => colourKey({ id: "k", entries: [{ ...ok, count: 2.5 }] }),
    expect: "entries[0].count must be a whole number of 0 or more",
  },
  { part: "colourKey", kind: "backwards range", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  { part: "colourKey", kind: "overlapping range", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  {
    part: "colourKey",
    kind: "out-of-range value",
    field: "entries[0].count",
    run: () => colourKey({ id: "k", entries: [{ ...ok, count: -1 }] }),
    expect: "entries[0].count must be a number of 0 or more",
  },
  {
    part: "colourKey",
    kind: "empty list",
    field: "entries",
    run: () => colourKey({ id: "k", entries: [] }),
    expect: "entries must be a non-empty list",
  },
  // chart
  {
    part: "chart",
    kind: "blank text",
    field: "axisLabel",
    run: chartWith({ axisLabel: " " }),
    expect: "axisLabel must be a non-empty string",
  },
  {
    part: "chart",
    kind: "blank text",
    field: "marks[0].label",
    run: chartWith({ marks: [{ value: 5, label: " " }] }),
    expect: "marks[0].label must be a non-empty string",
  },
  {
    part: "chart",
    kind: "fraction",
    field: "bins[0].count",
    run: chartWith({ bins: [{ low: 0, high: 10, count: 2.5 }] }),
    expect: none("counts are any finite number of 0 or more (owner, O-096: the colour key only)"),
  },
  {
    part: "chart",
    kind: "backwards range",
    field: "bins[1].low",
    run: chartWith({
      bins: [
        { low: 10, high: 20, count: 1 },
        { low: 0, high: 10, count: 1 },
      ],
    }),
    expect: "bins[1].low must be at or above bins[0].high",
  },
  {
    part: "chart",
    kind: "overlapping range",
    field: "bins[1].low",
    run: chartWith({
      bins: [
        { low: 0, high: 12, count: 1 },
        { low: 10, high: 20, count: 1 },
      ],
    }),
    expect: "bins[1].low must be at or above bins[0].high",
  },
  {
    part: "chart",
    kind: "out-of-range value",
    field: "marks[0].value",
    run: chartWith({ marks: [{ value: 99, label: "Off" }] }),
    expect: "marks[0].value must lie within the bins' range",
  },
  {
    part: "chart",
    kind: "empty list",
    field: "bins",
    run: chartWith({ bins: [] }),
    expect: "bins must be a non-empty list",
  },
  {
    part: "chart",
    kind: "empty list",
    field: "marks",
    run: chartWith({ marks: [] }),
    expect: none("an empty marks list is lawful"),
  },
  // readoutTile
  {
    part: "readoutTile",
    kind: "blank text",
    field: "label",
    run: tileWith({ label: " " }),
    expect: "label must be a non-empty string",
  },
  {
    part: "readoutTile",
    kind: "blank text",
    field: "value",
    run: tileWith({ value: " " }),
    expect: "value must be a non-empty string",
  },
  {
    part: "readoutTile",
    kind: "blank text",
    field: "facts[0].label",
    run: tileWith({ facts: [{ label: " ", value: "v" }] }),
    expect: "facts[0].label must be a non-empty string",
  },
  {
    part: "readoutTile",
    kind: "blank text",
    field: "scale.marks[0].label",
    run: tileWith(scale([{ value: 2, label: " " }])),
    expect: "label must be a non-empty string",
  },
  { part: "readoutTile", kind: "fraction", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  {
    part: "readoutTile",
    kind: "backwards range",
    field: "scale.low",
    run: tileWith({ scale: { low: 10, high: 0, value: 5 } }),
    expect: "scale",
  },
  { part: "readoutTile", kind: "overlapping range", field: "-", run: () => undefined, expect: none(NO_FIELD) },
  {
    part: "readoutTile",
    kind: "out-of-range value",
    field: "scale.marks[0].value",
    run: tileWith(scale([{ value: 99, label: "Off" }])),
    expect: "value",
  },
  {
    part: "readoutTile",
    kind: "empty list",
    field: "facts",
    run: tileWith({ facts: [] }),
    expect: none("an empty facts list is lawful"),
  },
];

describe("shelf input table (O-096 T-448)", () => {
  it.each(rows.map((row) => [row.part, row.kind, row.field, row] as const))(
    "%s, %s, %s",
    (_part, _kind, _field, row) => {
      const result = message(row.run);
      if (typeof row.expect === "string") {
        expect(result).toMatch(/^bad-part: /);
        expect(result).toContain(row.expect);
      } else {
        expect(result, row.expect.accepted).toBe("accepted");
      }
    },
  );

  it("states every kind for every part", () => {
    const parts = [...new Set(rows.map((row) => row.part))];
    expect(parts.length).toBe(8);
    for (const part of parts)
      for (const kind of KINDS)
        expect(
          rows.some((row) => row.part === part && row.kind === kind),
          `${part} has a row for ${kind}`,
        ).toBe(true);
  });

  it("every part exported with @shelf has rows, so a new part cannot skip the table", () => {
    const folder = new URL("../src/shelf/", import.meta.url);
    const tagged = readdirSync(folder, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({ entry, file: new URL(`${entry.name}/factory.ts`, folder) }))
      .filter(({ file }) => {
        try {
          return readFileSync(file, "utf8").includes("@shelf");
        } catch {
          return false;
        }
      })
      .map(({ entry }) => entry.name);
    expect(tagged.length).toBeGreaterThan(0);
    const covered = new Set(rows.map((row) => row.part));
    for (const name of tagged) expect(covered.has(name), `${name} has table rows`).toBe(true);
  });
});

// The setters that take the same fields, run through the descriptor's control with a stub link standing in for a viewer.
const controlOf = (part: unknown): Record<string, (...args: never[]) => void> => {
  let current: unknown = (part as { initial: unknown }).initial;
  const cell = { get: () => current, set: (next: unknown) => void (current = next) };
  const block = blockOf(part as never);
  return block.control!(
    { cell: () => cell, element: () => undefined, listen: () => () => undefined } as never,
    block,
  ) as never;
};

describe("shelf setters refuse the same input", () => {
  const key = () => controlOf(colourKey({ id: "k", entries: [ok] }));
  const sizes = () => controlOf(chart({ id: "c", axisLabel: "S", bins }));
  const text = () => controlOf(explainer({ id: "e", paragraphs: ["x"] }));
  const tile = () => controlOf(readoutTile({ id: "t", label: "L", value: "V" }));
  const cases: readonly (readonly [string, () => unknown, string])[] = [
    ["ExplainerControl.setParagraphs blank", () => text().setParagraphs(["  "] as never), "paragraphs"],
    [
      "ColourKeyControl.setEntries fraction",
      () => key().setEntries([{ ...ok, count: 1.5 }] as never),
      "count must be a whole number",
    ],
    ["ColourKeyControl.setEntries empty", () => key().setEntries([] as never), "entries must be a non-empty list"],
    ["ColourKeyControl.setEntries blank label", () => key().setEntries([{ ...ok, label: " " }] as never), "label"],
    [
      "ChartControl.setBins backwards",
      () =>
        sizes().setBins([
          { low: 5, high: 9, count: 1 },
          { low: 0, high: 5, count: 1 },
        ] as never),
      "bins[1].low must be at or above bins[0].high",
    ],
    [
      "ChartControl.setBins overlapping",
      () =>
        sizes().setBins([
          { low: 0, high: 6, count: 1 },
          { low: 5, high: 9, count: 1 },
        ] as never),
      "bins[1].low must be at or above bins[0].high",
    ],
    ["ReadoutTileControl.setValue blank", () => tile().setValue(" " as never), "value must be a non-empty string"],
    ["ReadoutTileControl.setFacts blank", () => tile().setFacts([{ label: " ", value: "v" }] as never), "label"],
  ];
  it.each(cases)("%s", (_name, run, fragment) => {
    const result = message(run);
    expect(result).toMatch(/^bad-part: /);
    expect(result).toContain(fragment);
  });

  it("ChartControl.setBins keeps a mark the new bins no longer cover, undrawn, without throwing", () => {
    const control = controlOf(chart({ id: "c", axisLabel: "S", bins, marks: [{ value: 15, label: "M" }] }));
    expect(message(() => control.setBins([{ low: 0, high: 5, count: 1 }] as never))).toBe("accepted");
  });
});
