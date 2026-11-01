---
id: C-142
scope: {kind: objective, id: O-054}
result: NEEDS WORK
checked_by: {role: checker, session: o054-recheck-20261101}
executed_session: o054-repair
checked_at: '2026-11-01T10:13:00Z'
health_snapshot: sha256:61181f799f20b2bda664be38c04348cf2416fc6e6dbaa20f91b65bf1a6c16b65
reviewed:
  base_commit: d778c4e1
  head_commit: 9f5a726d
  files: [packages/astraeus/src/api/viewerClock.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/viewerSelection.ts, packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/tests/listeners.test.ts, packages/astraeus/tests/selectionCauseDom.test.ts, packages/astraeus/tests/viewerHostDom.test.ts, packages/astraeus/README.md, .savepoint/Design.md]
  dependencies: []
issues: []
unmet: [O-054-SC7, T-247]
supersedes: C-141
---

# C-142: O-054 Full Objective Check, re-check after remediation

This is the re-check of O-054, "Give React and plain apps the same handle" (G-016), after C-141 returned NEEDS WORK. It reviews repair commit `9f5a726d` (`git diff d778c4e1..9f5a726d`: 14 files, +214/-27). Its scope is C-141's frozen scope lock, unchanged: the Objective diff `main..9f5a726d`, Tasks T-240 to T-249 (all `done` with owner Task-check waivers), and C-141's matrix rows 1 to 20.

**Independence.** This session did not plan, build, coordinate or repair O-054, and did not write C-141. It is not a lane (`git rev-parse --git-dir` and `--git-common-dir` both print `.git`). It wrote only:

- gate outputs (`coverage/`, `junit.xml`, `dist/`, scratch folders)
- one official health snapshot
- one browser evidence folder, `docs/evidence/browser-20261101T100635Z/`
- one temporary probe test, `packages/astraeus/tests/zzC142probe.test.ts`, removed after use (a copy is in the checker scratchpad)
- two planted edits to `viewerSelection.ts` and one temporary checkout of the seven pre-repair source files at `d778c4e1`, each restored with `git checkout` and confirmed by `git diff --quiet -- packages`
- this record and history entries on I-137 and I-138

It did not touch `docs/prds/`, `docs/research/`, the three modified G-012/G-013/G-014 `Release.md` files or the router, and it committed nothing.

**Verdict: NEEDS WORK.** Every gate passes, and I-138's repair holds. The I-137 repair fixes every case C-141 reported: host `setTime` now reports `host`, and playback reports `playback`. But it introduces a regression in a frozen cell. When a host `setView` switches to a view whose camera rule frames another object, the viewer selects that object, and `onSelect` now reports this as `cause: "visitor"`. Before the repair it reported `host`. I-137's own Proof Needed says "the visitor and host `setView` cases keep their current causes", so I-137 stays open.

## Closure Map Of Prior Issues

| Issue | State | Proof |
|---|---|---|
| I-137 (onSelect cause on a drop caused by time) | **Still open** | Rows R1 to R7 pass. R8 fails: a host `setView` whose view camera rule selects its framing target reports `visitor`. This is a regression from the repair. |
| I-138 (listener scan misses viewerSelection; no throwing onSelect case) | **Proof met; left open** | R9 and R10: planted break B and a `forEach` variant both fail `listeners.test.ts`. As in the project's practice (C-092 and I-049), `verified` is recorded with the CLEAR Check that closes the Objective. |

**Owner decisions.** No owner acceptance or exception exists on O-054 or its Tasks, and every Task has `owner_validation: {required: false}`. Nothing carries forward, and no `carried_forward` entry is needed.

**Convergence.** This is the one full re-check after remediation. One in-scope failure remains, so one targeted remediation and re-check is allowed. After that, stop and ask the owner. The failure is a regression from the repair itself, not a newly widened scope.

