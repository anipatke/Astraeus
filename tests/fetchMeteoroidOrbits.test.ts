import { describe, expect, it } from "vitest";
import { checkLayout, epochMs, extractShower, showerFile, ROW_COLUMNS } from "../tools/data/fetch-meteoroid-orbits.mjs";
import { parseMeasuredOrbits } from "../src/experiences/showers/measuredOrbits";
import { writeMiniWorkbook, type MiniMember } from "./helpers/miniWorkbook.mjs";

// Made-up members in the real workbook's shape; a few are hyperbolic and one is another shower's.
const member = (k: number, over: Partial<MiniMember> = {}): MiniMember => ({
  iau: 7, catalog: 1000 + k, date1904Serial: 39_000 + k, dayFraction: 0.25, a: 5 + k, e: 0.9, i: 110, w: 150, node: 140 + (k % 3), solarLongitude: 140.2 + (k % 3), ...over,
});

describe("the fetch tool's workbook reader", () => {
  it("reads one shower from a workbook with the real file's quirks, dropping unbound orbits and keeping the 1904 dates", async () => {
    const members = [
      ...Array.from({ length: 40 }, (_, k) => member(k, k === 3 ? { pairs: 1, q: 12.5, vg: 58.9, vgSigma: 0.7 } : {})),
      member(40, { e: 1.2, a: 999 }),
      member(41, { e: 1, a: 999 }),
      member(42, { iau: 4 }),
    ];
    const result = await extractShower(writeMiniWorkbook(members), 7);
    expect(result.date1904).toBe(true);
    expect(result.counts).toMatchObject({ members: 42, unbound: 2, badSemiMajorAxis: 0, incomplete: 0, pairsFlagged: 1 });
    expect(result.rows[3].slice(9)).toEqual([12.5, 58.9, 0.7, 1]); // Q, Vg, sigma Vg, pairs flag
    expect(result.rows[0].slice(9)).toEqual([40, 59, 0.4, 0]);
    expect(result.rows).toHaveLength(40);
    expect(result.rows[0][0]).toBe("1000");
    // 39,000 days in the 1904 system is 40,462 in the 1900 system: 2010-10-11 plus a quarter day.
    expect(new Date(result.rows[0][2]).toISOString()).toBe("2010-10-11T06:00:00.000Z");
    expect(result.rows[0][1]).toBe(6);
    expect(result.rows[39][1]).toBe(46); // the sheet's row numbers have a gap
  });

  it("finds every row however the inflated text is cut into chunks", async () => {
    const members = Array.from({ length: 3_000 }, (_, k) => member(k, { iau: k % 2 === 0 ? 7 : 4 }));
    const result = await extractShower(writeMiniWorkbook(members), 7);
    expect(result.rows).toHaveLength(1_500);
    expect(new Set(result.rows.map((row) => row[0])).size).toBe(1_500);
  });

  it("refuses a workbook whose header texts have changed", async () => {
    const path = writeMiniWorkbook([member(0)], { header: ["Catalog #", "Shower ID", "Solar Longitude", "Node", "Pairs Flag"] });
    await expect(extractShower(path, 7)).rejects.toThrow(/Shower I\.D\.".*layout changed/);
  });

  it("refuses a workbook whose columns are shifted", async () => {
    const shifted = Array.from({ length: 30 }, (_, k) => member(k, { node: 10 + 7 * k }));
    await expect(extractShower(writeMiniWorkbook(shifted), 7)).rejects.toThrow(/node \(BS\) is within 1 degree/);
  });

  it("refuses a workbook whose quality columns are shifted", async () => {
    const shifted = Array.from({ length: 30 }, (_, k) => member(k, { q: 120 + k }));
    await expect(extractShower(writeMiniWorkbook(shifted), 7)).rejects.toThrow(/convergence angle \(AC\)/);
    const wrongVelocity = Array.from({ length: 30 }, (_, k) => member(k, { vg: 3 }));
    await expect(extractShower(writeMiniWorkbook(wrongVelocity), 7)).rejects.toThrow(/geocentric velocity \(AT\)/);
  });

  it("verifies the layout from the values", () => {
    const row = { a: 3, e: 0.5, i: 100, w: 150, node: 140, solarLongitude: 320, date: 1, dateRepeat: 1, time: 0.5, timeRepeat: 0.5 };
    expect(checkLayout([row])).toEqual([]);
    expect(checkLayout([{ ...row, e: 1.5 }]).join(" ")).toMatch(/out of range/);
    expect(checkLayout([{ ...row, dateRepeat: 2 }]).join(" ")).toMatch(/repeated date\/time/);
  });

  it("writes a file the app accepts, with its provenance header", async () => {
    const result = await extractShower(writeMiniWorkbook(Array.from({ length: 10 }, (_, k) => member(k))), 7);
    const file = showerFile({ iauCode: 7, extraction: result, download: { bytes: 1, sha256: "x" }, fetchedAt: "2026-10-15T00:00:00.000Z" });
    expect(file.provenance.columns).toEqual([...ROW_COLUMNS]);
    expect(file.provenance.counts.kept).toBe(10);
    expect(file.provenance.citation).toMatch(/Jenniskens/);
    expect(parseMeasuredOrbits(file, 7).members).toHaveLength(10);
  });

  it("converts the 1904 serial and day fraction to UTC milliseconds", () => {
    expect(epochMs(0, 0, true)).toBe(Date.UTC(1904, 0, 1));
    expect(epochMs(25_569 - 1_462, 0.5, true)).toBe(Date.UTC(1970, 0, 1, 12));
    expect(epochMs(25_569, 0, false)).toBe(0);
  });
});
