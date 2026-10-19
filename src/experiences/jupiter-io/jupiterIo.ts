import { catalogue } from "../../assets/catalogue";
import { moonFacts, type MoonRecord } from "../../assets/moonCatalogue";
import type { MoonFamilyList } from "../../shell/moonFamilies";
import { bodyMetrics } from "../../app/bodyMetrics";
import { familiesWithPalette, type BodySetLayer } from "../../app/bodySet";
import { catalogueItem } from "../../app/catalogueItem";
import type { ExperienceDefinition } from "../../app/experienceDefinition";
import { JUPITER_MOON_CATALOGUE } from "../../assets/bodies/jupiterMoonCatalogue";
import { JUPITER_RINGS } from "../../assets/bodies/jupiterRings";
import { jupiterMoonsSystem } from "../../assets/compositions";
import { JUPITER } from "../../core/bodies/jupiter";
import { FITTED_MOON_TIDAL_LOCK, JUPITER_MOON_FIT_SOURCE, jupiterMoonEphemeris, loadJupiterMoons } from "../../core/bodies/jupiterMoons";
import { createEphemerisGroup } from "../../core/ephemerisGroup";
import { createEvents } from "../../core/events";
import { createProvenance } from "../../core/provenance";
import type { ExperienceConfig, ExperienceObject } from "../../shell/experience";
import { parseStoryPanels } from "../../shell/storyPanels";
import panelsFile from "../../../data/stories/jupiter-io/panels.json";

/**
 * The window must sit inside the core moon fits (2010-2030). Temporarily (T-098) it starts on 4 November 2016, the date T-100 adopts, and
 * keeps the old window's two weeks; T-100 sets the year-long window and moves the stories.
 */
export const JUPITER_WINDOW = { startUtcMs: Date.UTC(2016, 10, 4), endUtcMs: Date.UTC(2016, 10, 18) };
const WINDOW = JUPITER_WINDOW;

/**
 * The fit chunks this build ships: the window's year (one file per moon per year), served as files and fetched only for this
 * experience. A window in another year needs its year here; `chunksNeeded` refuses a window whose chunks are not shipped.
 */
