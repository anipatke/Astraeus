// Venus's system for the planets experience: Venus alone (no moon), with its tagged places. The words and numbers are data/planets/venus.json.
import { catalogue } from "../../../assets/catalogue";
import { createComposition } from "../../../assets/compositions";
import type { PlanetSystem } from "../planetDefinition";
import venusFeatures from "../../../../data/bodies/venus/features.json";
import venusCategories from "../../../../data/bodies/venus/categories.json";

export const venusSystem: PlanetSystem = {
  composition: createComposition(catalogue, { id: "venus", bodies: ["venus"], defaultCenter: "venus" }),
  packages: { venus: { features: venusFeatures, categories: venusCategories } },
  load: async () => undefined,
};
