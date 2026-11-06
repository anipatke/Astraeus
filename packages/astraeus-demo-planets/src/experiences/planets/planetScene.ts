// The planets scene builder: one planet's settings (data/planets/<planet>.json) and its system become a Scene, on the public API alone.
// Generic (ARCH-01): no planet, moon or story is named here; the names are in the settings file and the system.
import { Scene, trueScale, type AddBodyOptions, type DataSource, type PlaceInput, type Provenance, type StoryPanelInput, type StoryPanelPlaybackInput } from "astraeus";
import { moonFacts, moonSourceTitles, type MoonCatalogue, type MoonRecord } from "./moonList";
import type { PlanetSettings } from "./planetSettings";
import { isSurfacePlace, shownLongitude } from "./surfacePlace.mjs";

/** A tagged place as the body package stores it: some entries have no details (Earth), and a package may list a moon of the body without a position (Mars's Phobos and Deimos carry an orbit ring, not a latitude and longitude). Only entries with a position become markers. */
export interface PackageFeature {
  readonly id: string;
  readonly name: string;
  readonly featureType: string;
  readonly category: string;
  readonly description: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly details?: readonly { readonly label: string; readonly value: string }[];
  readonly ringRadius?: unknown;
  readonly moonRadius?: unknown;
}

/** The map record's longitude convention (`coordinates` of data/bodies/<body>/map.json), as far as the places need it. */
export interface MapCoordinates { readonly sourceLongitude?: string | null; readonly markerLongitudeFromSource?: { readonly scale: number; readonly offsetDeg: number } | null }

/** One body the planet's view draws as a full body, and whether and how it draws its orbit line (`addBody`'s `orbit`). */
export interface PlanetBody {
  readonly id: string;
  readonly orbit?: AddBodyOptions["orbit"];
}

/** What a planet's view is drawn from besides its settings: the moon list, the fitted positions' sources, the places. */
export interface PlanetSystem {
  /** The bodies drawn as full bodies: the planet first (it is the scene's centre), then its mapped moons in draw order. Every other moon in the moon list is a dot. */
  readonly bodies: readonly PlanetBody[];
  /** The moon list; a planet whose moon is not a fitted one (Earth's Moon) or that has none (Mercury, Venus) leaves it out, and then no moon panel and no small-moon set are built. */
  readonly moonList?: MoonCatalogue;
  /** Each moon's worst measured error against Horizons (m), from its fit index. When given, a dot moon's accuracy text states its own figure; when not, the text states the fit target (1 m). */
  readonly fitErrorsM?: Readonly<Record<string, number>>;
  /** How far before the window's start the orbit lines reach back (ms); absent: not at all. */
  readonly orbitHistoryMs?: number;
  /** The tagged places of the planet and its mapped moons, as the body packages store them. */
  readonly packages: Readonly<Record<string, { readonly features: { readonly features: readonly PackageFeature[] }; readonly categories: { readonly categories: readonly { readonly key: string; readonly label: string; readonly color: string }[] }; readonly map?: { readonly coordinates: MapCoordinates } }>>;
  /** The data packages the scene needs to be mounted with (the planet's moon positions); none for a planet without fitted moons. */
  readonly data: readonly DataSource[];
}

class PlanetBuildError extends RangeError {
  override readonly name = "PlanetBuildError";
}

/** Where each tagged place on a mapped moon comes from, for its information panel. */
const FEATURE_PROVENANCE: Provenance = {
  sourceType: "reconstructed",
  sources: ["Place names, kinds, descriptions and coordinates: Planetary Explorer's feature lists", "Map pictures: USGS Astrogeology and NASA mission mosaics"],
  accuracy: "Each place is drawn where it was checked against the map picture by eye, not at a surveyed position; a marker can sit a few degrees from the feature's centre, and a polar entry is a representative anchor, not a feature centre.",
  notes: "Markers hide on the far side of the moon and when the moon is drawn small.",
};

/** A measured error as stated: rounded up to a tenth of a metre, never below the 1 m target the text has always given. */
const stated = (worstM: number): string => String(Math.max(1, Math.ceil(worstM * 10) / 10));

/** Where each dot moon's position comes from, for its information panel. */
const dotMoonProvenance = (fitSource: string, worstM?: number): Provenance => ({
  sourceType: "ephemeris",
  sources: [fitSource],
  accuracy: `Positions reproduce Horizons to within ${worstM === undefined ? "1" : stated(worstM)} m${worstM !== undefined && worstM > 1 ? " (this moon's own worst error in the fit's checks, including the check against Horizons about the planet, where part of the gap is Horizons' own kernel difference)" : ""}. Horizons' own uncertainty is far larger for the recently discovered moons and is not stated in its output. Radii marked estimate are brightness-based sizes.`,
  notes: "Each orbit line is the moon's own path from these positions over about one orbit, ending where the moon is now; for a moon perturbed by the Sun the line does not close exactly, so its oldest end fades out.",
});

