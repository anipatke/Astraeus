import { describe, expect, it, vi } from "vitest";
import { PerspectiveCamera, Quaternion, Texture, Vector3 } from "three";
import { textureRightsProblem } from "../src/assets/licence";
import {
  eqjToGalactic,
  eqjUnit,
  galacticToEqj,
  GALACTIC_CENTRE,
  GALACTIC_NORTH_POLE,
  MILKY_WAY_TILES,
  starAppearance,
  milkyWayUv,
  parseStarFile,
  type StarRow,
} from "../src/assets/sky";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import { SkyView, SKY_PROBE_DIRECTION, brightnessFromSearch, milkyWayFromSearch, skyHiddenBySearch } from "../src/app/SkyView";
import { buildPictureMesh, buildStarBuffers, resolveSkySettings, skyObject, starRenderDirection, withSkyObject } from "../src/app/skyModel";

const DEG = Math.PI / 180;
/** Angle between two directions, accurate near zero (acos is not): atan2 of the cross and dot products. */
const angleBetween = (a: ArrayLike<number>, b: ArrayLike<number>) =>
  Math.atan2(Math.hypot(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]), a[0] * b[0] + a[1] * b[1] + a[2] * b[2]);

// Made-up catalogue (ARCH-03): three stars, no data file needed.
const MADE_UP: readonly StarRow[] = [
  [0, 0, 1.0, 0.0],
  [90, 45, 3.5, 1.4],
  [200, -60, 6.0, null],
];

// Published J2000 positions of five named stars, written out independently of the code (right ascension h m s, declination d m s).
const NAMED: readonly { name: string; ra: [number, number, number]; dec: [number, number, number] }[] = [
  { name: "Sirius", ra: [6, 45, 8.917], dec: [-16, 42, 58.02] },
  { name: "Polaris", ra: [2, 31, 49.09], dec: [89, 15, 50.8] },
  { name: "Betelgeuse", ra: [5, 55, 10.305], dec: [7, 24, 25.43] },
  { name: "Vega", ra: [18, 36, 56.336], dec: [38, 47, 1.29] },
  { name: "Algol", ra: [3, 8, 10.132], dec: [40, 57, 20.33] },
];
const hms = ([h, m, s]: number[]) => 15 * (h + m / 60 + s / 3600);
const dms = ([d, m, s]: number[]) => Math.sign(d) * (Math.abs(d) + m / 60 + s / 3600);

const skySources = import.meta.glob(["../src/app/SkyView.ts", "../src/app/skyModel.ts", "../src/assets/sky.ts"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;

describe("star directions (Done When 1)", () => {
  it("puts a made-up star's direction through the render-axis conversion, to 1e-9 rad", () => {
    for (const star of MADE_UP) {
      const ra = star[0] * DEG;
      const dec = star[1] * DEG;
      const oracle = [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)]; // EQJ, written out here
      const drawn = starRenderDirection(star);
      expect(angleBetween(drawn, eqjToRenderVector(oracle))).toBeLessThan(1e-9);
      expect(drawn[0]).toBeCloseTo(oracle[0], 12);
      expect(drawn[1]).toBeCloseTo(oracle[2], 12);
      expect(drawn[2]).toBeCloseTo(-oracle[1], 12);
    }
  });

  it("holds for Sirius, Polaris, Betelgeuse, Vega and Algol at their published coordinates", () => {
    for (const named of NAMED) {
      const row: StarRow = [hms(named.ra), dms(named.dec), 1, null];
      const ra = row[0] * DEG;
      const dec = row[1] * DEG;
      const expected = eqjToRenderVector([Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)]);
      expect(angleBetween(starRenderDirection(row), expected), named.name).toBeLessThan(1e-9);
    }
  });

  it("keeps the GPU buffer within 1e-6 rad of the Float64 direction (the one narrowing to Float32)", () => {
    const buffers = buildStarBuffers(MADE_UP);
    expect(buffers.count).toBe(3);
    MADE_UP.forEach((star, i) => {
      const direction = buffers.directions.subarray(i * 3, i * 3 + 3);
      expect(angleBetween(direction, starRenderDirection(star))).toBeLessThan(1e-6);
    });
    // Brighter stars are drawn bigger and stronger.
    expect(buffers.sizesPx[0]).toBeGreaterThan(buffers.sizesPx[2]);
    expect(Math.max(...buffers.colours.subarray(0, 3))).toBeGreaterThan(Math.max(...buffers.colours.subarray(6, 9)));
  });

});

