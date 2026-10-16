import { parseMeasuredOrbits, MEASURED_ROW_COLUMNS, type MeasuredOrbits } from "../../src/experiences/showers/measuredOrbits";

// The committed copies a public build ships: data/stories/<story>/gmn-iau-<code>.json, in the compact column layout (SHIPPED_ROW_COLUMNS). Present on every machine.
const SHIPPED = import.meta.glob("../../data/stories/*/gmn-iau-*.json", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const shippedPath = (story: string, iauCode: number): string => `../../data/stories/${story}/gmn-iau-${iauCode}.json`;

/** Positions of the columns in a shipped row. */
export const SHIPPED_COL = { id: 0, epochUtcMs: 1, a: 2, e: 3, i: 4, w: 5, node: 6, q: 7, vg: 8, vgSigma: 9 } as const;

/** The raw shipped file. */
export const readShippedFile = (story: string, iauCode: number): { provenance: Record<string, any>; rows: any[][] } => JSON.parse(SHIPPED[shippedPath(story, iauCode)]);

export const readShippedOrbits = (story: string, iauCode: number): MeasuredOrbits => parseMeasuredOrbits(readShippedFile(story, iauCode), iauCode);

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
    return [`made-up-${k}`, k + 6, Date.UTC(2020, 7, 1) + k * 3_600_000, a, e, 5 + 100 * random(), 360 * random(), 360 * random(), 140, k % 4 === 0 ? 8 : 40, 59, k % 5 === 0 ? 9 : 0.5, 0];
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
