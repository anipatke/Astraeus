---
id: C-156
scope: {kind: objective, id: O-060}
result: NEEDS WORK
checked_by: {role: checker, session: o060-recheck2-20261107}
executed_session: o060-repair2-20261107
checked_at: '2026-11-07T09:28:00Z'
health_snapshot: sha256:aefea7d3d67a321cf37e1589c2a08df807f560f06dd01ce6a7c66537a920a44a
reviewed:
  base_commit: 4f7071d0
  head_commit: 099655c5
  files: [packages/astraeus-site/tools/validate/assertion-list.mjs, packages/astraeus-site/tests/browserAssertions.test.ts, packages/astraeus-site/tests/browserExitPath.test.ts, packages/astraeus-site/tests/fixtures/browser-exit/exits-three.mjs, packages/astraeus-site/tests/fixtures/browser-exit/exits-zero.mjs, packages/astraeus-site/tests/fixtures/browser-exit/passes-through-harness.mjs, packages/astraeus-site/tests/fixtures/browser-exit/throws-through-harness.mjs, docs/BROWSER_CHECKS.md, packages/astraeus-site/tools/validate/harness.mjs, packages/astraeus-site/tools/validate/runner.mjs, packages/astraeus-site/tools/validate/run-browser.mjs, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/load-budget.mjs]
  dependencies: []
issues: []
unmet: [O-060 Same protection, T-281 Done When]
supersedes: C-155
---

# C-156: O-060 Full Objective Re-check (last under the convergence limit)

**Verdict: NEEDS WORK, narrowly. I-149 stays open on one point: the first two lines of `assertion-list.mjs` still claim more than the test proves.** Everything else the owner's narrowed Proof Needed asks for is proven. The new exit-path test is real and catches every planted break of the exit route, the `load` exception now holds both halves, all earlier mutations still fail, controls pass, the baseline rebuilds unchanged, and every gate passes. Protection itself is intact.

This is the last re-check under the default convergence limit. **No further autonomous repair cycle.** The owner decides: fix the two header lines now (a wording edit, no code change, and the browser run stays reusable), or resolve I-149 as `accepted`.

**Closure map.**

| Prior Issue | State | Why |
|---|---|---|
| I-149 | Still open | Narrowed lines 2, 3, 4 proven; line 1 partly met (header lines 1 and 2 overclaim) |

**Independence.** This session did not plan, build, coordinate or repair O-060 and read no builder or earlier checker conversation. The repair note was treated as a claim.

**Prior owner decisions.** O-060 and its Tasks carry no structured `exception` and `owner_validation` is `{required: false}` on all three Tasks, so no `carried_forward` entry is needed. The owner's decision after C-155 narrows I-149's Proof Needed and the Objective's "Same protection" line; it is the requirement judged here, not an exception or acceptance.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-155's lock as narrowed by the owner, plus the repair diff `4f7071d0..099655c5`)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (unchanged; no browser script has a diff since C-154)
- [x] Workflow And Side-Effect Check Lock (unchanged, same reason)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not an acceptance feature here; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

Written before any probe. Frozen cells are C-155's, with rows 4, 4a to 4d replaced by the owner's narrowed Proof Needed (N1 to N4).

| # | Re-check item | Claim | Frozen cell | Allowed result |
|---|---|---|---|---|
| L1 | Header, test title and comments, `load` reason, docs say only what the test proves and name the unseen routes; docs say the Full Check rebuild shows nothing was lost | Narrowed line N1 | Row 6 / C-155 L12 | Blocking |
| L2 | `harness.mjs` `process.exitCode = 1` line deleted fails | N2 | Row 4a as narrowed | Blocking |
| L3 | Runner returns 0 fails | N2 | Row 4a as narrowed | Blocking |
| L4 | `run-browser.mjs` `process.exitCode =` dropped fails; is a text match adequate | N2 | Row 4a as narrowed | Blocking for the deletion; adequacy judged |
| L5 | `if (view.journey) results.push();` fails | N3 | Row 5a | Blocking |
| L6 | `radiusPx > 20` to `> 2`; `false &&` guard | N4 | Row 6 | Blocking |
| L7 to L9 | Each `wholeProblems.push` deleted alone | N4 | Rows 4, 5 | Blocking |
| L10 | Controls (none; comment and spacing) | N4 | Row 5 | Blocking |
| L11 | Baseline rebuilt by the same code | N4 | Row 3 | Blocking |
| L12 | Other edits on the exit route (`ok` ignoring `failure`, runner ignoring a step or `run.status`), text-match bypasses | C-155 Observation 1; adversarial | None exact | Observation only |

