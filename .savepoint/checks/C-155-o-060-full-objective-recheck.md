---
id: C-155
scope: {kind: objective, id: O-060}
result: NEEDS WORK
checked_by: {role: checker, session: o060-recheck-20261107}
executed_session: o060-repair-20261107
checked_at: '2026-11-07T08:58:00Z'
health_snapshot: sha256:4bbb8cf6f51e6094089594bb60ca0c9f95291f687baf18b68c8688975f559be9
reviewed:
  base_commit: 6aad8e6a
  head_commit: 249a9e9e
  files: [packages/astraeus-site/tools/validate/assertion-list.mjs, packages/astraeus-site/tests/browserAssertions.test.ts, packages/astraeus-site/tests/fixtures/browserAssertionsBaseline.json, docs/BROWSER_CHECKS.md, docs/agents/build.md, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/harness.mjs, packages/astraeus-site/tools/validate/run-browser.mjs, packages/astraeus-site/tools/validate/public-build-assets.mjs, packages/astraeus-site/tools/validate/public-addresses.mjs, packages/astraeus-site/tools/validate/engine-budget.mjs, packages/astraeus-site/tools/validate/load-budget.mjs]
  dependencies: []
issues: []
unmet: [O-060 Same protection, T-281 Done When]
supersedes: C-154
---

# C-155: O-060 Full Objective Re-check

**Verdict: NEEDS WORK, on I-149, which stays open.** The repair is real: all five named mutations now fail the test, the list is parsed, guards are held, and the baseline rebuilds from git. Every gate passes. Protection itself is intact today: an independent parser finds only the two reviewed changes between 6aad8e6a and HEAD. But I-149's first Proof Needed line ("every array or helper that can fail a browser script") and frozen cell 4 ("all") are not met: 12 failure routes are off the list, including both exit codes that decide whether the browser check fails at all. One reviewed exception also lets a real weakening pass.

**Closure map.**

| Prior Issue | State | Why |
|---|---|---|
| I-149 | Still open | Proof lines 2, 3 and 5 proven; lines 1 and 4 not |

**Independence.** This session did not plan, build, coordinate or repair O-060 and read no builder or earlier checker conversation. The repair note and C-154 were treated as claims.

**Prior owner decisions.** O-060 and its Tasks carry no structured `exception`, and `owner_validation` is `{required: false}` on all three Tasks, so no `carried_forward` entry is needed. The `check_waiver` entries are unchanged and stand in for no criterion here.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-154's lock, unchanged, plus the repair diff `36c61395..249a9e9e`)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (unchanged; no scoped file in it has a diff since C-154)
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

Written before any probe. Every blocking result below rests on the exact frozen cell named.

| # | Re-check item | Prior claim | Frozen cell | Allowed result |
|---|---|---|---|---|
| L1 | `radiusPx > 20` to `> 2` | I-149 proof | Row 6 | Blocking |
| L2 | `false &&` guard | I-149 proof | Row 6 | Blocking |
| L3 to L5 | Each `wholeProblems.push` deleted alone | I-149 proof; repair note "unverified" | Rows 4, 5 | Blocking |
| L6 | Control | Row 5 control | Row 5 | Blocking |
| L7 | Baseline rebuilt from git by the same code | I-149 proof | Row 3 | Blocking |
| L8 | Every 6aad8e6a site held, independent parser | I-149 proof | Rows 1, 2 | Blocking |
| L9 | `zoomOutFully` exception weakened | Repair claim | Rows 1, 5, 6 | Blocking |
| L10 | `load` exception weakened, each branch | Repair claim | Rows 1, 5, 6 | Blocking |
| L11 | List covers every array or helper that can fail a script | I-149 proof line 1 | Row 4 | Blocking |
| L12 | Header, test title and docs say only what the test proves | I-149 proof line 4 | Row 6 | Blocking |

## Proof Needed, Line By Line

