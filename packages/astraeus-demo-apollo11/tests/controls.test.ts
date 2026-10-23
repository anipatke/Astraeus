import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScaleControl } from "astraeus/shell/ScaleControl";
import type { ExperienceConfig } from "astraeus/shell/experience";
import { listedObjects, relatedObjects } from "astraeus/shell/objectModel";
import { SCALE_CHOICES, scaleChoicesFor, scalePolicyFor, startScaleFor } from "astraeus/shell/scaleModel";
import { createOrbAstronomyAdapter } from "astraeus/core/astronomyAdapter";
import { EARTH, MOON } from "astraeus/core/body";
import { MoonTrajectory } from "astraeus/core/moonTrajectory";
import { earthStateAt, sunPositionFromEarthAt } from "astraeus/core/referenceCenters";
import { createSolarSystemScale, readableScale, trueScale, type ScalePolicy } from "astraeus/core/scalePolicy";
import { buildDebugReadout, overlayRows, type DebugReadout } from "astraeus/app/DebugOverlay";
import { FloatingOrigin } from "astraeus/app/floatingOrigin";
import { pathNeedsRefresh } from "astraeus/app/pathRules";
import { SIDEREAL_MONTH_MS } from "astraeus/assets/compositions";
import { bodyAbsolutes } from "astraeus/app/sceneLayout";

const adapter = createOrbAstronomyAdapter();
const trajectory = new MoonTrajectory(adapter);
const T = Date.UTC(2026, 3, 1, 12, 0, 0);

function readoutFor(timeUtcMs: number, policy: ScalePolicy, origin = new FloatingOrigin(), rate = 1): DebugReadout {
  const earth = earthStateAt(adapter, timeUtcMs);
  const moonFromEarth = trajectory.stateAt(timeUtcMs, "earth");
  const placed = bodyAbsolutes(moonFromEarth, policy);
  const renderedDistanceUnits = Math.hypot(
    placed.moonAbsolute[0] - placed.earthAbsolute[0],
    placed.moonAbsolute[1] - placed.earthAbsolute[1],
    placed.moonAbsolute[2] - placed.earthAbsolute[2],
  );
  return buildDebugReadout({
    timeUtcMs, rate, policy, earth, moonFromEarth,
    sunFromEarth: sunPositionFromEarthAt(adapter, timeUtcMs),
    placed, renderedDistanceUnits, origin,
  });
}

describe("debug readout", () => {
  it("keeps scientific values identical across scale policies at the same timestamp", () => {
    const a = readoutFor(T, readableScale);
    const b = readoutFor(T, trueScale);
    const { policyId: _pa, renderedDistanceUnits: _ra, earthLocal: _ea, moonLocal: _ma, ...sciA } = a;
    const { policyId: _pb, renderedDistanceUnits: _rb, earthLocal: _eb, moonLocal: _mb, ...sciB } = b;
    expect(sciA).toEqual(sciB);
    expect(a.policyId).not.toBe(b.policyId);
    expect(a.renderedDistanceUnits).toBeCloseTo(b.renderedDistanceUnits * 0.1, 9);
  });

  it("does not depend on the rate or on a rate change", () => {
    const { rate: _r1, ...slow } = readoutFor(T, readableScale, undefined, 1);
    const { rate: _r2, ...fast } = readoutFor(T, readableScale, undefined, 604_800);
    expect(slow).toEqual(fast);
  });

  it("reports rendered distance equal to the scene mapping and the physical distance in km", () => {
    for (const policy of [readableScale, trueScale]) {
      const r = readoutFor(T, policy);
      const moonKm = trajectory.stateAt(T, "earth").positionKm;
      const mapped = policy.mapPosition(moonKm);
      expect(r.renderedDistanceUnits).toBeCloseTo(Math.hypot(mapped[0], mapped[1], mapped[2]), 9);
      expect(r.moonDistanceKm).toBeCloseTo(Math.hypot(moonKm[0], moonKm[1], moonKm[2]), 9);
    }
  });

  it("labels the Moon position with frame, centre and units", () => {
    const r = readoutFor(T, trueScale);
    expect(r.moonPosition).toMatchObject({ frame: "EQJ", center: "earth", units: "km" });
  });

  it("separates scaled origin from local render coordinates", () => {
    const origin = new FloatingOrigin();
    const base = readoutFor(T, trueScale, origin);
    origin.set([base.moonLocal[0] + 5, 1, -2]);
    const moved = readoutFor(T, trueScale, origin);
    expect(moved.scaledOrigin).toEqual([base.moonLocal[0] + 5, 1, -2]);
    expect(moved.moonLocal[0]).toBeCloseTo(base.moonLocal[0] - (base.moonLocal[0] + 5), 9);
    expect(moved.moonDistanceKm).toBe(base.moonDistanceKm);
    expect(moved.renderedDistanceUnits).toBeCloseTo(base.renderedDistanceUnits, 9);
  });

  it("shows plausible physical values: unit Sun directions, bounded illumination, orientation quaternions", () => {
    const r = readoutFor(T, readableScale);
    expect(Math.hypot(...r.earthSunDirection)).toBeCloseTo(1, 12);
    expect(Math.hypot(...r.moonSunDirection)).toBeCloseTo(1, 12);
    expect(r.lunarIlluminatedFraction).toBeGreaterThanOrEqual(0);
    expect(r.lunarIlluminatedFraction).toBeLessThanOrEqual(1);
    expect(Math.hypot(...r.earthOrientation!)).toBeCloseTo(1, 12);
    expect(Math.hypot(...r.moonOrientation!)).toBeCloseTo(1, 12);
    expect(MOON.radiusKm / EARTH.radiusKm).toBeCloseTo(readableScale.mapRadius(MOON.radiusKm), 12);
    expect(trueScale.mapRadius(MOON.radiusKm)).toBe(readableScale.mapRadius(MOON.radiusKm));
  });

  it("overlay rows list every required item", () => {
    const labels = overlayRows(readoutFor(T, readableScale)).map(([label]) => label);
    for (const wanted of ["UTC time", "Playback rate", "Scale policy", "Earth–Moon distance", "Rendered distance", "Moon position",
      "Earth orientation", "Moon orientation", "Sun direction (from Earth)", "Moon lit (geometric)", "Scaled origin", "Moon local"]) {
      expect(labels).toContain(wanted);
    }
  });
});

