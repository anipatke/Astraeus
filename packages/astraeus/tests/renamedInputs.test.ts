// O-057 T-276: an input field renamed in 0.8.0 fails with `renamed`, naming its replacement, when a plain JavaScript caller still passes the old name (API-04). One table drives the receiving calls;
// every row is proved here on made-up scenes (ARCH-03), the old name alone, and a row nobody reads fails.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, jupiter, moon, sun } from "astraeus";
import { RENAMED_INPUTS, rejectRenamed } from "../src/api/renamedInputs";

const DAY = 86_400_000;
const T0 = Date.UTC(2030, 0, 1);
const at = (days: number) => new Date(T0 + days * DAY).toISOString();
const samples = [0, 1, 2].map((i) => ({ time: T0 + i * DAY, positionKm: [1e5 + i * 1e3, 0, 0] }));
const base = () => new Scene().addBody(earth).addBody(moon);
const settle = async (run: () => unknown): Promise<SceneError | undefined> => { try { await run(); } catch (error) { if (error instanceof SceneError) return error; throw error; } return undefined; };
const timeline = (pacing: unknown[]) => () => base().addEvents([{ id: "e", label: "E", time: at(5), type: "flyby" }]).setTimeline({ start: at(0), end: at(10), pacing: pacing as never });
// A made-up elements record, valid under its new names (ARCH-03); a driver below swaps one new name for the old one.
const record = (change: (copy: Record<string, any>) => void = () => {}) => {
  const copy: Record<string, any> = {
    id: "rock", label: "Rock",
    elements: { semiMajorAxisAu: 2.5, eccentricity: 0.3, inclinationDeg: 10, ascendingNodeDeg: 40, argumentOfPerihelionDeg: 70, meanAnomalyDeg: 20 },
    epoch: { jd: 2461000.5, timeScale: "TDB", ttMinusUtcSeconds: 69.184 },
    plane: "ecliptic-j2000",
    source: { name: "Made up", url: "https://example.org/rock", solution: "S1", accessed: "2026-10-28" },
    accuracy: { classification: "indicative", statement: "Made up.", valid: { start: "2020-01-01T00:00:00Z", end: "2030-01-01T00:00:00Z" }, limitations: [] },
  };
  change(copy);
  return copy as never;
};
const moonData = (extra: object) => ({ name: "astraeus-data-made-up", provides: [], moonPositions: { center: "jupiter", loadIndex: async () => ({}), chunkUrls: {}, ...extra } });

const storyPanel = (extra: object = {}) => ({ id: "p", at: { time: at(1) }, title: "P", body: ["A made-up line."], provenance: { sourceType: "illustrative", sources: ["Made up"], accuracy: "None claimed.", notes: "Made up." }, ...extra }) as never;

// For each row, a call that gives the old name alone: every other field is valid under its new name.
const DRIVERS: Record<string, (old: string) => () => unknown> = {
  "MoonPositions.centre": (old) => () => new Scene().addBody(jupiter).load({ data: [{ ...moonData({}), moonPositions: { [old]: "jupiter", loadIndex: async () => ({}), chunkUrls: {} } } as never] }),
  "PacingSpan.from": (old) => timeline([{ [old]: at(1), end: at(2), rate: 5 }]),
  "PacingSpan.to": (old) => timeline([{ start: at(1), [old]: at(2), rate: 5 }]),
  "PacingSpan.ramp": (old) => timeline([{ start: at(1), end: at(2), rate: 5, [old]: 60 }]),
  "PacingRule.ramp": (old) => timeline([{ near: { type: "flyby", withinSeconds: 60 }, rate: 5, [old]: 60 }]),
  "PacingNear.within": (old) => timeline([{ near: { type: "flyby", [old]: 60 }, rate: 5 }]),
  "ViewInput.paths": (old) => () => base().addTrajectory({ id: "p", samples }).setViews([{ id: "a", label: "A", [old]: ["p"] } as never], { place: "panel" }),
  "ViewInput.bodies": (old) => () => base().setViews([{ id: "a", label: "A", [old]: ["moon"] } as never], { place: "panel" }),
  "AddBodyOptions.labelReach": (old) => () => new Scene().addBody(earth, { [old]: 100 } as never),
  "ElementsBodyRecord.frame": (old) => () => new Scene().addBody(sun).addBodyFromElements(record((c) => { c[old] = c.plane; delete c.plane; })),
  "ElementsAccuracy.validFromUtc": (old) => () => new Scene().addBody(sun).addBodyFromElements(record((c) => { c.accuracy[old] = c.accuracy.valid.start; delete c.accuracy.valid.start; })),
  "ElementsAccuracy.validToUtc": (old) => () => new Scene().addBody(sun).addBodyFromElements(record((c) => { c.accuracy[old] = c.accuracy.valid.end; delete c.accuracy.valid.end; })),
  "TrajectoryInput.labelReach": (old) => () => base().addTrajectory({ id: "p", samples, [old]: 100 } as never),
  "StoryPanelInput.badge": (old) => () => base().addStoryPanels([storyPanel({ [old]: "observed" })]),
  "StoryPanelInput.sources": (old) => () => base().addStoryPanels([storyPanel({ [old]: ["Made up"] })]),
  "StoryPanelAt.utc": (old) => () => base().addStoryPanels([storyPanel({ at: { [old]: at(1) } })]),
  "AddStoryPanelsCall.panels": (old) => () => base().addStoryPanels({ [old]: [storyPanel()] } as never),
  "AddStoryPanelsCall.pauseSeconds": (old) => () => base().addStoryPanels({ [old]: 3 } as never),
  "AddStoryPanelsCall.autoOpen": (old) => () => base().addStoryPanels({ [old]: false } as never),
};

