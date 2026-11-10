---
id: C-164
scope: {kind: objective, id: O-065}
result: NEEDS WORK
checked_by: {role: checker, session: o065-recheck-20261110}
executed_session: o065-repair-20261110
checked_at: '2026-11-10T05:30:00Z'
health_snapshot: sha256:7f396a8c0106ffe0b5661b76f309ab1ca054378e8fe2170d87e7e17bdfe8b731
reviewed:
  base_commit: 46d71011
  head_commit: ccfc8003
  files: [packages/astraeus-site/tests/engineBudget.test.ts, packages/astraeus-site/tools/validate/engine-budget.mjs, packages/astraeus-site/tests/publicBuild.test.ts, tools/build-example.mjs, tools/build-example.d.mts, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/journey-look-out.mjs, packages/astraeus-site/src/skyTraceControl.ts, packages/astraeus-site/tools/validate/run-browser.mjs, tools/gate-limits.json, docs/BROWSER_CHECKS.md, packages/astraeus/CHANGELOG.md, packages/astraeus/src/api/skyFigureInput.ts, .savepoint/Design.md, packages/astraeus-site/tests/packagePacks.test.ts, tools/build-packages.mjs, tools/check-packs.mjs]
  dependencies: []
issues: []
unmet: [O-065-SC9-release-gates]
supersedes: C-163
---

# C-164: O-065 Full Objective Re-check

