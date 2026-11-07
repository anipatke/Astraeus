---
id: C-154
scope: {kind: objective, id: O-060}
result: NEEDS WORK
checked_by: {role: checker, session: o060-check-20261107}
executed_session: o060-run-20261107
checked_at: '2026-11-07T08:35:00Z'
health_snapshot: sha256:da7096699c9ad52f2dfbed03fb43926aa5d6ccc33cfcda703411761e41a8305a
reviewed:
  base_commit: 6aad8e6a
  head_commit: eebae3bf
  files: [packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/journey-views.mjs, packages/astraeus-site/tools/validate/runner.mjs, packages/astraeus-site/tools/validate/assertion-list.mjs, packages/astraeus-site/tests/browserAssertions.test.ts, packages/astraeus-site/tests/fixtures/browserAssertionsBaseline.json, packages/astraeus-site/tests/gateLimits.test.ts, packages/astraeus-site/tests/packagePacks.test.ts, tools/check-packs.mjs, tools/gate-limits.json, tools/gate-limits.mjs, tools/time-gates.mjs, package.json, docs/agents/build.md, docs/BROWSER_CHECKS.md, .savepoint/Design.md]
  dependencies: []
issues: [I-149]
supersedes: null
---

# C-154: O-060 Full Objective Check

**Verdict: NEEDS WORK, on one Issue (I-149).** The browser check really does keep its protection: an independent rebuild found no assertion or guard condition lost or changed, and every gate passes. The fault is in the proof. The Objective requires that protection to be "proved by a test against a committed list", and that list omits three checks and records no guard condition for 82 of its 158 entries. Four real weakenings pass the test, while the docs say loosening fails it.

**Independence.** This session did not plan, build, coordinate or repair O-060. Task evidence and the committed fixture were treated as claims. The only coordinator material read was the owner's own words in the session transcript, to confirm the quotes.

**Prior owner decisions.** O-060 and its Tasks carry no structured `exception` and no `owner_validation`, and this is the first Check, so no `carried_forward` entry is needed.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not an acceptance feature here; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria.** The five O-060 Success Conditions as written, the Done When of T-281, T-282 and T-283, TEST-01 to TEST-03, API-01 (T-282), the browser policy, and the deferred Design reconciliation rule.
2. **Changed files and entry points.** Diff `6aad8e6a..eebae3bf`. Entry points: `npm run check:browser`, `npm run check:gates`, `npm test`, `npm run test:full`, `tests/browserAssertions.test.ts`, `pastTheEntry`.
3. **Relied on.** Vite dev server, headless Chromium through `harness.mjs`, the scene readouts read through `driver.mjs`, git for the baseline rebuild. Engine, public API and on-screen behaviour are out of scope (no `packages/*/src` change in the diff).
4. **Axes.** Below, with not-applicable cells named.
5. **Admission boundary.** Common rules. Theoretical timing states with no reproduction stay observations.

## Coverage Matrix

