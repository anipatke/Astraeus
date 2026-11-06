// T-252 (O-055, API-03, DATA-01): a viewer draws a data package's pictures only when that package was passed to it. One table, one row per path that reads a picture:
// a sphere body texture, a listed moon, a system map (a ringed planet's moon), the Venus large variant and the Milky Way; each with the package passed and without.
import { describe, expect, it } from "vitest";
import { PICTURES } from "astraeus-data";
import { describeBody } from "../src/app/bodyDraw";
import { catalogue } from "../src/assets/catalogue";
import { NO_PICTURES, mergePictures, picturesProblem, textureOf } from "../src/assets/pictures";
import { milkyWayPicture } from "../src/assets/sky";
import { trueScale } from "../src/core/scalePolicy";
import { Scene } from "../src/api/scene";
import { saturn, titan } from "../src/api/bodies";
import type { DataSource } from "../src/api/data";
import { definitionOf } from "../src/api/definitionOf";

const drawnUrl = (id: string, pictures: typeof PICTURES, desktop = false): string | undefined => describeBody(catalogue.get(id), trueScale, desktop, pictures).textureUrl;

interface Path { readonly name: string; readonly given: (pictures: typeof PICTURES) => unknown; readonly withPackage: unknown; readonly without: unknown }
const PATHS: readonly Path[] = [
  { name: "a sphere body texture (Io, the Galilean look)", given: (p) => drawnUrl("io", p), withPackage: PICTURES.io!.url, without: undefined },
  { name: "a listed moon (Mimas, a system map look)", given: (p) => drawnUrl("mimas", p), withPackage: PICTURES.mimas!.url, without: undefined },
  { name: "a ring or system map picture (Titan, Saturn's moon with its rings)", given: (p) => drawnUrl("titan", p), withPackage: PICTURES.titan!.url, without: undefined },
  { name: "the Venus large variant on a wide window", given: (p) => drawnUrl("venus", p, true), withPackage: PICTURES["venus-8k"]!.url, without: catalogue.get("venus").visual.texture!.url },
  { name: "the Milky Way", given: (p) => milkyWayPicture(p).tiles.map((tile) => tile.url), withPackage: [PICTURES["milky-way"]!.url], without: [] },
];

describe("a viewer draws only the pictures it was given", () => {
  it.each(PATHS)("$name: used with the package, flat colour (or none) without", ({ given, withPackage, without }) => {
    expect(given(PICTURES)).toEqual(withPackage);
    expect(given(NO_PICTURES)).toEqual(without);
  });

  it("does not borrow another viewer's picture: a set holding only the Moon's map leaves Titan flat", () => {
    expect(drawnUrl("titan", { io: PICTURES.io! })).toBeUndefined();
    expect(drawnUrl("io", { io: PICTURES.io! })).toBe(PICTURES.io!.url);
  });

  it("keeps the engine's own texture when no picture is given, and the picture set is not on the look itself", () => {
    expect(textureOf(catalogue.get("earth").visual, NO_PICTURES)).toBe(catalogue.get("earth").visual.texture);
    expect(catalogue.get("titan").visual.texture).toBeUndefined();
    expect(catalogue.get("titan").visual.picture).toBe("titan");
  });

  it("merges packages' pictures, a later package replacing an earlier one's of the same name, and checks the rights of what it was given", () => {
    expect(mergePictures([{ io: PICTURES.io! }, undefined, { io: PICTURES.europa! }]).io).toBe(PICTURES.europa);
    expect(picturesProblem(PICTURES)).toBeNull();
    expect(picturesProblem({ x: { url: "x", widthPx: 1, heightPx: 1 } })).toMatch(/^the picture "x" has neither/);
  });

  it("carries a package's pictures on the definition the Scene builds, and none when no package brings any", () => {
    const scene = new Scene().addBody(saturn).addBody(titan);
    const positions: DataSource = { name: "astraeus-data-saturn", provides: ["titan"], moonPositions: { center: "saturn", loadIndex: async () => ({}), chunkUrls: {} } };
    expect(definitionOf(scene, [positions, { name: "astraeus-data", provides: [], pictures: PICTURES }]).pictures).toEqual(PICTURES);
    expect(definitionOf(scene, [positions]).pictures).toBeUndefined();
  });
});
