import { describe, expect, it } from "vitest";
import { groupsOf } from "astraeus/app/experienceDefinition";
import { FloatingOrigin } from "astraeus/app/floatingOrigin";
import { PointsView } from "astraeus/app/PointsView";
import { eqjToRenderVector } from "astraeus/app/renderCoordinates";
import { createOrbAstronomyAdapter } from "astraeus/core/astronomyAdapter";
import { trueScale, type ScalePolicy } from "astraeus/core/scalePolicy";
import { buildShowerDefinition } from "../src/experiences/showers/showerDefinition";
import { parseShowerSettings } from "../src/experiences/showers/showerSettings";
import geminidsFile from "../data/showers/geminids.json";
import { readShippedOrbits } from "./helpers/measuredOrbits";
import { placementAbout } from "astraeus/tests/scenePlacement";

// T-075, owner's look 2026-10-17: "where the Geminids orbit the Sun, it appears to pulse back and forth". The straight-line blend of two
// 72-hour fills cuts the corner of a tight perihelion arc, so a dot near the Sun is drawn inward at mid-interval and snaps back at the
// next fill. Measured here on the shipped Geminids at blend factor 0.5: the fills-plus-blend path against the shader path.

const HOUR = 3_600_000;
const AU_KM = 149_597_870.7;
const placement = placementAbout("sun", createOrbAstronomyAdapter());
/** Scales exactly but does not say so, so the group keeps the fills-plus-blend path. */
const blended: ScalePolicy = { id: "true-scale", mapPosition: (p) => trueScale.mapPosition(p), mapRadius: (r) => trueScale.mapRadius(r) };
const FOCAL_PX = 900 / 2 / Math.tan((22.5 * Math.PI) / 180);

describe("Geminids members near the Sun, half way between two fills", () => {
  it("are drawn on their orbits by the shader and cut the corner under the blend", () => {
    const settings = parseShowerSettings(geminidsFile);
    const layer = groupsOf(buildShowerDefinition(settings, { kind: "loaded", orbits: readShippedOrbits("geminids", 4) }, "all"))[0];
    const { group } = layer;
    const exact = new Float64Array(3 * group.count);
    const origin = new FloatingOrigin();
    const worst = { blend: 0, shader: 0, near: 0 };
    let extentKm = 0;
    const peak = Date.parse(settings.activity.peakUtc);
    for (const days of [-60, -20, 0, 25, 70]) {
      const t0 = peak + days * 24 * HOUR;
      const mid = t0 + 36 * HOUR;
      const views = { blend: new PointsView({ ...layer, refillAfterMs: 72 * HOUR, refillSliceMs: 0 }), shader: new PointsView({ ...layer, refillSliceMs: 0 }) };
      for (const [name, view] of Object.entries(views) as ["blend" | "shader", PointsView][]) {
        const policy = name === "blend" ? blended : trueScale;
        view.sync(t0, placement, policy);
        view.sync(mid, placement, policy);
        view.place(origin);
        expect(view.placedByShader).toBe(name === "shader");
      }
      group.fillPositionsKm(mid, exact);
      extentKm = Math.max(extentKm, views.shader.extentUnits(trueScale) / trueScale.linearUnitsPerKm!);
      for (let i = 0; i < group.count; i++) {
        if (Math.hypot(exact[3 * i], exact[3 * i + 1], exact[3 * i + 2]) > 0.3 * AU_KM) continue;
        worst.near += 1;
        const truth = eqjToRenderVector([exact[3 * i], exact[3 * i + 1], exact[3 * i + 2]].map((v) => v * trueScale.linearUnitsPerKm!));
        for (const name of ["blend", "shader"] as const) {
          const drawn = views[name].memberLocalPosition(i);
          worst[name] = Math.max(worst[name], Math.hypot(drawn[0] - truth[0], drawn[1] - truth[1], drawn[2] - truth[2]) / trueScale.linearUnitsPerKm!);
        }
      }
    }
    // The default view frames the group at 2.5 times its extent (GROUP_FRAMING) from the focus point.
    const pxPerKm = FOCAL_PX / (2.5 * extentKm);
    console.info("near-Sun members checked", worst.near, "blend km", worst.blend.toFixed(0), "px", (worst.blend * pxPerKm).toFixed(2), "shader km", worst.shader.toFixed(0), "px", (worst.shader * pxPerKm).toFixed(4));
    expect(worst.near).toBeGreaterThan(100);
    expect(worst.shader * pxPerKm).toBeLessThan(0.02);
    expect(worst.blend).toBeGreaterThan(100 * worst.shader);
  }, 120_000);
});
