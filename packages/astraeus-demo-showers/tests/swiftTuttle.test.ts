import { describe, expect, it } from "vitest";
import fixture from "./fixtures/swift-tuttle-horizons.json";
import source from "./fixtures/swift-tuttle-horizons-source.txt?raw";
import { createOrbAstronomyAdapter } from "astraeus/core/astronomyAdapter";
import { BUILT_IN_BINDINGS, BUILT_IN_BODIES } from "astraeus/core/bodies/index";
import {
  createSwiftTuttleTrajectory,
  SWIFT_TUTTLE,
  SWIFT_TUTTLE_APPROXIMATE_LIMIT_FRACTION,
  SWIFT_TUTTLE_ELEMENTS,
  SWIFT_TUTTLE_EPOCH_UTC_MS,
  SWIFT_TUTTLE_MAX_ERROR_FRACTION,
  SWIFT_TUTTLE_MAX_ERROR_KM,
  SWIFT_TUTTLE_PERIOD_MS,
  SWIFT_TUTTLE_RADIUS_KM,
  SWIFT_TUTTLE_SAMPLING,
} from "astraeus/core/bodies/swiftTuttle";
import { createStateResolver } from "astraeus/core/stateResolver";
import { eccentricPathTimesUtcMs, pathTimesUtcMs } from "astraeus/core/sunCentredSources";
import { catalogue } from "astraeus/assets/catalogue";
import { SWIFT_TUTTLE_VISUAL } from "astraeus/assets/bodies/swiftTuttle";
import { buildShowerDefinition } from "../src/experiences/showers/showerDefinition";
import { madeUpOrbits } from "./helpers/measuredOrbits";
import { parseShowerSettings } from "../src/experiences/showers/showerSettings";
import perseids from "../data/showers/perseids.json";

const AU_KM = 149_597_870.7;
const DAY_MS = 86_400_000;
const adapter = createOrbAstronomyAdapter();
const resolver = createStateResolver(BUILT_IN_BODIES, BUILT_IN_BINDINGS, adapter);
const comet = createSwiftTuttleTrajectory();
const distance = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** The two archived raw responses, split at their query headers: [SBDB JSON, Horizons text]. */
const [, sbdbText, horizonsText] = source.split(/^==== QUERY .*====\n/m);
const sbdb = JSON.parse(sbdbText) as { object: { fullname: string }; orbit: { epoch: string; sb_used: string; elements: { name: string; value: string }[] }; phys_par: { name: string; value: string }[] };
const element = (name: string): number => Number(sbdb.orbit.elements.find((candidate) => candidate.name === name)!.value);

describe("109P/Swift-Tuttle elements are the archived Small-Body Database response", () => {
  it("archives the raw SBDB and Horizons responses beside the fixture", () => {
    expect(sbdb.object.fullname).toBe("109P/Swift-Tuttle");
    expect(sbdb.orbit.sb_used).toBe("SB405-CPV-2");
    expect(horizonsText).toContain("Target body name: 109P/Swift-Tuttle");
    expect(horizonsText).toContain("Center body name: Sun (10)");
    expect(fixture.rawFile).toBe("swift-tuttle-horizons-source.txt");
  });

  it("carries every element exactly as the archived response prints it", () => {
    expect(Number(sbdb.orbit.epoch)).toBe(SWIFT_TUTTLE_ELEMENTS.epochJdTdb);
    expect(element("a")).toBe(SWIFT_TUTTLE_ELEMENTS.semiMajorAxisAu);
    expect(element("e")).toBe(SWIFT_TUTTLE_ELEMENTS.eccentricity);
    expect(element("i")).toBe(SWIFT_TUTTLE_ELEMENTS.inclinationDeg);
    expect(element("om")).toBe(SWIFT_TUTTLE_ELEMENTS.ascendingNodeDeg);
    expect(element("w")).toBe(SWIFT_TUTTLE_ELEMENTS.argumentOfPerihelionDeg);
    expect(element("ma")).toBe(SWIFT_TUTTLE_ELEMENTS.meanAnomalyDeg);
    expect(element("tp")).toBeCloseTo(SWIFT_TUTTLE_ELEMENTS.perihelionJdTdb, 9);
    expect(element("per")).toBe(SWIFT_TUTTLE_ELEMENTS.periodDays);
    expect(element("ad")).toBe(SWIFT_TUTTLE_ELEMENTS.aphelionAu);
  });

  it("takes the nucleus radius from the cited diameter, which Horizons prints as RAD = 13 km", () => {
    const diameter = sbdb.phys_par.find((entry) => entry.name === "diameter")!;
    expect(Number(diameter.value) / 2).toBe(SWIFT_TUTTLE_RADIUS_KM);
    expect(horizonsText).toMatch(/RAD= 13\./);
    expect(SWIFT_TUTTLE.accuracy.dimensions.sources.join(" ")).toMatch(/Lamy et al\. 2004/);
  });

  it("puts the epoch at 1995-10-10 TDB, 61.184 s ahead of UTC, and keeps the model period within an hour of the catalogue's own", () => {
    expect(SWIFT_TUTTLE_EPOCH_UTC_MS).toBe(Date.UTC(1995, 9, 10) - 61_184);
    // JD 2450000.5 is 1995-10-10 00:00 exactly.
    expect((SWIFT_TUTTLE_ELEMENTS.epochJdTdb - 2440587.5) * DAY_MS).toBe(Date.UTC(1995, 9, 10));
    expect(Math.abs(SWIFT_TUTTLE_PERIOD_MS / DAY_MS - SWIFT_TUTTLE_ELEMENTS.periodDays)).toBeLessThan(0.01);
  });
});

