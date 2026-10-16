import { describe, expect, it, vi } from "vitest";
import { baseGlowOf, DEFAULT_GLOW_SCALE, drawnRadii, GLOW_LIMITS, glowLookFromSearch, glowSizePx, pxToUnits, projectedRadiusPx } from "../src/app/bodyDraw";
import { focusLimits, focusRadius } from "../src/app/sceneFraming";
import { createSolarSystemScale } from "../src/core/scalePolicy";
import { textureRightsProblem } from "../src/assets/licence";
import { catalogue } from "../src/assets/catalogue";
import { SUN_VISUAL } from "../src/assets/bodies/sun";
import { trueScale } from "../src/core/scalePolicy";

const sun = catalogue.get("sun");
const EARTH_RADIUS_KM = catalogue.get("earth").definition.radiusKm;

describe("the Sun's visual asset", () => {
  it("is an emissive sphere at the true nominal solar radius, 695,700 km (IAU 2015 B3), with a halo", () => {
    expect(sun.definition.radiusKm).toBe(695_700);
    expect(sun.definition.accuracy.dimensions.sources.join(" ")).toMatch(/IAU 2015 Resolution B3/);
    expect(SUN_VISUAL.emissive).toBe(true);
    expect(SUN_VISUAL.glow).toEqual({ sizePx: 72, brightness: 1 });
    expect(SUN_VISUAL.texture?.licence?.licence).toBe("CC BY 4.0");
    expect(SUN_VISUAL.texture?.licence?.url).toBe("https://www.solarsystemscope.com/textures/");
    expect(SUN_VISUAL.texture?.widthPx).toBe(2048);
    expect(textureRightsProblem(SUN_VISUAL.texture!)).toBeNull();
    expect(sun.definition.accuracy.orientationLimitations?.join(" ")).toMatch(/stand-in at a fixed orientation/);
    expect(drawnRadii(sun.definition, trueScale).equatorial).toBeCloseTo(695_700 / EARTH_RADIUS_KM, 9);
    expect(sun.visual.marker?.sizePx).toBe(9);
  });

  it("is the only catalogued body with a halo or an emissive sphere", () => {
    const lit = catalogue.ids().filter((id) => catalogue.get(id).visual.glow !== undefined || catalogue.get(id).visual.emissive === true);
    expect(lit).toEqual(["sun"]);
  });
});

describe("the halo settings", () => {
  const base = { sizePx: 72, brightness: 1, scale: DEFAULT_GLOW_SCALE };

  it("start from the record's halo and are read from the address", () => {
    expect(baseGlowOf([sun])).toEqual(base);
    expect(baseGlowOf([catalogue.get("earth")])).toBeNull();
    expect(glowLookFromSearch("", base)).toEqual(base);
    expect(glowLookFromSearch("?sunglow=120&sunbrightness=0.5", base)).toEqual({ sizePx: 120, brightness: 0.5, scale: 2.5 });
    expect(glowLookFromSearch("?sunglow=0&sunbrightness=2", base)).toEqual({ sizePx: 0, brightness: 2, scale: 2.5 });
  });

  it("keep the default, with a console warning, for an unusable value", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    for (const search of ["?sunglow=big", "?sunglow=-1", `?sunglow=${GLOW_LIMITS.sizePx.max + 1}`, "?sunglow=", "?sunbrightness=3", "?sunbrightness=NaN", "?sunglowscale=0.5", "?sunglowscale=7"]) {
      expect(glowLookFromSearch(search, base)).toEqual(base);
    }
    expect(warn).toHaveBeenCalledTimes(8);
    warn.mockRestore();
  });

  it("read the halo's reach from the address and default it to 2.5 times the disc", () => {
    expect(glowLookFromSearch("?sunglowscale=4", base).scale).toBe(4);
    expect(baseGlowOf([sun])?.scale).toBe(2.5);
    expect(GLOW_LIMITS.scale).toEqual({ min: 1, max: 6 });
  });

  it("size the halo as the larger of the setting and the reach times the disc's projected diameter", () => {
    expect(glowSizePx(base, 4)).toBe(72); // far away: the setting
    expect(glowSizePx(base, 100)).toBe(250); // 2.5 x 100 px
    expect(glowSizePx({ ...base, scale: 4 }, 100)).toBe(400);
    expect(glowSizePx(base, Number.POSITIVE_INFINITY)).toBe(72);
    const fov = 45;
    const height = 800;
    const radius = drawnRadii(sun.definition, trueScale).equatorial;
    const nearest = radius * 1.15;
    const diameterPx = 2 * projectedRadiusPx(radius, nearest, fov, height);
    expect(diameterPx).toBeGreaterThan(1500); // at the closest allowed zoom the disc fills the view
    expect(glowSizePx(base, diameterPx)).toBeGreaterThan(2.5 * diameterPx - 1e-9);
    expect(pxToUnits(height, nearest, fov, height)).toBeCloseTo(2 * nearest * Math.tan((fov * Math.PI) / 360), 12);
  });
});

describe("the zoom minimum of an emissive body", () => {
  const frame = { centre: "sun", span: 50 };
  it("keeps the camera outside the Sun's drawn sphere: 1.15 radii as the scene's centre, 1.6 otherwise", () => {
    const radius = 695_700 / EARTH_RADIUS_KM;
    expect(focusRadius("sun", trueScale)).toBeCloseTo(radius, 9);
    expect(focusLimits("sun", frame, trueScale, {}).min).toBeCloseTo(1.15 * radius, 9);
    expect(focusLimits("sun", { centre: "earth", span: 50 }, trueScale, {}).min).toBeCloseTo(1.6 * radius, 9);
    expect(1.15 * 695_700).toBeCloseTo(800_055, 0); // km from the Sun's centre
  });

  it("follows the policy, and leaves a plain marker and a tracked point at the point minimum", () => {
    const solar = createSolarSystemScale({ exaggeration: {}, defaultExaggeration: 1 });
    expect(focusLimits("sun", frame, solar, {}).min).toBeGreaterThan(0.002);
    expect(focusRadius("swift-tuttle", trueScale)).toBe(0);
    expect(focusLimits("swift-tuttle", frame, trueScale, {}).min).toBe(0.002);
    expect(focusLimits("some-tracked-body", frame, trueScale, {}).min).toBe(0.002);
  });
});
