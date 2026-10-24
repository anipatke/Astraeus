import { describe, expect, it } from "vitest";
import moonFixture from "./fixtures/moon-horizons.json";
import sunFixture from "./fixtures/sun-horizons.json";
import { GM } from "@lizard-isana/orb/kepler";
import { createOrbAstronomyAdapter, type AstronomyAdapter } from "../src/core/astronomyAdapter";
import { BUILT_IN_BINDINGS, BUILT_IN_BODIES, EARTH, MOON, SUN } from "../src/core/bodies";
import type { CelestialBodyDefinition, StateSourceBinding } from "../src/core/body";
import { MoonTrajectory } from "../src/core/moonTrajectory";
import { earthStateAt, sunPositionFromEarthAt } from "../src/core/referenceCenters";
import { createStateResolver } from "../src/core/stateResolver";
import { createCenteredPosition, createState, type Quaternion } from "../src/core/state";
import { createProvenance } from "../src/core/provenance";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";
import { createTwoBodyTrajectory } from "../src/core/sunCentredSources";
import type { Trajectory } from "../src/core/trajectory";

const adapter = createOrbAstronomyAdapter();
const real = createStateResolver(BUILT_IN_BODIES, BUILT_IN_BINDINGS, adapter);
// In 2016, the year whose Jupiter moon fits the test setup loads (vitest.setup.ts).
const T = Date.parse("2016-01-15T00:00:00Z");
const provenance = createProvenance({ sourceType: "illustrative", sources: ["made up"], accuracy: "none", notes: "" });
const accuracy = {
  dimensions: provenance,
  position: provenance,
  validUtc: { startUtcMs: 0, endUtcMs: 1e12 },
  orientationLimitations: [],
};

describe("built-in catalogue", () => {
  it("defines each body once with its parent, orientation model and accuracy record", () => {
    expect(BUILT_IN_BODIES.map((body) => body.id)).toEqual(["sun", "earth", "moon", "mercury", "venus", "mars", "jupiter", "io", "europa", "ganymede", "callisto", "saturn", "uranus", "neptune", "pluto", "phobos", "deimos", "mimas", "enceladus", "tethys", "dione", "rhea", "titan", "iapetus", "triton", "charon", "swift-tuttle"]);
    expect([SUN.parentId, EARTH.parentId, MOON.parentId]).toEqual([undefined, "sun", "earth"]);
    expect([SUN.orientation, EARTH.orientation, MOON.orientation]).toEqual(["none", "ecef", "iau-rotation"]);
    for (const body of BUILT_IN_BODIES) {
      expect(body.radiusKm).toBeGreaterThan(0);
      expect(body.accuracy.validUtc.endUtcMs).toBeGreaterThan(body.accuracy.validUtc.startUtcMs);
      expect(body.accuracy.position.sources.length).toBeGreaterThan(0);
    }
    expect(MOON.accuracy.orientationLimitations.join(" ")).toMatch(/0\.01 km.*254 km/);
    expect(MOON.accuracy.orientationLimitations.join(" ")).toMatch(/libration terms/);
    expect(BUILT_IN_BINDINGS.map((binding) => binding.body)).toEqual(["earth", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "io", "europa", "ganymede", "callisto", "phobos", "deimos", "mimas", "enceladus", "tethys", "dione", "rhea", "titan", "iapetus", "triton", "charon", "swift-tuttle"]);
  });

  it("carries gravitational parameters equal to the library's own table", () => {
    // The library table covers the Sun, Earth and Moon; the planets' values come from Horizons (tests/planets.test.ts).
    for (const body of BUILT_IN_BODIES.slice(0, 3)) expect(body.gmKm3S2).toBe(GM[body.id as keyof typeof GM]);
  });
});

