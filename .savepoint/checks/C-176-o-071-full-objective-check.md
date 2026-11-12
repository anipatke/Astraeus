---
id: C-176
scope: {kind: objective, id: O-071}
result: NEEDS WORK
checked_by: {role: checker, session: o071-check-20261112}
executed_session: o071-run-20261112
checked_at: '2026-11-12T11:05:00Z'
health_snapshot: sha256:3b76f09226388e11cf82fcf9908958fe45ca1dcd03f70d0212e8285a343b6322
reviewed:
  base_commit: 0d1829c0
  head_commit: 6bcc249b
  files: [packages/astraeus/src/api/shownDuring.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/planBodies.ts, packages/astraeus/src/api/planPaths.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/app/viewHiding.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/shell/ObjectControls.tsx, packages/astraeus/src/shell/experience.ts, packages/astraeus/src/shell/objectModel.ts, packages/astraeus/tests/shownDuring.test.ts, packages/astraeus/tests/shownDuringMenu.test.ts, packages/astraeus/tests/domSetup.ts, packages/astraeus/api-surface.lock.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, examples/hello-scene/src/main.js, .savepoint/Design.md]
  dependencies: []
issues: [I-175]
unmet: [O-071-SC4, T-311-DW3]
supersedes: null
---

# C-176: O-071 Full Objective Check

Fresh session; did not plan, build or repair O-071. Wrote only this record and I-175. Baseline `git diff main...HEAD` (0d1829c0..6bcc249b, 26 files). T-310 and T-311 were reviewed in full under their recorded owner check waivers.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (n/a: no server, provider or subprocess in scope; `check:browser` is a gate only)
- [x] Workflow And Side-Effect Check Lock (n/a: no persistence or multi-step writes; per-frame presentation only)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (n/a)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: first run)
- [x] Verify File Reality (every file named in T-310/T-311 evidence exists)
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. O-071 SC1-SC7 and Decisions; T-310, T-311 Done When; ARCH-02, ARCH-03, API-01, API-02, API-04, API-05, API-07, TEST-01, TEST-03; Full gates.
2. Entry points: `addBody`, `addBodyFromElements`, `addTrajectory` (`shownDuring`); `mount` and `AstraeusScene` handles (`setSelected`, `setCamera`, `setTime`, `setPlaying`, `onSelect`, `setPanel`); object menu (bar, phone drawer); timeline scrub; story-panel `camera`.
3. Relied on: frame hidden set (`hiddenOf` -> `applyViewVisibility`, labels, picks, story markers), shell `isObjectAvailable`/`selectionLost`/`firstAvailableObject`, `cameraTargets`, camera requests.
4. Matrix axes below; text classes, environment/output sinks n/a (no text or terminal output in scope).
5. Issue admission: supported public path, violates a named SC/Done When/guardrail, credible story-app consequence.

## Coverage matrix

