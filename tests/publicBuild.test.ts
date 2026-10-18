import vercelText from "../vercel.json?raw";
import { describe, expect, it } from "vitest";
import { catalogue } from "../src/assets/catalogue";
import { LOCAL_ONLY_TEXTURES, publicBuildAliases } from "../vite.config";
import { proveSyntheticCheck, SYNTHETIC_KEYS, proveStarAssetHandling, STAR_ASSET, findLocalOnlySources, proveItFails, proveLicenceHandling, SHIPPABLE_LICENCES as VALIDATOR_LICENCES } from "../tools/validate/public-build-assets.mjs";
import { BUILD_LIMIT, PAGES, proveLoadBudgetFails, proveSameStemChunks, staticImportsOf } from "../tools/validate/load-budget.mjs";
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

describe("made-up experiences stay out of the public build (T-068)", () => {
  it("fails a build that holds a synthetic chunk or an entry key, and passes a clean one", () => {
    const { clean, chunk, key } = proveSyntheticCheck();
    expect(clean.ok).toBe(true);
    expect(clean.modules.length).toBeGreaterThan(0);
    expect(chunk.matches.map((match) => match.how)).toEqual(["file name"]);
    expect(key.matches.map((match) => match.how)).toEqual(["entry key synthetic-ring"]);
  });

  it("lists the same entry keys main.tsx mounts in development", async () => {
    const { readFileSync } = await (import(/* @vite-ignore */ `node:${"fs"}`) as Promise<any>);
    const entry = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8") as string;
    const mounted = [...entry.matchAll(/^\s+"?(synthetic[\w-]*)"?: async/gm)].map((match) => match[1]);
    expect([...SYNTHETIC_KEYS].sort()).toEqual(mounted.sort());
  });
});

describe("first-load size budget (T-070)", () => {
  it("fails a page over its limit, a stale page set, an eager script the set does not list, and an unlisted heavy file; passes a build within its limits", () => {
    const proof = proveLoadBudgetFails();
    expect(proof.within.ok).toBe(true);
    expect(proof.heavier.ok).toBe(false);
    expect(proof.heavier.pages[0].problems.join(" ")).toMatch(/raw is over the limit of 6000/);
    expect(proof.missing.ok).toBe(false);
    expect(proof.missing.pages[0].problems.join(" ")).toMatch(/picture\.jpg is not in the build/);
    expect(proof.unlistedImport.ok).toBe(false);
    expect(proof.unlistedImport.pages[0].problems.join(" ")).toMatch(/imports assets\/extra-AbCdEf12\.js, which the page set does not list/);
    expect(proof.unlistedFile.ok).toBe(false);
    expect(proof.unlistedFile.pages[proof.unlistedFile.pages.length - 1]?.id).toBe("whole build");
  });

  it("lists only the same-named chunks a page's scripts import when the bundler splits one stem into several (T-089: one panels chunk per story)", () => {
    const proof = proveSameStemChunks();
    expect(proof.first).toMatchObject({ files: 3, problems: [] });
    expect(proof.chained).toMatchObject({ files: 4, problems: [] });
    expect(proof.stemLeftOut.problems.join(" ")).toMatch(/imports assets\/panels-AAAAAAAA\.js, which the page set does not list/);
    expect(proof.notImported.problems.join(" ")).toMatch(/panels\.js names 3 files, none of which a listed script imports/);
  });

  it("holds one positive raw and gzip limit for the site pages, each experience and the whole build, once each", () => {
    const ids = PAGES.map((page) => page.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(["index.html", "assets.html", "app.html (Apollo 11)", "app.html?experience=earth-moon", "app.html?experience=jupiter-io", "app.html?experience=showers", "app.html?experience=showers&shower=geminids"]);
    for (const limit of [...PAGES, BUILD_LIMIT]) {
      expect(limit.rawLimit).toBeGreaterThan(0);
      expect(limit.gzipLimit).toBeGreaterThan(0);
      expect(limit.gzipLimit).toBeLessThanOrEqual(limit.rawLimit);
    }
  });

  it("reads the scripts a built script imports at load, not the ones it imports on demand", () => {
    expect(staticImportsOf('import{U as e}from"./app-AbCdEf12.js";import"./eph-AbCdEf12.js";const f=()=>import(`./later-AbCdEf12.js`);')).toEqual(["assets/app-AbCdEf12.js", "assets/eph-AbCdEf12.js"]);
  });
});

describe("site caching rule (O-024 T-095)", () => {
  const config = JSON.parse(vercelText) as { headers: { source: string; headers: { key: string; value: string }[] }[] };

  it("keeps content-hashed files under /assets/ for a year, immutable", () => {
    const rule = config.headers.find((entry) => entry.source === "/assets/(.*)");
    expect(rule?.headers).toEqual([{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]);
  });

  it("sends no long-lived rule for anything outside /assets/, so the HTML pages revalidate", () => {
    expect(config.headers.map((entry) => entry.source)).toEqual(["/assets/(.*)"]);
  });
});
