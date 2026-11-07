---
id: T-282
objective: O-060
title: Stop the fast tests repeating their setup
status: planned
depends_on: [{task: T-281, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o060-planning-20261107}
---

# Stop the fast tests repeating their setup

## Outcome

The fast tests share setup they repeat today, aiming for about 30 s for `npm test`, with the same number of tests.

## User Check

Compare the before and after times in the Task's evidence.

## Done When

The longest-running files that set the run's length are measured first on an idle machine. The compiler analysis in `tools/api-surface.mjs` and `tools/api-rules.mjs`, created separately by `apiRules`, `apiSurface`, `apiReference` and `migrationTable` tests, runs once per run or is shown not to matter. The package build in `packagePacks.test.ts` repeats no work that gives no extra protection. Other shared setup (`vitest.setup.ts`, Apollo `reconstruct` runs, showers data loads) is treated the same way where it shortens the run; the determinism proof that runs `reconstruct` twice stays. `npm test` and `test:full` run at least 3,282 passed tests, and coverage is not lower. `pastTheEntry` also catches a path given in parts, and the planted ring test uses a scratch folder rather than `astraeus-data-pluto/dist` (C-153 observations), each with a planted case. Every change is measured; one that does not shorten the run is reverted.

## Context Files

`.savepoint/objectives/O-060-make-the-checks-faster-with-the-same-protection/Objective.md`, `vitest.config.ts`, `packages/astraeus/vitest.setup.ts`, `tools/api-surface.mjs`, `tools/api-rules.mjs`, `packages/astraeus-site/tests/apiRules.test.ts`, `packages/astraeus-site/tests/apiSurface.test.ts`, `packages/astraeus-site/tests/apiReference.test.ts`, `packages/astraeus-site/tests/migrationTable.test.ts`, `packages/astraeus-site/tests/packagePacks.test.ts`, `tools/check-packs.mjs`, `packages/astraeus-demo-apollo11/tests/apollo11Reconstruction.test.ts`.

## Design References

`O-053 checks (Guardrails API-01 to API-07)`, `Current Technical State`.

## Guardrails

TEST-01, TEST-02, TEST-03, API-01, STYLE-05, STYLE-10.

## Implementation Plan

1. Measure which files set the run's length. 2. Share the compiler analysis. 3. Trim the pack build overlap. 4. Treat other setup by measured gain. 5. Make the two tidy-ups.

## Boundaries

No test removed or merged, no tolerance loosened, no change to what a test proves, no engine change. Each Vitest file runs isolated, so a shared step must be real, such as global setup, and a stale result must not pass: a change to the source must still fail the rule checks. About 30 s is an aim; report the measured result.

## Technical Verification

Focused tests while iterating; at hand-off the configured gates, `npm run test:full`, `npm run check:engine-alone` and `npm run check:pack`. No browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, before and after times, files read and changed, limitations.

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.
