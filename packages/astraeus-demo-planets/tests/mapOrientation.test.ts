import { describe, expect, it } from "vitest";
import { Object3D, Vector3 } from "three";
import { applyOrientation } from "astraeus/app/sceneLayout";
import { latLonToXYZ } from "astraeus/app/FeatureMarkers";
import { eqjToRenderVector } from "astraeus/app/renderCoordinates";
import { catalogue } from "astraeus/assets/catalogue";
import { DIONE_VISUAL, IAPETUS_VISUAL, PLUTO_VISUAL, RHEA_VISUAL, TETHYS_VISUAL, TITAN_VISUAL } from "astraeus/assets/bodies/planetSystemMaps";
import { CALLISTO_VISUAL, EUROPA_VISUAL, GANYMEDE_VISUAL } from "astraeus/assets/bodies/galileanMoons";
import { shownLongitude } from "../src/experiences/planets/surfacePlace.mjs";
import type { BodyVisual } from "astraeus/assets/visual";
import europaMap from "astraeus/data/bodies/europa/map.json";
import titanMap from "astraeus/data/bodies/titan/map.json";
import europaFeatures from "astraeus/data/bodies/europa/features.json";
import titanFeatures from "astraeus/data/bodies/titan/features.json";
import tritonMap from "astraeus/data/bodies/triton/map.json";
import { createOrbAstronomyAdapter } from "astraeus/core/astronomyAdapter";
import { createStateResolver } from "astraeus/core/stateResolver";
import features from "astraeus/data/bodies/iapetus/features.json";
import { readJson } from "astraeus/tools/import/test-io.mjs";

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

// O-039 T-131: the other moon maps. A map whose picture is centred on 180 E turns half a revolution (the audit, docs/evidence/map-audit-20261021/report.md,
// found each by locating known features). Every longitude below was looked up on 2026-10-22 from the USGS Gazetteer of Planetary Nomenclature
// (planetarynames.wr.usgs.gov, search results per target, feature id in brackets), planetographic +West 0-360 unless noted. The drawn picture's pixel for a
// true east longitude E sits at marker longitude E - yaw; the stored marker longitude must name that same column.
interface Place { readonly name: string; readonly west: number; readonly id: string }
const STORED_FEATURES = (body: string): Map<string, number> => new Map(
  (readJson(new URL(`../../astraeus/data/bodies/${body}/features.json`, import.meta.url).pathname) as { features: { name: string; longitude?: number }[] }).features.filter((f) => f.longitude !== undefined).map((f) => [f.name, f.longitude!]),
);

function columnOf(markerLonDeg: number, width: number): number {
  return ((((0.5 + markerLonDeg / 360) % 1) + 1) % 1) * width;
}

function expectPlacesOnTheirTerrain(visual: BodyVisual, shownLon: (name: string, stored: number) => number, body: string, places: readonly Place[], toleranceDeg: number): void {
  const yaw = visual.textureYawRad ?? 0;
  const width = visual.texture!.widthPx;
  const stored = STORED_FEATURES(body);
  for (const { name, west } of places) {
    const expected = columnOf(-west - (yaw * 180) / Math.PI, width);
    const actual = columnOf(shownLon(name, stored.get(name)!), width);
    const diff = Math.min(Math.abs(expected - actual), width - Math.abs(expected - actual));
    expect(diff, `${body} ${name}`).toBeLessThan((width * toleranceDeg) / 360);
  }
}
const asStored = (_name: string, stored: number): number => stored;

