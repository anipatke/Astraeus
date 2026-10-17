import { describe, expect, it } from "vitest";
import { exists, readJson, readText, runImporter, scratchDir } from "../tools/import/test-io.mjs";

// The Planetary Explorer body packages (O-018, T-077). Packages are data, never engine code (ARCH-01).
// The donor checks run when the owner's checkout is present and are skipped otherwise.
const DONOR = "/home/user/code/planetary-explorer";
const HAS_DONOR = exists(`${DONOR}/data/body-overviews.json`);
const PACKAGES = new URL("../data/bodies/", import.meta.url).pathname;
const IMPORTER = new URL("../tools/import/planetary-explorer.mjs", import.meta.url).pathname;

interface Feature { readonly id: string; readonly latitude?: number; readonly longitude?: number; readonly [key: string]: unknown }
interface Catalogue { readonly bodyCount: number; readonly featureCount: number; readonly bodies: readonly { readonly body: string; readonly featureCount: number }[] }
interface Coordinates {
  readonly phiOffsetDeg: number; readonly thetaOffsetDeg: number; readonly textureRecentringDeg: number;
  readonly longitudeRange: { readonly min: number; readonly max: number } | null;
}

const read = <T>(path: string): T => readJson(path) as T;
const catalogue = read<Catalogue>(`${PACKAGES}catalogue.json`);
const bodyIds = catalogue.bodies.map((b) => b.body);
const featuresOf = (body: string): Feature[] => read<{ features: Feature[] }>(`${PACKAGES}${body}/features.json`).features;
const donorFeaturesFile = (body: string): string => `${DONOR}/data/${body === "moon" ? "hotspots" : `${body}-features`}.json`;

/** The donor's latLonToXYZ, copied verbatim from planetary-explorer src/entities/hotspot.ts (84f8d3e). */
function donorLatLonToXYZ(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 90) * (Math.PI / 180);
  return [radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.cos(theta)];
}

/** Placement by the convention a package records in map.json (phi = phiOffsetDeg - lat, theta = lon + thetaOffsetDeg). */
function placeByPackage(c: Coordinates, lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (c.phiOffsetDeg - lat) * (Math.PI / 180);
  const theta = (lon + c.thetaOffsetDeg) * (Math.PI / 180);
  return [radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.cos(theta)];
}

describe("committed body packages", () => {
  it("catalogue lists 24 bodies and 403 tagged locations, each package complete", () => {
    expect(catalogue.bodyCount).toBe(24);
    expect(catalogue.featureCount).toBe(403);
    expect(new Set(bodyIds).size).toBe(24);
    let total = 0;
    for (const entry of catalogue.bodies) {
      const features = featuresOf(entry.body);
      expect(features).toHaveLength(entry.featureCount);
      total += features.length;
      const map = read<{ source: { recordedBy: string }; textures: { sha256: string; width: number; height: number }[]; coordinates: Coordinates }>(`${PACKAGES}${entry.body}/map.json`);
      expect(map.source.recordedBy).toBeTruthy();
      expect(map.textures.length).toBeGreaterThan(0);
      for (const t of map.textures) { expect(t.sha256).toMatch(/^[0-9a-f]{64}$/); expect(t.width).toBeGreaterThan(0); expect(t.height).toBeGreaterThan(0); }
      expect(read<{ categories: unknown[] }>(`${PACKAGES}${entry.body}/categories.json`).categories.length).toBeGreaterThan(0);
      expect(read<{ overview: { sources: unknown[] } }>(`${PACKAGES}${entry.body}/overview.json`).overview.sources.length).toBeGreaterThan(0);
    }
    expect(total).toBe(403);
  });

  it("records the longitude range of every body and the 180 degree re-centring of Ganymede", () => {
    const ganymede = read<{ coordinates: Coordinates }>(`${PACKAGES}ganymede/map.json`).coordinates;
    expect(ganymede.textureRecentringDeg).toBe(180);
    expect(ganymede.longitudeRange).not.toBeNull();
  });
});

