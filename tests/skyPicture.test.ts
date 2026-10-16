// I-026: the tiled sky picture: manifest validation, registration of the NASA map in J2000, and the fall back to the ESO panorama.
import { describe, expect, it, vi } from "vitest";
import { Texture, TextureLoader } from "three";
import {
  ESO_PICTURE, MAX_TILE_PX, equatorialUv, eqjUnit, galacticToEqj, loadPictureSet, parseSkyManifest, pictureTexel, type PictureSet,
} from "../src/assets/sky";
import { SkyView, skyMapFromSearch } from "../src/app/SkyView";
import { buildPictureMesh, resolveSkySettings } from "../src/app/skyModel";
import { buildManifest, tileGrid, toneArgs } from "../tools/data/fetch-sky-map.mjs";

const W = 16384;
const H = 8192;
const files = Array.from({ length: 8 }, (_, i) => `tile-${i}.jpg`);
const manifest = () => buildManifest({ size: "16k", widthPx: W, heightPx: H, tilePx: 4096, exposure: 10, gamma: 2.2, quality: 20, files, fetchedAt: "2026-10-16T10:00:00.000Z" });

// Node modules are loaded at run time: the test project carries no Node type definitions.
const nodeModule = (name: string): Promise<any> => import(/* @vite-ignore */ `node:${name}`);
const { execFileSync } = await nodeModule("child_process");
const { existsSync } = await nodeModule("fs");

describe("tile manifest validation", () => {
  it("accepts what the fetch tool writes, as a 4x2 grid of 4096 px tiles in the J2000 frame", () => {
    expect(tileGrid(W, H)).toEqual({ columns: 4, rows: 2 });
    expect(tileGrid(8192, 4096)).toEqual({ columns: 2, rows: 1 });
    const set = parseSkyManifest(JSON.parse(JSON.stringify(manifest())), "/data/local/sky/nasa/");
    expect(set.frame).toBe("equatorial-j2000");
    expect([set.columns, set.rows, set.tiles.length]).toEqual([4, 2, 8]);
    expect(set.tiles.every((tile) => tile.widthPx === 4096 && tile.heightPx === 4096)).toBe(true);
    expect(set.tiles[5]).toMatchObject({ column: 1, row: 1, url: "/data/local/sky/nasa/tile-5.jpg" });
    expect(set.credit).toContain("Gaia DR2");
    expect(set.gain).toBe(1);
  });

  it("states the tone map as settings with defaults, recorded in the manifest", () => {
    expect(toneArgs({ exposure: 10, gamma: 2.2 })).toEqual(["-evaluate", "multiply", "10", "-gamma", "2.2"]);
    expect(() => toneArgs({ exposure: 0, gamma: 2.2 })).toThrow(RangeError);
    expect(manifest().tone).toMatchObject({ exposure: 10, gamma: 2.2, quality: 20, original: "starmap_2020_16k.exr" });
  });

  it("rejects a bad frame, an oversize tile, a wrong grid, a missing, repeated or oddly named tile, and a flat picture", () => {
    const bad = (change: (m: any) => void): string => {
      const m = JSON.parse(JSON.stringify(manifest()));
      change(m);
      try { parseSkyManifest(m, "/x/"); } catch (error) { return (error as Error).message; }
      return "accepted";
    };
    expect(bad((m) => { m.frame = "ecliptic"; })).toMatch(/frame/);
    expect(bad((m) => { m.tilePx = 8192; m.grid = { columns: 2, rows: 1 }; })).toMatch(new RegExp(`${MAX_TILE_PX}`));
    expect(bad((m) => { m.grid.columns = 3; })).toMatch(/grid does not match/);
    expect(bad((m) => { m.tiles.pop(); })).toMatch(/one tile per grid cell/);
    expect(bad((m) => { m.tiles[1] = { ...m.tiles[0] }; })).toMatch(/twice/);
    expect(bad((m) => { m.tiles[0].file = "../secret.jpg"; })).toMatch(/plain file name/);
    expect(bad((m) => { m.tiles[0].column = 4; })).toMatch(/in-grid/);
    expect(bad((m) => { m.heightPx = 4096; m.grid.rows = 1; m.tiles = m.tiles.slice(0, 4); })).toMatch(/equirectangular/);
    expect(bad((m) => { delete m.licence; })).toMatch(/licence/);
    expect(bad((m) => { m.gain = 3; })).toMatch(/gain/);
    expect(bad((m) => { m.schema = 2; })).toMatch(/schema/);
  });
});