describe("renamed inputs", () => {
  it("has a row for every driver and a driver for every row", () => {
    expect(Object.keys(DRIVERS).sort()).toEqual(RENAMED_INPUTS.map((row) => `${row.scope}.${row.old}`).sort());
  });

  it.each(RENAMED_INPUTS.map((row) => [`${row.scope}.${row.old}`, row] as const))("%s: the old name alone throws renamed and names its replacement", async (key, row) => {
    const error = await settle(DRIVERS[key]!(row.old));
    expect(error, key).toBeInstanceOf(SceneError);
    expect(error!.code).toBe("renamed");
    expect(error!.message).toContain(`\`${row.old}\``);
    expect(error!.message).toContain(`\`${row.use}\``);
  });

  it.each(RENAMED_INPUTS.map((row) => [`${row.scope}.${row.old}`, row] as const))("%s: the new name beside the old one is still refused (the old name never works)", async (key, row) => {
    const error = await settle(() => rejectRenamed(row.scope, { [row.old]: 1, [row.use]: 1 }, "test"));
    expect(error?.code, key).toBe("renamed");
  });

  it("the old addStoryPanels object form names the list form and setStoryPanelPlayback, whatever it carried", async () => {
    for (const old of [{ panels: [] }, { pauseSeconds: 3, panels: [] }, { autoOpen: false, panels: [] }]) {
      const error = await settle(() => base().addStoryPanels(old as never));
      expect(error?.code).toBe("renamed");
      expect(error!.message).toContain("addStoryPanels(list)");
      expect(error!.message).toContain("setStoryPanelPlayback");
    }
  });

  it("a panel carrying an old form beside its provenance is refused, so no path accepts both", async () => {
    for (const old of [{ badge: "observed" }, { sources: ["Made up"] }, { at: { time: at(1), utc: at(1) } }]) expect((await settle(() => base().addStoryPanels([storyPanel(old)])))?.code).toBe("renamed");
  });

  it("accepts the new names: pacing, a view's objects, a body's reach and moon positions' center", async () => {
    expect(await settle(timeline([{ start: at(1), end: at(2), rate: 5, rampSeconds: 60 }, { near: { type: "flyby", withinSeconds: 60 }, rate: 5, rampSeconds: 30 }]))).toBeUndefined();
    expect(await settle(() => base().addTrajectory({ id: "p", samples, labelReachEarthRadii: 100 }).addBody(jupiter, { labelReachEarthRadii: 9 }).setViews([{ id: "a", label: "A", objects: ["p", "moon"] }], { place: "panel" }).check())).toBeUndefined();
    expect(await settle(() => new Scene().addBody(jupiter).load({ data: [moonData({}) as never] }))).toBeUndefined();
  });

  it("accepts a record under its new names, with the span as ISO text, a Date or milliseconds", async () => {
    expect(await settle(() => new Scene().addBody(sun).addBodyFromElements(record()))).toBeUndefined();
    expect(await settle(() => new Scene().addBody(sun).addBodyFromElements(record((c) => { c.accuracy.valid = { start: new Date(Date.UTC(2020, 0, 1)), end: Date.UTC(2030, 0, 1) }; })))).toBeUndefined();
  });

  it("leaves a value that is not an object to the call's own check", () => {
    expect(() => rejectRenamed("ViewInput", "not an object", "test")).not.toThrow();
    expect(() => rejectRenamed("ViewInput", null, "test")).not.toThrow();
  });

  it("is read by a call for every scope in the table (a row nothing reads would be ignored silently)", () => {
    const api = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "api");
    const readers = readdirSync(api).filter((name) => name.endsWith(".ts") && name !== "renamedInputs.ts").flatMap((name) => readFileSync(join(api, name), "utf8").split("\n")).filter((line) => line.includes("rejectRenamed("));
    for (const scope of new Set(RENAMED_INPUTS.map((row) => row.scope))) expect(readers.some((line) => line.includes(`"${scope}"`)), scope).toBe(true);
  });

  it("has a row in the CHANGELOG migration table for every old name, naming its replacement", () => {
    const changelog = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "CHANGELOG.md"), "utf8");
    const table = changelog.slice(changelog.indexOf("### Migration from 0.7.0 to 0.8.0"), changelog.indexOf("#### Note for the Voyagers app"));
    const rows = table.split("\n").filter((line) => line.startsWith("| "));
    for (const { old, use } of RENAMED_INPUTS) {
      const last = use.split(/[ (]/)[0].split(".").at(-1)!;
      expect(rows.some((row) => new RegExp(`\\b${old}\\b`).test(row.split(" | ")[1] ?? "") && row.includes(last)), `${old} to ${use}`).toBe(true);
    }
  });
  it("has one row per old name and scope, each naming a different replacement, and no row renames to itself", () => {
    const keys = RENAMED_INPUTS.map((row) => `${row.scope}.${row.old}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const row of RENAMED_INPUTS) expect(row.old).not.toBe(row.use);
  });
});
