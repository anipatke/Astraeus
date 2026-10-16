import { describe, expect, it } from "vitest";
import { catalogue } from "../src/assets/catalogue";
import { LOCAL_ONLY_TEXTURES, publicBuildAliases } from "../vite.config";
import { proveStarAssetHandling, STAR_ASSET, findLocalOnlySources, proveItFails, proveLicenceHandling, SHIPPABLE_LICENCES as VALIDATOR_LICENCES } from "../tools/validate/public-build-assets.mjs";
import { SHIPPABLE_LICENCES as TOOL_LICENCES } from "../tools/data/fetch-meteoroid-orbits.mjs";
import { SHIPPABLE_LICENCES } from "../src/experiences/showers/measuredOrbits";

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

  it("fails on fetched data under data/local/, as a copied file, as text inside a script or by its path, and passes a clean build", () => {
    const result = proveItFails();
    expect(result.dataSources).toBe(1);
    expect(result.dataClean.ok).toBe(true);
    expect(result.dataCopied.matches.map((match) => match.how)).toEqual(["identical file"]);
    expect(result.dataEmbedded.matches.map((match) => match.how)).toEqual(["embedded as text"]);
    expect(result.dataPath.matches.map((match) => match.how)).toEqual(["path under data/local"]);
  });
});

describe("shippable measured orbits (T-056)", () => {
  it("keeps the shippable-licence list equal in the loader, the fetch tool and the validator", () => {
    expect([...TOOL_LICENCES]).toEqual([...SHIPPABLE_LICENCES]);
    expect([...VALIDATOR_LICENCES]).toEqual([...SHIPPABLE_LICENCES]);
    expect(SHIPPABLE_LICENCES.some((licence) => /nc|unknown/i.test(licence))).toBe(false);
  });

  it("checks every fetched file that declares no shippable licence (no licence, or a non-commercial one) and passes only a declared CC BY or CC0 file", () => {
    expect(proveLicenceHandling()).toEqual(["data/local/other-nc.json", "data/local/unlicensed-orbits.json", "data/local/unlicensed-stars.json"]);
  });
});


describe("shipped HYG star asset (T-060)", () => {
  const proof = proveStarAssetHandling();

  it("accepts the build that contains the licensed HYG file, whatever the hashed name", () => {
    expect(proof.good.problems).toEqual([]);
    expect(proof.good.ok).toBe(true);
    expect(proof.good.file).toBe(STAR_ASSET);
  });

  it("rejects a build without the star file, so an empty public sky cannot pass", () => {
    expect(proof.empty.ok).toBe(false);
    expect(proof.empty.problems).toEqual(["the build does not contain the star asset"]);
  });

  it("rejects a star file whose licence is not CC BY-SA 4.0 or whose record is incomplete", () => {
    expect(proof.badLicence.ok).toBe(false);
    expect(proof.badLicence.problems.join("; ")).toMatch(/licence "CC BY-NC 4.0" is not one of CC BY-SA 4.0/);
    expect(proof.badLicence.problems.join("; ")).toMatch(/no attribution/);
  });

  it("still rejects an unlicensed star catalogue: a copy of it in the build is found by the data check", () => {
    expect(proveLicenceHandling()).toContain("data/local/unlicensed-stars.json");
    expect(proveItFails().dataCopied.ok).toBe(false);
  });
});