describe("T-131: moon maps centred on 180 E turn half a revolution", () => {
  it.each([
    ["Europa", EUROPA_VISUAL], ["Callisto", CALLISTO_VISUAL], ["Pluto", PLUTO_VISUAL], ["Tethys", TETHYS_VISUAL],
    ["Dione", DIONE_VISUAL], ["Rhea", RHEA_VISUAL], ["Titan", TITAN_VISUAL],
  ] as const)("%s uses yaw PI", (_name, visual) => {
    expect(visual.textureYawRad).toBe(Math.PI);
  });

  it("Ganymede needs no turn (its donor picture is already centred on 0 E) and Iapetus keeps its half revolution", () => {
    expect(GANYMEDE_VISUAL.textureYawRad).toBe(0);
    expect(IAPETUS_VISUAL.textureYawRad).toBe(Math.PI);
  });


  it("Callisto: Valhalla [6284] 56.0 W", () => {
    expectPlacesOnTheirTerrain(CALLISTO_VISUAL, asStored, "callisto", [{ name: "Valhalla", west: 56, id: "6284" }], 3);
  });

  it("Ganymede (yaw 0): Tros 27.26 W, Osiris 166.31 W", () => {
    expectPlacesOnTheirTerrain(GANYMEDE_VISUAL, asStored, "ganymede", [{ name: "Tros", west: 27.26, id: "-" }, { name: "Osiris", west: 166.31, id: "-" }], 3);
  });

  it("Pluto: Sputnik Planitia [15669] 178.69 E (the gazetteer gives Pluto +East; as west 181.31)", () => {
    expectPlacesOnTheirTerrain(PLUTO_VISUAL, asStored, "pluto", [{ name: "Sputnik Planitia", west: -178.69, id: "15669" }], 6);
  });

  it("Tethys: Odysseus [4406] 128.89 W, Penelope 249.22 W", () => {
    expectPlacesOnTheirTerrain(TETHYS_VISUAL, asStored, "tethys", [{ name: "Odysseus", west: 128.89, id: "4406" }, { name: "Penelope", west: 249.22, id: "-" }], 3);
  });

  it("Dione: Amata [215] 279.81 W, Dido 18.82 W, Creusa 76.32 W", () => {
    expectPlacesOnTheirTerrain(DIONE_VISUAL, asStored, "dione", [{ name: "Amata", west: 279.81, id: "215" }, { name: "Dido", west: 18.82, id: "-" }, { name: "Creusa", west: 76.32, id: "-" }], 3);
  });

  it("Rhea: Tirawa [6026] 151.7 W, Inktomi 112.1 W", () => {
    expectPlacesOnTheirTerrain(RHEA_VISUAL, asStored, "rhea", [{ name: "Tirawa", west: 151.7, id: "6026" }, { name: "Inktomi", west: 112.1, id: "-" }], 3);
  });
});

describe("T-131: Titan's places are converted from west longitudes as they load", () => {
  const shown = (_name: string, stored: number): number => shownLongitude(stored, titanMap.coordinates);

  it("Xanadu [6958] 100.0 W, Ontario Lacus [7003] 183.0 W and the Huygens landing site 192.335 W land on their terrain", () => {
    // Xanadu and Ontario Lacus: USGS Gazetteer, Titan, planetographic +West. The Huygens landing site is no IAU-named feature (not in the gazetteer);
    // its position is the one on Wikipedia's Huygens (spacecraft) page, 10.573 S 192.335 W, read 2026-10-22; the stored 192.3 is that west value.
    expectPlacesOnTheirTerrain(TITAN_VISUAL, shown, "titan", [
      { name: "Xanadu", west: 100, id: "6958" }, { name: "Ontario Lacus", west: 183, id: "7003" }, { name: "Huygens Landing Site", west: 192.335, id: "-" },
    ], 3);
  });

  it("converts 180 - west for Titan and leaves records that do not say so as stored", () => {
    expect(shown("Xanadu", 100)).toBe(80);
    expect(shown("Sinlap", 16)).toBe(164);
    expect(shownLongitude(25, tritonMap.coordinates)).toBe(25);
    expect(shownLongitude(25, undefined)).toBe(25);
  });

  it("without the conversion Xanadu is 20 degrees off its terrain (the audit's finding) and the data file is untouched", () => {
    const xanadu = titanFeatures.features.find((f) => f.id === "xanadu")!;
    expect(xanadu.longitude).toBe(100);
    expect(() => expectPlacesOnTheirTerrain(TITAN_VISUAL, asStored, "titan", [{ name: "Xanadu", west: 100, id: "6958" }], 3)).toThrow();
  });
});

describe("T-139: Europa's places are converted from west longitudes as they load (I-067)", () => {
  const shown = (_name: string, stored: number): number => shownLongitude(stored, europaMap.coordinates);

  it("Tyre [6170] 146.6 W, Pwyll [4878] 271.4 W, Conamara Chaos [1282] 272.7 W and Thera Macula [5967] 181.2 W land on their terrain", () => {
    // USGS Gazetteer of Planetary Nomenclature (planetarynames.wr.usgs.gov, target Europa, planetographic +West, looked up 2026-10-22).
    expectPlacesOnTheirTerrain(EUROPA_VISUAL, shown, "europa", [
      { name: "Tyre", west: 146.6, id: "6170" }, { name: "Pwyll", west: 271.4, id: "4878" },
      { name: "Conamara Chaos", west: 272.7, id: "1282" }, { name: "Thera Macula", west: 181.2, id: "5967" },
    ], 8);
  });

  it("without the conversion Tyre is about 114 degrees off its terrain and the data file is untouched", () => {
    const tyre = europaFeatures.features.find((f) => f.id === "tyre")!;
    expect(tyre.longitude).toBe(147);
    expect(shown("Tyre", 147)).toBe(33);
    expect(() => expectPlacesOnTheirTerrain(EUROPA_VISUAL, asStored, "europa", [{ name: "Tyre", west: 146.6, id: "6170" }], 8)).toThrow();
  });
});
