import { describe, expect, it } from "vitest";
import ioFixture from "./fixtures/io-horizons.json";
import phaseFixture from "./fixtures/usno-moon-phases-2024.json";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { BUILT_IN_BINDINGS, BUILT_IN_BODIES, JUPITER, MARS, MERCURY } from "../src/core/bodies";
import { IO, IO_DIAMETER_KM, IO_EPOCH_UTC_MS, IO_MAX_ERROR_KM, IO_MEAN_ELEMENTS, IO_PERIOD_DAYS, createIoTrajectory, siderealPeriodDays, trueAnomalyFromMean } from "../src/core/bodies/io";
import type { CelestialBodyDefinition, StateSourceBinding } from "../src/core/body";
import { illuminatedFraction } from "../src/core/illumination";
import { createProvenance } from "../src/core/provenance";
import { readableScale, trueScale, type ScalePolicy } from "../src/core/scalePolicy";
import { createStateResolver } from "../src/core/stateResolver";
import { createTwoBodyTrajectory, fullTurnSpanMs } from "../src/core/sunCentredSources";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";
import { catalogue } from "../src/assets/catalogue";
import { jupiterIoSystem } from "../src/assets/compositions";
import { bodyLightDirections, centreDirectionalDirection, lightingFromSearch, singleSunDirection, sunScaledPosition } from "../src/app/lighting";
import { bodyAbsolute, createSceneResolver } from "../src/app/sceneLayout";

const adapter = createOrbAstronomyAdapter();
const resolver = createStateResolver(BUILT_IN_BODIES, BUILT_IN_BINDINGS, adapter);
const samples = ioFixture.bodies.io.samples;

const distance = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const angleDeg = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (Math.hypot(a[0], a[1], a[2]) * Math.hypot(b[0], b[1], b[2]))))) * 180 / Math.PI;

