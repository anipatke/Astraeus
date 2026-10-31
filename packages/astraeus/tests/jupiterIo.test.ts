import { describe, expect, it } from "vitest";
import ioFixture from "./fixtures/io-horizons.json";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { BUILT_IN_BINDINGS, BUILT_IN_BODIES, JUPITER, MARS, MERCURY } from "../src/core/bodies";
import { IO, IO_DIAMETER_KM, IO_EPHEMERIS_LIMITATIONS, IO_EPOCH_UTC_MS, IO_MAX_ERROR_KM, IO_MEAN_ELEMENTS, IO_PERIOD_DAYS, createIoTrajectory, siderealPeriodDays, trueAnomalyFromMean } from "../src/core/bodies/io";
import type { CelestialBodyDefinition, StateSourceBinding } from "../src/core/body";
import { createProvenance } from "../src/core/provenance";
import { createStateResolver } from "../src/core/stateResolver";
import { createTwoBodyTrajectory, fullTurnSpanMs } from "../src/core/sunCentredSources";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";
import { catalogue } from "../src/assets/catalogue";
import moonFixture from "./fixtures/jupiter-moons-horizons.json";
import { jupiterIoSystem } from "../src/assets/compositions";
import { bodyLightDirections } from "../src/app/lighting";

const adapter = createOrbAstronomyAdapter();
const resolver = createStateResolver(BUILT_IN_BODIES, BUILT_IN_BINDINGS, adapter);
const samples = ioFixture.bodies.io.samples;
// Horizons' own Jupiter-centred vectors for Io in 2016 (T-096 fixture), the year the test setup loads the fits for.
const rows2016 = (moonFixture as { bodies: Record<string, { rows: { utc: string; positionKm: number[] }[] }> }).bodies.io.rows
  .filter((row) => row.utc.startsWith("2016")).map((row) => ({ utcMs: Date.parse(row.utc), positionKm: row.positionKm }));

const distance = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const angleDeg = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (Math.hypot(a[0], a[1], a[2]) * Math.hypot(b[0], b[1], b[2]))))) * 180 / Math.PI;

