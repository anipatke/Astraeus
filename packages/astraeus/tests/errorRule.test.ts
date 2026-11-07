import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, sun } from "astraeus";
import { installData } from "../src/api/data";
import { sunOrbitLayer } from "../src/api/sunOrbit";
import { PlanetFitsUncoveredError } from "../src/core/planetSeries";
import { NoFullTurnError, fullTurnSpanMs } from "../src/core/sunCentredSources";

// O-054 T-240: the API error rule (API-05). Every throw is a SceneError and no error is recognised by its message.
const DAY = 86_400_000;
const T0 = Date.parse("2026-01-01T00:00:00Z");
const caught = (fn: () => unknown): unknown => { try { fn(); } catch (error) { return error; } return undefined; };

describe("error rule", () => {
  it("moon positions naming a planet without a moon system throw bad-data naming the package and the planet", async () => {
    const source = { name: "astraeus-data-made-up", provides: [], moonPositions: { center: "mercury", loadIndex: async () => ({}), chunkUrls: {} } };
    const error = await installData([source as never], [], { startUtcMs: 0, endUtcMs: 1 }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SceneError);
    expect((error as SceneError).code).toBe("bad-data");
    expect((error as SceneError).message).toContain("astraeus-data-made-up");
    expect((error as SceneError).message).toContain("mercury");
  });

  it("a lineFixedTo stretch with no body is a bad-trajectory SceneError", () => {
    const error = caught(() => new Scene().addBody(sun).addBody(earth).addTrajectory({
      id: "p", center: "sun", samples: [0, 1].map((i) => ({ time: T0 + i * DAY, positionKm: [1.5e8 + i, 0, 0] })), lineFixedTo: [{ start: T0, end: T0 + DAY, body: "" }],
    }));
    expect(error).toBeInstanceOf(SceneError);
    expect((error as SceneError).code).toBe("bad-trajectory");
    expect((error as SceneError).message).toContain("lineFixedTo[0] body must be a body id");
  });

  it("the two internal faults are named RangeError subclasses", () => {
    const source = { stateAt: () => ({ positionKm: [1, 0, 0] }) } as never;
    const noTurn = caught(() => fullTurnSpanMs(source, T0, DAY, 3));
    expect(noTurn).toBeInstanceOf(NoFullTurnError);
    expect(noTurn).toBeInstanceOf(RangeError);
    const uncovered = new PlanetFitsUncoveredError(new Date(T0));
    expect(uncovered).toBeInstanceOf(RangeError);
    expect(uncovered.message).toContain("2026-01-01T00:00:00.000Z");
  });

  it("a PlanetFitsUncoveredError from the source is read as 'no whole turn' (falls to the osculating ellipse), not rethrown", () => {
    const fault = new PlanetFitsUncoveredError(new Date(T0));
    const catalogue = { get: () => ({ source: { create: () => ({ stateAt: () => { throw fault; } }) } }) } as never;
    expect(caught(() => sunOrbitLayer(catalogue, "ghost" as never, T0, "#fff"))).not.toBe(fault);
  });

  it("a plain RangeError whose text says 'no full turn' is no longer swallowed by the orbit line", () => {
    const stray = new RangeError("no full turn within 3 steps of 1 ms");
    const catalogue = { get: () => ({ source: { create: () => ({ stateAt: () => { throw stray; } }) } }) } as never;
    expect(caught(() => sunOrbitLayer(catalogue, "ghost" as never, T0, "#fff"))).toBe(stray);
  });
});
