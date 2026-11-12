---
id: C-177
scope: {kind: objective, id: O-071}
result: CLEAR
checked_by: {role: checker, session: o071-recheck-20261112}
executed_session: o071-repair-20261112
checked_at: '2026-11-12T11:28:00Z'
health_snapshot: sha256:32ef0a3cd42e00b5f9307fa1367b289ac3650991b24da349cbb5ca4881c2b6e4
reviewed:
  base_commit: 0d1829c0
  head_commit: d0ad5ab0
  files: [packages/astraeus/src/app/App.tsx, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/tests/shownDuringMenu.test.ts, packages/astraeus/tests/lifecycle.test.ts, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: C-176
---

# C-177: O-071 Full Objective Recheck

Fresh session; did not plan, build or repair O-071. Wrote only this record and the I-174/I-175 resolutions. Scope lock, matrix and gates are C-176's, unchanged. Repair diff reviewed: `git diff HEAD~1 HEAD -- packages/` (48423eef..d0ad5ab0, 4 package files, +68/-8), plus the one-sentence Design correction.

## Closure map

| Issue | Status | Basis |
|---|---|---|
| I-175 | Closed (verified) | Proof Needed met; see below. |
| I-174 | Closed (verified) | Proof Needed met; see below. |

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope (C-176 lock, immutable)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-176 matrix re-run; SC4 host/story cell re-tested)
- [x] Finite External-Boundary Matrix (n/a, as C-176)
- [x] Workflow And Side-Effect Check Lock (n/a, as C-176)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (n/a)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality (every file named in the I-174/I-175 repair entries exists)
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission ledger

| Probe | Prior Issue / claim | Frozen cell | Allowed result |
|---|---|---|---|
| setCamera / story panel camera x {host setTime, visitor scrub, playback} x {mount, AstraeusScene} | I-175 | C-176 "SC4 camera, host or story path" | hold, or Issue |
| `focus` and `lookOut ... direction: pa` by setCamera; story step `focus`; exact edge `t = EDGE` | I-175 ("following or focused") | same cell; SC2 edge `start <= t < end` | hold, or Issue |
| Negative: follow pa at EDGE-1; follow earth across edge; follow pa then follow earth across edge; re-aim after a hold | I-175 adjacent (camera must not hold for a shown target) | same cell | no hold, or Issue |
| Preset path test unchanged and passing | I-175 Proof Needed | C-176 "SC4 camera, preset path" | pass, or Issue |
| lifecycle story-step test under load | I-174 Proof Needed | Full gate | pass, or Issue |

## Re-check results

**I-175.** `App.tsx` now records the ids each camera request names (`noteCameraIds`, via `cameraIdsOf`) on `updateCameraRequest` (presets, turn-to-figure) and `setCamera` (host and story panel, which calls `setCamera`); the shell calls `onTimeShown(snapshot.timeUtcMs)` on each clock snapshot, before the preset and view-rule handling, and `holdCameraOffShown` sends `{ kind: "hold" }` once any named id is in `hiddenWithShownSpans(...)` at that time, clearing the names so it holds once. Every writer of `controls.cameraRequest` in `src/` was traced: the only others are the rig's own first-frame and consume paths (`sceneCamera.ts` 92-96, 227).

- Repair's table test (`shownDuringMenu.test.ts`, 12 cases: {setCamera, story panel camera} x {host setTime, visitor time change, playback} x {mount, AstraeusScene}): pass on HEAD; all 12 fail with `App.tsx` and `AstraeusShell.tsx` swapped back to 48423eef (checker run, files restored with `git checkout HEAD --`).
- Checker probe (temporary file, removed; copy kept outside the repo), 12 cases on both paths: setCamera `focus pa` to exactly EDGE -> hold; `lookOut earth toward pa` to EDGE -> hold; story step `focus pa`, host setTime EDGE -> hold, then `setCamera({follow: "pb"})` after the edge stays `follow pb` (no stale hold); `follow pa` to EDGE-1 -> no hold; `follow earth` across edge -> no hold; `follow pa` then `follow earth` across edge -> no hold. All 12 pass on HEAD; the 6 hold cases fail on the unfixed source.
- Preset path: "the shell: the camera at a drop" unchanged by the diff (only additions after line 176) and passes on both source versions.

