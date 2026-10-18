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
import type { ExperienceConfig } from "../../shell/experience";
import { parseStoryPanels } from "../../shell/storyPanels";
import panelsFile from "../../../data/stories/jupiter-io/panels.json";

/**
 * The window must sit inside the core moon fits (2010-2030). Temporarily (T-098) it starts on 4 November 2016, the date T-100 adopts, and
 * keeps the old window's two weeks; T-100 sets the year-long window and moves the stories.
 */
export const JUPITER_WINDOW = { startUtcMs: Date.UTC(2016, 10, 4), endUtcMs: Date.UTC(2016, 10, 18) };
const WINDOW = JUPITER_WINDOW;

/**
 * The fit chunks this build ships: the window's year only (one file per moon per year), served as files and fetched only for this
 * experience. A window in another year needs its year here; `chunksNeeded` refuses a window whose chunks are not shipped.
 */
const SHIPPED_CHUNKS = import.meta.glob("../../../data/ephemerides/jupiter-moons/*/2016.bin", { query: "?url", import: "default", eager: true }) as Record<string, string>;
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

const objects = [
  catalogueItem("jupiter", {
    labelPriority: 100,
    labelMaxDistance: 30_000,
    description: "The largest planet, flattened by its fast spin, with four faint rings of dust drawn at their real distances.",
    knownLimitations: [JUPITER_NO_TEXTURE, "The surface drawn is the 1-bar cloud-top level, not a solid surface.", "The rings are drawn as flat bands in Planetary Explorer's colours; their brightness is a look, not a measurement."],
  }),
  catalogueItem("io", { labelPriority: 90, labelMaxDistance: 3_000, description: `The innermost large moon of Jupiter, always turning the same face towards it. ${FITTED}`, knownLimitations: [FITTED_MOON_TIDAL_LOCK] }),
  catalogueItem("europa", { labelPriority: 80, labelMaxDistance: 3_000, description: `The second large moon, an ice shell over a hidden ocean. ${FITTED}`, knownLimitations: [FITTED_MOON_TIDAL_LOCK] }),
  catalogueItem("ganymede", { labelPriority: 80, labelMaxDistance: 3_000, description: `The largest moon in the solar system, bigger than Mercury. ${FITTED}`, knownLimitations: [FITTED_MOON_TIDAL_LOCK] }),
  catalogueItem("callisto", { labelPriority: 80, labelMaxDistance: 3_000, description: `The outermost large moon, the most heavily cratered surface known. ${FITTED}`, knownLimitations: [FITTED_MOON_TIDAL_LOCK] }),
];

/** Every other moon: a grey dot (a ball close up) named on hover, tap or near zoom, its orbit line in its family's colour. */
export const jupiterSmallMoons: BodySetLayer = {
  id: "jupiter-small-moons",
  group: createEphemerisGroup({
    id: "jupiter-small-moons",
    center: "jupiter",
    ephemeris: jupiterMoonEphemeris,
    members: SMALL_MOONS.map((moon) => moon.id),
    bounds: WINDOW,
    provenance: createProvenance({
      sourceType: "ephemeris",
      sources: [JUPITER_MOON_FIT_SOURCE, "Moon list, families and radii: data/moons/jupiter.json (T-097)"],
      accuracy: "Positions reproduce Horizons to within 1 m (T-096). Horizons' own uncertainty is far larger for the recently discovered moons and is not stated in its output. Radii marked estimate are brightness-based sizes.",
      notes: "Each orbit line is the moon's osculating ellipse about Jupiter at the shown moment: it passes through the moon, but the real path of a moon perturbed by the Sun wanders from it over months.",
    }),
  }),
  members: SMALL_MOONS.map((moon) => ({ id: moon.id, label: moon.name, radiusKm: moon.meanRadiusKm, family: moon.family })),
  families: familiesWithPalette(JUPITER_MOON_CATALOGUE.families),
  bodyFamilies: Object.fromEntries(MAPPED_MOONS.map((moon) => [moon.id, moon.family])),
  // Europa's, Ganymede's and Callisto's orbit lines join the batch; Io keeps its own loop (the composition's path).
  extraOrbits: {
    group: createEphemerisGroup({ id: "jupiter-mapped-moon-orbits", center: "jupiter", ephemeris: jupiterMoonEphemeris, members: BATCHED_MAPPED.map((moon) => moon.id), bounds: WINDOW, provenance: createProvenance({ sourceType: "ephemeris", sources: [JUPITER_MOON_FIT_SOURCE], accuracy: "As each moon's own record.", notes: "Orbit lines only: osculating ellipses about Jupiter at the shown moment." }) }),
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
  prepare: async () => { await loadJupiterMoons({ window: WINDOW, bodies: JUPITER_MOON_IDS, chunkUrls: JUPITER_CHUNK_URLS }); },
  createMetrics: ({ resolver }) => bodyMetrics(resolver, jupiterMoonsSystem.bodies),
};
