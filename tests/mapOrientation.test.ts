import { describe, expect, it } from "vitest";
import { Object3D, Vector3 } from "three";
import { applyOrientation } from "../src/app/sceneLayout";
import { latLonToXYZ } from "../src/app/FeatureMarkers";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import { catalogue } from "../src/assets/catalogue";
import { IAPETUS_VISUAL } from "../src/assets/bodies/planetSystemMaps";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createStateResolver } from "../src/core/stateResolver";
import features from "../data/bodies/iapetus/features.json";

// O-039 T-130 (time inside the fit window the test setup loads, 2016-02-10 to 2016-12-30): Iapetus is tidally locked, so its dark Cassini Regio hemisphere leads in its orbit about Saturn. The drawn map's dark
// centre (marker frame, longitude about +87 east) must therefore point along Iapetus's velocity once the body's rotation and the
// visual's yaw are applied the way the scene applies them (applyOrientation). Mesh +X is map longitude 0 (DONOR_PROVENANCE.md).
const resolver = createStateResolver(catalogue.definitions(), catalogue.sources(), createOrbAstronomyAdapter());
const T = Date.parse("2016-06-01T00:00:00Z");

function angleDeg(a: Vector3, b: Vector3): number {
  return (a.angleTo(b) * 180) / Math.PI;
}

function renderedDirection(yaw: number, latDeg: number, markerLonDeg: number): Vector3 {
  const mesh = new Object3D();
  applyOrientation(mesh, resolver.stateOf("iapetus", T, "saturn"), yaw);
  return new Vector3(...latLonToXYZ(latDeg, markerLonDeg, 1)).applyQuaternion(mesh.quaternion);
}

function orbitVelocityRender(): Vector3 {
  const before = resolver.stateOf("iapetus", T - 60_000, "saturn").positionKm;
  const after = resolver.stateOf("iapetus", T + 60_000, "saturn").positionKm;
  return new Vector3(...eqjToRenderVector([after[0] - before[0], after[1] - before[1], after[2] - before[2]])).normalize();
}

/** Looked up 2026-10-22 from the USGS Gazetteer of Planetary Nomenclature (planetarynames.wr.usgs.gov, target 76_Iapetus): planetographic, +West, 0-360. */
const GAZETTEER_WEST = { "Cassini Regio": { id: 1047, lat: -28.1, west: 92.6 }, Engelier: { id: 14463, lat: -40.5, west: 264.7 } } as const;

describe("Iapetus map orientation", () => {
  it("uses yaw PI for Iapetus", () => {
    expect(IAPETUS_VISUAL.textureYawRad).toBe(Math.PI);
  });

  it("points the drawn dark centre along the orbital velocity with yaw PI, and backwards with yaw 0", () => {
    const velocity = orbitVelocityRender();
    const darkCentreMarkerLon = 180 - GAZETTEER_WEST["Cassini Regio"].west; // 87.4 east in the marker frame, as features.json stores it
    const withYaw = angleDeg(renderedDirection(IAPETUS_VISUAL.textureYawRad ?? 0, 0, darkCentreMarkerLon), velocity);
    const withoutYaw = angleDeg(renderedDirection(0, 0, darkCentreMarkerLon), velocity);
    expect(withYaw).toBeLessThan(20);
    expect(withoutYaw).toBeGreaterThan(160);
  });

  it("puts two gazetteer features on the map column the marker frame expects", () => {
    const yaw = IAPETUS_VISUAL.textureYawRad ?? 0;
    const width = IAPETUS_VISUAL.texture!.widthPx;
    const column = (markerLonDeg: number): number => (((0.5 + markerLonDeg / 360) % 1) + 1) % 1 * width;
    const stored = (name: string): number => features.features.find((f) => f.name === name)!.longitude;
    for (const [name, { west }] of Object.entries(GAZETTEER_WEST)) {
      // True east longitude is -west; the drawn pixel that lands there is the yaw undone: marker longitude = east - yaw.
      const pixelMarkerLon = -west - (yaw * 180) / Math.PI;
      const expected = column(pixelMarkerLon);
      const actual = column(stored(name));
      const diff = Math.min(Math.abs(expected - actual), width - Math.abs(expected - actual));
      expect(diff, name).toBeLessThan(width * 3 / 360);
    }
  });
});
