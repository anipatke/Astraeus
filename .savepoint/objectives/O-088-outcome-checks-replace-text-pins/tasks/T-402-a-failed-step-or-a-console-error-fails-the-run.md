---
id: T-402
title: A failed step or a console error fails the run
objective: O-088
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-402, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:56:58Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: browser
planned_reads: [packages/astraeus-site/tools/validate/harness.mjs, packages/astraeus-site/tools/validate/runner.mjs, packages/astraeus-site/tools/validate/run-browser.mjs, packages/astraeus-site/tests/fixtures/browser-exit/throws-through-harness.mjs, packages/astraeus-site/tests/fixtures/browser-exit/exits-three.mjs, docs/agents/browser-policy.md]
planned_writes: [packages/astraeus-site/tests/browserExitPath.test.ts, packages/astraeus-site/tests/fixtures/browser-exit/console-error-through-harness.mjs, packages/astraeus-site/tests/fixtures/browser-exit/exits-zero-logs-console-error.mjs, packages/astraeus-site/tests/fixtures/browser-exit/stub-runner.mjs, packages/astraeus-site/tests/fixtures/browser-exit/stub-runner-hook.mjs]
---

# A failed step or a console error fails the run

## Outcome

Two of the three outcome negative controls O-088 needs before any text pin is retired are proved by running the real browser tooling, not by reading its text (AH-33; OpenAI F07 "test nonzero exit, console error and zero visible dots"):

- a browser step that fails makes `run-browser.mjs` (the `npm run check:browser` entry) exit non-zero;
- a console error on a page fails the step, both inside the harness (exit 1) and in the runner (a step that exits 0 but logged a console error still fails the run).

