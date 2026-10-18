// Builds data/moons/jupiter.json (core data, O-025 T-097) and the moon-family section of assets.html from the T-096 curve-fit index.
//   node tools/import/jupiter-moon-catalogue.mjs
// Facts below were read on 2026-10-18 from the sources named in `sources` in the output; nothing is invented. The Jupiter moon list itself is
// the T-096 index (JPL Horizons); this script adds family, size and discovery year. Anything not in a published family is a loner.
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const index = JSON.parse(readFileSync(new URL("data/ephemerides/jupiter-moons/index.json", root), "utf8"));
const moons = index.bodies.filter((body) => body.role === "moon");

/** "S/2003 J 18" -> "s2003-j18"; plain names lower-cased. */
const key = (name) => name.trim().toLowerCase().replace(/^s\/(\d{4}) j\s*(\d+)$/, "s$1-j$2");
const list = (text) => text.split(",").map(key);

const GROUPS = {
  himalia: list("S/2011 J 4, Leda, Ersa, S/2018 J 2, Himalia, Pandia, Lysithea, Elara, S/2011 J 3, S/2017 J 17, Dia"),
  ananke: list("Euporie, S/2003 J 18, Eupheme, S/2021 J 3, S/2010 J 2, S/2016 J 1, Mneme, Euanthe, S/2003 J 16, Harpalyke, Orthosie, Helike, S/2021 J 2, Praxidike, S/2017 J 3, S/2021 J 1, S/2003 J 12, S/2017 J 7, Thelxinoe, Thyone, S/2021 J 8, S/2003 J 2, S/2022 J 3, Ananke, Iocaste, S/2017 J 10, Hermippe, S/2010 J 6, S/2017 J 9"),
  carme: list("S/2016 J 3, S/2022 J 1, S/2010 J 4, S/2017 J 8, Pasithee, S/2017 J 13, S/2021 J 6, S/2003 J 24, S/2017 J 18, S/2017 J 2, Chaldene, Isonoe, S/2017 J 11, S/2017 J 16, Kallichore, S/2021 J 4, Erinome, Kale, Eirene, Aitne, Eukelade, S/2022 J 2, Arche, Taygete, S/2011 J 1, Carme, Herse, S/2003 J 19, S/2010 J 1, S/2003 J 9, S/2017 J 5, S/2011 J 6, S/2018 J 5, S/2017 J 12, Kalyke, S/2003 J 10, S/2018 J 3, S/2021 J 5, S/2024 J 1, S/2011 J 5, S/2010 J 5"),
  pasiphae: list("Eurydome, S/2011 J 2, S/2003 J 4, S/2016 J 4, S/2017 J 15, S/2017 J 6, S/2021 J 7, Hegemone, S/2017 J 14, Pasiphae, Sponde, Megaclite, Cyllene, Sinope, S/2017 J 1, Aoede, Autonoe, Callirrhoe, S/2003 J 23, S/2010 J 3, Kore, Philophrosyne"),
  carpo: list("Carpo, S/2018 J 4"),
  loner: list("Themisto, Valetudo"),
  galilean: list("Io, Europa, Ganymede, Callisto"),
  inner: list("Metis, Adrastea, Amalthea, Thebe"),
};
const familyOf = new Map();
for (const [family, ids] of Object.entries(GROUPS)) for (const id of ids) {
  if (familyOf.has(id)) throw new Error(`${id} is in two families`);
  familyOf.set(id, family);
}

