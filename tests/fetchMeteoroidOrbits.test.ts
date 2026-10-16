import { describe, expect, it } from "vitest";
import { checkLayout, extractGmn, gmnEpochMs, gmnLayout, gmnShowerFile, shippedCopy, SHIPPED_COLUMNS, ROW_COLUMNS } from "../tools/data/fetch-meteoroid-orbits.mjs";
import { parseMeasuredOrbits, SHIPPED_ROW_COLUMNS } from "../src/experiences/showers/measuredOrbits";

// The Global Meteor Network's monthly summaries (made-up rows in the real file's shape).
const GMN_NAMES = "#  Unique trajectory;      Beginning      ;        Beginning          ;   IAU;   IAU;   Sol lon ;   Vgeo  ;   +/-  ;       a    ;   +/-  ;      e    ;   +/-  ;      i    ;   +/-  ;    peri   ;    +/-  ;    node   ;    +/-  ;      Qc ;  Num";
const GMN_UNITS = "#      identifier   ;     Julian date     ;         UTC Time          ;    No;  code;     deg   ;    km/s  ;   sigma;      AU    ;  sigma ;           ;  sigma ;    deg    ;  sigma ;     deg   ;   sigma ;     deg   ;   sigma ;     deg ;  stat";
const gmnRow = (k: number, over: Partial<Record<string, string | number>> = {}): string => {
  const v = { id: `2025080100${String(k).padStart(4, "0")}_abc`, jd: "2460888.5", utc: "2025-08-01 00:00:08.500000", no: 7, code: "PER", sol: 140.2 + (k % 3) * 0.1, vg: 59.1, vgs: 0.4, a: 5 + k, as: 1, e: 0.9, es: 0.01, i: 113, is: 0.4, w: 150, ws: 0.4, node: 140.2 + (k % 3) * 0.1, ns: 0.1, qc: 30, num: 2, ...over };
  return [v.id, v.jd, v.utc, v.no, v.code, v.sol, v.vg, v.vgs, v.a, v.as, v.e, v.es, v.i, v.is, v.w, v.ws, v.node, v.ns, v.qc, v.num].map((c) => ` ${c}`).join(";");
};
const gmnLines = (rows: string[], head: string[] = ["# Summary generated on 2025-10-25", GMN_NAMES, GMN_UNITS, "# ------------------; --------------------"]) => [...head, ...rows];

describe("the fetch tool's GMN reader", () => {
  it("finds every column from the header rows, by name over unit, and the uncertainty beside Vgeo", () => {
    const layout = gmnLayout(GMN_NAMES, GMN_UNITS);
    expect(layout.at).toMatchObject({ iauNumber: 3, iauCode: 4, utc: 2, solarLongitude: 5, vg: 6, a: 8, e: 10, i: 12, w: 14, node: 16, q: 18 });
    expect(layout.vgSigmaAt).toBe(7);
    expect(() => gmnLayout(GMN_NAMES.replace("Qc", "Qx"), GMN_UNITS)).toThrow(/no column "Qc\|deg".*layout changed/);
    expect(() => gmnLayout(GMN_NAMES.replace("   +/-  ;       a", "   Vx   ;       a").replace(";   +/-  ;       a", ";   Vx   ;       a"), GMN_UNITS)).toThrow(/uncertainty|layout changed/);
  });

  it("reads one shower from two monthly files, dropping unbound and incomplete rows and keeping the counts", async () => {
    const jul = gmnLines([gmnRow(1), gmnRow(2, { code: "GEM", no: 4 }), gmnRow(3, { e: 1.3, a: -9 })]);
    const aug = gmnLines([...Array.from({ length: 30 }, (_, k) => gmnRow(10 + k)), gmnRow(50, { e: 1 }), gmnRow(51, { a: "nan" }), gmnRow(52, { no: -1, code: "..." })]);
    const result = await extractGmn([{ month: "202507", lines: jul }, { month: "202508", lines: aug }], 7);
    expect(result.counts).toMatchObject({ members: 34, unbound: 2, incomplete: 1, badSemiMajorAxis: 0, dropped: 3 });
    expect(result.rows).toHaveLength(31);
    expect(result.perFile.map((f) => f.members)).toEqual([2, 32]);
    expect(result.iauLetters).toBe("PER");
    // 31 kept: the Jul file contributes its one bound Perseid, Aug 30.
    expect(result.rows[0].slice(0, 2)).toEqual(["20250801000001_abc", 5]);
    expect(new Date(result.rows[0][2] as number).toISOString()).toBe("2025-08-01T00:00:08.500Z");
    expect(result.rows[0].slice(9)).toEqual([30, 59.1, 0.4, 0]);
  });

  it("refuses a file whose columns are shifted or whose rows are the wrong width", async () => {
    const rows = Array.from({ length: 30 }, (_, k) => gmnRow(k, { node: 10 + 7 * k }));
    await expect(extractGmn([{ month: "202508", lines: gmnLines(rows) }], 7)).rejects.toThrow(/node \(BS\) is within 1 degree/);
    await expect(extractGmn([{ month: "202508", lines: gmnLines([gmnRow(1) + "; extra"]) }], 7)).rejects.toThrow(/columns, the header has/);
    await expect(extractGmn([{ month: "202508", lines: gmnLines([gmnRow(1)], ["# only a comment"]) }], 7)).rejects.toThrow(/before its two column-header rows/);
  });

  it("converts the UTC time text to milliseconds", () => {
    expect(gmnEpochMs("1970-01-01 00:00:01.250000")).toBe(1250);
    expect(gmnEpochMs("2025-08-13 10:00:00")).toBe(Date.UTC(2025, 7, 13, 10));
    expect(Number.isNaN(gmnEpochMs("13/08/2025"))).toBe(true);
  });

  it("writes a file the app accepts, with licence, citations, files and the full column layout", async () => {
    const result = await extractGmn([{ month: "202508", lines: gmnLines(Array.from({ length: 12 }, (_, k) => gmnRow(k))) }], 7);
    const downloads = [{ month: "202508", url: "https://example.invalid/m.txt", bytes: 10, sha256: "ab", lastModified: null }];
    const file = gmnShowerFile({ iauCode: 7, extraction: result, downloads, fetchedAt: "2026-10-16T00:00:00.000Z" });
    expect(file.provenance.columns).toEqual([...ROW_COLUMNS]);
    expect(file.provenance.licence).toBe("CC BY 4.0");
    expect(file.provenance.citations).toHaveLength(2);
    expect(file.provenance.counts.kept).toBe(12);
    expect(file.provenance.files).toEqual(downloads);
    const orbits = parseMeasuredOrbits(file, 7);
    expect(orbits.members).toHaveLength(12);
    expect(orbits.provenance.licence).toBe("CC BY 4.0");
  });
});