describe("109P position against JPL Horizons", () => {
  const rows = fixture.samples.map((sample) => {
    const model = comet.stateAt(sample.utcMs, "sun").positionKm;
    const reference = sample.positionKm;
    return { label: sample.label, utcMs: sample.utcMs, errorKm: distance(model, reference), fraction: distance(model, reference) / Math.hypot(...reference), rangeAu: Math.hypot(...reference) / AU_KM };
  });

  it("is checked at eight dates from 1990 to 2030, in the 1990 to 2030 window the definition states", () => {
    expect(rows).toHaveLength(8);
    expect(new Date(rows[0].utcMs).getUTCFullYear()).toBe(1990);
    expect(new Date(rows[7].utcMs).getUTCFullYear()).toBe(2030);
    expect(SWIFT_TUTTLE.accuracy.validUtc).toEqual({ startUtcMs: Date.UTC(1990, 0, 1), endUtcMs: Date.UTC(2030, 0, 1) });
    expect(fixture.center).toMatch(/500@10/);
    expect(fixture.command).toBe("DES=109P;CAP");
    for (const sample of fixture.samples) expect(sample.utcMs).toBeGreaterThanOrEqual(SWIFT_TUTTLE.accuracy.validUtc.startUtcMs);
  });

  it("has a maximum Sun-centred error equal to the figure the definition records (10.7 million km at 2030-01-01, 0.071 AU)", () => {
    const worst = rows.reduce((a, b) => (b.errorKm > a.errorKm ? b : a));
    expect(Math.ceil(worst.errorKm)).toBe(SWIFT_TUTTLE_MAX_ERROR_KM);
    expect(worst.label).toMatch(/^2030-Jan-01/);
    expect(worst.errorKm / AU_KM).toBeCloseTo(0.0714, 3);
    expect(SWIFT_TUTTLE.accuracy.position.accuracy).toContain(SWIFT_TUTTLE_MAX_ERROR_KM.toLocaleString("en-US"));
  });

  it("has a largest fractional error equal to the recorded one (0.857% at the 1992 perihelion), which classifies it as approximate", () => {
    const worst = rows.reduce((a, b) => (b.fraction > a.fraction ? b : a));
    expect(worst.fraction).toBeCloseTo(SWIFT_TUTTLE_MAX_ERROR_FRACTION, 5);
    expect(worst.label).toMatch(/^1992-Dec-12/);
    expect(worst.fraction).toBeLessThan(SWIFT_TUTTLE_APPROXIMATE_LIMIT_FRACTION);
    expect(SWIFT_TUTTLE.accuracy.position.accuracy).toMatch(/approximate position/);
    expect(SWIFT_TUTTLE.accuracy.position.accuracy).toMatch(/not an ephemeris/);
    expect(SWIFT_TUTTLE.accuracy.position.sourceType).toBe("reconstructed");
  });

  it("states the two-body, perturbation and non-gravitational limits in the accuracy record", () => {
    const text = SWIFT_TUTTLE.accuracy.orientationLimitations.join(" ");
    expect(text).toMatch(/no planetary perturbations and no non-gravitational forces/);
    expect(text).toMatch(/Positions before 1990 or after 2030 were not compared/);
  });

  it("reaches the SBDB perihelion and aphelion distances", () => {
    const perihelion = comet.stateAt(SWIFT_TUTTLE_SAMPLING.periapsisUtcMs, "sun").positionKm;
    expect(Math.hypot(...perihelion) / AU_KM).toBeCloseTo(element("q"), 5);
    const aphelion = comet.stateAt(Math.round(SWIFT_TUTTLE_SAMPLING.periapsisUtcMs + SWIFT_TUTTLE_PERIOD_MS / 2), "sun").positionKm;
    expect(Math.hypot(...aphelion) / AU_KM).toBeCloseTo(element("ad"), 4);
  });
});

