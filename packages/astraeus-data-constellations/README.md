# astraeus-data-constellations

The 88 IAU constellations for the [Astraeus](https://github.com/anipatke/Astraeus) engine: the stick figures, the boundary outlines in J2000 and the IAU names. Optional data; the engine draws without it.

| File | What it holds |
|------|---------------|
| `figures.json` | per constellation (IAU three-letter abbreviation, such as `Ori`), the figure's lines as pairs of ends; an end is a Hipparcos number the engine's star list holds, or `[raDeg, decDeg]` (J2000) |
| `boundaries.json` | per constellation, its outlines as flat `[raDeg, decDeg, ...]` lists in J2000; the last point joins the first; Serpens has two (Caput, Cauda) |
| `names.json` | per constellation, the IAU name, English name and genitive |
| `provenance.json` | sources with pins, licences, changes, counts and the boundary cross-check |

```ts
import { loadFigures, loadNames } from "astraeus-data-constellations";

const figures = await loadFigures(); // figures.Ori is a list of [end, end] pairs
const names = await loadNames(); // names.Ori.name is "Orion"
```

The figures use Hipparcos numbers; one end, xi Ursae Majoris (HIP 55203, Alula Australis), is a position because the engine's star list holds that star without a Hipparcos number.

Rebuild everything with `node packages/astraeus-data-constellations/tools/import/constellations.mjs` (it fetches the pinned sources, checks their SHA-256 and fails if the boundary cross-check against CDS VI/49 is above its tolerance).

## Sources and licences

- Figures and boundaries: CC BY-SA 4.0. Figures: the IAU's constellation figures (drawn for the IAU by Sky & Telescope), as typed in by the Stellarium team (Stellarium `skycultures/modern_iau`, commit `dc5679c9`). Boundaries: Delporte (1930) corner points at B1875 from the same Stellarium file, with points added along each edge and precessed to J2000 by this package's import tool. Share-alike applies to these two files and adaptations of them, not to the code.
- Names: IAU, CC BY 4.0 (credit "IAU"), from the IAU constellations page as archived on 2025-01-08.
- Code: MIT.

Full wording and the list of changes are in `NOTICE` and `provenance.json`.
