import { describe, expect, it } from "vitest";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { BUILT_IN_BINDINGS, BUILT_IN_BODIES } from "../src/core/bodies";
import type { CelestialBodyDefinition, StateSourceBinding } from "../src/core/body";
import { createProvenance } from "../src/core/provenance";
import { createState } from "../src/core/state";
import { createStateResolver } from "../src/core/stateResolver";
import type { Trajectory } from "../src/core/trajectory";

const adapter = createOrbAstronomyAdapter();
const provenance = createProvenance({ sourceType: "illustrative", sources: ["made up"], accuracy: "none", notes: "" });
const accuracy = {
  dimensions: provenance,
  position: provenance,
  validUtc: { startUtcMs: 0, endUtcMs: 1e12 },
  orientationLimitations: [],
};
const fake = (id: string, parentId?: string): CelestialBodyDefinition => ({
  id,
  label: id,
  radiusKm: 1,
  ...(parentId === undefined ? {} : { parentId }),
  orientation: "none",
  accuracy,
});

// Each provider's position is a quadratic in seconds, so its true velocity is the derivative (the oracle for the provider's claim).
// Position: base * (1 + k s + 0.01 s^2); velocity: base * (k + 0.02 s) km/s.
const quad = (base: number[], k: number) => ({
  position: (s: number) => base.map((v) => v * (1 + k * s + 0.01 * s * s)),
  velocity: (s: number) => base.map((v) => v * (k + 0.02 * s)),
});
function binding(body: string, center: string, base: number[], k: number, withVelocity: boolean): StateSourceBinding {
  const motion = quad(base, k);
  return {
    body,
    create: (): Trajectory => ({
      body,
      stateAt: (timeUtcMs) =>
        createState({
          body,
          center,
          timeUtcMs,
          orientation: null,
          positionKm: motion.position(timeUtcMs / 1000),
          ...(withVelocity ? { velocityKmS: motion.velocity(timeUtcMs / 1000) } : {}),
        }),
    }),
  };
}

// r (root) <- b <- a ; r <- e ; r <- n (no velocity) <- m (has velocity)
const definitions = [fake("r"), fake("b", "r"), fake("a", "b"), fake("e", "r"), fake("n", "r"), fake("m", "n")];
const resolver = createStateResolver(
  definitions,
  [
    binding("b", "r", [10, 20, 30], 0.3, true),
    binding("a", "b", [1, -2, 3], 0.5, true),
    binding("e", "r", [100, 200, -300], 0.1, true),
    binding("n", "r", [7, 8, 9], 0.2, false),
    binding("m", "n", [4, 5, 6], 0.4, true),
  ],
  adapter,
);

const T = 5000;
/** Central difference of the resolver's own positions: exact for these quadratic motions. */
function finiteDifference(body: string, center: string): number[] {
  const before = resolver.stateOf(body, T - 1000, center).positionKm;
  const after = resolver.stateOf(body, T + 1000, center).positionKm;
  return [0, 1, 2].map((axis) => (after[axis] - before[axis]) / 2);
}
const expectVelocity = (body: string, center: string): void => {
  const velocity = resolver.stateOf(body, T, center).velocityKmS;
  expect(velocity, `${body} from ${center}`).toBeDefined();
  const oracle = finiteDifference(body, center);
  for (let axis = 0; axis < 3; axis += 1) expect(velocity![axis]).toBeCloseTo(oracle[axis], 9);
};

describe("velocity composes exactly as the position does", () => {
  it("keeps the provider's own velocity from the parent", () => {
    expect(Array.from(resolver.stateOf("a", T, "b").velocityKmS!)).toEqual(quad([1, -2, 3], 0.5).velocity(5));
    expectVelocity("a", "b");
  });

  it("sums through a grandparent", () => {
    expectVelocity("a", "r");
    const expected = quad([1, -2, 3], 0.5)
      .velocity(5)
      .map((v, i) => v + quad([10, 20, 30], 0.3).velocity(5)[i]);
    for (let axis = 0; axis < 3; axis += 1)
      expect(resolver.stateOf("a", T, "r").velocityKmS![axis]).toBeCloseTo(expected[axis], 9);
  });

  it("differences through the common ancestor for a sibling centre", () => {
    expectVelocity("a", "e");
    expectVelocity("e", "a");
  });

  it("negates when the centre is the body's descendant", () => {
    expectVelocity("r", "a");
    expectVelocity("b", "a");
  });

  it("has none when any leg lacks velocity, and none for a body about itself", () => {
    expect(resolver.stateOf("n", T, "r").velocityKmS).toBeUndefined();
    expect(resolver.stateOf("m", T, "r").velocityKmS).toBeUndefined();
    expect(resolver.stateOf("r", T, "m").velocityKmS).toBeUndefined();
    expect(resolver.stateOf("a", T, "n").velocityKmS).toBeUndefined();
    expect(resolver.stateOf("m", T, "n").velocityKmS).toBeDefined();
    expect(resolver.stateOf("a", T, "a").velocityKmS).toBeUndefined();
  });
});

describe("built-in catalogue", () => {
  it("measures Io about Jupiter with the fitted source's own velocity", () => {
    // 2016: the year whose Jupiter-moon fits the test setup loads (vitest.setup.ts).
    const time = Date.parse("2016-01-15T00:00:00Z");
    const real = createStateResolver(BUILT_IN_BODIES, BUILT_IN_BINDINGS, adapter);
    const io = real.stateOf("io", time, "jupiter");
    expect(io.velocityKmS).toBeDefined();
    // Independent oracle: finite difference of Io's positions about Jupiter (km/s).
    const h = 30_000;
    const before = real.stateOf("io", time - h, "jupiter").positionKm;
    const after = real.stateOf("io", time + h, "jupiter").positionKm;
    const speed = Math.hypot(...io.velocityKmS!);
    expect(speed).toBeGreaterThan(15);
    expect(speed).toBeLessThan(20);
    for (let axis = 0; axis < 3; axis += 1) {
      expect(io.velocityKmS![axis]).toBeCloseTo((after[axis] - before[axis]) / ((2 * h) / 1000), 1);
    }
    // Io's parent is Jupiter, so the composed answer is the native one; from the Sun it has no velocity (Jupiter's source gives none).
    expect(real.stateOf("io", time, "sun").velocityKmS).toBeUndefined();
  });
});
