import type { Provenance, SkyFigureEnd, SkyFigureInput } from "astraeus";

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

/** What `constellations` can be told. */
export interface ConstellationsOptions {
  /** Also return each constellation's boundary outline (`kind: "boundary"`; Serpens has two). Default false. */
  readonly outlines?: boolean;
  /** `"always"` (the default) or `"whenTraced"`: hidden until the app traces it. Applies to figures and outlines. */
  readonly shown?: "always" | "whenTraced";
  /** Line colour (a CSS colour text) for the figures and outlines; default: the look's. */
  readonly color?: string;
  /** Label colour (a CSS colour text); default: the look's. */
  readonly labelColor?: string;
  /** False leaves them out of the viewer's object menu (default true). */
  readonly listed?: boolean;
  /** Text put before every id, to avoid a clash with the app's own ids (default none). */
  readonly idPrefix?: string;
}

const provenance = (what: string, sources: readonly string[]): Provenance => ({
  sourceType: "illustrative",
  sources,
  accuracy: `${what} are conventional drawings, not measurements.`,
  notes: "From the astraeus-data-constellations package; see its NOTICE for licences.",
});
const FIGURE_SOURCES = ["IAU constellation figures (drawn by Sky & Telescope), via Stellarium skycultures/modern_iau, CC BY-SA 4.0", "Names: IAU, CC BY 4.0"];
const BOUNDARY_SOURCES = ["Constellation boundaries: Delporte (1930), via Stellarium skycultures/modern_iau, CC BY-SA 4.0, precessed to J2000", "Names: IAU, CC BY 4.0"];
const SERPENS_PARTS = ["Caput", "Cauda"];

const endOf = (end: FigureEnd): SkyFigureEnd => (typeof end === "number" ? { star: end } : { raDeg: end[0], decDeg: end[1] });

/**
 * Ready sky figures (and, when asked, boundary outlines) for constellations, to give to `scene.addSkyFigures`. Pass IAU abbreviations (`["Ori", "UMa"]`) or `"all"` for the 88.
 * Ids are the abbreviation for a figure (`"Ori"`) and `"Ori-boundary"` for its outline; Serpens' two outlines are `"Ser-boundary-1"` (Caput) and `"Ser-boundary-2"` (Cauda). `idPrefix` goes before every id.
 * An abbreviation that is unknown or repeated throws a `RangeError` naming it. Cards carry provenance and no facts; a story app adds those.
 * @example
 * const { constellations } = await import("astraeus-data-constellations");
 * scene.addSkyFigures(await constellations(["Ori", "Tau"], { shown: "whenTraced" }));
 * scene.addSkyFigures(await constellations("all", { outlines: true })); // all 88, with outlines
 */
export const constellations = async (which: readonly string[] | "all", options: ConstellationsOptions = {}): Promise<readonly SkyFigureInput[]> => {
  // The outlines are the biggest file (about 150 kB raw), so an app that asks for none never downloads it.
  const [figures, boundaries, names] = await Promise.all([loadFigures(), options.outlines === true ? loadBoundaries() : Promise.resolve<ConstellationBoundaries>({}), loadNames()]);
  const abbrs = which === "all" ? Object.keys(names).sort() : which;
  const seen = new Set<string>();
  const unknown: string[] = [];
  const repeated: string[] = [];
  for (const abbr of abbrs) {
    if (!Object.hasOwn(names, abbr)) unknown.push(String(abbr));
    else if (seen.has(abbr)) repeated.push(abbr);
    seen.add(abbr);
  }
  if (unknown.length > 0) throw new RangeError(`constellations: not an IAU abbreviation: ${unknown.join(", ")}`);
  if (repeated.length > 0) throw new RangeError(`constellations: repeated: ${repeated.join(", ")}`);
  const prefix = options.idPrefix ?? "";
  const common = {
    ...(options.shown === undefined ? {} : { shown: options.shown }),
    ...(options.color === undefined ? {} : { color: options.color }),
    ...(options.labelColor === undefined ? {} : { labelColor: options.labelColor }),
    ...(options.listed === undefined ? {} : { listed: options.listed }),
  };
  const out: SkyFigureInput[] = [];
  for (const abbr of abbrs) {
    const label = (names[abbr] as ConstellationName).name;
    out.push({
      id: `${prefix}${abbr}`,
      label,
      kind: "figure",
      segments: (figures[abbr] ?? []).map(([a, b]) => [endOf(a), endOf(b)] as const),
      provenance: provenance("Constellation figures", FIGURE_SOURCES),
      ...common,
    });
    if (options.outlines === true) {
      const loops = boundaries[abbr] ?? [];
      loops.forEach((flat, index) => {
        const points = [];
        for (let i = 0; i + 1 < flat.length; i += 2) points.push({ raDeg: flat[i] as number, decDeg: flat[i + 1] as number });
        const part = loops.length > 1 ? SERPENS_PARTS[index] : undefined;
        out.push({
          id: `${prefix}${abbr}-boundary${loops.length > 1 ? `-${index + 1}` : ""}`,
          label: part === undefined ? label : `${label} ${part}`,
          kind: "boundary",
          points,
          provenance: provenance("Constellation boundaries", BOUNDARY_SOURCES),
          ...common,
        });
      });
    }
  }
  return out;
};