describe("resolver equals today's recentring sites", () => {
  const moon = new MoonTrajectory(adapter);

  it("places the Moon from the Sun as the removed Sun branch did (Moon-from-Earth plus Earth-from-Sun), at every archived Horizons date", () => {
    for (const sample of moonFixture.samples) {
      const time = Date.parse(sample.utc);
      const viaResolver = real.stateOf("moon", time, "sun");
      // The old branch, written out: the Moon's own Earth-centred state shifted by Earth's position from the Sun.
      const moonFromEarth = moon.stateAt(time, "earth");
      const earthFromSun = earthStateAt(adapter, time);
      expect(viaResolver.center).toBe("sun");
      for (let axis = 0; axis < 3; axis += 1) {
        expect(Math.abs(viaResolver.positionKm[axis] - (moonFromEarth.positionKm[axis] + earthFromSun.positionKm[axis]))).toBeLessThanOrEqual(1e-9);
      }
      expect(viaResolver.orientation).toEqual(moonFromEarth.orientation);
    }
  });

  it("no longer recentres the Moon itself: any centre but Earth is the resolver's job", () => {
    expect(() => moon.stateAt(T, "sun")).toThrow(/Earth/);
    expect(() => moon.stateAt(T, "moon")).toThrow(/Earth/);
    expect(moon.stateAt(T).center).toBe("earth");
  });

  it("places Earth and the Sun as earthStateAt and sunPositionFromEarthAt do, exactly", () => {
    for (const sample of sunFixture.samples) {
      const time = Date.parse(sample.utc);
      expect(real.stateOf("earth", time, "sun")).toEqual(earthStateAt(adapter, time));
      expect(real.stateOf("sun", time, "earth").positionKm).toEqual(sunPositionFromEarthAt(adapter, time).positionKm);
    }
  });

  it("returns the Sun from Earth as the exact negation of Earth from the Sun", () => {
    const earth = real.stateOf("earth", T, "sun");
    const sun = real.stateOf("sun", T, "earth");
    expect(Array.from(sun.positionKm)).toEqual(Array.from(earth.positionKm, (component) => -component));
    expect(sun.orientation).toBeNull();
  });

  it("returns the Moon from Earth as the provider's own State", () => {
    expect(real.stateOf("moon", T, "earth")).toEqual(moon.stateAt(T, "earth"));
  });

  it("gives the same bytes from separately created resolvers over the same constants", () => {
    const other = createStateResolver(BUILT_IN_BODIES, BUILT_IN_BINDINGS, createOrbAstronomyAdapter());
    for (const [body, center] of [["moon", "sun"], ["earth", "moon"], ["sun", "moon"]] as const) {
      expect(other.stateOf(body, T, center)).toEqual(real.stateOf(body, T, center));
    }
  });

  it("round-trips every pair within 1e-6 km", () => {
    for (const a of BUILT_IN_BODIES) {
      for (const b of BUILT_IN_BODIES) {
        const ab = real.stateOf(a.id, T, b.id).positionKm;
        const ba = real.stateOf(b.id, T, a.id).positionKm;
        for (let axis = 0; axis < 3; axis += 1) expect(Math.abs(ab[axis] + ba[axis])).toBeLessThanOrEqual(1e-6);
      }
    }
  });

  it("offers the same numbers through offsetKm and sunFrom", () => {
    expect(real.offsetKm("moon", "sun", T)).toEqual(real.stateOf("moon", T, "sun").positionKm);
    expect(real.sunFrom("earth", T)).toEqual(real.stateOf("sun", T, "earth"));
  });
});

describe("self-centre rule", () => {
  it("returns the zero self-state with the provider's orientation for Earth, Moon and the Sun", () => {
    const earth = real.stateOf("earth", T, "earth");
    const moon = real.stateOf("moon", T, "moon");
    const sun = real.stateOf("sun", T, "sun");
    for (const state of [earth, moon, sun]) expect(Array.from(state.positionKm)).toEqual([0, 0, 0]);
    expect(earth.orientation).toEqual(earthStateAt(adapter, T).orientation);
    expect(moon.orientation).toEqual(new MoonTrajectory(adapter).stateAt(T).orientation);
    expect(sun.orientation).toBeNull();
  });
});