| Line | Result | Evidence |
|---|---|---|
| 1. Each raise site with its guard, every array or helper that can fail a browser script, general rule preferred | **Not met** | Guards are held and the parser is real, but the rule stays name-based: rows 4a to 4d |
| 2. Planted cases fail for a tolerance, a guard, a `wholeProblems.push` | Met | The planted test holds all three, and the real-script mutations below agree |
| 3. Baseline rebuilt from 6aad8e6a by the same code; every site held | Met | `assertion-list.mjs 6aad8e6a` has no diff from the fixture; 227 sites, 90 guarded, 3 `wholeProblems`; rebuild test live in my clone |
| 4. Header, test title, docs say only what the test proves | **Partly met** | Test title and `BROWSER_CHECKS.md` are accurate for the listed forms. `assertion-list.mjs` line 1 says "every way the browser check can fail a script" and the test comment says "every raise site"; rows 4a to 4d show neither is true. The `load` exception's reason says load "still runs for every view and size", which the test does not hold (row 5a) |
| 5. The mutations each fail the test | Met | Below |

## Mutations

Shared clone of `249a9e9e` in the scratchpad, each mutation alone, `git diff --numstat` confirming only the intended line changed, tree restored between runs, real `tests/browserAssertions.test.ts`.

| Mutation | Expected | Actual |
|---|---|---|
| Control: no change | Pass | 5 of 5 pass |
| Control: comment and spacing only | Pass | 5 of 5 pass |
| `radiusPx > 20` to `> 2` | Fail | Fails: "every baseline assertion is still in the scripts" |
| `false &&` on the `depthMode` guard | Fail | Fails, same test |
| Raw `wholeProblems.push` deleted alone | Fail | Fails, same test |
| Gzip `wholeProblems.push` deleted alone | Fail | Fails, same test |
| Third `wholeProblems.push` deleted alone | Fail | Fails, same test |

The repair note's "not run" cases are now run, and all fail as they should.

## Reviewed Exceptions

| Exception | Deliberate T-281 change | Weakens anything at HEAD | Weakened version fails |
|---|---|---|---|
| `zoomOutFully(page)` to `zoomOutFully(page, "traveller")` | Yes: `git log -S` puts it in `b5d6ba87`, with the wheel-until-settled wait | No: same error and guard; C-154 rows 7 to 9 measured the same end state | **Yes**: guard disabled, other argument, line deleted all fail |
| `load(browser, view, size)` to `if !(view.journey) => load(...)` | Yes: same commit; owner kept the pair ("Keep the pair, about 231s") | No: both branches call `load` for every view and size | **Partly**: `else` branch removed or disabled, and journey views skipped by `continue`, all fail. Journey branch's `load` removed: **passes** (row 5a) |

## Coverage Matrix

Rows 1 to 24 are C-154's cells, unchanged. "Carried" means the subject files have no diff since C-154 (`git diff --name-only eebae3bf HEAD` lists only records, two docs, the scanner, its test and fixture); it was not re-run.

