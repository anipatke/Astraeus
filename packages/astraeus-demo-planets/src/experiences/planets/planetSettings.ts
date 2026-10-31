// Planet settings: the settings types and their strict validation from a planet file (data/planets/<planet>.json), the Showers pattern.
import { validateStartView, type StartView } from "astraeus/app/viewLink";
import type { Raw } from "astraeus/core/fieldReaders";
import { settingsFields } from "astraeus/experiences/settingsFields";

/** A moon drawn as a full body: its words and when its label shows. The moon's facts come from the moon list. */
export interface PlanetMappedMoon {
  readonly id: string;
  readonly labelPriority: number;
  readonly labelMaxDistance: number;
  readonly description: string;
}

/** Everything a planet's view needs as plain data; the positions, moon list, pictures come from the planet's system (see `PlanetSystem`). */
export interface PlanetSettings {
  readonly id: string;
  readonly label: string;
  /** Place in the switch (lowest first). */
  readonly order: number;
  /** The planet the experience opens on when the address names none. Exactly one planet's file sets it. */
  readonly default: boolean;
  /** Names the planet's system: the moon list, positions, mapped pictures it is drawn from. */
  readonly system: string;
  /** The page title and experience name. */
  readonly experienceLabel: string;
  readonly window: { readonly startUtcMs: number; readonly endUtcMs: number };
  readonly clockRate: number;
  readonly rates: readonly number[];
  readonly centre: {
    readonly id: string;
    readonly labelPriority: number;
    readonly labelMaxDistance: number;
    readonly description: string;
    readonly knownLimitations: readonly string[];
  };
  /** Absent for a planet with no moon to draw (Mercury, Venus). */
  readonly moons?: {
    /** The moon list's source and the family the moon panel opens on; both present exactly when the planet's system has a moon list. */
    readonly listSource?: string;
    readonly featuredFamilyId?: string;
    /** The mapped moon the camera presets focus and follow. Absent for a planet with no mapped moon (Uranus). */
    readonly follow?: string;
    readonly mapped: readonly PlanetMappedMoon[];
  };
  /** The bodies (the centre or a mapped moon) whose tagged places show. */
  readonly bodyFeatures: readonly string[];
  /** Repo-relative path of the story's panels file (`data/stories/<story>/panels.json`). */
  readonly story: { readonly panels: string };
  readonly camera: { readonly maxFocusDistance: number; readonly far: number };
  readonly startView: StartView;
}

export class PlanetSettingsError extends TypeError {
  override readonly name = "PlanetSettingsError";
}

function fail(path: string, problem: string): never {
  throw new PlanetSettingsError(`planet settings ${path} ${problem}`);
}

const { record, text, finite, instant, positive } = settingsFields(fail);

const WORDS = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const PLANET_PANELS_PATH = /^data\/stories\/[a-z0-9]+(-[a-z0-9]+)*\/panels\.json$/;

/** Rejects a key the format does not have, so a misspelt setting is an error rather than silently ignored. */
function only(raw: Raw, keys: readonly string[], path: string): void {
  for (const key of Object.keys(raw)) if (!keys.includes(key)) fail(`${path}.${key}`, `is not a planet setting (expected ${keys.join(", ")})`);
}

function words(parent: Raw, key: string, path: string): string {
  const value = text(parent, key, path);
  if (!WORDS.test(value)) fail(`${path}.${key}`, `must be lower-case words joined by hyphens, got "${value}"`);
  return value;
}

function list(parent: Raw, key: string, path: string): readonly unknown[] {
  const value = parent[key];
  if (!Array.isArray(value)) fail(`${path}.${key}`, "is required and must be a list");
  return value;
}

function textList(parent: Raw, key: string, path: string, minimum: number): readonly string[] {
  const items = list(parent, key, path);
  if (items.length < minimum) fail(`${path}.${key}`, `must list at least ${minimum}`);
  items.forEach((item, index) => { if (typeof item !== "string" || item.trim() === "") fail(`${path}.${key}[${index}]`, "must be non-empty text"); });
  return items as string[];
}

function mappedMoon(input: unknown, path: string): PlanetMappedMoon {
  const raw = record(input, path);
  only(raw, ["id", "labelPriority", "labelMaxDistance", "description"], path);
  return { id: words(raw, "id", path), labelPriority: finite(raw, "labelPriority", path), labelMaxDistance: positive(raw, "labelMaxDistance", path), description: text(raw, "description", path) };
}

