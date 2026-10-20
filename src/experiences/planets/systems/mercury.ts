// Mercury's system for the planets experience: Mercury alone (no moon), with its tagged places. The words and numbers are data/planets/mercury.json.
import { catalogue } from "../../../assets/catalogue";
import { createComposition } from "../../../assets/compositions";
import type { PlanetSystem } from "../planetDefinition";
import mercuryFeatures from "../../../../data/bodies/mercury/features.json";
import mercuryCategories from "../../../../data/bodies/mercury/categories.json";

export const mercurySystem: PlanetSystem = {
  composition: createComposition(catalogue, { id: "mercury", bodies: ["mercury"], defaultCenter: "mercury" }),
  packages: { mercury: { features: mercuryFeatures, categories: mercuryCategories } },
  load: async () => undefined,
};