const SHIPPED_CHUNKS = {
  ...import.meta.glob("../../../data/ephemerides/jupiter-moons/*/2016.bin", { query: "?url", import: "default", eager: true }),
  // The two years before, for the moons whose orbit takes longer than the window's year has had (the orbit line is the moon's own fitted
  // path over one period ending now): every moon but the inner and big four, whose periods are days, and Jupiter's own series (the centre).
  ...import.meta.glob(["../../../data/ephemerides/jupiter-moons/*/{2014,2015}.bin", "!**/{metis,adrastea,amalthea,thebe,io,europa,ganymede,callisto}/*"], { query: "?url", import: "default", eager: true }),
} as Record<string, string>;
/** How far back an orbit line may reach: the slowest moons take under three years. */
const ORBIT_HISTORY_MS = 3 * 365.25 * 86_400_000;
export const JUPITER_CHUNK_URLS: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(SHIPPED_CHUNKS).map(([path, url]) => [path.replace(/^.*jupiter-moons\//, ""), url]));

const JUPITER_NO_TEXTURE = "Jupiter is drawn flat in one colour, without cloud bands: the donor's Jupiter map has no recorded source or licence, so no texture is used.";
const FITTED = "Its position comes from NASA JPL's Horizons system, stored as curve fits that reproduce it to within a few centimetres.";

/** Moons drawn as full bodies (the four with mapped pictures); every other moon in the catalogue is a dot in the set. */
const MAPPED = new Set(jupiterMoonsSystem.bodies);
const SMALL_MOONS = JUPITER_MOON_CATALOGUE.moons.filter((moon) => !MAPPED.has(moon.id));
const MAPPED_MOONS = JUPITER_MOON_CATALOGUE.moons.filter((moon) => MAPPED.has(moon.id));
const OWN_PATH = new Set(jupiterMoonsSystem.paths?.map((path) => path.body));
const BATCHED_MAPPED = MAPPED_MOONS.filter((moon) => !OWN_PATH.has(moon.id));
export const JUPITER_MOON_IDS = JUPITER_MOON_CATALOGUE.moons.map((moon) => moon.id);

const moonRecord = (id: string): MoonRecord => JUPITER_MOON_CATALOGUE.moons.find((moon) => moon.id === id)!;
const factsOf = (id: string) => moonFacts(JUPITER_MOON_CATALOGUE, moonRecord(id));

/** Where each small moon's position comes from, for its information panel. */
const SMALL_MOON_PROVENANCE = createProvenance({
  sourceType: "ephemeris",
  sources: [JUPITER_MOON_FIT_SOURCE, "Moon list, families and radii: data/moons/jupiter.json (T-097)"],
  accuracy: "Positions reproduce Horizons to within 1 m (T-096). Horizons' own uncertainty is far larger for the recently discovered moons and is not stated in its output. Radii marked estimate are brightness-based sizes.",
  notes: "Each orbit line is the moon's own path from these positions over about one orbit, ending where the moon is now; for a moon perturbed by the Sun the line does not close exactly, so its oldest end fades out.",
});

const objects: ExperienceObject[] = [
  catalogueItem("jupiter", {
    labelPriority: 100,
    labelMaxDistance: 30_000,
    description: "The largest planet, flattened by its fast spin, with four faint rings of dust drawn at their real distances.",
    knownLimitations: [JUPITER_NO_TEXTURE, "The surface drawn is the 1-bar cloud-top level, not a solid surface.", "The rings are drawn as flat bands in Planetary Explorer's colours; their brightness is a look, not a measurement."],
  }),
  catalogueItem("io", { facts: factsOf("io"), labelPriority: 90, labelMaxDistance: 3_000, description: `The innermost large moon of Jupiter, always turning the same face towards it. ${FITTED}`, knownLimitations: [FITTED_MOON_TIDAL_LOCK] }),
  catalogueItem("europa", { facts: factsOf("europa"), labelPriority: 80, labelMaxDistance: 3_000, description: `The second large moon, an ice shell over a hidden ocean. ${FITTED}`, knownLimitations: [FITTED_MOON_TIDAL_LOCK] }),
  catalogueItem("ganymede", { facts: factsOf("ganymede"), labelPriority: 80, labelMaxDistance: 3_000, description: `The largest moon in the solar system, bigger than Mercury. ${FITTED}`, knownLimitations: [FITTED_MOON_TIDAL_LOCK] }),
  catalogueItem("callisto", { facts: factsOf("callisto"), labelPriority: 80, labelMaxDistance: 3_000, description: `The outermost large moon, the most heavily cratered surface known. ${FITTED}`, knownLimitations: [FITTED_MOON_TIDAL_LOCK] }),
  // The other moons: not in the Object list (111 names would bury it) but selectable, so the moon panel can focus one and open its information.
  ...SMALL_MOONS.map((moon): ExperienceObject => ({
    id: moon.id,
    label: moon.name,
    listed: false,
    description: `A small moon of Jupiter in the ${JUPITER_MOON_CATALOGUE.families.find((family) => family.id === moon.family)!.label}. ${FITTED}`,
    facts: factsOf(moon.id),
    provenance: SMALL_MOON_PROVENANCE,
  })),
];

/** The moon panel's list: the families from the core data, the big four first with their pictures. */
const moonFamilies: MoonFamilyList = {
  planetLabel: "Jupiter",
  featuredFamilyId: "galilean",
  families: JUPITER_MOON_CATALOGUE.families.map((family) => ({
    id: family.id,
    label: family.label,
    description: family.description,
    moons: JUPITER_MOON_CATALOGUE.moons.filter((moon) => moon.family === family.id).map((moon) => ({
      id: moon.id,
      label: moon.name,
      named: moon.named,
      ...(MAPPED.has(moon.id) ? { pictureUrl: catalogue.get(moon.id).visual.texture?.url } : {}),
    })),
  })),
};

/** Every other moon: a grey dot (a ball close up) named on hover, tap or near zoom, its orbit line in its family's colour. */
export const jupiterSmallMoons: BodySetLayer = {
  id: "jupiter-small-moons",
  group: createEphemerisGroup({
    id: "jupiter-small-moons",
    center: "jupiter",
    ephemeris: jupiterMoonEphemeris,
    members: SMALL_MOONS.map((moon) => moon.id),
    bounds: WINDOW,
    provenance: SMALL_MOON_PROVENANCE,
  }),
  members: SMALL_MOONS.map((moon) => ({ id: moon.id, label: moon.name, radiusKm: moon.meanRadiusKm, family: moon.family })),
  families: familiesWithPalette(JUPITER_MOON_CATALOGUE.families),
  bodyFamilies: Object.fromEntries(MAPPED_MOONS.map((moon) => [moon.id, moon.family])),
  // Europa's, Ganymede's and Callisto's orbit lines join the batch; Io keeps its own loop (the composition's path).
  extraOrbits: {
    group: createEphemerisGroup({ id: "jupiter-mapped-moon-orbits", center: "jupiter", ephemeris: jupiterMoonEphemeris, members: BATCHED_MAPPED.map((moon) => moon.id), bounds: WINDOW, provenance: createProvenance({ sourceType: "ephemeris", sources: [JUPITER_MOON_FIT_SOURCE], accuracy: "As each moon's own record.", notes: "Orbit lines only: each moon's own path over about one orbit, ending where it is now." }) }),
    families: BATCHED_MAPPED.map((moon) => moon.family),
  },
  centreGmKm3S2: JUPITER.gmKm3S2!,
};

const events = createEvents([]);

const experience: ExperienceConfig = {
  objects,
  cameraPresets: [
    { id: "overview", label: "Overview", request: { kind: "overview" } },
    { id: "focus-jupiter", label: "Focus Jupiter", request: { kind: "focus", target: "jupiter" } },
    { id: "focus-io", label: "Focus Io", request: { kind: "focus", target: "io" } },
    { id: "follow-io", label: "Follow Io", request: { kind: "follow", target: "io" } },
  ],
  events,
  window: WINDOW,
  moonFamilies,
  // The story's panels are story data (data/stories/<story>/panels.json), checked against this experience's objects and window.
  storyPanels: parseStoryPanels(panelsFile, { events, objectIds: objects.map((object) => object.id), window: WINDOW }),
  rates: [60, 3_600, 21_600, 86_400],
};

/**
 * Jupiter with every known moon, from the core data: the four mapped moons as textured worlds, the other 111 as one batch of dots with
 * family-coloured orbit lines, and the faint rings. True scale only: the Readable scale pulls the inner moons inside Jupiter.
 */
export const jupiterIoExplorer: ExperienceDefinition = {
  label: "Jupiter and Io",
  experience,
  clock: { startUtcMs: WINDOW.startUtcMs, rate: 3_600 },
  sceneLayers: [],
  composition: jupiterMoonsSystem,
  visualOverrides: { jupiter: { rings: JUPITER_RINGS } },
  bodySets: [jupiterSmallMoons],
  // The outermost moons reach about 30 million km (4,700 Earth radii) from Jupiter.
  camera: { maxFocusDistance: 20_000, far: 80_000 },
  scaleChoices: ["true-scale"],
  trackedBodies: [],
  prepare: async () => { await loadJupiterMoons({ window: WINDOW, bodies: JUPITER_MOON_IDS, chunkUrls: JUPITER_CHUNK_URLS, history: { bodies: JUPITER_MOON_IDS, maxMs: ORBIT_HISTORY_MS } }); },
  createMetrics: ({ resolver }) => bodyMetrics(resolver, jupiterMoonsSystem.bodies),
};