describe("Milky Way alignment (Done When 2)", () => {
  it("puts the galactic north pole and centre at their cited J2000 coordinates, within 0.5 deg (actually far closer)", () => {
    const pole = galacticToEqj(0, 90);
    expect(angleBetween(pole, eqjUnit(GALACTIC_NORTH_POLE.raDeg, GALACTIC_NORTH_POLE.decDeg)) / DEG).toBeLessThan(0.5);
    const centre = galacticToEqj(0, 0);
    expect(angleBetween(centre, eqjUnit(GALACTIC_CENTRE.raDeg, GALACTIC_CENTRE.decDeg)) / DEG).toBeLessThan(0.5);
    // And the other way round, through the picture's own coordinates: the pole is the top edge, the centre is the picture's middle.
    expect(milkyWayUv(eqjUnit(GALACTIC_NORTH_POLE.raDeg, GALACTIC_NORTH_POLE.decDeg))[1]).toBeCloseTo(1, 7);
    const [u, v] = milkyWayUv(eqjUnit(GALACTIC_CENTRE.raDeg, GALACTIC_CENTRE.decDeg));
    expect(Math.abs(u - 0.5) * 360).toBeLessThan(0.5);
    expect(Math.abs(v - 0.5) * 180).toBeLessThan(0.5);
  });

  it("reproduces independently published galactic coordinates and runs longitude leftwards in the picture", () => {
    // Published (SIMBAD) values: Sirius l 227.23 b -8.89; Vega l 67.45 b +19.24; the LMC centre l 280.47 b -32.89 (RA 05h23m34.5s Dec -69d45m22s).
    const sirius = eqjToGalactic(eqjUnit(hms([6, 45, 8.917]), dms([-16, 42, 58.02])));
    expect(sirius[0] + 360).toBeCloseTo(227.23, 1);
    expect(sirius[1]).toBeCloseTo(-8.89, 1);
    const vega = eqjToGalactic(eqjUnit(hms([18, 36, 56.336]), dms([38, 47, 1.29])));
    expect(vega[0]).toBeCloseTo(67.45, 1);
    expect(vega[1]).toBeCloseTo(19.24, 1);
    const lmc = eqjToGalactic(eqjUnit(hms([5, 23, 34.5]), dms([-69, 45, 22])));
    expect(lmc[0] + 360).toBeCloseTo(280.47, 1);
    expect(lmc[1]).toBeCloseTo(-32.89, 1);
    // l = 280 is 80 deg short of 360, so it sits right of the centre (u above 0.5); l = +90 sits left (u below 0.5).
    expect(milkyWayUv(galacticToEqj(280, -33))[0]).toBeGreaterThan(0.5);
    expect(milkyWayUv(galacticToEqj(90, 0))[0]).toBeLessThan(0.5);
  });

  it("cuts the picture mesh into halves that carry their own half's picture coordinates", () => {
    const [left, right] = [0, 1].map((index) => buildPictureMesh(48, 24, { index, count: 2 }));
    expect(left.positions.length / 3).toBe(25 * 25);
    const whole = buildPictureMesh(48, 24);
    // The left half's vertex k is the whole sphere's vertex at the same row and column; the right half starts at the middle column.
    expect(left.uvs[2 * 24]).toBeCloseTo(1, 6); // last column of the left half is the right edge of its own texture
    expect(right.uvs[0]).toBe(0);
    for (const j of [0, 7, 24]) {
      for (const i of [0, 24]) {
        const l = (j * 25 + i) * 3;
        const w = (j * 49 + i) * 3;
        const r = (j * 25 + i) * 3;
        const wr = (j * 49 + 24 + i) * 3;
        expect(Array.from(left.positions.slice(l, l + 3))).toEqual(Array.from(whole.positions.slice(w, w + 3)));
        expect(Array.from(right.positions.slice(r, r + 3))).toEqual(Array.from(whole.positions.slice(wr, wr + 3)));
      }
    }
    expect(() => buildPictureMesh(48, 24, { index: 2, count: 2 })).toThrow(RangeError);
  });

  it("places the picture's mesh so every vertex carries its own galactic picture coordinates", () => {
    const mesh = buildPictureMesh(48, 24);
    expect(mesh.positions.length / 3).toBe(49 * 25);
    expect(mesh.indices.length).toBe(48 * 24 * 6);
    let worst = 0;
    for (let k = 0; k < mesh.positions.length / 3; k += 1) {
      const [rx, ry, rz] = [mesh.positions[k * 3], mesh.positions[k * 3 + 1], mesh.positions[k * 3 + 2]];
      expect(Math.hypot(rx, ry, rz)).toBeCloseTo(1, 6);
      const [u, v] = milkyWayUv([rx, -rz, ry]); // render axes back to EQJ
      const meshU = mesh.uvs[k * 2];
      const du = Math.abs(((u - meshU + 1.5) % 1) - 0.5); // longitude wraps at the seam
      const atPole = Math.abs(v - 0.5) * 180 > 89.99; // longitude is undefined at a pole
      worst = Math.max(worst, atPole ? 0 : du * 360, Math.abs(v - mesh.uvs[k * 2 + 1]) * 180);
    }
    expect(worst).toBeLessThan(1e-3); // degrees, Float32 narrowing only
    // The picture's middle vertex is the galactic centre and the top row is the pole.
    const middle = (12 * 49 + 24) * 3;
    expect(angleBetween([mesh.positions[middle], mesh.positions[middle + 1], mesh.positions[middle + 2]], eqjToRenderVector(eqjUnit(GALACTIC_CENTRE.raDeg, GALACTIC_CENTRE.decDeg))) / DEG).toBeLessThan(0.5);
    const top = 24 * 49 * 3;
    expect(angleBetween([mesh.positions[top], mesh.positions[top + 1], mesh.positions[top + 2]], eqjToRenderVector(eqjUnit(GALACTIC_NORTH_POLE.raDeg, GALACTIC_NORTH_POLE.decDeg))) / DEG).toBeLessThan(0.5);
  });
});

