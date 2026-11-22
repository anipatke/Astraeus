---
id: C-207
scope: {kind: objective, id: O-088}
result: CLEAR
checked_by: {role: checker, session: check-o088-20261122}
executed_session: orchestrate-g024-20261121 / orchestrate-g024-20261122 (T-402..T-412 builders, I-193 and I-194 repairs)
checked_at: '2026-11-22T02:28:16Z'
health_snapshot: sha256:89abf1e3000b30474d632ff510f04594da366cc3a1d8ec2bcd69ef02198f4c30
reviewed:
  base_commit: 5a5d0100
  head_commit: 3c3e46fe
  files: [packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/app/style.css, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/stream-check.mjs, packages/astraeus-site/tools/validate/stream-check.d.mts, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus/tests/computedLook.test.ts, packages/astraeus/tests/sceneFaultOrder.test.ts, packages/astraeus/tests/sceneBuildContract.test.ts, packages/astraeus/tests/sceneLoadOrder.test.ts, packages/astraeus-site/tests/browserExitPath.test.ts, packages/astraeus-site/tests/browserDrawnControl.test.ts, packages/astraeus-site/tests/streamCheck.test.ts, packages/astraeus-site/tests/releaseBreaks.test.ts, packages/astraeus-site/tests/allowlistGrowth.test.ts, packages/astraeus-site/tests/fixtures/api-surface-previous.json, packages/astraeus-site/tests/fixtures/browser-exit/, packages/astraeus/CHANGELOG.md, docs/RELEASING.md, docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, package.json, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: null
---

# C-207: O-088 Full Objective Check

This is a fresh session. It did not plan, build or repair any O-088 work. Diff `5a5d0100..3c3e46fe` (`git merge-base main HEAD` = `5a5d0100`, O-087 merged). It covers all 11 Tasks, T-402..T-412. Each one is `done` with a recorded owner `check_waiver`.

**Result: CLEAR.** Every success condition is proven by independent probes. The text pins are gone, and their replacements fail when the behaviour they guard breaks. I-193 and I-194 are verified. Every gate is green on this head. No Issue was opened.

## Scope lock

1. Criteria: the 4 Objective success conditions and each Task's Done When. Guardrails TEST-01..04, ARCH-03, ARCH-06 (not reduced), STYLE (advisory). Gates: `quality_gates`, the full gate, `docs/agents/build.md` gates, and the browser tier from the policy.
2. Changed files: the `reviewed.files` above, plus the deleted pins: `browserAssertions.test.ts`, `assertion-list.mjs/.d.mts`, `browserAssertionsBaseline.json`, `scenePin.test.ts`/`.json`, `computed-look.baseline.json`, `tools/look-lock.mjs`, `migrationTable.test.ts`, `api-surface-0.7.0.json`. Two production behaviour changes: `assembleScene.ts` `prepare` group order (I-193) and the `style.css` drawer control rule (I-194).
3. Entry points: `run-browser.mjs` / `runner.mjs` / `harness.mjs` exit paths, `Scene` build/check/load (public API), the shell stylesheet in site and mount order, the changelog and API lock comparison, and the allowlist files.
4. Matrix axes: the controls fail when broken (harness, runner, run-browser, zero drawn); load order (loaded / fresh graph); bundle order (site / mount × 4 layouts × 2 definitions); release state (open / dated top section); allowlist (empty / unapproved / owner-approved; git present / absent); driver reachability (every `ui.*` and named import resolves).
5. Admission: reproducible through a supported path, inside these Tasks' changes, with a credible consequence.

## Coverage matrix

| # | Criterion / cell | Result | Evidence (this session) |
|---|---|---|---|
| 1 | Failing step / console error fails the run (T-402) | Proven | Own planted break: `runner.mjs` `ERROR_LINE` made unmatchable. The "runner: ... logged a console error" case fails. `run-browser.mjs` runs for real under the stub hook: status 1/0 follows `runSet`, both with no arguments and with `--tier quick`, and `--tier bogus` gives 2. The harness console-error case ran (the browser is installed; it was not skipped in junit). |
| 2 | Zero drawn fails (T-403) | Proven | Own planted break: `assertSceneDrawn` without `paths`. streamCheck "one path" fails. `browser-smoke.mjs` calls `assertSceneDrawn` with the same condition as before. |
| 3 | Assertion-text baseline retired (T-404) | Proven | 4 files deleted. A repo search finds no `assertion-list`/`browserAssertions` outside history and evidence. BROWSER_CHECKS "Outcome controls" paragraph and the browser-policy review bullet are present. |
| 4 | Driver dead code deleted (T-405) | Proven | 180 exports left. An independent scan of every `ui.<name>` and named import from `driver.mjs` in `tools/`, the site tests and the engine tests finds 0 missing. `driver.d.mts` names none of the 232 deleted. Driver tests pass in `test:full`. |
| 5 | Fault order by code (T-406) | Proven | 222 cases with no message assertion. Own planted break: swapping `checkSolarSystemScale` and the tracked `checkReadouts` loop in `assembleScene.ts` fails "two faults: bad scale and a path line fixed to a missing body" (1 of 222). |
| 6 | Build contract (T-407) | Proven | 17 cases, no snapshot or message text. Own planted break: `story.ts:199` stops sorting events, and "events are kept in time order across calls" fails. |
| 7 | Load order + I-193 (T-408) | Proven | Pre-fix `assembleScene.ts` swapped in: the groups case fails (ring/belt). Head passes 31/31. Independent probe (temporary file, deleted): 5 groups with 2 clumps interleaved (p1, c1, p2, c2, p3). On head both graphs give `[p1,c1,p2,c2,p3]`. Pre-fix, the fresh graph gives `[p1,p2,p3,c1,c2]`. |
| 8 | Scene pin retired (T-409) | Proven | Both files deleted. Only `sceneBuildContract.test.ts`'s header mentions it, as history. |
| 9 | Look lock narrowed + I-194 (T-410) | Proven | Pre-fix `style.css`: all 8 bundle-order cases fail, on padding (111), radius (69) and min-height (46). Head passes. Probe: main's old baseline test run against head CSS. The 8 site-order cases pass, so the site look is unchanged. Mount order now differs from its old baseline only by taking the site values (padding 6px 8px, radius calc(12px / 2)). |
| 10 | Release breaks (T-411) | Proven | Fixture root equals `git show 55295278:` lock root (version 0.9.5). Own planted break: dropping `ViewerChange.scale` from the 0.10.0 list makes the test name it. |
| 11 | Empty allowlists (T-412) | Proven | Own planted break: an unapproved entry in `apiIsolation` `breaks` with `ALLOWLIST_BASE=no-such-ref` fails that case. The git describe is skipped. ARCH-06 body-name allowlist untouched. |
| 12 | Review checklist note (SC 4) | Proven | Bullet under "Browser regression maintenance". Scenarios moved in this Objective: T-403's zero-content site moved to `stream-check.mjs`, still raised in smoke, with table cases in `streamCheck.test.ts`. T-405 deletes no assertion. |
| 13 | Design reconciliation | Proven | Design names the three scene files, the I-193 order rule, the two look checks with the I-194 selector, `releaseBreaks`, and the T-412 clause. |

External boundary (browser runner, subprocesses): exit-code paths are covered by rows 1–2. Redirect, network and secret cells do not apply (local fixtures, no credentials). Workflow/side-effect lock: the only multi-step production path is `prepare` (row 7). `layers.splice` keeps the shared array, and the size guard keeps it idempotent.

## Gates (this session, head 3c3e46fe)

| Gate | Result |
|---|---|
| `npm run lint` / `typecheck` / `build` | pass (12 s / 7 s / 3 s) |
| `npm run test:full` | 324 files, 5321 passed, 2 skipped (the opt-in Apollo determinism and perf cases); 52 s |
| `npm run check:engine-alone` | 247 files, 4204 passed, 1 skipped; 33 s |
| `npm run check:pack` | pass; engine 1,836,420 B raw (limit 1,838,000), 525,707 B gzip (limit 527,000) |
| `npm run check:node-consumer` | 12 passed |
| `npm run measure:example` | first-open 1,836,420 B raw / 525,707 B gzip |
| `npm run check:public-build` | pass, `docs/evidence/public-build-20261122T022346Z` |
| `git diff --check 5a5d0100 HEAD` | clean |
| `savepoint health check O-088` | snapshot above (created). "does not block clearance". The coverage and tests instances report "stale". They are optional, and this is a collection statement, not a finding (same as C-205/C-206). |
| Browser (full tier) | Reused T-405's full-tier run `docs/evidence/browser-20261121T232215Z`: 11/12 exit 0 with 0 error lines. synthetic-journey failed on `net::ERR_NETWORK_CHANGED` and passed on its one `--step` rerun, `docs/evidence/browser-steps-20261121T232739Z`. The Objective decided this run is its only browser job. `git diff 8f2b84e8 HEAD` outside docs and `.savepoint` holds only O-087's I-196 repair (`OrbitSetView.ts`, its test, CHANGELOG line). That is not a listed browser path, and C-206 judged it needs no browser run. So one run per Objective Check holds and no second run was made. |

All planted breaks were restored, and `git status` shows no tracked change.

## Closure map

| Issue | State | Evidence |
|---|---|---|
| I-193 | Closed (verified) | Proof Needed met: `sceneLoadOrder.test.ts` compares the definition after `prepare`, including group order, with no exclusion for it. It fails on the pre-fix file and passes on head. The interleaved probe agrees. |
| I-194 | Closed (verified) | Proof Needed met: the bundle-order test passes for padding, radius and min-height in all 4 layouts × 2 definitions, and fails on the pre-fix CSS. The owner's look passed ("5Y", Objective Decisions, 2026-11-22). |

No materiality actions are required.

## Owner validation still needed

None. The owner's look at the buttons is recorded.

## Observations (non-blocking)

- T-409 found that the group `dotSizePx` default is caught by `groupLookHandle.test.ts`/`twoViewers.test.ts` but by none of the three scene files. It is still covered.
- The named-parts look case asserts colours of the nested toggle, a bar button and the info toggle. It has no panel background or font-size row. The Done When listed those parts as examples.
- `allowlistGrowth.test.ts` no longer checks a brand-new top-level section added to one of the five files. Today every section is listed.
- Design's "Owner decisions on C-137 (O2)" bullet still says the five files are compared with `main`. The next bullet carries the T-412 correction.
- `docs/architecture/demo-contracts.md` (O-022 history) and `viewer-interface.md:341,368` name driver functions or the look-lock that no longer exist. Both are dated history.
- `draws-through-harness.mjs` retypes the driver's readout attribute names, because the driver does not export them (T-403 limitation).
- The three scene files each copy the pin's made-up inputs (STYLE-07).

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; not assessed)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth**: `sceneFaultOrder`, `sceneBuildContract` and `sceneLoadOrder` each hold their own copy of the pin's inputs and helpers.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: one Objective diff touches 51 files, mostly deletions (37,345 lines removed). This is expected for retiring pins.