describe("Io about Jupiter", () => {
  it("is defined once: Jupiter-parented, tidally locked, with the Horizons radius and GM", () => {
    expect(IO.parentId).toBe("jupiter");
    expect(IO.orientation).toBe("tidal-lock");
    expect(IO.radiusKm).toBe(ioFixture.bodies.io.meanRadiusKm);
    expect(IO.gmKm3S2).toBe(ioFixture.bodies.io.gmKm3S2);
    expect(IO.radiusKm * 2).toBeCloseTo(IO_DIAMETER_KM, 1);
    // Since O-025 (T-098) Io's position is JPL Horizons' through the core curve fits, not the mean elements.
    expect(IO.accuracy.position.sourceType).toBe("ephemeris");
    expect(IO.accuracy.position.sources.join(" ")).toContain("ssd.jpl.nasa.gov/api/horizons.api");
    expect(IO.accuracy.validUtc.startUtcMs).toBeGreaterThanOrEqual(Date.UTC(1950, 0, 1));
    expect(JUPITER.gmKm3S2).toBe(126_686_531.9);
  });

  it("takes the table's mean elements and keeps the sidereal period they imply", () => {
    expect(IO_MEAN_ELEMENTS.semiMajorAxisKm).toBe(421800);
    expect(IO_MEAN_ELEMENTS.periodDays).toBe(1.762732);
    // The known sidereal period of Io is 1.769138 d; the Horizons header says about 1.77 d.
    expect(IO_PERIOD_DAYS).toBeCloseTo(1.769138, 4);
    expect(siderealPeriodDays(1.762732, 1.333)).toBe(IO_PERIOD_DAYS);
    expect(trueAnomalyFromMean(0, 0.3)).toBeCloseTo(0, 12);
    expect(trueAnomalyFromMean(Math.PI, 0.3)).toBeCloseTo(Math.PI, 12);
    // J2000 in UTC is 64.184 s before 12:00 UTC on 2000-01-01 (TT-UTC).
    expect(IO_EPOCH_UTC_MS).toBe(Date.UTC(2000, 0, 1, 12) - 64_184);
  });

  it("stays within the ellipse the elements describe and is Jupiter-centred only", () => {
    const io = createIoTrajectory();
    for (const sample of samples) {
      const state = io.stateAt(sample.utcMs, "jupiter");
      const r = Math.hypot(...state.positionKm);
      expect(r).toBeGreaterThan(421_000 * (1 - 0.006));
      expect(r).toBeLessThan(422_000 * (1 + 0.006));
      expect(state.center).toBe("jupiter");
      expect(state.orientation).not.toBeNull();
    }
    expect(() => io.stateAt(samples[0].utcMs, "sun")).toThrow(/Jupiter-centred/);
  });

  it("kept as the record: the mean-element model compared with JPL Horizons at six dates is an approximate demonstration", () => {
    expect(samples.length).toBeGreaterThanOrEqual(6);
    const io = createIoTrajectory();
    const errors = samples.map((sample) => distance(io.stateAt(sample.utcMs, "jupiter").positionKm, sample.positionKm));
    const max = Math.max(...errors);
    // The recorded figure is the measured one, rounded up to the km; outside one Io diameter, so only a demonstration.
    expect(Math.ceil(max)).toBe(IO_MAX_ERROR_KM);
    expect(max).toBeGreaterThan(IO_DIAMETER_KM);
    expect(IO_EPHEMERIS_LIMITATIONS.join(" ")).toContain(IO_MAX_ERROR_KM.toLocaleString("en-US"));
    // Nearest the epoch the elements hold at: the J2000 sample is within a few thousand km.
    expect(errors[samples.findIndex((sample) => sample.jdUtc === 2451545)]).toBeLessThan(IO_DIAMETER_KM);
  });

  it("is placed where Horizons puts it: the resolver's Io is within 2 m of Horizons at the 2016 fixture dates", () => {
    expect(rows2016.length).toBeGreaterThanOrEqual(3);
    for (const row of rows2016) expect(distance(resolver.stateOf("io", row.utcMs, "jupiter").positionKm, row.positionKm) * 1000).toBeLessThan(2);
  });

  it("composes: Io from the Sun is Jupiter from the Sun plus Io from Jupiter, and Io from Io is zero", () => {
    for (const sample of rows2016) {
      const ioSun = resolver.stateOf("io", sample.utcMs, "sun").positionKm;
      const jupiterSun = resolver.stateOf("jupiter", sample.utcMs, "sun").positionKm;
      const ioJupiter = resolver.stateOf("io", sample.utcMs, "jupiter").positionKm;
      expect(distance([ioSun[0] - jupiterSun[0], ioSun[1] - jupiterSun[1], ioSun[2] - jupiterSun[2]], ioJupiter)).toBeLessThan(1e-6);
      const self = resolver.stateOf("io", sample.utcMs, "io");
      expect(Array.from(self.positionKm)).toEqual([0, 0, 0]);
      expect(self.orientation).not.toBeNull();
    }
  });

  it("keeps its near side towards Jupiter", () => {
    const state = resolver.stateOf("io", rows2016[1].utcMs, "jupiter");
    const [x, y, z, w] = state.orientation!;
    const axis = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w)];
    const toJupiter = state.positionKm.map((c) => -c);
    // The prime meridian is the IAU linear model (data/orbits/io.json, T-116): the near side on average, not the fitted instant. Io is within 0.8 degrees of the direction to Jupiter here; the limit is 1.
    expect(angleDeg(axis, toJupiter)).toBeLessThan(1);
  });

  it("is mounted by a composition with Jupiter as the natural centre and a loop of one period", () => {
    expect(jupiterIoSystem.bodies).toEqual(["jupiter", "io"]);
    expect(jupiterIoSystem.defaultCenter).toBe("jupiter");
    expect(jupiterIoSystem.paths?.[0].spanMs).toBeCloseTo(IO_PERIOD_DAYS * 86_400_000, 0);
    expect(catalogue.get("io").visual.texture?.licence?.licence).toBe("public domain");
  });
});

