/** Planets the astronomy adapter has a heliocentric model for (Saturn to Pluto added by O-033 T-114). */
export type PlanetId = "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto";

export const PLANET_IDS: readonly PlanetId[] = Object.freeze(["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]);

export function isPlanetId(id: string): id is PlanetId {
  return (PLANET_IDS as readonly string[]).includes(id);
}

/** One planet's heliocentric ecliptic-J2000 model (curve fits of VSOP87A), as the astronomy adapter reads it. */
export interface PlanetModel {
  xyz(date: Date): {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly coordinate_keywords: string;
    readonly unit_keywords: string;
  };
}

export type PlanetModels = { readonly [P in PlanetId]: PlanetModel };

let loading: Promise<void> | undefined;
let models: PlanetModels | undefined;

/**
 * Builds the planet models, once, from the stored curve fits of the full VSOP87A series (Pluto: of JPL Horizons states) (O-025 T-101, O-033 T-114; the library's compact
 * default tables are off by tens of thousands of km, docs/ASTRONOMY_VALIDATION.md, and its full series were about 0.8 MB of code).
 * The fits are a separate chunk fetched only when a mounted composition contains a planet; an experience without one never
 * downloads them (I-022).
 */
export function loadPlanetSeries(): Promise<void> {
  loading ??= import("./planetModels").then((module) => { models = module.createPlanetModels(); });
  return loading;
}

/** Whether the planet series have finished loading. */
export function planetSeriesLoaded(): boolean {
  return models !== undefined;
}

/** The loaded planet models; throws before `loadPlanetSeries()` resolved rather than falling back to the compact tables. */
export function planetModels(): PlanetModels {
  if (models === undefined) throw new Error("the planet series are not loaded: await loadPlanetSeries() before mounting a composition with a planet");
  return models;
}
