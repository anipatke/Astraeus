import type { BodyId } from "../core/body";
import { catalogue as builtInCatalogue, type BodyCatalogue } from "../assets/catalogue";
import type { ExperienceObject } from "../shell/experience";

/**
 * A body's shell item, written from the catalogue: its label, its colour, and the provenance and limitations of its
 * position. An experience passes only what is its own (the description, label priority and reach); it cannot restate
 * what the catalogue knows.
 */
export function catalogueItem(id: BodyId, own: Partial<Omit<ExperienceObject, "id" | "label">> = {}, source: BodyCatalogue = builtInCatalogue): ExperienceObject {
  const { definition, visual } = source.get(id);
  return {
    id,
    label: definition.label,
    color: visual.material.color,
    provenance: definition.accuracy.position,
    knownLimitations: definition.accuracy.orientationLimitations,
    ...own,
  };
}
