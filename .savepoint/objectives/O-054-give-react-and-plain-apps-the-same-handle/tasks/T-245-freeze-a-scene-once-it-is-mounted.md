---
id: T-245
title: Freeze a scene once it is mounted
objective: O-054
status: done
depends_on: [{task: T-244, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-245, reason: 'Owner said "Mark it done and orchestrate the next one" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o054-run-20261101}, recorded_at: '2026-11-01T09:01:31Z'}
planned_by: {role: planner, session: o054-planning-20261101}
---

# Freeze a scene once it is mounted

## Outcome

A `Scene` handed to `mount` or `AstraeusScene` is frozen: later `add*`, `set*` and `scene.camera` edits throw a new `scene-mounted` code instead of being silently ignored, while reads keep working and the same scene can be mounted again (O-054 Success Condition 5; review F8).

## User Check

Not owner-facing: the change shows only to a host page's code and its tests. The owner sees the result at the end of the Objective.

## Done When

- New `SceneErrorCode` `scene-mounted` (name per the O-054 planned decisions; doc comment: the scene was edited after a viewer took it; build a new scene instead).
- `prepareScene` (`src/api/prepared.ts`) marks the scene mounted once its definition is built (a build fault leaves it editable); `toDefinition` called on its own does not freeze.
- A table-driven named test enumerates every method of `Scene.prototype` and `SceneCamera.prototype` whose name starts with `add`, `set`, `follow`, `lookAt` or `fitOrbit`, so a future mutator cannot escape, and expects `scene-mounted` from each after `mount`; `stateOf`, `provenanceOf`, `missingData` and the camera getters still answer.
- The same frozen scene mounts into a second element and draws (named test; supports D9 several viewers).
- The `it.todo` "a mounted scene is frozen" in `lifecycle.test.ts` is a real case on both paths (React: after `onReady`).
- No in-repo caller edits a scene after mounting it: grep of `packages/*demo*`, `packages/astraeus-site` and `examples/` recorded; `npm test` passes without loosening any test.
- **Surface recorded:** `npm run api:lock` regenerated `packages/astraeus/api-surface.lock.json`, the README error table regenerated with `npm run api:errors` (the new code has a doc comment in `errors.ts`); `packages/astraeus/CHANGELOG.md` Unreleased has one entry for this step ending in a one-line migration note for app makers (what to change in an app built on 0.7.0); `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/planCamera.ts`, `packages/astraeus/src/api/prepared.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/tests/scenePin.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-054 Objective under `Success Conditions` and `Architectural Considerations` (planned decisions); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F8).

## Guardrails

API-01, API-02, API-05, TEST-01, TEST-03, CODE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Add the code; add one private guard on `Scene` and pass it to `SceneCamera` (the camera already takes callbacks), called first in every mutator.
3. Freeze in `prepareScene` after a successful build.
4. Write the table-driven test, the mount-twice test and the lifecycle case; check the pin still passes without `-u`.
5. `npm run api:errors`, `npm run api:lock`, CHANGELOG (migration: build a new `Scene` instead of editing one already mounted; such edits now throw `scene-mounted`), O-053 tests, gates.

## Boundaries

Freeze only. No change to what a scene builds; `toDefinition` stays until O-057.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Changed: packages/astraeus/src/api/sceneFreeze.ts (new, WeakSet markMounted/isMounted; keeps the freeze off the public surface), scene.ts (private #editable guard first in the 12 mutators, passed to the camera), planCamera.ts (guard in #open/setReach/fitOrbit), prepared.ts (markMounted after a successful toDefinition), errors.ts (scene-mounted), tests/lifecycle.test.ts, README error table, api-surface.lock.json, CHANGELOG Unreleased.
Tests (tests/lifecycle.test.ts): "a mounted scene is frozen" on both paths (mount, AstraeusScene; edit after ready/onReady throws scene-mounted, failed empty build stays editable, reads answer, edit after unmount still throws); table test enumerating Scene.prototype and SceneCamera.prototype by name (add/set/follow/lookAt/fitOrbit) expecting scene-mounted after mount, reads and camera getters still answer; toDefinition alone does not freeze; same scene mounts into a second element and both draw.
Pins: scenePin.test.ts and viewerLinkPin.test.ts pass unchanged, no entry changed.
Callers: grep of packages/astraeus-demo-*, astraeus-site, examples: all edits to scenes precede mount (examples/hello-scene/src/main.js, hello-react/src/main.jsx); no edit after mount.
Gates: npm run lint, typecheck, build pass; npm test 2305 passed, 1 skipped, 6 todo (T-246..T-248 placeholders); npm run check:react-consumer pass; api:lock and api:errors regenerated. No browser run.

## Drift Notes

Drift (T-249): Design.md should note the scene freeze (scene-mounted; WeakSet in sceneFreeze.ts, guard in Scene/SceneCamera mutators, set by prepareScene). Not yet reflected in Design.md.
