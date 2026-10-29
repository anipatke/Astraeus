import { describe, expect, it } from "vitest";
import { catalogue } from "astraeus/assets/catalogue";
import type { AssetLicence } from "astraeus/assets/licence";
import { PICTURES } from "astraeus-data";
import { HYG_STAR_LICENCE } from "astraeus/assets/sky";
import html from "../assets.html?raw";
import starFileText from "astraeus/assets/stars/hyg-v42-naked-eye.json?raw";
import apolloPanels from "astraeus-demo-apollo11/data/stories/apollo11/panels.json";
import geminidsPanels from "astraeus-demo-showers/data/stories/geminids/panels.json";
import jupiterIoPanels from "astraeus-demo-planets/data/stories/jupiter-io/panels.json";
import perseidsPanels from "astraeus-demo-showers/data/stories/perseids/panels.json";

/**
 * T-064: every credit on the assets page is checked against the AssetLicence record it describes (PROV-02), so a record
 * and the page cannot drift apart unnoticed. The page is plain HTML, read here as text.
 */
const decode = (text: string): string => text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");

interface CreditRow { readonly title: string; readonly licence: string; readonly text: string; readonly status: string }

const creditsHtml = html.slice(html.indexOf("<h2>Credits</h2>"), html.indexOf("<h2>How it is made</h2>"));
const rows = new Map<string, CreditRow>();
for (const m of creditsHtml.matchAll(/<div class="row"><div><h3>(.*?)<\/h3><span class="sub">(.*?)<\/span><\/div><p class="lic">(.*?)<\/p><p><\/p><span class="st (\w+)">/g)) {
  rows.set(decode(m[1]), { title: decode(m[1]), licence: decode(m[2]), text: decode(m[3]), status: m[4] });
}

const bodyRecord = (id: string): AssetLicence => {
  const licence = catalogue.get(id).visual.texture?.licence;
  if (licence === undefined) throw new Error(`${id} has no texture licence`);
  return licence;
};
/** The short label a row or card shows for a full licence string in a record; a record with any other licence fails the test. */
const SHORT_LICENCE: Readonly<Record<string, string>> = {
  "NASA/JPL image use policy: credit required (donor credits list: NASA/JPL, attribution required)": "NASA/JPL",
  "USGS use constraint: please cite authors": "Cite authors",
};
const shortLicence = (licence: string): string => {
  if (!/^(CC BY|public domain)/i.test(licence) && SHORT_LICENCE[licence] === undefined) throw new Error(`no short label for the licence "${licence}"`);
  return SHORT_LICENCE[licence] ?? licence;
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
  { row: "Milky Way panorama", records: [PICTURES["milky-way"]!.licence!], credit: ["Kevinmloch (bsrender)", "Gaia EDR3"], linked: true },
  { row: "Sun, Mercury, Mars, Jupiter maps", records: ["sun", "mercury", "mars", "jupiter"].map(bodyRecord), credit: ["Solar System Scope (solarsystemscope.com/textures)"], linked: true },
  { row: "Venus map", records: [bodyRecord("venus")], credit: ["USGS Astrogeology / NASA Magellan"], linked: true },
  { row: "Io map", records: [bodyRecord("io")], credit: ["USGS Astrogeology Science Center", "NASA/JPL Galileo and Voyager missions"], linked: false },
  { row: "Earth map", records: [bodyRecord("earth")], credit: ["NASA Earth Observatory (Blue Marble: Next Generation, Reto Stöckli)"], linked: true },
  // T-120: the maps added by O-033. Each row's short licence label stands for the full record string, named in SHORT_LICENCE.
  { row: "Saturn, Uranus, Neptune maps", records: ["saturn", "uranus", "neptune"].map(bodyRecord), credit: ["Solar System Scope (solarsystemscope.com/textures)"], linked: true },
  { row: "Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus maps", records: ["mimas", "enceladus", "tethys", "dione", "rhea", "titan", "iapetus"].map(bodyRecord), credit: ["NASA/JPL-Caltech/Space Science Institute"], linked: false },
  { row: "Triton map", records: [bodyRecord("triton")], credit: ["NASA/JPL-Caltech/Lunar & Planetary Institute"], linked: false },
  { row: "Pluto map", records: [bodyRecord("pluto")], credit: ["NASA/JHUAPL/SwRI"], linked: true },
  { row: "Charon map", records: [bodyRecord("charon")], credit: ["USGS Astrogeology"], linked: false },
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
        expect(row.licence.toLowerCase(), record.source).toBe(shortLicence(record.licence).toLowerCase());
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

  it("every credit row is marked as shipped, and the page lists no CAMS, Yale or local-only entry", () => {
    for (const claim of claims) expect(rows.get(claim.row)?.status, claim.row).toBe("ok");
    for (const row of rows.values()) expect(row.status, row.title).not.toBe("local");
    expect([...rows.keys()].join(" ")).not.toMatch(/CAMS|Yale/);
    expect(html).not.toMatch(/st local|This machine only|CAMS/);
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
    const pictures = html.slice(html.indexOf("<h2>Surface pictures</h2>"), html.indexOf("<h2>Credits</h2>"));
    const cards = new Map<string, string>();
    for (const m of pictures.matchAll(/<h3>(\w+)<\/h3>.*?<div class="meta"><span>(.*?)<\/span>/g)) cards.set(m[1].toLowerCase(), decode(m[2]));
    expect([...cards.keys()]).toEqual(["sun", "mercury", "venus", "earth", "moon", "mars", "jupiter", "io", "saturn", "uranus", "neptune", "pluto", "mimas", "enceladus", "tethys", "dione", "rhea", "titan", "iapetus", "triton", "charon"]);
    for (const [id, chip] of cards) {
      const licence = shortLicence(bodyRecord(id).licence);
      // The NASA maps carry the short label "NASA" for their public-domain record.
      const expected = licence === "public domain" && (id === "earth" || id === "moon") ? "NASA" : licence;
      expect(chip.toLowerCase(), id).toBe(expected.toLowerCase());
    }
  });

  // I-046: the Story panels row counted the badges by hand twice and drifted; it is now counted from the panel files.
  it("the Story panels row gives the panel total and badge counts the story files hold", () => {
    const files: readonly { readonly panels: readonly { readonly badge: string }[] }[] = [apolloPanels, geminidsPanels, jupiterIoPanels, perseidsPanels];
    const panels = files.flatMap((file) => file.panels);
    const count = (badge: string): number => panels.filter((panel) => panel.badge === badge).length;
    const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
    const row = decode(html.slice(html.indexOf("<h3>Story panels</h3>"), html.indexOf("</div>", html.indexOf('<span class="num">', html.indexOf("<h3>Story panels</h3>")))));
    expect(row).toContain(`<span class="num">${panels.length}<small>panels</small>`);
    const sentence = `${words[count("observed")]} panels are marked observed, ${words[count("modelled")]} modelled and ${words[count("illustrative")]} illustrative`;
    expect(row.toLowerCase()).toContain(sentence);
    expect(count("observed") + count("modelled") + count("illustrative")).toBe(panels.length);
  });
});