**Diagnosis.** The repair replaced the `selectionCause` ref, which covered every selection change during a host view-switch commit, with a `byMove` flag. Only the shell's fallback drop sets that flag (`AstraeusShell.tsx:258`). In the same view-switch effect, `applyViewRule` then selects the rule's framing target through `onSelectionChange(target.id)` with no `byMove` (`AstraeusShell.tsx:286-288`). `App.updateSelectedObject` therefore calls `publishSelection(state, false)`, which names `visitor` (`viewerLink.ts:173`). `applyViewRule` has one caller, that move-driven effect (`AstraeusShell.tsx:268`). So a selection it makes always follows a time or view move, and the general fix is to mark it `byMove` too. For the visitor's own view switch, the last mover is then `visitor`, which stays correct.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-141's lock reused unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-141 rows re-run; ledger below)
- [x] Finite External-Boundary Matrix (unchanged: `check:react-consumer` registry install)
- [x] Workflow And Side-Effect Check Lock (mount workflow unchanged by the repair; lifecycle suite passes)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advice only; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger And Results

Probe source: `zzC142probe.test.ts` (real `Scene` and real `prepareScene`; only the 3D canvas and the star catalogue are stubbed; fake `setInterval` and `performance`). The scene has `earth`, path `pa` (four samples over 30 minutes from T0), an optional full-span path `pb`, and a 100-day timeline. Command: `npx vitest run packages/astraeus/tests/zzC142probe.test.ts --silent=false`. The run passed 9 of 9 tests (V1 records and does not assert). Its output is below.

| # | Re-check item | Prior Issue / claim | Frozen cell | Allowed result | Actual | Result |
|---|---|---|---|---|---|---|
| R1 | P6a: host `setTime` past the path's end | I-137 | C-141 row 13 | `host` | `[["pa","visitor"],["earth","host"]]` | Pass |
| R2 | P6b: playback past the end, started by host `setPlaying(true)`; P6b2: started by the visitor's Play button | I-137 | row 13 | `playback` | both `[["pa","visitor"],["earth","playback"]]` | Pass |
| R3 | P6c: visitor timeline seek past the end, after a host move | I-137, repair claim | row 13 | `visitor` | `[["pa","visitor"],["earth","visitor"]]` | Pass |
| R4 | P6d: visitor pick after a host move | repair claim | row 12 | `visitor` | `[["pa","visitor"],["pb","visitor"]]` | Pass |
| R5 | P6e: host `setView` drop, then a visitor view drop | I-137 Proof Needed ("host and visitor setView keep their causes") | row 12 | `host`, then `visitor` | `[["pa","visitor"],["earth","host"],["pa","visitor"],["earth","visitor"]]` | Pass |
| R6 | P6f: no change (the same pick again, a host move that keeps the path, `setPlaying(false)` again, 2 s of ticks) | row 12 "no change" | row 12 | no report | `[["pa","visitor"]]` | Pass |
| R7 | Builder's edge (E1): a host move leaves the clock paused, then a later drop with no further move | repair claim (`#mover` stale) | row 13 × "what moved them" | no stale `host` | 2 s of paused ticks report nothing (`ViewerClock.publish` returns false, so `#mover` is unchanged). The next drop needs a move: a visitor view switch then reports `[..., ["earth","visitor"]]` | Pass (see Reachability) |
| R8 | V1: host `setView("b")` while the camera focuses `pa`, where view `b` hides `pa` and has `camera: { focus: "pb" }` | I-137 Proof Needed; the repair's removed `selectionCause` path | row 12 (view drop by host) | every report `host` | `[["pa","visitor"],["earth","host"],["pb","visitor"]]`. Pre-repair source (the seven files at `d778c4e1`, same probe): `[["pa","visitor"],["earth","host"],["pb","host"]]`. The visitor's own switch gives `[["earth","visitor"],["pb","visitor"]]` on both | **Fail: I-137 stays open** |
| R9 | Planted break B: `ViewerSelection.publish` loops over its own listeners | I-138 | row 8 | a named test fails | `listeners.test.ts` + `lifecycle.test.ts`: 2 failed, 42 passed. The scan fails with `viewerSelection.ts: expected ... not to match /for \(const \w+ of .../`, and the throwing-onSelect case fails | Pass |
| R10 | Break B2: `[...this.#listeners].forEach(...)` instead of `callListeners` | I-138 (bypass of the same rule) | row 8 | a named test fails | 2 failed. The scan fails with `viewerSelection.ts: expected ... to contain 'callListeners('` | Pass |
| R11 | The rule-derived scan set | I-138 | row 8 | includes every listener-holding api part | `viewerCamera.ts viewerClock.ts viewerLink.ts viewerSelection.ts viewerZones.ts`, plus a guard that the known four stay in it | Pass |
| R12 | Rows 1 to 7, 9 to 12 and 14 to 20 | C-141 | rows as listed | unchanged | Every suite behind them passes in both `test:full` runs (191 files, 2339 passed, 1 skipped). `lifecycle`, `viewerHostDom`, `viewerHostReady`, `viewerLinkPin`, `hostCameraDom`, `errorRule`, `apiSurface` and `apiRules` are all green. `check:browser` passes (row 18, the hello-react step) | Pass |

