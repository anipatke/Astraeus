// Mercury's system for the planets experience: Mercury alone (no moon), with its tagged places. The words and numbers are data/planets/mercury.json.
import { catalogue } from "astraeus/assets/catalogue";
import { createComposition } from "astraeus/assets/compositions";
import type { PlanetSystem } from "../planetDefinition";
import mercuryFeatures from "astraeus/data/bodies/mercury/features.json";
import mercuryCategories from "astraeus/data/bodies/mercury/categories.json";

export const mercurySystem: PlanetSystem = {
  composition: createComposition(catalogue, { id: "mercury", bodies: ["mercury"], defaultCenter: "mercury" }),
  packages: { mercury: { features: mercuryFeatures, categories: mercuryCategories } },
  load: async () => undefined,
};