## Narrowed Proof Needed, Line By Line

| Line | Result | Evidence |
|---|---|---|
| N1. Header, test title and comments, `load` reason, docs say only what the test proves; docs name the unseen routes, including C-155's 12, and say the Full Check rebuild shows nothing was lost | **Partly met** | `docs/BROWSER_CHECKS.md` 113 to 117: accurate, names exit codes by assignment, `matches.push`/`found.push`, the `ok: false` literal, and says the Full Objective Check's rebuild shows nothing else was lost. Test comment (lines 6 to 10), test title ("a listed raise site"), `load` reason ("both halves must be present"): accurate. `assertion-list.mjs` lines 9 to 12: accurate and name the routes. **But `assertion-list.mjs` line 1 still reads "The list of every way the browser check can fail a script ... every raise site", the exact sentence C-155 named, and line 2 still says "the rule is by shape and not by name", while line 5's failure-list rule is by name.** The header contradicts itself; the repair note says it was narrowed |
| N2. Direct test: a throwing step through real `harness.mjs` exits non-zero; runner reports a non-zero step failed with non-zero result; deleting harness line or runner exit setting fails it | Met | `tests/browserExitPath.test.ts`; mutations below. `run-browser.mjs` by text match, judged below |
| N3. `load` exception holds both halves | Met | Journey branch and else branch each emptied alone: both fail two tests |
| N4. Earlier mutations and controls still behave; baseline rebuilt by the same code | Met | Below; `assertion-list.mjs 6aad8e6a` has no diff from the fixture |

## Mutations

Scratch `git clone --shared` of `099655c5` with the real tree's `node_modules` linked, each mutation alone, `git diff --numstat` confirming one line changed, tree restored between runs, real `browserAssertions.test.ts` and `browserExitPath.test.ts` (8 tests).

| # | Mutation | Expected | Actual |
|---|---|---|---|
| 0 | Control: none | Pass | 8 of 8 pass |
| 1 | Control: comment and spacing in `browser-smoke.mjs` | Pass | 8 of 8 pass |
| 2 | `harness.mjs:58` `if (!ok) process.exitCode = 1;` deleted | Fail | Fails: "harness: a step that throws ... exits non-zero" |
| 3 | `runner.mjs:134` `return ok ? 0 : 1;` to `return 0;` | Fail | Fails: "runner: a step that exits non-zero is reported as failed" |
| 4 | `run-browser.mjs:19` `process.exitCode =` dropped | Fail | Fails: "run-browser.mjs hands the runner's result to the process exit code" |
| 5 | `browser-smoke.mjs:293` to `if (view.journey) results.push();` | Fail | Fails two tests (reviewed-exception check and "every baseline assertion") |
| 6 | Else branch's `load` removed | Fail | Fails, same two tests |
| 7 | Saturn `radiusPx > 20` to `> 2` | Fail | Fails: "every baseline assertion is still in the scripts" |
| 8 | `false &&` on the `depthMode` guard | Fail | Fails, same test |
| 9 | `load-budget.mjs:295` raw `wholeProblems.push` deleted alone | Fail | Fails, same test |
| 10 | `load-budget.mjs:296` gzip push deleted alone | Fail | Fails, same test |
| 11 | `load-budget.mjs:297` share-file push deleted alone | Fail | Fails, same test |
| 12 | Observation: harness `ok` stops counting `failure` | (none required) | Fails the harness exit test |
| 13 | Observation: runner `ok = runStep(...) && ok` to `runStep(...)` | (none required) | Fails the runner test |
| 14 | Observation: `runner.mjs:62` ignores `run.status` | (none required) | Fails the runner test |
| 15 | Observation: `process.exitCode = 0;` added after `run-browser.mjs:19` | (none required) | **Passes** 8 of 8 |
| 16 | Observation: `STEPS.length = 0;` added before line 19 | (none required) | **Passes** 8 of 8 |

