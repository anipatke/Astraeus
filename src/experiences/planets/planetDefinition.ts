// The planets experience builder: one planet's settings (data/planets/<planet>.json) and its system become an ExperienceDefinition.
// Generic (ARCH-01): no planet, moon or story is named here; the names are in the settings file and the system.
import { catalogue } from "../../assets/catalogue";
import { moonFacts, moonSourceTitles, type MoonCatalogue, type MoonRecord } from "../../assets/moonCatalogue";
import { moonListSummary, type MoonFamilyList } from "../../shell/moonFamilies";
import { bodyMetrics } from "../../app/bodyMetrics";
import { familiesWithPalette, type BodySetLayer } from "../../app/bodySet";
import { catalogueItem } from "../../app/catalogueItem";
import type { ExperienceDefinition, VisualOverride } from "../../app/experienceDefinition";
import type { SystemComposition } from "../../assets/compositions";
import type { ChebyshevEphemeris } from "../../core/chebyshevEphemeris";
import { createEphemerisGroup } from "../../core/ephemerisGroup";
import { createEvents } from "../../core/events";
import { createProvenance, type Provenance } from "../../core/provenance";
import type { TimeBounds } from "../../core/trajectory";
import { bodyFeatureSet, type BodyFeature, type BodyFeatureCategory } from "../../shell/bodyFeatures";
import type { ExperienceConfig, ExperienceObject } from "../../shell/experience";
import { parseStoryPanels } from "../../shell/storyPanels";
import type { PlanetSettings } from "./planetSettings";

/** What a planet's view is drawn from besides its settings: the moon list, the fitted positions, the pictures and the rings. */
export interface PlanetSystem {
  readonly catalogue: MoonCatalogue;
  /** The centre and the moons drawn as full bodies; every other moon in the list is a dot. */
  readonly composition: SystemComposition;
  readonly ephemeris: () => ChebyshevEphemeris;
  /** Cited in every dot moon's position record. */
  readonly fitSource: string;
  /** Said of every mapped moon whose face is held towards the planet. */
  readonly tidalLockNote: string;
  readonly centreGmKm3S2: number;
  readonly rings?: NonNullable<VisualOverride["rings"]>;
  /** The tagged places of each mapped moon, as the body package stores them. */
  readonly packages: Readonly<Record<string, { readonly features: { readonly features: readonly BodyFeature[] }; readonly categories: { readonly categories: readonly BodyFeatureCategory[] } }>>;
  /** Fetches the position data the window needs (and the history the orbit lines reach back over). */
  readonly load: (window: TimeBounds) => Promise<void>;
}

class PlanetBuildError extends RangeError {
  override readonly name = "PlanetBuildError";
}

/** Where each tagged place on a mapped moon comes from, for its information panel. */
const FEATURE_PROVENANCE = createProvenance({
  sourceType: "reconstructed",
  sources: ["Place names, kinds, descriptions and coordinates: Planetary Explorer's feature lists", "Map pictures: USGS Astrogeology and NASA mission mosaics"],
  accuracy: "Each place is drawn where it was checked against the map picture by eye, not at a surveyed position; a marker can sit a few degrees from the feature's centre, and a polar entry is a representative anchor, not a feature centre.",
  notes: "Markers hide on the far side of the moon and when the moon is drawn small.",
});

/** Where each dot moon's position comes from, for its information panel. */
const dotMoonProvenance = (fitSource: string): Provenance => createProvenance({
  sourceType: "ephemeris",
  sources: [fitSource],
  accuracy: "Positions reproduce Horizons to within 1 m. Horizons' own uncertainty is far larger for the recently discovered moons and is not stated in its output. Radii marked estimate are brightness-based sizes.",
  notes: "Each orbit line is the moon's own path from these positions over about one orbit, ending where the moon is now; for a moon perturbed by the Sun the line does not close exactly, so its oldest end fades out.",
});

