---
id: T-126
title: One harness for the browser-check scripts and no retired copies
objective: O-037
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o037-planning-20261021}
planned_reads: [tools/validate/driver.mjs, tools/validate/driver-guard.mjs, tools/validate/playwright.mjs, tools/validate/runner.mjs, tools/validate/run-engine.mjs, tools/validate/run-demo.mjs, docs/BROWSER_CHECKS.md, tests/browserDriverGuard.test.ts]
planned_writes: [tools/validate/harness.mjs, tools/validate, tools/validate/on-request, tools/archive, docs/BROWSER_CHECKS.md, tests/browserDriverGuard.test.ts]
---

# One harness for the browser-check scripts and no retired copies

## Outcome

Every browser-check script is its assertions and nothing else: one shared harness launches the browser, collects errors, runs the checks at the named viewports and writes the results file. `tools/archive` is gone. Both check sets pass as before.

## User Check

Open any script under `tools/validate/`: it starts with a comment and a call into the harness, not twelve lines of launch and bookkeeping. Run `npm run check:engine`: every step passes with zero console errors.

## Done When

1. `tools/validate/harness.mjs` exports one entry (for example `checkScript({ name, experience, viewports }, run)`) that loads `playwright-core` through `playwright.mjs`, launches Chromium with the project's software-rendering flags, opens the page for each viewport, collects `pageerror` and console errors, calls the script's `run(page, context)`, closes the page and browser, prints and writes `results.json` with the time, results and errors, and exits non-zero on any failure. Scripts still touch the interface only through `driver.mjs`; the guard in `driver-guard.mjs` and `tests/browserDriverGuard.test.ts` extend to forbid a direct `chromium.launch` or `newPage` outside the harness.
2. All 32 scripts under `tools/validate/` and `tools/validate/on-request/` use the harness; a script's own data loading and assertions are unchanged. The runner's summary line and error-line count still work with the harness's output.
3. `tools/archive/` is deleted; its mention in `docs/BROWSER_CHECKS.md` becomes a note that the old one-off tools live in git history.
4. jscpd over `src`, `tests` and `tools` (scratch run) reports under 3% with the preamble gone; readings before and after recorded.
5. Gates: `npm run typecheck`, `npm run build`, `npm test`. Browser proof, allowed because this Task builds the checks: `npm run check:engine` once at hand-off. The three demo sets run once at the Full Objective Check, since their scripts changed (AGENTS.md browser rule), not here.

## Context Files

`tools/validate/driver.mjs` (exports and the hook table only), `tools/validate/driver-guard.mjs`, `tools/validate/playwright.mjs`, `tools/validate/runner.mjs`, `tools/validate/run-engine.mjs`, `tools/validate/run-demo.mjs`, `tools/validate/browser-shell.mjs`, `tools/validate/browser-jupiter-io.mjs`, `tools/validate/browser-outer-planets.mjs`, `docs/BROWSER_CHECKS.md`, `tests/browserDriverGuard.test.ts`.

## Design References

Design: Components/Codebase Map row for `tools/validate/`; "Shell layout (O-020)" (Browser driver). O-034 Planned Technical Decisions (the driver stays, one browser job at a time). O-037 Why (duplication cause), Planned Technical Decisions on the harness.

## Guardrails

TEST-01, TEST-03; STYLE-01, STYLE-07, STYLE-10.

## Implementation Plan

1. Write the harness from the shape shared by `browser-shell.mjs` and `browser-jupiter-io.mjs`.
2. Convert the engine-set scripts; run the engine set.
3. Convert the demo and on-request scripts; delete `tools/archive`.
4. Extend the guard; update the map; gates; scratch jscpd reading.

## Boundaries

No assertion changes, no dropped scenarios, no screenshots, no change to the sets' membership or the runner's retention (the evidence Task owns that); the demo sets are not run here.

## Technical Verification

Engine set at hand-off; demo sets at the Full Objective Check; guard test; handoff gates per AGENTS.md's Verification Policy.

## Technical Evidence

Pending execution: engine run output path and summary, guard test names, jscpd readings before and after, files changed.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
