---
id: T-259
title: Load data and check a scene without a viewer
objective: O-056
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-259, reason: 'Owner said "Orchestrate o56" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o056-run-20261103}, recorded_at: '2026-11-03T09:53:28Z'}
planned_by: {role: planner, session: o056-planning-20261103}
---

# Load data and check a scene without a viewer

## Outcome

A Node or server app awaits `scene.load({ data })` and then asks `stateOf` / `provenanceOf` about any body in the scene, moons included; `scene.check({ data })` throws exactly what `mount` would for a build fault (O-056 Success Conditions 1 and 2; review F6, F7 part; D1).

## User Check

Not owner-facing: the change is an API with tests. The owner sees the result at the end of the Objective.

## Done When

- `Scene.load(options: { data?: readonly DataSource[] }): Promise<void>` loads the planet series and, for each moon the scene holds, the chunks its data package provides for the scene's window (through the shared per-planet store from O-055, so a later mount re-uses them). It rejects with `missing-data` when a body needs a package not passed, and with `out-of-span` as mount does. Calling it twice is harmless. It is allowed on a frozen (mounted) scene.
- Before `load`, a planet or moon `stateOf` throws `SceneError` `missing-data` whose message names `scene.load`; no message names `loadPlanetSeries` or any other internal; the message-text match at `stateOf` (`error.message.startsWith("the planet series are not loaded")`) is replaced by a typed internal error (API-05).
- `Scene.check(options: { data?: readonly DataSource[] }): void` runs the same assembly and checks `mount` runs before drawing (`assembleScene`, data-package rights) and throws the same error; a table-driven test (one row per build-fault code `mount` can throw synchronously) asserts `check` and `mount` throw the same code and message. `check` does not freeze the scene.
- One new engine test file, run by a Vitest project or config that skips `vitest.setup.ts`'s preload, covers cold `stateOf` (throws), `load` then `stateOf` for a planet and a fitted moon (Io) and `provenanceOf`, using only `import … from "astraeus"` plus a data package's `dataSource`.
- `check:node-consumer` gains a cold-start case on the packed package: a fresh Node process, no preload, `await scene.load({ data })` then `stateOf("jupiter")` and a moon.
- **Surface:** `npm run api:lock` regenerated and the lock diff limited to the members this step adds; CHANGELOG (Unreleased) and the README API tables updated in the same change; `apiSurface`, `apiRules` and `allowlistGrowth` tests pass (no allowlist group grows).
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/assembleScene.ts`, `packages/astraeus/src/api/data.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/prepareScene.ts` (or wherever `prepareScene` lives; locate with grep), `packages/astraeus/src/core/planetSeries.ts`, `packages/astraeus/src/core/bodies/moonSystem.ts`, `packages/astraeus/vitest.setup.ts`, `vitest.config.ts`, `tools/check-node-consumer.mjs`, `.savepoint/Design.md` under `Interfaces and Data Flow` (the "Answers for sites (O-045)" and "Good guest (O-055" paragraphs).

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)` ("Numbers work without a viewer", "Lifecycle"); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F6, F7).

## Guardrails

API-01, API-02, API-04, API-05, API-06, ARCH-02, ARCH-03, ARCH-06, TEST-01, TEST-03, STYLE-02, STYLE-07, STYLE-10, CODE-01, API-03.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Find the load path `prepareScene` / `prepare` uses and expose it as `Scene.load` without a second copy (STYLE-07).
3. Replace the message-text match with a typed internal error and the public message naming `scene.load`.
4. Add `Scene.check` over the same assembly; write the same-error table test.
5. Add the no-preload test file and its Vitest wiring; add the node-consumer cold-start case.
6. Lock, README, CHANGELOG; gates.

