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

  it("holds for every texture the catalogue references; Earth and the original Moon map are declared local-only", () => {
    const textures: [string, TextureRef][] = [];
    for (const id of catalogue.ids()) {
      const texture = catalogue.get(id).visual.texture;
      if (texture !== undefined) textures.push([id, texture]);
    }
    expect(textures.map(([id]) => id)).toEqual(["earth", "moon", "mercury", "venus", "mars"]);
    for (const [id, texture] of textures.slice(2)) {
      expect(textureRightsProblem(texture), id).toBeNull();
      expect(texture.licence?.licence, id).toBe("CC BY 4.0");
      expect(texture.localOnly, id).toBeUndefined();
    }
    for (const [, texture] of textures.slice(0, 2)) {
      expect(textureRightsProblem(texture)).toBeNull();
      expect(texture.localOnly?.reason.length).toBeGreaterThan(20);
    }
    expect(textures[0][1].url).toContain("earth-2k");
    expect(textures[0][1].localOnly?.publicReplacement).toBe("material-colour");
    expect(textures[1][1].url).toContain("moon-orig-2k");
    const moonReplacement = textures[1][1].localOnly?.publicReplacement;
    expect(moonReplacement).not.toBe("material-colour");
    expect(typeof moonReplacement === "object" && moonReplacement.licence.licence).toBe("public domain");
  });
});
