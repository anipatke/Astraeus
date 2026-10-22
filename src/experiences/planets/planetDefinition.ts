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
import { isSurfacePlace, shownLongitude } from "./surfacePlace.mjs";

/**
 * A tagged place as the body package stores it: some entries have no details (Earth), and a package may list a moon of the body without a position
 * (Mars's Phobos and Deimos carry an orbit ring, not a latitude and longitude). Only entries with a position become markers.
 */
export type PackageFeature = Omit<BodyFeature, "latitude" | "longitude" | "details"> & { readonly latitude?: number; readonly longitude?: number; readonly details?: BodyFeature["details"]; readonly ringRadius?: unknown; readonly moonRadius?: unknown };

/** The map record's longitude convention (`coordinates` of data/bodies/<body>/map.json), as far as the places need it. */
export interface MapCoordinates { readonly sourceLongitude?: string | null; readonly markerLongitudeFromSource?: { readonly scale: number; readonly offsetDeg: number } | null }

/** The surface places of a package (the planet places rule: a position, no ring-plane fields), each with its details (none when the package gives none); latitude as stored, longitude as stored unless the map record says the stored values are west longitudes (shownLongitude). */
function placedFeatures(features: readonly PackageFeature[], coordinates: MapCoordinates | undefined): { readonly features: readonly BodyFeature[] } {
  return {
    features: features.flatMap((feature) => !isSurfacePlace(feature) ? [] : [{ ...feature, latitude: feature.latitude!, longitude: shownLongitude(feature.longitude!, coordinates), details: feature.details ?? [] }]),
  };
}