| # | Cell | Expected | Actual and evidence | Result |
|---|---|---|---|---|
| 1 | Every assertion at 6aad8e6a still at HEAD | none lost | Independent acorn syntax-tree rebuild from `git archive`, all scripts in `tools/validate`, each throw held with its guarding `if` test: 169 sites at baseline, 1 changed text, 0 lost. The one change is `zoomOutFully(page)` gaining the argument `"traveller"`, same error, same logic. | Passed |
| 2 | No tolerance loosened | none | Same rebuild includes guard text; 0.01, 0.002, `radiusPx > 20`, 0.47 to 0.53, 30 minutes all unchanged. | Passed |
| 3 | Fixture equals git | same | `assertion-list.mjs 6aad8e6a` output has no diff from the committed file (158 entries). | Passed |
| 4 | List holds every error a check can raise | all | Three `wholeProblems.push` sites in `load-budget.mjs` absent. | **Issue I-149** |
| 5 | Test fails on a removed check | fails | Control: whole `rings` line deleted, test fails. A deleted `wholeProblems.push` line: test passes. | **Issue I-149** |
| 6 | Test fails on a loosened check, as docs claim | fails | `> 20` to `> 2` and `false &&` guard: 4 of 4 tests pass. 82 of 158 entries hold the message only. | **Issue I-149** |
| 7 | Wheel stop reaches the old limit, idle, alone | same end state | Real driver, then 60 more old-style turns: Saturn 702.738 px both, Miranda 678.998 both, path span 0.029/0.189 both; 23, 11, 13 turns. | Passed |
| 8 | Wheel stop, side by side | same | Desktop as row 7. Phone 659.012, 636.749, 0.046/0.088, both before and after 60 more turns. | Passed |
| 9 | Wheel stop, side by side, 16 CPU hogs on 16 cores | same | Same figures and same turn counts; only slower (zoom-out 13 s, was 2 s). A run with 32 hogs was stopped by my own timeout and gave no result. | Passed |
| 10 | Zoom end state against baseline runs | same | `drawn.journey` in baseline run `browser-20261107T063155Z` and all four later runs: same radii, spheres 679/637, spans and labels. | Passed |
| 11 | Settle wait times out | assertion decides | `waitUntilStable` returns the last value and never passes by itself; each caller's assertion is unchanged (row 2). | Passed |
| 12 | Settle wait can pass a fault the fixed wait failed | none material | Wider window: see Observation 1. Follow rule broken: probe b keeps moving, the wait times out, `waitForBodyMoved` finds Earth still, the assertion fails (reasoned from code, not run). | Passed, with Observation 1 |
| 13 | Side-by-side isolation | one page cannot mask the other | `load` keeps errors and failures per call; driver has no module-level `let`; a rejected `openContext` rejects `Promise.all`, so the step exits non-zero. | Passed |
| 14 | Count floor | at least 3,282 | `npm test` and `test:full`: 232 files, 3299 passed, 2 skipped. No test file deleted; the only removed test lines are one renamed title and the old ring setup. | Passed |
| 15 | Coverage not lower | not lower | Lines 95.31%, branches 88.59%, the same as C-153 at baseline; statements 12317/13238. No file under the coverage `include` changed. | Passed |
| 16 | Over limit, gate passes (real CLI) | warning, exit 0 | Scratch project running `tools/time-gates.mjs`: WARNING line, exit 0. | Passed |
| 17 | Over limit, gate fails | exit 1 | `FAILED (exit 3)`, WARNING, exit 1. | Passed |
| 18 | Within limit; unknown name | no warning, exit 0; exit 2 | As expected. | Passed |
| 19 | Browser runner, real step over step and total limit | two warnings, exit 0 | Both WARNING lines, `runSet` 0. Failing step within and over limit: 1. | Passed |
| 20 | Stale result | a source change fails next run | Scratch export: clean 28 passed; export added to `src/api/index.ts`: `public surface lock` fails. No global setup, no cache; `vitest.config.ts`, `vitest.setup.ts`, `api-surface.mjs`, `api-rules.mjs` have no diff. | Passed |
| 21 | Stale browser run | cannot pass by itself | Runner always writes a fresh stamped folder and nothing reads an old one; reuse is a checker decision, tested below. | Passed |
| 22 | `pastTheEntry` in parts | named; manifest allowed | Double, single, template quotes, no `node_modules`, array join: named. `package.json`, `style.css`, the real package list: allowed. One part per line: not named (Observation 6). | Passed |
| 23 | Ring test in a scratch folder | no write to `dist` | `mkdtempSync` in the diff, whole folder removed. | Passed |
| 24 | Docs and limits agree | same | `gateLimits.test.ts` passes inside the full gate; every drift note found in `BROWSER_CHECKS.md`, `build.md` or Design line 216. | Passed |

Not applicable: text classes, serialization, redirected or no-colour output beyond the plain lines above, and auth or persistence. The scoped tools print plain lines and hold no such state.

## External Boundary Matrix

| Cell | Classification |
|---|---|
| Configured and actual target | Passed: the runner starts its own servers; relied-on run served all ten steps |
| Startup, discovery, reuse | Passed: `runner.mjs` server code unchanged in the diff |
| Server unavailable, non-success, redirect, malformed | Not applicable: unchanged, no O-060 code touches it |
| Timeout | Passed: rows 9 and 11; a slow browser only slows the run |
| Retry, cleanup | Passed: `finally` still stops servers and `context.close` still runs per load |
| Secret-safe output | Not applicable: no secrets in these paths |

## Workflow Lock: a timed run

| Order | Operation | Effect | Failure | Final state | Oracle |
|---|---|---|---|---|---|
| 1 | Load limits | none | Malformed file throws, exit non-zero (`time-gates` probed) | No run; not a time failure | Probe |
| 2 | Run gate or step | Logs, evidence folder | Non-zero exit is command-fatal | `ok` false | Rows 17, 19 |
| 3 | Compare with limit | One line | Warning only | Exit unchanged | Rows 16, 19 |
| 4 | Print total | Summary line | Warning only | Exit from gates only | Row 19 |

## Success Conditions

| Condition | Class | Evidence |
|---|---|---|
| Browser check about 230 s, every step passing | Proven | Summaries 231, 231, 229, 233 s, all steps exit 0, error-lines 0; baseline 353 s confirmed in `browser-20261107T063155Z` |
| Same protection | **Issue** on "proved by a test against a committed list" | Rows 4 to 6. The rest is Proven: rows 1, 2, 14, 15 |
| Fast tests | Proven under T-282's rule | Result reported: about 41 s, aim not met and not claimed. My run 43.0 s. Apollo file 37.3 s of a 38.4 s test duration confirms what sets the length. See Observation 2 |
| Time limits | Proven | Rows 16 to 19, `tools/gate-limits.json` |
| Proof | Proven | Table in `docs/agents/build.md`; drift notes accounted for; Observation 3 on one sentence |

**Owner records.** Confirmed in the transcript: "We tried this before, side by side is machine depedent and i sometimes work on mutiple things at once. I will Accept" (07:21:21Z), "Keep the pair, about 231s" (07:21:42Z), "orchestrate o60" (06:51:29Z), "Faster, same protection (Recommended)", "Warn in the run summary (Recommended)". The Objective quotes the first two exactly. The questions asked did state 51 s of page loading and about 54 s longer in turn.

