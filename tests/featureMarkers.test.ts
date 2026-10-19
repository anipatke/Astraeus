import { Group, PerspectiveCamera, SphereGeometry } from "three";
import { describe, expect, it } from "vitest";
import { readJson } from "../tools/import/test-io.mjs";
import { featureMarkerSpecs, featureMinBodyPxFromSearch, isFeatureVisible, latLonToXYZ, placeBodyFeatures, DEFAULT_FEATURE_MIN_BODY_PX, MARKER_RADIUS_MULTIPLIER } from "../src/app/FeatureMarkers";
import { bodyFeatureSet, featureKey, type BodyFeatureSet } from "../src/shell/bodyFeatures";
import { createProvenance } from "../src/core/provenance";
import { infoView } from "../src/shell/infoModel";
import type { ExperienceConfig } from "../src/shell/experience";

// O-025 T-103: the tagged places on the four mapped moons. The packages are data (O-018); the layer is generic (ARCH-01), so the placement
// tests use the packages as inputs and a made-up body for the geometry.
const DONOR = "/home/user/code/planetary-explorer";
const MOONS = { io: 12, europa: 19, ganymede: 25, callisto: 22 } as const;
const readPackage = (body: string, file: string): unknown => readJson(new URL(`../data/bodies/${body}/${file}.json`, import.meta.url).pathname);
const provenance = createProvenance({ sourceType: "reconstructed", sources: ["Made-up source"], accuracy: "Made-up.", notes: "Made-up." });
const setOf = (body: string): BodyFeatureSet => bodyFeatureSet({ bodyId: body, bodyLabel: body, features: readPackage(body, "features") as never, categories: readPackage(body, "categories") as never, provenance });
const sets = Object.keys(MOONS).map(setOf);

/** The donor's latLonToXYZ, copied verbatim from planetary-explorer src/entities/hotspot.ts (84f8d3e). */
function donorLatLonToXYZ(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 90) * (Math.PI / 180);
  return [radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.cos(theta)];
}