/** Render-frame position back to an EQJ unit vector. */
const renderToEqj = (x: number, y: number, z: number): [number, number, number] => [x, -z, y];

describe("registration of the NASA map (equatorial J2000, no rotation)", () => {
  const vega = [279.23473, 38.78369] as const;
  const deneb = [310.35798, 45.28034] as const;
  const centre = [266.405, -28.936] as const;

  it("puts Vega, Deneb and the galactic centre on the pixels the map's own layout gives (RA 0h at the centre, RA increasing leftwards)", () => {
    for (const [ra, dec] of [vega, deneb, centre]) {
      const raWrapped = ra > 180 ? ra - 360 : ra;
      const expectX = (0.5 - raWrapped / 360) * W;
      const expectY = (0.5 - dec / 180) * H;
      const t = pictureTexel("equatorial-j2000", W, H, 4096, eqjUnit(ra, dec));
      expect(t.column * 4096 + t.x).toBeCloseTo(expectX, 6);
      expect(t.row * 4096 + t.y).toBeCloseTo(expectY, 6);
    }
    const gc = pictureTexel("equatorial-j2000", W, H, 4096, galacticToEqj(0, 0));
    const ref = pictureTexel("equatorial-j2000", W, H, 4096, eqjUnit(centre[0], centre[1]));
    expect(Math.hypot((gc.column - ref.column) * 4096 + gc.x - ref.x, (gc.row - ref.row) * 4096 + gc.y - ref.y)).toBeLessThan(1); // the record's 3-decimal GC is good to a pixel
    expect(equatorialUv(eqjUnit(0, 0))).toEqual([0.5, 0.5]);
    expect(equatorialUv(eqjUnit(90, 0))[0]).toBeCloseTo(0.25, 12);
  });

  it("places every mesh vertex of every tile on the pixel its own picture coordinates name, within 0.01 tile pixel", () => {
    const set = { columns: 4, rows: 2 };
    let worst = 0;
    for (let row = 0; row < set.rows; row += 1) {
      for (let column = 0; column < set.columns; column += 1) {
        const mesh = buildPictureMesh(256, 128, { column, row, ...set, frame: "equatorial-j2000" });
        for (let k = 0; k < mesh.uvs.length / 2; k += 7) {
          const [x, y, z] = [mesh.positions[k * 3], mesh.positions[k * 3 + 1], mesh.positions[k * 3 + 2]];
          const lat = Math.abs(Math.asin(y)) * 180 / Math.PI;
          if (lat > 89.9) continue; // the poles have no single longitude
          const t = pictureTexel("equatorial-j2000", W, H, 4096, renderToEqj(x, y, z));
          const wantX = column * 4096 + mesh.uvs[k * 2] * 4096;
          const wantY = row * 4096 + (1 - mesh.uvs[k * 2 + 1]) * 4096;
          let dx = t.column * 4096 + t.x - wantX;
          dx -= Math.round(dx / W) * W; // the seam at RA 180
          worst = Math.max(worst, Math.hypot(dx, t.row * 4096 + t.y - wantY));
        }
      }
    }
    expect(worst).toBeLessThan(0.01);
  });

  const tileFile = (n: number) => new URL(`../data/local/sky/nasa/tile-${n}.jpg`, import.meta.url).pathname as string;
  const fetched = existsSync(tileFile(0)) && existsSync(new URL("../data/local/sky/nasa/manifest.json", import.meta.url).pathname);
  (fetched ? it : it.skip)("finds Vega and Deneb in the fetched tiles within one tile pixel of where the map layout predicts", () => {
    for (const [ra, dec] of [vega, deneb]) {
      const t = pictureTexel("equatorial-j2000", W, H, 4096, eqjUnit(ra, dec));
      const half = 8;
      const x0 = Math.max(0, Math.floor(t.x) - half);
      const y0 = Math.max(0, Math.floor(t.y) - half);
      const bytes = execFileSync("convert", [tileFile(t.row * 4 + t.column), "-crop", `${2 * half + 1}x${2 * half + 1}+${x0}+${y0}`, "+repage", "-colorspace", "Gray", "-depth", "8", "gray:-"]);
      let sum = 0; let sx = 0; let sy = 0;
      bytes.forEach((value: number, i: number) => {
        const w = Math.max(0, value - 90) ** 2; // the star's core only, not the faint field
        sum += w; sx += w * (x0 + (i % (2 * half + 1)) + 0.5); sy += w * (y0 + Math.floor(i / (2 * half + 1)) + 0.5);
      });
      expect(sum).toBeGreaterThan(0);
      expect(Math.hypot(sx / sum - t.x, sy / sum - t.y)).toBeLessThan(1);
    }
  });
});