**Waivers.** `check_waiver` on T-281 to T-283 has the required shape, and `recorded_at` matches each commit time. The owner's words do not say "waive": they rest on the standing run rule ("step checks waived quoting ..."). No waiver stands in for a criterion here, since all three Tasks were reviewed in this Check.

## Gates

Run on `eebae3bf` at 08:15 to 08:18Z, Node 24.16.0, one after another:

| Gate | Result | Time | Limit |
|---|---|---|---|
| `git diff --check 6aad8e6a..HEAD` | pass | 0 s | none |
| `npm run lint` | pass | 3.9 s | 15 s |
| `npm run typecheck` | pass | 5.9 s | 20 s |
| `npm run build` | pass | 2.3 s | 15 s |
| `npm test` (junit) | pass, 3299 passed, 2 skipped | 43.0 s | 65 s |
| `npm run test:full` | pass, 3299 passed, 2 skipped | 74.4 s | 105 s |
| `npm run check:engine-alone` | pass | 24.5 s | 40 s |
| `npm run check:pack` | pass | 18.1 s | 30 s |
| `npm run check:node-consumer` | pass | 4.7 s | 15 s |
| `npm run check:react-consumer` | pass, React 19.3.1 | 5.9 s | 25 s |

**Browser run relied on, not rerun.** `npm run check:browser`, `docs/evidence/browser-20261107T080721Z`, 08:07:21Z to 08:11:14Z, 233 s, ten steps exit 0, error-lines 0, smoke 18 loads with 0 failed, showers 6 with 0 failed, other steps `ok`. Reuse rule met: no file under `packages`, `tools`, `docs/agents`, `docs/BROWSER_CHECKS.md`, `package.json`, `package-lock.json`, `vitest.config.ts`, `eslint.config.js` or Design has a time after the run started (latest is `build.md`, 08:02:56Z). `3ac30f96..HEAD` changes three Task files only, one line each, the waiver times. The working tree matched HEAD.

My focused zoom probes used a browser one at a time on a separate port, after the gates ended and with no screenshots. They are not `check:browser` runs.

**Code Health.** `sha256:da7096699c9ad52f2dfbed03fb43926aa5d6ccc33cfcda703411761e41a8305a`, after the full gate: "does not block clearance". All five instances report no finding. Supporting evidence only.

**File reality.** Every file named in Task evidence exists; run folders 071542Z, 072219Z, 072610Z and 080721Z are present. Scripts were last edited at 07:15:04Z, before run 1 at 07:15:42Z.

## Issues

- **I-149** (Objective "Same protection"; T-281 Done When): the list misses three checks and every guard condition, while docs say loosening fails. Proof Needed is in the Issue.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-149 | Medium: tolerances in these guards are the ordinary thing to touch when a check goes flaky | Medium: nothing is lost today, but the guard guarding "same protection" is silent for half its entries, and the docs promise otherwise | Medium | Fix now, in the scanner, before O-060 closes |

## Observations (non-blocking)

1. **A slow camera now passes.** Settle waits run up to 10 s where the fixed waits were 0.5 to 2.5 s, so an ease or catch-up taking, say, 5 s would fail before and pass now. The `waitUntilStable` comment "exactly as it did after the fixed sleep" overstates this. The Objective allows it by name ("a wait on the condition it stood for"), and none of the old checks named a duration, so this is not an Issue. The owner may want to know. In the other direction, a wait can end earlier than the old sleep (about 200 ms against 700 ms in `views`), so a fault arriving after that is not seen at that assertion. Later steps in the same script re-read the clock against the same value. Not reproduced.
2. **Nothing was actually shared.** The Objective says "Setup repeated across test files is shared" and the outcome says tests "repeat less setup". T-282 measured, found no gain on the longest path, and by its own rule made no change, so `npm test` is unchanged (42 s to about 41 s). I classed this Proven under T-282's "shown not to matter" and the aim-not-pass-mark wording. The owner should read it as: this part gave no speed-up.
3. **`build.md` overstates the room.** It says limits are "at least 1.5 times" the slowest time. `test:full` is 1.46, `check:browser` 1.37 to 1.39, smoke 1.38. T-283's own "about 1.4 to 1.6" is right.
4. **Frames per second is no longer like for like.** Phone 47 to about 22, desktop 24 to about 20, from the side-by-side pair. It is reported only, never asserted.
5. **No repo test plants a step limit.** The planted runner test covers the total only. The step branch works (row 19).
6. **`pastTheEntry` is still line by line,** so a path with one part per line is not named. Already offered as a follow-up after C-153.
7. **The git rebuild test does nothing in a clone without 6aad8e6a.** Disclosed in T-281 and the docs.
8. **Router warning.** `savepoint resume` reports the router still selects finished T-283. Left alone; not this role's to change.

## Owner Validation Still Needed

None for appearance: the Objective records no owner look. After I-149 is repaired, a re-check is needed before the owner closes O-060.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — the runner's step-limit warning has no test (`gateLimits.test.ts` plants the total only).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** — the docs tables repeat the limits, and a test holds them to the file.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