/** Where a world point lands on screen for a camera, from the camera's own matrices. */
function ndcOf(camera: PerspectiveCamera, world: Vector3): [number, number] {
  camera.updateMatrixWorld(true);
  const projected = world.clone().project(camera);
  return [projected.x, projected.y];
}

describe("the sky sits at infinity (Done When 3, ARCH-02)", () => {
  it("mounts a made-up three-star catalogue", () => {
    const view = new SkyView({ starBrightness: 1, milkyWayBrightness: 1, pixelRatio: 1, pictures: [new Texture(), new Texture()] });
    expect(view.starCount).toBe(0);
    view.setStars(MADE_UP);
    expect(view.starCount).toBe(3);
    expect(view.group.children.map((child) => child.type).sort()).toEqual(["Mesh", "Mesh", "Points"]);
    view.setStars([]);
    expect(view.starCount).toBe(0);
    expect(view.group.children.map((child) => child.type)).toEqual(["Mesh", "Mesh"]);
  });

  it("moves no star on screen when the camera's position, near and far change but its orientation does not", () => {
    const view = new SkyView({ starBrightness: 1, milkyWayBrightness: 1, pixelRatio: 1, pictures: [new Texture(), new Texture()] });
    view.setStars(MADE_UP);
    const points = view.group.children.find((child) => child.type === "Points") as import("three").Points;
    const positions = points.geometry.getAttribute("position");
    const orientation = new Quaternion().setFromAxisAngle(new Vector3(0.3, 1, 0.2).normalize(), 0.9);
    // Each case is a different scene centre, floating-origin rebase, scale policy or follow target: only the camera's place and clip planes differ.
    const cases: [number[], number, number][] = [
      [[0, 0, 16], 0.05, 5_000],
      [[1.2e5, -4e4, 8e4], 3_000, 90_000],
      [[-23_455, 7, 1e-3], 0.001, 400_000],
    ];
    const screens = cases.map(([position, near, far]) => {
      const camera = new PerspectiveCamera(45, 16 / 10, near, far);
      camera.position.set(position[0], position[1], position[2]);
      camera.quaternion.copy(orientation);
      view.follow(camera);
      view.group.updateMatrixWorld(true);
      return MADE_UP.map((_, i) => ndcOf(camera, new Vector3().fromBufferAttribute(positions, i).applyMatrix4(view.group.matrixWorld)));
    });
    for (const other of screens.slice(1)) {
      other.forEach((ndc, i) => {
        expect(ndc[0]).toBeCloseTo(screens[0][i][0], 6);
        expect(ndc[1]).toBeCloseTo(screens[0][i][1], 6);
      });
    }
  });

  it("turns with the camera: a rotation moves the probe on screen and a translation does not", () => {
    const view = new SkyView({ starBrightness: 1, milkyWayBrightness: 1, pixelRatio: 1, pictures: [new Texture(), new Texture()] });
    const camera = new PerspectiveCamera(45, 1.6, 1, 1000);
    view.follow(camera);
    const before = view.probe(camera).ndc;
    camera.position.set(500, -200, 300);
    view.follow(camera);
    const moved = view.probe(camera).ndc;
    expect(moved[0]).toBeCloseTo(before[0], 6);
    expect(moved[1]).toBeCloseTo(before[1], 6);
    camera.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), 0.4);
    expect(view.probe(camera).ndc[0]).not.toBeCloseTo(before[0], 2);
    expect(SKY_PROBE_DIRECTION.length).toBe(3);
  });

  it("keeps State out: the sky modules import nothing from the scientific core except provenance", () => {
    expect(Object.keys(skySources)).toHaveLength(3);
    for (const [source, text] of Object.entries(skySources)) {
      const imports = [...text.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
      const core = imports.filter((specifier) => /core\//.test(specifier));
      expect(core.filter((specifier) => !/core\/provenance$/.test(specifier)), source).toEqual([]);
    }
  });
});

