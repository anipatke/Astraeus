---
id: T-281
objective: O-060
title: Cut the browser check's waiting
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o060-planning-20261107}
---

# Cut the browser check's waiting

## Outcome

`npm run check:browser` runs in 180 s or less on an idle machine, with every assertion it had kept.

## User Check

Read the run summary: the total is 180 s or less and every step passed.

## Done When

A committed list holds every browser assertion at baseline commit 6aad8e6a (each error a check can raise, by script), and a test fails if one goes missing, shown by a planted case. Fixed waits in the `synthetic-journey` checks are replaced by waits on the condition they stood for, read through `driver.mjs`; a fixed wait that stays has a comment saying why. The same applies to `views` and other steps if needed to reach the target. The two `synthetic-journey` sizes run side by side inside the one job only if three runs in a row pass; otherwise they stay in sequence and the Task says why. Three consecutive runs pass, with times recorded. `npm run check:browser` is 180 s or less on an idle machine.

## Context Files

`.savepoint/objectives/O-060-make-the-checks-faster-with-the-same-protection/Objective.md`, `packages/astraeus-site/tools/validate/browser-smoke.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `packages/astraeus-site/tools/validate/harness.mjs`, `packages/astraeus-site/tools/validate/run-browser.mjs`, `packages/astraeus-site/tools/validate/journey-views.mjs`, `docs/BROWSER_CHECKS.md`, `docs/agents/browser-policy.md`.

## Design References

`Current Technical State`.

## Guardrails

TEST-01, TEST-02, TEST-03, STYLE-10.

## Implementation Plan

1. Write the assertion list and its test first. 2. Time each stage of the journey checks. 3. Replace waits, largest first. 4. Try side-by-side sizes. 5. Run three times.

## Boundaries

No assertion removed, no tolerance loosened, no view dropped, no engine change, no screenshots. If 180 s cannot be reached with the same protection, stop and report the measured time and what is left. This Task may run the browser check repeatedly because it changes the browser scripts; one run at a time.

## Technical Verification

Focused runs of the changed scripts, then three `npm run check:browser` runs; hand-off gates from `.savepoint/config.yml`. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, per-step times, files read and changed, limitations.

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.
