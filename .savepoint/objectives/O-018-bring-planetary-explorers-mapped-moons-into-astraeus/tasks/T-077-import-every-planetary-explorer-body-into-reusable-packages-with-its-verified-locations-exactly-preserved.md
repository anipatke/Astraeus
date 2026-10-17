---
id: T-077
title: Import every Planetary Explorer body into reusable packages with its verified locations exactly preserved
objective: O-018
status: planned
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