describe("109P in the catalogue", () => {
  it("is defined once with a Sun parent, no orientation, a binding, and a marker visual with no texture", () => {
    expect(catalogue.get("swift-tuttle").definition).toBe(SWIFT_TUTTLE);
    expect(SWIFT_TUTTLE.parentId).toBe("sun");
    expect(SWIFT_TUTTLE.orientation).toBe("none");
    expect(SWIFT_TUTTLE.gmKm3S2).toBeUndefined();
    expect(catalogue.get("swift-tuttle").source?.body).toBe("swift-tuttle");
    expect(SWIFT_TUTTLE_VISUAL.kind).toBe("marker");
    expect(SWIFT_TUTTLE_VISUAL.texture).toBeUndefined();
  });

  it("resolves from the Sun and from Earth through the generic resolver, to the same vector as its own source", () => {
    const t = Date.UTC(2026, 7, 13);
    const fromSun = resolver.stateOf("swift-tuttle", t, "sun");
    expect(Array.from(fromSun.positionKm)).toEqual(Array.from(comet.stateAt(t, "sun").positionKm));
    const fromEarth = resolver.stateOf("swift-tuttle", t, "earth");
    const earth = adapter.earthPositionFromSunKm(t);
    expect(fromEarth.positionKm[0]).toBeCloseTo(fromSun.positionKm[0] - earth[0], 3);
    expect(() => comet.stateAt(t, "earth")).toThrow(/Sun-centred/);
  });

  it("is 43 AU from the Sun in August 2026, near the far end of its orbit", () => {
    expect(Math.hypot(...comet.stateAt(Date.UTC(2026, 7, 13), "sun").positionKm) / AU_KM).toBeGreaterThan(42);
  });
});

describe("eccentric-anomaly spacing of the comet's own orbit", () => {
  it("draws one whole turn through the source's positions, ending exactly on the span", () => {
    const span = { startUtcMs: SWIFT_TUTTLE_SAMPLING.periapsisUtcMs, endUtcMs: SWIFT_TUTTLE_SAMPLING.periapsisUtcMs + Math.round(SWIFT_TUTTLE_PERIOD_MS) };
    const times = eccentricPathTimesUtcMs(span, 512, SWIFT_TUTTLE_SAMPLING);
    expect(times[0]).toBe(span.startUtcMs);
    expect(times[511]).toBe(span.endUtcMs);
    expect(Math.hypot(...comet.stateAt(times[0], "sun").positionKm) / AU_KM).toBeCloseTo(element("q"), 4);
    // The aphelion is the middle of a symmetric spacing.
    const middle = comet.stateAt(times[Math.floor(511 / 2)], "sun").positionKm;
    expect(Math.hypot(...middle) / AU_KM).toBeGreaterThan(51);
  });
});

describe("the name check", () => {
  const files = import.meta.glob("../../*/src/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

  it("finds the comet's name only in src/core/bodies/ and src/assets/bodies/ (and the two lines that join them)", () => {
    const named = Object.entries(files).filter(([, text]) => /swift|tuttle|109P/i.test(text)).map(([path]) => path).sort();
    const outside = named.filter((path) => !path.startsWith("../../astraeus/src/core/bodies/") && !path.startsWith("../../astraeus/src/assets/bodies/"));
    // The catalogue joins the asset entry by import; the shower builder and the entry point never name it.
    expect(outside).toEqual(["../../astraeus/src/assets/catalogue.ts"]);
  });

  it("leaves the shower builder generic: the planets' orbit list stays the four planets and the comet's whole orbit is drawn on its own", () => {
    const definition = buildShowerDefinition(parseShowerSettings(perseids), { kind: "loaded", orbits: madeUpOrbits(7, 50) });
    const orbitIds = (definition.paths ?? []).map((path) => path.object.id).filter((id) => id.endsWith("-orbit") && id !== "swift-tuttle-orbit");
    expect(orbitIds.sort()).toEqual(["jupiter-orbit", "mars-orbit", "mercury-orbit", "venus-orbit"]);
  });
});

describe("pathTimesUtcMs stays the even-in-time spacing", () => {
  it("is unchanged", () => {
    expect(pathTimesUtcMs({ startUtcMs: 0, endUtcMs: 100 }, 5)).toEqual([0, 25, 50, 75, 100]);
  });
});