describe("Io about Jupiter", () => {
  it("is defined once: Jupiter-parented, tidally locked, with the Horizons radius and GM", () => {
    expect(IO.parentId).toBe("jupiter");
    expect(IO.orientation).toBe("tidal-lock");
    expect(IO.radiusKm).toBe(ioFixture.bodies.io.meanRadiusKm);
    expect(IO.gmKm3S2).toBe(ioFixture.bodies.io.gmKm3S2);
    expect(IO.radiusKm * 2).toBeCloseTo(IO_DIAMETER_KM, 1);
    expect(IO.accuracy.position.sourceType).toBe("reconstructed");
    expect(IO.accuracy.position.sources.join(" ")).toContain("ssd.jpl.nasa.gov/sats/elem");
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

  it("compares with JPL Horizons at six dates and classifies by the one-Io-diameter line", () => {
    expect(samples.length).toBeGreaterThanOrEqual(6);
    const errors = samples.map((sample) => distance(resolver.stateOf("io", sample.utcMs, "jupiter").positionKm, sample.positionKm));
    const max = Math.max(...errors);
    console.info(`IO-HORIZONS errors km: ${errors.map((e) => e.toFixed(1)).join(", ")}; max ${max.toFixed(2)}`);
    // The recorded figure is the measured one, rounded up to the km.
    expect(Math.ceil(max)).toBe(IO_MAX_ERROR_KM);
    const outside = max > IO_DIAMETER_KM;
    const record = IO.accuracy.position;
    expect(record.accuracy).toContain(IO_MAX_ERROR_KM.toLocaleString("en-US"));
    if (outside) {
      // Outside one Io diameter: approximate demonstration, with the figure in the known limitations.
      expect(record.accuracy).toMatch(/approximate demonstration/);
      expect(IO.accuracy.orientationLimitations.join(" ")).toContain(IO_MAX_ERROR_KM.toLocaleString("en-US"));
      expect(record.sourceType).toBe("reconstructed");
    } else {
      expect(record.accuracy).toMatch(/ephemeris-tier approximate/);
    }
    // Nearest the epoch the elements hold at: the J2000 sample is within a few thousand km.
    expect(errors[samples.findIndex((sample) => sample.jdUtc === 2451545)]).toBeLessThan(IO_DIAMETER_KM);
  });

  it("composes: Io from the Sun is Jupiter from the Sun plus Io from Jupiter, and Io from Io is zero", () => {
    for (const sample of samples) {
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
    const state = resolver.stateOf("io", samples[3].utcMs, "jupiter");
    const [x, y, z, w] = state.orientation!;
    const axis = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w)];
    const toJupiter = state.positionKm.map((c) => -c);
    expect(angleDeg(axis, toJupiter)).toBeLessThan(1e-4);
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
  const t = Date.UTC(2000, 0, 1, 12);

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

  it("reads the lighting model from the query, defaulting to per-body", () => {
    expect(lightingFromSearch("")).toBe("per-body");
    expect(lightingFromSearch("?experience=earth-moon&lighting=single-sun")).toBe("single-sun");
    expect(lightingFromSearch("?lighting=other")).toBe("per-body");
  });

  it("measures one Sun light at the Sun's scaled position against the per-body lights on the Spike 01 USNO dates", () => {
    const sceneResolver = createSceneResolver(adapter);
    const events = phaseFixture.phasedata.filter((event) => event.month === 1 && event.year === 2024 && ["Last Quarter", "New Moon", "First Quarter", "Full Moon"].includes(event.phase));
    expect(events).toHaveLength(4);
    const policies: ScalePolicy[] = [trueScale, readableScale];
    let maxPoint = 0;
    let maxDirectional = 0;
    let maxAngleDirectional = 0;
    let maxAnglePoint = 0;
    const rows: string[] = [];
    for (const policy of policies) {
      for (const event of events) {
        const time = Date.parse(`${event.year}-${String(event.month).padStart(2, "0")}-${String(event.day).padStart(2, "0")}T${event.time}:00Z`);
        const perBody = illuminatedFraction(sceneResolver.stateOf("moon", time, "earth"), sceneResolver.sunFrom("earth", time));
        // Scene centre is Earth. Floating origin = Earth, so local coordinates are the scaled absolutes, narrowed to float32.
        const sunScaled = sunScaledPosition(sceneResolver, "earth", policy, time);
        const moonScaled = bodyAbsolute(sceneResolver.stateOf("moon", time, "earth").positionKm, policy);
        const fround = (v: ArrayLike<number>) => [Math.fround(v[0]), Math.fround(v[1]), Math.fround(v[2])];
        const point = singleSunDirection(fround(moonScaled), fround(sunScaled));
        const centred = centreDirectionalDirection([0, 0, 0], fround(sunScaled));
        const toEarth = moonScaled.map((c) => -c);
        const fraction = (lightDirection: ArrayLike<number>) => {
          const len = Math.hypot(...toEarth);
          return Math.max(0, Math.min(1, (1 + (lightDirection[0] * toEarth[0] + lightDirection[1] * toEarth[1] + lightDirection[2] * toEarth[2]) / len) / 2));
        };
        const perBodyDirection = bodyLightDirections(["moon"], sceneResolver, time).get("moon")!;
        maxAnglePoint = Math.max(maxAnglePoint, angleDeg(point, perBodyDirection));
        maxAngleDirectional = Math.max(maxAngleDirectional, angleDeg(centred, perBodyDirection));
        maxPoint = Math.max(maxPoint, Math.abs(fraction(point) - perBody));
        maxDirectional = Math.max(maxDirectional, Math.abs(fraction(centred) - perBody));
        rows.push(`${policy.id} ${event.phase}: per-body ${perBody.toFixed(6)} point ${fraction(point).toFixed(6)} directional ${fraction(centred).toFixed(6)}`);
      }
    }
    console.info(`LIGHTING-MEASUREMENT\n${rows.join("\n")}\nmax |fraction diff| point=${maxPoint.toExponential(3)} directional-from-centre=${maxDirectional.toExponential(3)}; max direction angle point=${maxAnglePoint.toExponential(3)} deg directional=${maxAngleDirectional.toExponential(3)} deg`);
    // Light in the same place as the Sun for every scale that moves all positions alike: no measurable difference.
    expect(maxPoint).toBeLessThan(1e-4);
    expect(maxAnglePoint).toBeLessThan(0.01);
    // One directional light at the centre's direction: the Moon's parallax from the Sun, under a fifth of a degree.
    expect(maxAngleDirectional).toBeLessThan(0.2);
    expect(maxDirectional).toBeLessThan(0.005);
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
