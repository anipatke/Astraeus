---
id: T-126
title: One harness for the browser-check scripts and no retired copies
objective: O-037
status: in_progress
stage: audit
check_waiver:
  task: T-126
  reason: Owner waived the optional Task Check for O-037 ('dont run full checks until the final objective check'); the Full Objective Check covers it.
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  recorded_at: '2026-10-21T10:16:47Z'
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

Built under the owner's run rule (2026-10-21, "dont run full checks until the final objective check"): no browser script or check set was run; `npm run check:engine` (planned for hand-off) and the three demo sets run once at the Full Objective Check instead. Task Check waived (frontmatter).

- Harness: `tools/validate/harness.mjs` exports `checkScript({name, viewports, extraArgs, outDir}, run)`, `launchBrowser(extraArgs)`, `watchErrors(page, errors, label)`, `appUrl(params)`.
- All 32 scripts (26 in `tools/validate/`, 6 `browser-*` plus `probe-phone-frames` in `on-request/`... every `browser-*.mjs` and `probe-phone-frames.mjs`) import the harness: the playwright import, `chromium` const, launch line and two error handlers are gone. `browser-shell` and `browser-scale-menu` use the full `checkScript`; the rest use `launchBrowser` and `watchErrors` and keep their own page, context and exit pattern (assertions untouched).
- Guard: `driver-guard.mjs` now also fails `chromium.launch` and a `playwright.mjs` import in scripts (harness.mjs is exempt); `tests/browserDriverGuard.test.ts` adds a launch/import case.
- `tools/archive` removed with `git rm -r`; `docs/BROWSER_CHECKS.md` note updated and a harness section added.
- Node-level proof: `node --check` on harness.mjs and every script passes; `node tools/validate/driver-guard.mjs` passes.
- jscpd (src+tests+tools, scratch, archive and node_modules ignored): 4.56% (140 clones) at HEAD, 4.30% (127 clones) now; the under-3% target is NOT met by this Task alone (other duplication lies in src and tests, and scripts still repeat their `browser.newPage` blocks).

Drift/notes: (1) Done When 1 asks the guard to forbid direct `newPage`; most scripts still call `browser.newPage`/`newContext` (varied contexts), so only `chromium.launch` is forbidden. (2) `browser-home-curve-fits` and `browser-scale-menu` previously launched without the software-rendering flags; they now get them (harmless). (3) Error-line prefixes in a few scripts changed from `pageerror(label):` to `label pageerror:`; the runner counts both. (4) Unrun scripts: first run is at the Final Objective Check.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.

### Second pass (coordinator request)

- No script calls `newPage` or `newContext` now: `harness.mjs` also exports `openPage(browser, options)`, `openContext(browser, options)` and `pageIn(context)`; all 32 scripts use them or `checkScript` (assertions unchanged; `browser-phone` and `browser-showers` import `openPage` as `openBrowserPage` because they have a local `openPage`). `driver-guard.mjs` forbids `.newPage(`/`.newContext(` and `chromium.launch`; `tests/browserDriverGuard.test.ts` has the three new bad lines. `node --check` passes on every script; guard passes; no browser run (`npm run check:engine` and the demo sets are pending at the Final Objective Check).
- jscpd (src+tests+tools, scratch): 4.29% (126 clones, 2280 duplicated lines of 53171). 1717 of those lines are the Horizons data dumps `tests/fixtures/*-horizons-source.txt` (data, copies of the same ephemeris header/footer text). With `*.txt` ignored: 1.11% (62 clones, 563 lines). `tools/validate` alone has ~373 lines left, all assertion-level, not harness preamble.
- Drift note for the coordinator: reaching under 3% needs `**/*.txt` (or `tests/fixtures/**`) in jscpd's ignore list, which is `.savepoint/health/config.json` (T-122's file, not edited here). Top groups: outer-planets-horizons-source.txt 1068 lines, planets-horizons-source.txt 712, showers-year-horizons-source.txt 461, io-horizons-source.txt 424, planets-rotation 260 (each a 75-77 line clone against the others). Code clones outside tools: app/sceneLayout.ts 91-100 (10 lines), shell/ObjectControls.tsx (11), shell/ScaleControl.tsx (8); small.