**Verdict: NEEDS WORK.** The three C-163 failures are repaired as their Proof Needed asks: the one fresh `npm run check:browser` run passes every step (look-out 43 s at both sizes within the owner's new 50 s limit; the engine's first download 1,745,198 / 501,483 B within the reset limit 1,833,000 / 527,000), and no published text offers `after: "clear"` any more. But the I-164 repair's new fast test, `packages/astraeus-site/tests/engineBudget.test.ts`, rebuilds `packages/astraeus/dist` (through `tools/build-example.mjs` → `tools/build-packages.mjs`, which deletes and rewrites the folder) while `packages/astraeus-site/tests/packagePacks.test.ts` rebuilds and packs the same folder in another Vitest worker. The two collide: **`npm test` failed in 2 of 3 full runs** in this session (and 3 of 7 runs of the two files together); each file alone passes. `npm test` is a hand-off gate and the publish workflow's gate (`.github/workflows/publish.yml:34`). This is caused by the repair, not missed before. It is recorded on I-164 (reopened evidence on the same Issue, since it is that repair's defect), which therefore stays open. The engine work itself is unchanged and the frozen 84-case harness passes again.

## Closure Map Of Prior Issues

| Prior Issue | State | Why |
|---|---|---|
| I-164 (blocking, C-163) | **Still open** | The size part is proven (browser `public-build-assets` passes; limit = measured + 5% rounded up, owner rule and decision recorded). The fast test the repair added is honest and fails below the limit, but it races `packagePacks.test.ts` over `packages/astraeus/dist` and makes `npm test` fail intermittently (below). |
| I-165 (blocking, C-163) | Proof met; stays open until a `CLEAR` Check | `look-out` passes at 1280x720 and 375x667 in the official run (43 s, limit 50 s); `expandDeveloperGroups` now finds and presses a fold in one `page.evaluate`; the journey closes the site trace control before the O-064 part; `tools/gate-limits.json` `look-out: 50` and the `docs/BROWSER_CHECKS.md` row state the owner's decision and the measured time; `gateLimits.test.ts` passes. |
| I-166 (low, C-163) | Proof met; stays open until a `CLEAR` Check | No offer of `after: "clear"` in src doc comments, README, CHANGELOG, browser map, step description or Design (grep below); CHANGELOG names `SkyClearOptions`; browser map lists Stay, Fade and Stay-then-Hide and says the `sky-trace:<id>` line set is read back. |

Issues are closed `verified` only by a `CLEAR` Check (issue-capture.md), so I-165 and I-166 carry a `rechecked` entry and close at the clearing re-check.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-163's lock reused unchanged)
- [x] Turn Acceptance Into Invariants (C-163's)
- [x] Build The Mandatory Coverage Matrix (C-163's matrix re-run)
- [x] Finite External-Boundary Matrix (unchanged; browser runner ran and stopped its servers)
- [x] Workflow And Side-Effect Check Lock (unchanged rows; repair's build side effect below)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here)
- [x] Perform The Adversarial Pass (repair code paths only)
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

| Re-check item | Prior Issue / claim | Frozen cell (C-163) | Allowed result |
|---|---|---|---|
| Browser run, `public-build-assets` | I-164 | SC9 browser gate | pass / Issue |
| Engine fast test honest, fails below limit | I-164 Proof Needed (strategic fix) | SC9 browser gate; scope lock 1 release gates (`quality_gates`) | pass / Issue |
| `npm test` and `test:full` with the new test | I-164 repair's changed code path | scope lock 1 release gates (`quality_gates` test) | pass / Issue |
| Browser run, `look-out` both sizes | I-165 | SC9 browser gate | pass / Issue |
| Look-out time vs limit; limit and table rows | I-165 | SC9 browser gate (time-limit rows) | pass / observation |
| Driver fold press, trace control closed | I-165 | SC9 browser gate | pass / Issue |
| Published wording of `after` | I-166 | SC9 docs honesty (API-07, API-01) | pass / Issue |
| Every original matrix cell | C-163 matrix | C-163 rows SC1 to Preamble | pass / Issue |
| `skyTraceSeconds` site address setting | I-165 repair | SC9 owner look (site scene) | observation only |

## Re-run Of The Frozen Matrix

C-163's independent harness (`probe/o065.probe.ts`, own Vitest config, nothing written to the repo) re-run on ccfc8003: **84 of 84 pass** (SC1 star ids and SIMBAD oracle, SC2 shapes and atomic/copy, SC3 circles, SC4 trace and clear checks, timing and state, SC5/SC6 looks). The rows proven by the suite (both embedding paths, switches, call order, reduced motion, computed-look baseline, glow pass order, lock/README) pass in the fresh `test:full`. Preamble: the repair adds no engine source other than one doc comment. SC9 rows re-checked below.

## Verify Evidence And Gates (fresh, ccfc8003)

| Gate | Result | Time / limit |
|---|---|---|
| `git diff --check main...o065-sky-figures` | pass | — |
| `npm run check:gates` (05:11:30Z, idle machine): `lint`, `typecheck`, `build`, `test`, `test:full`, `check:engine-alone`, `check:pack`, `check:node-consumer`, `check:react-consumer` | all pass; 0 over limit | lint 4 s/15, typecheck 6.1/20, build 2.5/15, test 44.5/65, test:full 71.8/105 (3,565 tests, 0 failures; junit and coverage written 05:13:41Z), engine-alone 21.4/40, pack 17.5/30, node-consumer 4.7/15, react-consumer 5.2/25; total 178 s |
| `npm run check:browser` once (05:14:52Z–05:19:18Z) | **pass, every step** | total 266 s / 320; look-out 43 s / 50; public-build-assets 2 s / 8 |
| `savepoint health check O-065` | snapshot created; "does not block clearance" | — |
| Repeat `npx vitest run` (whole suite) ×3 after the gates | **run 1 pass; runs 2 and 3 FAIL** (`packagePacks.test.ts`: "astraeus: stray file src/api/AstraeusScene.node.node.js", "… index.node.node.js") | ~45 s each |
| `engineBudget.test.ts` + `packagePacks.test.ts` together ×7 | **3 FAIL** (twice `npx vite build failed` in engineBudget; once `astraeus-data: tsc failed … packages/astraeus/dist/src/api/scene.d.ts(115,45): error TS1010`, a half-written file, in packagePacks) | — |
| each file alone (engineBudget ×3, packagePacks ×1) | pass | engineBudget ~3–5.6 s |

Browser evidence: `docs/evidence/browser-20261110T051452Z/` (summary.txt and each step's results.json); step logs `/tmp/astraeus-check-logs-OpeS4w/`. `public-build-assets.log`: `engineBudget { ok: true, raw: 1745198, gzip: 501483, rawLimit: 1833000, gzipLimit: 527000 }`. Repeat-run logs are in this session's scratchpad only. After the race probes the checker rebuilt `packages/<name>/dist` (`node tools/build-packages.mjs`, git-ignored output) so no half-written build was left behind.

### I-164 repair, judged as asked

- **Limit:** 1,745,198 × 1.05 = 1,832,458 → 1,833,000; 501,483 × 1.05 = 526,558 → 527,000. Matches the owner's 2026-11-01 rule and the 2026-11-10 decision "Reset limit, add fast test"; `publicBuild.test.ts` pins the new numbers.
- **Honest:** the test builds the real packed engine and `examples/hello-scene` and measures with the same `checkEngineBudget` the browser step uses; the build it leaves measures exactly 1,745,198 / 501,483 B, the same as the browser run's own build. It also proves a limit one byte below fails on both counts. `cleanEnv()` in `build-example.mjs` is what makes the in-test build equal the real one (the repair records 2,068,776 B without it).
- **Fast:** 3 to 5.6 s; `npm test` stayed at 44.5 s (limit 65).
- **Side effects: harmful.** It deletes and rebuilds `packages/astraeus/dist`, runs `npm pack`, `npm install` and `vite build` in `examples/hello-scene`, all shared folders. `packagePacks.test.ts` (`checkPacks()` → `buildPackage` → `rmSync(out)`, plus its planted-file cases) uses the same `packages/astraeus/dist` from another worker; Vitest runs files in parallel (`vitest.config.ts` has no file-level serialisation). The repair note's claim "Nothing else in the suite reads those build folders" is wrong for `packages/astraeus/dist`. Also (observation) the test needs the npm registry for the nested `npm install`, so `npm test` no longer runs offline.

## Issues

| Issue | Rule | Smallest scenario | Expected / actual |
|---|---|---|---|
| I-164 (still open, new evidence; caused by the repair) | Release gate `quality_gates` test (scope lock 1); TEST-01; I-164 Proof Needed (fast-suite check) | `npx vitest run --project preloaded packages/astraeus-site/tests/packagePacks.test.ts packages/astraeus-site/tests/engineBudget.test.ts`, or `npm test`, a few times | always pass; actual 2 of 3 full runs and 3 of 7 paired runs fail (`tools/build-example.mjs:41` → `tools/build-packages.mjs:152` `rmSync(out)` racing `tools/check-packs.mjs:232` `buildPackage(name)`) |

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-164 (race) | High: 2 of 3 full runs here; any machine with several workers | Medium: the hand-off gate and the publish workflow's `npm test` fail at random; nothing ships wrong, but releases and builders stall and green results lose meaning | Medium–High | Fix now (one targeted repair): make the two builds not share the folder in parallel, e.g. run the engine measure inside `packagePacks.test.ts`'s one build, or build to a separate output folder, or put both in one serial file; show by repeated paired runs that it holds |

`unmet`: `O-065-SC9-release-gates` (the ordinary test gate is not reliably green).

## Owner Decisions Carried Forward

No structured `exception` or `owner_validation.accepted_check` record exists in scope (C-163 Observation 4), so there is no `carried_forward` list to append to; assessed here:

| Decision | Changed since? | Applies |
|---|---|---|
| T-298 owner look ("looks ok", "Go once tests pass") | Repair adds an optional `skyTraceSeconds` address setting to the site trace control (default unchanged, 2 s) and closes the control in the journey; nothing drawn by default changes | Yes |
| API-04 `star` allowlist approval (owner, 2026-11-10) | Unchanged | Yes |
| API page gzip limit 44,000 (owner, T-296) | Unchanged; page budgets pass | Yes |
| I-164 "Reset limit, add fast test" | New; limit applied as stated; the fast test is added but must not break the suite | Yes (limit) |
| I-165 look-out limit 30 → 50 s | New; `tools/gate-limits.json` 50, run 43 s | Yes |

## Observations (non-blocking)

1. `docs/BROWSER_CHECKS.md` "Size limits" line now says "1,833,000 B raw / 527,000 B gzip (…; measured 1,652,588 / 472,895 plus 5%)": the new limit beside the old measurement. Combine with the I-164 repair.
2. The repair history entries on I-164, I-165 and I-166 are stamped `2026-11-10T16:20:00Z`, which is local time (+11:00) marked as UTC: the repair commit is 05:11:16Z, and that stamp is later than this Check.
3. `cleanEnv()` drops every `npm_config_*` variable, including a registry or cache a user set by environment; the nested install then uses `.npmrc` only. The new test also needs network (as `check:react-consumer` does).
4. The Objective's Outcome and the "Hidden until traced" decision still say "stay, fade or clear"; the later "Removing a trace" decision supersedes it. Planner text, not published.
5. `skyTraceSeconds` is a new dev-site address setting (synthetic scene only); `docs/BROWSER_CHECKS.md` names the journey's use only through the step time.
6. Code Health: coverage and tests reported "stale" by the collector although `test:full` wrote both at 05:13:41Z, before the snapshot (same as C-163); a collection statement, not a finding.
7. C-163 Observations 1–3, 5–7 stand unchanged.

## Code Health

Snapshot `sha256:7f396a8c0106ffe0b5661b76f309ab1ca054378e8fe2170d87e7e17bdfe8b731` (created). Verdict: "Code Health does not block clearance." complexity, duplication, dependency vulnerabilities: no finding; coverage and tests (optional): stale (Observation 6). No Issue from health.

## Owner Validation Still Needed

- Convergence: this is the one full re-check. One targeted repair of the I-164 test race and one targeted re-check remain within the default limit; after that the owner decides. The targeted re-check needs the repeated `npm test` / paired runs, not another browser run, unless the repair touches the browser scripts or the example build the browser step uses.
- The owner's T-298 look carries forward.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — two test files each build `packages/astraeus/dist` (`engineBudget.test.ts`, `packagePacks.test.ts`); one shared build would also remove the race.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** — repair is 78 lines over 17 files, focused.