// Mean radius in km. JPL SSD Physical Parameters (Archinal et al. 2018) for nine moons; other measured sizes (diameter / 2) from the
// 'Moons of Jupiter' diameter column; every other value is the diameter estimate from Sheppard's Jupiter moons page, halved.
const JPL_RADIUS = { io: 1821.49, europa: 1560.8, ganymede: 2631.2, callisto: 2410.3, amalthea: 83.5, thebe: 49.3, adrastea: 8.2, metis: 21.5, himalia: 85 };
const MEASURED_DIAMETER = { leda: 21.5, lysithea: 42.2, elara: 79.9, praxidike: 7.0, ananke: 29.1, carme: 46.7, kalyke: 6.9, pasiphae: 57.8, sinope: 35.0, callirrhoe: 9.6, kallichore: 3.8 };
const ESTIMATED_DIAMETER = Object.fromEntries(Object.entries({
  themisto: 9, "s2011-j4": 3, ersa: 3, "s2018-j2": 3, pandia: 3, "s2011-j3": 3, "s2017-j17": 1, dia: 4, "s2018-j4": 2, carpo: 3, valetudo: 1,
  euporie: 2, "s2003-j18": 2, eupheme: 2, "s2021-j3": 2, "s2010-j2": 1, "s2016-j1": 1, mneme: 2, euanthe: 3, "s2003-j16": 2, harpalyke: 4, orthosie: 2, helike: 4,
  "s2021-j2": 1, "s2017-j3": 2, "s2021-j1": 1, "s2003-j12": 1, "s2017-j7": 2, thelxinoe: 2, thyone: 4, "s2021-j8": 1, "s2003-j2": 2, "s2022-j3": 1, iocaste: 5,
  "s2017-j10": 1, hermippe: 4, "s2010-j6": 2, "s2017-j9": 3,
  "s2016-j3": 2, "s2022-j1": 1, "s2010-j4": 1, "s2017-j8": 1, pasithee: 2, "s2017-j13": 1, "s2021-j6": 1, "s2003-j24": 2, "s2017-j18": 2, chaldene: 4, "s2017-j2": 2,
  isonoe: 4, "s2017-j11": 1, "s2017-j16": 1, "s2021-j4": 1, erinome: 3, kale: 2, eirene: 4, aitne: 3, eukelade: 4, "s2022-j2": 1, arche: 3, taygete: 5, "s2011-j1": 2,
  herse: 2, "s2003-j19": 2, "s2010-j1": 2, "s2003-j9": 1, "s2017-j5": 2, "s2011-j6": 1, "s2018-j5": 2, "s2017-j12": 1, "s2003-j10": 2, "s2018-j3": 1, "s2017-j14": 1,
  "s2021-j5": 2, "s2024-j1": 2, "s2011-j5": 2, "s2010-j5": 1,
  philophrosyne: 2, "s2017-j15": 2, "s2017-j6": 2, "s2016-j4": 1, "s2021-j7": 1, hegemone: 3, sponde: 2, "s2011-j2": 1, "s2003-j4": 2, eurydome: 3, megaclite: 6, cyllene: 2,
  "s2017-j1": 2, aoede: 4, autonoe: 4, "s2003-j23": 2, "s2010-j3": 1, kore: 2,
}));
const CLASSIC_YEAR = { io: 1610, europa: 1610, ganymede: 1610, callisto: 1610, amalthea: 1892, himalia: 1904, elara: 1905, pasiphae: 1908, sinope: 1914, lysithea: 1938, carme: 1938, ananke: 1951, leda: 1974, thebe: 1979, adrastea: 1979, metis: 1979 };
const MAPPED = new Set(["io", "europa", "ganymede", "callisto"]);

const sources = {
  "horizons-moon-list": { title: "JPL Horizons On-Line Ephemeris System, major-body list for Jupiter (115 moons, fetched 2026-10-18)", url: "https://ssd.jpl.nasa.gov/horizons/" },
  "jpl-sat-elem": { title: "JPL Solar System Dynamics, Planetary Satellite Mean Elements (regular satellites on JUP365; irregular satellites on JUP347, JUP348, JUP349)", url: "https://ssd.jpl.nasa.gov/sats/elem/" },
  "jpl-sat-phys": { title: "JPL Solar System Dynamics, Planetary Satellite Physical Parameters (mean radius: Archinal et al. 2018)", url: "https://ssd.jpl.nasa.gov/sats/phys_par/" },
  "jpl-sat-discovery": { title: "JPL Solar System Dynamics, Planetary Satellite Discovery Circumstances (data last updated 2023-May-23)", url: "https://ssd.jpl.nasa.gov/sats/discovery.html" },
  "sheppard-jupiter-moons": { title: "Scott S. Sheppard (Carnegie Science), Jupiter's moons page: the dynamical groups and the diameters of most irregular moons", url: "https://sites.google.com/carnegiescience.edu/sheppard/moons/jupitermoons" },
  "sheppard-jewitt-2003": { title: "Sheppard & Jewitt 2003, An abundant population of small irregular satellites around Jupiter, Nature 423, 261-263 (the irregular moons fall into groups, remnants of larger parent bodies)", url: "https://doi.org/10.1038/nature01584" },
  "wikipedia-moons-of-jupiter": { title: "Moons of Jupiter (Wikipedia), read 2026-10-18: the table that lists each moon's group, diameter and the note on diameter sources (Sheppard's page, Grav et al. 2015, Rizos et al. 2026). A compilation, used because Sheppard's own table is an image, not text; group membership was not re-derived.", url: "https://en.wikipedia.org/wiki/Moons_of_Jupiter" },
};

