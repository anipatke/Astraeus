---
id: C-158
scope: {kind: objective, id: O-061}
result: CLEAR
checked_by: {role: checker, session: o061-recheck-20261110}
executed_session: o061-run-20261110
checked_at: '2026-11-09T22:42:03Z'
health_snapshot: sha256:bb1b8f18e9aab07e2222122ab06acf9b68a1dde3c5fb3879e0eb1735c6e36ce2
reviewed:
  base_commit: 954dd197
  head_commit: c5028ab1
  files: [.savepoint/Design.md, .savepoint/objectives/O-061-make-app-commands-always-land/Objective.md, packages/astraeus/CHANGELOG.md, .savepoint/issues/I-159-design-not-reconciled-for-o-061-host-call-drift-notes.md, .savepoint/issues/I-160-o-061-changed-one-existing-test-and-a-host-settime-behaviour.md, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/sceneCamera.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/shell/useStoryPanels.ts, packages/astraeus/src/api/views.ts, packages/astraeus/src/api/viewerSelection.ts, packages/astraeus/src/api/viewerLink.ts]
  dependencies: []
issues: []
supersedes: C-157
---

# C-158: O-061 Full Objective Re-check

**Verdict: CLEAR.** Both C-157 Issues are settled: I-159's Design reconciliation now matches the code at HEAD claim by claim, and I-160 is resolved `accepted` by the owner. The repair touched records and one CHANGELOG heading only, so C-157's gate, browser and Code Health evidence are reused unchanged. The owner may record O-061 done (every owned Task's status remains the owner's call).

**Closure map.**

| Prior Issue | State | Why |
|---|---|---|
| I-159 (Design not reconciled) | **closed, verified** | New Design.md "Host calls land in order (O-061 ...)" paragraph and corrected "Views of one scene" sentence; every claim matches the code (table below); each T-284..T-288 drift note accounted for |
| I-160 (one existing test line changed) | **closed, accepted by the owner** (record verified) | `resolution: {disposition: accepted, actor: {role: owner, session: o061-run-20261110}, at: '2026-11-09T22:40:20Z'}` with an `owner_decision` history entry recorded on direct instruction; `viewerHostDom.test.ts` unchanged since C-157 (`git diff 954dd197..HEAD` touches no test) |

**Prior owner decisions.** No structured `exception` or `owner_validation.accepted_check` is recorded on O-061 or its Tasks, so no `carried_forward` entries are needed. The owner's I-160 acceptance is an Issue resolution: it settles the conflict between the "Host seek" and "Nothing existing changes shape" Success Conditions in favour of the I-151 fix, and its scope (the one added `handle.setPlaying(false)` line and the host-`setTime` behaviour) is unchanged since it was given. The Objective's Owner Decisions (`always` opt-in per view; loading cover removed) are unchanged and still honoured. Task-check waivers on T-284..T-288 are waivers, not exceptions.

**Independence.** This session did not plan, build, coordinate or repair any O-061 work and is not the C-157 checker session (`o061-check-20261110`). It treated the I-159 repair note and the commit message as claims. Not a lane: branch `o061-app-commands` on the main checkout.

## Re-check Scope

Frozen scope lock: C-157's, unchanged (criteria, entry points, matrix axes, admission boundary). Convergence: this is the one full re-check after the initial Check.

Admission ledger:

| Re-check item | Prior Issue / claim | Frozen cell | Allowed result |
|---|---|---|---|
| Design O-061 paragraph covers order rule + `hostCameraRequest` slot | I-159 Proof Needed | Design reconciliation row | Proven / Issue |
| Design covers `always` opt-in, both paragraphs | I-159 Proof Needed | Design reconciliation row | Proven / Issue |
| Design covers shared seek re-base | I-159 Proof Needed | Design reconciliation row | Proven / Issue |
| Design covers `setSelected` / `bad-selection` / nested-publish re-read | I-159 Proof Needed | Design reconciliation row | Proven / Issue |
| "One handle, one lifecycle" no longer contradicts the code | I-159 Proof Needed | Design reconciliation row | Proven / Issue |
| Each T-284..T-288 drift note accounted for | I-159 Proof Needed; AGENTS Deferred Design reconciliation | Design reconciliation row | Proven / Issue |
| I-160 record resolved by the owner | I-160 Proof Needed | Nothing existing changes shape row | Proven / Issue |
| No code changed since C-157's gate and browser runs | C-157 reuse statement | Verify Evidence And Gates | reuse or rerun |

## Design Claims Against The Code (HEAD c5028ab1)