describe("T-103: feature positions", () => {
  it("every feature of the four packages is carried bit for bit and placed exactly where the donor's formula puts it", () => {
    const specs = featureMarkerSpecs(sets);
    expect(specs).toHaveLength(Object.values(MOONS).reduce((sum, n) => sum + n, 0));
    for (const set of sets) {
      const stored = (readPackage(set.bodyId, "features") as { features: { id: string; latitude: number; longitude: number }[] }).features;
      expect(set.features).toHaveLength(MOONS[set.bodyId as keyof typeof MOONS]);
      for (const feature of stored) {
        const spec = specs.find((candidate) => candidate.key === featureKey(set.bodyId, feature.id))!;
        expect(Object.is(spec.latitude, feature.latitude) && Object.is(spec.longitude, feature.longitude), `${set.bodyId}/${feature.id} coordinates`).toBe(true);
        for (const radius of [1, 1.3, 2439.7 * MARKER_RADIUS_MULTIPLIER]) {
          const mine = latLonToXYZ(spec.latitude, spec.longitude, radius);
          const donor = donorLatLonToXYZ(feature.latitude, feature.longitude, radius);
          expect(mine.map((v, i) => Object.is(v, donor[i])), `${set.bodyId}/${feature.id} @${radius}`).toEqual([true, true, true]);
        }
      }
    }
  });

  it("matches the donor's own functions when the donor checkout is present", async () => {
    let donor: { latLonToXYZ: typeof latLonToXYZ } | null = null;
    let math: { isFeatureVisible: typeof isFeatureVisible } | null = null;
    try {
      donor = (await import(/* @vite-ignore */ `${DONOR}/src/entities/hotspot.ts`)) as typeof donor;
      math = (await import(/* @vite-ignore */ `${DONOR}/src/shared/utils/mathUtils.ts`)) as typeof math;
    } catch { return; }
    for (const spec of featureMarkerSpecs(sets)) {
      expect(latLonToXYZ(spec.latitude, spec.longitude, 1.7)).toEqual(donor!.latLonToXYZ(spec.latitude, spec.longitude, 1.7));
      const normal = latLonToXYZ(spec.latitude, spec.longitude, 1);
      for (const camera of [[0, 0, 4], [3, -2, 1], [-1, 5, -2]] as const) expect(isFeatureVisible(normal, camera, 1)).toBe(math!.isFeatureVisible(normal, camera, 1));
    }
  });

  it("lands each place on the map picture's own coordinates (u = (lon + 180) / 360, v = (lat + 90) / 180), whatever the body", () => {
    // Three.js SphereGeometry: the vertex at uv (u, v) is the point the texture's pixel (u, v) is drawn on. Longitudes are east-positive from the picture's centre.
    const geometry = new SphereGeometry(1, 32, 32);
    const position = geometry.getAttribute("position");
    const uv = geometry.getAttribute("uv");
    let checked = 0;
    for (let i = 0; i < position.count; i += 7) {
      const v = uv.getY(i);
      if (v <= 0.02 || v >= 0.98) continue;
      const [x, y, z] = latLonToXYZ(v * 180 - 90, uv.getX(i) * 360 - 180, 1);
      expect(Math.hypot(x - position.getX(i), y - position.getY(i), z - position.getZ(i))).toBeLessThan(1e-6);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(50);
  });
});

describe("T-103: which markers show", () => {
  const entry = (lat: number, lon: number) => ({ key: `${lat},${lon}`, position: latLonToXYZ(lat, lon, 1.02), normal: latLonToXYZ(lat, lon, 1) });
  const camera = new PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  const facing = entry(0, -90); // +Z in the body's frame
  const away = entry(0, 90); // -Z
  const place = (turn: number, visible = true, radius = 1, minPx = 1) => {
    const sphere = new Group();
    sphere.rotation.y = turn;
    sphere.visible = visible;
    return placeBodyFeatures([facing, away], { sphere, radius }, camera, 45, 800, 800, minPx).map((p) => p.screen !== null);
  };

  it("shows the near side at the middle of the screen and hides the far side", () => {
    expect(place(0)).toEqual([true, false]);
    const [centre] = placeBodyFeatures([facing], { sphere: new Group(), radius: 1 }, camera, 45, 800, 800, 1);
    expect(centre!.screen!.x).toBeCloseTo(400, 3);
    expect(centre!.screen!.y).toBeCloseTo(400, 3);
  });

  it("turns with the body's frame, picture turn included (Ganymede's half turn)", () => {
    expect(place(Math.PI)).toEqual([false, true]);
    expect(place(Math.PI / 2)).toEqual([false, false]); // quarter turn: both points are on the limb, which the camera at this distance sees edge-on, past the horizon tolerance
  });

  it("hides every marker when the body is drawn as a dot, or is narrower than the setting", () => {
    expect(place(0, false)).toEqual([false, false]);
    expect(place(0, true, 1, 100000)).toEqual([false, false]);
    expect(DEFAULT_FEATURE_MIN_BODY_PX).toBeGreaterThan(0);
  });

  it("reads the narrowest width from ?featurepx= and ignores an unusable value", () => {
    expect(featureMinBodyPxFromSearch("")).toBe(DEFAULT_FEATURE_MIN_BODY_PX);
    expect(featureMinBodyPxFromSearch("?featurepx=120")).toBe(120);
    expect(featureMinBodyPxFromSearch("?featurepx=0")).toBe(0);
  });
});

describe("T-103: a place's information", () => {
  const experience = { objects: [], cameraPresets: [], events: [], window: { startUtcMs: 0, endUtcMs: 1 }, rates: [1], bodyFeatures: sets } as unknown as ExperienceConfig;

  it("names the place, its kind and body, its description and details, and carries the provenance", () => {
    const view = infoView(experience, { kind: "feature", id: featureKey("io", "loki-patera") })!;
    expect(view.title).toBe("Loki Patera");
    expect(view.subtitle).toBe("patera on io");
    expect(view.description).toMatch(/^Loki/);
    expect(view.facts!.length).toBeGreaterThan(0);
    expect(view.provenance!.status).toBe("Reconstructed");
    expect(infoView(experience, { kind: "feature", id: "io:nowhere" })).toBeNull();
  });
});
