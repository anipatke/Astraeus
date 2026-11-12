import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon } from "astraeus";

// I-177: a fractional time is refused the same way on a body, a `samples` path and a `provider` path, and a provider only ever sees whole milliseconds.
const T0 = Date.parse("2026-01-02T00:00:00Z");
const DAY = 86_400_000;

function sceneWithPaths(seen: number[]): Scene {
  const scene = new Scene().addBody(earth).addBody(moon);
  scene.addTrajectory({ id: "sampled", center: "earth", samples: [0, 1, 2].map((d) => ({ time: T0 + d * DAY, positionKm: [400_000 + d, 0, 0] })) });
  scene.addTrajectory({
    id: "provided",
    center: "earth",
    bounds: { start: T0, end: T0 + 2 * DAY },
    provider: { stateAt: (timeUtcMs: number, center?: string) => { seen.push(timeUtcMs); return { body: "provided", center: center ?? "earth", timeUtcMs, plane: "EQJ", positionKm: new Float64Array([400_000, 0, 0]), orientation: null } as never; } },
  });
  return scene;
}

describe("a fractional time (I-177)", () => {
  it.each([
    ["a body", "moon"],
    ["a samples path", "sampled"],
    ["a provider path", "provided"],
  ])("on %s throws a plain RangeError and reaches no provider", (_kind, id) => {
    const seen: number[] = [];
    const scene = sceneWithPaths(seen);
    seen.length = 0;
    let thrown: unknown;
    try { scene.stateOf(id, T0 + DAY + 0.5); } catch (error) { thrown = error; }
    expect(thrown).toBeInstanceOf(RangeError);
    expect(thrown).not.toBeInstanceOf(SceneError);
    expect(seen).toEqual([]);
  });

  it("a whole-millisecond time still reaches the provider unchanged", () => {
    const seen: number[] = [];
    const scene = sceneWithPaths(seen);
    seen.length = 0;
    scene.stateOf("provided", T0 + DAY + 1);
    expect(seen).toEqual([T0 + DAY + 1]);
    expect(seen.every(Number.isInteger)).toBe(true);
  });
});
