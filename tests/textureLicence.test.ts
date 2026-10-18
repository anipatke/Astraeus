import { describe, expect, it } from "vitest";
import { catalogue } from "../src/assets/catalogue";
import { textureRightsProblem, type AssetLicence, type TextureRef } from "../src/assets/licence";

const licence: AssetLicence = { source: "made up", url: "https://example.invalid/x", licence: "public domain", accessed: "2026-10-11" };
const base = { url: "x.jpg", widthPx: 2, heightPx: 1 };

describe("texture rights (PROV-02)", () => {
  it("fails a texture with neither a licence nor a local-only declaration, or with both", () => {
    expect(textureRightsProblem(base)).toMatch(/neither/);
    expect(textureRightsProblem({ ...base, licence, localOnly: { reason: "r", publicReplacement: "material-colour" } })).toMatch(/both/);
    expect(textureRightsProblem({ ...base, localOnly: { reason: "  ", publicReplacement: "material-colour" } })).toMatch(/no reason/);
  });

  it("passes a licence alone or a local-only declaration alone", () => {
    expect(textureRightsProblem({ ...base, licence })).toBeNull();
    expect(textureRightsProblem({ ...base, localOnly: { reason: "origin unknown", publicReplacement: "material-colour" } })).toBeNull();
  });

  it("holds for every texture the catalogue references; no texture is local-only now", () => {
    const textures: [string, TextureRef][] = [];
    for (const id of catalogue.ids()) {
      const texture = catalogue.get(id).visual.texture;
      if (texture !== undefined) textures.push([id, texture]);
    }
    expect(textures.map(([id]) => id)).toEqual(["sun", "earth", "moon", "mercury", "venus", "mars", "jupiter", "io", "europa", "ganymede", "callisto"]);
    // The Sun's map is from the same Solar System Scope set, so it is licensed like the planets'.
    for (const [id, texture] of [textures[0], ...textures.slice(3, 7)]) {
      expect(textureRightsProblem(texture), id).toBeNull();
      expect(texture.licence?.licence, id).toBe("CC BY 4.0");
      expect(texture.localOnly, id).toBeUndefined();
    }
    // Io's, Europa's, Ganymede's and Callisto's maps are USGS public-domain mosaics (T-098 for the last three), and Earth and the Moon are NASA
    // products (I-029), so all are licensed rather than local-only.
    for (const [id, texture] of [...textures.slice(7, 11), textures[1], textures[2]]) {
      expect(textureRightsProblem(texture), id).toBeNull();
      expect(texture.licence?.licence, id).toBe("public domain");
      expect(texture.localOnly, id).toBeUndefined();
    }
    expect(textures[1][1].url).toContain("earth-bmng-july");
    expect(textures[1][1].licence?.attribution).toBe("NASA Earth Observatory (Blue Marble: Next Generation, Reto Stöckli)");
    expect(textures[1][1].licence?.url).toContain("science.nasa.gov/earth/earth-observatory/blue-marble-next-generation");
    expect(textures[2][1].url).toContain("moon-lroc");
    expect(textures[2][1].licence?.attribution).toBe("NASA's Scientific Visualization Studio");
    expect(textures[2][1].licence?.url).toBe("https://svs.gsfc.nasa.gov/4720");
  });
});
