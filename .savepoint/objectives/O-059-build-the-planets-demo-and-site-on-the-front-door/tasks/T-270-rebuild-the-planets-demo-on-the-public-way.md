---
id: T-270
objective: O-059
title: Rebuild the planets demo on the public way
status: done
depends_on: [{task: T-269, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
check_waiver: {task: T-270, reason: 'Owner said "orchestrate O-59" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o059-run-20261106}, recorded_at: '2026-11-06T17:05:00Z'}
---

# Rebuild the planets demo on the public way

## Outcome

The planets demo builds a `Scene` with public calls only, in source and tests, and every planet keeps what it shows today.

## User Check

`npx vitest run packages/astraeus-demo-planets` passes, and the deep-import count for the demo is 0.

## Done When

`buildPlanetDefinition` is replaced by a scene builder; all nine planets build; provenance and accuracy words are unchanged; Jupiter-only public globs still work; `DEEP_IMPORT_COUNTS` for `astraeus-demo-planets` is 0; tests of engine internals moved to `packages/astraeus/tests/` and pass `check:engine-alone`. The engine's unpacked limit in `tools/check-packs.mjs` is back at 9.5 MB and `check:pack` passes (owner, 2026-11-06: raised briefly at T-267, restored here once the moon lists leave). Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `packages/astraeus-demo-planets/src/experiences/planets/planetDefinition.ts`, `packages/astraeus-demo-planets/src/experiences/planets/planetSettings.ts`, `packages/astraeus-demo-planets/src/experiences/planets/planetChoice.ts`, `packages/astraeus-demo-planets/src/experiences/planets/planetSystemParts.ts`, `packages/astraeus-demo-planets/src/experiences/planets/systems/jupiter.ts`, `packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11Scene.ts`, `packages/astraeus-site/tests/packageBoundaries.test.ts`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, ARCH-01, ARCH-03, ARCH-05, PROV-01, TEST-01, TEST-03.

## Implementation Plan

1. Compare old and new output planet by planet before removing the old builder. 2. Move each system file to public calls and data packages. 3. Rewrite or move tests. 4. Add the demo to `PUBLIC_API_DEMOS` and lower its count to 0.

## Boundaries

No new look, data or planets. A gap in the public API returns REPLAN REQUIRED rather than a private import.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-11-07 on `o059-front-door` (uncommitted), one session. Stage `audit` means ready for a Check, not passed.

**Extra reads (path, reason).** `packages/astraeus/src/api/{scene,planBodies,planBodySets,planCamera,assembleScene,planPlaces,planTimeline,data}.ts` (what the public calls produce, to map the old builder onto them); `packages/astraeus/src/app/{bodyMetrics,listSwitch,viewLink}.ts`, `shell/{objectModel,bodyFeatures,moonFamilies}.ts`, `core/{startView,fieldReaders}.ts`, `core/bodies/moonSystem.ts` (the behaviour being ported: card rows, Focus buttons, start-view check, tidal-lock note, load); `packages/astraeus/tools/import/*`, `vitest.setup.ts`, engine and site tests that read the moved lists (to retarget them); `tools/check-packs.mjs`, `tools/check-engine-alone.mjs`, `packages/astraeus-site/tools/validate/load-budget.mjs`, `tests/publicBuild.test.ts`, `tools/site/assets-sections.mjs` (limit restore, page sets, the page text that names the list path).

**Comparison, old against new, planet by planet.** Before any removal, the old `buildPlanetDefinition` was run for all nine planets and its output recorded as `packages/astraeus-demo-planets/tests/fixtures/planet-views-before.json` (the whole definition but its closures, the small-moon sets summarised, and every listed object's info-card rows at the opening time). `tests/planetViews.test.ts` builds all nine with `buildPlanetScene(...).toDefinition(...)` and holds them to it: 118 tests, all pass. Result per planet (Earth, Jupiter, Mars, Mercury, Neptune, Pluto, Saturn, Uranus, Venus): equal but for the named, non-visible differences below. The card rows agree to a part in a billion (the new rows are worked out from `Scene.stateOf`, a different route). Section 8 traps 1 to 7 are asserted on their own for each planet (trap 8, load budgets, below).

**Differences found and not removable by the public API, each named in the test.** (1) composition id is `scene` (was `<planet>-moons`); (2) the batch's orbit-line group is `<set>-orbits` (was `<planet>-mapped-moon-orbits`), as the note decided; (3) `sceneLayers` is the default `["tracked-bodies"]` (was `[]`; no tracked body, nothing drawn); (4) `desktopTextures: true` is now the public look `desktopPictures: true`; (5) the old pass-through `tags` field of each tagged place is gone (nothing reads it); (6) the new camera presets also carry a plain `focus-<id>` for each other mapped moon: the viewer makes exactly that Focus button for every listed object anyway (`focusPresetFor`), same id, label and request, asserted per preset. Nothing else differs. The `tidalLockNote` default differed for Io only (the catalogue's own Io note reads "Io's orientation ... its near side"; the old builder replaced it with the generic note): fixed by a new optional `knownLimitations` on a mapped moon in `data/planets/jupiter.json`, with the old words; Europa, Ganymede, Callisto, Mars, Saturn, Neptune, Pluto match by default.

**Other changes.** Moon lists and fit errors moved with `git mv` to `astraeus-data-<planet>/data/<planet>-moons/{list,fit-errors}.json` (exports `./moon-list.json` and `./moon-fit-errors.json` in both maps of the six packages; `check-packs.mjs` allows them); engine `assets/moonCatalogue.ts`, `assets/bodies/{jupiterMoonCatalogue,outerPlanetCatalogues}.ts`, `core/bodies/outerPlanetData.ts` deleted and `jupiterData.ts` keeps only the rings; parser, `moonFacts`, `moonSourceTitles` lifted to `planets/moonList.ts`; `moons.fitSource` added to six planet files with today's exact text; `PlanetSystem` is now `{ bodies, moonList, fitErrorsM, orbitHistoryMs, packages, data }` with every data read a literal glob; `chooseSwitch` and `planetChoice.ts` (with tests) moved to the site (`src/listChoice.ts`, `src/planetChoice.ts`), engine `app/listSwitch.ts` keeps `pickerSwitch`; `main.tsx` calls `buildPlanetScene(...).toDefinition([pictureData, ...system.data])` (stop-gap to T-272); `assets.html` note on each moon list now names the new path (generator and page).

**Tests moved to `packages/astraeus/tests/` (engine internals, pass `check:engine-alone`):** `mapOrientation` (conversion cases stay in the demo's `surfacePlace.test.ts`), `moonPanelModel`, `domMoonPanel` (Jupiter's real list from its data package), `jupiterMoonsWindow` (fit span, chunks the window needs, rings), `planetChunksWindow` (chunks each planet's window loads, from the data packages), `outerPlanetRings`; `listSwitch` gained the two switch-address cases. Engine `listedMoons`, `planetMoonCatalogues`, `planetFitErrors` and `vitest.setup.ts` read the lists from the data packages.

**Gates (2026-11-07).** `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok; `npm test` 220 files, 2893 passed, 2 skipped (one intermittent happy-dom AbortError from `loadingCoverChain.test.ts`, the known noise, no failure); `npm run check:engine-alone` pass (154 files, 1826 tests); `npm run check:pack` pass, engine unpacked 9.13 MB against the restored 9.5 MB limit (packed 7.23 of 8.0); the 9.8 MB limit and its comment are gone. Not run: `npm run check:browser` (Full Objective Check) and any browser job.

**Load budget (trap 8).** Page sets in `load-budget.mjs` renamed to the new chunks (`planetScene.js` for `planetDefinition.js`, `moonList.js` for `moonCatalogue.js`; `settingsFields.js`/`compositions.js` no longer exist; `planetSystemParts.js` joins every planet view and is optional since a public build folds it in); no limit changed. Measured on scratch public and local builds (`checkLoadBudget`, no browser): every page's own share is under its limit (Jupiter 6,387,048 of 6,570,000 raw, 4,404,818 of 4,560,000 gzip), `public-build-assets.mjs` reports ok, and the public build holds only Jupiter's system chunk. The `engine-budget.mjs` check belongs to the browser check and was not run.

**Jupiter-only public globs.** `planetSystems.ts` still globs only `./systems/jupiter.ts` in a public build; each system file's globs name only its own planet; the public build contains `jupiter.js`, `jupiter-moons.js` and no other system or moon-index chunk.

| Done When item | Test or evidence |
|---|---|
| `buildPlanetDefinition` replaced by a scene builder | `planets/planetScene.ts` (`buildPlanetScene`), `planetDefinition.ts` deleted; `tests/planetScene.test.ts` |
| all nine planets build | `tests/planetViews.test.ts` (118 tests, nine planets) |
| provenance and accuracy words unchanged | `planetViews.test.ts` "keeps every position record's provenance and accuracy words" and "known limits ... word for word", per planet; `planetSystems.test.ts` dot-moon error figures |
| Jupiter-only public globs still work | scratch public build: only `jupiter.js` and `jupiter-moons.js`; `public-build-assets.mjs` ok; `tests/publicBuild.test.ts` |
| `DEEP_IMPORT_COUNTS` for planets is 0 | `packageBoundaries.test.ts`: planets 0 (was 98), added to `PUBLIC_API_DEMOS`; site 92 to 91 (never rose) |
| tests of engine internals moved to `packages/astraeus/tests/` and pass `check:engine-alone` | the six new engine test files above; `check:engine-alone` pass |
| engine unpacked limit back at 9.5 MB, `check:pack` passes | `tools/check-packs.mjs`; pack 9.13 MB of 9.5 |

## Drift Notes

- The note's section 4 says the tidal-lock note defaults per moon; Io's differs (catalogue wording), so a mapped moon in `data/planets/<planet>.json` may now carry its own `knownLimitations`. Architecture-neutral: a settings field of the demo.
- `assets.html` words about where a moon's own source ids are (generator and page) changed to the new list path; the same sentence otherwise.
- Jupiter's system ships 2014 and 2015 chunks for 107 moons plus Jupiter (108 each) though its window and orbit lines load 96 and 76; this was so before and was never held to the loaded list (Saturn, Uranus, Neptune and Pluto are, and still equal it). Unchanged here.
- Mars builds no body set (both moons own their lines), so the 3-day orbit history it passed to the loader before is gone; its window is inside the 2016 chunk, so the same three files load (`planetChunksWindow`).
- `planetViews.test.ts` and `main.tsx` use `.toDefinition(...)` as the allowed stop-gap; T-272 (site) and O-057 (removes `toDefinition`) must re-point them (the fixture comparison needs the definition's shape).
- Deferred Design reconciliation: none added by this Task.
