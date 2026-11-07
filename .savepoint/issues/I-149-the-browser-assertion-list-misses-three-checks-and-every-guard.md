---
id: I-149
title: The browser assertion list misses three checks and every guard condition
type: verification
status: open
source:
  kind: check
  check: C-154
  actor: {role: checker, session: o060-check-20261107}
  at: '2026-11-07T08:30:00Z'
tasks: [T-281]
checks: [C-154, C-155, C-156]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-11-07T08:30:00Z'
    actor: {role: checker, session: o060-check-20261107}
    kind: observed
    note: Found by the O-060 Full Objective Check, which rebuilt the list from git with a syntax-tree parser instead of the committed scanner.
    check: C-154
  - at: '2026-11-07T08:42:44Z'
    actor: {role: executor, session: o060-repair-20261107}
    kind: repair_attempted
    note: 'assertion-list.mjs rewritten as a syntax-tree parser recording each raise site with its guards; baseline rebuilt from 6aad8e6a (227 sites, 90 guarded, 3 wholeProblems). Two reviewed exceptions named in the test (zoomOutFully argument; load call under the side-by-side branch). Scratch mutations through the real test: control 5 of 5 pass; radiusPx > 20 to > 2 fails; false && guard fails; load-budget lines 295 and 296 deleted together fails. Unverified: each budget line deleted alone; the third wholeProblems.push deleted. test:full 3300 passed, 2 skipped; lint, typecheck, build pass. No browser script changed.'
    check: C-154
  - at: '2026-11-07T08:58:00Z'
    actor: {role: checker, session: o060-recheck-20261107}
    kind: rechecked
    note: 'Not closed: C-155 is NEEDS WORK. Proven: all five named mutations fail the real test, each alone, with controls passing; baseline rebuild matches; an independent acorn rebuild finds only the two reviewed changes; protection intact at HEAD. Not proven: 12 failure routes are off the list (process.exitCode at harness.mjs:58 and run-browser.mjs:19; eight matches.push in public-build-assets.mjs; found.push at public-addresses.mjs:15; the ok false literal at engine-budget.mjs:22), and the load exception passes when browser-smoke.mjs:293 stops calling load. Remainder added under Proof Needed.'
    check: C-155
  - at: '2026-11-07T08:59:31Z'
    actor: {role: owner, session: o060-run-20261107}
    kind: owner_decision
    note: 'After C-155 (no assertion lost; 12 failure routes outside the list), the owner chose "Narrow the claim (Recommended)" over "Accept it as it is" and "Fix all 12 gaps". Proof Needed is narrowed as in the section Owner Decision After C-155; the 12 routes are listed in docs as not seen by the list, not added to it.'
    check: C-155
  - at: '2026-11-07T09:25:00Z'
    actor: {role: executor, session: o060-repair2-20261107}
    kind: repair_attempted
    note: 'Narrow repair per the owner decision after C-155. Header of assertion-list.mjs, test comment and title, and docs/BROWSER_CHECKS.md now say only what the test proves and name the routes it does not see (exit codes by assignment, matches.push and found.push lists, the ok false literal in engine-budget.mjs); docs say the Full Objective Check rebuild shows nothing was lost. New tests/browserExitPath.test.ts (fixtures in tests/fixtures/browser-exit): a step throwing through the real harness.mjs exits 1 (control exits 0); the real runSet reports exit=3 as failed with result 1 (control 0); run-browser.mjs line checked by text. The load exception now holds both halves (now is a list; planted split case in the test). Scratch-copy runs through the real tests, controls 8 of 8 pass: harness process.exitCode line deleted fails the harness case; runner return ok ? 0 : 1 changed to return 0 fails; runner ok = runStep && ok changed fails; run-browser process.exitCode assignment removed fails; browser-smoke line 293 changed to if (view.journey) results.push(); fails two tests; earlier mutations radiusPx > 2, false && depthMode, load-budget 295-296 deleted, and rings line deleted each fail. Baseline fixture unchanged and the git rebuild test passes. lint, typecheck, build, test:full (233 files, 3303 passed, 2 skipped) pass. No browser script changed, no check:browser run. Not run: each budget line deleted alone and the third wholeProblems.push alone (as in C-154); the exit-code proof for run-browser.mjs is a text match, not a run, because its step list is fixed.'
  - at: '2026-11-07T09:28:00Z'
    actor: {role: checker, session: o060-recheck2-20261107}
    kind: rechecked
    note: 'Not closed: C-156 is NEEDS WORK on narrowed line 1 alone. Proven: browserExitPath.test.ts fails when harness.mjs:58 is deleted, the runner returns 0, or run-browser.mjs drops its exitCode assignment; the load exception fails with either half removed; radiusPx > 2, the false && guard and each wholeProblems.push deleted alone fail; controls pass; the baseline rebuild matches; docs, test comment, title and load reason are accurate. Not met: assertion-list.mjs line 1 still says "every way the browser check can fail a script" and line 2 "by shape and not by name". Convergence limit reached; the owner decides a two-line wording fix or acceptance.'
    check: C-156
  - at: '2026-11-07T09:30:13Z'
    actor: {role: owner, session: o060-run-20261107}
    kind: owner_decision
    note: 'After C-156 (last recheck under the limit; only assertion-list.mjs header lines 1 and 2 overstated), the owner chose "Fix the wording, then merge (Recommended)": the coordinator rewrote those two comment lines to claim only the listed forms (no code change, browser run stays reusable) and merges. Not checked by a checker; the Issue stays open for the owner to resolve as accepted on the board.'
    check: C-156
