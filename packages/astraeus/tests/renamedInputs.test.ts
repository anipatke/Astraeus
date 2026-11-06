// O-057 T-276: an input field renamed in 0.8.0 fails with `renamed`, naming its replacement, when a plain JavaScript caller still passes the old name (API-04). One table drives the receiving calls;
// every row is proved here on made-up scenes (ARCH-03), the old name alone, and a row nobody reads fails.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, jupiter, moon } from "astraeus";
import { RENAMED_INPUTS, rejectRenamed } from "../src/api/renamedInputs";

const DAY = 86_400_000;
const T0 = Date.UTC(2030, 0, 1);
const at = (days: number) => new Date(T0 + days * DAY).toISOString();
const samples = [0, 1, 2].map((i) => ({ time: T0 + i * DAY, positionKm: [1e5 + i * 1e3, 0, 0] }));
const base = () => new Scene().addBody(earth).addBody(moon);
const settle = async (run: () => unknown): Promise<SceneError | undefined> => { try { await run(); } catch (error) { if (error instanceof SceneError) return error; throw error; } return undefined; };
const timeline = (pacing: unknown[]) => () => base().addEvents([{ id: "e", label: "E", time: at(5), type: "flyby" }]).setTimeline({ start: at(0), end: at(10), pacing: pacing as never });
const moonData = (extra: object) => ({ name: "astraeus-data-made-up", provides: [], moonPositions: { center: "jupiter", loadIndex: async () => ({}), chunkUrls: {}, ...extra } });

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
  "TrajectoryInput.labelReach": (old) => () => base().addTrajectory({ id: "p", samples, [old]: 100 } as never),
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

  it("accepts the new names: pacing, a view's objects, a body's reach and moon positions' center", async () => {
    expect(await settle(timeline([{ start: at(1), end: at(2), rate: 5, rampSeconds: 60 }, { near: { type: "flyby", withinSeconds: 60 }, rate: 5, rampSeconds: 30 }]))).toBeUndefined();
    expect(await settle(() => base().addTrajectory({ id: "p", samples, labelReachEarthRadii: 100 }).addBody(jupiter, { labelReachEarthRadii: 9 }).setViews([{ id: "a", label: "A", objects: ["p", "moon"] }], { place: "panel" }).check())).toBeUndefined();
    expect(await settle(() => new Scene().addBody(jupiter).load({ data: [moonData({}) as never] }))).toBeUndefined();
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

  it("has one row per old name and scope, each naming a different replacement, and no row renames to itself", () => {
    const keys = RENAMED_INPUTS.map((row) => `${row.scope}.${row.old}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const row of RENAMED_INPUTS) expect(row.old).not.toBe(row.use);
  });
});
