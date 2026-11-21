---
id: T-352
title: Find out whether reverse playback can break paced speed changes
objective: O-083
status: planned
depends_on: []
check_waiver: {task: T-352, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T11:22:41Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: pacing
planned_reads: [packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/api/viewerClock.ts, packages/astraeus/src/api/planTimeline.ts, packages/astraeus/src/core/clock.ts, packages/astraeus/tests/sceneFrame.test.ts]
planned_writes: [packages/astraeus/src/core/pacing.ts, packages/astraeus/tests/reversePacing.test.ts]
---

# Find out whether reverse playback can break paced speed changes

## Outcome

Settled with evidence whether a negative playback rate can reach the pacing code (`applyPacing`, `easeShift`, `stepPacing`) through the public API or a visitor's controls. If it can, pacing carries the sign separately from the magnitude so reverse paced playback works and never throws; if it cannot, a guard test pins the reason so a later change that makes it reachable fails a test (AH-07; Gemini SCI-06, needs verification).

## User Check

None visual.

## Done When

- Confirm first, and record the trace with file:line: (a) `setTimeline({ rate })` accepts a negative opening rate (`api/story.ts` `timelineOf`: `rate` must be finite and non-zero) while `rates` must be positive and `handle.setRate` accepts only offered rates or `"auto"` (`api/viewerClock.ts` ~58); (b) whether `paceAuto` can be true while `clock.rate < 0`: the initial `paceAuto` when a scene has both `pacing` and a negative `rate`, the view-switch path `App.tsx` ~438 (`startPaceEase(view, runtime.clock.rate, …)`), the first-frame order in `app/sceneFrame.ts` ~148–155, and any visitor control that reverses playback. Write the probe as the first rows of `tests/reversePacing.test.ts` (a public `Scene` with `setTimeline({ start, end, pacing, rate: -3600 })` driven through the frame stage or the clock/pacing functions it calls).
- **If reachable:** `pacedRate`, `easeShift`, `applyPacing` and `stepPacing` work on the rate's magnitude and keep its sign (`stepPacing` passes direction `-1` to `pacedAdvance` when the rate is negative instead of the hard-coded `1` at ~235); `reversePacing.test.ts` shows the throw first, then: a view-switch ease at a negative rate never throws and keeps the clock running backward, and a backward step through a pacing zone slows as the forward step does (mirror of an existing forward case).
- **If not reachable:** no change to `core/pacing.ts`; `reversePacing.test.ts` pins the guard that keeps it unreachable (for example: with pacing on, the clock rate pacing sets is positive at every frame, including straight after opening with `rate: -3600` and straight after a view switch) and documents the trace in its test name; record the evidence and that AH-07 is closed as not reachable.
- Existing tests unchanged and green, including `sceneFrame`, `pacing`, `pacingOverlaps`, `pacingRepairs`, `pacingViews`, `pacingDom` and `pacingViewsDom`.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/pacing.ts` (`pacedRate` ~98, `startPaceEase` ~134, `easeShift` ~139, `applyPacing` ~146, `pacedAdvance` ~202, `stepPacing` ~228)
- `packages/astraeus/src/app/App.tsx` (lines ~430–525: `paceAuto`, `startPaceEase`, `applyPacing` call sites)
- `packages/astraeus/src/app/sceneFrame.ts` (lines ~145–157)
- `packages/astraeus/src/api/story.ts` (`timelineOf`, `pacingOf`)
- `packages/astraeus/src/api/viewerClock.ts` (`setRate`)
- `packages/astraeus/src/core/clock.ts` (`setRate`)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`: `Views fixes for a multi-probe app` (pacing follows the showing view) and `Time windows and rates (O-010)`.

## Guardrails

CODE-02, ARCH-02, STYLE-03, TEST-01..04.

## Implementation Plan

1. Trace and probe; decide reachable or not from the probe's result, not from reading alone.
2. Reachable: fix sign handling in `core/pacing.ts`, with the failing test first. Not reachable: add the guard test only.
3. Focused tests, then gates.

## Boundaries

No new public rate options (negative offered `rates` stay refused), no change to forward pacing behaviour, no UI change. Time-box per the orchestration rules; if the trace stays ambiguous after the probe, record it and add the guard test.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/reversePacing.test.ts packages/astraeus/tests/sceneFrame.test.ts packages/astraeus/tests/pacing.test.ts packages/astraeus/tests/pacingViews.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

Record the reachability finding for the Full Check and for AH-07's closure.
