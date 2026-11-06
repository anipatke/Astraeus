---
id: T-274
objective: O-057
title: Take the scene's internal output off the public API
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o057-planning-20261107}
check_waiver: {task: T-274, reason: 'Owner said "orchestrate O-57" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o057-run-20261107}, recorded_at: '2026-11-06T22:37:03Z'}
---

# Take the scene's internal output off the public API

## Outcome

`Scene` no longer offers `toDefinition` or `missingData`, `SceneCamera` can no longer be built by a host, and `RateSource` is gone from the root, while engine tests keep their reach through a helper the root does not export.

## User Check

`scene.toDefinition` is undefined in the packed package, and the node and React consumer checks pass on public calls alone.

## Done When

`toDefinition` and `missingData` are off `Scene`; `load` and `check` work as before through an internal `definitionOf(scene, data)` not exported from the root; `SceneCamera` is `export type` only; `RateSource` stays internal; a public `scene.activities` read exists with a made-up-data test; `tools/check-node-consumer.mjs` and `tools/check-react-consumer.mjs` use only public calls; `planetViews.test.ts`, `planetViewSnapshot.ts` and the site `syntheticScenes.test.ts` use public reads, so both packages stay at 0 deep imports; no count in `DEEP_IMPORT_COUNTS` rises; `apollo11Definition.ts` leaves Apollo `src` for its tests; the lock is regenerated and every `apiTypeLint` and `apiOutsideTypes` entry that vanished with the leak is removed.

## Context Files

`.savepoint/objectives/O-057-make-names-and-shapes-consistent-for-0-8-0/Objective.md`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/prepared.ts`, `packages/astraeus/src/api/planCamera.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/sceneReads.ts`, `tools/check-node-consumer.mjs`, `tools/check-react-consumer.mjs`, `packages/astraeus-demo-apollo11/tests/support.ts`, `packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11Definition.ts`, `packages/astraeus-demo-showers/tests/helpers/showerDefinition.ts`, `packages/astraeus-demo-planets/tests/planetViews.test.ts`, `packages/astraeus-demo-planets/tests/helpers/planetViewSnapshot.ts`, `packages/astraeus-site/tests/syntheticScenes.test.ts`, `packages/astraeus-site/tests/packageBoundaries.test.ts`, `packages/astraeus-site/tests/apiTypeLint.allowlist.json`, `packages/astraeus-site/tests/apiOutsideTypes.allowlist.json`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-04, ARCH-03, TEST-01, TEST-03.

## Implementation Plan

1. Add the internal helper and move `load`, `check` and `prepared.ts` onto it. 2. Remove the two methods and make `SceneCamera` type-only. 3. Point engine tests and fixtures at the helper mechanically (about 336 calls in 44 files; `scenePin.json` stays as the pin). 4. Add `scene.activities`. 5. Move the consumer checks, planets tests and site tests to public reads. 6. In Apollo and showers tests, swap imports so counts do not rise. 7. Regenerate the lock; prune the allowlists.

## Boundaries

No renames yet. A test may not be weakened to fit: an assertion with no public read stays by moving to an engine test. If a deep-import count must rise, stop and ask.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the last step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

**Hand-off (stage audit).** Planets resolved after the first report by owner decision (below).

Extra reads (none beyond Context Files and these, for locating callers): `packages/astraeus/src/api/{activity,planGroups,planStory,frozenCopy}.ts`, `tools/api-rules.mjs` (type-lint rules, to name the new read), `packages/astraeus-site/tests/apiRules.test.ts`, `packages/astraeus/package.json` (exports, to route the helper), `packages/astraeus/tests/{scenePin,sceneInputCopies,publicApi,publicApiPaths}.test.ts`.

Built: internal `packages/astraeus/src/api/definitionOf.ts` (WeakMap registered by the `Scene` constructor; exports `definitionOf`, `missingDataOf`, `registerDefinition`, `registerMissingData`); not in `index.ts`, absent from `api-surface.lock.json`. `Scene.toDefinition`/`missingData` removed; `load`, `check`, `prepared.ts` and the two engine `synthetic/*Definition.ts` use the helper. `SceneCamera` is `export type`; `RateSource` left the root. `scene.activities` (`SceneActivityRead`, fresh frozen list via `PlanGroups.activityReads`). Tests reach the helper in-package by `../src/api/definitionOf` and from other packages by `astraeus/tests/definitionOf` (new `packages/astraeus/tests/definitionOf.ts`, under the existing `./tests/*` dev export). Codemod re-pointed ~330 calls in 44 engine test files.

Done When -> test:
| Done When | Test (file, case) |
|---|---|
| `toDefinition` and `missingData` off `Scene` | `tsc --noEmit` clean on all callers; `packages/astraeus-site/tests/apiSurface.test.ts` (lock matches) |
| `load` and `check` work as before through the internal helper | `packages/astraeus/tests/cold/sceneLoad.test.ts` (load twice, frozen, check after load); `sceneBodySets.test.ts` "scene.check passes for a good set..."; `sceneInputCopies.test.ts` "load/check/missingDataOf/definitionOf: editing the data sources afterwards changes nothing"; `scenePin.test.ts` (pin JSON unchanged) |
| helper not exported from the root | `apiSurface.test.ts` lock; `apiRules.test.ts` "throws only SceneError" (no new break); `grep` of packed `dist/src/api/index.d.ts` shows no `definitionOf`/`toDefinition` |
| `SceneCamera` type only | `api-surface.lock.json` change; `lifecycle.test.ts` and `sceneInputCopies.test.ts` now import the class from `src/api/planCamera` |
| `RateSource` stays internal | removed from `index.ts` and the lock; `viewerLinkPin.test.ts`, `viewerHostDom.test.ts` still read `link.rateSource` |
| public `scene.activities` with made-up-data test | `sceneReads.test.ts` "scene.activities": "states what was added...", ten `it.each` "%s changed alone moves only its own part of the read" (id, label, unit, start, end, peak, peakLabel, type, samples, provenance), "is a fresh frozen list ... a copy ... answers on a scene a viewer has taken" |
| node and React consumers use only public calls | `node tools/check-node-consumer.mjs` pass (10 tests); `npm run check:react-consumer` pass |
| `planetViews.test.ts`, `planetViewSnapshot.ts` use public reads, planets stay 0 | NOT DONE (see below) |
| site `syntheticScenes.test.ts` uses public reads, site stays 0 | `syntheticScenes.test.ts` "synthetic: one marker path and the contact window..." (uses `scene.activities`), "belt" and "eccentric" (use `scene.camera.reach` / `farEarthRadii`) |
| no `DEEP_IMPORT_COUNTS` rise | `packageBoundaries.test.ts` "counts deep imports..." passes with the constants unchanged (Apollo 129, showers 68 held by swapping an import: Apollo `support.ts` drops `StateResolver`, showers `showerDefinition.ts` drops `ExperienceDefinition`) |
| `apollo11Definition.ts` leaves Apollo `src` | moved with `git mv` to `packages/astraeus-demo-apollo11/tests/apollo11Definition.ts`; Apollo tests import it from there |
| lock regenerated, vanished allowlist entries removed | `npm run api:lock`; `apiTypeLint.allowlist.json` -15 unitless, -5 exceptions, -20 breaks; `apiOutsideTypes.allowlist.json` -1 (`ExperienceDefinition`); `apiRules.test.ts` and `apiSurface.test.ts` pass |

Assertions moved or reshaped (nothing dropped): site "marker has 12 anchors, 97 path times" (no public read of anchors) -> engine `publicApiPaths.test.ts` "moved from the site's scene test..." on made-up data. Apollo `infoProvenance.test.ts` known-limits now read `scene.bodies`/`scene.paths`. `lifecycle.test.ts` and `sceneBodySets.test.ts` `scene.missingData(...)` -> `missingDataOf`. `publicApi.test.ts` toDefinition spies -> `registerDefinition` wrapper counting builds. `scenePin.test.ts` uses the helper from its fresh module graph (keys in the pin JSON unchanged).
Consumer checks lost these definition-only assertions (no public read; engine tests cover them: sceneViews, publicApiAutoStretches, publicApiLineStretches, pacing, moonOrbitLines): per-view object/event/panel membership and camera rules, resolved `lineFixedTo` stretches, pacing defined, orbit-line `spanMs` for Titan/Titania, Saturn orbit path id, `provenanceSpans` length. The catalogue ring read in the O-048 consumer test still imports an internal packed file (not `toDefinition`; left).

Gates (this session): `npm run lint` pass; `npm run build` pass; `npm run check:engine-alone` pass; `npm run check:pack` pass; `node tools/check-node-consumer.mjs` pass; `npm run check:react-consumer` pass; `npm test` 2949 passed, 2 skipped, 1 file failed (`packages/astraeus-demo-planets/tests/planetViews.test.ts`, suite cannot load: `scene.toDefinition is not a function`); `npm run typecheck` 3 errors, all in the two planets files. No browser run.

Planets (owner, 2026-11-07: "Retire it, keep public parts"). Deleted `packages/astraeus-demo-planets/tests/fixtures/planet-views-before.json` and `tests/helpers/planetViewSnapshot.ts`; `planetViews.test.ts` rewritten on public reads for all nine planets (91 cases; expected values from the settings and system files, no new recording; planets deep imports still 0). Cases per planet: builds with `scene.check({ data })`; `scene.bodies` order, listed flag, orbit flags; centre and mapped-moon description and known limits; moon panel and body sets present exactly when a moon list exists (`facts` "Known moons", set centre, counts, families); `scene.places` bodies and counts; `scene.timeline` and `scene.scales`; `scene.camera` pose, target, followChoices, reach, farEarthRadii; `scene.panels` ids. Row in the Done When table: `planetViews.test.ts` all cases.
Lost nine-planet cover (rechecked against every public read on `Scene` and `scene.camera`; only these have none): info card rows (`createMetrics`; `scene.bodies[].facts` and the readout kinds have reads, the computed rows do not, and `setBodyReadouts` has no getter), the synthesised Focus camera presets and the preset menu (`camera.followChoices`, `target` and `pose` are covered), label priority and label reach per object (`SceneBodyRead` carries neither), the moon orbit loops' spans and look (only the `orbit` flag is read, and is covered), place coordinates and descriptions (`scene.places` gives body and count only; both are covered), and the full definition equality with the old-versus-new fixture. Restored after the coordinator's send-back, now covered by public reads: per-object provenance (`scene.provenanceOf` for every body and every small moon: type ephemeris, non-empty sources, accuracy and notes; list sources cited for listed moons; fit source cited for small moons) and the moon panel text (`scene.moonPanel.summary` equals count, list source and date from the list). Provenance needed no loaded data, so `scene.load` was not used. Body-set provenance: `provenanceOf` answers for a set member by id, and every small moon is checked; a set has no separate read. Partial cover elsewhere: engine tests `publicApiPaths.test.ts`/`publicApiSunOrbits.test.ts` (readouts/metric rows, labels, orbit paths on made-up data), `focusPreset.test.ts` (Focus presets), `moonOrbitLines.test.ts`; planets `planetScene.test.ts` (made-up planet and Jupiter via the same builder, places conversion `placesOf`), `moonList.test.ts`, `planetOpeningFraming.test.ts`, `surfacePlace.test.ts`; browser check at the Objective end. None of these cover all nine real planets' rows.
Observation (left as is, per coordinator): the O-048 packed-consumer test in `tools/check-node-consumer.mjs` still reads the packed `assets/catalogue.js` for Saturn's rings.
Gates re-run after the planets change: see the final report in the hand-off message (lint, typecheck, build, test, engine-alone, pack, node and React consumers).

Remaining `removedBy: O-057` entries: `apiTypeLint` breaks 21, `apiOutsideTypes` entries 23.

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.

- (T-274) New internal route `src/api/definitionOf.ts` (WeakMap registry filled by the `Scene` constructor) is the one way the engine, `mount`, `load`, `check` and tests reach a scene's `ExperienceDefinition`; Design's "Public API shape" should name it. Engine-side deep route for other packages' tests is `astraeus/tests/definitionOf`.
- (T-274) `SceneActivityRead` names its span `windowStartUtcMs`/`windowEndUtcMs` and groups the peak as `peak: { label, value, timeUtcMs? }` to satisfy the API-04 lint without growing the unitless list.