/** The planet's dot moons as one body set: the layer the scene draws in one batch. */
function planetMoonLayer(settings: PlanetSettings, system: PlanetSystem): BodySetLayer {
  const mapped = new Set(system.composition.bodies);
  const dots = system.catalogue.moons.filter((moon) => !mapped.has(moon.id));
  const mappedMoons = system.catalogue.moons.filter((moon) => mapped.has(moon.id));
  const ownPath = new Set(system.composition.paths?.map((path) => path.body));
  const batched = mappedMoons.filter((moon) => !ownPath.has(moon.id));
  const window = settings.window;
  const provenance = dotMoonProvenance(system.fitSource);
  return {
    id: `${settings.id}-small-moons`,
    group: createEphemerisGroup({ id: `${settings.id}-small-moons`, center: settings.centre.id, ephemeris: system.ephemeris, members: dots.map((moon) => moon.id), bounds: window, provenance }),
    members: dots.map((moon) => ({ id: moon.id, label: moon.name, radiusKm: moon.meanRadiusKm, family: moon.family })),
    families: familiesWithPalette(system.catalogue.families),
    bodyFamilies: Object.fromEntries(mappedMoons.map((moon) => [moon.id, moon.family])),
    // The mapped moons without their own path join the batch for their orbit lines; a moon with a path in the composition keeps its own loop.
    ...(batched.length === 0 ? {} : { extraOrbits: {
      group: createEphemerisGroup({ id: `${settings.id}-mapped-moon-orbits`, center: settings.centre.id, ephemeris: system.ephemeris, members: batched.map((moon) => moon.id), bounds: window, provenance: createProvenance({ sourceType: "ephemeris", sources: [system.fitSource], accuracy: "As each moon's own record.", notes: "Orbit lines only: each moon's own path over about one orbit, ending where it is now." }) }),
      families: batched.map((moon) => moon.family),
    } }),
    centreGmKm3S2: system.centreGmKm3S2,
  };
}