/** The optional `moons` block: its settings and the ids of the mapped moons (empty when the block is absent). */
function parseMoons(root: Raw): { readonly moons: PlanetSettings["moons"]; readonly mappedIds: readonly string[] } {
  let moons: PlanetSettings["moons"];
  const mappedIds: string[] = [];
  if (root.moons !== undefined) {
    const raw = record(root.moons, "moons");
    only(raw, ["listSource", "featuredFamilyId", "follow", "mapped"], "moons");
    const mapped = list(raw, "mapped", "moons").map((moon, index) => mappedMoon(moon, `moons.mapped[${index}]`));
    mappedIds.push(...mapped.map((moon) => moon.id));
    if (new Set(mappedIds).size !== mappedIds.length) fail("moons.mapped", "lists a moon twice");
    // A planet may have no mapped moon (every moon a dot); then there is nothing to follow.
    const follow = mapped.length === 0 && raw.follow === undefined ? undefined : words(raw, "follow", "moons");
    if (follow !== undefined && !mappedIds.includes(follow)) fail("moons.follow", mapped.length === 0 ? "needs a mapped moon to follow" : `must be one of the mapped moons (${mappedIds.join(", ")}), got "${follow}"`);
    if ((raw.listSource === undefined) !== (raw.featuredFamilyId === undefined)) fail("moons.listSource", "and moons.featuredFamilyId go together: give both or neither");
    moons = { ...(raw.listSource === undefined ? {} : { listSource: text(raw, "listSource", "moons"), featuredFamilyId: words(raw, "featuredFamilyId", "moons") }), ...(follow === undefined ? {} : { follow }), mapped };
  }
  return { moons, mappedIds };
}

/** Checks a settings object field by field and returns it typed. Every error names the field. */
export function parsePlanetSettings(input: unknown): PlanetSettings {
  const root = record(input, "settings");
  only(root, ["id", "label", "order", "default", "system", "experienceLabel", "window", "clockRate", "rates", "centre", "moons", "bodyFeatures", "story", "camera", "startView"], "settings");
  const window = record(root.window, "window");
  only(window, ["startUtc", "endUtc"], "window");
  const startUtcMs = Date.parse(instant(window, "startUtc", "window"));
  const endUtcMs = Date.parse(instant(window, "endUtc", "window"));
  if (endUtcMs <= startUtcMs) fail("window.endUtc", "must be after window.startUtc");

  const rates = list(root, "rates", "settings");
  if (rates.length === 0 || !rates.every((rate) => typeof rate === "number" && Number.isFinite(rate) && rate > 0)) fail("settings.rates", `must be a non-empty list of positive numbers, got ${JSON.stringify(rates)}`);

  const centre = record(root.centre, "centre");
  only(centre, ["id", "labelPriority", "labelMaxDistance", "description", "knownLimitations"], "centre");
  const { moons, mappedIds } = parseMoons(root);

  const bodyFeatures = textList(root, "bodyFeatures", "settings", 0);
  const centreId = words(centre, "id", "centre");
  for (const id of bodyFeatures) if (id !== centreId && !mappedIds.includes(id)) fail("settings.bodyFeatures", `names "${id}", which is neither the centre nor a mapped moon`);

  const story = record(root.story, "story");
  only(story, ["panels"], "story");
  const panels = text(story, "panels", "story");
  if (!PLANET_PANELS_PATH.test(panels)) fail("story.panels", `must be a path like data/stories/<story>/panels.json, got "${panels}"`);

  const camera = record(root.camera, "camera");
  only(camera, ["maxFocusDistance", "far"], "camera");
  if (typeof root.default !== "boolean") fail("settings.default", "is required and must be true or false");

  let startView: StartView;
  try { startView = validateStartView(root.startView, "startView"); } catch (error) { return fail("startView", (error as Error).message); }

  return {
    id: words(root, "id", "settings"),
    label: text(root, "label", "settings"),
    order: finite(root, "order", "settings"),
    default: root.default,
    system: words(root, "system", "settings"),
    experienceLabel: text(root, "experienceLabel", "settings"),
    window: { startUtcMs, endUtcMs },
    clockRate: positive(root, "clockRate", "settings"),
    rates: rates as number[],
    centre: { id: centreId, labelPriority: finite(centre, "labelPriority", "centre"), labelMaxDistance: positive(centre, "labelMaxDistance", "centre"), description: text(centre, "description", "centre"), knownLimitations: textList(centre, "knownLimitations", "centre", 0) },
    ...(moons === undefined ? {} : { moons }),
    bodyFeatures,
    story: { panels },
    camera: { maxFocusDistance: positive(camera, "maxFocusDistance", "camera"), far: positive(camera, "far", "camera") },
    startView,
  };
}
