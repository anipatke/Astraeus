// The marker rule on every body the engine catalogues (True scale), moved from the site's demo rules (O-038 T-146, O-059 T-272): each has a drawn size, a marker far off and a sphere close up.
// The rule itself is pinned in tests/bodyMarkers.test.ts; which bodies each demo mounts is read from the demo's scene in the demo's own tests.
import { describe, expect, it } from "vitest";
import { drawnRadii, drawsAsMarker, projectedRadiusPx } from "../src/app/bodyDraw";
import { catalogue } from "../src/assets/catalogue";
import { trueScale } from "../src/core/scalePolicy";

const FOV = 45;
const HEIGHT = 800;

describe("the marker rule on every catalogued body (True scale)", () => {
  it.each(catalogue.ids().map((id) => [id] as const))("%s: it has a drawn size, a marker far off and a sphere close up", (id) => {
    const radius = drawnRadii(catalogue.get(id).definition, trueScale).equatorial;
    expect(radius, id).toBeGreaterThan(0);
    expect(Number.isFinite(radius), id).toBe(true);
    expect(drawsAsMarker(projectedRadiusPx(radius, radius * 1e9, FOV, HEIGHT)), `${id} far away`).toBe(true);
    expect(drawsAsMarker(projectedRadiusPx(radius, radius * 3, FOV, HEIGHT)), `${id} close up`).toBe(false);
  });
});
