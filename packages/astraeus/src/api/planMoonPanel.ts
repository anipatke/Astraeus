import type { BodyCatalogue } from "../assets/catalogue";
import { moonListSummary } from "../core/moonListText";
import type { ExperienceDefinition } from "../app/experienceDefinition";
import { SceneError } from "./errors";
import type { MoonPanelFamilyInput, MoonPanelInput } from "./moonPanelInput";
import { frozenList, type SceneMoonPanelRead } from "./sceneReads";
import { toUtcMs } from "./time";

type MoonFamilyList = NonNullable<ExperienceDefinition["experience"]["moonFamilies"]>;

const bad = (message: string): SceneError => new SceneError("bad-moon-panel", `setMoonPanel: ${message}`);
const isText = (value: unknown): value is string => typeof value === "string" && value !== "";

/** The `YYYY-MM-DD` day of a list date, or throws `bad-moon-panel` when it is not a moment. */
function dayOf(input: MoonPanelInput): string | undefined {
  if (input.listDate === undefined) return undefined;
  try {
    return new Date(toUtcMs(input.listDate, "listDate")).toISOString().slice(0, 10);
  } catch {
    throw bad(`listDate "${String(input.listDate)}" is not a valid moment; use an ISO day such as "2026-10-18", a Date or Unix milliseconds`);
  }
}

/** Checks one family and its moons; `families` and `moons` collect the ids seen so far. */
function checkFamily(family: MoonPanelFamilyInput, families: Set<string>, moons: Set<string>): void {
  if (!isText(family?.id)) throw bad("every family needs a non-empty id");
  if (families.has(family.id)) throw bad(`family "${family.id}" appears twice`);
  families.add(family.id);
  if (!isText(family.label)) throw bad(`family "${family.id}" needs a label`);
  if (!isText(family.description)) throw bad(`family "${family.id}" needs a one-line description`);
  if (!Array.isArray(family.moons)) throw bad(`family "${family.id}": moons must be a list`);
  for (const moon of family.moons) {
    if (!isText(moon?.id)) throw bad(`family "${family.id}": every moon needs a non-empty id`);
    if (moons.has(moon.id)) throw bad(`moon "${moon.id}" appears twice`);
    moons.add(moon.id);
    if (moon.named !== undefined && typeof moon.named !== "boolean") throw bad(`moon "${moon.id}": named must be true or false`);
  }
}

/** Checks the panel's words, families, moons and list source and date; returns the list day. */
function checkInput(input: MoonPanelInput): string | undefined {
  if (typeof input !== "object" || input === null) throw bad("give a { label, families } object");
  if (!isText(input.label)) throw bad("the panel needs a label");
  if (!Array.isArray(input.families) || input.families.length === 0) throw bad("the panel needs at least one family");
  const families = new Set<string>();
  const moons = new Set<string>();
  for (const family of input.families) checkFamily(family, families, moons);
  if (input.featuredFamily !== undefined && !families.has(input.featuredFamily)) throw bad(`featuredFamily "${String(input.featuredFamily)}" is not one of the families`);
  if (input.listSource !== undefined && !isText(input.listSource)) throw bad("listSource must be a non-empty text");
  return dayOf(input);
}

/** What a `Scene` has planned for its moon panel. */
export class MoonPanelPlan {
  #input: MoonPanelInput | undefined;
  #day: string | undefined;

  set(input: MoonPanelInput): void {
    this.#day = checkInput(input);
    this.#input = input;
  }

  get input(): MoonPanelInput | undefined { return this.#input; }

  /** The moon count and the line "115 moons in the JPL Horizons list of 18 October 2026"; undefined when no panel was set. */
  read(): SceneMoonPanelRead | undefined {
    const input = this.#input;
    if (input === undefined) return undefined;
    const count = input.families.reduce((total, family) => total + family.moons.length, 0);
    return Object.freeze({ count, summary: moonListSummary(count, input.listSource, this.#day) });
  }

  /**
   * The shell's list: each moon must be a body or body-set member of the scene (`labels` maps those ids to their labels); a moon that is a body gets the
   * picture the viewer's data brings for it (`pictureOf`), a dot none.
   */
  list(labels: ReadonlyMap<string, string>, bodies: ReadonlySet<string>, catalogue: BodyCatalogue, pictureOf: (picture: string) => string | undefined): MoonFamilyList | undefined {
    const input = this.#input;
    if (input === undefined) return undefined;
    return {
      planetLabel: input.label,
      ...(input.featuredFamily === undefined ? {} : { featuredFamilyId: input.featuredFamily }),
      families: frozenList(input.families.map((family) => ({
        id: family.id,
        label: family.label,
        description: family.description,
        moons: frozenList(family.moons.map((moon) => {
          const label = labels.get(moon.id);
          if (label === undefined) throw bad(`moon "${moon.id}" in family "${family.id}" is not a body or body-set member of the scene`);
          const picture = bodies.has(moon.id) ? pictureOf(catalogue.has(moon.id) ? catalogue.get(moon.id).visual.picture ?? moon.id : moon.id) : undefined;
          return { id: moon.id, label, named: moon.named ?? true, ...(picture === undefined ? {} : { pictureUrl: picture }) };
        })),
      }))),
      ...(input.listSource === undefined ? {} : { listSource: input.listSource }),
      ...(this.#day === undefined ? {} : { listDate: this.#day }),
    };
  }
}