---

# I-149: The browser assertion list misses three checks and every guard condition

## Summary

O-060 "Same protection" says every browser assertion at 6aad8e6a still exists, "proved by a test against a committed list". T-281 Done When says the list holds "every browser assertion ... (each error a check can raise, by script)" and that a test fails if one goes missing.

The protection itself is intact today: C-154's independent rebuild found no assertion or guard condition lost or changed between 6aad8e6a and `eebae3bf`. The proof is what falls short, in two ways.

1. **Three checks are not on the list.** `CALLS` in `assertion-list.mjs` matches `problems.push` only as a whole name, so `wholeProblems.push` is skipped. The three whole-build checks in `load-budget.mjs` (raw size, gzip size, missing engine share file) are not in `browserAssertionsBaseline.json`.
2. **For 82 of the 158 entries the list holds only the message.** For `if (cond) throw new Error(...)` and `if (cond) problems.push(...)` the scanner records the raised text and not `cond`, so a tolerance in those guards can be loosened, or the guard disabled, and the test still passes. Yet three places say loosening fails the test: the header of `assertion-list.mjs`, the test title "fails when an assertion is removed, loosened or dropped with its script (planted)", and `docs/BROWSER_CHECKS.md` line 113. The planted case only loosens an inline `assert.ok`, the one form the list does cover.

## Evidence

Smallest scenario, on a scratch export of HEAD with the real `tests/browserAssertions.test.ts` run against it:

- `browser-smoke.mjs`: `!(saturn.radiusPx > 20)` changed to `!(saturn.radiusPx > 2)`.
- `browser-smoke.mjs`: `if (depthMode !== "logarithmic") throw` changed to `if (false && depthMode !== "logarithmic") throw`.
- `load-budget.mjs`: lines 295 and 296 (`wholeProblems.push` for the raw and gzip limits) deleted.

Expected: the test fails. Actual: 4 of 4 tests pass with all four mutations in place. Control: deleting the whole `if (!(rings > 0)) throw new Error(...)` line does fail the test, so the run was live.

Direct calls to `extractAssertions` agree: `if (x > 1) problems.push("p")` and `if (x > 100) problems.push("p")` give the same list, and `wholeProblems.push(...)` gives `[]`.

File evidence: `packages/astraeus-site/tools/validate/assertion-list.mjs` lines 1 to 12 (`CALLS`, header claim); `packages/astraeus-site/tools/validate/load-budget.mjs` lines 295 to 297; `packages/astraeus-site/tests/browserAssertions.test.ts` lines 36 to 56 (planted case); `docs/BROWSER_CHECKS.md` line 113.

Missing test evidence: no planted case for a guard condition or for a differently named problem list.

## Proof Needed

- The list records each raise site with the guard condition that decides it, for `throw`, `problems.push` and similar forms, and covers every array or helper that can fail a browser script, including `wholeProblems.push`. A parser or an equally general rule is preferred over adding one more name, so the next differently named list cannot be missed (Astraeus rule "Strategic fix first").
- Planted cases fail the test for: a guard tolerance loosened (`> 20` to `> 2`), a guard disabled (`false &&`), and a `wholeProblems.push` line removed.
- `browserAssertionsBaseline.json` is rebuilt from `git show 6aad8e6a:` by the same code and the test that rebuilds it still passes. Every 6aad8e6a site still present at HEAD is held, with no assertion dropped from the list.
- The header, test title and `docs/BROWSER_CHECKS.md` say only what the test proves.
- The re-check repeats the four mutations above and each one fails the test.

### Still needed after C-155

Lines 2, 3 and 5 above are proven. Line 1 and part of line 4 are not. Each case below is one line changed in a real script, run through the real test.

- `harness.mjs:58` deleted fails the test, and so does `run-browser.mjs:19` losing its `process.exitCode =`. Exit codes set by assignment are raise sites.
- A failure list is found by what the script does with it, not by its name: `public-build-assets.mjs` line 86 deleted, line 89 guard disabled, and `public-addresses.mjs:15` deleted each fail the test.
- `engine-budget.mjs:22` changed to `ok: true` fails the test. A failure returned as a literal is held.
- `browser-smoke.mjs:293` changed to `if (view.journey) results.push();` fails the test. A reviewed exception that splits one baseline site into two holds both.
- `assertion-list.mjs` line 1, the test comment and the `load` exception's reason say only what the test proves, naming any form it still does not see.
- The baseline is rebuilt by the same code, and the five mutations and controls above still behave as C-155 recorded.

## Owner Decision After C-155

Proof Needed from here on, replacing line 1 and the C-155 "Still needed" list:
- The list's header, the test title and comments, the `load` exception's reason and `docs/BROWSER_CHECKS.md` say only what the test proves: the listed raise forms, each with its guards. The docs name the failure routes it does not see, including the 12 C-155 found (exit codes set by assignment, `matches.push` and `found.push` failure lists, the `ok: false` literal in `engine-budget.mjs`), and say the Full Objective Check's independent rebuild is what shows nothing was lost.
- A direct test proves a failing browser step fails the run: a script that throws through the real `harness.mjs` exits non-zero, and the runner reports a non-zero step as failed and sets a non-zero exit. Planted: deleting `harness.mjs`'s `process.exitCode = 1` line, or the runner's exit code setting, fails it.
- The `load` reviewed exception holds both halves of the split site: planted `if (view.journey) results.push();` fails the test.
- Earlier mutations and controls still behave; the baseline is rebuilt by the same code.