**Is the text match an adequate proof for `run-browser.mjs`?** For what the owner named, yes: removing or altering the assignment fails the test (row 4), and the exit test proves `runSet` returns 1 on a failing step, so the line as matched does hand on a failure. It is a proof of presence, not of behaviour: an added later line that resets the exit code or empties the step list passes (rows 15, 16). Those are additions, not the planted removal, and lie outside the narrowed Proof Needed, so they are an observation. The stated reason (the step list is fixed, so the file cannot be run against a fixture step) is true. Rows 12 to 14 show C-155 Observation 1 is now covered.

## Coverage Matrix

Rows 1 to 3 and 6 to 24 are C-155's cells. "Carried" means the subject files have no diff since C-155 (`git diff --name-only 249a9e9e..HEAD -- packages/astraeus-site/tools tools` lists only `assertion-list.mjs`).

| # | Cell | Expected | Actual and evidence | Result |
|---|---|---|---|---|
| 1, 2 | Every 6aad8e6a assertion and guard still at HEAD (independent rebuild) | none lost | Carried from C-155's independent acorn rebuild: no browser script changed since `249a9e9e` | Passed |
| 3 | Fixture equals git | same | Fresh `assertion-list.mjs 6aad8e6a` has no diff from the fixture | Passed |
| 4 (narrowed) | Header and docs say only what the test proves; unseen routes named | accurate | Docs, test comment, title, `load` reason accurate; `assertion-list.mjs` lines 1 and 2 overclaim | **Issue I-149** |
| 4a (narrowed) | A failing step fails the run, through real harness and runner | proven by direct test | Mutations 2 to 4, 12 to 14 fail; 0, 1 pass | Passed |
| 4b to 4d | `matches.push`, `found.push`, `ok: false` held by the list | replaced | The owner chose to name these, not hold them; they are named in docs and header | Not applicable (owner narrowed) |
| 5, 5a | Removed check, including behind a reviewed exception, fails | fails | Mutations 5, 6, 9 to 11 fail | Passed |
| 6 | Loosened or disabled guard fails | fails | Mutations 7, 8 fail | Passed |
| 7 to 13, 16 to 23 | Waits, isolation, time limits, stale result, ring tests | as C-155 | Carried, files unchanged; `gateLimits.test.ts` passes in `test:full` | Passed |
| 14 | Count floor | at least 3,282 passed | `test:full` junit: 3305 tests, 0 failures, 2 skipped, so 3303 passed | Passed |
| 15 | Coverage not lower | not lower | Statements 12317/13238 and branches 6909/7798 (88.60%), the same as C-155 | Passed |
| 24 | Docs and limits agree | same | `gateLimits.test.ts` passes | Passed |

External Boundary and Workflow tables: unchanged from C-154; no file in them has a diff since then. The new test's own boundary (a stub dev server, a sleeper `npx`, a scratch evidence directory cleaned in `afterAll`) was read and ran cleanly; no evidence directory was left behind by the gate run.

## Success Conditions

| Condition | Class | Evidence |
|---|---|---|
| Browser check about 230 s, every step passing | Proven | Browser run below |
| Same protection (as narrowed) | **Issue** on "says what it cannot see" for the header's first two lines; rest Proven | Rows 1 to 6 |
| Fast tests | Proven under T-282's rule | `npm test` 41.5 s, aim not met and not claimed |
| Time limits | Proven | Carried; `check:gates` run below gave no warning |
| Proof | Proven | Carried, `build.md` table |

## Gates

Run on `099655c5`, real tree, `npm run check:gates`, Node 24.16.0, working tree clean apart from `docs/prds` and `docs/research`. Total 177 s, none over limit, exit 0.

