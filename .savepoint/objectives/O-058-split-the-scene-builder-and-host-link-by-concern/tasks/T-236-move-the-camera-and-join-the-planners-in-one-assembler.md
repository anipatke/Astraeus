---
id: T-236
title: Move the camera and join the planners in one assembler
objective: O-058
status: done
depends_on: [{task: T-235, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-236, reason: 'Owner said "Orchestrate the next one" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o058-run-20261101}, recorded_at: '2026-11-01T07:22:24Z'}
planned_by: {role: planner, session: o058-planning-20261101}
---

# Move the camera and join the planners in one assembler

## Outcome

`SceneCamera` and the camera planning live in `packages/astraeus/src/api/planCamera.ts`, and one assembler in `packages/astraeus/src/api/assembleScene.ts` builds the definition and its `prepare` from the planners; `scene.ts` is the public front only (O-058 Success Condition 2, camera and assembler).

## User Check

Not owner-facing: an internal refactor with no change a host or visitor can see. The owner sees the result at the end of the Objective.

## Done When

- `planCamera.ts` holds the `SceneCamera` class (same public members and doc comments, so the lock and the API reference do not change), `cameraPresetsOf`, `viewEntries`, `#fitFarthestKm` and the start-view and start-preset entries; `scene.ts` re-exports `SceneCamera` so `index.ts` is unchanged.
- `assembleScene.ts` holds the body of `toDefinition` (same order of checks and fields), the planet-series read guard (`#planetSpanError`, `#checkPlanetSpan`, `#planetRead`, `#deferredRead`), the scale choices (`scaleChoicesOf`) and `prepare`. `Scene.toDefinition` is one call to it.
- `scene.ts` holds only the imports, the public input types (with `TrajectoryBase`), the `Scene` class (constructor, public methods delegating, `#taken`, `#sceneCentre`, and `stateOf`/`provenanceOf` with `#catalogueSource` and `#sunState`) and the type re-exports; no top-level function; under 450 lines (`wc -l`). Every module of the split is at most 300 lines.
- `packages/astraeus/src/api/` imports from `app/` and `shell/` only in the planners and assembler that build definition parts, not in `scene.ts` beyond types (recorded with `grep -n "\.\./\(app\|shell\)/" packages/astraeus/src/api/*.ts`).
- **Nothing public moved:** `git diff --exit-code main -- packages/astraeus/api-surface.lock.json packages/astraeus-site/tests/` is empty (lock, every O-053 allowlist and `DEEP_IMPORT_COUNTS` unchanged), and `git diff --name-only --diff-filter=M main -- '*.test.ts' '*.test.tsx'` is empty (no existing test edited). `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Same output:** `npx vitest run packages/astraeus/tests/scenePin.test.ts` passes without `-u`, and `git status` shows `packages/astraeus/tests/fixtures/scenePin.json` unmodified.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/planPaths.ts`, `packages/astraeus/src/api/planBodies.ts`, `packages/astraeus/src/api/planGroups.ts`, `packages/astraeus/src/api/planStory.ts`, `packages/astraeus/src/api/planTimeline.ts`, `packages/astraeus/src/api/planViews.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/tests/scenePin.test.ts`, `packages/astraeus/tests/sceneCamera.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-058 Objective under `Architectural Considerations` (planned module layout).

## Guardrails

API-01, API-05, ARCH-06, TEST-03, CODE-01, STYLE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Move code as-is: same function bodies, same `SceneError` codes and message text, same order of checks and of definition fields. No new public member on `Scene` or `SceneCamera` (the lock records them); planners take what they need as arguments or through internal objects. Public input types, `TrajectoryBase` and `stateOf` stay in `scene.ts` (O-053 allowlist entries are keyed to that file). New modules sit flat in `packages/astraeus/src/api/` so the O-053 scans read them. No CHANGELOG entry.
3. Move `SceneCamera` and the camera entries; then lift `toDefinition`'s body and the planet-read guard into the assembler, taking the planners as one internal input.
4. Run the pin, the O-053 tests (the API reference and README checks too) and the gates.

## Boundaries

No behaviour, message or public change; `toDefinition` stays public with the same signature (its removal is a later Objective).

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Changed: `packages/astraeus/src/api/scene.ts` (589 -> 350 lines), new `planCamera.ts` (124) and `assembleScene.ts` (173). Moved code as-is; `toDefinition` is one call to `assembleScene(ScenePlanners, data)`; `ScenePlanners` is an internal interface, not exported from `index.ts`. `scene.ts` re-exports `SceneCamera`.
- planCamera.ts holds SceneCamera, cameraPresetsOf, viewEntries, fitFarthestKm (was `#fitFarthestKm`), startPresetEntry, startViewEntry: read in file.
- assembleScene.ts holds the toDefinition body, planetSpanError/checkPlanetSpan/planetRead/deferredRead, scaleChoicesOf, prepare: read in file.
- `wc -l`: scene.ts 350 (< 450); largest api module 350 is scene.ts, every split module <= 245 (<= 300 for the new ones).
- `grep -n "\.\./\(app\|shell\)/" packages/astraeus/src/api/*.ts`: scene.ts has none; assembleScene.ts imports bodyMetrics, planetNeeds, trackedMetrics (value) from app/, others type-only.
- `git diff --exit-code main -- packages/astraeus/api-surface.lock.json packages/astraeus-site/tests/`: empty; `git diff --name-only --diff-filter=M main -- '*.test.ts' '*.test.tsx'`: empty.
- `npx vitest run` scenePin + apiSurface + apiRules + allowlistGrowth + packageBoundaries: 5 files, 41 tests passed; scenePin.json unmodified (git status).
- Gates: `npm run lint` clean, `npm run typecheck` clean, `npm run build` built, `npm test` 184 files, 2240 passed, 1 skipped. No browser run.

## Drift Notes

For T-239 (Design.md reconciliation): new internal modules `planCamera.ts` (SceneCamera, camera entries, fit distance) and `assembleScene.ts` (definition assembler, planet-read guard, scale choices, prepare) with the internal `ScenePlanners` interface; `scene.ts` is now the public front only. `planCamera.ts` imports the `FollowView` type from `scene.ts` (type-only cycle). `scene.ts` keeps a top-level `SCALES` constant (not a function) for `setScale` validation.
