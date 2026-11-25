// O-101 T-460: the host's own labels (`addLabels`), proved on made-up groups and panels only (ARCH-03). One table of faults (the code and the field named, API-05) and one of good forms that land in the definition.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, type GroupInput, type LabelInput } from "astraeus";
import { definitionOf } from "./definitionOf";
import { panel } from "../src/shelf/panel/factory";
import { customBlock } from "../src/shelf/customBlock/factory";

const T0 = Date.parse("2026-01-01T00:00:00Z");
const group = (id: string): GroupInput => ({
  id,
  plane: "ecliptic-j2000",
  orbits: [0, 1, 2].map((k) => ({
    id: `${id}-${k}`,
    semiMajorAxisKm: 80_000 + 5_000 * k,
    eccentricity: 0.1,
    inclinationDeg: 5,
    raanDeg: 40,
    argumentOfPeriapsisDeg: 70,
  })),
});
const made = { sourceType: "illustrative", sources: ["Made up"], accuracy: "Not real.", notes: "" } as const;
const base = () =>
  new Scene()
    .addBody(earth)
    .addBody(moon)
    .setTime(T0)
    .addGroup(group("belt-a"))
    .addGroup(group("belt-b"))
    .addStoryPanels([{ id: "story-one", title: "One", body: "Made up.", provenance: made }])
    .addParts([
      panel({ id: "shelf-one", button: { label: "Shelf" }, title: "Shelf", blocks: [customBlock({ id: "blk" })] }),
    ]);
const point = { positionKm: [1e8, 0, 0], plane: "EQJ" } as const;
const label = (extra: Record<string, unknown> = {}): LabelInput =>
  ({ id: "mark", label: "Mark", anchor: point, ...extra }) as LabelInput;
const failure = (fn: () => unknown): { code: string; message: string } => {
  try {
    fn();
  } catch (error) {
    if (error instanceof SceneError) return { code: error.code, message: error.message };
    throw error;
  }
  return { code: "no error", message: "" };
};

describe("addLabels faults", () => {
  const atCall: readonly (readonly [string, Record<string, unknown>, string])[] = [
    ["id", { id: "" }, "id"],
    ["label blank", { label: "  " }, "label"],
    ["color", { color: "red" }, "color"],
    ["labelPriority", { labelPriority: Number.NaN }, "labelPriority"],
    ["anchor both forms", { anchor: { ...point, groups: ["belt-a"] } }, "anchor"],
    ["anchor neither", { anchor: {} }, "anchor"],
    ["positionKm", { anchor: { positionKm: [1, 2], plane: "EQJ" } }, "anchor.positionKm"],
    ["plane", { anchor: { positionKm: [1, 2, 3], plane: "galactic" } }, "anchor.plane"],
    ["center type", { anchor: { ...point, center: 4 } }, "anchor.center"],
    ["anchor.groups empty", { anchor: { groups: [] } }, "anchor.groups"],
    ["anchor.groups repeat", { anchor: { groups: ["belt-a", "belt-a"] } }, "anchor.groups[1]"],
    ["selects both", { selects: { groups: ["belt-a"], panel: "x" } }, "selects"],
    ["selects.groups entry", { selects: { groups: [""] } }, "selects.groups[0]"],
    ["selects.panel", { selects: { panel: "" } }, "selects.panel"],
    ["description on one group", { selects: { groups: ["belt-a"] }, description: "Text." }, "description"],
    ["provenance without selects", { provenance: made }, "provenance"],
    ["knownLimitations on a panel", { selects: { panel: "story-one" }, knownLimitations: ["x"] }, "knownLimitations"],
    ["description blank", { selects: { groups: ["belt-a", "belt-b"] }, description: "" }, "description"],
    [
      "provenance malformed",
      { selects: { groups: ["belt-a", "belt-b"] }, provenance: { sourceType: "nope" } },
      "provenance",
    ],
    [
      "knownLimitations entry",
      { selects: { groups: ["belt-a", "belt-b"] }, knownLimitations: [""] },
      "knownLimitations",
    ],
  ];
  it.each(atCall)("refuses at the call: %s", (_name, extra, field) => {
    const scene = base();
    const result = failure(() => scene.addLabels([label(extra)]));
    expect(result.code).toBe("bad-label");
    expect(result.message).toContain(field);
    expect(result.message).toContain('addLabels("');
  });

  const atBuild: readonly (readonly [string, Record<string, unknown>, string, string])[] = [
    ["unknown anchor group", { anchor: { groups: ["belt-a", "nope"] } }, "bad-label", "anchor.groups[1]"],
    ["a body as a group", { selects: { groups: ["earth"] } }, "bad-label", "selects.groups[0]"],
    ["unknown panel", { selects: { panel: "nope" } }, "bad-label", "selects.panel"],
    ["centre not in the scene", { anchor: { ...point, center: "mars" } }, "bad-label", "anchor.center"],
    ["id of a panel", { id: "story-one" }, "duplicate-id", "story-one"],
    ["id of a group", { id: "belt-a" }, "duplicate-id", "belt-a"],
  ];
  it.each(atBuild)("refuses when the scene is built: %s", (_name, extra, code, field) => {
    const scene = base();
    const added = failure(() => scene.addLabels([label(extra)]));
    const result = added.code === "no error" ? failure(() => definitionOf(scene)) : added;
    expect(result.code).toBe(code);
    expect(result.message).toContain(field);
  });

  it("refuses a repeated id in the call or the scene with duplicate-id, adding none", () => {
    const scene = base();
    expect(failure(() => scene.addLabels([label(), label()])).code).toBe("duplicate-id");
    expect(failure(() => scene.addLabels([label({ id: "earth" })])).code).toBe("duplicate-id");
    expect(failure(() => scene.addLabels([label({ id: "ok" }), label({ id: "x", color: "bad" })])).code).toBe(
      "bad-label",
    );
    scene.addLabels([label()]);
    expect(failure(() => scene.addLabels([label()])).code).toBe("duplicate-id");
    expect(failure(() => scene.addGroup(group("mark"))).code).toBe("duplicate-id");
    expect(definitionOf(scene).labels?.map(({ id }) => id)).toEqual(["mark"]);
  });
});