## Boundaries

Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files. No renames of existing members and no removal of `toDefinition` (O-057). No viewer-free entry point beyond `load` and `check` (D1).

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus the named `check:*` scripts. No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`. Also `npm run check:pack` and `npm run check:node-consumer`.

## Technical Evidence

| Done When | Evidence |
|---|---|
| `Scene.load` loads planet series and per-moon chunks, rejects `missing-data` / `out-of-span`, twice harmless, allowed on frozen scene | `scene.ts` `load` = `toDefinition(data).prepare()` (the path `mount` uses; `installData` -> shared moon-system store); `tests/cold/sceneLoad.test.ts`: planet + Io state and provenance after load, load twice, load after `toDefinition`, rows for missing package / out-of-span (1900 window) / empty scene |
| Before `load`, `stateOf` throws `missing-data` naming `scene.load`, no internals; message-text match replaced by typed error | `NotLoadedError` (core/planetSeries.ts) thrown by planet series and moon system; `stateOf` catches by type; cold test rows for planet and Io; allowlist entry in `apiErrors.allowlist.json` removed (list now empty); `scenePin.json` regenerated (error name `NotLoadedError`; moon stateOf before load is now a `SceneError` `missing-data`) |
| `Scene.check` throws what `mount` throws; table test; does not freeze | `tests/sceneCheck.test.ts`: 9 rows (empty-scene, missing-data, bad-view, bad-event, bad-group, bad-scale, bad-readout, bad-timeline, bad-panels) each assert `check`, `mount` and `prepareScene` (shared by `<AstraeusScene>`) throw the equal name/code/message; second test shows check leaves scene editable |
| No-preload engine test file, own Vitest project | `vitest.config.ts` now has projects `preloaded` (setup file) and `cold` (`packages/astraeus/tests/cold/**`, no setup); `tests/cold/sceneLoad.test.ts` (8 cases, fresh module graph per case) |
| `check:node-consumer` cold-start on packed package | `tools/check-node-consumer.mjs` now builds and unpacks `astraeus` and `astraeus-data-jupiter`; new case: `io` stateOf throws `scene.load`, `check`, `await load({ data: [dataSource] })`, Jupiter and Io state and Io provenance; run: pass (10 tests) |
| Surface: lock, CHANGELOG, README, allowlists | `npm run api:lock` diff = `Scene.load`, `Scene.check`, `SceneLoadOptions` only; CHANGELOG Unreleased entry; README table rows and `stateOf` row; `apiSurface`, `apiRules`, `allowlistGrowth` pass (one allowlist group shrank to empty) |
| Gates | `npm run lint` pass, `npm run typecheck` pass, `npm run build` pass, `npm test` 205 files / 2532 passed 2 skipped, `npm run check:pack` pass, `npm run check:node-consumer` pass. No browser run. |

Extra reads (none beyond Context Files). Files read: those listed plus `core/bodies/moonSystem.ts`, `api/prepared.ts`, `api/index.ts`, `astraeus-data-jupiter/src/index.ts`, `tools/build-packages.mjs` header, `tests/scenePin.test.ts`, `astraeus-site/tests/apiErrors.allowlist.json`.

Limitations: the cold engine test builds the Jupiter `DataSource` from the package's shipped `index.json` and chunk files, because a source checkout has no generated `src/chunks.js` (so the package's own `dataSource` cannot be imported unbuilt); the packed `dataSource` is exercised by `check:node-consumer`. `AstraeusScene` is covered through the shared `prepareScene`, not mounted in a test.

## Drift Notes

Record architecture deltas here; T-264 reconciles them into Design.md.
- Moon chunk addresses of the form `file:` could not be read in Node (Node's `fetch` refuses them), so `core/bodies/moonSystem.ts` `fetchBytesOf` now reads them through `process.getBuiltinModule("node:fs/promises")`. Design.md "Answers for sites" should say a Node app can `await scene.load({ data })` with a data package's own `dataSource`. Deferred to T-264.
- New internal typed error `NotLoadedError` (core/planetSeries.ts) for "data not loaded yet"; `Scene.stateOf` maps it to `missing-data`. Design "Numbers work without a viewer" is now true for `load`/`check`; the `toDefinition` route is unchanged until O-057. Deferred to T-264.
- `vitest.config.ts` has two projects (`preloaded`, `cold`) in place of one config with a setup file; tests dropped in `packages/astraeus/tests/cold/` run without the preload. Test-tooling note for Design/verification docs; deferred to T-264.
