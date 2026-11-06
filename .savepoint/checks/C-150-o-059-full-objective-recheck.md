---
id: C-150
scope: {kind: objective, id: O-059}
result: NEEDS WORK
checked_by: {role: checker, session: o059-recheck2-20261106}
executed_session: o059-repair2-20261107
checked_at: '2026-11-06T21:43:18Z'
health_snapshot: sha256:9630d3983f8f6355abf49fafe5b95e58a4e62f88f34c445bd99f7984d0f18344
reviewed:
  base_commit: 83fd9964
  head_commit: 0925202e
  files: [packages/astraeus/src/api/planBodies.ts, packages/astraeus/src/api/planCamera.ts, packages/astraeus/src/api/planPaths.ts, packages/astraeus/tests/sceneInputCopies.test.ts]
  dependencies: []
issues: []
unmet: [API-04]
supersedes: C-149
---

# C-150: O-059 Full Objective Check, second re-check

**Verdict: NEEDS WORK.** Every gate passes and all 10 browser steps pass. The walk now does what C-149 asked: a new call with no row fails, and `knownLimitations` and the camera view are copied. One leak remains in the same row C-149 named. `addBody` and `addBodyFromElements` keep `options.readouts` as given, and the table misses it, although the repair note says no other option leaked. I-143 stays open, so I-144 cannot close as `verified` either. No new Issue is opened. **This is the convergence limit: no third repair round starts without the owner's choice** (see Owner Decision Needed).

## Closure Map Of Prior Issues

| Issue | State | Proof |
|---|---|---|
| I-143 | **still open**, narrowed to one list | B1 to B5 proven; B6 fails |
| I-144 | **proof holds, still open** | C-149 A7, A8 stand: no code or test they rest on changed since `39d33686`. A `verified` close needs a `CLEAR` Check |

**Prior owner decisions.** O-059 and its Tasks carry no structured `exception` or `owner_validation.accepted_check`, so no `carried_forward` entries are needed. T-273's acceptance is still unrecorded.

**Independence.** This session did not plan, build, coordinate or repair any O-059 work, and is neither the C-148 nor the C-149 session. Commit `0925202e` and its repair note were treated as claims. Probes and mutations ran in a scratch copy of HEAD; no tracked file changed.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-148's lock reused unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-148 matrix; only code changed since C-149 re-probed, see B7)
- [x] Finite External-Boundary Matrix (browser runner run fresh)
- [x] Workflow And Side-Effect Check Lock (N/A beyond the site sequence, as C-148)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

| # | Re-check item | Prior Issue / claim | Frozen cell | Allowed result | Result |
|---|---|---|---|---|---|
| B1 | Scratch `Scene.setZed` keeping its input | C-149 A5 | Named in I-143 | a test fails | pass: "every public scene call has a row" fails |
| B2 | Scratch `keepZed`, not add/set-like, no row | C-149 A5 | Named in I-143 | a test fails | pass: same test fails |
| B3 | Scratch `SceneCamera.setZed`; `setZed` put on the keeps-nothing list | Repair claim | Named in I-143 | a test fails | pass: camera walk and list test fail |
| B4 | `knownLimitations` copy removed | C-149 A6 | Input axis, mutation after validation | rows fail | pass: 4 rows fail |
| B5 | Camera view copy removed | Repair claim | Same cell | rows fail | pass: 4 rows fail |
| B6 | Every option of a walked call, each leaf and list edited alone: 42 rows of 21 calls and forms, numbers and `Date` times, 934 edits, baselines asserted valid | C-149 A6, "the table holds for a walked call, field by field"; repair claim "no other option leaked" | Same cell | no leak the table misses | **fail:** `addBody` and `addBodyFromElements`, `options.readouts`. Every other field probed holds; `setTime`, `setScale`, `setLook`, `setReach`, `fitOrbit` and the lap orbit rest on the table rows |
| B7 | Input cells on the four calls (C-149 A3) | C-148 input matrix | Normal to boundary | typed `SceneError` | pass by diff: `git diff 39d33686 HEAD -- packages` touches only `planBodies.ts` (one line), `planCamera.ts` and the test; fresh suite passes. Harness not rebuilt |
| B8 | Keeps-nothing limit: `keepZed` listed with a reason | Caller's note | None | observation only | see Observations |
| B9 | Regression from `0925202e` | Recheck brief | Gates | gates pass | pass: no regression |

## What Remains On I-143

`readoutsOf` returns the list it was given (`packages/astraeus/src/api/planPaths.ts:128`), and `BodyPlan` stores that list (`planBodies.ts:161`) with no copy. `addTrajectory` is safe only because it copies first. Run through the public calls:

