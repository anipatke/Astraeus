---
id: T-268
objective: O-059
title: Let any app show a moon panel and surface places
status: done
depends_on: [{task: T-267, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
check_waiver: {task: T-268, reason: 'Owner said "orchestrate O-59" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o059-run-20261106}, recorded_at: '2026-11-06T11:53:06Z'}
---

# Let any app show a moon panel and surface places

## Outcome

An app can show a moon family panel and tagged surface places through public, general calls, with the place data arriving from the app, not from a private path.

## User Check

Read the README entries; a made-up body with made-up places and families appears in a test.

## Done When

Both features work on `mount` and React, are proven on a made-up system, carry provenance (PROV-01), and the place data has the home the note set; panel pictures come from the viewer's data; reads, typed errors, lock, README and CHANGELOG are updated. Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `packages/astraeus/src/shell/moonFamilies.ts`, `packages/astraeus/src/shell/bodyFeatures.ts`, `packages/astraeus/src/shell/experience.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/assembleScene.ts`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-02, API-04, API-05, ARCH-01, ARCH-03, ARCH-06, PROV-01, PROV-02, TEST-01.

## Implementation Plan

1. Add the moon panel input. 2. Add the places input. 3. Move data if the note says so, updating `bodyPackages.test.ts`. 4. Prove on a made-up system. 5. Lock, README, CHANGELOG.

## Boundaries

No panel redesign; the look stays. No planets demo rebuild.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Owner approvals used: `astraeus-data` file limit 40 to 130 (coordinator message, 2026-11-06). A first attempt stopped before code because the move adds 98 files to a 25-file package (limit 40); after the approval the whole step was built in one pass.

Files read beyond Context Files: `docs/architecture/o059-public-forms.md` sections 2.2, 2.3, 4 (Places), 7, 8, 11 (as the brief directed); `packages/astraeus/src/api/{planBodySets,bodySetChecks,bodySetInput,scene,sceneReads,errors,index,assembleScene,prepared,time}.ts` (T-267 pattern); `tools/check-packs.mjs`, `tools/build-packages.mjs` (pack rules); `packages/astraeus/tests/{apiImports,firstOpenGraph}.test.ts` (import allowlist and first-open graph).

Files changed: new `src/api/{moonPanelInput,planMoonPanel,planPlaces}.ts`, `src/core/moonListText.ts`, `tests/sceneMoonPanelPlaces.test.ts`; edited `src/api/{scene,assembleScene,sceneReads,errors,index}.ts`, `src/shell/moonFamilies.ts` (words moved to core, re-exported), `tests/{twoViewers,sceneCheck,bodyPackages,featureMarkers,planetMoonCatalogues}.test.ts`, README, CHANGELOG, `api-surface.lock.json`; data moved `packages/astraeus/data/bodies/` to `packages/astraeus-data/data/bodies/` (98 files, git mv), with `astraeus-data` package.json (exports, x-publish, linkData), NOTICE, README, CHANGELOG; `tools/check-packs.mjs` (files limit 130, allow-list for data/bodies, `*` export targets checked by at least one packed match); importer `planetary-explorer.mjs` output dir; demo and site imports and tests repointed (`astraeus-data/bodies/...` and `../../../../../astraeus-data/data/bodies/...` globs, `packageBoundaries` planets deep-import count 123 to 98, which the test requires because the imports left the engine).

Done When, per item:

| Done When | Test or evidence |
|---|---|
| Moon panel works on `mount` and React | `twoViewers.test.ts` "T-268" opens a panel-and-places scene on both paths (mount, AstraeusScene) and rejects bad ones with the code; `sceneCheck.test.ts` rows `bad-moon-panel`, `bad-places` (check, mount, prepareScene throw the same error) |
| Places work on `mount` and React | same two tests |
| Proven on a made-up system, each input changed alone | `sceneMoonPanelPlaces.test.ts`: "each input changed alone" for the panel (label, featured family, source, date, all optional absent) and for places (limits, provenance, category colour, one place's latitude); made-up swarm about Earth plus Moon, no real place data |
| Reads | `scene.moonPanel` (count, summary, frozen, replaced by a later call, undefined before) and `scene.places` (body, count, order, fresh frozen list) in `sceneMoonPanelPlaces.test.ts` "reads" tests |
| Typed errors | `bad-moon-panel` (14 cases plus unknown moon at check and build) and `bad-places` (21 cases plus unknown body at check and build, and duplicate-id for a second call) in `sceneMoonPanelPlaces.test.ts`; `scene-mounted` for both calls |
| Provenance (PROV-01) | places carry the caller's `provenance` and `knownLimitations` into the feature set (test "builds the body's feature set"); a place list with no or an invalid provenance is `bad-places`; NOTICE in `astraeus-data` credits the lists (Planetary Explorer, the owner's own work, commit 84f8d3e; overview sources keep their own credits; USGS Gazetteer west longitudes noted; maps shipped only through `src/pictures.js` with their licences, PROV-02) |
| Panel pictures come from the viewer's data | "pictures come from the viewer's data": no data gives no picture, a data source with `pictures.moon` gives the body its url, a dot never gets one |
| Place data has the home the note set | `packages/astraeus-data/data/bodies/`; `bodyPackages.test.ts`, `featureMarkers.test.ts`, `planetMoonCatalogues.test.ts` and site/demo tests read it there and pass; `check:engine-alone` passes; `check:pack` passes with 123 of 130 files |
| Lock, README, CHANGELOG | `npm run api:lock` and `npm run api:errors` run; README rows for both calls and both reads, error table rows; CHANGELOGs of `astraeus` and `astraeus-data` |
| Existing demo and site unchanged | internal `moonFamilies`/`bodyFeatures` fields untouched in shape; full `npm test` passes (212 files) |

Commands run: `npm run lint` (clean), `npm run typecheck` (clean), `npm run build` (ok), `npm test` (212 files, 2734 passed, 2 skipped), `npm run check:engine-alone` (pass), `npm run check:pack` (pass; astraeus 9.56 of 9.8 MB unpacked; astraeus-data 35.57 of 39 MB packed, 36.17 of 39 MB unpacked, 123 of 130 files). API page after build: 144,414 B raw of 150,000, 31,968 B gzip of 40,000 (measured on `dist/api/index.html`). Limits changed: only the owner-approved `astraeus-data` file count. No allowlist grown; `tools/api-rules.mjs` untouched; no browser run.

Limitations: the viewer-path test uses the mocked scene component, so the drawn panel and markers are not exercised in a browser (no browser run by instruction); `docs/` prose that mentions `packages/astraeus/data/bodies` (DONOR_PROVENANCE.md, NPM_PACKAGING.md, codebase-details.md) was not updated; the moon-list `bodyPackage` strings (`data/bodies/<id>`) still read as relative to the data package.

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective, named here as the integration Task.

- `moonCountText`, `moonListDateText`, `moonListSummary` moved to `src/core/moonListText.ts` (re-exported from `shell/moonFamilies.ts`): the api could not import the panel module (first-open graph test, I-089) and the apiImports allowlist could not grow. Architecture-relevant: record in Design.md at the integration Task.
- `tools/check-packs.mjs` now accepts a `*` export target when a packed file matches it (needed for `./bodies/*`).
- `tools/import/planetary-explorer.mjs` writes to `packages/astraeus-data/data/bodies` by default.
- Deep imports: `astraeus-demo-planets` 123 to 98 (fell); others unchanged.
