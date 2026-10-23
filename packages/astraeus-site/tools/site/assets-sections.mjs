// O-033 T-120: the planet moon sections and the tagged-places section of assets.html, generated from the data (moon lists, body packages, planet settings).
// `node tools/site/assets-sections.mjs` rewrites the marked blocks in assets.html; tests/assetsSections.test.ts fails when the page differs from this output.
// I-075: the "Moons" section opens in the moons-overview block and is closed by the page after the planet-moons block; Jupiter's own part (between them)
// stays with tools/import/jupiter-moon-catalogue.mjs. Same markup and styles as that part (details.moon-all, details.moon-family, ul.moon-list).
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
/** The planets in the order the page lists them. */
const OVERVIEW_ORDER = ["jupiter", ...MOON_PLANETS];

const sourceName = (source) => source.title.split(/[,(]| \(/)[0];
const titleCase = (planet) => planet[0].toUpperCase() + planet.slice(1);
const joinNames = (names) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);

/** The opening of the "Moons" section: a summary table, and once the few moons that have their own picture and tagged places (the per-row text it replaces). */
function moonsOverview() {
  const rows = [];
  const pictured = [];
  for (const planet of OVERVIEW_ORDER) {
    const moons = readJson(`data/moons/${planet}.json`).moons;
    const mapped = moons.filter((moon) => moon.bodyPackage !== null);
    rows.push(`          <tr><th scope="row"><a href="#moons-${planet}">${titleCase(planet)}</a></th><td>${moons.length}</td><td>${mapped.length}</td></tr>\n`);
    if (mapped.length > 0) pictured.push(`${joinNames(mapped.map((moon) => esc(moon.name)))} (${titleCase(planet)})`);
  }
  return `  <section id="moons">\n    <div class="wrap">\n      <div class="head">\n        <h2>Moons</h2>\n        <p>Every moon JPL Horizons lists for these planets, by family, with its size and discovery year. Sizes marked "est." or "about" are estimates from brightness. Moons with a map are drawn as globes in the planets demo; the others are dots in their family colour.</p>\n      </div>\n      <table class="tbl">\n        <thead><tr><th scope="col">Planet</th><th scope="col">Moons</th><th scope="col">With a picture</th></tr></thead>\n        <tbody>\n${rows.join("")}        </tbody>\n      </table>\n      <p class="fam-note">Moons with their own picture and tagged places: ${pictured.join("; ")}.</p>\n`;
}

function moonSection(planet) {
  const data = readJson(`data/moons/${planet}.json`);
  const name = titleCase(planet);
  let html = `      <details class="moon-all" data-planet-moons="${planet}" id="moons-${planet}">\n        <summary><h3>${name}'s moons <span class="sub">${data.moons.length}</span></h3><span class="more">Show all ${data.moons.length} moons</span></summary>\n        <p class="fam-note">All ${data.moons.length} moons JPL Horizons lists for ${name}, by family, as of ${data.asOf}. The family, size and discovery year of each moon are below.</p>\n`;
  for (const family of data.families) {
    const members = data.moons.filter((moon) => moon.family === family.id);
    const sources = family.sources.map((id) => sourceName(data.sources[id])).join("; ");
    html += `        <details class="moon-family" data-planet-family="${planet}/${family.id}" data-count="${members.length}"><summary><h3>${esc(family.label)} <span class="sub">${members.length}</span></h3></summary><p class="fam-note">${esc(family.description)} Source: ${esc(sources)}.</p><ul class="moon-list">\n`;
    html += "            " + members.map((moon) => `<li data-planet-moon="${planet}/${moon.id}"><b>${esc(moon.name)}</b> <span>${moon.meanRadiusKm} km${moon.radiusBasis === "estimate" ? " (est.)" : ""} · ${moon.discoveryYear}</span></li>`).join("") + "</ul></details>\n";
  }
  const links = Object.values(data.sources).map((source) => `<a href="${esc(source.url)}">${esc(sourceName(source))}</a>`).join("; ");
  html += `        <p class="fam-note">Sources: ${links}. Each moon's own source ids are in <code>data/moons/${planet}.json</code>.</p>\n      </details>\n`;
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
  let table = "";
  let body = "";
  for (const entry of index.bodies) {
    const features = readJson(`data/bodies/${entry.body}/features.json`);
    const categories = readJson(`data/bodies/${entry.body}/categories.json`).categories;
    const overview = readJson(`data/bodies/${entry.body}/overview.json`).overview;
    const list = features.features;
    total += list.length;
    const used = categories.map((category) => ({ category, n: list.filter((f) => f.category === category.key).length })).filter((c) => c.n > 0);
    const sources = overview.sources.map((s) => `<a href="${esc(s.url)}">${esc(s.label)}</a>`).join("; ");
    const inApp = shown.has(entry.body);
    const shownCount = shown.get(entry.body);
    const inAppText = !inApp ? "Not yet" : shownCount === list.length ? "Yes" : `${shownCount} of ${list.length}`;
    table += `          <tr><th scope="row">${esc(features.name)}</th><td>${list.length}</td><td>${used.length}</td><td>${inAppText}</td></tr>\n`;
    body += `        <div class="place-body" data-places-body="${entry.body}" data-count="${list.length}" data-shown="${inApp ? "yes" : "no"}"${inApp ? ` data-shown-count="${shownCount}"` : ""}>\n          <h3>${esc(features.name)} <span class="sub">${list.length}</span></h3><p class="fam-note">${list.length} places in ${used.length} categories (${used.map((c) => `${esc(c.category.label)} ${c.n}`).join(", ")}). ${!inApp ? "Not in the app yet." : shownCount === list.length ? "Shown in the app." : `Shown in the app: ${shownCount} of ${list.length} (the rest are ring or moon entries without a surface position).`} Sources: ${sources || "none recorded"}.</p>\n`;
    body += `          <p class="place-list">${list.map((feature) => `<span data-place="${entry.body}/${esc(feature.id)}">${esc(feature.name)} (${esc(feature.featureType)})</span>`).join(", ")}</p>\n        </div>\n`;
  }
  return `  <section id="tagged-places">\n    <div class="wrap">\n      <div class="head">\n        <h2>Tagged places</h2>\n        <p>${total} named places on ${index.bodies.length} bodies, from Planetary Explorer (the owner's own project), each with its category and where it is on the surface. The coordinates are carried over exactly as checked there.</p>\n      </div>\n      <table class="tbl">\n        <thead><tr><th scope="col">Body</th><th scope="col">Places</th><th scope="col">Categories</th><th scope="col">In the app</th></tr></thead>\n        <tbody>\n${table}        </tbody>\n      </table>\n      <details class="moon-all">\n        <summary><h3>All ${total} places <span class="sub">by body</span></h3><span class="more">Show all places</span></summary>\n${body}      </details>\n    </div>\n  </section>\n`;
}

/** The text between the marker lines, as the page must hold it. */
export function generatedBlocks() {
  return {
    "moons-overview": moonsOverview(),
    "planet-moons": MOON_PLANETS.map(moonSection).join(""),
    "tagged-places": placesSection(),
  };
}

export const markers = (name) => ({ start: `  <!-- ${name}:start (generated by tools/site/assets-sections.mjs) -->\n`, end: `  <!-- ${name}:end -->\n` });

/** The page with each marked block replaced. The markers are part of the page; a missing one is an error. */
export function withBlocks(page) {
  let out = page;
  for (const [name, block] of Object.entries(generatedBlocks())) {
    const { start, end } = markers(name);
    const pattern = new RegExp(`  <!-- ${name}:start[\\s\\S]*?<!-- ${name}:end -->\\n`);
    if (!pattern.test(out)) throw new Error(`${name} markers not found in assets.html`);
    out = out.replace(pattern, () => start + block + end);
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