describe.skipIf(!HAS_DONOR)("exact preservation against the donor", () => {
  it("covers the same 24 bodies as the donor overviews", () => {
    const donorBodies = read<{ bodyId: string }[]>(`${DONOR}/data/body-overviews.json`).map((o) => o.bodyId);
    expect([...bodyIds].sort()).toEqual([...donorBodies].sort());
  });

  it("every feature of every body is bit-for-bit the donor's", () => {
    let checked = 0;
    for (const body of bodyIds) {
      const donor = read<Feature[]>(donorFeaturesFile(body));
      const packaged = featuresOf(body);
      expect(packaged.map((f) => f.id)).toEqual(donor.map((f) => f.id));
      donor.forEach((d, i) => {
        const p = packaged[i];
        expect(Object.is(p.latitude, d.latitude), `${body}/${d.id} latitude`).toBe(true);
        expect(Object.is(p.longitude, d.longitude), `${body}/${d.id} longitude`).toBe(true);
        for (const key of ["name", "category", "tags", "description", "details"]) expect(p[key], `${body}/${d.id} ${key}`).toStrictEqual(d[key]);
        expect(p, `${body}/${d.id}`).toStrictEqual(d);
        checked += 1;
      });
    }
    expect(checked).toBe(403);
  });

  it("overviews and category lists are the donor's", () => {
    const donorOverviews = read<{ bodyId: string }[]>(`${DONOR}/data/body-overviews.json`);
    for (const body of bodyIds) {
      expect(read<{ overview: unknown }>(`${PACKAGES}${body}/overview.json`).overview).toStrictEqual(donorOverviews.find((o) => o.bodyId === body));
    }
  });

  it("running the importer again on the unchanged donor writes identical files", () => {
    const out = scratchDir();
    runImporter(IMPORTER, out);
    for (const body of bodyIds) {
      for (const file of ["features", "categories", "overview", "map"]) {
        expect(readText(`${out}/${body}/${file}.json`)).toBe(readText(`${PACKAGES}${body}/${file}.json`));
      }
    }
    expect(readText(`${out}/catalogue.json`)).toBe(readText(`${PACKAGES}catalogue.json`));
  }, 60000);
});

describe("coordinate convention", () => {
  const sample = (body: string) => featuresOf(body).filter((f) => typeof f.latitude === "number" && typeof f.longitude === "number").slice(0, 6);

  it("the package convention places features exactly where the donor's latLonToXYZ does, including the re-centred Ganymede map", () => {
    for (const body of ["moon", "ganymede", "tethys", "triton", "europa", "earth"]) {
      const { coordinates } = read<{ coordinates: Coordinates }>(`${PACKAGES}${body}/map.json`);
      expect(sample(body).length).toBeGreaterThan(0);
      for (const f of sample(body)) {
        const a = placeByPackage(coordinates, f.latitude as number, f.longitude as number, 1);
        const b = donorLatLonToXYZ(f.latitude as number, f.longitude as number, 1);
        expect(a.map((v, i) => Object.is(v, b[i])), `${body}/${f.id}`).toEqual([true, true, true]);
      }
    }
    // The 180 degree re-centring is a property of the map picture; stored longitudes are already in the marker frame, so it is never added again.
    expect(read<{ coordinates: Coordinates }>(`${PACKAGES}ganymede/map.json`).coordinates.textureRecentringDeg).toBe(180);
  });

  it.skipIf(!HAS_DONOR)("the verbatim copy equals the donor's own function", async () => {
    const donor = (await import(/* @vite-ignore */ `${DONOR}/src/entities/hotspot.ts`)) as { latLonToXYZ: typeof donorLatLonToXYZ };
    for (let lat = -90; lat <= 90; lat += 7.5) for (let lon = -180; lon <= 360; lon += 17.25) {
      expect(donorLatLonToXYZ(lat, lon, 1.3)).toEqual(donor.latLonToXYZ(lat, lon, 1.3));
    }
  });
});