const FAMILIES = [
  { id: "galilean", label: "The big four (Galilean moons)", description: "Io, Europa, Ganymede and Callisto: the four large moons, all discovered in 1610. Each has a Planetary Explorer body package.", sources: ["jpl-sat-elem"] },
  { id: "inner", label: "Inner moons (Amalthea group)", description: "Metis, Adrastea, Amalthea and Thebe: small regular moons inside Io's orbit, on nearly circular orbits close to Jupiter.", sources: ["jpl-sat-elem"] },
  { id: "himalia", label: "Himalia group", description: "Irregular moons on similar prograde orbits about 11 to 12 million km out, taken to be pieces of one parent body.", sources: ["sheppard-jewitt-2003", "sheppard-jupiter-moons", "wikipedia-moons-of-jupiter"] },
  { id: "ananke", label: "Ananke group", description: "Irregular moons on similar retrograde orbits about 20 to 22 million km out, taken to be pieces of one parent body.", sources: ["sheppard-jewitt-2003", "sheppard-jupiter-moons", "wikipedia-moons-of-jupiter"] },
  { id: "carme", label: "Carme group", description: "Irregular moons on similar retrograde orbits about 22 to 24 million km out, taken to be pieces of one parent body.", sources: ["sheppard-jewitt-2003", "sheppard-jupiter-moons", "wikipedia-moons-of-jupiter"] },
  { id: "pasiphae", label: "Pasiphae group", description: "Irregular moons on retrograde orbits with a wide spread of distances and shapes; Sinope is listed here though it may have been captured separately.", sources: ["sheppard-jewitt-2003", "sheppard-jupiter-moons", "wikipedia-moons-of-jupiter"] },
  { id: "carpo", label: "Carpo group", description: "Two small prograde irregular moons on orbits further out than the Himalia group (Carpo and S/2018 J 4).", sources: ["sheppard-jupiter-moons", "wikipedia-moons-of-jupiter"] },
  { id: "loner", label: "Loners", description: "Moons in no published family: Themisto (prograde, the innermost irregular) and Valetudo (prograde, on an orbit that crosses the retrograde moons').", sources: ["sheppard-jupiter-moons", "wikipedia-moons-of-jupiter"] },
];

const errors = [];
const entries = moons.map((moon) => {
  const family = familyOf.get(moon.id);
  if (family === undefined) { errors.push(`no family for ${moon.id}`); return null; }
  const year = CLASSIC_YEAR[moon.id] ?? Number(/(\d{4})J/.exec(String(moon.designation).replace("_", ""))?.[1]);
  let radiusKm, basis, radiusSource;
  if (JPL_RADIUS[moon.id] !== undefined) { radiusKm = JPL_RADIUS[moon.id]; basis = "measured"; radiusSource = "jpl-sat-phys"; }
  else if (MEASURED_DIAMETER[moon.id] !== undefined) { radiusKm = MEASURED_DIAMETER[moon.id] / 2; basis = "measured"; radiusSource = "wikipedia-moons-of-jupiter"; }
  else if (ESTIMATED_DIAMETER[moon.id] !== undefined) { radiusKm = ESTIMATED_DIAMETER[moon.id] / 2; basis = "estimate"; radiusSource = "sheppard-jupiter-moons"; }
  else { errors.push(`no size for ${moon.id}`); }
  if (!Number.isInteger(year)) errors.push(`no discovery year for ${moon.id}`);
  const named = !/^S\d{4}_J|^\d{4}J/.test(moon.label);
  return {
    id: moon.id,
    name: moon.label.replace(/^S(\d{4})_J(\d+)$/, "S/$1 J $2"),
    named,
    designation: moon.designation === null ? null : moon.designation.replace(/^S(\d{4})_J(\d+)$/, "S/$1 J $2"),
    naifId: moon.naifId,
    family,
    meanRadiusKm: radiusKm,
    radiusBasis: basis,
    discoveryYear: year,
    ephemeris: { set: "jupiter-moons", body: moon.id },
    bodyPackage: MAPPED.has(moon.id) ? `data/bodies/${moon.id}` : null,
    sources: {
      list: "horizons-moon-list",
      family: family === "galilean" || family === "inner" ? "jpl-sat-elem" : "wikipedia-moons-of-jupiter",
      familyBasis: family === "galilean" || family === "inner" ? ["jpl-sat-elem"] : family === "loner" || family === "carpo" ? ["sheppard-jupiter-moons"] : ["sheppard-jewitt-2003", "sheppard-jupiter-moons"],
      radius: radiusSource,
      discovery: "jpl-sat-discovery",
    },
  };
});
if (errors.length > 0) { console.error(errors.join("\n")); process.exit(1); }
const stray = [...familyOf.keys()].filter((id) => !moons.some((moon) => moon.id === id));
if (stray.length > 0) { console.error(`family lists name moons not in the fits: ${stray.join(", ")}`); process.exit(1); }