| # | Cell | Expected | Actual and evidence | Result |
|---|---|---|---|---|
| 1 | Every assertion at 6aad8e6a still at HEAD | none lost | Independent acorn rebuild from git with its own guard text, no code shared with the scanner: 205 sites at baseline, 206 at HEAD, and the only differences are the two reviewed changes | Passed |
| 2 | No tolerance loosened | none | Same rebuild includes guard text; no other change | Passed |
| 3 | Fixture equals git | same | No diff from a fresh rebuild | Passed |
| 4 | List holds every error a check can raise | all | Three `wholeProblems.push` sites now held; rows 4a to 4d not | **Issue I-149** |
| 4a | Exit code set by assignment | held | `harness.mjs:58` and `run-browser.mjs:19` absent. Deleting either: 5 of 5 pass. See below | **Issue I-149** |
| 4b | Failure list under a neutral name | held | `public-build-assets.mjs` `matches.push`, 8 sites (86, 89, 90, 91, 175, 179, 213, 217), absent. Line 86 deleted and line 89 guard disabled: 5 of 5 pass. Other site tests do catch those two (`publicBuild`) | **Issue I-149** |
| 4c | Same, nothing else catches it | held | `public-addresses.mjs:15` `found.push` deleted: 5 of 5 pass, and the whole site suite adds no failure over control | **Issue I-149** |
| 4d | Failure returned as a literal | held | `engine-budget.mjs:22` `ok: false` changed to `ok: true`: 5 of 5 pass, and no site test adds a failure | **Issue I-149** |
| 5 | Test fails on a removed check | fails | `wholeProblems.push` lines now fail; row 5a does not | **Issue I-149** |
| 5a | Removed check behind a reviewed exception | fails | `browser-smoke.mjs:293` to `if (view.journey) results.push();`: 5 of 5 pass, no site test adds a failure. It is the only route by which a journey view reaches `load`, so `journeyChecks` never runs at either size; `failed` stays empty and nothing asserts the load count (reasoned from the code, not run in a browser) | **Issue I-149** |
| 6 | Test fails on a loosened check | fails | Both mutations fail | Passed |
| 7 to 10 | Wheel stop and zoom end states | same | Carried: `driver.mjs`, `browser-smoke.mjs` unchanged | Passed |
| 11 to 13 | Settle waits, side-by-side isolation | as C-154 | Carried, same files | Passed, Observation 1 of C-154 stands |
| 14 | Count floor | at least 3,282 | `test:full` junit: 3302 tests, 0 failures, 2 skipped, so 3300 passed; no test file deleted since 6aad8e6a | Passed |
| 15 | Coverage not lower | not lower | Statements 12317/13238, the same as C-154; branches 6909/7798, 88.60% against 88.59% | Passed |
| 16 to 19 | Time limit warnings | as C-154 | Carried: `tools/time-gates.mjs`, `runner.mjs`, `gate-limits.json` unchanged; `gateLimits.test.ts` passes; real `check:gates` run gave no warning, exit 0 | Passed |
| 20, 21 | Stale result | as C-154 | Carried, inputs unchanged | Passed |
| 22, 23 | `pastTheEntry`, ring test | as C-154 | Carried; both pass in `test:full` | Passed |
| 24 | Docs and limits agree | same | `gateLimits.test.ts` passes after the `build.md` edit, which also fixes C-154 Observation 3 | Passed |

Not applicable: as C-154. External Boundary and Workflow tables are unchanged; no file in them has a diff since C-154.

**Row 4a, end to end.** `checkScript` catches a thrown assertion and sets `failure`; line 58 is the only thing that turns that into an exit code. A scratch script that throws through the real harness exits 1. With line 58 deleted it exits 0, logs `"ok": false`, and holds no line matching the runner's `ERROR_LINE`, so `runStep` reports a pass. Six of the ten `check:browser` steps use `checkScript`. Deleting line 19 of `run-browser.mjs` would make the whole check exit 0 on any failure (reasoned from `runSet` returning the code; only the test result was run).

**Whole site suite.** To separate "off the list" from "unprotected", each survivor also ran through `packages/astraeus-site/tests` and was compared by test name with an unmutated control. The control fails 11 app-mount tests in the clone only. Those tests are unrelated to the mutated files and the real-tree gates pass; I did not diagnose the clone cause.

| Survivor | Failures added over control |
|---|---|
| Journey branch `load` removed | none |
| `harness.mjs:58` deleted | none |
| `public-build-assets.mjs:86` deleted | 1 |
| `public-build-assets.mjs:89` guard off | 3 |
| `public-addresses.mjs:15` deleted | none |
| `engine-budget.mjs:22` to `ok: true` | none |

**Why this did not converge.** The repair replaced a name list with a parser, but what counts as a failure list is still decided by a name pattern. In these scripts a failure is often a data flow: an array collects, `ok: matches.length === 0` reads it, and a caller exits. Syntax shape alone cannot see that, so `matches` and `found` are missed exactly as `wholeProblems` was. This is the case I-149 warned of ("so the next differently named list cannot be missed").

## Success Conditions

