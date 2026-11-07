---
id: T-276
objective: O-057
title: Rename what apps give the scene
status: done
depends_on: [{task: T-275, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o057-planning-20261107}
check_waiver: {task: T-276, reason: 'Owner said "orchestrate O-57" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o057-run-20261107}, recorded_at: '2026-11-06T23:00:37Z'}
---

# Rename what apps give the scene

## Outcome

Everything a caller passes in follows API-04 under its new name, and a plain JavaScript caller using an old input name gets a `SceneError` naming the replacement.

## User Check

Read the new names in the README tables; a test passes each old name and sees the replacement named.

## Done When

`MoonPositions.center` with a typed `loadIndex` in the engine and all six data packages; pacing `{ start, end, rate, rampSeconds }` and `{ near: { type, withinSeconds }, rate, rampSeconds }`; `camera.focus` for `camera.lookAt`; view `objects` for `paths` and `bodies`, with the view read matching; `labelReachEarthRadii`; `setReach` and `camera.reachEarthRadii`; `plane` required on `addGroup` (else `bad-group`). A new `renamed` code (one cause, documented, README table regenerated) and one old-to-new table in `src/api/` read by each receiving call, with a table-driven test that needs a row per rename, proved on made-up scenes. All demos, examples, the site and tests are moved over; the matching lint entries are removed.

## Context Files

`.savepoint/objectives/O-057-make-names-and-shapes-consistent-for-0-8-0/Objective.md`, `packages/astraeus/src/api/data.ts`, `packages/astraeus/src/api/story.ts`, `packages/astraeus/src/api/views.ts`, `packages/astraeus/src/api/planCamera.ts`, `packages/astraeus/src/api/group.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/errors.ts`, `tools/api-rules.mjs`, `packages/astraeus-site/tests/apiTypeLint.allowlist.json`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-04, API-05, API-07, ARCH-03, ARCH-06, TEST-01, TEST-02.

## Implementation Plan

1. Add the `renamed` code and table. 2. Rename one family at a time (moon data, pacing, camera, views, reach, group plane), each with its table rows, callers and lint entries. 3. Regenerate the lock and error table.

## Boundaries

No alias: the old name never works. Internal names stay unless they surface. `CameraPose.distance` stays. If a lint entry cannot honestly be renamed, stop and ask; no new exception without the owner.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the last step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built by the T-276 builder session (no commit, no Check). Extra reads beyond Context Files: none beyond callers found by search (tests, demos, site, examples, `tools/check-node-consumer.mjs`, README, CHANGELOG, `planBodies.ts`, `planPaths.ts`, `planGroups.ts`, `assembleScene.ts`, `planViews.ts`, `sceneReads.ts`, reason: the callers and receiving calls of each renamed input).

Gates (fresh, after the last edit): `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 228 files, 3068 passed, 2 skipped; `npm run check:engine-alone` pass; `npm run check:pack` pass; `npm run check:node-consumer` pass; `npm run check:react-consumer` pass. `npm run api:lock` and `npm run api:errors` regenerated (lock and the README error table). No browser script run.

| Done When | Test (file, case) |
|---|---|
| `MoonPositions.center`, typed `loadIndex` (`MoonIndex`) in the engine and six data packages | `packages/astraeus/tests/renamedInputs.test.ts` "MoonPositions.centre: the old name alone throws renamed..."; typed by `npm run typecheck` over `packages/astraeus-data-*/src/index.ts`; `packages/astraeus-site/tests/apiRules.test.ts` type lint (no `centre` or `loose` MoonPositions break); `packages/astraeus/tests/dataSpans.test.ts`, `moonLoadTwice.test.ts`, `listedMoonBodies.test.ts` (made-up data with `center`) |
| Pacing `{ start, end, rate, rampSeconds }` and `{ near: { type, withinSeconds }, rate, rampSeconds }` | `renamedInputs.test.ts` "PacingSpan.from / .to / .ramp", "PacingRule.ramp", "PacingNear.within"; new names accepted: "accepts the new names..."; `packages/astraeus/tests/pacing.test.ts` "refuses a bad rate, ramp, within, span or shape" (same assertions on the new names); `pacingViews.test.ts`, `eventZonesDom.test.ts` |
| `camera.focus` for `camera.lookAt` | `packages/astraeus/tests/publicApiStory.test.ts` "lets the last of follow and focus win", "refuses an object not in the scene"; `publicApiOpeningSelection.test.ts` "focus on a path/body"; `lifecycle.test.ts` "every add, set, follow, focus and fitOrbit method ... throws scene-mounted after mount" (method list); a removed method needs no table row |
| View `objects` for `paths` and `bodies`, view read matching | `renamedInputs.test.ts` "ViewInput.paths", "ViewInput.bodies"; `packages/astraeus/tests/sceneViews.test.ts` "refuses %s when the scene is built" (an unknown object, an unknown body), "takes a body and a path in the one list", "shows anything no view names in every view...", "ids that are not a list"; `viewsDom.test.ts`; `sceneReads.test.ts` (views read) |
| `labelReachEarthRadii`; `camera.reachEarthRadii`; `setReach` keeps its call | `renamedInputs.test.ts` "AddBodyOptions.labelReach", "TrajectoryInput.labelReach"; `publicApiPathLabels.test.ts` "takes its own labelReach in place of the shared rule", "refuses a bad labelReach naming the field"; `lifecycle.test.ts` (`scene.camera.reachEarthRadii` undefined before `setReach`); `packages/astraeus-demo-planets/tests/planetScene.test.ts` and `planetViews.test.ts` (reach read); `packages/astraeus-site/tests/syntheticScenes.test.ts` |
| `plane` required on `addGroup` (else `bad-group`) | `packages/astraeus/tests/publicApiGroup.test.ts` "refuses ..." case with `plane` undefined, "ecliptic", 5 giving `bad-group`; both valid planes accepted; `scenePin.test.ts` group cases (all given `plane`) |
| `renamed` code, one table in `src/api/` read by each receiving call | `renamedInputs.test.ts` "has a row for every driver and a driver for every row", "is read by a call for every scope in the table", "has one row per old name and scope..."; `packages/astraeus-site/tests/apiRules.test.ts` error-code documentation checks (README table in step with `errors.ts`) |
| Table-driven test: a row per rename, old name alone, made-up scenes | `renamedInputs.test.ts` the `it.each` cases "<scope>.<old>: the old name alone throws renamed and names its replacement" (10 rows) and "...the new name beside the old one is still refused" (10 rows) |
| Demos, examples, site and tests moved; matching lint entries removed | `npm run typecheck`; `packages/astraeus-site/tests/apiRules.test.ts` "names today's breaks" and the stale-entry check (eight entries removed: `MoonPositions.centre`, `MoonPositions.loadIndex`, `PacingInput: from/to`, `PacingInput.near.within`, `PacingInput.ramp`, `AddBodyOptions.labelReach`, `TrajectoryBase.labelReach`, `SceneCamera.reach`); `demoRules.test.ts`, `demoScenes.test.ts`, `syntheticScenes.test.ts`; `npm run check:node-consumer`, `npm run check:react-consumer`; `DEEP_IMPORT_COUNTS` unchanged (apiIsolation tests pass) |

Limitations: no browser run (by instruction); browser scripts under `packages/astraeus-site/tools/validate/` hold no old input names (their `bodies` in `journey-views.mjs` is an expected-result field, not a scene input). `packages/astraeus/tests/fixtures/scenePin.json` was rewritten with `-u` after reading the diff: only renamed pin keys and the messages of renamed fields changed, no definition data.

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.

- `MoonIndex` (new root type) has every field optional: the engine checks the whole index when it loads, and a made-up test index (`{}`) must stay typable. A stricter shape would be a Design choice for T-280/Design.
- A view's `objects` merges two id spaces; a body listed where a path was once required no longer errors. The old "a body given as a path" refusal row in `sceneViews.test.ts` became a positive case.
- `renamed` rows carry a `call` field for the table's readers; the message does not use it. Group `plane` has no table row (a requirement, not a rename).
