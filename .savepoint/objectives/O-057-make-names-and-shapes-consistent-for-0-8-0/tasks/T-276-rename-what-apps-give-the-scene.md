---
id: T-276
objective: O-057
title: Rename what apps give the scene
status: planned
depends_on: [{task: T-275, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o057-planning-20261107}
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

Pending execution: named cases, results, files read and changed, limitations.

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.