/** What a planet's view is drawn from besides its settings: the moon list, the fitted positions, the pictures and the rings. */
export interface PlanetSystem {
  /**
   * The moon list and what draws it: `catalogue`, `ephemeris`, `fitSource`, `tidalLockNote` and `centreGmKm3S2` come together or not at all. A planet whose
   * moon is not a fitted one (Earth's Moon) or that has none (Mercury, Venus) leaves them out; then no moon panel and no small-moon layer are built.
   */
  readonly catalogue?: MoonCatalogue;
  /** The centre and the moons drawn as full bodies; every other moon in the list is a dot. */
  readonly composition: SystemComposition;
  readonly ephemeris?: () => ChebyshevEphemeris;
  /** Cited in every dot moon's position record. */
  readonly fitSource?: string;
  /** Said of every mapped moon whose face is held towards the planet. */
  readonly tidalLockNote?: string;
  readonly centreGmKm3S2?: number;
  /** Each moon's worst measured error against Horizons (m), from its fit index. When given, a dot moon's accuracy text states its own figure; when not, the text states the fit target (1 m). */
  readonly fitErrorsM?: Readonly<Record<string, number>>;
  readonly rings?: NonNullable<VisualOverride["rings"]>;
  /** The tagged places of each mapped moon, as the body package stores them. */
  readonly packages: Readonly<Record<string, { readonly features: { readonly features: readonly PackageFeature[] }; readonly categories: { readonly categories: readonly BodyFeatureCategory[] }; readonly map?: { readonly coordinates: MapCoordinates } }>>;
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

/** A measured error as stated: rounded up to a tenth of a metre, never below the 1 m target the text has always given. */
const stated = (worstM: number): string => String(Math.max(1, Math.ceil(worstM * 10) / 10));

/** Where each dot moon's position comes from, for its information panel. */
const dotMoonProvenance = (fitSource: string, worstM?: number): Provenance => createProvenance({
  sourceType: "ephemeris",
  sources: [fitSource],
  accuracy: `Positions reproduce Horizons to within ${worstM === undefined ? "1" : stated(worstM)} m${worstM !== undefined && worstM > 1 ? " (this moon's own worst error in the fit's checks, including the check against Horizons about the planet, where part of the gap is Horizons' own kernel difference)" : ""}. Horizons' own uncertainty is far larger for the recently discovered moons and is not stated in its output. Radii marked estimate are brightness-based sizes.`,
  notes: "Each orbit line is the moon's own path from these positions over about one orbit, ending where the moon is now; for a moon perturbed by the Sun the line does not close exactly, so its oldest end fades out.",
});

/** What a system with a moon list holds, checked to be whole. */
interface MoonListParts {
  readonly catalogue: MoonCatalogue;
  readonly ephemeris: () => ChebyshevEphemeris;
  readonly fitSource: string;
  readonly tidalLockNote: string;
  readonly centreGmKm3S2: number;
}

/** The moon list parts of a system, or undefined when it has none; throws when only some are given. */
function moonListOf(settings: PlanetSettings, system: PlanetSystem): MoonListParts | undefined {
  const { catalogue: list, ephemeris, fitSource, tidalLockNote, centreGmKm3S2 } = system;
  if (list === undefined) {
    if (ephemeris !== undefined || fitSource !== undefined || tidalLockNote !== undefined || centreGmKm3S2 !== undefined) throw new PlanetBuildError(`planet "${settings.id}" has moon fit parts but no moon list`);
    if (settings.moons?.listSource !== undefined) throw new PlanetBuildError(`planet "${settings.id}" names a moon list source, which its system has no list for`);
    return undefined;
  }
  if (ephemeris === undefined || fitSource === undefined || tidalLockNote === undefined || centreGmKm3S2 === undefined) throw new PlanetBuildError(`planet "${settings.id}" has a moon list but not all of its ephemeris, fit source, tidal-lock note and centre GM`);
  if (settings.moons?.listSource === undefined || settings.moons.featuredFamilyId === undefined) throw new PlanetBuildError(`planet "${settings.id}" has a moon list but its settings give no list source and featured family`);
  return { catalogue: list, ephemeris, fitSource, tidalLockNote, centreGmKm3S2 };
}

/** The planet's dot moons as one body set: the layer the scene draws in one batch. Undefined when there is no dot moon and no mapped moon to batch an orbit line for. */
function planetMoonLayer(settings: PlanetSettings, system: MoonListParts & Pick<PlanetSystem, "composition" | "fitErrorsM">): BodySetLayer | undefined {
  const mapped = new Set(system.composition.bodies);
  const dots = system.catalogue.moons.filter((moon) => !mapped.has(moon.id));
  const mappedMoons = system.catalogue.moons.filter((moon) => mapped.has(moon.id));
  const ownPath = new Set(system.composition.paths?.map((path) => path.body));
  const batched = mappedMoons.filter((moon) => !ownPath.has(moon.id));
  if (dots.length === 0 && batched.length === 0) return undefined;
  const window = settings.window;
  const fitErrors = system.fitErrorsM;
  const provenance = dotMoonProvenance(system.fitSource, fitErrors === undefined ? undefined : Math.max(0, ...dots.map((moon) => fitErrors[moon.id] ?? Infinity)));
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

/** Every way the settings and the system can disagree, as a `PlanetBuildError` naming the setting; returns when they agree. */
function validatePlanetSystem(settings: PlanetSettings, system: PlanetSystem, moonList: MoonCatalogue | undefined): void {
  const mappedIds = new Set(system.composition.bodies.filter((id) => id !== settings.centre.id));
  const wanted = (settings.moons?.mapped ?? []).map((moon) => moon.id);
  for (const id of wanted) if (!mappedIds.has(id)) throw new PlanetBuildError(`planet "${settings.id}" describes the mapped moon "${id}", which its system does not draw as a body`);
  // With a moon list, a listed moon the system draws as a body needs words; without one, every body drawn about the centre does.
  for (const id of mappedIds) if ((moonList === undefined || moonList.moons.some((moon) => moon.id === id)) && !wanted.includes(id)) throw new PlanetBuildError(`planet "${settings.id}" has no words for the mapped moon "${id}"`);
  if (!system.composition.bodies.includes(settings.centre.id)) throw new PlanetBuildError(`planet "${settings.id}" centres on "${settings.centre.id}", which its system does not draw`);
  if (moonList !== undefined && !moonList.families.some((family) => family.id === settings.moons!.featuredFamilyId)) throw new PlanetBuildError(`planet "${settings.id}" features the family "${settings.moons!.featuredFamilyId}", which its moon list lacks`);
}

/** Builds one planet's view. Throws a `PlanetBuildError` naming the setting when the settings and the system disagree. */
export function buildPlanetDefinition(settings: PlanetSettings, system: PlanetSystem, panelsFile: unknown): ExperienceDefinition {
  const list = moonListOf(settings, system);
  const moonList = list?.catalogue;
  const window = settings.window;
  const moonRecord = (id: string): MoonRecord => {
    const moon = moonList?.moons.find((candidate) => candidate.id === id);
    if (moon === undefined) throw new PlanetBuildError(`planet "${settings.id}" names the moon "${id}", which its moon list lacks`);
    return moon;
  };
  /** A body's name: the moon list's for a listed moon, else the catalogue's. */
  const nameOf = (id: string): string => moonList?.moons.find((candidate) => candidate.id === id)?.name ?? catalogue.get(id).definition.label;
  const factsOf = (id: string) => moonFacts(moonList!, moonRecord(id));
  /** A moon's provenance: the given one with the sources of its family, size and discovery year added to its sources, so the panel has one list. */
  const withCatalogueSources = (provenance: Provenance, id: string): Provenance =>
    createProvenance({ ...provenance, sources: [...provenance.sources, ...moonSourceTitles(moonList!, moonRecord(id))] });

  const mappedIds = new Set(system.composition.bodies.filter((id) => id !== settings.centre.id));
  const mappedMoons = settings.moons?.mapped ?? [];
  validatePlanetSystem(settings, system, moonList);

  const layer = list === undefined ? undefined : planetMoonLayer(settings, { ...list, composition: system.composition, fitErrorsM: system.fitErrorsM });
  const dots = moonList === undefined ? [] : moonList.moons.filter((moon) => !mappedIds.has(moon.id));

  // The Horizons list the moons come from: its date is the list's asOf and its count is the moons the data holds (never typed in).
  const listSummary = moonList === undefined ? undefined : moonListSummary(moonList.moons.length, settings.moons!.listSource!, moonList.asOf);
  /** A dot moon's accuracy record: its own measured figure when the system has them (a moon with none is an error, not a default). */
  const dotProvenanceOf = (id: string): Provenance => {
    const figures = system.fitErrorsM;
    if (figures === undefined) return dotMoonProvenance(list!.fitSource);
    const worst = figures[id];
    if (worst === undefined) throw new PlanetBuildError(`planet "${settings.id}" has no measured fit error for the moon "${id}"`);
    return dotMoonProvenance(list!.fitSource, worst);
  };
  const familyLabel = (id: string) => moonList!.families.find((family) => family.id === id)!.label;

  const objects: ExperienceObject[] = [
    catalogueItem(settings.centre.id, {
      labelPriority: settings.centre.labelPriority,
      labelMaxDistance: settings.centre.labelMaxDistance,
      ...(listSummary === undefined ? {} : { facts: [{ label: "Known moons", value: listSummary }] }),
      description: settings.centre.description,
      knownLimitations: settings.centre.knownLimitations,
    }),
    ...mappedMoons.map((moon): ExperienceObject => {
      // A listed moon takes its facts from the list and the tidal-lock note; Earth's Moon, with no list, keeps what the catalogue says of it.
      if (list === undefined) return catalogueItem(moon.id, { labelPriority: moon.labelPriority, labelMaxDistance: moon.labelMaxDistance, description: moon.description });
      const item = catalogueItem(moon.id, { facts: factsOf(moon.id), labelPriority: moon.labelPriority, labelMaxDistance: moon.labelMaxDistance, description: moon.description, knownLimitations: [list.tidalLockNote] });
      return { ...item, provenance: withCatalogueSources(item.provenance!, moon.id) };
    }),
    // The other moons: not in the Object list (111 names would bury it) but selectable, so the moon panel can focus one and open its information.
    ...dots.map((moon): ExperienceObject => ({
      id: moon.id,
      label: moon.name,
      listed: false,
      description: `A small moon of ${settings.label} in the ${familyLabel(moon.family)}.`,
      facts: factsOf(moon.id),
      provenance: withCatalogueSources(dotProvenanceOf(moon.id), moon.id),
    })),
  ];

  // The moon panel's list: the families from the moon list, the mapped moons first with their pictures.
  const moonFamilies: MoonFamilyList | undefined = moonList === undefined ? undefined : {
    planetLabel: settings.label,
    listSource: settings.moons!.listSource!,
    listDate: moonList.asOf,
    featuredFamilyId: settings.moons!.featuredFamilyId!,
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

  // The tagged places on the centre and the mapped moons come from their body packages, latitude and longitude as the owner verified them, never rounded or corrected; a package whose map record declares west longitudes is converted as it loads (T-131).
  const bodyFeatures = settings.bodyFeatures.map((id) => {
    const body = system.packages[id];
    if (body === undefined) throw new PlanetBuildError(`planet "${settings.id}" lists tagged places for "${id}", which its system has no package for`);
    return bodyFeatureSet({ bodyId: id, bodyLabel: nameOf(id), features: placedFeatures(body.features.features, body.map?.coordinates), categories: body.categories, provenance: FEATURE_PROVENANCE });
  });

  const events = createEvents([]);
  const follow = settings.moons?.follow;
  const experience: ExperienceConfig = {
    objects,
    cameraPresets: [
      { id: "overview", label: "Overview", request: { kind: "overview" } },
      { id: `focus-${settings.centre.id}`, label: `Focus ${settings.label}`, request: { kind: "focus", target: settings.centre.id } },
      ...(follow === undefined ? [] : [
        { id: `focus-${follow}`, label: `Focus ${nameOf(follow)}`, request: { kind: "focus" as const, target: follow } },
        { id: `follow-${follow}`, label: `Follow ${nameOf(follow)}`, request: { kind: "follow" as const, target: follow } },
      ]),
    ],
    events,
    window,
    ...(moonFamilies === undefined ? {} : { moonFamilies }),
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
    bodySets: layer === undefined ? [] : [layer],
    camera: settings.camera,
    scaleChoices: ["true-scale"],
    startView: settings.startView,
    trackedBodies: [],
    prepare: () => system.load(window),
    createMetrics: ({ resolver }) => bodyMetrics(resolver, system.composition.bodies),
  };
}
