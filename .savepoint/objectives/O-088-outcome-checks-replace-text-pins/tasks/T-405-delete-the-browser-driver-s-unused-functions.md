---
id: T-405
title: Delete the browser driver's unused functions
objective: O-088
status: planned
depends_on: [{task: T-404, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-405, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:56:58Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: browser
planned_reads: [packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/check-hello-planets.mjs, packages/astraeus-site/tools/validate/check-hello-scene.mjs, packages/astraeus-site/tools/validate/check-hello-sky.mjs, packages/astraeus-site/tools/validate/journey-catalogue.mjs, packages/astraeus-site/tools/validate/journey-look-out.mjs, packages/astraeus-site/tools/validate/journey-meteor-shower.mjs, packages/astraeus-site/tools/validate/journey-planets-phone.mjs, packages/astraeus-site/tools/validate/journey-views.mjs, packages/astraeus-site/tools/validate/harness.mjs, packages/astraeus-site/tools/validate/driver-guard.mjs, packages/astraeus-site/tests/browserDriverGuard.test.ts, packages/astraeus-site/tests/browserDriverPhoneBar.test.ts, packages/astraeus-site/tests/browserDriverScale.test.ts, packages/astraeus-site/tests/driverNoIds.test.ts, packages/astraeus-site/tests/browserDrawnControl.test.ts, docs/agents/browser-policy.md]
planned_writes: [packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/driver.d.mts, docs/BROWSER_CHECKS.md]
---

# Delete the browser driver's unused functions

## Outcome

`tools/validate/driver.mjs` keeps only the functions some browser script, test or kept driver function reaches; the rest (about 225 of 408 exports, about 1,000 lines at 0.9.5: Claude S7, Gemini S-03) are deleted, and one clean browser run shows nothing a script needs was lost (AH-33; Objective success condition 2).

## User Check

None visual. One `check:browser` run (the full tier if O-086 has split them) passes; the driver is about half its size.

## Done When

- A reachability list is built mechanically and recorded in Technical Evidence: roots are every `ui.<name>` / named import from `driver.mjs` in `tools/validate/*.mjs` (except `driver.mjs`) and in `packages/astraeus-site/tests/**`; reached = roots plus every driver function a reached function calls, repeated until stable (a TypeScript 6 syntax walk or an equivalent script; grep alone is not enough for internal calls). The list gives counts before/after and names each deleted export.
- Every unreached export and any non-exported helper only they used is deleted from `driver.mjs`; `driver.d.mts` loses the same declarations. `HOOK` entries no kept function uses are deleted.
- `docs/BROWSER_CHECKS.md` "The interface driver" table lists only kept functions; the O-041 paragraph naming earlier removals stays as history.
- `npm run lint`, `npm run typecheck` (the `.d.mts` is checked) and the driver tests (`browserDriverGuard`, `browserDriverPhoneBar`, `browserDriverScale`, `driverNoIds`, `browserDrawnControl`) pass.
- One clean browser run: `npm run check:browser` (the full tier when O-086 has added tiers, since the driver serves every step), run once, alone on the machine (no other browser job), evidence folder per `docs/agents/browser-policy.md`. Exit 0, no console-error lines. A step failure caused by a deleted function is fixed by restoring that function (and recording why the reachability walk missed it), never by changing a script's assertion.
- No behaviour change in any kept function (deletions only; record `git diff --stat`).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-site/tools/validate/driver.mjs` (whole file: the deletion subject)
- `packages/astraeus-site/tools/validate/driver.d.mts`
- `docs/BROWSER_CHECKS.md` under `The interface driver (...)`
- `docs/agents/browser-policy.md` (whole, short; run rules)
- The scripts and tests in `planned_reads` are read only by the reachability script, not by eye.

## Design References

`docs/BROWSER_CHECKS.md` under `The interface driver (...)`.

## Guardrails

TEST-01, TEST-03, STYLE-05, STYLE-10.

## Implementation Plan

1. Write the reachability walk as a scratch script (not committed); run it; save the list.
2. Delete unreached exports and orphaned helpers; prune the `.d.mts` and `HOOK`.
3. Lint, typecheck, driver tests.
4. One browser run; record path, command, time, result.
5. Update the driver table in `BROWSER_CHECKS.md`.

## Boundaries

Deletions only in the driver; no script, runner or harness change. Do not fix `developerOpen` or other driver behaviour (O-086 owns step speed). One browser run; if it fails for a reason unrelated to this Task (flake, environment), record it and rerun once; a second unrelated failure stops the Task and is reported.

## Technical Verification

Focused: the driver tests above. Then `quality_gates`. Then one `npm run check:browser` (full tier), alone.

## Technical Evidence

Pending execution.

## Drift Notes

None expected; if the full-tier run takes notably less time, note it for the planner (gate limits are O-086's).
