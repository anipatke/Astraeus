---
id: T-284
title: Find why app commands get lost
objective: O-061
status: planned
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

Pending execution.

## Drift Notes

None yet.