const out = {
  format: "astraeus.moon-catalogue/1",
  kind: "moon-catalogue",
  parent: "jupiter",
  note: "Facts only. The moon list is the T-096 curve-fit index (JPL Horizons). Radius basis 'measured' is a published measurement; 'estimate' is Sheppard's brightness-based diameter halved. A moon in no published family is a loner. The four moons with a bodyPackage use the O-018 packages unchanged.",
  asOf: "2026-10-18",
  ephemeris: { path: "data/ephemerides/jupiter-moons/index.json", moonCount: moons.length },
  sources,
  families: FAMILIES,
  moons: entries,
};
writeFileSync(new URL("data/moons/jupiter.json", root), JSON.stringify(out, null, 1) + "\n");

// ---- assets.html section ----
const esc = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const radiusText = (m) => `${m.basis === "estimate" ? "about " : ""}${m.radius} km`;
let html = "";
html += `  <!-- jupiter-moons:start (generated by tools/import/jupiter-moon-catalogue.mjs) -->\n  <section data-moon-catalogue>\n    <div class="wrap">\n      <div class="head">\n        <h2>Jupiter's moons</h2>\n        <p>All ${entries.length} moons JPL Horizons lists for Jupiter, by family, as of 18 October 2026. Positions are curve fits of Horizons vectors; the family, size and discovery year of each moon are below with where they came from. Sizes marked "about" are estimates from brightness.</p>\n      </div>\n`;
for (const family of FAMILIES) {
  const members = entries.filter((m) => m.family === family.id);
  const src = family.sources.map((id) => sources[id].title.split(/[,:(]/)[0]).join("; ");
  html += `      <details class="moon-family" data-moon-family="${family.id}" data-count="${members.length}"${family.id === "galilean" ? " open" : ""}>\n        <summary><h3>${esc(family.label)} <span class="sub">${members.length}</span></h3></summary>\n        <p class="fam-note">${esc(family.description)} Source: ${esc(src)}.</p>\n        <ul class="moon-list">\n`;
  for (const m of members) {
    html += `          <li data-moon="${m.id}"><b>${esc(m.name)}</b> <span>${m.meanRadiusKm} km${m.radiusBasis === "estimate" ? " (est.)" : ""} · ${m.discoveryYear}${m.bodyPackage ? " · textured, with tagged places" : ""}</span></li>\n`;
  }
  html += `        </ul>\n      </details>\n`;
}
html += `      <p class="fam-note">Sources: ${Object.values(sources).map((s) => `<a href="${s.url}">${esc(s.title.split(/[,(]| \(/)[0])}</a>`).join("; ")}. Group membership as tabulated in the Wikipedia moon table, which cites Sheppard; each moon's own source ids are in <code>data/moons/jupiter.json</code>.</p>\n    </div>\n  </section>\n  <!-- jupiter-moons:end -->\n`;
const path = new URL("assets.html", root);
let page = readFileSync(path, "utf8").replace(/  <!-- jupiter-moons:start[\s\S]*?<!-- jupiter-moons:end -->\n/, "");
const anchor = "  <section>\n    <div class=\"wrap\">\n      <div class=\"head\">\n        <h2>Credits</h2>";
if (!page.includes(anchor)) throw new Error("credits anchor not found in assets.html");
page = page.replace(anchor, html + "\n" + anchor);
writeFileSync(path, page);
const counts = Object.fromEntries(FAMILIES.map((f) => [f.id, entries.filter((m) => m.family === f.id).length]));
console.log(JSON.stringify(counts), entries.length);
