import { describe, expect, it } from "vitest";
import { catalogue } from "../src/assets/catalogue";
import { LOCAL_ONLY_TEXTURES, publicBuildAliases } from "../vite.config";
import { findLocalOnlySources, proveItFails } from "../tools/validate/public-build-assets.mjs";

const basename = (url: string) => url.slice(url.lastIndexOf("/") + 1).split("?")[0];

describe("public build texture exclusion (design C.3)", () => {
  const localOnly = catalogue.ids().flatMap((id) => {
    const texture = catalogue.get(id).visual.texture;
    return texture?.localOnly === undefined ? [] : [basename(texture.url)];
  });

  it("aliases exactly the textures the records declare local-only", () => {
    expect([...LOCAL_ONLY_TEXTURES].sort()).toEqual([...localOnly].sort());
    expect(findLocalOnlySources().map((source) => source.file).sort()).toEqual([...localOnly].sort());
  });

  it("matches the import specifiers the body records use, whatever the folder depth, and nothing else", () => {
    const aliases = publicBuildAliases();
    expect(aliases).toHaveLength(LOCAL_ONLY_TEXTURES.length);
    for (const file of LOCAL_ONLY_TEXTURES) {
      expect(aliases.some((alias) => alias.find.test(`../textures/${file}`))).toBe(true);
      expect(aliases.some((alias) => alias.find.test(`../../textures/${file}`))).toBe(true);
    }
    expect(aliases.some((alias) => alias.find.test("../textures/public-placeholder.png"))).toBe(false);
    expect(aliases.some((alias) => alias.find.test("three"))).toBe(false);
  });

  it("fails on a fake unlicensed texture, copied or embedded, and passes a clean build", () => {
    const { clean, copied, embedded } = proveItFails();
    expect(clean.ok).toBe(true);
    expect(clean.matches).toEqual([]);
    expect(copied.ok).toBe(false);
    expect(copied.matches.map((match) => match.how)).toEqual(["identical file"]);
    expect(embedded.ok).toBe(false);
    expect(embedded.matches.map((match) => match.how)).toEqual(["embedded as base64"]);
  });
});
