---
id: T-274
objective: O-057
title: Take the scene's internal output off the public API
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o057-planning-20261107}
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

Pending execution: named cases, results, files read and changed, limitations.

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.
