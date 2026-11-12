---
id: I-175
title: A host or story camera keeps following an object past its shown time
type: defect
status: open
source:
  kind: check
  check: C-176
  actor: {role: checker, session: o071-check-20261112}
  at: '2026-11-12T11:05:00Z'
tasks: [T-311]
checks: [C-176]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-11-12T11:05:00Z'
    actor: {role: checker, session: o071-check-20261112}
    kind: observed
    note: Found by the O-071 Full Objective Check (C-176), probe P1.
    check: C-176
  - at: '2026-11-12T11:15:12Z'
    actor: {role: executor, session: o071-repair-20261112}
    kind: repair_attempted
    note: 'Direct repair, unverified by a checker. App.tsx keeps the ids the last camera request named (preset, host setCamera, story panel) and holdCameraOffShown holds the camera once one is not shown (hiddenWithShownSpans); the shell tells it the time (onTimeShown). shownDuringMenu.test.ts adds a table test {setCamera, story panel camera} x {host setTime, visitor time change, playback} on mount and AstraeusScene: 12 cases fail on the unfixed src and pass now; the preset-path test is unchanged. lint, typecheck, build, npm test pass.'
---

# I-175: A host or story camera keeps following an object past its shown time

## Summary

O-071 Success Condition 4 and T-311 Done When: when an object leaves its `shownDuring` span "the camera does not follow an unshown point and does not jump: it keeps its current pose". The build only holds the camera when the shell's own active camera preset names the object (`cameraTargetLoss` / `loseCameraTarget`, `packages/astraeus/src/shell/AstraeusShell.tsx` lines 174 and 351-363). A camera aimed by the host (`setCamera`, `packages/astraeus/src/app/App.tsx` line 497) or by a story panel's `camera` (same `setCamera`, `markOpenPanel`, line 529) is not a shell preset, so when its object's span ends nothing is sent: the rig keeps following a point that is no longer drawn. Following an asteroid with `setCamera` or a story step is the Closest Calls pattern this Objective serves.

## Evidence

Checker probe (temporary test, removed; synthetic scene of `tests/shownDuringMenu.test.ts`: Earth, path `pa` shown until EDGE, `pb` from it; `mount`, stand-in 3D scene recording `controls.cameraRequest`):

- At EDGE - 1 min: `setSelected("pa")`, `setCamera({ follow: "pa" })`; then `setTime(EDGE + 1 min)`. Selection drop is correct (`onSelect`: `["pa","host"]`, `["earth","host"]`), but `controls.cameraRequest` stays `{"kind":"follow","target":"pa"}`; no `{ kind: "hold" }` is made. Expected: a hold (pose kept, following stopped), as the preset path does.
- Same with playback across the edge and no selection of `pa`: request stays `follow pa`.
- The camera rig (`src/app/sceneCamera.ts`) does not read the hidden set, so it keeps following.

Missing test evidence: `shownDuringMenu.test.ts` "drops a selection ... keeps the camera pose" selects by the menu without aiming the camera (the stand-in scene makes its pose check vacuous, as T-311 notes); "the shell: the camera at a drop" covers only the preset button.

## Proof Needed

A camera following or focused on an object by `setCamera` or by a story panel's `camera` holds its pose and stops following when the object leaves its span (playback, host and visitor moves), on both embedding paths (API-02), proven by a test that fails on the current build; the preset-path behaviour and its test are unchanged.
