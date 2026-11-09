---
id: C-157
scope: {kind: objective, id: O-061}
result: NEEDS WORK
checked_by: {role: checker, session: o061-check-20261110}
executed_session: o061-run-20261110
checked_at: '2026-11-09T22:39:35Z'
health_snapshot: sha256:bb1b8f18e9aab07e2222122ab06acf9b68a1dde3c5fb3879e0eb1735c6e36ce2
reviewed:
  base_commit: bb7a9c8c
  head_commit: 954dd197
  files: [packages/astraeus/src/api/errors.ts, packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/viewerSelection.ts, packages/astraeus/src/api/views.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/sceneCamera.ts, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/src/app/views.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/api-surface.lock.json, packages/astraeus/tests/hostCallOrder.test.ts, packages/astraeus/tests/setSelected.test.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/twoViewers.test.ts, packages/astraeus/tests/viewerHostDom.test.ts, packages/astraeus/tests/helpers/viewerPresentation.ts, packages/astraeus-site/tests/migrationTable.test.ts, .savepoint/Design.md]
  dependencies: []
issues: [I-159, I-160]
unmet: [AGENTS Deferred Design reconciliation, O-061 Nothing existing changes shape]
supersedes: null
---

# C-157: O-061 Full Objective Check

**Verdict: NEEDS WORK, on paperwork only.** The behaviour is proven: every host call O-061 promises lands in call order on both embedding paths, the `always` opt-in works and is validated, a host `setTime` re-bases story panels, `setSelected` selects and clears with `cause: "host"` and `bad-selection`, and nothing of the removed loading cover is left. All nine gates pass, the browser check passes, and Code Health does not block. Two Issues hold the verdict: Design.md was not reconciled for the deferred drift notes (I-159), and one existing test line was changed against a Success Condition the owner has not yet waived (I-160). Neither needs a code change, so the gate and browser runs below stay reusable for a re-check.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here; nothing to evaluate)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria.** O-061 Success Conditions as written (No lost calls; Follow rule on a shared planet; Host seek; Host selection; Loading cover — struck by the owner; Docs; Nothing existing changes shape), the Owner Decisions (I-153 opt-in per view; cover removed), the Done When of T-284..T-288 (T-288 reduced to the event-zone line by the owner decision), the Proof Needed of I-150 (with I-153), I-151, I-152, I-155 (moot by owner decision), I-158; Guardrails API-01, API-02, API-04, API-05, API-07, ARCH-02, ARCH-03, TEST-01, TEST-02; the AGENTS.md "Deferred Design reconciliation" rule; gates per `docs/agents/build.md` and the browser policy.
2. **Changed files and entry points.** `git diff bb7a9c8c..HEAD` engine files listed in `reviewed.files`. Public entry points: `ViewerHandle.setCamera`, `setTime`, `setView`, `setSelected` (new), `selected`, `onSelect`, `onChange`; `Scene.setViews` view `camera` with `always`; `SceneErrorCode` `bad-selection`; both paths `mount` and `AstraeusScene`.
3. **Relied-on orchestration.** `ViewerLink.publish`/`#afterHost`; `App.tsx` `setCamera`, `chooseView`, `hostSeekTo`, `hostSetSelected`, `updateSelectedObject`; `sceneCamera.ts` `openFirstFrame`; `AstraeusShell.tsx` view-switch effect, `applyViewRule`, host-select effect, `storySeekNote`; `useStoryPanels` `noteSeek`.
4. **Matrix axes.** Public surfaces x both paths; timing (straight after `ready`/before first frame, inside an `onChange` view-switch report, after a switch, before a later switch); sequences (two calls in one tick, both orders); input shape (`always` true/false/string/number/null; selection id shown/hidden/unknown/empty/non-string/undefined); state (selected, cleared, dropped by a switch); story panel crossing (playing, paused, back-and-forth jumps). Text classes, output sinks, serialization: not applicable (no text-width, CLI or persistence in scope).
5. **Admission boundary.** Supported host use through the public handle on a made-up scene; issues only against the criteria above.

Planning records for G-018 (O-064..O-067) and O-068 added on this branch are out of scope; `savepoint resume` loads them without error.

## Coverage Matrix And Outcome Coverage