/** A provenance with more sources after its own. */
const withSources = (provenance: Provenance, sources: readonly string[]): Provenance => ({ ...provenance, sources: [...provenance.sources, ...sources] });

/** The surface places of a package (the planet places rule: a position, no ring-plane fields), each with its details (none when the package gives none); latitude as stored, longitude as stored unless the map record says the stored values are west longitudes (shownLongitude). */
export function placesOf(features: readonly PackageFeature[], coordinates: MapCoordinates | undefined): readonly PlaceInput[] {
  return features.flatMap((feature) => !isSurfacePlace(feature) ? [] : [{
    id: feature.id,
    name: feature.name,
    kind: feature.featureType,
    category: feature.category,
    latitudeDeg: feature.latitude!,
    longitudeDeg: shownLongitude(feature.longitude!, coordinates),
    description: feature.description,
    details: feature.details ?? [],
  }]);
}

/** The moon list and the settings that go with it: all three of list source, featured family and fit source exactly when the system has a list, and the featured family one of the list's. */
function validateMoonList(settings: PlanetSettings, moonList: MoonCatalogue | undefined): void {
  if (moonList === undefined) {
    if (settings.moons?.listSource !== undefined) throw new PlanetBuildError(`planet "${settings.id}" names a moon list source, which its system has no list for`);
    return;
  }
  const moons = settings.moons;
  if (moons?.listSource === undefined || moons.featuredFamilyId === undefined || moons.fitSource === undefined) throw new PlanetBuildError(`planet "${settings.id}" has a moon list but its settings give no list source, featured family and fit source`);
  if (!moonList.families.some((family) => family.id === moons.featuredFamilyId)) throw new PlanetBuildError(`planet "${settings.id}" features the family "${moons.featuredFamilyId}", which its moon list lacks`);
}

/** Every way the settings and the system can disagree, as a `PlanetBuildError` naming the setting; returns when they agree. */
function validatePlanetSystem(settings: PlanetSettings, system: PlanetSystem): void {
  const moonList = system.moonList;
  validateMoonList(settings, moonList);
  if (system.bodies[0]?.id !== settings.centre.id) throw new PlanetBuildError(`planet "${settings.id}" centres on "${settings.centre.id}", which its system does not draw first`);
  const mappedIds = new Set(system.bodies.slice(1).map((body) => body.id));
  const wanted = (settings.moons?.mapped ?? []).map((moon) => moon.id);
  for (const id of wanted) if (!mappedIds.has(id)) throw new PlanetBuildError(`planet "${settings.id}" describes the mapped moon "${id}", which its system does not draw as a body`);
  // With a moon list, a listed moon the system draws as a body needs words; without one, every body drawn about the centre does.
  for (const id of mappedIds) if ((moonList === undefined || moonList.moons.some((moon) => moon.id === id)) && !wanted.includes(id)) throw new PlanetBuildError(`planet "${settings.id}" has no words for the mapped moon "${id}"`);
}

/** The planet's dots as one body set, with the mapped moons' orbit lines in its batch; absent when there is no dot and no mapped moon to batch an orbit line for. */
function addSmallMoons(scene: Scene, settings: PlanetSettings, system: PlanetSystem & { readonly moonList: MoonCatalogue }): void {
  const list = system.moonList;
  const mapped = new Set(system.bodies.map((body) => body.id));
  const dots = list.moons.filter((moon) => !mapped.has(moon.id));
  const mappedMoons = list.moons.filter((moon) => mapped.has(moon.id));
  const ownLine = new Set(system.bodies.filter((body) => body.orbit !== undefined && body.orbit !== false).map((body) => body.id));
  if (dots.length === 0 && mappedMoons.every((moon) => ownLine.has(moon.id))) return;
  const fitSource = settings.moons!.fitSource!;
  const figures = system.fitErrorsM;
  const familyLabel = (id: string) => list.families.find((family) => family.id === id)!.label;
  /** A dot moon's accuracy record: its own measured figure when the system has them (a moon with none is an error, not a default). */
  const dotProvenanceOf = (id: string): Provenance => {
    if (figures === undefined) return dotMoonProvenance(fitSource);
    const worst = figures[id];
    if (worst === undefined) throw new PlanetBuildError(`planet "${settings.id}" has no measured fit error for the moon "${id}"`);
    return dotMoonProvenance(fitSource, worst);
  };
  scene.addBodySet({
    id: `${settings.id}-small-moons`,
    families: list.families.map(({ id, label }) => ({ id, label })),
    members: dots.map((moon) => ({
      id: moon.id,
      family: moon.family,
      label: moon.name,
      radiusKm: moon.meanRadiusKm,
      description: `A small moon of ${settings.label} in the ${familyLabel(moon.family)}.`,
      facts: moonFacts(list, moon),
      provenance: withSources(dotProvenanceOf(moon.id), moonSourceTitles(list, moon)),
    })),
    bodies: mappedMoons.map((moon) => ({ id: moon.id, family: moon.family })),
    provenance: dotMoonProvenance(fitSource, figures === undefined ? undefined : Math.max(0, ...dots.map((moon) => figures[moon.id] ?? Infinity))),
    ...(system.orbitHistoryMs === undefined ? {} : { orbitHistoryMs: system.orbitHistoryMs }),
  });
}

