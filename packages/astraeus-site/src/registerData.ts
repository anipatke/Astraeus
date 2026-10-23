import { PICTURES } from "astraeus-data";
import { registerPictures } from "astraeus/assets/pictures";

// The moon maps, the 8k Venus map and the Milky Way ship in astraeus-data, not the engine; the site hands them to the engine before any experience builds
// its bodies. This module is imported first in main.tsx, so ES module order runs it before the experience modules evaluate.
registerPictures(PICTURES);