describe("path refresh after seeking", () => {
  it("rebuilds the path when a seek leaves the sampled window and not for tiny moves", () => {
    expect(pathNeedsRefresh(T, SIDEREAL_MONTH_MS, T + 1000, 0, 0)).toBe(false);
    expect(pathNeedsRefresh(T, SIDEREAL_MONTH_MS, T - 20 * 86_400_000, 0, 0)).toBe(true);
    expect(pathNeedsRefresh(T, SIDEREAL_MONTH_MS, T + 20 * 86_400_000, 0, 0)).toBe(true);
  });

  it("a scrub within the sampled window rebuilds once drift exceeds the threshold", () => {
    expect(pathNeedsRefresh(T, SIDEREAL_MONTH_MS, T + 2 * 3_600_000, 1000, 0)).toBe(true);
    expect(pathNeedsRefresh(T, SIDEREAL_MONTH_MS, T + 2 * 3_600_000, 100, 0)).toBe(false);
  });
});

describe("scale choices", () => {
  const render = (ids: readonly string[] | undefined, scaleId: string) => renderToStaticMarkup(createElement(ScaleControl, {
    scaleId, onScaleChange: () => undefined, choices: ids === undefined ? undefined : scaleChoicesFor(ids),
  }));

  it("yields today's two choices and wording for the two existing ids", () => {
    expect(scaleChoicesFor(["true-scale", "readable-scale"])).toEqual(SCALE_CHOICES);
  });

  it("adds a third choice with its explanation, and rejects an unknown id", () => {
    const three = scaleChoicesFor(["true-scale", "readable-scale", "solar-system"]);
    expect(three.map((choice) => choice.label)).toEqual(["True", "Readable", "Solar system"]);
    expect(three[2].explanation).toMatch(/Distances are true/);
    expect(() => scaleChoicesFor(["nope"])).toThrow(RangeError);
  });

  it("renders a menu for three choices, a toggle for two and a held button for one", () => {
    const three = render(["true-scale", "readable-scale", "solar-system"], "solar-system");
    expect(three).toContain('aria-haspopup="menu"');
    expect(three).toContain('aria-label="Scale: Solar system, choose another"');
    expect(three.match(/role="menuitemradio"/g)).toHaveLength(3);
    expect(three).toContain('data-scale-options="true-scale,readable-scale,solar-system"');
    const two = render(undefined, "true-scale");
    expect(two).not.toContain("menuitemradio");
    expect(two).toContain('aria-label="Scale: True. Switch to Readable"');
    expect(two).toContain('data-scale="true-scale"');
    expect(three).toContain('aria-label="About the scales"');
    expect(two).toContain('aria-label="About the scales"');
    expect(two).toContain("Distances and sizes are in real proportion");
    expect(two).toContain("Pulls bodies much closer together");
    const one = render(["true-scale"], "true-scale");
    expect(one).toBe("");
  });

  it("falls back to the first offered scale when an address names one that is not offered", () => {
    expect(startScaleFor("readable-scale", ["true-scale"])).toBe("true-scale");
    expect(startScaleFor(undefined, ["true-scale"])).toBe("true-scale");
    expect(startScaleFor("readable-scale", ["true-scale", "readable-scale"])).toBe("readable-scale");
    expect(startScaleFor("readable-scale", undefined)).toBe("readable-scale");
    expect(startScaleFor("nope", undefined)).toBe("true-scale");
  });

  it("selects a supplied policy by id and otherwise keeps the existing mapping", () => {
    const solar = createSolarSystemScale({ exaggeration: {}, defaultExaggeration: 3 });
    expect(scalePolicyFor("solar-system", [solar])).toBe(solar);
    expect(scalePolicyFor("readable-scale", [solar])).toBe(readableScale);
    expect(scalePolicyFor("true-scale")).toBe(trueScale);
  });
});

describe("Object list", () => {
  const object = (id: string, extra: object = {}) => ({ id, label: id, ...extra });
  const config = { objects: [object("body"), object("body-orbit", { listed: false, partOf: "body" }), object("other")] } as unknown as ExperienceConfig;

  it("leaves unlisted objects out, keeps the selected one, and finds an object's related unlisted ones", () => {
    expect(listedObjects(config, "other").map((o) => o.id)).toEqual(["body", "other"]);
    expect(listedObjects(config, "body-orbit").map((o) => o.id)).toEqual(["body", "body-orbit", "other"]);
    expect(relatedObjects(config, "body").map((o) => o.id)).toEqual(["body-orbit"]);
    expect(relatedObjects(config, "other")).toEqual([]);
  });
});
