---
id: T-466
title: Give Ceres the USGS Dawn map
objective: O-102
status: planned
check_waiver: {task: T-466, reason: 'Owner said "orchestrate O-102" (G-028, 2026-11-27): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o102-20261127}, recorded_at: '2026-11-27T00:00:58Z'}
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g028-20261127}
lane: picture
planned_reads: [packages/astraeus-data/src/pictures.ts, packages/astraeus-data/data/bodies/ceres/map.json, docs/DONOR_TEXTURE_INVENTORY.md, packages/astraeus/tools/import/planetary-explorer-map-sources.json, packages/astraeus/tests/ownedPictures.test.ts]
planned_writes: [packages/astraeus-data/src/textures/ceres-4k.jpg, packages/astraeus-data/src/pictures.ts, packages/astraeus-data/data/bodies/ceres/map.json, packages/astraeus/tools/import/planetary-explorer-map-sources.json]
---

# Give Ceres the USGS Dawn map

## Outcome

`astraeus-data`'s `PICTURES.ceres` is the true-grey USGS/DLR Ceres Dawn FC Global Mosaic (140 m, Feb 2016) from USGS Astrogeology, untinted (G-028 Decision 2), resized to the package's convention, with an `AssetLicence` (source, URL, "please cite authors" constraint, attribution, access date). Ceres's `map.json` names the new file and its registration so the unchanged donor places land on their features.

## User Check

None beyond the Objective's (owner look in T-468).

## Done When

- The mosaic is downloaded from the USGS Astrogeology product page (record the exact URL and product name), converted to an equirectangular JPEG at 4096x2048 (or 2048x1024 if `astraeus-data`'s size budget refuses 4k: record the measured size and the budget), with the ImageMagick command recorded as the others are (`RESIZE`). Untrusted download kept in its own folder; only the converted JPEG enters the repo.
- Registration: the USGS mosaic's longitude convention (0° at the left edge or centre) is checked against the donor file, which matches it after a 180° shift (NCC 0.96, `docs/DONOR_TEXTURE_INVENTORY.md` section C). Rotate the image or record `textureRecentringDeg` so that Occator (donor 19.8, 59.3) and Ahuna Mons land on their features; feature coordinates in `features.json` are never changed (bit-for-bit, owner rule). Prove with a pixel comparison of the new picture against the donor file at the recorded shift (NCC ≥ 0.9) in Technical Evidence.
- `map.json` `textures` and `source` updated to the shipped file (`donorFileShippable` stays false for the donor file; the new entry says USGS); `planetary-explorer-map-sources.json` entry updated to match.
- `ownedPictures`/`desktopPictures` tests and the `astraeus-data` pack size check pass; existing tests unchanged.

## Context Files

`packages/astraeus-data/src/pictures.ts` (the Pluto and Io entries and helpers), `packages/astraeus-data/data/bodies/ceres/map.json`, `docs/DONOR_TEXTURE_INVENTORY.md` section C (Ceres row and note only), `packages/astraeus/tools/import/planetary-explorer-map-sources.json` (Ceres entry).

## Design References

`.savepoint/Design.md` under `Asset architecture (O-014)`.

## Guardrails

PROV-01, PROV-02, DATA-01, TEST-01..04.

## Implementation Plan

1. Find the USGS product, download to scratch, convert.
2. Measure registration against the donor file; fix rotation.
3. Add the picture and licence; update map records.
4. Run picture and pack checks.

## Boundaries

No tint, no engine code, no feature coordinate edits, no donor file shipped.

## Technical Verification

Focused picture tests and `npm run check:pack` for `astraeus-data`; handoff gates per `docs/agents/verification.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record the shipped resolution and size for T-468's docs.
