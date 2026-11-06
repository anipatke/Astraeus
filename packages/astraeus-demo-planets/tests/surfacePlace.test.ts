import { describe, expect, it } from "vitest";
import europaMap from "astraeus-data/bodies/europa/map.json";
import titanMap from "astraeus-data/bodies/titan/map.json";
import tritonMap from "astraeus-data/bodies/triton/map.json";
import { isSurfacePlace, shownLongitude } from "../src/experiences/planets/surfacePlace.mjs";

// The conversion half of the map-orientation tests (O-039 T-131, T-139), which moved to the engine's tests/mapOrientation.test.ts with the map and marker frames:
// where a place is drawn is the stored longitude, or 180 - west when the body's map record says the stored values are west longitudes.
describe("the planet places rule (surfacePlace)", () => {
  it("converts 180 - west for Titan and Europa and leaves records that do not say so as stored", () => {
    expect(shownLongitude(100, titanMap.coordinates)).toBe(80);
    expect(shownLongitude(16, titanMap.coordinates)).toBe(164);
    expect(shownLongitude(147, europaMap.coordinates)).toBe(33);
    expect(shownLongitude(25, tritonMap.coordinates)).toBe(25);
    expect(shownLongitude(25, undefined)).toBe(25);
  });

  it("takes a place with a position and no ring or inner-moon fields as a surface place", () => {
    expect(isSurfacePlace({ latitude: 1, longitude: 2 })).toBe(true);
    expect(isSurfacePlace({ latitude: 1, longitude: 2, ringRadius: 3 })).toBe(false);
    expect(isSurfacePlace({ latitude: 1, longitude: 2, moonRadius: 3 })).toBe(false);
    expect(isSurfacePlace({})).toBe(false);
  });
});
