---
id: C-135
scope: {kind: objective, id: O-051}
result: CLEAR
checked_by: {role: checker, session: o051-recheck-20261101}
executed_session: o051-repair-i129
checked_at: '2026-11-01T00:35:00Z'
health_snapshot: sha256:059f7259a231248cbec0c661ad344a7d5babc6ede0f9fcf8db1b3e994d84ffb2
reviewed:
  base_commit: a8af72b9
  head_commit: ac6d5df5
  files: [packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus/src/api/views.ts, packages/astraeus/tests/viewerHostDom.test.ts, packages/astraeus/tests/sceneViews.test.ts, packages/astraeus/CHANGELOG.md, packages/astraeus-site/tools/validate/journey-views.mjs, packages/astraeus/README.md]
  dependencies: []
issues: []
supersedes: C-134
---

# C-135: O-051 re-check after the I-129 repair

This is the full re-check of O-051 ("Switch between views inside the viewer", T-218 to T-221, I-124) after C-134 returned NEEDS WORK on I-129. It uses C-134's frozen scope lock, coverage matrix (M1-M30), external-boundary matrix and workflow lock, which are not restated here. No axis, dependency layer or interpretation was added. The repair under review is commit `ac6d5df5` (`git diff 5d1ef9dd..ac6d5df5`, 7 files, +72/-14); the Objective baseline stays `a8af72b9`.

**Independence.** This session did not plan, build, repair or coordinate O-051, and did not write C-134. It wrote only:
- gate outputs (`coverage/`, `junit.xml`, `dist/`, packed tarballs, example builds);
- one official health snapshot (recorded above);
- one browser evidence folder, `docs/evidence/browser-20261101T002456Z/`;
- one throwaway probe test plus a copy of the pre-repair `AstraeusScene.tsx` (from `git show HEAD~1:`) as `src/api/zzOldAstraeusScene.tsx`, both copied into `packages/astraeus/`, run with plain `npx vitest run tests/zzRecheckProbe.test.ts` (no junit or coverage written) and deleted before any gate ran, so neither the gates nor the health snapshot saw them. `git status` afterwards shows only the snapshot, the browser folder and the owner's untracked `docs/prds/`, `docs/research/`. Source and log are in the checker scratchpad `probes/` (`zzRecheckProbe.test.ts`, `zzOldAstraeusScene.tsx`, `probe-run-1.txt`);
- this record and the I-129 resolution.

Not a lane (`git-dir` = `git-common-dir`). `docs/prds/` and `docs/research/` were not read or touched. Times UTC.

**Verdict: CLEAR.** I-129 is fixed by the general fix C-134 recommended: `AstraeusScene` applies `time`, `rate` and `view` in three effects, each keyed only on `drawn`, `link` and its own prop (`AstraeusScene.tsx:59-65`), so a change to one prop never re-applies another. An independent probe run against both the repaired and the pre-repair component reproduces I-129 on the old code and shows it gone on the new. Every gate passes, and the one browser run passes 9/9.

## Closure Map (prior Issues)

