---
id: T-304
title: Build the constellations data package from the chosen sources
objective: O-067
status: done
depends_on: [{task: T-303, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-304, reason: 'Owner said "orchestrate O67" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o067-run-20261110}, recorded_at: '2026-11-10T08:40:31Z'}
planned_by: {role: planner, session: o067-planning-20261110}
---

# Build the constellations data package from the chosen sources

## Outcome

A new package `astraeus-data-constellations` holds all 88 constellations' IAU stick figures, IAU boundary outlines in J2000 and IAU names and abbreviations, rebuilt by an import tool from the owner-chosen sources, with every source and licence recorded once, inside a stated size limit and wired into the build and pack checks.

## User Check

None for the owner at this step; the owner looks at the Orion example in the last step.

## Done When

- `tools/import/constellations.mjs` (or the repo's import-tool home) fetches pinned versions (commit or date) of: Stellarium `skycultures/modern_iau` figures (owner: "Official IAU drawing"), Stellarium's Delporte corner points (owner: "Stellarium's copy"), the IAU names table (archived copy as T-303 names it); drops the 4 zero-length and 87 repeated line steps; densifies boundary edges (about 1 degree), converts 1875 to J2000 with a stated precession method, and cross-checks the result against CDS VI/49 `bound_20.dat` (maximum difference reported; the check fails above a stated tolerance).
- Figure ends are Hipparcos numbers where the engine's star list (`packages/astraeus/src/assets/stars/hyg-v42-naked-eye.json`) holds the star, and J2000 positions otherwise (HIP 55203 and any other, counted and listed in the README); Serpens is two boundary outlines (and one figure or two, stated).
- `packages/astraeus-data-constellations/` follows `astraeus-data-pluto`'s pattern: `package.json` (MIT code, `x-publish`, `exports`, peer range on the engine minor per API-07 and `check:pack`), `NOTICE` and README stating CC BY-SA 4.0 for the figure and boundary data (Stellarium team and IAU/Sky & Telescope origin, what was changed) and CC BY 4.0 for the IAU names, `data/` compact JSON, provenance in one place (PROV-01, PROV-02).
- Added to `tools/build-packages.mjs` and `tools/check-packs.mjs` with packed, unpacked and file limits measured plus room (T-303 estimated about 100 to 110 KB packed, 280 to 300 KB unpacked); `npm run check:pack` passes.
- Data tests: 88 constellations (89 with Serpens split where stated), every HIP end resolves against the engine star list, outlines closed, names unique, a sample of figures against the source (made-up checks not needed: this is data, not engine code).
- No engine change (ARCH-01); the helper that turns abbreviations into sky figures is the next step.

## Context Files

`docs/architecture/constellations-o067.md`, `.savepoint/objectives/O-067-ship-the-88-constellations-as-a-data-package/Objective.md`, `packages/astraeus-data-pluto/package.json`, `packages/astraeus-data-pluto/NOTICE`, `packages/astraeus-data-pluto/README.md`, `packages/astraeus-data-pluto/src/index.ts`, `tools/build-packages.mjs`, `tools/check-packs.mjs`, `packages/astraeus-site/tests/packagePacks.test.ts`, `packages/astraeus/src/assets/sky.ts`.

## Design References

`.savepoint/Design.md` under `Components/Codebase Map` (the data packages) and `Interfaces and Data Flow` (Sky figures, O-065).

## Guardrails

PROV-01, PROV-02, DATA-01, ARCH-01, API-07, TEST-01, TEST-03, STYLE-09.

## Implementation Plan

1. Reuse T-303's scratchpad scripts as the starting point (`/tmp/claude-1000/-home-user-code-Astraeus/685f214b-36b0-48dd-866e-e9470f0d5e93/scratchpad/o067/scripts/`); downloads stay untrusted (own folder, Python `-I`).
2. Write the import tool with pinned sources and the cross-check; generate the data.
3. Scaffold the package from the Pluto pattern; NOTICE, README, licences.
4. Wire build and pack checks with limits; data tests; gates.

## Boundaries

No abbreviation helper (next step); no example; no engine change; no star names, facts or myths.

## Technical Verification

Hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, plus `npm run check:pack`; no browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built at `stage: build`, gates all green after the last change (lint, typecheck, build, `npm test` 246 files / 3652 passed, `npm run check:pack` pass; no browser run).

- Import tool `packages/astraeus-data-constellations/tools/import/constellations.mjs` (next to the other per-package import tools): fetches pinned sources, checks each SHA-256, writes `data/{figures,boundaries,names,provenance}.json`; a second run gave byte-identical files. Sources: Stellarium `skycultures/modern_iau/index.json` at commit `dc5679c9723685585196c4d6ecd7ffd33da59ecd` (figures and the Delporte B1875 edges; CC BY-SA 4.0, sha256 `2b7aa4fa...`), IAU constellations page via Internet Archive 2025-01-08 (names; CC BY 4.0; sha256 of the decoded page `bdd1ddc5...`), CDS VI/49 `bound_20.dat.gz` from the CfA mirror (check only, sha256 `879cd6e7...`; the mirror now serves it only as .gz).
- Counts: 88 constellations; 843 figure steps, 4 zero-length and 87 repeated dropped, 752 lines; 1504 ends, 1503 as Hipparcos numbers (all in the engine star list) and 1 as a position (HIP 55203, xi UMa, row `[169.54677, 31.52878]` of the engine list, checked to exist); 89 boundary outlines (Serpens two: Caput, Cauda; one figure for Serpens); 781 edges, 9900 boundary points; names: all 88 equal Stellarium's native names.
- Boundaries: edges chained by corner id into closed rings (every corner on exactly 2 edges); points at most 1 degree of arc apart (meridian edges at constant RA, parallel edges at constant Dec, tighter near a pole so a chord never lies more than 0.005 degree off the edge); IAU 1976 precession B1875.0 to J2000; 3 decimals.
- Cross-check against VI/49 `bound_20`: tolerance 0.01 degree (fails above). Max VI/49 point (all 12948) to our outline at 0.05 degree spacing 0.000157 degree (CEP); max original VI/49 corner to our nearest corner 0.000088 degree (AQL); max of our corners to a VI/49 point 0.0001 degree; shipped chord drift 0.00494 degree. Our corners 1562 vs VI/49 original 1533: the 29 extra are the polar UMi and Oct corners, which VI/49 flags as interpolated (all match a VI/49 point).
- Package: `packed 66.5 kB, unpacked 202.5 kB, 10 files`. Limits set in `tools/check-packs.mjs`: packed 0.09 MB, unpacked 0.25 MB, files 20. Allow-list entry for its four data files added; `isPositionPackage` in `tools/build-packages.mjs` stops the chunk-list step and chunk check applying to it. `node tools/publish-packages.mjs --dry-run` lists it (dry run only).
- Tests: `packages/astraeus-data-constellations/tests/data.test.ts` (6 cases: 88 and uniqueness, HIP ends resolve, repeats dropped and counts, Orion sample, closed outlines and Serpens two, cross-check and licences recorded).
- Other edits the new package required: `packages/astraeus/api-surface.lock.json` (`npm run api:lock`: only the new package's exports added) with a CHANGELOG line, `packageBoundaries.test.ts` package count 12 to 13, `docs/agents/build.md` package list, `package-lock.json` (new workspace entry).

## Drift Notes

Design is reconciled in the last step of this Objective (O-067 integration Task; name it when notes are deferred).

- New package `astraeus-data-constellations` (9th publishable package): `loadFigures`, `loadBoundaries`, `loadNames`, `loadProvenance` plus `./figures.json` etc. exports; no abbreviation-to-`SkyFigureInput` helper yet (next step). Data shapes: figures `abbr -> [[end, end], ...]` (end = Hipparcos number or `[raDeg, decDeg]`), boundaries `abbr -> [flat [ra, dec, ...], ...]` (J2000 degrees, closed, first point not repeated; Serpens has two), names `abbr -> {name, english, genitive}`. Design.md codebase map and Sky figures interface need these.
- `tools/check-packs.mjs` / `tools/build-packages.mjs` now distinguish position packages (`isPositionPackage`) from the constellations package; the pack-check docs in `docs/NPM_PACKAGING.md` (size limits section) not updated here.
- The import tool lives in the package (`tools/import`), not the repo-level `tools/`, like the other per-package importers; the IAU table and VI/49 mirror are outside the owner's control (Internet Archive, CfA).
- Boundary points: 9900 shipped vs 12948 in VI/49 (they interpolate more densely near the poles); cross-check is by distance to the outline, not by point count.