Independent harness: a temporary `packages/astraeus/tests/zzO061CheckProbe.test.ts` (written by this checker, run, then deleted; copy kept at the session scratchpad), 29 tests, each case on `mount` and `AstraeusScene`, 3D canvas stubbed as in the Task tests. Result: 29 passed.

| Row | Case | Expected | Actual | Class |
|---|---|---|---|---|
| No lost calls | setTime/setView straight after ready (Task test) | takes effect | passes both paths | Proven |
| No lost calls | setCamera before first frame with a start view (Task test, real `stepCameraTarget`) | applied after opening view | passes; mutation M1 (restore `cameraRequest = null`) fails 2 tests | Proven |
| No lost calls | setCamera inside `onChange` of a visitor switch (Task test) | not replaced by view rule | passes; mutation M2 (drop `hostCameraSet` guard) fails 4 tests | Proven |
| No lost calls | P2 setCamera then setView(b, always) in one tick | later setView's rule wins | follow moon | Proven |
| No lost calls | P3 host setCamera before a later visitor switch | rule still applies at that switch (slot reset) | follow moon | Proven |
| Follow rule | P3b visitor switch, always, shared planet | rule applies | focus moon | Proven |
| Follow rule | P3c switch back to a view without always | camera left alone | null request | Proven |
| Follow rule | P4 always false/"yes"/1/null | `bad-view` at `setViews` | `bad-view` x4 | Proven |
| Follow rule | P4b always true on focus and follow | accepted | accepted | Proven |
| Host seek | Task test vs visitor-seek baseline | opens nothing | passes; mutation M3 (drop `storySeekNote` call) fails 2 | Proven |
| Host seek | P1 jump past, back, past again while playing | opens nothing | nothing opens | Proven |
| Host seek | P1b paused jump across panel | opens nothing | nothing opens | Proven |
| Host selection | select/clear/re-select/hidden/unknown/empty/non-string/not-mounted/after ready/inside onChange/card (Task tests, 29) | as Done When | pass | Proven |
| Host selection | P7 two setSelected in one tick | last wins, two host reports | `[pa host],[earth host]`, selected earth | Proven |
| Host selection | P8 setSelected(pa) then setView(b) hiding pa | not left on a hidden object; read and report agree; card not Probe A | holds | Proven |
| Host selection | P8b setView(b) then setSelected(pa) | `bad-selection` | `bad-selection` | Proven |
| Host selection | P5 host-selected object dropped by a visitor switch | drop, cause visitor, report equals read | holds | Proven |
| Host selection | P11 setSelected nested in `onChange` of a host setTime | last report is the nested one, no stale report | holds; mutation M4 (no re-read in `publish`) fails 2 Task tests | Proven |
| Host selection | P6 clear | `selected` undefined, one host report, card closed | holds | Proven |
| Loading cover | owner removed | nothing left | `git diff 7e51383f^..HEAD -- packages/` touches only README (+2) and CHANGELOG (+1); no `LoadingCover`, `loadingCover.test.ts`, `cover-preview.html`, lock or README row remains (`git grep`) | Proven (moot condition) |
| Docs | event-zone README line vs `core/pacing.ts` | matches | `activeEventZones` dedupes by id; rule zones centred on the event; `zoneAround` uses the event's own `withinMs` first | Proven |
| Docs/API | README order rule, `setViews` row, `setTime` row, Selection paragraph, error table, API lock, CHANGELOG | present | present; `api-surface.lock.json` gains `setSelected` x2, `always`, `bad-selection`; README sync tests pass in the gate | Proven |
| Nothing existing changes shape | existing tests unchanged | unchanged | one line added to `viewerHostDom.test.ts` (T-286) | **Issue I-160** |
| Design reconciliation | T-285/T-287 drift notes in Design.md | reflected | Design.md unchanged; two paragraphs stale | **Issue I-159** |

ARCH-02: selection and camera writes touch only `controls` and shell state; no State change found. ARCH-03: all tests use made-up scenes. API-02: every row runs on both paths. API-05: one new code, one cause.

Finite external-boundary matrix: the browser runner is the only external boundary; it ran once, passed, kept its evidence folder. Network, redirect and secret cells not applicable (no network code in scope).

Workflow lock: the host-call workflow is in-memory (call, validate, write control slot, publish, shell effect, frame). Failure before side effect: validation throws before any write (P8b, `bad-selection` rows). No persistence, artifacts or cleanup in scope.

