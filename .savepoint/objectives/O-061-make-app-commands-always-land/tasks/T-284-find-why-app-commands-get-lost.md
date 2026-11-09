---
id: T-284
title: Find why app commands get lost
objective: O-061
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: voyagers-review-20261110}
check_waiver: {task: T-284, reason: 'Owner said "orchestrate O-061" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o061-run-20261110}, recorded_at: '2026-11-09T20:44:20Z'}
---

# Find why app commands get lost

## Outcome

Each lost-call case from I-150 (with I-153) and I-151 is reproduced by a failing host-style test, its cause is named in the Technical Evidence, and one written order rule for host calls is proposed: every call after `ready` takes effect or throws, in call order, including before the first frame and inside an `onChange` report of a view switch; a later host call wins over a view's own camera rule.

## User Check

None on screen; the owner reads the named causes and the order rule in plain words at hand-off.

## Done When

Failing tests (marked `it.fails` or skipped with the Issue id, so gates stay green) on both embedding paths for: `setCamera` / `setTime` / `setView` straight after `await ready` and before the first frame; `setCamera` and `setTime` from inside an `onChange` view-switch callback; a view follow rule on a planet another view also shows (made-up scene, ARCH-03); a host `setTime` against a visitor seek for story panels. Each case's cause is named with file and function. If no case reproduces, record that and return REPLAN REQUIRED.

## Context Files

`packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/api/viewerCamera.ts`, `packages/astraeus/src/api/viewerClock.ts`, `packages/astraeus/src/api/viewerHandle.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/app/views.ts`, `packages/astraeus/src/shell/useStoryPanels.ts`, `packages/astraeus/src/shell/storyPanels.ts`, `packages/astraeus/tests/viewerHostReady.test.ts`, `packages/astraeus/tests/hostCameraDom.test.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `.savepoint/issues/I-150-camera-and-time-calls-before-the-first-frame-are-silently-lost.md`, `.savepoint/issues/I-151-a-host-settime-does-not-count-as-a-seek-for-story-panels.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (host control seam) and `Public API shape (G-016, owner 2026-11-01)`.

## Guardrails

API-02, ARCH-02, ARCH-03, TEST-01, TEST-02.

## Implementation Plan

1. Read the host seam and the camera, clock and view-switch paths.
2. Write each case as a host-style test on `mount` and `AstraeusScene`; record which fail.
3. Trace each failure to its cause; record file and function.
4. Write the proposed order rule in plain words for the README and T-285.

## Boundaries

No fix in this step; tests that fail are marked so the gates stay green. No public API change.

## Technical Verification

`npm run check:gates` (lint, typecheck, build, `npm run test:full`, engine-alone, pack, node and react consumer checks); browser scripts only at the Full Objective Check (`npm run check:browser`). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Test-only step; no source changed. New file `packages/astraeus/tests/hostCallOrder.test.ts`: host-style tests on a made-up scene (ARCH-03), each run on `mount` and on `AstraeusScene` (handle from `ref` / `onReady`), 22 tests: 14 pass, 8 `it.fails` (4 cases x 2 paths, each naming its Issue). Every `it.fails` was checked by turning it into `it` once: each fails on the expected assertion (not on a setup error).

Cases, result, cause:
1. `setTime` and `setView` straight after `await ready`, before the first frame: PASS on both paths (they take effect and read back). `setCamera` straight after ready is accepted and reaches `controls.cameraRequest`: PASS.
2. `setCamera` before the first frame in a scene with a start view (`scene.camera.follow(..)`): REPRODUCED, `it.fails` (I-150), both paths. Cause: `packages/astraeus/src/app/sceneCamera.ts` `openFirstFrame` (called by `stepCameraTarget` on the first frame) applies the start view and sets `controls.cameraRequest = null`, discarding the host's pending request. `ready` resolves at attach, before that frame, so there is always a window. (Existing test sceneCamera.test.ts "consumes any request" pins this as intended for the opening, not for a host call.) Without a start view the call survives (PASS).
3. `setCamera` from inside an `onChange` that reports a view switch (visitor presses the view button; camera was following an object the new view hides): REPRODUCED, `it.fails` (I-150), both paths; the request ends as `{ kind: "hold" }`. Cause: `packages/astraeus/src/shell/AstraeusShell.tsx` effect keyed on `viewId` (via `useViewSwitch` / `applyViewRule`) runs after the render that follows the switch, so its `onCameraHold` / rule request (`App.tsx` `holdCamera` / `updateCameraRequest`, a single `controls.cameraRequest` slot) overwrites the request the host made earlier, synchronously, in `onChange`. Cause of the ordering: `ViewerLink.#afterHost` / `publish` reports the switch at once (`App.tsx` `chooseView` sets `viewRef`), while the shell applies the view's rule a render later; and a host `setCamera` does not set the shell's `activePresetId`, so the shell cannot tell a host camera from the view's.
   `setTime` and a second `setView` from inside that `onChange`: PASS (not lost).
4. A view's follow rule on a planet other views also show (I-153): REPRODUCED, `it.fails`, both paths. Camera follows Earth (shown in both views); view b's rule is `{ follow: "moon" }`; switching to b sends no request. Cause: `AstraeusShell.tsx` the `viewId` effect applies the rule only when the followed object is not in the new view (`switchRule !== undefined && target === undefined`); a shared object never triggers it. Note: `setViews` documents exactly that ("what happens when the followed or focused object is not in the view switched to"), so this one is a documented rule that the Issue wants widened; the owner may want to confirm which is intended. When the followed object is not shown the rule works (PASS).
5. A host `setTime` against a visitor seek for story panels (I-151): REPRODUCED, `it.fails`, both paths. Baseline (visitor slider seek across the panel while playing opens nothing): PASS. Host `setTime` across the panel while playing opens the panel. Cause: `AstraeusShell.tsx` `seek` calls `story.noteSeek` (`useStoryPanels.ts` -> `CrossingTracker.rebase`) before `onSeek`; the host path goes `ViewerClock.setTime` -> control `seek` = `App.tsx` `seekTo`, which never reaches the shell, so the next snapshot change is read as playback crossing the panel (`CrossingTracker.advance`).

Proposed order rule (plain words): After `ready`, every host call either takes effect or throws, in the order the host made it, and the last host call wins. A call made before the first frame is kept until the first frame and applied after the scene's opening view, not thrown away by it. A call made inside an `onChange` report of a view switch is applied after the view's own camera rule for that switch (the host is answering the switch). A view's camera rule is a default for a switch, so a later host camera call always replaces it. A host `setTime` is a seek exactly as a visitor's is: it opens no story panel by itself and re-bases the panel crossing check. Seam to do this in one place: one ordered host-request slot read by the scene frame after the opening view and after the view rule, and one shared seek handler used by both visitor and host.

Commands: `npx vitest run tests/hostCallOrder.test.ts` (14 passed, 8 expected fail); `npm run lint` clean; `npm run typecheck` clean; `npm test` 234 files, 3317 passed, 8 expected fail, 2 skipped. Not run: `npm run check:gates`, `check:browser` (test-only step; browser at the Full Objective Check).

Limits: the 3D scene is a stand-in (as in hostCameraDom.test.ts), so the first-frame case runs the real `stepCameraTarget` on the page's controls with a stub target table rather than a drawn frame; the order seen in a real browser is not checked here. Story-panel hold/resume timing was not explored beyond the crossing check.

## Drift Notes

None. Case 4 (I-153) matches documented `setViews` behaviour; flagged for the owner in Technical Evidence.
