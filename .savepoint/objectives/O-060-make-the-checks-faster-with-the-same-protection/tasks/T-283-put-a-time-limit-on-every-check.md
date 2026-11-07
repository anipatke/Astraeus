---
id: T-283
objective: O-060
title: Put a time limit on every check
status: planned
depends_on: [{task: T-282, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o060-planning-20261107}
---

# Put a time limit on every check

## Outcome

Every gate has a stated time limit that warns when passed, so slow growth is seen at once, and the gains are proved and written down.

## User Check

Read the before and after table in `docs/agents/build.md`, and see the warning line in a planted over-limit run.

## Done When

One file states each gate's time limit, set from the measured times with room for ordinary variation. `check:browser` reports each step against its limit in its summary; other gates are reported by one command that runs them and states time against limit. An overrun prints a warning and never changes the exit code, proved by a test with a planted limit. `docs/agents/build.md`, `docs/BROWSER_CHECKS.md` and Design state the new times and limits, and every drift note from this Objective is accounted for. Before and after timings for every gate, on an idle machine, are recorded. Full gates pass, with one `npm run check:browser` run.

## Context Files

`.savepoint/objectives/O-060-make-the-checks-faster-with-the-same-protection/Objective.md`, `docs/agents/build.md`, `docs/BROWSER_CHECKS.md`, `docs/agents/browser-policy.md`, `packages/astraeus-site/tools/validate/run-browser.mjs`, `package.json`, `.savepoint/config.yml`, `.savepoint/Design.md` under `Current Technical State`.

## Design References

`Current Technical State`.

## Guardrails

TEST-01, TEST-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Write the limits file. 2. Add the summary lines and the gate timing command. 3. Prove the warning. 4. Measure on an idle machine. 5. Update docs and Design. 6. Run the full gates once.

## Boundaries

A limit never fails a run on time alone. No test removed. No change to `quality_gates` commands unless needed to report time.

## Technical Verification

`npm run test:full`, `npm run check:engine-alone`, `npm run check:pack`, `npm run check:node-consumer`, `npm run check:react-consumer`, then one `npm run check:browser`; the Full Objective Check reuses that run unless code changes after it. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, timing table, files read and changed, limitations.

## Drift Notes

Reconcile this Objective's drift notes in Design before the Full Objective Check.