Proof Needed met: follow and focus by setCamera and by a story panel hold on playback, host and visitor moves, on both embedding paths; the test fails on the prior build; preset behaviour and test unchanged. SC4 and T-311 Done When 3 now Proven.

**I-174.** The five fixed 20 ms `tick()` waits are replaced by `vi.waitFor` on the asserted effect; every original `expect` line is kept unchanged after the wait (no assertion loosened, no setup changed). Load evidence: `test:full` alone (load 1.8) 255/255 files; `test:full` alongside 8 CPU-burning loops on 16 cores, 11:25:04-11:26:37Z, load average rising to 13.4 (above the 6-8 in which I-174 was seen): 255/255 files, 3,805 passed; the story test alone 5 times under 12 burning loops (load 12.5): 2/2 each. With the repair builder's three loaded runs in which this test passed every time (their red was unrelated 5 s timeouts from two full suites at once, i.e. CPU starvation, not this test), the test passed in every loaded run seen. Judged met: the brief asked for one full run alongside moderate load, not two full suites, which starve unrelated timed tests and prove nothing about this one.

**C-176's other findings.** Every other matrix row is unaffected by the diff (no change to `shownDuring.ts`, `viewHiding.ts`, `sceneFrame.ts`, planning, menu or selection code) and their tests pass in the full gate. The Design observation in C-176 (`hiddenWithShownSpans` "called only from `hiddenOf`") is corrected by the repair's Design sentence, which now names the `App.tsx` uses. No owner decisions on O-071 to carry forward (the T-310/T-311 Task-check waivers are not Checks and cover no criterion).

## Gates (HEAD d0ad5ab0)

- `npm run test:full` 11:17:19-11:18:34Z: pass, 255 files, 3,805 passed, 2 skipped. A second run under load (above) also passed.
- `check:engine-alone` pass (11:18:50-11:19:15Z, 24.5 s); `check:pack` pass (14.6 s); `check:node-consumer` pass; `measure:example` pass (11:19:38-11:19:41Z); `git diff --check main...HEAD` clean.
- `npm run check:browser` once, alone, 11:19:44-11:24:49Z: pass, 12 steps, 305 s (limit 320 s); evidence `docs/evidence/browser-20261112T111944Z`.

## Code Health

Snapshot `sha256:32ef0a3cd42e00b5f9307fa1367b289ac3650991b24da349cbb5ca4881c2b6e4` (created 11:18:38Z, after the unloaded full run): "Code Health does not block clearance". Complexity, coverage, vulnerabilities, duplication and tests: no finding. Supporting evidence only.

## Issues

None. No materiality actions are required.

## Observations (non-blocking)

- Still as in C-176: a dropped selection falls back to the first shown object rather than to nothing; `shownDuring` moments accept fractional milliseconds; a story panel's camera on an unshown object is skipped without a host report.
- The repair's own table test covers `follow` only; `focus` and `lookOut` toward an id were proven by this Check's probe, not by a kept test.
- After a hold, `hostCameraRequest` still holds the host's earlier `follow` (only `cameraRequest` becomes the hold); it is read on the first frame and by `hostCameraSet` until the next view switch. Not reproduced as a fault here.

## Owner validation

Owner closes O-071 (all owned Tasks done; this Check current; I-175 and I-174 resolved). Appearance remains the owner's call on `localhost:5490`.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** — camera loss on a span end is now decided for whatever named the camera's target (`App.tsx` `holdCameraOffShown`); the shell's preset path still decides too, both from `shownAt`.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