| Design claim | Code | Result |
|---|---|---|
| `controls.hostCameraRequest` set by `App` on a host `setCamera` | `App.tsx` 451: `controls.current.cameraRequest = controls.current.hostCameraRequest = request` | Matches |
| reset by `chooseView` at each view switch | `App.tsx` 356 | Matches |
| `openFirstFrame` clears other requests at the opening but keeps the host's | `sceneCamera.ts` 82: `controls.cameraRequest = controls.hostCameraRequest ?? null` | Matches |
| `applyViewRule` skips its hold/framing request when `hostCameraSet` says the host set the camera since the switch, still applies its selection change | `AstraeusShell.tsx` 338-350: selection and `setActivePresetId` first, then `if (hostCameraSet?.() === true) return`; `App.tsx` 452 `hostCameraSet` reads the slot | Matches |
| `always: true` on a view's framing (`ViewCameraInput`, `api/views.ts`); anything but `true` throws `bad-view` | `views.ts` 6 (type), 77-78 (throw via `bad`) | Matches |
| with `always` the rule applies on every switch; without it only when the switch takes the followed object away | `AstraeusShell.tsx` 307-313 (`switchRule.framing?.always === true` branch before the target-gone branch) | Matches |
| shell hands `story.noteSeek` (`useStoryPanels`, `CrossingTracker.rebase`) to `App` as `storySeekNote`; visitor seek and `App.hostSeekTo` then `seekTo` both call it | `AstraeusShell.tsx` 257, 277; `useStoryPanels.ts` 52-53; `storyPanels.ts` 35; `App.tsx` 423-427, host `seek: hostSeekTo` at 461 | Matches |
| `ViewerHandle.setSelected(id \| undefined)` through `ViewerLink`, ids checked against `cameraTargets()`, code `bad-selection` | `viewerHandle.ts` 43, 108; `viewerLink.ts` 188; `viewerSelection.ts` 40-48; `errors.ts` 60 | Matches |
| sets `controls.selectedObjectId` at once, queues a `selectRequest` applied after the view-switch effect, opens/closes the card without moving the camera | `App.tsx` 389-393; `AstraeusShell.tsx` 325-335 (effect declared after the view-switch effect; `setInfo` only, no camera request) | Matches |
| `App.updateSelectedObject` ignores the shell's older choice while that request is pending | `App.tsx` 396, cleared by `hostSelectApplied` via `onSelectRequestApplied` (394, 733; shell 332) | Matches |
| `ViewerLink.publish` re-reads state after a nested publish | `viewerLink.ts` 203-210 (`#publishes` serial, `this.#control?.read()`) | Matches |
| T-288 cover removed, no architecture left | `git grep LoadingCover\|LoadingShell\|loadingCover -- packages/`: only a pre-existing comment in `tests/firstDraw.test.ts` (present at bb7a9c8c) | Matches |

"One handle, one lifecycle" still lists `selected`/`onSelect` for the O-054 selection part; it does not say the part is read-only, and the O-061 paragraph directly after it adds `setSelected`, so it no longer contradicts the code. "Views of one scene" now reads "... only when the camera's followed or focused object is not in it, or on every switch when the rule's framing carries `always: true` (O-061, I-153)", matching the code.

Drift-note accounting: T-284 "None"; T-285 (order rule, slot) reflected; T-286 re-base reflected, its test note marked non-architectural (I-160, accepted); T-287 (`setSelected`, `bad-selection`, `selected` settable, nested re-read) reflected; T-288 cover notes (root class, `LoadingShell`, `apiImports` ALLOWED entry, test note) marked moot as the cover was removed. All accounted for.

Other repair edits: O-061 Outcome no longer names the loading cover (C-157 observation 4); CHANGELOG "Unreleased (0.8.1)" heading now reads "Additions, and the host-call fixes below; no existing call shape or error code changed." Accurate: `bad-selection`, `setSelected` and `always` are additions; I-151 is the listed behaviour fix.

## Commands And Results

- `git diff --stat 954dd197..HEAD` (C-157's recorded head to HEAD): under `packages/` only `packages/astraeus/CHANGELOG.md` (one line, the heading). Everything else is `.savepoint/` records, the health snapshot JSON and the C-157 browser evidence folder. `CHANGELOG.md` is consumed by `tools/build-packages.mjs` (copy) and `tools/check-packs.mjs` (presence in the pack file list) only, never by content.
- Therefore **reused, not rerun**: C-157's `npm run check:gates` (2026-11-09T22:30Z-22:33Z, all nine gates pass, 174 s, 0 over limit), `npm run check:browser` (`docs/evidence/browser-20261109T223321Z/`, ten steps exit 0, 236 s) and Code Health snapshot `sha256:bb1b8f18...6e36ce2` (does not block). No code, test, lock or build input changed after those runs.
- `git diff --check 954dd197..HEAD`: clean.
- `git status --short`: only the owner's untracked `docs/prds/`, `docs/research/` (untouched).
- `savepoint resume` before writing: loads; Next "Record the Objective O-061 integration Check."

## Outcome Coverage

Every C-157 matrix row is unchanged in code and keeps its C-157 classification (Proven). The two C-157 Issue rows now classify as: Design reconciliation — Proven (above); Nothing existing changes shape — settled by the owner's `accepted` resolution of I-160 (the only departure is the one I-151-driven test line the owner accepted; no other existing test changed).

## Issues

None. No materiality actions are required.

## Observations (non-blocking)

1. C-157 observations 1-3, 5 and 6 still stand (untested `hostSelect` guard in `App.updateSelectedObject`; host `setCamera` suppresses only the rule's camera request, not its preset highlight; `hostCameraRequest` stays set until the next switch; host-seek playback-crossing not exercised; no real-browser look beyond `check:browser`). Observation 4 is addressed.
2. `packages/astraeus/tests/firstDraw.test.ts` line 3 names `loadingCoverFrame.test.ts`, which does not exist; the comment predates O-061 (present at bb7a9c8c). Outside the frozen scope.

## Owner Validation Still Needed

- No Task declares `owner_validation.required`. The owner records T-288 and O-061 done when satisfied, and may take a look on localhost:5490.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — unchanged from C-157: the `hostSelect` pending guard in `App.tsx` `updateSelectedObject` has no test that fails without it.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
