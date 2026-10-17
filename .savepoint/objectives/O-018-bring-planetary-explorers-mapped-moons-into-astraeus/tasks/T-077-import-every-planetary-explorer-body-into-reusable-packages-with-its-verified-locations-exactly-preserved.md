---
id: T-077
title: Import every Planetary Explorer body into reusable packages with its verified locations exactly preserved
objective: O-018
status: in_progress
stage: audit
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Import every Planetary Explorer body into reusable packages with its verified locations exactly preserved

## Outcome

A committed importer reads Planetary Explorer (the owner's own project at `/home/user/code/planetary-explorer`) and writes one data package per body for all 24 bodies, with every tagged location carried over exactly as the owner verified it. Nothing is drawn yet; this Task settles the package format and the conversion that later Tasks build on.

## User Check

The catalogue of packages lists 24 bodies and 403 tagged locations, and a test proves every location reads back exactly as Planetary Explorer holds it.

## Done When

1. **Package format** (O-018 Success Condition 2), one directory per body under `data/bodies/<body>/`: `features.json` (every feature's id, name, featureType, category, latitude, longitude, description, tags, details, exactly as the donor holds them, plus nothing invented), `categories.json` (ids, labels, colours, from the donor's `*Categories.ts` or registry), `overview.json` (from `data/body-overviews.json`, with its sources), and `map.json` (the donor texture path, its pixel size and SHA-256, its source and licence from the donor's texture README or `CREDITS.md`, and the coordinate convention: the donor's `latLonToXYZ` mapping in `src/entities/hotspot.ts`, phi = 90 − lat from +Y, theta = lon + 90, on Three.js SphereGeometry UVs, plus any per-body re-centring such as Ganymede's 180 degrees, stated as numbers). The map image files themselves are not copied in this Task. A short `data/bodies/README.md` documents the format.
2. **Importer** (Success Condition 3): `tools/import/planetary-explorer.mjs` reads the donor's `src/entities/*.ts` (via the registry `src/entities/planetRegistry.ts`), `data/*-features.json`, `data/hotspots.json` (the Moon's 30), `data/body-overviews.json`, the category files and texture credits; writes the packages; records the donor commit (`git -C <donor> rev-parse HEAD`, 84f8d3e at planning) in each package; refuses a map with no recorded source; `--dry-run` lists each body and what it would write. Running it twice on an unchanged donor produces byte-identical output.
3. **Exact preservation** (Success Condition 7(a), owner: "this was painfully verified visually over months"): a test reads the donor files directly and asserts, for every one of the 24 bodies and every feature (403 at planning: 373 in `*-features.json` plus 30 Moon hotspots), that latitude and longitude are bit-for-bit equal (`Object.is`) and that name, category, tags, description and details are deep-equal. No rounding, re-derivation or correction anywhere in the tool.
4. **Coordinate convention proven**: a test places a handful of features with the package's recorded convention and with the donor's own `latLonToXYZ` (imported or copied verbatim with a note) and gets identical vectors, for at least one body with a re-centred map.
5. Body ids, names and counts per body listed in the Task evidence; any donor oddity (missing source, duplicate id, a feature outside its map) reported, not silently fixed.
6. Gates: `npx tsc --noEmit`, `npx vitest run`, `npm run build`. No browser checks (nothing is drawn).

## Context Files

`/home/user/code/planetary-explorer/src/entities/planetRegistry.ts`, `/home/user/code/planetary-explorer/src/entities/hotspot.ts`, `/home/user/code/planetary-explorer/src/entities/*Categories.ts`, `/home/user/code/planetary-explorer/data/*-features.json`, `/home/user/code/planetary-explorer/data/hotspots.json`, `/home/user/code/planetary-explorer/data/body-overviews.json`, `/home/user/code/planetary-explorer/CREDITS.md`, the donor's texture README, `docs/DONOR_TEXTURE_INVENTORY.md`, `.savepoint/objectives/O-018-bring-planetary-explorers-mapped-moons-into-astraeus/Objective.md`.

## Design References

Design.md asset licences (PROV-02) and story data (ARCH-01). The package is data, never engine code.

## Guardrails

ARCH-01, PROV-01, PROV-02, TEST-01, STYLE-07, STYLE-09.

## Implementation Plan

1. Read the registry and one body end to end; write the format.
2. Write the importer and run it for all 24 bodies.
3. Exact-preservation and convention tests; dry run; idempotence.

## Boundaries

No rendering, no map image copies, no change to the donor repository, no edits to `docs/DONOR_PROVENANCE.md` or `.savepoint/Design.md` in this Task (another Task is editing them; record the needed lines as Drift Notes).

## Technical Verification

Configured gates and the exact-preservation tests. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Executed in worktree lane `/home/user/code/astraeus-o018`, branch `o018-t077` from b1cf3f2 (router not edited; no Tasks, Checks or Issues created). Donor read at commit 84f8d3ee77aff47f2f36f157b62b97dce7176b95; donor not modified (`git -C` status showed only its own untracked file).

### Per criterion

1. **Package format.** `data/bodies/<body>/{features,categories,overview,map}.json` for 24 bodies plus `data/bodies/catalogue.json` and `data/bodies/README.md`. Each file carries `format`, `kind`, `body`, `name`, `parent`, `donor.commit`. `map.json` holds every texture variant (donor path, width/height from the JPEG header, bytes, SHA-256, donor README bullet), `source`, and `coordinates` (phiOffsetDeg 90, thetaOffsetDeg 90, the `latLonToXYZ` formula, `longitudeRange`, `markerLongitudeFromSource` {scale, offsetDeg}|null, `textureRecentringDeg` 0 or 180, the donor README bullet verbatim). Map images not copied. Done.
2. **Importer.** `tools/import/planetary-explorer.mjs` (helpers: `ts-resolve-hook.mjs`, `planetary-explorer-map-sources.json`, `planetary-explorer-conventions.json`). Reads the registry, loads each `src/entities/<body>.ts` through Node type stripping, reads `data/*-features.json`, `hotspots.json`, `body-overviews.json`, texture README and CREDITS.md. `--dry-run` listed all 24 bodies and the files it would write. Refusal proven: with the sources file emptied it exited 1 naming the 8 bodies with no source (earth, moon, jupiter, neptune, uranus, pluto, charon, ceres) and wrote nothing. Idempotence: two runs into separate scratch directories and the committed tree are identical (`diff -rq`), and the test re-runs the importer and compares bytes.
3. **Exact preservation.** `tests/bodyPackages.test.ts` reads the donor files directly: for all 24 bodies and 403 features, `Object.is` on latitude and longitude, `toStrictEqual` on name, category, tags, description, details, and on the whole feature object; also overviews. Passed. Mutation check: changing one Mimas longitude in the package made the test fail (herschel-central-basin), then restored. The importer throws on any negative zero (none found) and applies no arithmetic to stored values.
4. **Convention.** Same test file places features of moon, ganymede (recentring 180), tethys, triton, europa, earth with the convention read from each `map.json` and with a verbatim copy of the donor `latLonToXYZ`: identical vectors (`Object.is` on all three components). A second test asserts the verbatim copy equals the donor's own exported function over a lat/lon grid. Ganymede's 180 degree recentring is recorded as a property of the picture and is not added to placement (stored longitudes already account for it).
5. **Counts and oddities.** Bodies and features: earth 20, moon 30, mars 32, mercury 16, venus 19, jupiter 15, saturn 20, neptune 19, triton 12, uranus 19, pluto 16, charon 12, ceres 8, io 12, europa 19, ganymede 25, callisto 22, titan 11, enceladus 16, mimas 8, tethys 12, dione 15, rhea 13, iapetus 12 = 403. Donor oddities, reported and not fixed:
   - 12 features have no latitude/longitude, only ringRadius (ring-plane): mars phobos, deimos; jupiter main-ring, halo-ring, gossamer-rings, adrastea, amalthea, thebe; pluto styx, nix, kerberos, hydra. So 391 features carry a position.
   - Longitude ranges differ per body: many bodies store 0..360 values (Venus, Io, Europa, Titan, Triton, Ceres, Uranus, Neptune, Jupiter, Enceladus, Moon's South Pole-Aitken 191, Mars Opportunity 354.47). `latLonToXYZ` accepts them, so they are recorded as `longitudeRange`, not corrected.
   - Eight bodies have no source in the donor texture README (earth, moon, jupiter, uranus, neptune, pluto, charon, ceres); their sources come from `tools/import/planetary-explorer-map-sources.json`, which cites docs/DONOR_TEXTURE_INVENTORY.md section C and docs/DONOR_PROVENANCE.md. Earth and Moon are Astraeus's shipped NASA replacements; the donor's own files are unsourced. Ceres is marked `donorFileShippable: false` (colour source unknown).
   - The donor README states no longitude formula for callisto, europa, io, enceladus (null recorded), and none for bodies without a Notes bullet (earth, moon, mars, mercury, venus, jupiter, saturn, neptune, uranus, pluto, charon, ceres: `sourceLongitude` null).
   - Ganymede's planned "180 degree recentring" is not in the donor entity config or README; it comes from the Astraeus trace (inventory section C). Its README formula is marker = -west. The 180 offset in the donor README is in the marker formula for tethys, dione, rhea and iapetus instead.
   - "A feature outside its map" cannot be tested without drawing; no latitude is outside -90..90 and no longitude outside -180..360.
   - Moon: donor `moon.ts` uses `moon-orig-2k/4k`; `moon-lroc-*` files exist in the donor but are not wired.
6. **Gates** (in the lane): `npx tsc --noEmit` clean; `npx vitest run` 56 files passed, 927 passed, 1 skipped (one earlier full run had three 5 s timeouts under machine load, two in unrelated files; the importer test now has a 60 s timeout and the rerun was clean); `npm run build` built. No browser checks (nothing drawn).

### Extra reads (outside Context Files)

- `docs/DONOR_PROVENANCE.md` lines 17-26 and 87-90, for the Earth, Moon and Jupiter map sources (the Task's Context Files name the inventory, not the provenance file). Read only.
- `/home/user/code/planetary-explorer/src/entities/planet.ts`, `moon.ts`, `ganymede.ts` and the other entity files via the registry (type definitions and configs; covered by `src/entities/*.ts` in the Task text).
- `/home/user/code/planetary-explorer/public/textures/README.md` and the texture JPEG files (hashes, headers), and `tests/assets.test.ts`, `tests/publicBuild.test.ts`, `vite.config.ts` for test style and the `.d.mts` convention.

### Files changed

New: `data/bodies/` (24 packages, catalogue.json, README.md), `tools/import/planetary-explorer.mjs`, `tools/import/ts-resolve-hook.mjs`, `tools/import/planetary-explorer-map-sources.json`, `tools/import/planetary-explorer-conventions.json`, `tools/import/test-io.mjs`, `tools/import/test-io.d.mts`, `tests/bodyPackages.test.ts`. Edited: this Task file (status, stage, evidence).

### Drift Notes (for the owner; not applied)

- `docs/DONOR_PROVENANCE.md`: add a section "Body packages (O-018, T-077)": packages under `data/bodies/` are data copied from Planetary Explorer at 84f8d3e by `tools/import/planetary-explorer.mjs`; map images not copied; eight map sources come from Astraeus's own trace records, not the donor README; Ceres's donor file must not be shipped.
- `.savepoint/Design.md`: record the `data/bodies/<body>/` package format and the importer under story/asset data (ARCH-01); the packages are not engine code.
- The importer needs Node 22.18+ or 24 (type stripping), while `package.json` engines says `>=22.12`; consider raising it.
- Later Tasks that draw features should read `map.json` `coordinates`, not assume -180..180 or east-positive for every body.
