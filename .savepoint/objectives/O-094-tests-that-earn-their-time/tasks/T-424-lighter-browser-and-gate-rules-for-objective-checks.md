---
id: T-424
title: Lighter browser and gate rules for Objective checks
objective: O-094
status: done
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

Builder session (orchestrated, 2026-11-22). Extra reads (not in Context Files): `agent-skills/savepoint-task/SKILL.md` (Read, Evidence And Handoff: builder rules 2); `packages/astraeus-site/tests/gateLimits.test.ts`, `browserExitPath.test.ts` (find the runner's tests, DW2); `packages/astraeus-site/tools/validate/runner.mjs` lines 138-205 (how `runSet` picks the total limit and evidence folder); `packages/astraeus-site/tools/validate/browser-steps.d.mts` and `tools/gate-limits.d.mts` (types of the planned files); `tools/api-surface.mjs` lines 1-25 (to name the public API surface signal); `agent-skills/references/check-full.md` lines 160-170 (coverage reading at a Full Check, for drift).

| Done When | Evidence |
|---|---|
| 1. Rules describe P01-P04 | `docs/agents/browser-policy.md` "Browser tiers": default `--tier quick --skip-examples`; Camera/Layout/Shaders/Sky/Packaging paths now trigger quick + `look-out`; `synthetic-journey`, `views`, `meteor-shower`, `catalogue` each listed with their triggering paths; hello-* only for packaging, `examples/`, `src/api/index.ts` or `api-surface.lock.json`; release runs full tier. `docs/agents/build.md`: Full gate (test:full at release/migration/owner ask; Full Check runs `npm test`), Engine-alone (release + engine imports/package.json/build config), Browser gate (additive `--step`, `--skip-examples`, limits), table row, health coverage line. `docs/agents/verification.md`: Full Check evidence is `quality_gates` with `npm test`; coverage, engine-alone, full browser tier at release. |
| 2. Runner: tier + steps, example skip, `--list`, old behaviour kept | `browser-steps.mjs` `selectSteps({ add, skipExamples })` (existing `steps` override kept), `run-browser.mjs` `--step` additive only when `--tier` is named, new `--skip-examples`. New `describe("tier plus added steps, and the example skip")` in `packages/astraeus-site/tests/gateLimits.test.ts`, cases through the real CLI `--list`: quick only; quick + look-out; quick + look-out + views; `--step` alone unchanged; example skip; full tier unchanged; plus selection, unknown added step. Red first: with HEAD's runner and step files copied back, 5 of the new cases fail (quick + look-out, + views, example skip, selection, limit); restored, all pass. Existing case "--step runs a named step whatever its tier" (steps win over tier in `selectSteps`) unchanged and green. |
| 3. Limits file and build.md in step | `tools/gate-limits.json` `browser.quickLookOutTotal: 280` (measured 124 + 72 = 196 s; about 1.4x); build.md row `check:browser -- --tier quick --step look-out` 280 s; new tests "the quick + look-out limit is stated..." and "docs/agents/build.md states the quick + look-out limit"; existing pairing tests pass. Each further added step adds its own step limit (`addedStepsLimit`). |
| 4. config.yml | Unchanged: `quality_gates` lists lint, typecheck, build, `npm test` only (no test:full, no engine-alone). |
| 5. One browser run | `flock ... npm run check:browser -- --tier quick --step look-out`: exit 0, 8 steps passed, summary total 198 s against limit 280 s (wall 198 s), evidence `docs/evidence/browser-quick-20261122T041912Z`. smoke 45, smoke-public-showers 5, planets-phone 9, look-out 70, hello-scene 16, hello-react 3, hello-planets 3, hello-sky 22 s. |

Commands (all under `flock /tmp/claude-1000/astraeus-gates.lock`): `npm run typecheck` (pass, after fixing two test typing errors); `node --require ./tools/lint/use-typescript6.cjs node_modules/eslint/bin/eslint.js packages/astraeus-site/tests/gateLimits.test.ts packages/astraeus-site/tools/validate/browser-steps.mjs packages/astraeus-site/tools/validate/browser-steps.d.mts packages/astraeus-site/tools/validate/run-browser.mjs` (clean); `npx prettier --check` on the same four files (clean); `npx vitest run packages/astraeus-site/tests/gateLimits.test.ts packages/astraeus-site/tests/browserExitPath.test.ts packages/astraeus-site/tests/workflowParity.test.ts` (3 files, 53 tests passed; gateLimits 23). No `npm run build` (no build tooling or entry point change).

Files changed: `docs/agents/browser-policy.md`, `docs/agents/build.md`, `docs/agents/verification.md`, `docs/BROWSER_CHECKS.md`, `tools/gate-limits.json`, `packages/astraeus-site/tools/validate/run-browser.mjs`, `packages/astraeus-site/tools/validate/browser-steps.mjs`, `packages/astraeus-site/tools/validate/browser-steps.d.mts` (not in planned_writes: the type companion of `browser-steps.mjs`, needed for typecheck of the new options), `packages/astraeus-site/tests/gateLimits.test.ts`. `.savepoint/config.yml` unchanged.

Choices: P02 is `--skip-examples` (smallest change; the quick tier keeps the hello-* steps so `--tier quick` alone and the release are unchanged). A quick run with added steps is passed to `runSet` as tier `quick` with `quickTotal` replaced by `addedStepsLimit` (runner.mjs not in planned_writes), so the summary's first line still reads `tier: quick` and the folder is `browser-quick-*`; `run-browser.mjs` prints `added steps: <names>` before it, and every step has its own line.

Limitations: the `added steps:` line is on the console only, not in `summary.txt` (the step lines there show which steps ran). Full `npm test`/`npm run lint` not run (coordinator's gate). The triggering paths per step were chosen from the step scripts and the proposal's risk text; the Check should review them.

## Drift Notes

- `.savepoint/Design.md` "Verification in tiers (O-086)" (line ~127, the `check:browser` flags: add the additive `--step` with `--tier` and `--skip-examples`; the Full Check browser choice now quick + look-out + path-triggered steps), the gate times paragraph (line ~284, add the quick + look-out limit 280 s), and the Code Health paragraph (line ~288: "`npm run test:full` refreshes coverage before an official Full Objective Check" is no longer true; coverage refreshes at release or on the owner's ask).
- `agent-skills/references/check-full.md` "Collect Code Health Evidence" step 1 says coverage health reads the reports the full gate wrote; under P04 a Full Check's `npm test` writes no coverage, so the snapshot's coverage is the last release's. Savepoint-managed file; not edited (for the coordinator / an upstream note).

## Coordinator (gates)

Combined gate with T-425 and T-426 reverted (owner dropped both): typecheck clean; `npm run lint` clean; `npm test` first run 328 files, 5428 passed, 5 failed, all in `viewerIds.test.ts` (screen ids; untouched by O-094) under load average ~11; the file alone passed 8/8 and a full rerun passed 328 files, 5433 passed, 2 skipped. Recorded as a load-sensitive flake, not an O-094 defect. Browser: the Task's one run of `--tier quick --step look-out` passed 8 steps in 198 s (`docs/evidence/browser-quick-20261122T041912Z`). Set done by the orchestrating session (owner: "I mark them as they pass", O-038; G-024 decision 7; owner 2026-11-22 "carry on, merge when clear").