The one text pin in `browserExitPath.test.ts` (the regex on `run-browser.mjs`'s `process.exitCode = await runSet(...)` line) is replaced by an outcome.

## User Check

None visual. `npx vitest run packages/astraeus-site/tests/browserExitPath.test.ts` passes, and each new case fails when its planted break is applied (Technical Evidence).

## Done When

- **Harness, console error:** a new fixture step `console-error-through-harness.mjs` opens one blank page through the real `checkScript` (`tools/validate/harness.mjs`) and calls `console.error(...)` inside the page, throwing nothing. The test asserts exit status 1, `"ok": false` and the console text in `errors`. The existing `passes-through-harness.mjs` case stays the passing twin. Skipped only where Playwright reports the browser missing, as the existing harness case is.
- **Runner, console error line:** a new fixture `exits-zero-logs-console-error.mjs` exits 0 after printing a line the runner counts as an error (`runner.mjs` `ERROR_LINE`, ~28). Through the existing `runSetWith` helper, the run's result is 1, the summary line shows `exit=0` with `error-lines=1` (or more), and stderr says `FAILED`.
- **run-browser.mjs, exit code:** the regex case at `browserExitPath.test.ts` ~109 is gone. In its place the real `run-browser.mjs` runs with `./runner.mjs` swapped for a stub through a Node module hook (`node --import <stub-runner-hook.mjs> run-browser.mjs`, the hook's `resolve` sending `runner.mjs` to `stub-runner.mjs`, whose `runSet` resolves to the number in an environment variable). Status is 1 when the stub returns 1 and 0 when it returns 0. No production file changes for this: no step-list or env hook is added to `run-browser.mjs`.
- O-086 draft 07 moves the step list to `browser-steps.mjs` and gives `run-browser.mjs` `--tier quick|full`, `--step` and `--list`, and `runSet` a tier. The stub `runSet` accepts any arguments; run the real `run-browser.mjs` with `--tier quick` (and once with the default) so argument parsing is exercised. If O-086 already replaced the regex with an outcome, keep theirs and record it. An unknown tier still exits 2 (O-086 07), which this case may also assert.
- Planted breaks, recorded in Technical Evidence then reverted (`git diff` on the production file empty):
  - `harness.mjs` ~73 `const ok = failure === undefined && errors.length === 0` changed to drop `&& errors.length === 0`: the harness console-error case fails.
  - `runner.mjs` ~80 `return run.status === 0 && errors === 0` changed to `return run.status === 0`: the runner console-error case fails.
  - `run-browser.mjs` `process.exitCode = await runSet(...)` changed to `await runSet(...)`: the exit-code case fails.
- Existing cases in `browserExitPath.test.ts` other than the replaced regex keep their setup and assertions unchanged.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-site/tests/browserExitPath.test.ts` (whole file; the `runSetWith` helper, the browser-missing probe, the regex case ~109)
- `packages/astraeus-site/tools/validate/harness.mjs` (`watchErrors` ~18–23, `checkScript` ~36–90)
- `packages/astraeus-site/tools/validate/runner.mjs` (`ERROR_LINE`, the per-step result ~50–80, `runSet` ~113–135)
- `packages/astraeus-site/tools/validate/run-browser.mjs` (whole file, short)
- `packages/astraeus-site/tests/fixtures/browser-exit/throws-through-harness.mjs`, `exits-three.mjs` (fixture pattern)
- `docs/agents/browser-policy.md` (whole, short)

## Design References

`.savepoint/Design.md` under `Current Technical State` (the gate times and limits paragraph only).

## Guardrails

TEST-01, TEST-02, TEST-03, STYLE-02, STYLE-10.

## Implementation Plan

1. Read `run-browser.mjs` as it is after O-086; note any tier arguments.
2. Add the two console-error fixtures and their cases beside the existing harness and runner cases.
3. Write the stub runner and the module hook (Node 22+ `module.register` with a `resolve` hook that matches the specifier ending `/runner.mjs` from `run-browser.mjs`); replace the regex case with the spawn of the real `run-browser.mjs` under the hook, for result 1 and result 0.
4. Run the three planted breaks one at a time, record the failing case and message, revert each.
5. Focused run, then gates.

## Boundaries

Test files and fixtures only; no change to `harness.mjs`, `runner.mjs` or `run-browser.mjs` (planted breaks are local and reverted). No `npm run check:browser` run: the cases open one blank page each through the harness, as today's harness case does. The zero-dots control is draft 02's. Do not touch `browserAssertions.test.ts` or the assertion list (draft 03).

## Technical Verification

Focused: `npx vitest run packages/astraeus-site/tests/browserExitPath.test.ts`. Handoff: `quality_gates`. No `check:browser` run (browser policy: this Task changes test fixtures, not the browser scripts or runner).

## Technical Evidence

| Done When | Evidence |
|---|---|
| Harness console error | `console-error-through-harness.mjs` + case "harness: a console error ..." (status 1, `"ok": false`, text in output, no `failure`); skipIf browser missing |
| Runner console error line | `exits-zero-logs-console-error.mjs` + case "runner: a step that exits 0 but logged a console error..." (summary `exit=0 ... error-lines>=1`, stderr FAILED, RESULT 1) |
| run-browser.mjs exit code | regex case replaced; real run-browser.mjs under `--import stub-runner-hook.mjs` (hook registered from a data: URL, sends `./runner.mjs` to `stub-runner.mjs`); result 1 -> status 1, 0 -> 0, for no args and `--tier quick`; `--tier bogus` -> 2. O-086 had not replaced the regex, so nothing skipped |
| Planted breaks | harness.mjs dropped `&& errors.length === 0` -> harness console-error case red (`expected +0 to be 1`); runner.mjs `return run.status === 0` -> runner case red (stderr lacked FAILED); run-browser.mjs `await runSet` without `process.exitCode =` -> exit-code case red (`expected +0 to be 1`). Each under flock, restored; `git diff` on each file empty |
| Existing cases unchanged | only the regex case removed and the header comment sentence updated |
| Gates | see below |

Commands: `npx vitest run packages/astraeus-site/tests/browserExitPath.test.ts` -> 5 passed. Gates (flock): typecheck pass; build pass; lint: eslint pass, prettier warns only on other builders' files (computedLook.test.ts, sceneBuildContract.test.ts), my files clean; `npm test`: failures only in other builders' files (sceneLoadOrder.test.ts T-408, computedLook.test.ts T-410, 9 failed in total), none in browserExitPath. Not rerun (concurrent edits in flight).
Files changed: tests/browserExitPath.test.ts; new fixtures console-error-through-harness.mjs, exits-zero-logs-console-error.mjs, stub-runner.mjs, stub-runner-hook.mjs (all under packages/astraeus-site/tests). Extra reads: packages/astraeus-site/tools/validate/browser-steps.mjs (O-086 step list, to confirm run-browser args). Limitations: no check:browser run.

## Drift Notes

None. (Hook approach worked on Node 24; plan's expectation of Node 22+ `module.register` holds.) Original note: If the hook approach cannot load under the repo's Node versions, record why and the alternative used (for example running `run-browser.mjs` in a child with a copied directory where `runner.mjs` is the stub), without adding a hook to production code.

## Coordinator (gates)

Set done by the orchestrating session after the combined handoff gates passed with T-402..T-404 and T-406..T-412 together (owner: "I mark them as they pass", O-038; G-024 decision 7 "Orchestrate each objective to completion"; owner 2026-11-22 "I am remote now, add park the check and move on"): lint and Prettier clean, typecheck clean, `npm test` 324 files, 5319 passed, 2 skipped; `npm run check:pack` pass, engine 1,836,372 B raw (cap 1,838,000), 525,692 B gzip (cap 527,000).
