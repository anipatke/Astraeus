---
id: T-314
title: Open paused and stop cleanly at the timeline's end
objective: O-073
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-314, reason: 'Owner said "go" to orchestrate O-073 under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: plan-g020-20261115}, recorded_at: '2026-11-15T04:10:47Z'}
planned_by: {role: planner, session: plan-g020-20261115}
---

# Open paused and stop cleanly at the timeline's end

## Outcome

`setTimeline({ playing: false })` opens the viewer paused on its opening time before the first frame (default stays playing; readable on `scene.timeline`). Playback that runs into a timeline edge stops exactly on it. A moment panel at the timeline's end opens when forward playback stops there. `clearSkyTrace(id, { durationSeconds: 0 })` removes lines and label on the next drawn frame, paused or playing.

## User Check

None required; behaviour is proven by tests.

## Done When

- `setTimeline({ playing: false })`: validated (non-boolean throws `bad-timeline`), shows on `scene.timeline`, and a mount test shows the clock never advanced before `ready` (clock equals the opening time, `handle.playing === false`). Both embedding paths (API-02).
- `stopWithin`: a test with a monotonic clock that ticks between reads stops exactly on the edge (fails on the unfixed source).
- Panel at end: a crossing test where playback stops at the end opens the panel there; a seek to the end still opens nothing.
- Zero-length clear: a test that a paused, still frame after `clearSkyTrace(id, { durationSeconds: 0 })` is redrawn (wake raised) and the figure's lines are gone.
- README rows (`setTimeline`, panels at the end, `clearSkyTrace`) and the opening play state documented; API lock and CHANGELOG updated (API-01, API-07).
- Configured gates pass.

## Context Files

- `packages/astraeus/src/app/openClock.ts`
- `packages/astraeus/src/api/planTimeline.ts`
- `packages/astraeus/src/api/sceneReads.ts` under `SceneTimelineRead`
- `packages/astraeus/src/core/clock.ts`
- `packages/astraeus/src/app/sceneFrame.ts`
- `packages/astraeus/src/shell/storyPanels.ts`
- `packages/astraeus/src/shell/useStoryPanels.ts`
- `packages/astraeus/src/app/SkyFiguresView.ts`
- `packages/astraeus/tests/storyPanelSettings.test.ts`
- `packages/astraeus/tests/sceneFrame.test.ts`
- `packages/astraeus/tests/skyTrace.test.ts`
- `packages/astraeus/README.md` under `Clock and changes`, `Story panels, selection and views`, `Sky traces`

## Design References

Design `Sky stories`, `Time windows and rates (O-010)`.

## Guardrails

ARCH-03, API-01, API-02, API-04, API-05, API-07, TEST-01..03.

## Implementation Plan

1. Add `playing?: boolean` to the timeline setting; pass it through `planTimeline` to `definition.clock.playing`; add it to `SceneTimelineRead`.
2. In `stopWithin`, pause before seeking (or read the monotonic clock once) so the stored time is the edge.
3. Let a stop at an edge count as a forward crossing for panels (a flag from the frame or a check before pausing).
4. Make a zero-length `clearTrace` report movement so the frame wakes.
5. Tests and docs as in Done When.

## Boundaries

No "on first play" hook, no mount-level play option, no step-bar change.

## Technical Verification

Focused tests while iterating; configured gates at handoff.

## Technical Evidence

Pending execution.

## Drift Notes

Note the opening play state for Design `Sky stories` or the timeline section.
