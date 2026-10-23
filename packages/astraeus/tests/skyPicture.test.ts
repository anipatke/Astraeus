// I-026, slimmed by T-068: the one Milky Way picture (the ESO panorama as a tiled set), its mesh, and its lazy load.
// Scenarios removed with the second (NASA) picture source, none of them still applicable: manifest validation, tone-map arguments,
// equatorial registration, the fetched-tiles check, the fall-back to ESO and the `?skymap=` switch (comparison-only; the ESO set,
// its galactic registration in sky.test.ts, and the lazy load below remain).
import { describe, expect, it, vi } from "vitest";
import { Texture, TextureLoader } from "three";
import { ESO_PICTURE, MAX_TILE_PX, milkyWayUv } from "../src/assets/sky";
import { SkyView } from "../src/app/SkyView";
import { buildPictureMesh, resolveSkySettings } from "../src/app/skyModel";

/** Render-frame position back to an EQJ unit vector. */
const renderToEqj = (x: number, y: number, z: number): [number, number, number] => [x, -z, y];

describe("the ESO Milky Way picture", () => {
  it("is the galactic two-tile panorama, each tile within the GPU texture limit, with its licence", () => {
    expect(ESO_PICTURE).toMatchObject({ columns: 2, rows: 1, licence: "CC BY 4.0", credit: "ESO/S. Brunier" });
    expect(ESO_PICTURE.tiles).toHaveLength(2);
    expect(ESO_PICTURE.tiles.every((tile) => tile.widthPx <= MAX_TILE_PX && tile.heightPx <= MAX_TILE_PX)).toBe(true);
  });

  it("places every vertex of each tile mesh on the galactic picture coordinates its own texture coordinates name", () => {
    const grid = { columns: ESO_PICTURE.columns, rows: ESO_PICTURE.rows };
    let worst = 0;
    for (let column = 0; column < grid.columns; column += 1) {
      const mesh = buildPictureMesh(128, 64, { column, row: 0, ...grid });
      for (let k = 0; k < mesh.uvs.length / 2; k += 5) {
        const [x, y, z] = [mesh.positions[k * 3], mesh.positions[k * 3 + 1], mesh.positions[k * 3 + 2]];
        const [u, v] = milkyWayUv(renderToEqj(x, y, z));
        if (Math.abs(v - 0.5) * 180 > 89.9) continue; // the galactic poles have no single longitude
        const wantU = (column + mesh.uvs[k * 2]) / grid.columns;
        let du = u - wantU;
        du -= Math.round(du);
        worst = Math.max(worst, Math.abs(du), Math.abs(v - mesh.uvs[k * 2 + 1]));
      }
    }
    expect(worst).toBeLessThan(1e-5);
  });

  it("has no source setting: the resolved sky settings carry only visibility and the two strengths and the picture switch", () => {
    expect(Object.keys(resolveSkySettings(undefined)).sort()).toEqual(["milkyWay", "milkyWayBrightness", "starBrightness", "visible"]);
  });

  it("is built only when asked for, once, keeping the on/off state and brightness", () => {
    vi.spyOn(TextureLoader.prototype, "load").mockImplementation(() => new Texture());
    const view = new SkyView({ starBrightness: 1, milkyWayBrightness: 0.8, pixelRatio: 1, picture: null, milkyWay: false });
    const meshes = () => view.group.children.filter((child) => child.type === "Mesh");
    expect(meshes()).toHaveLength(0);
    view.requestPicture();
    view.requestPicture();
    expect(meshes()).toHaveLength(2);
    expect(view.pictureVisible).toBe(false);
    view.setPictureVisible(true);
    expect(view.pictureVisible).toBe(true);
    expect(view.milkyWayBrightness).toBe(0.8);
    view.dispose();
    vi.restoreAllMocks();
  });
});
