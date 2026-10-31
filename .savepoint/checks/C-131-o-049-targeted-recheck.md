---
id: C-131
scope: {kind: objective, id: O-049}
result: CLEAR
checked_by: {role: checker, session: o049-recheck-20261031}
executed_session: o049-repair-20261031
checked_at: '2026-10-31T13:25:00Z'
health_snapshot: sha256:6066fe187ff794fc2997a1205b2154a705c1f2b5ff34e3c3afa49a9f35f432da
reviewed:
  base_commit: 34f33db2
  head_commit: f973b6a3
  files: [packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus/tests/sceneCatalogueReach.test.ts, packages/astraeus/CHANGELOG.md, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: C-130
---

# C-131: O-049 targeted re-check after the I-123 repair

This is the re-check of O-049 ("Make every listed moon addable", T-210 to T-212, escalated from I-122) after C-130 returned NEEDS WORK on I-123. It uses C-130's frozen scope lock, coverage matrix and boundary matrix, which are not restated here. No new axes were added.

**Independence.** This session did not plan, build, repair or coordinate O-049. It wrote only these things:
- gate outputs (`coverage/`, `junit.xml`, `dist/`, example builds);
- two health snapshots (the official one is recorded above);
- the browser run folder `docs/evidence/browser-20261031T131212Z/`;
- two throwaway probe files (`packages/astraeus/src/app/zzCheckProbe.ts`, created, tested and deleted each time; `test:full` was rerun afterwards so the health reports are fresh);
- this record and the I-123 resolution.

**Baseline.** The branch is `o049-listed-moons`, which is not a lane. HEAD is `f973b6a3`, the repair commit after C-130's `10325ca2`. The scope base is `34f33db2`. The repair diff covers `driver.mjs` (+25), `browser-smoke.mjs` (+6/-12), `sceneCatalogueReach.test.ts` (+31), CHANGELOG (1 line), Design.md (1 line), the I-123 and T-212 notes, and the builder's evidence folder `browser-20261031T130145Z`. No engine source changed. `docs/prds/` and `docs/research/` were not read or touched. Times are UTC; Node is v24.16.0.

**Verdict: CLEAR.** The one fresh `npm run check:browser` passed every step: smoke passed 18 of 18 loads, and synthetic-journey passed at both sizes. The repair fixes the cause generally: after each journey seek, the check now waits until the scene's own readouts confirm the clock, the bodies and the named ids. Every other gate passed fresh.

## Closure map of prior Issues

| Issue | State |
|---|---|
| I-123 (synthetic-journey desktop smoke not ready after a seek) | **Closed (verified)** by this Check |
| I-122 (Uranus's main moons have positions but no bodies) | Already resolved as `escalated` into O-049. O-049 is the repair, and this CLEAR is its Objective-level proof. No change to the Issue record |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-130's lock reused unchanged)
- [x] Turn Acceptance Into Invariants (C-130)
- [x] Build The Mandatory Coverage Matrix (C-130's rows; row 17 re-run, rows 13/14/18 re-checked against the repair)
- [x] Finite External-Boundary Matrix (the "timeout / readiness after seek" cell re-run)
- [x] Workflow And Side-Effect Check Lock (unchanged; no engine code changed)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature in scope)
- [x] Perform The Adversarial Pass (on the repair code)
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
| 1 | One fresh `check:browser` passes every step at both sizes | I-123; `T-212-browser-gate`, `O-049-proof-browser` | Row 17; boundary "timeout / readiness after seek" | Blocking |
| 2 | Journey seeks wait on scene readouts instead of a fixed sleep (general, not Uranus-specific) | I-123 Proof Needed; repair claim | Boundary "timeout / readiness after seek" | Blocking |
| 3 | Journey time recorded (back near 35 s, or left to the owner) | I-123 Proof Needed | Boundary "timeout / readiness after seek" | Record only |
| 4 | The catalogue guard catches a built-in default; spot-check of the allowlist reasons | C-130 observation 1; repair claim | Row 14 (guard generality was "partial", an observation) | Non-blocking unless the row 14 fix regresses |
| 5 | Design.md pack limit 470; CHANGELOG first-download figures | C-130 observations 2, 4; repair claim | Rows 13, 18 | Blocking only if the documentation becomes wrong |
| 6 | Full gate, engine-alone, pack, node-consumer, `git diff --check` | C-130 gate list | Scope lock item 1 | Blocking |

## Re-check Results

| # | Expected | Actual | Result |
|---|---|---|---|
| 1 | All 8 steps pass, synthetic-journey ok at desktop and phone | `docs/evidence/browser-20261031T131212Z/`, run once 13:12:12Z–13:16:42Z with no other browser job running. Smoke passed 18 of 18 (`failed: 0`). smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-build-assets and public-addresses all exited 0, with error-lines=0. No screenshots. synthetic-journey: desktop 71.4 s, phone 71.0 s. Near Uranus, all five moons draw as spheres when approached (679 px desktop, 637 px phone) | Pass |
| 2 | Each journey seek polls until the clock equals the settled slider instant, at least one body is reported, and the named ids are drawn; it fails after a time limit, saying what it last saw | `driver.mjs` `waitForSceneReady` / `seekToReady` do exactly this. The settled instant is read back from the slider, so step snapping cannot cause a false miss. The time limit is 60 s at 250 ms polls. All five journey seeks in `browser-smoke.mjs` use `seekToReady`: the two encounter dates, the end, near Saturn and near Uranus. Nothing in it names Uranus | Pass |
| 3 | Recorded | 71 s, against 35 s before O-049 (C-129). It is **not** back near the old figure. Most of the extra time is T-212's own added near-Uranus case: five moons picked and approached, each with a 1.5 s ease, a 60-step zoom (≈1.8 s) and a 1 s settle, so about 21 s of fixed steps. Uranus moon data loading accounts for the rest. The repair adds no measurable time (builder run 72.8 s, T-212 run 73.8 s). This is the cost of the new proof, not a regression. Accepting the longer time is left to the owner | Recorded (owner) |
| 4 | Guard fails on a new unlisted default | **Probe:** a temporary `src/app/zzCheckProbe.ts` declaring `function probeLookup(id, source: BodyCatalogue = builtInCatalogue)` across two lines made the case fail (`expected [ 'zzCheckProbe.ts:probeLookup' ] to deeply equal []`). With the probe deleted, all 3 cases passed. All 11 allowlisted functions were traced to their callers; all are safe today, but three reasons are inaccurate (observation 2), and an arrow-function default escapes the scan (observation 3) | Pass (row 14 unchanged; observations) |
| 5 | Documentation matches measurement | Design.md now says 470, and `tools/check-packs.mjs` sets `files: 470` (measured 470/470). `node tools/measure-example.mjs` gave a first-open of 1,638,245 B raw / 468,717 B gzip, the same as the CHANGELOG | Pass |
| 6 | All pass | See Gates | Pass |

## Gates (fresh, HEAD f973b6a3, 2026-10-31 UTC)

| Gate | Result |
|---|---|
| `git diff --check 34f33db2 HEAD` | clean |
| `npm run lint`, `npm run typecheck`, `npm run build` | pass |
| `npm run test:full` | pass: 162 files, 2030 passed, 1 skipped (+1, the new guard case). Statements 91.7%, branches 86.4%, functions 91.99%, lines 94.29%. Run at 13:10Z, then again at about 13:17Z after the probe files were deleted, with the same result |
| `npm run check:engine-alone` | pass (16.3 s) |
| `npm run check:pack` | pass (astraeus 470 files, limit 470) |
| `npm run check:node-consumer` | pass |
| `node tools/measure-example.mjs` | first-open 1,638,245 B raw / 468,717 B gzip |
| `npm run check:browser` | **pass**. Run once, all 8 steps, total 270 s. Evidence `docs/evidence/browser-20261031T131212Z/` |

## Code Health

`savepoint health check O-049 .` first ran at about 13:17Z. It created snapshot `sha256:901cace8…`, which reported coverage and tests as stale because the probe files had touched `src/app` after the first `test:full`. That snapshot is not used as evidence. After the rerun of `test:full`, the second run gave `sha256:6066fe187ff794fc2997a1205b2154a705c1f2b5ff34e3c3afa49a9f35f432da` (created), with the verdict "Code Health does not block clearance". Complexity, coverage, vulnerabilities, duplication and tests all returned "no finding". The verdict is supporting evidence only.

## Owner Decisions Assessed

There is no structured `owner_validation.accepted_check` or `exception` on O-049 or its Tasks, so there are no `carried_forward` entries. The recorded decisions are listed below. None of their scopes changed in the repair, which touched only browser scripts, a test, and documentation figures:
- the Task-check waivers on T-210, T-211 and T-212;
- the owner's look at 2026-10-31T12:36:46Z;
- the Apollo 11 raw budget of 4,490,000 B. public-build-assets passed again this run.

## Issues

No Issues. No materiality actions are required.

## Code Style Review

- [x] STYLE-01 **One job per file** — the readiness wait sits in the shared driver, and the scripts only call it.
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** — the guard's "unlisted" and "stale entry" branches both assert.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries** — the wait fails with what it last saw.
- [ ] STYLE-07 **One source of truth** — three allowlist reasons in `sceneCatalogueReach.test.ts` do not match their callers (observation 2).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** — the repair is +62/−13 across code and tests.

## Owner Validation Still Needed

- T-212 (`owner_validation.required: true`, status `in_progress`, stage `audit`): the owner's look passed on 2026-10-31. The owner may now record `accepted_check: C-131` and set T-212 done. T-210 and T-211 are already done.
- O-049 can close once T-212 is done. This Check is CLEAR and I-123 is resolved.
- Synthetic-journey smoke time is 71 s, not back near 35 s (re-check row 3). Accepting this is the owner's call, and it does not block.

## Non-blocking Observations

1. **The sun-path seeks no longer wait for anything.** In `browser-smoke.mjs` `sunPathChecks` (lines 71–84), the three `seekToFraction` calls are followed by `waitForSceneReady(page)` with no `timeUtcMs`. The only conditions left are "at least one body" and no named ids. Those already hold before the seek, so the wait can return before the scene has drawn the new time. It replaced a 500 ms sleep. The synthetic-probe load dropped from 9.8–10.6 s to 5.0–5.2 s, which fits. As a result, the O-046 check that the probe path line does not move between two times can now pass on a stale readout. A real regression would then go unseen. This is a loss of test power for an O-046 check, outside O-049's frozen lock, and the gate is not red. A general fix: have `seekToFraction` return the settled slider value, and pass it as `timeUtcMs` (a `seekToFractionReady`), as `seekToReady` already does.
2. **Three allowlist reasons are inaccurate. All three functions are safe.**
   - `trackedMetrics.ts:createReadoutMetrics`: the reason says "the scene passes its catalogue", but `api/scene.ts:769` passes none. It is safe because `scene.ts:942` limits readout targets to built-in ids.
   - `experienceDefinition.ts:validatePathSpec`: the reason says "the definition passes its catalogue", but the `PathView` constructor (`PathView.ts:142`) calls it without one. It is safe because `addTrajectory` centres are built-in only (`scene.ts:353`).
   - `catalogueItem.ts:catalogueItem`: the reason says "built-in by definition", but `scene.ts:639` passes the scene catalogue.

   The other eight reasons match their callers.
3. **The guard misses arrow functions.** A temporary `export const probeLookup = (id, source: BodyCatalogue = builtInCatalogue) => …` in `src/app` passed the guard. No such arrow function exists today. Widening the regex, or a behavioural mount test, would close this gap.
4. **Other scripts still use fixed sleeps.** `journey-meteor-shower.mjs:35` (`seekToFraction`) and `check-hello-scene.mjs:37` (`seekTo`) are outside I-123's claim, which named `browser-smoke.mjs`, and both passed. They could move to the driver wait in the same follow-up as observation 1.
5. C-130 observations 3, 5 and 6 still stand:
   - listed-moon reach covers `addBody` only;
   - the Apollo 11 raw budget has 3,869 B of headroom, and the astraeus pack count is at its limit (470/470);
   - Europa's JPL period caveat.

   C-130 observations 2 and 4 (Design 464, CHANGELOG figures) are fixed.
