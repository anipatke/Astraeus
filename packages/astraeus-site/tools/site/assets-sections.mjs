// O-033 T-120: the planet moon sections and the tagged-places section of assets.html, generated from the data (moon lists, body packages, planet settings).
// `node tools/site/assets-sections.mjs` rewrites the marked blocks in assets.html; tests/assetsSections.test.ts fails when the page differs from this output.
// Jupiter's own section stays with tools/import/jupiter-moon-catalogue.mjs. Same markup and styles as that section (details.moon-family, ul.moon-list).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { isSurfacePlace } from "astraeus-demo-planets/experiences/planets/surfacePlace.mjs";

const root = new URL("../../", import.meta.url);
// Body and moon data are the engine's; the planet settings are the Planets demo's.
const engine = new URL("../../../astraeus/", import.meta.url);
const planets = new URL("../../../astraeus-demo-planets/", import.meta.url);
const readJson = (path, base = engine) => JSON.parse(readFileSync(new URL(path, base), "utf8"));
const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** The planets whose moons get a catalogue section here (Jupiter's is generated elsewhere). */
export const MOON_PLANETS = ["mars", "saturn", "uranus", "neptune", "pluto"];

const sourceName = (source) => source.title.split(/[,(]| \(/)[0];

function moonSection(planet) {
  const data = readJson(`data/moons/${planet}.json`);
  const name = planet[0].toUpperCase() + planet.slice(1);
  let html = `  <section data-planet-moons="${planet}" id="moons-${planet}">\n    <div class="wrap">\n      <div class="head">\n        <h2>${name}'s moons</h2>\n        <p>All ${data.moons.length} moons JPL Horizons lists for ${name}, by family, as of ${data.asOf}. The family, size and discovery year of each moon are below. Sizes marked "est." are estimates from brightness. Moons with a map are drawn as globes in the planets demo; the others are dots in their family colour.</p>\n      </div>\n`;
  data.families.forEach((family, index) => {
    const members = data.moons.filter((moon) => moon.family === family.id);
    const sources = family.sources.map((id) => sourceName(data.sources[id])).join("; ");
    html += `      <details class="moon-family" data-planet-family="${planet}/${family.id}" data-count="${members.length}"${index === 0 ? " open" : ""}>\n        <summary><h3>${esc(family.label)} <span class="sub">${members.length}</span></h3></summary>\n        <p class="fam-note">${esc(family.description)} Source: ${esc(sources)}.</p>\n        <ul class="moon-list">\n`;
    for (const moon of members) {
      const extra = moon.bodyPackage !== null ? " · textured, with tagged places" : "";
      html += `          <li data-planet-moon="${planet}/${moon.id}"><b>${esc(moon.name)}</b> <span>${moon.meanRadiusKm} km${moon.radiusBasis === "estimate" ? " (est.)" : ""} · ${moon.discoveryYear}${extra}</span></li>\n`;
    }
    html += `        </ul>\n      </details>\n`;
  });
  const links = Object.values(data.sources).map((source) => `<a href="${esc(source.url)}">${esc(sourceName(source))}</a>`).join("; ");
  html += `      <p class="fam-note">Sources: ${links}. Each moon's own source ids are in <code>data/moons/${planet}.json</code>.</p>\n    </div>\n  </section>\n`;
  return html;
}

/** The places each planet's view draws, by body: the bodies its settings file lists in `bodyFeatures`, with the surface places of each (the builder's own rule, so the page cannot disagree with the app). */
function shownPlaces() {
  const shown = new Map();
  for (const file of readdirSync(new URL("data/planets/", planets))) {
    for (const body of readJson(`data/planets/${file}`, planets).bodyFeatures ?? []) {
      const list = readJson(`data/bodies/${body}/features.json`).features;
      shown.set(body, list.filter(isSurfacePlace).length);
    }
  }
  return shown;
}

function placesSection() {
  const index = readJson("data/bodies/catalogue.json");
  const shown = shownPlaces();
  let total = 0;
  let body = "";
  for (const entry of index.bodies) {
    const features = readJson(`data/bodies/${entry.body}/features.json`);
    const categories = readJson(`data/bodies/${entry.body}/categories.json`).categories;
    const overview = readJson(`data/bodies/${entry.body}/overview.json`).overview;
    const list = features.features;
    total += list.length;
    const label = (key) => categories.find((category) => category.key === key)?.label ?? key;
    const used = categories.map((category) => ({ category, n: list.filter((f) => f.category === category.key).length })).filter((c) => c.n > 0);
    const sources = overview.sources.map((s) => `<a href="${esc(s.url)}">${esc(s.label)}</a>`).join("; ");
    const inApp = shown.has(entry.body);
    const shownCount = shown.get(entry.body);
    body += `      <details class="moon-family" data-places-body="${entry.body}" data-count="${list.length}" data-shown="${inApp ? "yes" : "no"}"${inApp ? ` data-shown-count="${shownCount}"` : ""}>\n        <summary><h3>${esc(features.name)} <span class="sub">${list.length}</span></h3></summary>\n`;
    body += `        <p class="fam-note">${list.length} places in ${used.length} categories (${used.map((c) => `${esc(c.category.label)} ${c.n}`).join(", ")}). ${!inApp ? "Not in the app yet." : shownCount === list.length ? "Shown in the app." : `Shown in the app: ${shownCount} of ${list.length} (the rest are ring or moon entries without a surface position).`} Sources: ${sources || "none recorded"}.</p>\n        <ul class="moon-list">\n`;
    for (const feature of list) body += `          <li data-place="${entry.body}/${esc(feature.id)}"><b>${esc(feature.name)}</b> <span>${esc(feature.featureType)} · ${esc(label(feature.category))}</span></li>\n`;
    body += `        </ul>\n      </details>\n`;
  }
  return `  <section id="tagged-places">\n    <div class="wrap">\n      <div class="head">\n        <h2>Tagged places</h2>\n        <p>${total} named places on ${index.bodies.length} bodies, from Planetary Explorer (the owner's own project), each with its category and where it is on the surface. The coordinates are carried over exactly as checked there.</p>\n      </div>\n${body}    </div>\n  </section>\n`;
}

/** The text between the marker lines, as the page must hold it. */
export function generatedBlocks() {
  return {
    "planet-moons": MOON_PLANETS.map(moonSection).join(""),
    "tagged-places": placesSection(),
  };
}

export const markers = (name) => ({ start: `  <!-- ${name}:start (generated by tools/site/assets-sections.mjs) -->\n`, end: `  <!-- ${name}:end -->\n` });

/** The page with each block replaced, or inserted before the Credits section when the page has none yet. */
export function withBlocks(page) {
  let out = page;
  for (const [name, block] of Object.entries(generatedBlocks())) {
    const { start, end } = markers(name);
    const text = start + block + end;
    const pattern = new RegExp(`  <!-- ${name}:start[\\s\\S]*?<!-- ${name}:end -->\\n`);
    if (pattern.test(out)) out = out.replace(pattern, () => text);
    else {
      const anchor = "  <section>\n    <div class=\"wrap\">\n      <div class=\"head\">\n        <h2>Credits</h2>";
      if (!out.includes(anchor)) throw new Error("credits anchor not found in assets.html");
      out = out.replace(anchor, () => text + "\n" + anchor);
    }
  }
  return out;
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const path = new URL("assets.html", root);
  const before = readFileSync(path, "utf8");
  const after = withBlocks(before);
  if (after !== before) writeFileSync(path, after);
  console.log(after === before ? "assets.html already up to date" : "assets.html updated");
}