describe("rights and the shell item (Done When 4, PROV-02)", () => {
  it("licenses the Milky Way image and credits ESO/S. Brunier", () => {
    expect(MILKY_WAY_TILES).toHaveLength(2);
    for (const tile of MILKY_WAY_TILES) {
      expect(textureRightsProblem(tile)).toBeNull();
      expect(tile.licence?.licence).toBe("CC BY 4.0");
      expect(tile.licence?.attribution).toContain("ESO/S. Brunier");
      expect(Math.max(tile.widthPx, tile.heightPx)).toBeLessThanOrEqual(4096); // under every WebGL2 GPU's texture limit
    }
    expect(MILKY_WAY_TILES.reduce((sum, tile) => sum + tile.widthPx, 0)).toBe(6000); // the full original width
  });

  it("cites its sources and says plainly which star file is drawn", () => {
    const absent = skyObject({ kind: "absent" });
    expect(absent.provenance?.sources.join(" ")).not.toMatch(/Hoffleit|stars=yale/);
    expect(absent.provenance?.sources.join(" ")).toMatch(/ESO\/S\. Brunier/);
    expect(absent.provenance?.sources.join(" ")).toMatch(/HYG star database v4\.2.*CC BY-SA 4\.0/);
    expect(absent.provenance?.notes).toMatch(/could not be loaded/);
    expect(absent.provenance?.notes).toMatch(/Stars are not drawn/);
    expect(absent.provenance?.notes).not.toMatch(/only the Milky Way/);
    expect(skyObject({ kind: "loaded", count: 8404 }).provenance?.notes).toMatch(/8404 stars/);
    expect(skyObject({ kind: "loaded", count: 8920 }).provenance?.notes).toMatch(/8920 stars.*HYG star catalogue \(CC BY-SA 4\.0\)/);
    expect(skyObject({ kind: "loaded", count: 8920 }).provenance?.notes).not.toMatch(/Yale|stars=/);
    expect(absent.knownLimitations?.join(" ")).toMatch(/precession/);
  });

  it("adds the item once, and not when the experience hides the sky", () => {
    const config = { objects: [], cameraPresets: [], events: [], window: { startUtcMs: 0, endUtcMs: 1 }, rates: [1] };
    expect(withSkyObject(config, true, { kind: "absent" }).objects.map((object) => object.id)).toEqual(["sky"]);
    expect(withSkyObject(withSkyObject(config, true, { kind: "absent" }), true, { kind: "absent" }).objects).toHaveLength(1);
    expect(withSkyObject(config, false, { kind: "absent" })).toBe(config);
  });

  it("defaults to on at full brightness with the Milky Way picture off, and rejects a bad brightness", () => {
    expect(resolveSkySettings(undefined)).toEqual({ visible: true, starBrightness: 1, milkyWayBrightness: 1, milkyWay: false, source: "eso" });
    expect(resolveSkySettings({ visible: false, starBrightness: 0.4 })).toEqual({ visible: false, starBrightness: 0.4, milkyWayBrightness: 1, milkyWay: false, source: "eso" });
    expect(resolveSkySettings({ milkyWay: true, milkyWayBrightness: 2 })).toEqual({ visible: true, starBrightness: 1, milkyWayBrightness: 2, milkyWay: true, source: "eso" });
    expect(resolveSkySettings({ starBrightness: 0 }).starBrightness).toBe(0);
    expect(() => resolveSkySettings({ starBrightness: -1 })).toThrow(/sky.starBrightness/);
    expect(() => resolveSkySettings({ starBrightness: 2.01 })).toThrow(/sky.starBrightness/);
    expect(() => resolveSkySettings({ milkyWayBrightness: Number.NaN })).toThrow(/sky.milkyWayBrightness/);
    expect(skyHiddenBySearch("?sky=off")).toBe(true);
    expect(skyHiddenBySearch("?experience=x")).toBe(false);
  });

  it("switches the Milky Way picture on and off without touching the stars", () => {
    expect(milkyWayFromSearch("?milkyway=off")).toBe(false);
    expect(milkyWayFromSearch("?milkyway=on")).toBe(true);
    expect(milkyWayFromSearch("?sky=off")).toBeNull();
    expect(milkyWayFromSearch("?milkyway=maybe")).toBeNull();
    const view = new SkyView({ starBrightness: 1, milkyWayBrightness: 1, pixelRatio: 1, pictures: [new Texture(), new Texture()], milkyWay: false });
    view.setStars(MADE_UP);
    const meshes = () => view.group.children.filter((child) => child.type === "Mesh");
    expect(meshes()).toHaveLength(2);
    expect(view.pictureVisible).toBe(false);
    expect(meshes().every((mesh) => !mesh.visible)).toBe(true);
    expect(view.group.children.find((child) => child.type === "Points")?.visible).toBe(true);
    view.setPictureVisible(true);
    expect(view.pictureVisible).toBe(true);
    expect(view.starCount).toBe(3);
    // Owner decision 2026-10-15: with no setting the picture starts off; the switch (or ?milkyway=on) turns it on.
    const byDefault = new SkyView({ starBrightness: 1, milkyWayBrightness: 1, pixelRatio: 1, pictures: [new Texture(), new Texture()] });
    expect(byDefault.pictureVisible).toBe(false);
    expect(new SkyView({ starBrightness: 1, milkyWayBrightness: 1, pixelRatio: 1, pictures: [new Texture(), new Texture()], milkyWay: true }).pictureVisible).toBe(true);
  });

  it("reads brightness from the address, ignoring bad values with a warning, and changes the uniforms in place", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(brightnessFromSearch("?stars=1.4", "stars")).toBe(1.4);
    expect(brightnessFromSearch("?stars=0", "stars")).toBe(0);
    expect(brightnessFromSearch("?milkywaybrightness=0.8", "milkywaybrightness")).toBe(0.8);
    expect(brightnessFromSearch("?experience=x", "stars")).toBeNull();
    expect(warn).not.toHaveBeenCalled();
    for (const bad of ["?stars=3", "?stars=-1", "?stars=abc", "?stars="]) expect(brightnessFromSearch(bad, "stars")).toBeNull();
    expect(warn).toHaveBeenCalledTimes(4);
    warn.mockRestore();
    const view = new SkyView({ starBrightness: 1.2, milkyWayBrightness: 0.5, pixelRatio: 1, pictures: [new Texture(), new Texture()] });
    expect(view.starBrightness).toBe(1.2);
    expect(view.milkyWayBrightness).toBeCloseTo(0.5, 9);
    view.setStarBrightness(1.7);
    view.setMilkyWayBrightness(2);
    expect(view.starBrightness).toBe(1.7);
    expect(view.milkyWayBrightness).toBeCloseTo(2, 9);
    view.dispose();
  });

  it("filters the picture with mipmaps and anisotropy so it does not sparkle", () => {
    const halves = [new Texture(), new Texture()];
    const view = new SkyView({ starBrightness: 1, milkyWayBrightness: 1, pixelRatio: 2, maxAnisotropy: 8, pictures: halves });
    for (const texture of halves) {
      expect(texture.generateMipmaps).toBe(true);
      expect(texture.anisotropy).toBe(8);
      expect(texture.minFilter).toBe(1008); // LinearMipmapLinearFilter
    }
    view.dispose();
  });

  it("gives every star a visible core: at least 1.5 CSS pixels wide, brighter stars wider and stronger", () => {
    const faint = starAppearance(6.5);
    const bright = starAppearance(-1.5);
    expect(faint.sizePx).toBeGreaterThanOrEqual(1.5);
    expect(bright.sizePx).toBeGreaterThan(faint.sizePx);
    expect(bright.brightness).toBeGreaterThan(faint.brightness);
    expect(bright.brightness).toBeLessThanOrEqual(1);
  });

  it("makes bright stars stand out: fixed sizes and strengths, wider range than the first pass, deterministic", () => {
    const at = (m: number) => starAppearance(m);
    expect(at(6.5).sizePx).toBeCloseTo(1.5, 9);
    expect(at(6.5).brightness).toBeCloseTo(0.3, 9);
    expect(at(-1.5).sizePx).toBeCloseTo(4.4, 9);
    expect(at(-1.5).brightness).toBeCloseTo(1, 9);
    expect(at(2).sizePx).toBeCloseTo(1.5 + 2.9 * (4.5 / 8) ** 0.9, 9);
    expect(at(2)).toEqual(at(2));
    // Against the first pass (size 1.5 + 2.2 x^0.9, strength 0.35 + 0.65 x^0.7): the brightest star is larger and stronger relative to a
    // magnitude 6 star, and a magnitude 4 star is at least 25% stronger at the core once the shader's peak gain is applied.
    const first = (m: number) => { const x = Math.min(1, Math.max(0, (6.5 - m) / 8)); return { sizePx: 1.5 + 2.2 * x ** 0.9, brightness: 0.35 + 0.65 * x ** 0.7 }; };
    expect(at(-1.5).sizePx / at(6).sizePx).toBeGreaterThan(first(-1.5).sizePx / first(6).sizePx);
    const core = (a: { sizePx: number; brightness: number }, gain: number) => a.brightness * gain * a.sizePx ** 2; // peak times area: the star's light
    expect(core(at(-1.5), 1.25) / core(at(6), 1.25)).toBeGreaterThan(core(first(-1.5), 1) / core(first(6), 1));
    expect((at(4).brightness * 1.25) / first(4).brightness).toBeGreaterThan(1.25);
    expect((at(6).brightness * 1.25) / first(6).brightness).toBeLessThan(1.35); // faint stars stay modest
    expect(at(6).sizePx).toBeLessThan(1.8);
  });
});

describe("the star file", () => {
  it("validates a star file and names the bad row", () => {
    expect(parseStarFile({ stars: [[1, 2, 3, null]] }).stars).toHaveLength(1);
    expect(() => parseStarFile({})).toThrow(/stars array/);
    expect(() => parseStarFile({ stars: [[1, 2, 3, null], [1, 99, 3, null]] })).toThrow(/star 1/);
    expect(() => parseStarFile({ stars: [[1, 2, "x", null]] })).toThrow(/star 0/);
  });
});
