// Earth's system for the planets experience: Earth and the Moon as Apollo draws them (the Earth-Moon composition, the Moon from the astronomy adapter), with
// both bodies' tagged places. No moon list and no fitted data: nothing is downloaded beyond the page. The words and numbers are data/planets/earth.json.
import { earthMoonSystem } from "../../../assets/compositions";
import type { PlanetSystem } from "../planetDefinition";
import earthFeatures from "../../../../data/bodies/earth/features.json";
import earthCategories from "../../../../data/bodies/earth/categories.json";
import moonFeatures from "../../../../data/bodies/moon/features.json";
import moonCategories from "../../../../data/bodies/moon/categories.json";

export const earthSystem: PlanetSystem = {
  composition: earthMoonSystem,
  packages: {
    earth: { features: earthFeatures, categories: earthCategories },
    moon: { features: moonFeatures, categories: moonCategories },
  },
  load: async () => undefined,
};