| Row | Cells | Result | Evidence |
|---|---|---|---|
| SC1 input | three calls x {not object, null, list, `{}`, bad start, bad end, end = start, end < start, NaN, Infinity, invalid Date, function, unknown key only}; accepted: open start, open end, both, ISO/Date/ms, `{start: undefined, end}` | Proven | `shownDuring.test.ts` table; checker probe P2 (NaN, Infinity, invalid Date, string, function, `{begin}` -> `bad-trajectory`/`bad-body`; `{start: undefined, end}` accepted). Fractional ms accepted: no whole-ms rule exists for moments (T-310 note), observation only. |
| SC2 handover | `shownAt` at start-1, start, end-1, end, open ends; before/after pair at T-3..T+3 | Proven | `shownAt` is `start <= t < end` (`viewHiding.ts` 329-332); one rule read by frame, menu, selection and targets; tests "shownAt"; menu at EDGE-1/EDGE on both paths. |
| SC3 drawing, labels, picks | marker, line, orbit line (`partOf` and composition `showOwned`), label, pick list | Proven | `hiddenOf(ctx, t)` feeds `applyViewVisibility`, `shownUnderView`, story markers; frame test in `shownDuring.test.ts`; Sun-orbit line carries `partOf` and its layer source body, so both hide paths apply. |
| SC3 menu | bar and phone drawer, before/at/after edge, no "Unavailable" | Proven | `shownDuringMenu.test.ts` on `mount`, `AstraeusScene`, phone. |
| SC3 refusals | `setSelected`, `setCamera` focus/follow/lookOut direction before and after edge, both paths; `cameraTargets` | Proven | same file; `cameraTargets` (App.tsx 503-507) adds `hiddenWithShownSpans` at the live clock. |
| SC3 view + span | hidden by either | Proven | "combines with the view's hidden set"; probe P3. |
| SC4 drop cause | playback, host `setTime`, visitor scrub, both paths | Proven | table test; probe P1 `["pa","host"],["earth","host"]`. |
| SC4 camera, preset path | visitor's follow preset, object leaves span -> hold, no overview | Proven | shell test "keeps the pose ...". |
| SC4 camera, host or story path | `setCamera({follow})` or a story panel's camera on an object that leaves its span | **Issue I-175** | probe P1/P1b: request stays `follow pa`, no hold. |
| SC5 no fade | edge is instant | Proven | `visible` toggled per frame; no ease code added. |
| SC6 ARCH-02 | `stateOf` in and out of span equals no-span | Proven | "changes nothing about State"; no `core/` file changed. |
| SC7 additions | API lock, README rows and Selection paragraph, CHANGELOG, example, both paths, synthetic scenes | Proven | lock diff is additive (`ShownDuringInput`, two optional members); README sync tests pass in `test:full`; `measure:example`/`check:pack` pass. |
| No test setup changed | existing tests | Proven | only `tests/domSetup.ts` changed: optional `holds()` and an `onCameraHold` counter. Before, the shared shell host passed no `onCameraHold` (an optional call, `onCameraHold?.()`), so the only effect on existing tests is that a hold is now counted; no expectation or fixture changed. Acceptable as an additive probe. |

## Gates

- `npm run test:full` 10:55:09-10:56:22Z and rerun 10:57:29-10:58:43Z: each 254 files passed, 1 failed (3,792 passed, 2 skipped): only `lifecycle.test.ts` "story step actions (O-066 T-301)" (AstraeusScene), `skyTraces` empty at line 549/554, load average about 7. It passes alone three times on this HEAD. Recorded under open I-174; no new Issue.
- `check:engine-alone` pass (24.4 s); `check:pack` pass (14.5 s); `check:node-consumer` pass; `measure:example` pass; `git diff --check main...HEAD` clean.
- `npm run check:browser` (once, 10:59:52-11:04:57Z): pass, all 12 steps, 305 s (limit 320 s); evidence `docs/evidence/browser-20261112T105952Z`.

## Code Health

Snapshot `sha256:3b76f09226388e11cf82fcf9908958fe45ca1dcd03f70d0212e8285a343b6322` (created 10:59Z): "blocks clearance" because the junit report of the last full run holds the one I-174 failure; coverage instance reported a collection failure (no coverage report written, as that run failed). Complexity, duplication and vulnerabilities: no finding. The blocker is I-174, not O-071 code.

## Issues

- I-175 (SC4, T-311 Done When 3): a camera aimed by `setCamera` or a story panel keeps following an object after its span ends; only the shell's own preset path holds.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-175 | Medium: story apps aim with `setCamera` and step cameras | Medium: camera tracks an invisible point; no crash | Medium | Fix now (direct repair under I-175), then recheck. |

## Observations (non-blocking)

- Fallback on a drop: the existing lost-selection path selects the first shown object (Earth in the tests), so a "before" object's selection moves to another object rather than to nothing; the owner chose "drop the selection". Kept as T-311 allowed; for the owner to judge.
- Design `Views of one scene` new paragraph says `hiddenWithShownSpans` is "called only from `hiddenOf`"; `App.tsx` also calls it for `cameraTargets` and the story-panel guard. Otherwise accurate.
- `shownDuring` moments accept fractional milliseconds, as every other `TimeInput` does.
- A story panel's camera on an unshown object is skipped silently (no host report); untested beyond the one test.

## Owner decisions carried forward

None on O-071 beyond the two Task check waivers (not Checks; they do not cover any criterion here).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — camera loss on a span end is decided only for shell presets (`AstraeusShell.tsx` 351-363), not for the camera's actual target, which is how I-175 arises.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