**Reachability of the builder's edge (R7).** `AstraeusShell`'s drop effect (`AstraeusShell.tsx:251-277`) runs only when `snapshot.timeUtcMs`, `viewId`, `experience`, `selectedObjectId` or `activePresetId` changes. Every way time or the view changes publishes a cause before React runs that effect:

- the 100 ms tick calls `setClockSnapshot` and then `publish("playback")` in the same callback (`App.tsx:378-386`)
- a visitor's seek, rate or play publishes `visitor`
- a visitor's view choice publishes `visitor`
- a host call publishes `host` via `#afterHost`

A paused clock gives an unchanged reading, so `#mover` keeps the last real mover, and no drop follows without a further move. No real path through time or the view reaches a stale `host`. The non-move triggers are a visitor's own pick or preset, which name `visitor` with no `byMove`. The one remaining trigger, `experience` changing for another reason, is observation O2.

**Adjacent coincidence (E2, observation).** Playback crosses the path's end, and within the same 100 ms, before the next tick, the host calls `setPlaying(true)`. The drop reports `host`, and `onChange` reports `host` for the same reading. This matches the documented rule ("a drop takes the cause `onChange` reported for the move that caused it"). It is not an Issue.

## Issues

**I-137 (still open; T-247; Success Condition 7; API-02, ARCH-02).**

- **Violated.** I-137 Proof Needed: "The visitor and host `setView` cases keep their current causes". Also the documented `cause` meaning in `viewerHandle.ts:38` and `viewerSelection.ts:11`, where `host` means "a host call ... moved the clock or view and the selection followed".
- **Smallest scenario.** R8/V1. It needs a view whose `camera` is `{ focus: id }` or `{ follow: id }` (or `"start"` with a start preset on an object), and a host `setView` to that view while the camera focuses or follows an object the view hides.
- **Expected.** The framing target's report has `cause: "host"`, as it did before the repair.
- **Actual.** `cause: "visitor"`.
- **Code.** `AstraeusShell.tsx:286-288` calls `onSelectionChange(target.id)` without `byMove`, so `App.tsx:372` calls `publishSelection(stateNow(), false)` and `viewerLink.ts:173` picks `"visitor"`.
- **Missing test.** Neither `viewerHostDom` nor `selectionCauseDom` has a view with a framing camera rule crossed with a host `setView`.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-137 (R8 regression) | Low-Medium. It needs views with a framing camera rule, the camera on an object the target view hides, and a host-driven switch. All of these are supported, documented `setViews` features | Medium. A host that tells visitor choices from its own by `cause` would treat its own switch as a visitor's pick. This is the same harm as the original I-137 | Medium | Fix now: a targeted repair. Mark the `applyViewRule` selection `byMove`, or more generally treat every selection the move-driven effect makes as `byMove`. Add a DOM case for a host and a visitor switch to a view with a framing camera rule. Then one targeted re-check. |

