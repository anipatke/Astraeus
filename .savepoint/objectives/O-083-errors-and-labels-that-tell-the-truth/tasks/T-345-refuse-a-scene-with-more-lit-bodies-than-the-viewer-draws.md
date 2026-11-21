---
id: T-345
title: Refuse a scene with more lit bodies than the viewer draws
objective: O-083
status: done
depends_on: [{task: T-344, requires: clear}]
check_waiver: {task: T-345, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T11:22:41Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: contract
planned_reads: [packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/TrackedBodyView.ts, packages/astraeus/src/app/LayeredRender.tsx, packages/astraeus/src/api/planBodies.ts, packages/astraeus/tests/bodyMarkers.test.ts]
planned_writes: [packages/astraeus/src/app/sceneFraming.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/README.md, packages/astraeus/api-surface.lock.json, packages/astraeus/tests/publicErrorContract.test.ts]
---

# Refuse a scene with more lit bodies than the viewer draws

## Outcome

A scene holding more lit spheres than the viewer's render layers allow (30 today) is refused at `check`/`mount` with a `SceneError`, instead of a raw `RangeError` thrown from `assignBodyLayers` during React render (AH-16; Gemini RND-07, CQ-03 item 5). The 30-body limit itself is unchanged (single-pass lighting is out of scope).

## User Check

None visual. A scene with 31 lit bodies throws `too-many-bodies` from `scene.check()` and `mount`; 30 lit bodies plus any number of marker bodies mount as before.

## Done When

- The limit is one exported constant (e.g. `MAX_LIT_BODIES` in `app/sceneFraming.ts`, derived from `MAX_LAYER`, the first body layer and the skipped overlay layer `TRACK_LAYER`), used both by `assignBodyLayers` and by the new check; no second copy of 30.
- `assembleScene` (the build that `check` and `mount` share) counts the bodies the viewer will give layers to (the same list and the same `visual.kind !== "marker"` rule `assignBodyLayers` uses) and throws `SceneError("too-many-bodies")` naming the count, the limit and the first body over it. Build faults throw at `mount`, per the lifecycle rule.
- `errors.ts` gains `too-many-bodies` with a doc comment (planner decision: a new code, since one code means one cause); README error table regenerated (`npm run api:errors`); lock regenerated (`npm run api:lock`), diff only in `SceneErrorCode`.
- `assignBodyLayers` keeps an internal guard, now unreachable from the public API.
- `tests/publicErrorContract.test.ts` gains rows: 31 lit bodies → `too-many-bodies` from `check()` and from `mount` (DOM test helper as in `tests/lifecycle.test.ts`), 30 lit bodies with extra marker bodies → no throw. Use a synthetic catalogue or built-in bodies, whichever reaches 31 lit spheres; record which. Show the 31-body row failing first (raw `RangeError`, or no throw at `check`).
- Existing tests unchanged and green, including `bodyMarkers` and `compositionsContract`.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/sceneFraming.ts` (around `assignBodyLayers`, `MAX_LAYER`, line ~140)
- `packages/astraeus/src/app/AstraeusScene.tsx` (line ~199, the caller and the body list it passes)
- `packages/astraeus/src/app/TrackedBodyView.ts` (`TRACK_LAYER`)
- `packages/astraeus/src/api/assembleScene.ts` (around `assembleScene`)
- `packages/astraeus/src/api/errors.ts`
- `packages/astraeus/README.md` under `Errors` (generated table)

## Design References

`.savepoint/Design.md` under `Decisions`: `Public API shape (G-016, owner 2026-11-01)` (lifecycle: build faults throw at `mount`).

## Guardrails

API-05, API-07, ARCH-04, STYLE-07, TEST-01..04.

## Implementation Plan

1. Find exactly which list reaches `assignBodyLayers` (definition bodies vs runtime bodies) and whether body sets or tracked paths take layers; write the failing rows.
2. Export the one limit; add the count check to `assembleScene`.
3. Add the code; regenerate table and lock.
4. Focused tests, then gates.

## Boundaries

No change to layering, lighting, or the limit's value; no change to marker bodies. Single-pass lighting stays out of scope (G-024 Boundaries).

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/publicErrorContract.test.ts packages/astraeus/tests/bodyMarkers.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/apiSurface.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

| Done When | Evidence |
|---|---|
| One exported limit | `MAX_LIT_BODIES` in `app/sceneFraming.ts`, derived from `MAX_LAYER`, `FIRST_BODY_LAYER`, `TRACK_LAYER`; `assignBodyLayers` message uses it; `litBodiesOf` is the shared lit rule. No second 30. |
| `assembleScene` throws `too-many-bodies` naming count, limit, first over | `tests/publicErrorContract.test.ts` "31 lit bodies -> too-many-bodies from check()" |
| mount throws it | `tests/tooManyBodiesMount.test.ts` (happy-dom; new file, because publicErrorContract runs without a DOM and mount needs one) |
| Code + doc, table, lock | `errors.ts` (after `bad-scale`); `npm run api:errors` (one new README row); `npm run api:lock` (diff only the SceneErrorCode signature line) |
| Internal guard kept | `assignBodyLayers` RangeError unchanged, comment says unreachable from the public API |
| 30 lit + markers no throw | same file, "30 lit bodies plus marker bodies do not throw" (5 elements bodies, which are markers) |
| Existing tests unchanged | full suite green incl. bodyMarkers, compositionsContract; only change to an existing test file: one entry added to the ALLOWED list in `tests/apiImports.test.ts` (new `app/sceneFraming` import from api) |

Lit bodies in the rows: the built-in catalogue has only 25 lit bodies and elements bodies are always markers, so the rows use jupiter, saturn, uranus, neptune plus listed moons (spheres) with data packages declared (`provides`). Failing-first: the check row first ran against the old code with no throw (31 elements bodies, which turned out markers; then 31 giants+moons before the change was not re-run after finalising rows because the code was already in); not shown as a clean RangeError.

Reads beyond Context Files: tests/publicErrorContract.test.ts, tests/apiImports.test.ts (add allowlist entry), src/assets/catalogue.ts (why elements bodies are markers).

Gates (flock): lint clean, typecheck clean, build ok, tests 299 files / 4997 passed, 2 skipped, 0 failed. Files: src/app/sceneFraming.ts, src/api/assembleScene.ts, src/api/errors.ts, README.md, api-surface.lock.json, tests/publicErrorContract.test.ts, tests/tooManyBodiesMount.test.ts (new), tests/apiImports.test.ts (allowlist). Limitation: no browser run.

## Drift Notes

Record for Design reconciliation: the lit-body limit is now a build-time `too-many-bodies` refusal.

Coordinator (orchestrate-g024-20261121): red-first shown by the coordinator: with HEAD's `api/assembleScene.ts` swapped in, "31 lit bodies -> too-many-bodies from check()" and "... from mount" fail (2 failed, 30 passed); with the change, 32 passed. Hand-off gates green (lint, typecheck, build; `npm test` 299 files, 4997 passed). The `apiImports` ALLOWED entry is that list's own mechanism, not a setup change. `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
