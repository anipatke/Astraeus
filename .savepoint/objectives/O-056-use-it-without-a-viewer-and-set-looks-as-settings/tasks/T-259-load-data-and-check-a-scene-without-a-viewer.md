---
id: T-259
title: Load data and check a scene without a viewer
objective: O-056
status: planned
depends_on: []
owner_validation: {required: false}
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

Pending execution.

## Drift Notes

Record architecture deltas here; T-264 reconciles them into Design.md.