| Issue | State | Evidence |
|---|---|---|
| I-129 | **closed (verified)** | Probe P1-P3 and P5 fail on the pre-repair component exactly as C-134 reported and pass on `ac6d5df5`; P4, P6-P8 pass on both (no regression). Builder regression tests (`viewerHostDom.test.ts`, "I-129" describe, 3 tests) pass in `test:full` |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (reused from C-134, immutable)
- [x] Turn Acceptance Into Invariants (reused; rule under re-test: each prop takes effect once drawn and only when that prop changes)
- [x] Build The Mandatory Coverage Matrix (reused M1-M30)
- [x] Finite External-Boundary Matrix (reused; unchanged by the repair)
- [x] Workflow And Side-Effect Check Lock (row 8 re-run below)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; nothing to evaluate)
- [x] Perform The Adversarial Pass (on the repair's code paths only)
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

| # | Re-check item | Prior Issue / claim | Frozen cell | Allowed result |
|---|---|---|---|---|
| L1 | Change only `view` after the clock ran; the time stays | I-129 (1) | M15 | blocking |
| L2 | Visitor picks b; host changes only `time`; b stays | I-129 (2) | M16 | blocking |
| L3 | Visitor picks b; host changes only `rate`; view and time stay | I-129 (2), "or `rate`" | M16 | blocking |
| L4 | `setTime` throws in the same render as a view change; the view still applies | I-129 "third, smaller effect" | Workflow row 8 | blocking |
| L5 | A fresh `Date` of the same moment does not seek; an unrelated re-render does nothing | adjacent: README row, existing `timeKey` rule | M15 (React prop path) | blocking |
| L6 | Unknown id and a scene without views go to `onError` as `bad-view` | C-134 re-run list | M21 | blocking |
| L7 | Opening props applied once drawn | T-220 Done When 2 ("once drawn") | M16 | blocking |
| L8 | New `Scene` object: props applied again after rebuild | remediation changed the effects' deps from `definition` to `drawn` | M16 ("once drawn"), representation-switch on the remediation code | blocking |
| L9 | `mount` host `view` / `setView` / `onChange` unchanged | C-134 re-run list | M20 | blocking |
| L10 | `setViews` deep-copies its input | repair claim (C-134 O1) | M7 (was observation) | observation only |
| L11 | CHANGELOG T-219 line | repair claim (C-134 O2) | M30 | blocking for docs accuracy |
| L12 | Phone view buttons asserted at 44 px | repair claim (C-134 O6) | M22 | blocking (browser) |

## Re-run Results

Probe `zzRecheckProbe.test.ts` (happy-dom, the same stubs as `tests/viewerHostDom.test.ts`, two views `a`/`b`, `T1 = startUtcMs + 1000`). Every case is run against `HEAD` (`ac6d5df5`) and against `HEAD~1`'s `AstraeusScene` (`5d1ef9dd`, before the repair). Log: `probe-run-1.txt` (16 tests: 12 passed, 4 failed, all four failures on `HEAD~1`).

| Ledger | Cell | HEAD (repaired) | HEAD~1 (pre-repair) | Class |
|---|---|---|---|---|
| L1 | M15 | `before 1893459001000, after 1893459001000, view b, cause host`: the time kept | `after 1893456001000` (= T1): jumped back 3,000 s (reproduces I-129) | passed |
| L2 | M16 | `time 1893456061000, view b, pressedB true` | `view a, cause host, pressedB false` (reproduces I-129) | passed |
| L3 | M16 | `before 1893456181000, after 1893456181000, rate 600, view b` | `after 1893456001000, view a` (reproduces) | passed |
| L4 | row 8 | `errors [bad-time], view b, pressedB true` | `errors [bad-time], view a, pressedB false` (reproduces the third effect) | passed |
| L5 | M15 | `newCalls 0` (no seek, no publish) | `newCalls 0` | passed |
| L6 | M21 | `[bad-view]`, `[bad-view]` | same | passed |
| L7 | M16 | `time T1, rate 600, view b` | same | passed |
| L8 | M16 | after a visitor picked a, a new `Scene` redraws with `view b, time T1, cause host`: props re-applied | same | passed (no regression) |
| L9 | M20 | Builder `viewerHostDom` mount cases (4) pass unchanged in `test:full`; `viewerLink.ts` and `mount.ts` untouched by the repair | — | passed |
| L10 | M7 | Builder test "copies its input" passes; code `views.ts:44-46` `structuredClone` before every check | — | observation (now resolved) |
| L11 | M30 | CHANGELOG T-219 line now says the selection or follow "is dropped, with the camera handled by the per-view camera rule of the next entry": matches T-220 behaviour | — | passed |
| L12 | M22 | Browser `views/results.json`: `smallestButtonPx` 36 desktop (needs 24), 44 phone (needs 44); step exit 0 | — | passed |

Workflow row 8 (React props), re-traced on `ac6d5df5`: three effects run in declaration order (time, rate, view) when `drawn` turns true, then each only on its own prop. A throw in one is caught by `apply` and sent to `onError` without stopping the others. On a new `Scene`, the rebuild effect sets `definition` back to `undefined` before the new one resolves, so `drawn` goes false and true again and all three re-apply (L8).

## Gates (fresh, HEAD ac6d5df5, 2026-11-01 UTC)

Run from the repository root, in order; logs in the checker scratchpad as `gate-*.log`.

| Command | Result |
|---|---|
| `npm run lint` | pass (00:21:49-00:21:55) |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` | 172 files; 2135 passed, 1 skipped (C-134: 2131 + the 4 repair tests) |
| `npm run test:full` | 172 files; 2135 passed, 1 skipped; coverage written |
| `npm run check:pack` | pass (astraeus 7.17 MB packed / 9.25 MB unpacked, 482 files, stray-file check; every data package within limits) |
| `npm run check:engine-alone` | pass (114 files, 1208 passed, 1 skipped) |
| `npm run check:node-consumer` | pass (8 tests) |
| `git diff --check a8af72b9..HEAD` and `HEAD~1..HEAD` | clean |
| `npm run check:browser` (once, 00:24:56-00:30:48) | 9/9 steps exit 0, 0 error lines, 351 s; `views` 42 s, `hello-react` (the `AstraeusScene` example from the packed tarballs) 4 s. Evidence: `docs/evidence/browser-20261101T002456Z/`; logs `/tmp/astraeus-check-logs-y4WrIQ` |

**Why one browser run.** The browser policy allows one `check:browser` per Full Objective Check and forbids a second run for one change. This re-check is a new Full Objective Check record, and the repair changed a browser script (`journey-views.mjs`, the phone 44 px assertion), which is the policy's own trigger for a browser run; it also changed `AstraeusScene`, which the `hello-react` step loads from the packed package. C-134's run predates both changes, so it could not be reused. The runner has no single-step mode, so the whole set ran once; no other browser job overlapped it.

## Code Health

`savepoint health check O-051` ran after the full gate and saved snapshot `sha256:059f7259a231248cbec0c661ad344a7d5babc6ede0f9fcf8db1b3e994d84ffb2` (created). Verdict: "Code Health does not block clearance". All five instances (complexity, coverage, dependency vulnerabilities, duplication, tests) are optional and report no blocking finding. It neither grants nor withholds clearance.

## Owner Decisions Assessed

No structured owner `exception` and no owner-validation acceptance (`accepted_check`) is recorded on O-051 or its Tasks, so there is no decision to carry forward. The owner's per-Task `check_waiver` entries (T-218 to T-221) and the recorded owner decisions C-134 assessed (stray-file pack rule, split engine and demo load budgets, per-view camera rule with `stay` default, the T-221 owner look) are untouched by the repair, which changed none of `check-packs`, the budget tools or the camera rule. T-221's `owner_validation.required: true` acceptance and completion stay with the owner.

## Issues

None. No materiality actions are required.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [ ] STYLE-02 **One job per function**: unchanged from C-134, `AstraeusShell.tsx:250-278` mixes the view rule with the time fallback (not touched by the repair).
- [x] STYLE-03 **Test branches**: the prop combinations are now tested one prop at a time (`viewerHostDom.test.ts`, I-129 describe).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**: the repair is 7 files, +72/-14 (the Objective as a whole was noted in C-134).

## Owner Validation Still Needed

- The owner's acceptance of T-221 (`owner_validation.required: true`), its completion, and O-051 closure. Per the project rules, the owner commits at Objective close.

## Non-blocking Observations

- **O1.** The three prop effects carry `eslint-disable-line react-hooks/exhaustive-deps` because `apply` is a fresh closure each render. Correct as written (it reads `latest.current`), but a `useCallback`/module-level helper would let the rule stay on.
- **O2.** `viewsOf` now `structuredClone`s its input. A caller who passes a non-cloneable value (a function or class instance inside a view, outside the typed contract) gets a `DataCloneError` rather than a `bad-view` `SceneError`.
- **O3.** `viewChoiceFit` rounds `smallestButtonPx` (`driver.mjs:1705`), so a 43.5 px phone button would pass the 44 px assertion; the measured phone value is exactly 44.
- **O4.** C-134 observations O3 (vendor code counted as demo share), O4 (CODE-02 test file location) and O5 (`both` view's rule and `start` without framing proven only in DOM tests) are unchanged and remain owner follow-ups; O1, O2 and O6 were addressed by the repair.

## Appendix: probe source (abridged; full file in the checker scratchpad `probes/zzRecheckProbe.test.ts`)

```ts
// mocks as tests/viewerHostDom.test.ts; prepared.views = { place: "top-bar", start: "a", views: [v("a"), v("b")] }
import { AstraeusScene as NewScene } from "../src/api/AstraeusScene";
import { AstraeusScene as OldScene } from "../src/api/zzOldAstraeusScene"; // git show HEAD~1:packages/astraeus/src/api/AstraeusScene.tsx
for (const [name, Comp] of [["HEAD", NewScene], ["HEAD~1", OldScene]]) {
  // P1: setup({view:"a", time:T1}); advanceTimersByTime(5000); draw({view:"b"}) -> expect after.time >= before.time
  // P2: press b; draw({time: new Date(T1 + 60_000)}) -> expect time T1+60000 and b aria-pressed true
  // P3: setup({view:"a", time:T1, rate:R0}); advance 3000; press b; draw({rate:R1}) -> rate R1, view b, time unchanged
  // P4: time: new Date(T1) each render plus an unrelated prop -> no new onChange
  // P5: draw({view:"b", time: endUtcMs + 10}) -> onError [bad-time] and b pressed
  // P6: view "zzz" -> [bad-view]; no views + view "a" -> [bad-view]
  // P7: opening {view:"b", time:T1, rate:R1} -> all three applied
  // P8: press a; advance 4000; draw with a new Scene -> props re-applied (view b, time T1)
}
// run: cd packages/astraeus && npx vitest run tests/zzRecheckProbe.test.ts --reporter=verbose --silent=false
// HEAD: 8/8 passed. HEAD~1: P1, P2, P3, P5 failed (I-129); P4, P6, P7, P8 passed.
```
