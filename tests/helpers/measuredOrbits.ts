import { parseMeasuredOrbits, MEASURED_ROW_COLUMNS, type MeasuredOrbits } from "../../src/experiences/showers/measuredOrbits";

// The git-ignored files tools/data/fetch-meteoroid-orbits.mjs writes; none on a machine that has not run it.
const FETCHED = import.meta.glob("../../data/local/cams-iau-*.json", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const pathOf = (iauCode: number): string => `../../data/local/cams-iau-${iauCode}.json`;

export const hasLocalOrbits = (iauCode: number): boolean => pathOf(iauCode) in FETCHED;

export const skipReasonFor = (iauCode: number): string =>
  `skipped: data/local/cams-iau-${iauCode}.json is not fetched on this machine (run node tools/data/fetch-meteoroid-orbits.mjs ${iauCode})`;

/** The raw file as the tool wrote it. */
export const readLocalFile = (iauCode: number): { provenance: Record<string, any>; rows: any[][] } => JSON.parse(FETCHED[pathOf(iauCode)]);

export const readLocalOrbits = (iauCode: number): MeasuredOrbits => parseMeasuredOrbits(readLocalFile(iauCode), iauCode);

/**
 * Made-up measured orbits for a made-up shower: invented rows in the real file's shape, never data of any real shower. A small seeded
 * generator spreads them over a range of sizes, shapes and tilts.
 */
export function madeUpOrbits(iauCode: number, count: number): MeasuredOrbits {
  let state = 12345;
  const random = (): number => { state = (state * 1664525 + 1013904223) % 4294967296; return state / 4294967296; };
  const rows = Array.from({ length: count }, (_, k) => {
    const a = 2 + 20 * random();
    const e = Math.min(0.97, Math.max(1 - 1.1 / a, 0.5) + 0.02 * random());
    return [`made-up-${k}`, k + 6, Date.UTC(2020, 7, 1) + k * 3_600_000, a, e, 5 + 100 * random(), 360 * random(), 360 * random(), 140, k % 4 === 0 ? 8 : 40, 59, k % 5 === 0 ? 9 : 0.5, k % 10 === 0 ? 1 : 0];
  });
  return parseMeasuredOrbits({
    provenance: {
      database: "Made-up orbit list for the builder test",
      citation: "Made up",
      source: "https://example.invalid/made-up",
      fetchedAt: "2030-01-01T00:00:00.000Z",
      iauCode,
      columns: [...MEASURED_ROW_COLUMNS],
      counts: { members: count + 7, unbound: 7, kept: count },
      release: { bytes: 0, sha256: "0" },
    },
    rows,
  }, iauCode);
}