// A made-up chain: a and e orbit c via b / directly. a -> b -> c (root), e -> c.
const fake = (id: string, parentId: string | undefined, orientation: CelestialBodyDefinition["orientation"] = "none"): CelestialBodyDefinition => ({
  id, label: id, radiusKm: 1, ...(parentId === undefined ? {} : { parentId }), orientation, accuracy,
});
const spin: Quaternion = [0, 0, Math.SQRT1_2, Math.SQRT1_2];
const fakeBinding = (body: string, center: string, position: number[], orientation: Quaternion | null): StateSourceBinding => ({
  body,
  create: (): Trajectory => ({
    body,
    stateAt: (timeUtcMs, from = center) => {
      if (from !== center) throw new RangeError(`${body} holds center ${center}`);
      return createState({ body, center, timeUtcMs, positionKm: position.map((v) => v * (1 + timeUtcMs / 1000)), orientation });
    },
  }),
});
const chainDefinitions = [fake("a", "b", "iau-rotation"), fake("b", "c"), fake("c", undefined), fake("e", "c")];
const chainBindings = [
  fakeBinding("a", "b", [1, 2, 3], spin),
  fakeBinding("b", "c", [10, 20, 30], null),
  fakeBinding("e", "c", [100, 200, 300], null),
];
const chain = createStateResolver(chainDefinitions, chainBindings, adapter);

describe("a made-up chain composes both ways", () => {
  it("composes through the parent chain and the common ancestor", () => {
    const s = 1 + 5000 / 1000;
    expect(Array.from(chain.stateOf("a", 5000, "c").positionKm)).toEqual([11 * s, 22 * s, 33 * s]);
    expect(Array.from(chain.stateOf("c", 5000, "a").positionKm)).toEqual([-11 * s, -22 * s, -33 * s]);
    expect(Array.from(chain.stateOf("a", 5000, "e").positionKm)).toEqual([-89 * s, -178 * s, -267 * s]);
    expect(Array.from(chain.stateOf("e", 5000, "a").positionKm)).toEqual([89 * s, 178 * s, 267 * s]);
    expect(chain.stateOf("a", 5000, "b").center).toBe("b");
    expect(chain.stateOf("a", 5000, "e").orientation).toEqual(chain.stateOf("a", 5000, "c").orientation);
  });

  it("gives every body, root included, a zero self-state with its provider's orientation", () => {
    expect(chain.stateOf("a", 0, "a").orientation).toEqual(chain.stateOf("a", 0, "b").orientation);
    for (const id of ["a", "b", "c", "e"]) expect(Array.from(chain.stateOf(id, 0, id).positionKm)).toEqual([0, 0, 0]);
    expect(chain.stateOf("c", 0, "c").orientation).toBeNull();
  });

  it("rejects an unknown body or centre", () => {
    expect(() => chain.stateOf("z", 0, "c")).toThrow(/unknown body "z"/);
    expect(() => chain.stateOf("a", 0, "z")).toThrow(/unknown centre "z"/);
  });
});

describe("catalogue validation", () => {
  const make = (definitions: CelestialBodyDefinition[], bindings: StateSourceBinding[]) => () =>
    createStateResolver(definitions, bindings, adapter);

  it("rejects duplicate ids, a parented body without a binding, a root with one and unknown references", () => {
    expect(make([...chainDefinitions, fake("a", "c")], chainBindings)).toThrow(/duplicate body id "a"/);
    expect(make(chainDefinitions, chainBindings.slice(1))).toThrow(/"a" has a parent but no state source/);
    expect(make(chainDefinitions, [...chainBindings, fakeBinding("c", "c", [0, 0, 0], null)])).toThrow(/root body "c" must not have a state source/);
    expect(make(chainDefinitions, [...chainBindings, fakeBinding("zz", "c", [0, 0, 0], null)])).toThrow(/unknown body "zz"/);
    expect(make(chainDefinitions, [...chainBindings, chainBindings[0]])).toThrow(/duplicate binding for body "a"/);
    expect(make([fake("a", "nobody"), fake("c", undefined)], [fakeBinding("a", "nobody", [1, 1, 1], null)])).toThrow(/unknown parent/);
    expect(make([fake("a", undefined), fake("b", undefined)], [])).toThrow(/exactly one root/);
  });

  it("rejects a provider that answers in the wrong centre", () => {
    const wrong = createStateResolver([fake("a", "c"), fake("c", undefined)], [{
      body: "a",
      create: (): Trajectory => ({ body: "a", stateAt: (timeUtcMs) => createState({ body: "a", center: "x", timeUtcMs, positionKm: [1, 1, 1], orientation: null }) }),
    }], adapter);
    expect(() => wrong.stateOf("a", 0, "c")).toThrow(/not from "c"/);
  });

  it("requires a modelled orientation where the definition says one exists", () => {
    const bad = createStateResolver(chainDefinitions, [
      fakeBinding("a", "b", [1, 2, 3], null), chainBindings[1], chainBindings[2],
    ], adapter);
    expect(() => bad.stateOf("a", 0, "c")).toThrow(/requires a modeled orientation/);
  });
});

