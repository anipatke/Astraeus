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
checks: [C-154]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-11-07T08:30:00Z'
    actor: {role: checker, session: o060-check-20261107}
    kind: observed
    note: Found by the O-060 Full Objective Check, which rebuilt the list from git with a syntax-tree parser instead of the committed scanner.
    check: C-154
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
