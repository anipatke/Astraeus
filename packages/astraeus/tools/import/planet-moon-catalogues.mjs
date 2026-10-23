// Builds data/moons/<planet>.json (core data, O-033 T-115) for Mars, Saturn, Uranus, Neptune and Pluto, in the format
// `astraeus.moon-catalogue/1` that Jupiter's list (tools/import/jupiter-moon-catalogue.mjs) already uses and src/assets/moonCatalogue.ts parses.
//   node tools/import/planet-moon-catalogues.mjs
// The moon list is each planet's T-114 curve-fit index (JPL Horizons); this script adds families, sources and the notes. Each moon's family,
// size and discovery year are in tools/import/planet-moon-facts.json, transcribed on 2026-10-20 from the sources named in `sources` below:
// the JPL SSD physical-parameters and discovery tables, and the Wikipedia "Moons of <planet>" tables (a compilation). Nothing is invented
// except the one size stand-in named in the Saturn note.
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const facts = JSON.parse(readFileSync(new URL("tools/import/planet-moon-facts.json", root), "utf8"));
const AS_OF = "2026-10-20";
const MAPPED = new Set(["charon", "dione", "enceladus", "iapetus", "mimas", "rhea", "tethys", "titan", "triton"]);

const common = {
  "jpl-sat-elem": { title: "JPL Solar System Dynamics, Planetary Satellite Mean Elements", url: "https://ssd.jpl.nasa.gov/sats/elem/" },
  "jpl-sat-phys": { title: "JPL Solar System Dynamics, Planetary Satellite Physical Parameters (mean radius)", url: "https://ssd.jpl.nasa.gov/sats/phys_par/" },
  "jpl-sat-discovery": { title: "JPL Solar System Dynamics, Planetary Satellite Discovery Circumstances (data last updated 2023-May-23)", url: "https://ssd.jpl.nasa.gov/sats/discovery.html" },
};
const horizons = (planet, count) => ({ title: `JPL Horizons On-Line Ephemeris System, major-body list for ${planet} (${count} moons, fetched 2026-10-20)`, url: "https://ssd.jpl.nasa.gov/horizons/" });
const wikipedia = (planet, about) => ({
  title: `Moons of ${planet} (Wikipedia), read 2026-10-20: ${about} A compilation, used because the primary papers do not tabulate every moon; group membership was not re-derived.`,
  url: `https://en.wikipedia.org/wiki/Moons_of_${planet}`,
});
const gladman = { title: "Gladman et al. 2001, Discovery of 12 satellites of Saturn exhibiting orbital clustering, Nature 412, 163-166 (the Inuit, Gallic and Norse groups)", url: "https://doi.org/10.1038/35084032" };
const ashton = { title: "Ashton, Gladman, Alexandersen & Petit 2025, Retrograde Predominance of Small Saturnian Moons Reiterates a Recent Retrograde Collisional Disruption, Planetary Science Journal 6, 283 (the groups used for the newly found moons)", url: "https://doi.org/10.3847/PSJ/ae1d62" };
const gravBauer = { title: "Grav & Bauer 2007, A deeper look at the colors of the saturnian irregular satellites, Icarus 191, 267-285 (the groups)", url: "https://doi.org/10.1016/j.icarus.2007.04.020" };
const jewitt = { title: "Jewitt & Haghighipour 2007, Irregular Satellites of the Planets: Products of Capture in the Early Solar System, Annual Review of Astronomy and Astrophysics 45, 261-295", url: "https://doi.org/10.1146/annurev.astro.44.051905.092459" };
const thomas2020 = { title: "Thomas & Helfenstein 2020, The small inner satellites of Saturn: Shapes, structures and some implications, Icarus 344, 113355 (sizes of the small inner moons)", url: "https://doi.org/10.1016/j.icarus.2019.06.016" };
const sheppard2005 = { title: "Sheppard, Jewitt & Kleyna 2005, An Ultradeep Survey for Irregular Satellites of Uranus: Limits to Completeness, Astronomical Journal 129, 518-525", url: "https://doi.org/10.1086/426329" };
const brozovic2022 = { title: "Brozovic & Jacobson 2022, Orbits of the Irregular Satellites of Uranus and Neptune, Astronomical Journal 163, 241 (the groups)", url: "https://doi.org/10.3847/1538-3881/ac617f" };
const karkoschka2001 = { title: "Karkoschka 2001, Voyager's Eleventh Discovery of a Satellite of Uranus and Photometry and the First Size Measurements of Nine Satellites, Icarus 151, 69-77 (sizes of the inner moons)", url: "https://doi.org/10.1006/icar.2001.6597" };
const holman2004 = { title: "Holman et al. 2004, Discovery of five irregular moons of Neptune, Nature 430, 865-867 (the Sao and Neso groups)", url: "https://doi.org/10.1038/nature02832" };
const sheppard2006 = { title: "Sheppard, Jewitt & Kleyna 2006, A Survey for 'Normal' Irregular Satellites around Neptune: Limits to Completeness, Astronomical Journal 132, 171-176", url: "https://doi.org/10.1086/504799" };
const karkoschka2003 = { title: "Karkoschka 2003, Sizes, shapes, and albedos of the inner satellites of Neptune, Icarus 162, 400-407", url: "https://doi.org/10.1016/S0019-1035(03)00002-2" };
const stern2006 = { title: "Stern et al. 2006, Characteristics and Origin of the Quadruple System at Pluto (the four small moons)", url: "https://arxiv.org/abs/astro-ph/0512599" };

