/** One end of a figure line: a Hipparcos number the engine's star list holds, or a J2000 position `[raDeg, decDeg]` (a star the list holds without a Hipparcos number). */
export type FigureEnd = number | readonly [raDeg: number, decDeg: number];

/** Constellation abbreviation (the IAU's three letters, such as `"Ori"`, `"UMa"`, `"CVn"`) to its figure's lines, each a pair of ends. */
export type ConstellationFigures = Readonly<Record<string, readonly (readonly [FigureEnd, FigureEnd])[]>>;

/** Constellation abbreviation to its boundary outlines, each a flat list `[raDeg, decDeg, raDeg, decDeg, ...]` in J2000; the last point joins the first. Serpens has two outlines (Caput, then Cauda), every other constellation one. */
export type ConstellationBoundaries = Readonly<Record<string, readonly (readonly number[])[]>>;

/** The IAU's name, English name and genitive of one constellation. */
export interface ConstellationName {
  readonly name: string;
  readonly english: string;
  readonly genitive: string;
}

/** Where every file came from, what was changed and how the boundaries were checked (also in `provenance.json`). */
export interface ConstellationProvenance {
  readonly package: string;
  readonly generator: string;
  readonly sources: Readonly<Record<string, Readonly<Record<string, string>>>>;
  readonly changes: readonly string[];
  readonly counts: Readonly<Record<string, unknown>>;
  readonly crossCheck: Readonly<Record<string, unknown>>;
  readonly precession: string;
}

// A dynamic import keeps each file its own chunk, so a bundler loads only what the app asks for (as astraeus-data-pluto does for its index).
const read = async <T>(load: () => Promise<unknown>): Promise<T> => {
  const loaded = (await load()) as { default?: T };
  return loaded.default ?? (loaded as T); // Parcel hands back the JSON itself, Vite and webpack a module with a default
};

/** The stick figures of all 88 constellations (IAU, as drawn by Sky & Telescope). */
export const loadFigures = (): Promise<ConstellationFigures> => read(() => import("../data/figures.json", { with: { type: "json" } }));

/** The boundary outlines of all 88 constellations in J2000 (Delporte, 1930). */
export const loadBoundaries = (): Promise<ConstellationBoundaries> => read(() => import("../data/boundaries.json", { with: { type: "json" } }));

/** The IAU names of all 88 constellations, by abbreviation. */
export const loadNames = (): Promise<Readonly<Record<string, ConstellationName>>> => read(() => import("../data/names.json", { with: { type: "json" } }));

/** Sources, licences, changes and the boundary cross-check. */
export const loadProvenance = (): Promise<ConstellationProvenance> => read(() => import("../data/provenance.json", { with: { type: "json" } }));
