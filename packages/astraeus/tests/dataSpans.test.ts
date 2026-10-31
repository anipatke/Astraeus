import { describe, expect, it } from "vitest";
import { Scene, SceneError, mercury } from "astraeus";
import { installData } from "../src/api/data";
import { JUPITER_MOON_SYSTEM } from "../src/core/bodies/jupiterMoons";
import { MoonOutOfSpanError } from "../src/core/bodies/moonSystem";
import { ChebyshevEphemeris, parseEphemerisIndex } from "../src/core/chebyshevEphemeris";
import { planetSeriesSpan } from "../src/core/planetSeries";
import jupiterIndex from "astraeus-data-jupiter/index.json";
import marsIndex from "astraeus-data-mars/index.json";
import neptuneIndex from "astraeus-data-neptune/index.json";
import plutoIndex from "astraeus-data-pluto/index.json";
import saturnIndex from "astraeus-data-saturn/index.json";
import uranusIndex from "astraeus-data-uranus/index.json";

// O-047 T-195: a window outside the years a loaded body's positions cover fails once, by name, at load. Made-up two-body index, different spans.
const TABLE = { pieces: [{ fromUtcMs: Date.UTC(1940, 0, 1), ttMinusUtcS: 64.184, driftSPerDay: 0 }], validToUtcMs: Date.UTC(2040, 0, 1) };
const chunk = (path: string, startUtc: string) => ({ path, startTdbS: (Date.parse(startUtc) - Date.UTC(2000, 0, 1, 12)) / 1000 + 64.184, segmentCount: 10, bytes: 1 });
const entry = (id: string, startUtc: string) => ({
  id, label: id, fit: { segmentSeconds: 86_400 * 365.25, degree: 3, quantumKm: 1 }, chunks: [chunk(`${id}/a.bin`, startUtc)],
  provenance: { sourceType: "ephemeris", sources: ["made up"], accuracy: "made up", notes: "" },
});
// jupiter (the centre) spans 1950 to 1960; io only 1952 to 1958 by its own span.
const index = ({
  format: "astraeus.chebyshev-ephemeris/1", id: "made-up", frame: "EQJ", centre: "jupiter", timeScale: TABLE,
  bodies: [entry("jupiter", "1950-01-01"), { ...entry("io", "1950-01-01"), span: { fromUtc: "1952-01-01", toUtc: "1958-01-01" } }],
});

describe("a window outside a body's span", () => {
  it("refuses once with the body and its span, as the engine's error", async () => {
    const system = JUPITER_MOON_SYSTEM;
    system.install(null);
    system.provideIndex(async () => index);
    const window = { startUtcMs: Date.UTC(1951, 0, 1), endUtcMs: Date.UTC(1955, 0, 1) };
    const request = { window, bodies: ["io"], chunkUrls: {} };
    const first = system.load(request);
    await expect(first).rejects.toBeInstanceOf(MoonOutOfSpanError);
    expect(system.load(request)).toBe(first);
    await expect(first).rejects.toThrow(/io's positions cover 1952-01-01 to 1958-01-01/);
  });

  it("reaches the public API as SceneError out-of-span naming the package", async () => {
    JUPITER_MOON_SYSTEM.install(null);
    const source = { name: "astraeus-data-made-up", provides: ["io"], moonPositions: { centre: "jupiter", loadIndex: async () => index, chunkUrls: {} } };
    const window = { startUtcMs: Date.UTC(1951, 0, 1), endUtcMs: Date.UTC(1955, 0, 1) };
    const error = await installData([source], ["jupiter", "io"], window).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(SceneError);
    expect((error as SceneError).code).toBe("out-of-span");
    expect((error as SceneError).message).toMatch(/io .*astraeus-data-made-up.*1952-01-01 to 1958-01-01/);
    JUPITER_MOON_SYSTEM.install(null);
  });

  it("holds every shipped index to the years its bodies' own spans name (the rest 2010 to 2030; T-200 moved the main moons to 1950)", () => {
    const HISTORICAL = new Set(["io", "europa", "ganymede", "callisto", "jupiter", "mimas", "enceladus", "tethys", "dione", "rhea", "titan", "hyperion", "iapetus", "phoebe", "saturn",
      "miranda", "ariel", "umbriel", "titania", "oberon", "uranus", "triton", "nereid", "neptune"]);
    for (const raw of [jupiterIndex, marsIndex, saturnIndex, uranusIndex, neptuneIndex, plutoIndex]) {
      const parsed = parseEphemerisIndex(raw);
      const set = new ChebyshevEphemeris(parsed);
      for (const body of parsed.bodies) {
        const bounds = set.boundsOf(body.id);
        expect(bounds.startUtcMs, body.id).toBeGreaterThanOrEqual(Date.UTC(HISTORICAL.has(body.id) ? 1949 : 2009, 11, 1));
        if (!HISTORICAL.has(body.id)) expect(bounds.startUtcMs, body.id).toBeGreaterThanOrEqual(Date.UTC(2009, 11, 1));
        expect(bounds.endUtcMs, body.id).toBeLessThanOrEqual(Date.UTC(2030, 0, 3));
        if (body.span !== undefined) {
          expect(bounds.startUtcMs, body.id).toBeGreaterThanOrEqual(body.span.startUtcMs);
          expect(bounds.endUtcMs, body.id).toBeLessThanOrEqual(body.span.endUtcMs);
        }
      }
    }
  });
});

describe("a window before the planet series", () => {
  it("fails with out-of-span naming the planet and the series' years", async () => {
    const span = planetSeriesSpan();
    const scene = new Scene().addBody(mercury).setTimeline({ start: "1950-01-01T00:00:00Z", end: "1960-01-01T00:00:00Z" });
    const prepared = scene.toDefinition().prepare!();
    if (span.startUtcMs > Date.UTC(1950, 0, 1)) {
      await expect(prepared).rejects.toMatchObject({ code: "out-of-span", message: expect.stringMatching(/mercury.*1969-01-01/) });
    } else await expect(prepared).resolves.toBeUndefined();
  });
});
