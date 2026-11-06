// I-128: a provider path's drawn times are whole milliseconds, so every `lineFixedTo` form builds and draws. Made-up configurations only (ARCH-03).
import { describe, expect, it } from "vitest";
import { PerspectiveCamera } from "three";
import { Scene, SceneError, earth, mars, sun } from "astraeus";
import { createState } from "../src/core/state";
import { trueScale } from "../src/core/scalePolicy";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { TrackedBodyView } from "../src/app/TrackedBodyView";
import { trackedBodiesOf } from "../src/app/experienceDefinition";
import { placementAbout } from "./scenePlacement";
import { definitionOf } from "../src/api/definitionOf";

const T0 = Date.parse("2026-01-01T00:00:00Z");
const DAY = 86_400_000;
const at = (day: number) => new Date(T0 + day * DAY).toISOString();
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "no error"; };
// A made-up straight cruise about the Sun; a 2-day span is not a multiple of 127 ms.
const provider = { stateAt: (t: number) => createState({ body: "probe", center: "sun", timeUtcMs: t, positionKm: [1.2e8 + (t - T0) * 0.1, 2e7, 5e6], orientation: null }) };
const solar = (lineFixedTo: unknown, days = 2) => new Scene().addBody(sun).addBody(earth, { enlarge: 50 }).addBody(mars, { enlarge: 50 }).setTime(T0)
  .addTrajectory({ id: "probe", center: "sun", provider, bounds: { start: T0, end: T0 + days * DAY }, lineFixedTo: lineFixedTo as never });
const draw = (scene: Scene) => {
  const body = trackedBodiesOf(definitionOf(scene))[0]!;
  new TrackedBodyView(body).update(T0 + DAY, trueScale, new FloatingOrigin(), new PerspectiveCamera(), placementAbout("sun"));
  return body;
};

describe("a provider path's line fixed to another body (I-128)", () => {
  it("draws with a plain body id, a stretch list and \"auto\"", () => {
    expect(() => draw(solar("earth"))).not.toThrow();
    expect(() => draw(solar([{ start: at(0), end: at(1), body: "sun" }, { start: at(1), end: at(2), body: "earth" }]))).not.toThrow();
    const auto = draw(solar("auto"));
    expect(Array.isArray(auto.lineFixedTo)).toBe(true);
  });

  it("hands the resolver whole milliseconds only, for any span", () => {
    for (const days of [2, 3.1, 1 / 3]) {
      const times = draw(solar("earth", days)).pathTimesUtcMs;
      expect(times.every(Number.isInteger)).toBe(true);
      expect(times[0]).toBe(T0);
      expect(times[times.length - 1]).toBe(T0 + days * DAY);
    }
  });
});

describe("lineFixedTo input checks", () => {
  it("a value of the wrong type throws bad-trajectory", () => {
    expect(codeOf(() => solar(5))).toBe("bad-trajectory");
    expect(codeOf(() => solar(true))).toBe("bad-trajectory");
  });

  it("\"auto\" cannot be a body id", () => {
    const record = { id: "auto", label: "Auto" } as never;
    const message = (() => { try { new Scene().addBody(sun).addBodyFromElements(record); } catch (error) { return (error as Error).message; } return ""; })();
    expect(message).toMatch(/"auto" is reserved/);
  });
});
