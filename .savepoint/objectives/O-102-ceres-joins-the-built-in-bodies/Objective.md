---
id: O-102
title: Ceres joins the built-in bodies
status: done
depends_on: []
release: G-028
priority: high
last_check: C-227
rank: 1
lanes: [{key: fit, title: Ceres positions}, {key: engine, title: Engine body positions and Ceres}, {key: picture, title: Ceres picture}, {key: show, title: Showing Ceres}]
---

# O-102: Ceres joins the built-in bodies

## Outcome

`ceres` is a ready-made body (`import { ceres } from "astraeus"`, needs `astraeus-data`): a 469.7 km sphere wearing the true-grey USGS/DLR Dawn FC global mosaic, turning per the IAU model, placed Sun-centred from a Horizons Chebyshev fit 1950 to 2045 that `astraeus-data` hands to the engine only when a scene holds Ceres, with its 8 imported places addable and shown in one local proving view.

## Why

G-028 (owner, 2026-11-27). The belt app wants a fly-in to a mapped Ceres; Ceres's places already ship but nothing can carry them.

## Success Conditions

1. A scene with `addBody(ceres)` and `astraeus-data` in `data` draws Ceres as a textured sphere at true radius; without the package `mount` throws `missing-data` naming `astraeus-data` (as Charon does without `astraeus-data-pluto`).
2. Ceres's position matches Horizons (body `1;`, Sun-centred, ecliptic J2000 as the planet fits) within 1 km at independent dates 1950 to 2045, by the planet-fit tool's own check.
3. Ceres's orientation follows pck00011 (pole RA 291.418, Dec 66.764, W 170.650 + 952.1532 deg/day); the places from `astraeus-data/data/bodies/ceres/` land on Occator, Ahuna Mons and the six craters on the new picture (owner look on localhost:5490 against Planetary Explorer, the donor's coordinates unchanged bit for bit).
4. `npm run measure:example`: Ceres's series is a separate file, not in the first download; the check/install code and Ceres's definition fit the engine cap as the owner raised it twice on 2026-11-27 ("Raise by 1,500 bytes", T-465; "Raise by 2,500 raw, 500 compressed", T-467) to 1,850,000 raw / 530,500 gzip.
5. Provenance: positions, radius, GM, rotation and picture each carry source and licence (PROV-02); `docs/DONOR_PROVENANCE.md`, `docs/DONOR_TEXTURE_INVENTORY.md` and the assets page say Ceres is in the app with the USGS map, not the donor file.
6. `orbit: true` draws Ceres's line round the Sun; Ceres is in the public body list and the catalogue.

## Architectural Considerations

- **Pattern:** follow Pluto (`core/bodies/outerPlanets.ts`: definition, `IauRotationElements`, `planetEphemeris`) and Charon's data-package requirement (`api/bodies.ts` `ref(..., "astraeus-data-pluto")`, `missing-data`).
- **Positions load only when used (owner Decision 3):** the fit is not added to `data/ephemerides/planets/planets.json` (bundled into the first download). It ships in `astraeus-data` as its own file and reaches the engine through `DataSource` (`api/data.ts`), read by `installData` only when the scene holds `ceres`. The exact field shape (a new optional `DataSource` member for Sun-circling body series vs. widening `moonPositions`) is T-465's first decision, recorded in its Drift Notes and kept general (any Sun-circling body), not Ceres-named (modular-over-consumer-shaped). Adding an optional `DataSource` member is additive; the API lock and CHANGELOG record it.
- **Picture:** `astraeus-data/src/pictures.ts` with an `AssetLicence`; resized to the existing 4096x2048 or 2048x1024 convention within `astraeus-data`'s size budget. Registration uses the existing `map.json` coordinates convention (`textureRecentringDeg: 180` against the donor file); the map record is updated to name the new file and its own registration, never the feature coordinates.
- **Data stays data** (story-data-not-engine, moon-data-is-core): the fit, picture and places live in `astraeus-data`; engine code holds only Ceres's definition and constants.
- Guardrails: PROV-02, the API-01..07 checks, size budgets in `tools/check-packs.mjs` and `packages/astraeus-site/tools/validate/`.

## Decisions

Owner, 2026-11-27: Ceres ready-made (G-028 Decision 1), true-grey USGS map (2), positions load only when used (3). Planner, 2026-11-27: the proving view is a Ceres entry in the planets demo's local picker (locally all bodies; the public site stays Jupiter only, public-site-jupiter-only), since a demo changes only when an improvement needs it and this is the owner's look surface.

## Boundaries

**In scope:**
- Horizons fit for Ceres and its loader path from `astraeus-data`.
- Ceres body definition, rotation, radius, GM, `ceres` ref, catalogue entry, README section.
- USGS Dawn mosaic picture with licence; map record update; provenance docs and assets page rows.
- Ceres in the planets demo's local picker with its places; one browser driver update if that picker's step lists bodies.
- A short adoption note for the belt app (`docs/` in this repo; the belt changes in its own repo).

**Out of scope:**
- Other asteroids, a picture option for `addBodyFromElements`, tinting, Ceres in the public site, belt app code.
