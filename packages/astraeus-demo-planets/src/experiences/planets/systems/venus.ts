// Venus's system for the planets experience: Venus alone (no moon), with its tagged places. The words and numbers are data/planets/venus.json.
import { catalogue } from "../../../../../astraeus/src/assets/catalogue";
import { createComposition } from "../../../../../astraeus/src/assets/compositions";
import type { PlanetSystem } from "../planetDefinition";
import venusFeatures from "../../../../../astraeus/data/bodies/venus/features.json";
import venusCategories from "../../../../../astraeus/data/bodies/venus/categories.json";

export const venusSystem: PlanetSystem = {
  composition: createComposition(catalogue, { id: "venus", bodies: ["venus"], defaultCenter: "venus" }),
  packages: { venus: { features: venusFeatures, categories: venusCategories } },
  load: async () => undefined,
};