const PLANETS = {
  mars: {
    sources: { "wikipedia": wikipedia("Mars", "the table of Phobos and Deimos with their sizes and discovery."), "jpl-sat-elem": common["jpl-sat-elem"] },
    note: "Mars has two moons, both small and irregularly shaped, one family. Sizes are JPL's published mean radii.",
    families: [
      { id: "mars-moons", label: "Phobos and Deimos", description: "The two small moons of Mars, found by Asaph Hall in 1877: irregular lumps close to Mars on nearly circular orbits.", sources: ["jpl-sat-elem", "wikipedia"] },
    ],
    family: () => ({ basis: ["jpl-sat-elem"], source: "jpl-sat-elem" }),
  },
  saturn: {
    sources: { "wikipedia": wikipedia("Saturn", "the table that lists each moon's group, diameter and discovery year, the diameter note (Thomas 2010 and 2020 for the regular moons, Grav et al. 2015 for Siarnaq and Albiorix, brightness-based estimates for the other irregular moons) and the group note (Ashton et al. 2025)."), "gladman-2001": gladman, "grav-bauer-2007": gravBauer, "ashton-2025": ashton, "jewitt-haghighipour-2007": jewitt, "thomas-2020": thomas2020 },
    note: "Facts only. 292 moons: JPL Horizons' list. Three groups of irregular moons (Inuit, Gallic, Norse) and the regular moons. Radius basis 'measured' is a published measurement, 'estimate' is brightness-based (an assumed albedo of 0.04). One moon, S/2009 S 2 (announced June 2026), has no published size; its radius 0.15 km is a stand-in equal to the 0.3 km moonlet S/2009 S 1 that the same source lists beside it, marked estimate. Daphnis's curve fit covers only 2010 to 2018 (see its index entry). Moons with a bodyPackage use the O-018 packages unchanged.",
    families: [
      { id: "major", label: "The seven big moons", description: "Mimas, Enceladus, Tethys, Dione, Rhea, Titan and Iapetus: massive enough to be round. Each has a Planetary Explorer map.", sources: ["jpl-sat-elem", "wikipedia"] },
      { id: "small-regular", label: "Small regular moons", description: "The small moons on regular orbits: the ring shepherds and ring moonlets close to Saturn (Pan to Pallene), the pair Janus and Epimetheus that swap orbits, the Trojan moons of Tethys and Dione, and Hyperion.", sources: ["jpl-sat-elem", "wikipedia", "thomas-2020"] },
      { id: "inuit", label: "Inuit group", description: "Irregular moons on prograde orbits, 190 to 300 Saturn radii out, inclined 43 to 51 degrees, taken to be pieces of one or a few parent bodies; the Kiviuq and Siarnaq subgroups.", sources: ["gladman-2001", "grav-bauer-2007", "ashton-2025", "wikipedia"] },
      { id: "gallic", label: "Gallic group", description: "Irregular moons on prograde orbits inclined 34 to 41 degrees, taken to be pieces of one parent body; the largest is Albiorix.", sources: ["gladman-2001", "grav-bauer-2007", "ashton-2025", "wikipedia"] },
      { id: "norse", label: "Norse group", description: "All retrograde irregular moons, the largest group by far; Phoebe is the biggest. Ashton et al. 2025 split it by inclination into the Phoebe, Mundilfari, Kari and low-inclination subgroups.", sources: ["gladman-2001", "grav-bauer-2007", "ashton-2025", "wikipedia"] },
    ],
    family: (family) => (family === "major" || family === "small-regular" ? { basis: ["jpl-sat-elem"], source: "jpl-sat-elem" } : { basis: ["gladman-2001", "ashton-2025"], source: "wikipedia" }),
  },
  uranus: {
    sources: { "wikipedia": wikipedia("Uranus", "the table that lists each moon's group, diameter and discovery year and the notes on where the diameters come from (Karkoschka 2001 and Showalter & Lissauer 2006 for the inner moons, Sheppard's website and Farkas-Takacs et al. 2017 for the irregular moons)."), "sheppard-2005": sheppard2005, "brozovic-2022": brozovic2022, "jewitt-haghighipour-2007": jewitt, "karkoschka-2001": karkoschka2001 },
    note: "Facts only. 28 moons: JPL Horizons' list. Radius basis 'measured' is a published measurement, 'estimate' is brightness-based. Moons with a bodyPackage use the O-018 packages unchanged (none for Uranus's moons).",
    families: [
      { id: "major", label: "The five big moons", description: "Miranda, Ariel, Umbriel, Titania and Oberon: the round moons, found 1787 to 1948.", sources: ["jpl-sat-elem", "wikipedia"] },
      { id: "inner", label: "Inner moons", description: "Thirteen small dark moons inside Miranda's orbit, among Uranus's rings (ring shepherds Cordelia and Ophelia, the Portia and Belinda groups, Puck, and Mab, the source of the mu ring).", sources: ["jpl-sat-elem", "karkoschka-2001", "wikipedia"] },
      { id: "caliban", label: "Caliban group", description: "Irregular moons on retrograde orbits with similar distances and inclinations (Caliban, Stephano and S/2023 U 1).", sources: ["sheppard-2005", "brozovic-2022", "jewitt-haghighipour-2007", "wikipedia"] },
      { id: "retrograde", label: "Other retrograde irregular moons", description: "Six irregular moons on retrograde orbits that fit no group: Sycorax, Prospero, Setebos, Trinculo, Francisco and Ferdinand.", sources: ["sheppard-2005", "brozovic-2022", "wikipedia"] },
      { id: "loner", label: "Loners", description: "Margaret, the only known irregular moon of Uranus on a prograde orbit; in no group.", sources: ["sheppard-2005", "wikipedia"] },
    ],
    family: (family) => (family === "major" ? { basis: ["jpl-sat-elem"], source: "jpl-sat-elem" } : family === "inner" ? { basis: ["jpl-sat-elem", "karkoschka-2001"], source: "wikipedia" } : { basis: ["sheppard-2005", "brozovic-2022"], source: "wikipedia" }),
  },
  neptune: {
    sources: { "wikipedia": wikipedia("Neptune", "the table that lists each moon's group, diameter and discovery year and the notes on where the diameters come from (Karkoschka 2003 for the inner moons, Showalter et al. 2019 for Hippocamp, Sheppard's website for the irregular moons)."), "holman-2004": holman2004, "sheppard-2006": sheppard2006, "brozovic-2022": brozovic2022, "karkoschka-2003": karkoschka2003 },
    note: "Facts only. 16 moons: JPL Horizons' list. Radius basis 'measured' is a published measurement, 'estimate' is brightness-based. Moons with a bodyPackage use the O-018 packages unchanged.",
    families: [
      { id: "triton", label: "Triton", description: "By far the largest moon of Neptune, on a retrograde orbit; most likely a captured dwarf planet. It has a Planetary Explorer map.", sources: ["jpl-sat-elem", "wikipedia"] },
      { id: "inner", label: "Inner moons", description: "Seven small regular moons close to Neptune on near-circular orbits inside Triton's (Naiad to Proteus, with Hippocamp).", sources: ["jpl-sat-elem", "karkoschka-2003", "wikipedia"] },
      { id: "sao", label: "Sao group", description: "Three irregular moons on prograde orbits at similar distances, Sao, Laomedeia and S/2002 N 5.", sources: ["holman-2004", "brozovic-2022", "wikipedia"] },
      { id: "neso", label: "Neso group", description: "Three irregular moons on retrograde orbits at similar distances, Psamathe, Neso and S/2021 N 1; Neso has the widest orbit of any moon in the solar system.", sources: ["holman-2004", "brozovic-2022", "wikipedia"] },
      { id: "loner", label: "Loners", description: "Nereid, a large prograde moon on a very elongated orbit, and Halimede, a retrograde irregular moon: in no published group.", sources: ["holman-2004", "sheppard-2006", "wikipedia"] },
    ],
    family: (family) => (family === "triton" ? { basis: ["jpl-sat-elem"], source: "jpl-sat-elem" } : family === "inner" ? { basis: ["jpl-sat-elem", "karkoschka-2003"], source: "wikipedia" } : { basis: ["holman-2004", "brozovic-2022"], source: "wikipedia" }),
  },
  pluto: {
    sources: { "wikipedia": wikipedia("Pluto", "the table of the five moons with their sizes and discovery years."), "stern-2006": stern2006 },
    note: "Facts only. Pluto's index also holds Pluto itself as the centre series; the list is its five moons. Sizes are JPL's published mean radii. Charon has a Planetary Explorer map.",
    families: [
      { id: "charon", label: "Charon", description: "Pluto's big companion, half Pluto's width; the two circle a point between them. It has a Planetary Explorer map.", sources: ["jpl-sat-elem", "wikipedia"] },
      { id: "small", label: "The four small moons", description: "Styx, Nix, Kerberos and Hydra: small irregular moons circling Pluto and Charon together, in near-resonance with Charon's orbit, perhaps made from the debris of the impact that formed Charon.", sources: ["jpl-sat-elem", "stern-2006", "wikipedia"] },
    ],
    family: (family) => (family === "charon" ? { basis: ["jpl-sat-elem"], source: "jpl-sat-elem" } : { basis: ["jpl-sat-elem", "stern-2006"], source: "wikipedia" }),
  },
};