| Gate | Result | Time | Limit |
|---|---|---|---|
| `git diff --check 6aad8e6a..HEAD` | code and docs clean; one record flag (Observation 3) | 0 s | none |
| `npm run lint` | pass | 4 s | 15 s |
| `npm run typecheck` | pass | 5.8 s | 20 s |
| `npm run build` | pass | 5.4 s | 15 s |
| `npm test` | pass | 41.5 s | 65 s |
| `npm run test:full` | pass, 3303 passed, 2 skipped | 72.4 s | 105 s |
| `npm run check:engine-alone` | pass | 20.3 s | 40 s |
| `npm run check:pack` | pass | 17.5 s | 30 s |
| `npm run check:node-consumer` | pass | 4.7 s | 15 s |
| `npm run check:react-consumer` | pass | 5.7 s | 25 s |

**Browser run relied on, not rerun.** `npm run check:browser`, `docs/evidence/browser-20261107T080721Z`, 08:07:21Z to 08:11:14Z, 233 s, ten steps exit 0, error-lines 0; its summary carries T-283's limits, so it ran on the T-283 tree committed as `3ac30f96`. Since `3ac30f96` the only changed files under `packages`, `tools`, `examples`, `package.json`, `package-lock.json`, `vitest.config.ts` and `eslint.config.js` are the scanner, its test and fixture, and the new exit test with its fixtures under `tests/fixtures/browser-exit`. No step in `run-browser.mjs` STEPS, `runner.mjs`, `harness.mjs` or any app file reads them (only `assertion-list.mjs` names itself). Gate definitions are unchanged. The browser policy's reuse rule is met; the full gate was run fresh.

**Code Health.** Fresh snapshot, needed because tests and the scanner changed since C-155's `4bbb8cf6`: `sha256:aefea7d3d67a321cf37e1589c2a08df807f560f06dd01ce6a7c66537a920a44a` (created), after the full gate: "Code Health does not block clearance". All five instances report no finding. Supporting evidence only.

**File reality.** Every file named in the repair note exists: `tests/browserExitPath.test.ts` and the four fixtures under `tests/fixtures/browser-exit`. Its figures are confirmed: 3303 passed, 2 skipped (233 files not recounted). Its claim that the header now says only what the test proves is not confirmed for lines 1 and 2.

## Issues

- **I-149** stays open on narrowed line N1 alone: `packages/astraeus-site/tools/validate/assertion-list.mjs` line 1 ("The list of every way the browser check can fail a script ... every raise site") and line 2 ("the rule is by shape and not by name") claim more than the test proves; lines 5 and 9 to 11 of the same header show the failure-list rule is by name and that some failure routes are not seen. No new Issue.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-149 (remainder) | Medium: the first line is what a reader sees | Low: the same header, the test comment and the docs state the truth a few lines down; no protection is missing | Low | Fix now as a two-line wording edit, or the owner resolves I-149 as `accepted`. No code change; the browser run stays reusable |

The convergence limit is reached: this is the targeted re-check after the one full re-check. Stop here. The owner chooses: fix the two lines now and record it, accept the remainder, or create follow-up work.

## Observations (non-blocking)

1. **`run-browser.mjs` is held by its text, not its behaviour.** Adding `process.exitCode = 0;` after line 19, or `STEPS.length = 0;` before it, passes the test (mutations 15, 16). Outside the narrowed Proof Needed, which names the line's removal.
2. **C-155 Observation 1 is now covered.** Harness `ok` ignoring `failure`, the runner ignoring a step's result, and `runner.mjs:62` ignoring `run.status` each fail the exit test.
3. **Trailing blank line in a record.** `git diff --check` flags a blank line at the end of the I-149 record at HEAD. Removed in this run while appending its history; no code or docs file is flagged.
4. **C-154 Observations 1, 2, 4 to 7 and C-155 Observations 2 and 4 stand**, including `savepoint resume`'s router warning that T-283 is finished. Not this role's to change.

## Owner Validation Still Needed

None for appearance. The owner decides the I-149 remainder (fix the two header lines, or accept).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — the runner's step-limit warning still has no test (`gateLimits.test.ts` plants the total only).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [ ] STYLE-08 **Comments explain why** — `assertion-list.mjs` lines 1 and 2 contradict lines 5 and 9 to 11 of the same header.
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