describe("the layout check", () => {
  it("verifies the layout from the values", () => {
    const row = { a: 3, e: 0.5, i: 100, w: 150, node: 140, solarLongitude: 320, date: 1, dateRepeat: 1, time: 0.5, timeRepeat: 0.5 };
    expect(checkLayout([row])).toEqual([]);
    expect(checkLayout([{ ...row, e: 1.5 }]).join(" ")).toMatch(/out of range/);
    expect(checkLayout([{ ...row, dateRepeat: 2 }]).join(" ")).toMatch(/repeated date\/time/);
  });
});

describe("shipping a measured-orbit file", () => {
  it("makes a compact copy that keeps the licence header and is read like the full file", async () => {
    const result = await extractGmn([{ month: "202508", lines: gmnLines(Array.from({ length: 12 }, (_, k) => gmnRow(k))) }], 7);
    const full = gmnShowerFile({ iauCode: 7, extraction: result, downloads: [{ month: "202508", url: "https://example.invalid/m.txt", bytes: 10, sha256: "ab", lastModified: null }], fetchedAt: "2026-10-16T00:00:00.000Z" });
    const shipped = shippedCopy(full);
    expect(shipped.provenance.columns).toEqual([...SHIPPED_COLUMNS]);
    expect([...SHIPPED_COLUMNS]).toEqual([...SHIPPED_ROW_COLUMNS]);
    expect(shipped.provenance.licence).toBe("CC BY 4.0");
    expect(shipped.provenance.citations).toHaveLength(2);
    expect(shipped.provenance.files[0].sha256).toBe("ab");
    expect(shipped.provenance.counts.kept).toBe(12);
    expect(shipped.rows[0]).toHaveLength(SHIPPED_COLUMNS.length);
    const a = parseMeasuredOrbits(full, 7);
    const b = parseMeasuredOrbits(shipped, 7);
    expect(b.members).toEqual(a.members);
    expect(b.quality.map((q) => [q.convergenceAngleDeg, q.velocityKmS, q.velocityErrorKmS])).toEqual(a.quality.map((q) => [q.convergenceAngleDeg, q.velocityKmS, q.velocityErrorKmS]));
  });

  it("refuses to ship a file with no licence, and a licence that does not allow it", async () => {
    const result = await extractGmn([{ month: "202508", lines: gmnLines(Array.from({ length: 12 }, (_, k) => gmnRow(k))) }], 7);
    const full = gmnShowerFile({ iauCode: 7, extraction: result, downloads: [{ month: "202508", url: "https://example.invalid/m.txt", bytes: 10, sha256: "ab", lastModified: null }], fetchedAt: "2026-10-16T00:00:00.000Z" });
    const { licence: _licence, ...unlicensed } = full.provenance;
    expect(() => shippedCopy({ provenance: unlicensed, rows: full.rows })).toThrow(/refusing to ship.*not declared/);
    expect(() => shippedCopy({ provenance: { ...full.provenance, licence: "CC BY-NC 4.0" }, rows: full.rows })).toThrow(/refusing to ship.*CC BY-NC 4\.0/);
  });
});