## Commands And Results

- `npm run check:gates` (2026-11-09T22:30Z to 22:33Z): lint 3.4 s, typecheck 5.7 s, build 5.4 s, test 40.3 s, test:full 72.1 s, check:engine-alone 20.4 s, check:pack 17.7 s, check:node-consumer 4.7 s, check:react-consumer 4.7 s; all passed, total 174 s, 0 over limit.
- `savepoint health check O-061`: snapshot `sha256:bb1b8f18e9aab07e2222122ab06acf9b68a1dde3c5fb3879e0eb1735c6e36ce2` (created), "Code Health does not block clearance"; every instance reported only, no finding.
- `npm run check:browser` (run once, 22:33:21Z): all ten steps exit 0, error-lines 0, total 236 s (limit 320 s); evidence `docs/evidence/browser-20261109T223321Z/`. Note the `views` step drives a visitor switch and a host `setView` with the stay rule; no browser step exercises `setSelected`, `always` or a host `setCamera` before the first frame (by policy those are proven in the fast suite).
- `git diff --check bb7a9c8c..HEAD`: clean. `savepoint resume`: loads, Next "Record the Objective O-061 integration Check."
- Probe harness: 29 passed. Mutations (each restored with `git checkout`, tree verified clean): M1 2 fail, M2 4 fail, M3 2 fail, M4 2 fail, M5 (remove the `hostSelect` guard in `App.tsx` `updateSelectedObject`) 0 fail across hostCallOrder, setSelected, selectionCauseDom, twoViewers, lifecycle and the probe file.

## Issues

- **I-159** — Design.md not reconciled for the O-061 drift notes (AGENTS "Deferred Design reconciliation"). Design line 56 says a view's camera rule runs only when the followed object is removed; line 37 lists no host selection; no O-061 accounting.
- **I-160** — Success Condition "existing tests pass unchanged" not met as written: `viewerHostDom.test.ts` gained `handle.setPlaying(false)` because the I-151 fix stops a host `setTime` from pausing the clock at a panel. The conflict is between two Success Conditions; owner acceptance needed.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-159 | High: the gap is certain | Low: Design misleads the next planner on two paragraphs; code and README are right | Low | Fix now: one Design.md accounting paragraph and two sentence fixes; no gate rerun needed |
| I-160 | High: the edit exists | Low: the changed behaviour is the requested fix, documented in the CHANGELOG | Low | Accept with an owner waiver (resolve as `accepted`); optionally reword the CHANGELOG "Additions only" heading |

## Observations (non-blocking)

1. The `hostSelect` guard in `App.tsx` `updateSelectedObject` (`if (hostSelect.current !== null) return;`) is not needed by any test: removing it fails nothing, including P8. Either it guards an ordering no test reaches or it is redundant (STYLE-03/STYLE-05).
2. A host `setCamera` answering a view switch suppresses only the rule's camera request: the rule still selects its framing target and sets the shell's `activePresetId`, so the preset shown as active can differ from where the host pointed the camera (T-285 limit, as documented). Not promised otherwise by any criterion.
3. `controls.hostCameraRequest` stays set until the next view switch; it is read only at the first frame and by the view rule, so no stale replay was found.
4. The Objective's Outcome sentence still says "`mount` shows the same loading cover as the React viewer"; the struck Success Condition and Owner Decisions supersede it. A planner may reword it.
5. P1-style host-seek probes prove "opens nothing"; that playback after a host jump still opens a panel it really crosses was not exercised (the stub clock does not run frames); the code path (`noteSeek` then `seekTo`) is the visitor's own.
6. Nothing was checked in a real browser beyond `check:browser`; the owner's look on localhost:5490 is still the visual judgement.

## Owner Validation Still Needed

- Decide I-160 (accept the one-line test change, or have the condition reworded).
- No Task declares `owner_validation.required`; every Task carries a recorded check waiver.

## Prior Owner Decisions

First Check on O-061: no prior Check-linked acceptance or exception to carry forward. The Objective's Owner Decisions (opt-in per view; cover removed) are honoured by the code.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — the `hostSelect` pending guard in `App.tsx` `updateSelectedObject` has no test that fails without it (mutation M5).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