| Condition | Class | Evidence |
|---|---|---|
| Browser check about 230 s, every step passing | Proven | Run below |
| Same protection | **Issue** on "proved by a test against a committed list" | Rows 4, 5. The protection itself is Proven: rows 1, 2, 14, 15 |
| Fast tests | Proven under T-282's rule | 41.7 s, aim not met and not claimed |
| Time limits | Proven | Rows 16 to 19 |
| Proof | Proven | Table in `build.md` |

## Gates

Run on `249a9e9e` with `npm run check:gates`, one after another, Node 24.16.0, working tree clean apart from `docs/prds` and `docs/research`. Total 177 s, none over limit, exit 0.

| Gate | Result | Time | Limit |
|---|---|---|---|
| `git diff --check 6aad8e6a..HEAD` | pass | 0 s | none |
| `npm run lint` | pass | 4.1 s | 15 s |
| `npm run typecheck` | pass | 5.7 s | 20 s |
| `npm run build` | pass | 2.4 s | 15 s |
| `npm test` | pass | 41.7 s | 65 s |
| `npm run test:full` | pass, 3300 passed, 2 skipped | 71.3 s | 105 s |
| `npm run check:engine-alone` | pass | 23.5 s | 40 s |
| `npm run check:pack` | pass | 14.1 s | 30 s |
| `npm run check:node-consumer` | pass | 8.1 s | 15 s |
| `npm run check:react-consumer` | pass | 5.7 s | 25 s |

**Browser run relied on, not rerun.** `npm run check:browser`, `docs/evidence/browser-20261107T080721Z`, 08:07:21Z to 08:11:14Z, 233 s, ten steps exit 0, error-lines 0. Reuse is met for this gate: the only tracked files under `packages`, `tools`, `examples`, `package.json`, `package-lock.json`, `vitest.config.ts` and `eslint.config.js` newer than the run start are the scanner, its test and its fixture. Only that test imports the scanner; no step, `runner.mjs`, `run-browser.mjs` or any app file reads them. Gate definitions are unchanged. The policy's metadata-only rule governs the full gate, which was run fresh; the browser policy governs this gate ("a later check reuses the earlier run").

**Code Health.** Fresh snapshot, needed because code changed since `da709669`: `sha256:4bbb8cf6f51e6094089594bb60ca0c9f95291f687baf18b68c8688975f559be9`, after the full gate: "does not block clearance". All five instances report no finding. Supporting evidence only.

**File reality.** Every file named in the repair note exists. Its figures are confirmed: 227 sites, 90 guarded, 3 `wholeProblems`, 3300 passed, 2 skipped.

## Issues

- **I-149** stays open, with what remains added under its Proof Needed. No new Issue: this is the same requirement, location and symptom, so `issue-capture.md` keeps the same ID.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-149 | Low to Medium: needs someone to edit these lines, and today none is lost | Medium to High: for rows 4a and 5a the browser gate would go green silently, with nothing else catching it | Medium | One targeted repair, in the scanner and the exception. No browser script needs to change, so the browser run stays reusable |

This is the one full re-check. Under the default convergence limit one targeted repair and re-check remain, after which the owner decides. The owner may also prefer to accept the remainder, or to narrow the claim to the listed forms.

## Observations (non-blocking)

1. **Changing what a value means stays invisible.** `harness.mjs` `ok` no longer counting `failure`, and `runner.mjs:62` ignoring `run.status`, both pass the test and add no site failure. They fall in the disclosed class ("a changed value it reads"), so they are not part of the Issue, but they sit on the same exit path as row 4a. The owner may want them held.
2. **Clone-only failures.** 11 app-mount tests fail in a shared clone with linked `node_modules` and pass on the real tree. Cause not diagnosed.
3. **C-154 Observations 1, 2, 4, 5, 6, 7 stand** unchanged. Observation 3 is fixed.
4. **Router warning.** `savepoint resume` still reports the router selects finished T-283. Left alone; not this role's to change.

## Owner Validation Still Needed

None for appearance. The owner should see the Issue's remainder and choose: one more targeted repair, accept it, or narrow the claim.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — the runner's step-limit warning still has no test (`gateLimits.test.ts` plants the total only).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