/** The moon panel: the families from the moon list, the featured family first. Called before the centre is added, so the centre's card can state the list. */
function setMoonPanel(scene: Scene, settings: PlanetSettings, list: MoonCatalogue): void {
  scene.setMoonPanel({
    label: settings.label,
    listSource: settings.moons!.listSource!,
    listDate: list.asOf,
    featuredFamily: settings.moons!.featuredFamilyId!,
    families: list.families.map((family) => ({
      id: family.id,
      label: family.label,
      description: family.description,
      moons: list.moons.filter((moon) => moon.family === family.id).map((moon) => ({ id: moon.id, named: moon.named })),
    })),
  });
}

/** Builds one planet's scene. Throws a `PlanetBuildError` naming the setting when the settings and the system disagree. */
export function buildPlanetScene(settings: PlanetSettings, system: PlanetSystem, panelsFile: unknown): Scene {
  validatePlanetSystem(settings, system);
  const list = system.moonList;
  const window = settings.window;
  const moonRecord = (id: string): MoonRecord => {
    const moon = list?.moons.find((candidate) => candidate.id === id);
    if (moon === undefined) throw new PlanetBuildError(`planet "${settings.id}" names the moon "${id}", which its moon list lacks`);
    return moon;
  };
  const scene = new Scene();
  scene
    .setTimeline({ start: window.startUtcMs, end: window.endUtcMs, rates: settings.rates, rate: settings.clockRate })
    .setScale(trueScale, { only: true })
    .setBodyReadouts(["distance", "phase", "coordinates"])
    .setLook({ desktopPictures: true });
  if (list !== undefined) setMoonPanel(scene, settings, list);

  scene.addBody(settings.centre.id, {
    labelPriority: settings.centre.labelPriority,
    labelReachEarthRadii: settings.centre.labelMaxDistance,
    ...(scene.moonPanel === undefined ? {} : { facts: [{ label: "Known moons", value: scene.moonPanel.summary }] }),
    description: settings.centre.description,
    knownLimitations: settings.centre.knownLimitations,
  });
  for (const moon of settings.moons?.mapped ?? []) {
    const orbit = system.bodies.find((body) => body.id === moon.id)!.orbit;
    // A listed moon takes its facts and the sources of its family, size and discovery from the list; Earth's Moon, with no list, keeps what the catalogue says of it.
    scene.addBody(moon.id, {
      labelPriority: moon.labelPriority,
      labelReachEarthRadii: moon.labelMaxDistance,
      description: moon.description,
      ...(moon.knownLimitations === undefined ? {} : { knownLimitations: moon.knownLimitations }),
      ...(orbit === undefined ? {} : { orbit }),
      ...(list === undefined ? {} : { facts: moonFacts(list, moonRecord(moon.id)), sources: moonSourceTitles(list, moonRecord(moon.id)) }),
    });
  }
  if (list !== undefined) addSmallMoons(scene, settings, { ...system, moonList: list });

  // The tagged places on the centre and the mapped moons come from their body packages, latitude and longitude as the owner verified them, never rounded or corrected; a package whose map record declares west longitudes is converted as it loads (T-131).
  for (const id of settings.bodyFeatures) {
    const body = system.packages[id];
    if (body === undefined) throw new PlanetBuildError(`planet "${settings.id}" lists tagged places for "${id}", which its system has no package for`);
    scene.addPlaces(id, { categories: body.categories.categories, places: placesOf(body.features.features, body.map?.coordinates), provenance: FEATURE_PROVENANCE });
  }

  const follow = settings.moons?.follow;
  scene.camera.setFollowChoices(follow === undefined ? [] : [follow]);
  scene.camera.setStartView(settings.startView);
  scene.camera.setReach(settings.camera.maxFocusDistance, { farEarthRadii: settings.camera.far });
  // The story's panels are story data (data/stories/<story>/panels.json), checked against this scene's objects and window.
  const { panels, ...playback } = panelsFile as StoryPanelPlaybackInput & { readonly panels: readonly StoryPanelInput[] };
  scene.addStoryPanels(panels).setStoryPanelPlayback(playback);
  return scene;
}