const designation = (label) => {
  const named = label.match(/^S(\d{4})_([A-Z])0*(\d+)$/) ?? label.match(/^()(\d{4})([A-Z])0*(\d+)$/);
  if (named === null) return null;
  return named.length === 4 ? `S/${named[1]} ${named[2]} ${named[3]}` : `S/${named[2]} ${named[3]} ${named[4]}`;
};

const summary = {};
for (const [planet, plan] of Object.entries(PLANETS)) {
  const index = JSON.parse(readFileSync(new URL(`data/ephemerides/${planet}-moons/index.json`, root), "utf8"));
  const moons = index.bodies.filter((body) => body.role === "moon");
  const mine = facts[planet];
  const errors = [];
  if (mine.length !== moons.length || mine.some((fact) => !moons.some((moon) => moon.id === fact.id))) errors.push(`${planet}: facts do not match the fit index`);
  const sources = {
    "horizons-moon-list": horizons(planet[0].toUpperCase() + planet.slice(1), moons.length),
    ...common,
    ...plan.sources,
  };
  const renamed = {};
  for (const [id, source] of Object.entries(sources)) renamed[id === "wikipedia" ? `wikipedia-moons-of-${planet}` : id] = source;
  const fix = (id) => (id === "wikipedia" ? `wikipedia-moons-of-${planet}` : id);
  for (const family of plan.families) family.sources = family.sources.map(fix);
  const entries = moons.map((moon) => {
    const fact = mine.find((candidate) => candidate.id === moon.id);
    const info = plan.family(fact.family);
    const radiusSource = fact.radiusSource === "jpl-sat-phys" ? "jpl-sat-phys" : fix("wikipedia");
    const label = designation(moon.label);
    return {
      id: moon.id,
      name: label ?? moon.label,
      named: label === null,
      designation: moon.designation === null ? null : designation(moon.designation) ?? moon.designation,
      naifId: moon.naifId,
      family: fact.family,
      meanRadiusKm: fact.meanRadiusKm,
      radiusBasis: fact.radiusBasis,
      discoveryYear: fact.discoveryYear,
      ephemeris: { set: `${planet}-moons`, body: moon.id },
      bodyPackage: MAPPED.has(moon.id) ? `data/bodies/${moon.id}` : null,
      sources: { list: "horizons-moon-list", family: fix(info.source), familyBasis: info.basis.map(fix), radius: radiusSource, discovery: "jpl-sat-discovery" },
    };
  });
  for (const entry of entries) if (!plan.families.some((family) => family.id === entry.family)) errors.push(`${entry.id}: unknown family ${entry.family}`);
  if (errors.length > 0) { console.error(errors.join("\n")); process.exit(1); }
  const out = {
    format: "astraeus.moon-catalogue/1",
    kind: "moon-catalogue",
    parent: planet,
    note: plan.note,
    asOf: AS_OF,
    ephemeris: { path: `data/ephemerides/${planet}-moons/index.json`, moonCount: moons.length },
    sources: renamed,
    families: plan.families,
    moons: entries,
  };
  writeFileSync(new URL(`data/moons/${planet}.json`, root), JSON.stringify(out, null, 1) + "\n");
  summary[planet] = Object.fromEntries(plan.families.map((family) => [family.id, entries.filter((entry) => entry.family === family.id).length]));
}
console.log(JSON.stringify(summary));
