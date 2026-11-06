import type { BodyId } from "../core/body";
import { createProvenance } from "../core/provenance";
import type { ExperienceDefinition } from "../app/experienceDefinition";
import { SceneError } from "./errors";
import { idOf } from "./bodySetChecks";
import type { BodyRef } from "./bodies";
import type { PlaceInput, PlacesInput } from "./moonPanelInput";
import { frozenList, type ScenePlacesRead } from "./sceneReads";

type BodyFeatureSet = NonNullable<ExperienceDefinition["experience"]["bodyFeatures"]>[number];

const HEX = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;
const bad = (body: unknown, message: string): SceneError => new SceneError("bad-places", `addPlaces("${String(body)}"): ${message}`);
const isText = (value: unknown): value is string => typeof value === "string" && value !== "";
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/** Checks the categories; returns nothing, throws `bad-places`. */
function checkCategories(body: string, categories: PlacesInput["categories"]): void {
  if (!Array.isArray(categories)) throw bad(body, "categories must be a list");
  const keys = new Set<string>();
  for (const category of categories) {
    if (!isText(category?.key)) throw bad(body, "every category needs a non-empty key");
    if (keys.has(category.key)) throw bad(body, `category "${category.key}" appears twice`);
    keys.add(category.key);
    if (!isText(category.label)) throw bad(body, `category "${category.key}" needs a label`);
    if (typeof category.color !== "string" || !HEX.test(category.color)) throw bad(body, `category "${category.key}": color "${String(category.color)}" is not a hex colour such as "#9de3a8"`);
  }
}

/** Checks one place: its words, its position and its details. */
function checkPlace(body: string, place: PlaceInput): void {
  for (const field of ["name", "kind", "category", "description"] as const) if (!isText(place[field])) throw bad(body, `place "${place.id}": ${field} must be a non-empty text`);
  if (!isNumber(place.latitudeDeg) || place.latitudeDeg < -90 || place.latitudeDeg > 90) throw bad(body, `place "${place.id}": latitudeDeg must be a number from -90 to 90`);
  if (!isNumber(place.longitudeDeg)) throw bad(body, `place "${place.id}": longitudeDeg must be a finite number`);
  const details = place.details;
  if (details !== undefined && !(Array.isArray(details) && details.every((fact) => isText(fact?.label) && isText(fact.value)))) throw bad(body, `place "${place.id}": details must be a list of { label, value } with both texts non-empty`);
}

/** Checks the categories, places, provenance and limits of one body's places. */
function checkInput(body: string, input: PlacesInput): void {
  if (typeof input !== "object" || input === null) throw bad(body, "give a { categories, places, provenance } object");
  checkCategories(body, input.categories);
  if (!Array.isArray(input.places) || input.places.length === 0) throw bad(body, "give at least one place");
  const ids = new Set<string>();
  for (const place of input.places) {
    if (!isText(place?.id)) throw bad(body, "every place needs a non-empty id");
    if (ids.has(place.id)) throw bad(body, `place "${place.id}" appears twice`);
    ids.add(place.id);
    checkPlace(body, place);
  }
  if (typeof input.provenance !== "object" || input.provenance === null) throw bad(body, "the places need a provenance");
  try {
    createProvenance(input.provenance);
  } catch (error) {
    throw bad(body, `provenance: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (input.knownLimitations !== undefined && !(Array.isArray(input.knownLimitations) && input.knownLimitations.every(isText))) throw bad(body, "knownLimitations must be a list of non-empty texts");
}

/** What a `Scene` has planned for its tagged surface places, by body. */
export class PlacesPlan {
  readonly sets = new Map<BodyId, PlacesInput>();
  add(body: BodyRef | BodyId, input: PlacesInput): void {
    const id = idOf(body as string | { readonly id: string });
    if (!isText(id)) throw bad(id, "name the body: a body or its id");
    if (this.sets.has(id)) throw new SceneError("duplicate-id", `addPlaces("${id}"): that body already has places; give them all in one call`);
    checkInput(id, input);
    this.sets.set(id, input);
  }

  /** The places in the order added. */
  reads(): readonly ScenePlacesRead[] {
    return frozenList([...this.sets].map(([body, input]): ScenePlacesRead => ({ body, count: input.places.length })));
  }

  /** The shell's sets, once the finished scene says which bodies it holds (`labels` maps them to their labels). */
  featureSets(labels: ReadonlyMap<string, string>): readonly BodyFeatureSet[] {
    return [...this.sets].map(([body, input]) => {
      const label = labels.get(body);
      if (label === undefined) throw bad(body, "the body has not been added to the scene");
      return {
        bodyId: body,
        bodyLabel: label,
        categories: input.categories.map(({ key, label: categoryLabel, color }) => ({ key, label: categoryLabel, color })),
        features: input.places.map((place) => ({ id: place.id, name: place.name, featureType: place.kind, category: place.category, latitude: place.latitudeDeg, longitude: place.longitudeDeg, description: place.description, details: (place.details ?? []).map(({ label: factLabel, value }) => ({ label: factLabel, value })) })),
        provenance: createProvenance(input.provenance),
        ...(input.knownLimitations === undefined ? {} : { knownLimitations: [...input.knownLimitations] }),
      };
    });
  }
}