## Gates

All run on HEAD `9f5a726d`, with the probe file removed. Logs are in the checker scratchpad (`gate-*.log`, `gates-summary.txt`).

| Command | Result |
|---|---|
| `npm run lint` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 |
| `git diff --check main...HEAD` | clean |
| `npm run test:full` #1 (10:03:19-10:04:28Z) | 191 files passed, 2339 passed, 1 skipped; Lines 94.68%; exit 0 |
| `npm run test:full` #2 (10:04:28-10:05:36Z) | 191 files passed, 2339 passed, 1 skipped; Lines 94.68%; exit 0; no flaky case |
| `npm run check:engine-alone` | pass in 20.6 s |
| `npm run check:pack` | pass (14.5 s) |
| `npm run check:node-consumer` | pass |
| `npm run check:react-consumer` | pass; newest and installed react 19.3.1; `AstraeusScene` server render |
| `node tools/build-example.mjs hello-react` | exit 0 |
| `npm run check:browser` (once, 10:06:35-10:12:29Z, HEAD 9f5a726d) | exit 0. Smoke, smoke-public-showers, planets-phone, meteor-shower, views (a visitor switch and a host `setView`), hello-scene, hello-react, public-build-assets and public-addresses all `exit=0`, `error-lines=0`; total 354 s. Evidence `docs/evidence/browser-20261101T100635Z/`; logs `/tmp/astraeus-check-logs-FILCDL` |

## Code Health

`savepoint health check O-054` ran right after the second `test:full`. It created snapshot `sha256:61181f799f20b2bda664be38c04348cf2416fc6e6dbaa20f91b65bf1a6c16b65`. The verdict was "Code Health does not block clearance". Complexity, coverage, dependency vulnerabilities, duplication and tests are all optional, and none reports a blocking finding. This is supporting evidence only.

## File Reality

Every file named in the I-137 and I-138 repair entries exists: `viewerClock.ts`, `viewerLink.ts`, `viewerSelection.ts`, `viewerHandle.ts`, `App.tsx`, `viewerPort.ts`, `AstraeusShell.tsx`, `listeners.test.ts`, `selectionCauseDom.test.ts`, `viewerHostDom.test.ts`, `README.md` and `Design.md`. The removed `selectionCause` ref and `hostSetView` wrapper are gone from `App.tsx`, as claimed. There are no phantom files.

## Observations (non-blocking)

- **O1. E2 coincidence (in scope, not an Issue).** See above. It is consistent with `onChange` and with the documented rule.
- **O2. Outside the frozen lock: a drop not caused by a move, through `experience` changing.** `shellExperience` also depends on `starStatus` and `runtime.sky.visible` (`App.tsx:260`). If such a change ever removed the selected object, the fallback drop would carry `byMove` with whatever moved last. No probe was run, because the lock's axis is "menu, view switch, time". It is recorded for follow-up only.
- **O3. README and doc comments match the repaired meaning.** The prototype note from C-141 O1 is added to the README, which closes that observation.
- **O4. The listener scan's file rule `/#listeners|Listeners\b/` also matches files that only import `callListeners`.** Today that is `viewerLink.ts`, which holds no set. This is harmless: the `callListeners(` requirement applies only to files with `#listeners` and `.add(listener)`.

## Owner Validation Still Needed

None is required by the Tasks. O-054 closes only after I-137 is repaired and passes a targeted re-check, which then records I-137 and I-138 as `verified`, or after the owner accepts I-137.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches**: the view-camera-rule selection after a host `setView` (`AstraeusShell.tsx:286-288`) has no cause test, which is how R8 slipped.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**: the cause now comes from the last published mover, and the scan list is derived.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
