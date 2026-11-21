---
id: T-357
title: Let a body list read moon data that belongs to one scene
objective: O-084
status: done
depends_on: [{task: T-356, requires: clear}]
check_waiver: {task: T-357, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:08:49Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: binding
planned_reads: [packages/astraeus/src/core/bodies/index.ts, packages/astraeus/src/core/bodies/jupiterMoons.ts, packages/astraeus/src/core/bodies/planetMoons.ts, packages/astraeus/src/core/bodies/listedMoonBodies.ts, packages/astraeus/src/core/moonChunkCache.ts, packages/astraeus/tests/stateResolver.test.ts, packages/astraeus/tests/planetAccuracyFlybys.test.ts, packages/astraeus/tests/layerRule.test.ts]
planned_writes: [packages/astraeus/src/core/body.ts, packages/astraeus/src/core/moonData.ts, packages/astraeus/src/core/bodies/moonSystem.ts, packages/astraeus/src/core/bodies/planetTrajectory.ts, packages/astraeus/src/core/stateResolver.ts, packages/astraeus/src/assets/catalogue.ts, packages/astraeus/tests/sceneMoonBinding.test.ts]
---

# Let a body list read moon data that belongs to one scene

## Outcome

A body catalogue can be bound to one scene's own moon data. The bound catalogue's fitted moons, and its planets' offsets from their barycentres, read only that scene's moon systems, never the process-wide ones. An unbound catalogue keeps today's behaviour, so core-level callers and their tests are unchanged. This Task builds the seam; draft 05 routes the public paths through it.

## User Check

None visual. The new `sceneMoonBinding` tests pass and every existing test passes unchanged.

## Done When

- `StateSourceBinding.create` takes an optional second argument, the scene's moon data (`create(adapter, moonData?)`). Its type, for example `MoonDataSelection { system(centre: BodyId): MoonSystem | undefined; revision(): number }`, lives in a new `core/moonData.ts` with `createSceneMoonData()`. That function makes, lazily for each centre, a fresh `createMoonSystem(MOON_SYSTEMS[centre].config)`, which shares decoded bytes through draft 03's store.
- `MoonSystem.binding(...)` and `planetBinding(...)` use `moonData.system(centre)` when `moonData` is given, and their own process-wide system only when it is not. A bound planet with no loaded scene system is at its barycentre, by the existing `barycentreOffsetKm` rule. A bound moon with no loaded scene system throws `NotLoadedError`. Build on the binding shape O-083 draft 07 leaves in `moonSystem.ts` (definition and binding made together); do not restore the old shape.
- `createStateResolver(definitions, bindings, adapter, moonData?)` passes `moonData` to every `create`.
- `assets/catalogue.ts` gains `bindCatalogue(base, moonData)`. It returns a catalogue with the same definitions and visuals whose `sources()` wrap each binding as `{ body, create: (adapter) => binding.create(adapter, moonData) }`, and that exposes `moonData`. `extendCatalogue` and `extendCatalogueWithMoons` keep the binding when given a bound base.
- New `packages/astraeus/tests/sceneMoonBinding.test.ts`, in the preloaded project, so the process-wide Jupiter and Saturn systems are loaded. Rows (ARCH-03: Jupiter and Saturn as two configurations):
  1. The built-in catalogue bound to an empty `createSceneMoonData()`: Jupiter and Saturn from the resolver equal their barycentre positions (the planet series with no offset), and Io and Titan throw `NotLoadedError`.
  2. After loading that scene data's Jupiter system (the 2016 chunks from disk): Jupiter equals the unbound resolver's answer exactly, Io answers, and Saturn is still at its barycentre.
  3. A second `createSceneMoonData()` bound to the same catalogue is unaffected by row 2.
  4. The unbound catalogue gives exactly today's answers (Jupiter with its offset from the preload).

  Show rows 1–3 failing first (no seam yet).
- `tests/layerRule.test.ts` stays green (`core/moonData.ts` imports nothing above core).
- Existing tests unchanged and green, including `tests/stateResolver.test.ts`, `tests/planetAccuracyFlybys.test.ts` and the Horizons planet tests, the 22 test files that call `createStateResolver` with three arguments, and `tests/cold/sceneMoonIsolation.test.ts` (still pinned as failing).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/body.ts` (`StateSourceBinding`, line ~52)
- `packages/astraeus/src/core/bodies/moonSystem.ts` (`binding`, `trajectory`, `ephemeris`, `isLoaded`)
- `packages/astraeus/src/core/bodies/planetTrajectory.ts` (`barycentreOffsetKm`, `planetBinding`)
- `packages/astraeus/src/core/bodies/listedMoonBodies.ts` (`MOON_SYSTEMS`, `listedMoonBody`)
- `packages/astraeus/src/core/bodies/index.ts` (the planet bindings, lines ~36–43)
- `packages/astraeus/src/core/stateResolver.ts` (`createProviders`, `createStateResolver`)
- `packages/astraeus/src/assets/catalogue.ts` (`createCatalogue`, `extendCatalogue`, `extendCatalogueWithMoons`)
- `packages/astraeus/src/core/moonChunkCache.ts` (from draft 03)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`: `Planet positions from Horizons` (one planet binding rule), `Every listed moon addable` (the scene's own catalogue), `Core layers and demos`; under `Decisions`, `Public API shape (G-016, owner 2026-11-01)`.

## Guardrails

ARCH-02, ARCH-03, ARCH-04, ARCH-05, PROV-01, API-03, TEST-01, TEST-02, TEST-03, CODE-01, STYLE-06, STYLE-07.

## Implementation Plan

1. Write `sceneMoonBinding.test.ts` and show rows 1–3 failing.
2. Add `core/moonData.ts` and the optional `moonData` argument, then thread it through the moon and planet bindings and `createStateResolver`.
3. Add `bindCatalogue` and keep the binding through the two extend functions.
4. Run the focused tests, then the gates.

## Boundaries

No public API path uses the seam yet: `Scene`, `assembleScene`, `installData`, `planBodySets` and `App` are unchanged (draft 05). No change to definitions, provenance text or chunk selection. No public type changes, and the API-surface lock is unchanged.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/sceneMoonBinding.test.ts packages/astraeus/tests/stateResolver.test.ts packages/astraeus/tests/planetAccuracyFlybys.test.ts packages/astraeus/tests/layerRule.test.ts packages/astraeus/tests/listedMoonBodies.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

| Done When | Evidence |
|---|---|
| `create(adapter, moonData?)`, `MoonDataSelection`, `createSceneMoonData()` in `core/moonData.ts` | `core/moonData.ts`, `core/body.ts`; `sceneMoonBinding.test.ts` rows 1-3 use them |
| moon and planet bindings use the scene system when bound, process-wide otherwise; bound planet unloaded at barycentre, bound moon throws `NotLoadedError` | `moonSystem.ts` (`sceneEphemeris`, `binding`), `planetTrajectory.ts` (`planetBinding`); rows 1 and 2 |
| `createStateResolver(..., moonData?)` passes it to every `create` | `stateResolver.ts`; stateResolver.test.ts and the 22 three-argument callers unchanged and green |
| `bindCatalogue` keeps binding through both extend functions | `assets/catalogue.ts` (`bindCatalogue`, `keepBinding`); not directly tested beyond rows 1-3 (extend path untested) |
| new tests rows 1-4, shown failing first | `tests/sceneMoonBinding.test.ts` (4 tests: Jupiter and Saturn table, scene/second-scene, unbound); first run failed (no `core/moonData.ts`), now 4 pass |
| layerRule green; existing tests green; sceneMoonIsolation still pinned | full run: 5040 passed, 4 expected fail (T-354 rows), layerRule green |
| gates | lint, typecheck, build pass; test: ONE failure, see Limitations |

Commands: `npm run lint`, `typecheck`, `build` pass; `npm test` 304/305 files, 5040 passed, 1 failed. Files changed: body.ts, moonData.ts (new), bodies/moonSystem.ts, bodies/planetTrajectory.ts, stateResolver.ts, assets/catalogue.ts, tests/sceneMoonBinding.test.ts (new).

Limitations: `packagePacks.test.ts` "plain example's first download within ENGINE_LIMIT" fails: 1,833,405 B raw vs cap 1,833,000 (+405 B). The cap in `packages/astraeus-site/tools/validate/engine-budget.mjs` is owner-raised by convention, so I did not change it; owner decision needed (raise rawLimit, or trim). Gzip within limit. No twoViewers flake seen.


## Drift Notes

None beyond the note below. Record for Design reconciliation (`Planet positions from Horizons`, `Every listed moon addable`): a state-source binding takes an optional scene moon data, `bindCatalogue` makes a scene's catalogue read only its own moon systems, and unbound catalogues keep the process-wide systems for core callers.

Coordinator (orchestrate-g024-20261121): lint, typecheck, build green; `npm test` 5040 passed with one red: `packagePacks.test.ts` engine first-download 1,833,405 B raw against the 1,833,000 cap (+405 B; gzip within). The cap is an owner decision (load-budget raises need the owner's OK), and G-024 decision 7 parks an Objective whose size budget goes red. This Task's own Done When is met, so the coordinator sets `status: done` (standing rule "I mark them as they pass", O-038, and decision 7) with the size red carried to the O-084 Full Objective Check, where it is measured again after T-358..T-360 and, if still red, O-084 is parked unmerged with measured options for the owner.