describe("one lunar-series call per body and time", () => {
  it("asks the lunar provider once per instant however many placements a frame needs", () => {
    const calls = new Map<number, number>();
    const counting: AstronomyAdapter = {
      ...adapter,
      moonPositionKm: (time) => {
        calls.set(time, (calls.get(time) ?? 0) + 1);
        return adapter.moonPositionKm(time);
      },
    };
    const resolver = createStateResolver(BUILT_IN_BODIES, BUILT_IN_BINDINGS, counting);
    resolver.stateOf("moon", T, "sun");
    resolver.stateOf("moon", T, "earth");
    resolver.stateOf("sun", T, "moon");
    resolver.stateOf("moon", T, "moon");
    expect(calls.get(T)).toBe(1);
    resolver.stateOf("moon", T + 1000, "sun");
    expect(calls.get(T)).toBe(1);
    expect(calls.get(T + 1000)).toBe(1);
  });
});

describe("two-body motion about any centre with a gravitational parameter", () => {
  const elements = { semiMajorAxisKm: 421_800, eccentricity: 0.05, inclinationDeg: 3, raanDeg: 10, argumentOfPeriapsisDeg: 20, trueAnomalyDeg: 30 };
  const planet = { ...fake("planet", "sun"), gmKm3S2: 1.26686534e8 };
  const input = { body: "satellite", plane: "EQJ" as const, epochUtcMs: T, elements };

  it("accepts a centre whose definition carries a GM and rejects one without", () => {
    const twoBody = createOrbTwoBodyAdapter([...BUILT_IN_BODIES, planet, fake("plain", "sun")]);
    const orbit = createTwoBodyTrajectory({ ...input, center: "planet" }, twoBody);
    const state = orbit.stateAt(T + 3_600_000);
    expect(state.center).toBe("planet");
    expect(() => orbit.stateAt(T, "sun")).toThrow(/centred on "planet"/);
    expect(Math.hypot(...state.positionKm)).toBeGreaterThan(300_000);
    expect(() => createTwoBodyTrajectory({ ...input, center: "plain" }, twoBody)).toThrow(/no gravitational parameter/);
    expect(() => createTwoBodyTrajectory({ ...input, center: "unlisted" }, twoBody)).toThrow(/no gravitational parameter/);
  });

  it("keeps the Sun default and the library's GM for the built-in centres", () => {
    const twoBody = createOrbTwoBodyAdapter();
    expect(createTwoBodyTrajectory(input, twoBody).stateAt(T).center).toBe("sun");
    expect(createTwoBodyTrajectory({ ...input, center: "earth" }, twoBody).stateAt(T).center).toBe("earth");
  });
});

describe("centred positions of one body from itself", () => {
  const base = { body: "x", center: "x", timeUtcMs: 0 };
  it("accepts exactly zero position and velocity, and rejects anything else", () => {
    expect(createCenteredPosition({ ...base, positionKm: [0, 0, 0] }).center).toBe("x");
    expect(createCenteredPosition({ ...base, positionKm: [0, 0, 0], velocityKmS: [0, 0, 0] }).velocityKmS).toEqual(Float64Array.of(0, 0, 0));
    expect(() => createCenteredPosition({ ...base, positionKm: [0, 0, 1e-300] })).toThrow(/exactly zero/);
    expect(() => createCenteredPosition({ ...base, positionKm: [0, 0, 0], velocityKmS: [0, 1e-12, 0] })).toThrow(/exactly zero/);
  });
});