describe("a centre that is neither Earth nor the Sun, through the same contracts (fake pair)", () => {
  const made = createProvenance({ sourceType: "illustrative", sources: ["made up"], accuracy: "none", notes: "" });
  const accuracy = { dimensions: made, position: made, validUtc: { startUtcMs: 0, endUtcMs: 1e13 }, orientationLimitations: [] };
  const GM = 4.0e5;
  const A = 1.0e4;
  const definitions: CelestialBodyDefinition[] = [
    { id: "origin", label: "Origin", radiusKm: 1, orientation: "none", accuracy },
    { id: "planet", label: "Planet", radiusKm: 100, gmKm3S2: GM, parentId: "origin", orientation: "none", accuracy },
    { id: "satellite", label: "Satellite", radiusKm: 10, parentId: "planet", orientation: "none", accuracy },
  ];
  const twoBody = createOrbTwoBodyAdapter([definitions[1]]);
  const bindings: StateSourceBinding[] = [
    { body: "planet", create: () => ({ body: "planet", stateAt: (t, center = "origin") => ({ body: "planet", center, timeUtcMs: t, frame: "EQJ", positionKm: Float64Array.of(1e8, 0, 0), orientation: null }) as never }) },
    {
      body: "satellite",
      create: () => createTwoBodyTrajectory({
        body: "satellite", center: "planet", plane: "EQJ", epochUtcMs: 0,
        elements: { semiMajorAxisKm: A, eccentricity: 0, inclinationDeg: 0, raanDeg: 0, argumentOfPeriapsisDeg: 0, trueAnomalyDeg: 0 },
      }, twoBody),
    },
  ];
  const fake = createStateResolver(definitions, bindings, adapter);

  it("moves a made-up satellite about a made-up GM on the Kepler period and composes through the parent", () => {
    const period = 2 * Math.PI * Math.sqrt(A ** 3 / GM);
    const start = fake.stateOf("satellite", 0, "planet").positionKm;
    const later = fake.stateOf("satellite", Math.round(period * 1000), "planet").positionKm;
    expect(distance(start, later)).toBeLessThan(0.01);
    const quarter = fake.stateOf("satellite", Math.round(period * 250), "planet").positionKm;
    expect(Math.hypot(...quarter)).toBeCloseTo(A, 6);
    expect(Math.abs(quarter[0])).toBeLessThan(0.01);
    const fromOrigin = fake.stateOf("satellite", 0, "origin").positionKm;
    expect(distance(fromOrigin, [1e8 + A, 0, 0])).toBeLessThan(1e-6);
  });
});

describe("lighting over any composition", () => {
  const t = Date.UTC(2016, 10, 4, 12);

  it("lights Jupiter and Io each along its own Sun direction", () => {
    const directions = bodyLightDirections(jupiterIoSystem.bodies, resolver, t);
    expect([...directions.keys()]).toEqual(["jupiter", "io"]);
    for (const id of jupiterIoSystem.bodies) {
      const toSun = resolver.sunFrom(id, t).positionKm;
      const length = Math.hypot(...toSun);
      const direction = directions.get(id)!;
      expect(Math.hypot(...direction)).toBeCloseTo(1, 12);
      // render axes are EQJ with Y and Z swapped and one sign flipped; the dot product with the converted vector is 1
      const [x, y, z] = [toSun[0] / length, toSun[1] / length, toSun[2] / length];
      const expected = [x, z, -y];
      expect(distance(direction, expected)).toBeLessThan(1e-12);
    }
    // They differ only by the parallax of Io's orbit seen from the Sun: at most about 0.03 degrees.
    const a = directions.get("jupiter")!;
    const b = directions.get("io")!;
    const parallaxDeg = angleDeg(a, b);
    expect(parallaxDeg).toBeGreaterThan(0);
    expect(parallaxDeg).toBeLessThan(0.04);
  });
});

describe("full-turn span for planet orbits", () => {
  it("finds the sidereal periods of the planets from their own state sources", () => {
    const t = Date.UTC(2027, 7, 13);
    const day = 86_400_000;
    for (const [definition, days] of [[MERCURY, 87.969], [MARS, 686.98], [JUPITER, 4332.59]] as const) {
      const source = catalogue.get(definition.id).source!.create(adapter);
      const span = fullTurnSpanMs(source, t, 2 * day, 3000) / day;
      expect(Math.abs(span - days) / days, definition.id).toBeLessThan(0.005);
    }
  });

  it("refuses a search that never completes a turn", () => {
    const source = catalogue.get("jupiter").source!.create(adapter);
    expect(() => fullTurnSpanMs(source, 0, 86_400_000, 10)).toThrow(/no full turn/);
    expect(() => fullTurnSpanMs(source, 0, 0, 10)).toThrow(/step/);
  });
});
