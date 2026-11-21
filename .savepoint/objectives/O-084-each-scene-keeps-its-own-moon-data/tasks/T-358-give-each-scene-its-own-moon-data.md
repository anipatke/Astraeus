---
id: T-358
title: Give each scene its own moon data
objective: O-084
status: done
depends_on: [{task: T-357, requires: clear}]
check_waiver: {task: T-358, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:08:49Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: binding
planned_reads: [packages/astraeus/src/core/moonData.ts, packages/astraeus/src/assets/catalogue.ts, packages/astraeus/src/api/definitionOf.ts, packages/astraeus/src/api/planPaths.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/sceneLayout.ts, packages/astraeus/src/app/experienceDefinition.ts, packages/astraeus/src/app/OrbitSetView.ts, packages/astraeus/tests/moonLoadTwice.test.ts, packages/astraeus/tests/sceneBodySets.test.ts, packages/astraeus/tests/publicErrorContract.test.ts]
planned_writes: [packages/astraeus/src/api/planBodies.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/data.ts, packages/astraeus/src/api/planBodySets.ts, packages/astraeus/tests/cold/sceneMoonIsolation.test.ts, packages/astraeus/tests/sceneMoonScope.test.ts, packages/astraeus/tests/twoViewers.test.ts, packages/astraeus/tests/fixtures/scenePin.json]
---

# Give each scene its own moon data

## Outcome

Every `Scene` owns one moon data binding, made with the scene. `scene.load`, `scene.stateOf`, `scene.provenanceOf`, `check`, `mount` and `<AstraeusScene>` all read and load through it, so a scene's answers no longer depend on what any other scene in the page or process has loaded (AH-03, Codex F01, Gemini SCI-08). The pinned two-scene reproduction turns green.

## User Check

None visual. `tests/cold/sceneMoonIsolation.test.ts` passes with every row a plain `it`. A Jupiter scene with no moon data keeps the same Jupiter position after another scene loads Io.

## Done When

- The scene's plan starts from `bindCatalogue(builtInCatalogue, createSceneMoonData())` (`api/planBodies.ts`, line ~111) instead of the bare built-in catalogue. Every catalogue the plan derives (`extendCatalogue`, `extendCatalogueWithMoons`) keeps that binding. Every resolver and source made from the plan (`Scene.#catalogueSource`, `#sunState`, `planPaths`' `autoStretches`, the viewer's `createSceneResolver` through `catalogueOf(definition)`) therefore reads only this scene's moon systems.
- `assembleScene` always hands the plan's catalogue to the definition. The `plan.catalogue === builtInCatalogue` shortcut at `api/assembleScene.ts:184` goes, so `catalogueOf` never falls back to the unbound built-in catalogue for a scene.
- `installData(data, ids, window, catalogue, sets)` loads into the moon data of the bound catalogue it is given (`provideIndex` and `load` on the scene's own systems). It falls back to the process-wide systems only when given an unbound catalogue, which keeps `tests/moonLoadTwice.test.ts` unchanged. Keep O-083's `bad-data` and `out-of-span` mappings in `api/data.ts` as they are. `checkDataSources` reads only the static configuration.
- `planBodySets`' listed-moon groups (`createEphemerisGroup` at `api/planBodySets.ts:160,169`) read the scene's own system's `ephemeris`, not `MOON_SYSTEMS[center]`. `MOON_SYSTEMS` stays only for configuration (`config.centreGmKm3S2`, `balancePoint`).
- One scene loaded twice with different sources for the same planet uses the last one for that scene only (planner decision; no new error code).
- `tests/cold/sceneMoonIsolation.test.ts`: every `it.fails` becomes `it`. Only the marker changes, never a row's setup or expected values.
- New `packages/astraeus/tests/sceneMoonScope.test.ts`, in the preloaded project, where the process-wide systems are loaded. It is the mechanised guard against a public path that falls back to them (Strategic fix first). Rows:
  1. `new Scene().addBody(sun).addBody(jupiter)` loaded with no data: `stateOf("jupiter", 2016-06-01)` equals the barycentre (planet series, no offset), not the preloaded centre.
  2. The same scene mounted through the stub-canvas pattern of `twoViewers.test.ts`: the viewer runtime's `resolver.stateOf("jupiter", t, "sun")` equals row 1.
  3. A scene with a listed-moon body set and its data: its group answers from the scene's own chunks, and a second scene's set without that window throws on the same instant.
  4. `scene.load({ data })`, then a later `mount` of the same scene: the mount fetches no chunk again (same binding).

  Show rows 1–3 failing first.
- **Planner decision, existing test assertions:** `tests/twoViewers.test.ts` reads the process-wide `JUPITER_MOON_SYSTEM.ephemeris()` after a public `mount` in `expectBoth` (lines ~226–231), in T-251 (line ~243) and in T-267 (line ~526). Those reads pin the shared install this Objective removes. Each is moved to read the viewer's own runtime resolver (`runtimeOf(...).resolver`), or the group in `runtime.bodySets`, and keeps its intent: the new scene's moons answer, no chunk is fetched twice, and the set's member answers. `stubMoonData`'s setup (the data source, the `fetch` stub, `install(null)`) is unchanged. Record each changed line and its reason in Technical Evidence.
- If `tests/fixtures/scenePin.json` changes (its scenes are built one after another in one module graph, so a planet in a scene without data may have read an earlier scene's moon data), regenerate it (`npx vitest run packages/astraeus/tests/scenePin.test.ts -u`). Show that every changed entry is a planet position or moon read that no longer leaks from an earlier scene. Any other diff is a defect to fix, not to accept.
- O-083's `tests/publicErrorContract.test.ts` stays green. If a row there reads a moon without passing that scene its data (relying on the preload), report it as a REPLAN item instead of changing the row.
- Existing tests unchanged and green apart from the lines named above, including `twoViewers`, `lifecycle`, `sceneBodySets`, `listedMoonBodies`, `dataSpans`, `planetChunksWindow`, the cold project (`tests/cold/sceneLoad.test.ts`) and the Horizons planet tests.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/api/planBodies.ts` (the plan class, `catalogue` field ~111, the extend calls ~124–158)
- `packages/astraeus/src/api/scene.ts` (`stateOf` ~596, `#catalogueSource` ~631, `#sunState` ~640, `load` ~652, `#definition`)
- `packages/astraeus/src/api/assembleScene.ts` (`catalogue` line ~148, the definition's `catalogue` ~184, `prepare` ~205–215)
- `packages/astraeus/src/api/data.ts` (`checkDataSources`, `installData`, `outOfSpan`)
- `packages/astraeus/src/api/planBodySets.ts` (`MOON_SYSTEMS` uses at ~91, 123, 137, 160, 169; `BodySetContext`)
- `packages/astraeus/src/app/experienceDefinition.ts` (`catalogueOf`, line ~262)
- `packages/astraeus/src/app/App.tsx` (`buildRuntime`, the `createSceneResolver` call ~151)
- `packages/astraeus/src/core/moonData.ts` and `packages/astraeus/src/assets/catalogue.ts` (`bindCatalogue`, from draft 04)
- `packages/astraeus/tests/twoViewers.test.ts` (`stubMoonData`, T-251, T-267)
- `packages/astraeus/tests/cold/sceneMoonIsolation.test.ts` (from draft 01)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`: `One handle, one lifecycle`, `Every listed moon addable`, `Planet positions from Horizons`, `Answers for sites`, `Headless use and looks as settings`; under `Decisions`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-02, API-03, API-05, ARCH-02, ARCH-04, ARCH-05, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04, CODE-01, STYLE-06.

## Implementation Plan

1. Write `sceneMoonScope.test.ts` and show rows 1–3 failing.
2. Bind the plan's catalogue, and drop the built-in shortcut in `assembleScene`.
3. Make `installData` load into the bound catalogue's moon data, and point `planBodySets`' groups at the scene's systems.
4. Flip the pinned rows. Migrate the named `twoViewers` assertions.
5. Run the focused tests. Regenerate `scenePin.json` only if it moved, and review its diff. Then run the gates.

## Boundaries

No public type or API surface change (`DataSource`, `MoonPositions` and `SceneLoadOptions` stay as they are; the lock is unchanged). No change to which chunks a scene needs, to the 1950 clamp (draft 02), or to the resolver memo (draft 06). Scoping moon loads to a body's shown span (AH-27) and GPU sharing (O-092) are out of scope. No browser run unless a site script fails; then migrate `packages/astraeus-site/tools/validate/driver.mjs` in this Task.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/sceneMoonScope.test.ts packages/astraeus/tests/twoViewers.test.ts packages/astraeus/tests/lifecycle.test.ts packages/astraeus/tests/sceneBodySets.test.ts packages/astraeus/tests/moonLoadTwice.test.ts packages/astraeus/tests/publicErrorContract.test.ts packages/astraeus/tests/scenePin.test.ts` and `npx vitest run --project cold`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Code: planBodies binds the plan catalogue; assembleScene always passes it; installData and planBodySets read the bound catalogue's moon data. cold/sceneMoonIsolation: it.fails -> it, header comment updated (cold 15/15). New tests/sceneMoonScope.test.ts (5 rows; rows 1-4 red with the plan binding reverted, green after).
Existing-assertion changes (all read a scene's own data instead of the shared install):
- twoViewers.test.ts: expectBoth(...[viewer, year]) reads that viewer's runtime.resolver.stateOf("io", t, "jupiter") via ioIn (was JUPITER_MOON_SYSTEM.ephemeris().stateOf for both years); T-251 line ~243 now ioIn(viewer,"2023") toThrow (was shared-install read); its two expectBoth() calls pass the viewers; T-267 line ~526 now runtime(b).bodySets[0].group.memberStateAt(0,t) (was JUPITER_MOON_SYSTEM.ephemeris().stateOf("amalthea",...)). stubMoonData setup unchanged.
- sceneBodySets.test.ts "scene.load loads the members' chunks...": expected value was JUPITER_MOON_SYSTEM.ephemeris().stateOf(id,T1); now a separate createMoonSystem(JUPITER_MOON_SYSTEM.config) loaded from the same source (index + chunkUrls, same window and bodies). Setup unchanged.
scenePin.json regenerated; every changed entry accounted for by a structural walk of old vs new JSON (158 non-catalogue changes + 57 catalogue keys):
(a) 57 definitions gain a `catalogue` key (assembleScene always passes the scene's catalogue).
(b) Scenes whose data never loads moon positions (the made-up journey scene; "jupiter moons with their data package", whose DATA entries are stubs with no moonPositions) no longer borrow the preload:
  - made-up journey, metrics: EphemerisChunkMissingError -> NotLoadedError (name + message), 2 times each for callisto, dione, enceladus, europa, ganymede, iapetus, io, mimas, rhea, saturn, tethys, titan, jupiter (26 names, 26 messages).
  - made-up journey, stateOf: error code bad-time -> missing-data (+message), 2 times each for iapetus, callisto, ganymede, io, mimas, tethys, rhea, dione, europa, titan, enceladus (22 codes, 22 messages).
  - "jupiter moons with their data package": metrics europa, callisto, jupiter, io (x2 each) answer -> NotLoadedError; stateOf europa, callisto, io (x2 each) state removed -> SceneError missing-data; jupiter position x2 times 3 coordinates moved by the offset of the preloaded moons (e.g. x -809893963.85 -> -809894100.455, about 136 km): the barycentre without borrowed moon data.
(c) Nothing else. No numeric change in any scene that loads its own moon data; seriesNotLoaded and error sections unchanged.

Gates: lint clean, typecheck clean, build ok. Full `npx vitest run`: 5045 pass, 4 fail (jupiterMoonsEphemeris chunk-size row failed once under load and passed on rerun). Real red: packagePacks engine cap (known; 1833697 B raw vs limit 1833000, +697 B; gzip not printed because the raw check fails first); and three existing tests that rely on the process-wide install or on a scene carrying no catalogue, NOT edited, stopped for the coordinator: listedMoonBodies.test.ts:65 (definitionOf(scene).catalogue toBeUndefined, now always present), listedMoonBodies.test.ts:84-88 (MOON_SYSTEMS.uranus.install(set) then Scene.stateOf miranda, now not loaded), astraeus-demo-planets/tests/jupiterMoonsScene.test.ts:38 (jupiterIoScene.stateOf of small moons from the preload, now not loaded).

Coordinator decision 2026-11-21 (three migrations, before -> after):
- listedMoonBodies.test.ts:65 "an unused moon costs nothing": `expect(definitionOf(scene sun+uranus).catalogue).toBeUndefined()` -> `own = definitionOf(...).catalogue!; expect(own.ids()).toEqual(catalogue.ids()); expect(own.moonData).toBeDefined()` (built-in bodies only, bound to its own moon data).
- listedMoonBodies.test.ts:84 Miranda 1986: `MOON_SYSTEMS.uranus!.install(set)` before the scene -> the same set installed into the scene's own system (`definitionOf(s, [uranusData]).catalogue!.moonData!.system("uranus")!.install(set)`), then `await s.load({ data: [uranusData] })`; test made async; the stateOf/provenance assertions are unchanged.
- astraeus-demo-planets jupiterMoonsScene.test.ts "places every small moon": the scene loaded nothing and read the preload -> `await jupiterIoScene.load({ data: jupiterIoData })` with fetch stubbed to read the chunk files (REPO/afterEach added); assertions unchanged.
Final gates: lint clean, typecheck clean, build ok (earlier), full vitest 5049 pass, 1 fail (known packagePacks engine cap: 1833697 B raw vs limit 1833000, +697 B; gzip not printed as raw fails first), 2 skipped. jupiterMoonsEphemeris chunk-size flake: rerun 5/5 green (passed on first rerun, failed once under full-suite load earlier; not reproduced this full run).

## Drift Notes

Record for Design reconciliation:
- `One handle, one lifecycle` and `Every listed moon addable`: each `Scene` owns one moon data binding, and its catalogue is bound to it from the start. `installData` loads into it, and body-set groups read it.
- `Planet positions from Horizons`: a planet takes its barycentre offset only from its own scene's moon package.
- The Design.md text "`assembleScene` passes `catalogue` whenever it differs from the built-in one" is now "always".

Coordinator (orchestrate-g024-20261121): build rerun ok by the coordinator after the final migrations; lint, typecheck green; `npm test` 306 files, 5049 passed with the one known red (`packagePacks` engine cap, 1,833,697 B raw, +697 B), carried to the Full Objective Check under G-024 decision 7. Existing-test changes are the ones the coordinator authorised (twoViewers, sceneBodySets, listedMoonBodies x2, demo jupiterMoonsScene; scenePin categorised as (a)/(b) only). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and decision 7.
