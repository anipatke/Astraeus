import { readFileSync } from "node:fs";
import { makeState, transform } from "@lizard-isana/orb/frames";
import { AstroInstant } from "@lizard-isana/orb/time";
import { describe, expect, it } from "vitest";
import { chunkCovers, chunkPositionInto, decodeChunk } from "../src/core/chebyshevSeries";
import { utcMsToTtSeconds, type TimeScaleTable, type TtSeconds } from "../src/core/timeScale";

// Ceres's position fit (O-102 T-464): a Sun-centred Chebyshev series from JPL Horizons small-body 1 Ceres (A801 AA), written by
// tools/import/planet-fits.mjs --small ceres into the astraeus-data package, in the planet-fits format (one `planets.ceres` entry).
const file = JSON.parse(
  readFileSync(new URL("../../astraeus-data/data/positions/ceres.json", import.meta.url), "utf8"),
) as {
  format: string;
  frame: string;
  unit: string;
  argument: string;
  timeScale: TimeScaleTable;
  provenance: { command: string; target: string; solution: string };
  planets: Record<
    string,
    {
      startS: number;
      segmentSeconds: number;
      segmentCount: number;
      coefficientCount: number;
      quantumKm: number;
      worstErrorKm: number;
      data: string;
    }
  >;
};
const entry = file.planets.ceres;
const chunk = decodeChunk<"tt">(Uint8Array.from(Buffer.from(entry.data, "base64")), {
  startTdbS: entry.startS,
  segmentSeconds: entry.segmentSeconds,
  segmentCount: entry.segmentCount,
  coefficientCount: entry.coefficientCount,
  quantumKm: entry.quantumKm,
});
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const J2000 = AstroInstant.fromUnixMs(J2000_MS);

/** Three archived Horizons states (geometric ICRF km about the Sun, TDB read as TT: under 2 ms, about 0.04 km at Ceres's speed), fetched 2026-11-27 with COMMAND '1;', JPL#48. */
const ARCHIVED = [
  { tdb: "1955-07-04T03:21:09Z", icrfKm: [130206498.5557624, -365185729.4475343, -197510891.5605752] },
  { tdb: "1987-03-17T12:34:56Z", icrfKm: [-145366801.221116, -362198736.3749492, -140554000.4084986] },
  { tdb: "2038-11-02T20:00:13Z", icrfKm: [333597927.9624379, -233077552.9986892, -178148334.5918728] },
];

describe("Ceres position fit", () => {
  it("is in the planet-fits format with its provenance and a checked worst error within 1 km", () => {
    expect(file.format).toBe("astraeus.planet-fits/1");
    expect(file.frame).toBe("ecliptic J2000, heliocentric");
    expect(file.unit).toBe("km");
    expect(Object.keys(file.planets)).toEqual(["ceres"]);
    expect(file.provenance.target).toBe("1 Ceres (A801 AA)");
    expect(file.provenance.command).toBe("1;");
    expect(entry.worstErrorKm).toBeLessThan(1);
  });

  it("covers 1950-01-01 to 2045-01-01", () => {
    const tt = (utc: number) => utcMsToTtSeconds(file.timeScale, utc);
    expect(chunkCovers(chunk, tt(Date.UTC(1950, 0, 1)))).toBe(true);
    expect(chunkCovers(chunk, tt(Date.UTC(2045, 0, 1) - 1))).toBe(true);
  });

  it("matches three archived Horizons positions within 1 km", () => {
    const km = new Float64Array(3);
    for (const { tdb, icrfKm } of ARCHIVED) {
      chunkPositionInto(chunk, ((Date.parse(tdb) - J2000_MS) / 1000) as TtSeconds, km, 0);
      // The same Orb frame turn the importer applies to the Horizons rows (ICRF to ecliptic J2000, including Orb's frame bias).
      const ecliptic = transform(makeState({ t: J2000, frame: "equatorial-j2000", center: "sun", r: icrfKm }), {
        frame: "ecliptic-j2000",
      }).r;
      expect(Math.hypot(km[0] - ecliptic[0], km[1] - ecliptic[1], km[2] - ecliptic[2]), tdb).toBeLessThan(1);
    }
  });
});
