---
id: T-424
title: Lighter browser and gate rules for Objective checks
objective: O-094
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-424, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on, merge when clear" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T04:12:54Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
planned_writes: [docs/agents/browser-policy.md, docs/agents/build.md, docs/agents/verification.md, packages/astraeus-site/tools/validate/run-browser.mjs, packages/astraeus-site/tools/validate/browser-steps.mjs, docs/BROWSER_CHECKS.md, tools/gate-limits.json, .savepoint/config.yml]
---

# Lighter browser and gate rules for Objective checks

## Outcome

The owner's ticked rule cuts P01-P04 (docs/evidence/test-cost/proposals.json; Objective Decisions) are the project's rules:

- **P01:** where a Full Objective Check needs more than the quick browser tier (camera, layout, shaders, sky, packaging paths in browser-policy "Browser tiers"), it runs the quick tier plus the look-out step, and adds synthetic-journey, views, meteor-shower or catalogue only when the diff touches that step's own paths (named per step in the policy). A release still runs the full tier.
- **P02:** the four packed example steps (hello-scene, hello-react, hello-planets, hello-sky) run in a Full Check only when packaging, `examples/` or the public API surface change, and always at release (publish.yml already runs them).
- **P03:** `check:engine-alone` runs at release and when the engine's imports, `package.json` or build config change, not at every Full Check.
- **P04:** a Full Check runs `npm test` instead of `npm run test:full`; coverage is measured at release or on the owner's ask.

One command expresses P01: `npm run check:browser -- --tier quick --step look-out [--step <name>]...` runs the quick tier plus the named extra steps in one run with one evidence folder (today `--step` replaces the tier; make it additive when a tier is also named, keeping `--step` alone as today). Where the quick tier already contains the hello-* steps, P02 needs a way to leave them out (for example `--skip-examples`, or a quick tier without them plus `--step` to add them); choose the smallest change and record it.

## User Check

None (rules and runner only).

## Done When

1. browser-policy.md "Browser tiers", build.md (Full gate, Engine-alone gate, Browser gate and the gate time table) and verification.md describe P01-P04 exactly, with each extra step's triggering paths named, and say the release keeps the full tier, engine-alone and coverage. No other rule changes.
2. The runner accepts tier + extra steps in one run, and the example-skip of P02; `--list` shows the result; existing `--tier` and `--step`-only behaviour unchanged. Named cases in the runner's existing test file(s) (find by name: tests that cover run-browser/browser-steps argument parsing) prove: quick only; quick + look-out; quick + look-out + views; `--step` alone unchanged; example skip.
3. `tools/gate-limits.json` and build.md stay in step (the test that pairs them passes); a quick+look-out browser limit is stated (measured quick 124 s + look-out 72 s; leave room as the file's "about" says).
4. `.savepoint/config.yml` `quality_gates` changed only if it lists test:full or engine-alone as an every-Check gate.
5. Run the affected browser steps once to prove the new command works: `npm run check:browser -- --tier quick --step look-out` (one run; this is the runner change's own step run per browser policy). Record its evidence folder and total time.

## Context Files

`docs/evidence/test-cost/proposals.json` (P01-P04), `docs/evidence/test-cost/report.md`, `docs/agents/browser-policy.md`, `docs/agents/build.md`, `docs/agents/verification.md`, `packages/astraeus-site/tools/validate/run-browser.mjs`, `packages/astraeus-site/tools/validate/browser-steps.mjs`, `tools/gate-limits.json`, `.savepoint/config.yml`, `.github/workflows/publish.yml`, `docs/BROWSER_CHECKS.md`.

## Design References

None beyond the policy files.

## Guardrails

TEST-01, TEST-03.

## Implementation Plan

1. Read the runner's argument parsing and tier lists; make `--step` additive when `--tier` is given; add the example skip.
2. Add the named test cases to the existing runner test file.
3. Edit the three rule docs and BROWSER_CHECKS.md map if it names tiers per step.
4. Update gate-limits.json + build.md table together.
5. One browser run of the new command.

## Boundaries

Only P01-P04. No change to which steps exist, to any step's assertions, to publish.yml, or to `.savepoint/health/config.json` (owner-only).

## Technical Verification

Focused gates per builder rules; the coordinator's combined gate; the Full Objective Check uses the new rules and measures the time target.

## Technical Evidence

Pending execution.

## Drift Notes

Design.md verification/tooling paragraphs that name test:full or the browser tiers, for the coordinator's reconciliation.