describe("falling back to the ESO panorama", () => {
  const ok = (body: unknown, status = 200) => (async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status })) as unknown as typeof fetch;

  it("uses ESO when asked, in a production build, and when the NASA tiles are absent, unreadable or invalid", async () => {
    const fail = vi.fn(async () => { throw new Error("offline"); }) as unknown as typeof fetch;
    expect((await loadPictureSet("eso", ok(manifest()), false)).id).toBe("eso");
    const production = vi.fn(ok(manifest()));
    expect((await loadPictureSet("nasa", production, true)).id).toBe("eso");
    expect(production).not.toHaveBeenCalled(); // a public build never even asks for data/local
    expect((await loadPictureSet("nasa", ok("", 404), false)).id).toBe("eso");
    expect((await loadPictureSet("nasa", ok("<!doctype html><title>Astraeus</title>"), false)).id).toBe("eso"); // the dev server's page for an unknown path
    expect((await loadPictureSet("nasa", ok({ ...manifest(), frame: "mars" }), false)).id).toBe("eso");
    expect((await loadPictureSet("nasa", fail, false)).id).toBe("eso");
  });

  it("uses the NASA tiles when the manifest is valid, and the ESO set is the galactic two-tile panorama", async () => {
    const set = await loadPictureSet("nasa", ok(manifest()), false);
    expect(set.id).toBe("nasa");
    expect(set.tiles).toHaveLength(8);
    expect(ESO_PICTURE).toMatchObject({ id: "eso", frame: "galactic", columns: 2, rows: 1, licence: "CC BY 4.0" });
    expect(ESO_PICTURE.tiles.every((tile) => tile.widthPx <= MAX_TILE_PX && tile.heightPx <= MAX_TILE_PX)).toBe(true);
  });

  it("reads ?skymap=nasa|eso, ignores anything else, and defaults the setting to eso (owner decision)", () => {
    expect(skyMapFromSearch("?skymap=eso")).toBe("eso");
    expect(skyMapFromSearch("?skymap=nasa&milkyway=on")).toBe("nasa");
    expect(skyMapFromSearch("?skymap=hips")).toBeNull();
    expect(skyMapFromSearch("")).toBeNull();
    expect(resolveSkySettings(undefined).source).toBe("eso");
    expect(resolveSkySettings({ source: "nasa" }).source).toBe("nasa");
  });

  it("loads the picture only when asked, keeps the on/off state and brightness across a source change, and scales by the source's gain", async () => {
    vi.spyOn(TextureLoader.prototype, "load").mockImplementation(() => new Texture());
    const view = new SkyView({ starBrightness: 1, milkyWayBrightness: 0.8, pixelRatio: 1, picture: null, source: "nasa", milkyWay: false });
    expect(view.pictureSource).toBeNull();
    const nasa: PictureSet = { ...parseSkyManifest(JSON.parse(JSON.stringify(manifest())), "/t/"), gain: 0.5 };
    const load = vi.fn(async () => nasa);
    view.requestPicture(load);
    view.requestPicture(load);
    await Promise.resolve(); await Promise.resolve();
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith("nasa");
    expect(view.pictureSource).toBe("nasa");
    expect(view.group.children.filter((child) => child.type === "Mesh")).toHaveLength(8);
    expect(view.pictureVisible).toBe(false);
    view.setPictureVisible(true);
    expect(view.milkyWayBrightness).toBe(0.8);
    view.setPicture(ESO_PICTURE);
    expect(view.pictureSource).toBe("eso");
    expect(view.pictureVisible).toBe(true);
    expect(view.group.children.filter((child) => child.type === "Mesh")).toHaveLength(2);
    expect(view.milkyWayBrightness).toBe(0.8);
    view.dispose();
    vi.restoreAllMocks();
  });
});