describe("addLabels good forms", () => {
  const goods: readonly (readonly [
    string,
    LabelInput,
    (label: NonNullable<ReturnType<typeof definitionOf>["labels"]>[number]) => void,
  ])[] = [
    [
      "a fixed point, centre defaulted",
      label(),
      (l) => expect(l.anchor).toMatchObject({ center: "earth", plane: "EQJ" }),
    ],
    [
      "a fixed point about a body",
      label({ anchor: { ...point, center: "moon" } }),
      (l) => expect(l.anchor).toMatchObject({ center: "moon" }),
    ],
    [
      "one group",
      label({ anchor: { groups: ["belt-a"] }, selects: { groups: ["belt-a"] }, color: "#9de3a8", labelPriority: 90 }),
      (l) => expect(l).toMatchObject({ labelPriority: 90, color: "#9de3a8", selects: { groups: ["belt-a"] } }),
    ],
    [
      "several groups with a card",
      label({
        anchor: { groups: ["belt-a", "belt-b"] },
        selects: { groups: ["belt-a", "belt-b"] },
        description: "Two made-up rings.",
        provenance: made,
        knownLimitations: ["Invented."],
      }),
      (l) => expect(l).toMatchObject({ description: "Two made-up rings.", knownLimitations: ["Invented."] }),
    ],
    [
      "a story panel",
      label({ selects: { panel: "story-one" } }),
      (l) => expect(l.selects).toEqual({ panel: "story-one" }),
    ],
    [
      "a shelf panel",
      label({ selects: { panel: "shelf-one" } }),
      (l) => expect(l.selects).toEqual({ panel: "shelf-one" }),
    ],
    ["text only", label(), (l) => expect(l).toMatchObject({ labelPriority: 80 })],
  ];
  it.each(goods)("builds and lands in the definition: %s", (_name, input, expectLabel) => {
    const found = definitionOf(base().addLabels([input])).labels;
    expect(found).toHaveLength(1);
    expectLabel(found![0]!);
  });

  it("leaves the field absent when the scene has no labels", () => {
    expect(definitionOf(base()).labels).toBeUndefined();
  });
});