/** Builds one planet's view. Throws a `PlanetBuildError` naming the setting when the settings and the system disagree. */
export function buildPlanetDefinition(settings: PlanetSettings, system: PlanetSystem, panelsFile: unknown): ExperienceDefinition {
  const moonList = system.catalogue;
  const window = settings.window;
  const moonRecord = (id: string): MoonRecord => {
    const moon = moonList.moons.find((candidate) => candidate.id === id);
    if (moon === undefined) throw new PlanetBuildError(`planet "${settings.id}" names the moon "${id}", which its moon list lacks`);
    return moon;
  };
  const factsOf = (id: string) => moonFacts(moonList, moonRecord(id));
  /** A moon's provenance: the given one with the sources of its family, size and discovery year added to its sources, so the panel has one list. */
  const withCatalogueSources = (provenance: Provenance, id: string): Provenance =>
    createProvenance({ ...provenance, sources: [...provenance.sources, ...moonSourceTitles(moonList, moonRecord(id))] });

  const mappedIds = new Set(system.composition.bodies);
  const wanted = settings.moons.mapped.map((moon) => moon.id);
  for (const id of wanted) if (!mappedIds.has(id)) throw new PlanetBuildError(`planet "${settings.id}" describes the mapped moon "${id}", which its system does not draw as a body`);
  for (const moon of moonList.moons) if (mappedIds.has(moon.id) && !wanted.includes(moon.id)) throw new PlanetBuildError(`planet "${settings.id}" has no words for the mapped moon "${moon.id}"`);
  if (!system.composition.bodies.includes(settings.centre.id)) throw new PlanetBuildError(`planet "${settings.id}" centres on "${settings.centre.id}", which its system does not draw`);
  if (!moonList.families.some((family) => family.id === settings.moons.featuredFamilyId)) throw new PlanetBuildError(`planet "${settings.id}" features the family "${settings.moons.featuredFamilyId}", which its moon list lacks`);

  const layer = planetMoonLayer(settings, system);
  const dots = system.catalogue.moons.filter((moon) => !mappedIds.has(moon.id));

  // The Horizons list the moons come from: its date is the list's asOf and its count is the moons the data holds (never typed in).
  const listSummary = moonListSummary(moonList.moons.length, settings.moons.listSource, moonList.asOf);
  const dotProvenance = dotMoonProvenance(system.fitSource);
  const familyLabel = (id: string) => moonList.families.find((family) => family.id === id)!.label;

  const objects: ExperienceObject[] = [
    catalogueItem(settings.centre.id, {
      labelPriority: settings.centre.labelPriority,
      labelMaxDistance: settings.centre.labelMaxDistance,
      facts: [{ label: "Known moons", value: listSummary }],
      description: settings.centre.description,
      knownLimitations: settings.centre.knownLimitations,
    }),
    ...settings.moons.mapped.map((moon): ExperienceObject => {
      const item = catalogueItem(moon.id, { facts: factsOf(moon.id), labelPriority: moon.labelPriority, labelMaxDistance: moon.labelMaxDistance, description: moon.description, knownLimitations: [system.tidalLockNote] });
      return { ...item, provenance: withCatalogueSources(item.provenance!, moon.id) };
    }),
    // The other moons: not in the Object list (111 names would bury it) but selectable, so the moon panel can focus one and open its information.
    ...dots.map((moon): ExperienceObject => ({
      id: moon.id,
      label: moon.name,
      listed: false,
      description: `A small moon of ${settings.label} in the ${familyLabel(moon.family)}.`,
      facts: factsOf(moon.id),
      provenance: withCatalogueSources(dotProvenance, moon.id),
    })),
  ];

  // The moon panel's list: the families from the moon list, the mapped moons first with their pictures.
  const moonFamilies: MoonFamilyList = {
    planetLabel: settings.label,
    listSource: settings.moons.listSource,
    listDate: moonList.asOf,
    featuredFamilyId: settings.moons.featuredFamilyId,
    families: moonList.families.map((family) => ({
      id: family.id,
      label: family.label,
      description: family.description,
      moons: moonList.moons.filter((moon) => moon.family === family.id).map((moon) => ({
        id: moon.id,
        label: moon.name,
        named: moon.named,
        ...(mappedIds.has(moon.id) ? { pictureUrl: catalogue.get(moon.id).visual.texture?.url } : {}),
      })),
    })),
  };

  // The tagged places on the mapped moons come from their body packages, latitude and longitude exactly as the owner verified them, never rounded or corrected.
  const bodyFeatures = settings.bodyFeatures.map((id) => {
    const body = system.packages[id];
    if (body === undefined) throw new PlanetBuildError(`planet "${settings.id}" lists tagged places for "${id}", which its system has no package for`);
    return bodyFeatureSet({ bodyId: id, bodyLabel: moonRecord(id).name, features: body.features, categories: body.categories, provenance: FEATURE_PROVENANCE });
  });

  const events = createEvents([]);
  const follow = settings.moons.follow;
  const experience: ExperienceConfig = {
    objects,
    cameraPresets: [
      { id: "overview", label: "Overview", request: { kind: "overview" } },
      { id: `focus-${settings.centre.id}`, label: `Focus ${settings.label}`, request: { kind: "focus", target: settings.centre.id } },
      ...(follow === undefined ? [] : [
        { id: `focus-${follow}`, label: `Focus ${moonRecord(follow).name}`, request: { kind: "focus", target: follow } },
        { id: `follow-${follow}`, label: `Follow ${moonRecord(follow).name}`, request: { kind: "follow", target: follow } },
      ] as const),
    ],
    events,
    window,
    moonFamilies,
    bodyFeatures,
    // The story's panels are story data (data/stories/<story>/panels.json), checked against this experience's objects and window.
    storyPanels: parseStoryPanels(panelsFile, { events, objectIds: objects.map((object) => object.id), window }),
    rates: settings.rates,
  };

  return {
    label: settings.experienceLabel,
    experience,
    clock: { startUtcMs: window.startUtcMs, rate: settings.clockRate },
    sceneLayers: [],
    composition: system.composition,
    ...(system.rings === undefined ? {} : { visualOverrides: { [settings.centre.id]: { rings: system.rings } } }),
    bodySets: [layer],
    camera: settings.camera,
    scaleChoices: ["true-scale"],
    startView: settings.startView,
    trackedBodies: [],
    prepare: () => system.load(window),
    createMetrics: ({ resolver }) => bodyMetrics(resolver, system.composition.bodies),
  };
}
