import { describe, expect, it, vi } from "vitest";
import { DEFAULT_STAR_SOURCE, HYG_STAR_LICENCE, LOCAL_STAR_URL, STAR_SOURCES, eqjUnit, loadStarCatalogue, parseStarFile, starSourceFromSearch, type StarRow } from "../src/assets/sky";
import { textureRightsProblem } from "../src/assets/licence";
import { ATTRIBUTION, HYG_LICENCE, HYG_URL, MAGNITUDE_LIMIT, parseHyg, splitCsvLine, starFile } from "../tools/data/fetch-hyg-stars.mjs";

const ARCSEC = Math.PI / 180 / 3600;
const angleBetween = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
const toUnit = (star: StarRow) => eqjUnit(star[0], star[1]);

const hygText = Object.values(import.meta.glob("../src/assets/stars/hyg-v42-naked-eye.json", { query: "?raw", import: "default", eager: true }) as Record<string, string>)[0];
const hyg = parseStarFile(JSON.parse(hygText));
const yaleGlob = import.meta.glob("../data/local/yale-bsc-v65.json", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const haveYale = Object.keys(yaleGlob).length === 1;
const skipReason = "skipped: data/local/yale-bsc-v65.json is not fetched on this machine (run node tools/data/fetch-stars.mjs)";

// Published J2000 positions (h m s, d m s), written out independently of the code; the same five as tests/sky.test.ts.
const NAMED = [
  { name: "Sirius", ra: 15 * (6 + 45 / 60 + 8.917 / 3600), dec: -(16 + 42 / 60 + 58.02 / 3600), v: -1.46 },
  { name: "Polaris", ra: 15 * (2 + 31 / 60 + 49.09 / 3600), dec: 89 + 15 / 60 + 50.8 / 3600, v: 2.0 },
  { name: "Betelgeuse", ra: 15 * (5 + 55 / 60 + 10.305 / 3600), dec: 7 + 24 / 60 + 25.43 / 3600, v: 0.5 },
  { name: "Vega", ra: 15 * (18 + 36 / 60 + 56.336 / 3600), dec: 38 + 47 / 60 + 1.29 / 3600, v: 0.03 },
  { name: "Algol", ra: 15 * (3 + 8 / 60 + 10.132 / 3600), dec: 40 + 57 / 60 + 20.33 / 3600, v: 2.1 },
];

describe("HYG star asset (T-060)", () => {
  it("holds the naked-eye stars, V 6.5 or brighter, with Sirius the brightest", () => {
    expect(hyg.stars.length).toBeGreaterThan(8500);
    expect(hyg.stars.length).toBeLessThan(9500);
    expect(Math.max(...hyg.stars.map((star) => star[2]))).toBeLessThanOrEqual(MAGNITUDE_LIMIT);
    expect(hyg.stars.reduce((a, b) => (b[2] < a[2] ? b : a))[2]).toBeCloseTo(-1.44, 1);
    expect(hyg.provenance?.count).toBe(hyg.stars.length);
  });

  it("finds the five named stars within 3 arcsec of the published J2000 positions and within 0.5 mag of their usual V", () => {
    for (const named of NAMED) {
      const target = eqjUnit(named.ra, named.dec);
      const near = hyg.stars.filter((star) => angleBetween(toUnit(star), target) < 3 * ARCSEC && Math.abs(star[2] - named.v) < 0.5);
      expect(near.length, named.name).toBeGreaterThanOrEqual(1);
    }
  });

  it("records the licence (PROV-02): CC BY-SA 4.0, version, URL and access date, equal to the app's AssetLicence", () => {
    expect(hyg.provenance).toMatchObject({
      version: "4.2",
      source: HYG_URL,
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      accessed: HYG_STAR_LICENCE.accessed,
      attribution: ATTRIBUTION,
      licenceScope: "This file only. The Astraeus code is MIT.",
    });
    expect(HYG_STAR_LICENCE.licence).toBe(HYG_LICENCE);
    expect(HYG_STAR_LICENCE.attribution).toMatch(/astronexus/);
    // An AssetLicence is a texture-style record; the same rule (a licence, not local-only) holds for the star file.
    expect(textureRightsProblem({ url: "x", widthPx: 1, heightPx: 1, licence: HYG_STAR_LICENCE })).toBeNull();
  });

  it("stays under 330 KB, so it is cheap to ship", () => {
    expect(new TextEncoder().encode(hygText).length).toBeLessThan(330_000);
  });
});

describe("HYG fetch tool parsing", () => {
  const header = '"id","hip","hd","hr","gl","bf","proper","ra","dec","dist","pmra","pmdec","rv","mag","absmag","spect","ci"';
  const row = (id: string, ra: string, dec: string, mag: string, ci: string, proper = '""') => `${id},1,2,3,"","",${proper},${ra},${dec},10,0,0,0,${mag},1,K0,${ci}`;

  it("splits quoted fields, including a comma and a doubled quote inside a name", () => {
    expect(splitCsvLine('1,"a, b","say ""hi""",,x')).toEqual(["1", "a, b", 'say "hi"', "", "x"]);
  });

  it("keeps V <= 6.5, converts hours to degrees, skips the Sun and rows without a position or magnitude, and nulls a missing colour", () => {
    const text = [
      header,
      row("0", "0.0", "0.0", "-26.7", "0.656", "Sol"),
      row("1", "6.75", "-16.7", "-1.44", "0.00", '"Sirius"'),
      row("2", "12.0", "10.0", "6.5", ""),
      row("3", "12.0", "10.0", "6.51", "0.5"),
      row("4", "", "10.0", "3.0", "0.5"),
      row("5", "5.0", "95.0", "3.0", "0.5"),
      row("6", "5.0", "10.0", "", "0.5"),
    ].join("\n");
    const parsed = parseHyg(text);
    expect(parsed.records).toBe(7);
    expect(parsed.skipped).toBe(4);
    expect(parsed.stars).toEqual([[101.25, -16.7, -1.44, 0], [180, 10, 6.5, null]]);
    expect(parseStarFile(starFile(parsed, "2026-10-16")).stars).toHaveLength(2);
    expect(starFile(parsed, "2026-10-16").provenance).toMatchObject({ licence: "CC BY-SA 4.0", accessed: "2026-10-16", count: 2 });
  });

  it("rejects a header without the columns it needs", () => {
    expect(() => parseHyg('"id","ra"\n1,2')).toThrow(/no "dec" column/);
  });
});

describe("star source choice", () => {
  it("defaults to HYG and takes ?stars=yale as the option", () => {
    expect(DEFAULT_STAR_SOURCE).toBe("hyg");
    expect([...STAR_SOURCES]).toEqual(["hyg", "yale"]);
    expect(starSourceFromSearch("")).toBe("hyg");
    expect(starSourceFromSearch("?stars=yale")).toBe("yale");
    expect(starSourceFromSearch("?stars=hyg")).toBe("hyg");
    expect(starSourceFromSearch("?stars=other")).toBe("hyg");
  });

  it("loads HYG by default, and falls back to HYG when the Yale file is absent", async () => {
    const requested: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      requested.push(url);
      return url === LOCAL_STAR_URL ? new Response("<html></html>", { status: 404 }) : new Response(hygText, { status: 200 });
    });
    try {
      const fallback = await loadStarCatalogue("yale");
      expect(requested[0]).toBe(LOCAL_STAR_URL);
      expect(fallback?.source).toBe("hyg");
      expect(fallback?.stars.length).toBe(hyg.stars.length);
      expect((await loadStarCatalogue("hyg"))?.source).toBe("hyg");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

// Yale and HYG list the same bright stars; the local Yale file carries no catalogue ids, so shared stars are paired by position
// (each Yale star with its nearest HYG star within 30 arcsec). HYG's own ids are Yale's HR numbers, so a pairing off by a different
// star would show as a large position or magnitude error.
describe.skipIf(!haveYale)(`HYG against the Yale set, shared stars (J2000) ${haveYale ? "" : skipReason}`, () => {
  const yale = (): readonly StarRow[] => parseStarFile(JSON.parse(Object.values(yaleGlob)[0])).stars;
  const hygUnits = hyg.stars.map(toUnit);
  const pairs = () => yale().flatMap((star) => {
    const unit = toUnit(star);
    let best = -1;
    let bestAngle = Infinity;
    hygUnits.forEach((other, i) => {
      const angle = angleBetween(unit, other);
      if (angle < bestAngle) { bestAngle = angle; best = i; }
    });
    return bestAngle < 30 * ARCSEC ? [{ yale: star, hyg: hyg.stars[best], arcsec: bestAngle / ARCSEC, dMag: Math.abs(star[2] - hyg.stars[best][2]) }] : [];
  });
  const percentile = (values: number[], p: number) => [...values].sort((a, b) => a - b)[Math.floor(values.length * p)];

  it("finds a HYG counterpart within 30 arcsec for at least 98% of the Yale stars", () => {
    expect(pairs().length / yale().length).toBeGreaterThanOrEqual(0.98);
  });

  it("agrees in position: median under 1.5 arcsec, 99th percentile under 6 arcsec, none over 20 arcsec", () => {
    const sep = pairs().map((pair) => pair.arcsec);
    expect(percentile(sep, 0.5)).toBeLessThan(1.5);
    expect(percentile(sep, 0.99)).toBeLessThan(6);
    expect(Math.max(...sep)).toBeLessThan(20);
  });

  it("agrees in magnitude: median under 0.03, 95th percentile under 0.15; variables and split binaries differ more, under 1.5 for pairs brighter than V 3", () => {
    const all = pairs();
    const dMag = all.map((pair) => pair.dMag);
    expect(percentile(dMag, 0.5)).toBeLessThan(0.03);
    expect(percentile(dMag, 0.95)).toBeLessThan(0.15);
    expect(Math.max(...all.filter((pair) => pair.yale[2] < 3).map((pair) => pair.dMag))).toBeLessThan(1.5);
  });

  it("keeps the brightest sky: the same stars brighter than V 2 are in both (within 15 arcsec, one star may be a split pair)", () => {
    const brightYale = yale().filter((star) => star[2] < 2);
    const found = pairs().filter((pair) => pair.yale[2] < 2);
    expect(found.length).toBeGreaterThanOrEqual(brightYale.length - 1);
    for (const pair of found) expect(pair.arcsec).toBeLessThan(15);
  });
});
