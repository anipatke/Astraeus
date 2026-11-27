# Astraeus 0.13.0

## astraeus 0.13.0 (2026-11-27)

Ceres joins the built-in bodies: a mapped, spinning globe with accurate positions, for apps such as the asteroid-belt app to fly in to. A minor bump: a new public member and `ceres`, and one input that used to work now throws (below, with its migration); the `astraeus-data*` packages' `astraeus` peer moves to `>=0.13.0 <0.14.0`.

First download of the packed example (`npm run measure:example`): 1,849,338 bytes raw, 530,472 bytes gzip (code and styles loaded on first open), against 1,845,723 raw and 529,235 gzip at 0.12.1 (+3,615 raw, +1,237 gzip; the owner raised the engine caps for this release). Ceres's positions are not in the first download: they load only for a scene that holds Ceres.

- Added: `DataSource.bodyPositions`, an optional map from body id to a loader of that Sun-circling body's positions in the engine's planet-fit format (the JSON file with `format`, `timeScale` and the fit under `planets.<id>`). `mount` and `scene.load` read a body's series only when the scene holds that body, once per scene; an entry that is not a function, or a series that does not fit, is `bad-data` naming `bodyPositions.<id>`. Additive: existing data packages are unchanged. First download +691 B raw, +249 B gzip (owner raised the engine raw cap by 1,500 B).
- Added: `ceres`, Ceres as a ready-made body (`scene.addBody(ceres)`, with `orbit: true` if wanted): IAU mean radius 469.7 km, GM and position from JPL Horizons (within 0.8 km, 1950 to 2045), turned by the IAU pole and prime meridian. Its positions and Dawn map come with `astraeus-data` (`dataSource` now lists `provides: ["ceres"]` and a lazy `bodyPositions.ceres`); without it `mount` throws `missing-data`. Outside 1950 to 2045 `stateOf("ceres")` is `out-of-span` naming those years. First download +2,530 B raw, +649 B gzip.

### Breaking changes (with migration)

- `addBodyFromElements` with id "ceres" now throws `duplicate-id` (Ceres is a built-in body; use `addBody(ceres)` with `astraeus-data`, or another id). Migration: an app that added its own Ceres from orbit elements switches to `addBody(ceres)` and passes `astraeus-data`'s `dataSource` to `mount`, keeping its own card options; or gives its record another id.

Full details: `packages/astraeus/CHANGELOG.md`.

## astraeus-data 0.13.0

Released with `astraeus` 0.13.0; every `astraeus-data*` package's `astraeus` peer moves to `>=0.13.0 <0.14.0`.

- `dataSource` now provides a body: Ceres (`provides: ["ceres"]`). It carries Ceres's map (USGS, from NASA Dawn, 2048x1024, with its licence in `PICTURES`) and Ceres's positions (`data/positions/ceres.json`, a fit to JPL Horizons from 1950 to 2045, read through `bodyPositions` only when the scene holds Ceres). `addBody(ceres)` needs this package in `data`.
- The positions load in plain Node as well as in bundlers: the loader imports the JSON with `{ with: { type: "json" } }` and hands the engine the file itself (I-210).