| Scenario | Expected | Actual |
|---|---|---|
| `addBody(earth, { readouts: [{ kind: "nope" }] })` | refused | `bad-readout` at the call |
| same list valid at the call, then `options.readouts[0].kind = "nope"` | scene unchanged | `check()` passes: the edit skipped the call's check |
| `options.readouts.push({ kind: "nope" })` after the call | scene unchanged | `check()` passes |
| `options.readouts.push({ kind: "distance", to: "moon" })` after the call | rows unchanged | `createMetrics` rows go from "Distance to Sun" to "Distance to Sun", "Distance to Moon" |
| one options object for two scenes, `to` changed between them | first scene unchanged | first scene's `check()` now throws `bad-readout` naming "moon" |

**Why the table misses it (diagnosis, as the checks did not converge).** `scribble` edits every field at once, so `kind` turns invalid in the same pass as `to`. An unknown kind names no body, so the build check skips it and `observe` sees no change. `observe` also prints `createMetrics` only as "fn", so a changed list is invisible there. Skipping `kind` in `scribble` in scratch makes 4 rows fail, so one edit hid the other. The row carries the field but cannot see it.

**Size of the fix.** In scratch, one copy on the return of `readoutsOf` clears all of it: the table's 84 and this harness's 43 pass. Under Strategic fix first, the table should also edit one leaf at a time, so an edit cannot hide another. This is a suggestion; no code was changed.

**Why this is not a new edge case.** It is the frozen cell C-149 A6 failed, in the same row and call, with I-143's own symptoms: an edit skips the call's check, and one object changes another scene. The behaviour is on `main` too, so like `knownLimitations` it counts as proof that the table misses a real case, and the row's claim to cover every option is untrue.

## Gates

| Gate | Result |
|---|---|
| `npm run test:full` (21:33:52-21:35:02Z) | pass: 227 files, 3028 passed, 2 skipped; lines 95.32%, branches 88.59% |
| `lint`, `typecheck` | pass |
| `check:engine-alone` | pass |
| `check:pack` | pass |
| `check:node-consumer`, `check:react-consumer` | pass (react 19.3.1) |
| `check:browser`, run once, 21:36:13-21:41:59Z | pass, 10 of 10 steps exit 0, 346 s: `docs/evidence/browser-20261106T213613Z` |
| `git diff --check main...HEAD` | same three blank lines at file ends as C-148 |

**Browser steps:** smoke, smoke-public-showers, planets-phone, meteor-shower, views, hello-scene, hello-react, hello-planets, public-build-assets, public-addresses.

**Code Health.** `sha256:9630d3983f8f6355abf49fafe5b95e58a4e62f88f34c445bd99f7984d0f18344`, 21:42Z: "does not block clearance". Coverage and tests read stale, both optional, the same pattern C-149 recorded. Complexity, duplication and dependencies report no finding. Supporting evidence only.

## Coverage

Success Conditions 1 and 3 to 7 stay Proven: fresh gates and a fresh browser run, and the repair changed nothing they rest on. Condition 2 stays Proven for the moon calls. API-04 is **Issue** for `addBody` and `addBodyFromElements` readouts only. Files named in the repair note exist.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-143 (remainder) | Low: needs a host editing or reusing a readouts list after the call | Low: an unchecked or extra bar on an info card, or a wrong refusal | Low | Fix now, small, on the owner's choice: copy in `readoutsOf`, table edits one leaf at a time |

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — `planPicker.ts` still copies by hand beside `frozenCopy`; `main.tsx` still repeats the 0.6 s fade.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — 340 files, most of them moved data.

## Observations (non-blocking)

- **The keeps-nothing limit.** A `keepZed` listed with a reason passes all 84 rows, as the repair note says. Judged against the Proof Needed: acceptable, not a blocker. Every call is walked, an unlisted call fails, and a wrong entry needs a false reason written in the test, visible in review. A test cannot tell what a call keeps without a row for it. Only four of the six listed calls have a behaviour test; `stateOf` and `provenanceOf` take an id and a time.
- **Walk blind spots.** `callsOf` reads prototype methods, so a scratch arrow-function field, static method or setter passes unseen. `Scene` has none today (its one own field is `camera`, no setters, no statics).
- **Record slip.** The second repair note on I-143 is stamped correctly; the first keeps the local-time stamp C-149 noted.

## Owner Decision Needed

The default limit is reached: one Check, one re-check, one targeted repair and re-check. The owner chooses one:

1. Fix now: the small repair above, then one more targeted re-check. Recommended, in keeping with Strategic fix first.
2. Follow-up work: move the remaining readouts leak to new work and close I-143 by the owner's decision.
3. Accept: resolve I-143 as `accepted` from the board.

Options 2 and 3 do not give a `CLEAR` Check, so I-144's `verified` close and T-273's acceptance would still need one or an owner decision. T-273 acceptance and the Objective close remain the owner's.
