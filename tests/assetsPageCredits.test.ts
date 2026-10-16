import { describe, expect, it } from "vitest";
import { catalogue } from "../src/assets/catalogue";
import type { AssetLicence } from "../src/assets/licence";
import { HYG_STAR_LICENCE, MILKY_WAY_LICENCE } from "../src/assets/sky";
import html from "../assets.html?raw";
import starFileText from "../src/assets/stars/hyg-v42-naked-eye.json?raw";

/**
 * T-064: every credit on the assets page is checked against the AssetLicence record it describes (PROV-02), so a record
 * and the page cannot drift apart unnoticed. The page is plain HTML, read here as text.
 */
const decode = (text: string): string => text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");

interface CreditRow { readonly title: string; readonly licence: string; readonly text: string; readonly status: string }

const creditsHtml = html.slice(html.indexOf("<h2>Credits</h2>"), html.indexOf("<h2>Wish list</h2>"));
const rows = new Map<string, CreditRow>();
for (const m of creditsHtml.matchAll(/<div class="row"><div><h3>(.*?)<\/h3><span class="sub">(.*?)<\/span><\/div><p class="lic">(.*?)<\/p><p><\/p><span class="st (\w+)">/g)) {
  rows.set(decode(m[1]), { title: decode(m[1]), licence: decode(m[2]), text: decode(m[3]), status: m[4] });
}

const bodyRecord = (id: string): AssetLicence => {
  const licence = catalogue.get(id).visual.texture?.licence;
  if (licence === undefined) throw new Error(`${id} has no texture licence`);
  return licence;
};
const stripUrl = (url: string): string => url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

interface Claim {
  /** The credit row's heading on the page. */
  readonly row: string;
  /** The records the row describes. */
  readonly records: readonly AssetLicence[];
  /** Credit words the row must carry; each must also appear in every record's own attribution. */
  readonly credit: readonly string[];
  /** The row must show a link that is a prefix of the record's URL. */
  readonly linked: boolean;
}

const claims: readonly Claim[] = [
  { row: "Milky Way panorama", records: [MILKY_WAY_LICENCE], credit: ["ESO/S. Brunier"], linked: true },
  { row: "Sun, Mercury, Venus, Mars, Jupiter maps", records: ["sun", "mercury", "venus", "mars", "jupiter"].map(bodyRecord), credit: ["Solar System Scope (solarsystemscope.com/textures)"], linked: true },
  { row: "Io map", records: [bodyRecord("io")], credit: ["USGS Astrogeology Science Center", "NASA/JPL Galileo and Voyager missions"], linked: false },
  { row: "Earth map", records: [bodyRecord("earth")], credit: ["NASA Earth Observatory (Blue Marble: Next Generation, Reto Stöckli)"], linked: true },
  { row: "Moon map", records: [bodyRecord("moon")], credit: ["NASA's Scientific Visualization Studio"], linked: true },
  { row: "Bright stars", records: [HYG_STAR_LICENCE], credit: ["HYG database v4.2", "astronexus"], linked: true },
];

describe("assets page credits match the AssetLicence records (T-064)", () => {
  it("finds every credit row on the page", () => {
    expect(rows.size).toBeGreaterThanOrEqual(claims.length);
    for (const claim of claims) expect(rows.has(claim.row), claim.row).toBe(true);
  });

  for (const claim of claims) {
    it(`${claim.row}: licence, credit line and link agree with the record`, () => {
      const row = rows.get(claim.row);
      if (row === undefined) throw new Error(`no credit row "${claim.row}"`);
      for (const record of claim.records) {
        expect(row.licence.toLowerCase(), record.source).toBe(record.licence.toLowerCase());
        for (const words of claim.credit) {
          expect(record.attribution ?? "", `record for ${claim.row} lacks "${words}"`).toContain(words);
          expect(row.text, `page row ${claim.row} lacks "${words}"`).toContain(words);
        }
        if (claim.linked) {
          const wanted = stripUrl(record.url);
          const shown = [...row.text.matchAll(/[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s,;)]*)?/gi)].map((m) => m[0].replace(/[.]+$/, ""));
          expect(shown.some((link) => wanted.startsWith(stripUrl(link)) && link.includes("/")), `${claim.row} shows no link under ${wanted}`).toBe(true);
        }
      }
    });
  }

  it("shipped rows are not marked local-only, and the Yale and CAMS rows are", () => {
    for (const claim of claims) expect(rows.get(claim.row)?.status, claim.row).toBe("ok");
    expect(rows.get("Yale stars (option)")?.status).toBe("local");
    expect(rows.get("Yale stars (option)")?.text).toContain("never shipped");
    expect(rows.get("CAMS")?.status).toBe("local");
  });

  it("states that CC BY-SA 4.0 covers the star file only, as the record's file header does", () => {
    const stars = rows.get("Bright stars");
    expect(stars?.licence).toBe("CC BY-SA 4.0");
    expect(stars?.text).toContain("covers this star file only");
    expect(stars?.text).toContain("the code stays MIT");
    const header = JSON.parse(starFileText) as { provenance: { licence: string } };
    expect(header.provenance.licence).toBe(HYG_STAR_LICENCE.licence);
  });

  it("each surface-picture card names the licence its record gives", () => {
    const pictures = html.slice(html.indexOf("<h2>Surface pictures</h2>"), html.indexOf("<h2>Where things are</h2>"));
    const cards = new Map<string, string>();
    for (const m of pictures.matchAll(/<h3>(\w+)<\/h3>.*?<div class="meta"><span>(.*?)<\/span>/g)) cards.set(m[1].toLowerCase(), decode(m[2]));
    expect([...cards.keys()]).toEqual(["sun", "mercury", "venus", "earth", "moon", "mars", "jupiter", "io"]);
    for (const [id, chip] of cards) {
      const licence = bodyRecord(id).licence;
      // The NASA maps carry the short label "NASA" for their public-domain record.
      const expected = licence === "public domain" && (id === "earth" || id === "moon") ? "NASA" : licence;
      expect(chip.toLowerCase(), id).toBe(expected.toLowerCase());
    }
  });
});
