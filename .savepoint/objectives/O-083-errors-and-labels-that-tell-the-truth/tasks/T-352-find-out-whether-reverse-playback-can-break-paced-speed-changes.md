---
id: T-352
title: Find out whether reverse playback can break paced speed changes
objective: O-083
status: done
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

Trace (reachable): `api/story.ts:168` accepts any finite non-zero `rate` (negative allowed); `api/planTimeline.ts:75` passes `timeline.rate ?? 60` as pacing `baseRate`, so `setTimeline({ rate: -3600, pacing })` gives a negative base. `rates` must be positive (`story.ts:174`) and `handle.setRate` takes only offered rates or "auto" (`viewerClock.ts` setRate), so a visitor/host cannot reach it that way; but a negative opening rate with pacing starts `paceAuto: true` (`App.tsx:222`), `frameTime` (`sceneFrame.ts:148-155`) then calls `stepPacing`/`applyPacing`, and a view switch calls `startPaceEase(…, runtime.clock.rate, …)` (`App.tsx:438`). In `pacedRate`/`easeShift`/`applyPacing`, `Math.log` of a negative gave NaN; `applyPacing` then called `clock.setRate(NaN)`, which throws RangeError; `stepPacing` hard-coded direction 1.
Probe result (before the fix, same test file): the view-switch ease test failed (`easeShift` not finite) and the backward-step test threw RangeError from `clock.seek`. Reachable: AH-07 confirmed.
Fix in `core/pacing.ts`: `pacedRate` works on `|baseRate|` and returns it with its sign; `easeShift`, `applyPacing`, `advanceRate` use magnitudes; `stepPacing` passes direction -1 when `clock.rate < 0` and slack uses `|last.rate|`. Forward behaviour unchanged (existing tests green).

| Done When | Evidence |
|---|---|
| Trace + probe first | trace above; `tests/reversePacing.test.ts` first rows (opening base rate -3600 reaches pacing; applyPacing/ease at negative rate) |
| Reachable: sign kept; ease never throws, stays backward; backward step slows like forward | `reversePacing.test.ts` "view-switch ease at a negative rate…", "a backward step through a zone slows as the forward step does" (mirror 47 d forward vs 53 d backward around a flyby) |
| Existing tests unchanged and green | vitest of sceneFrame, pacing, pacingOverlaps, pacingRepairs, pacingViews, pacingDom, pacingViewsDom: 87 passed |
| Gates | lint, typecheck, build clean; full test: 4937 passed, 3 failed (apiSurface lock, scenePin, apiRules API-05), rerun once, same: all in files owned by concurrent T-343/T-348 (api/scene.ts, errors.ts, time.ts); none touch pacing |

Files changed: `packages/astraeus/src/core/pacing.ts`, `packages/astraeus/tests/reversePacing.test.ts` (new). Limitation: a visitor cannot reach it through the rate picker; only a negative opening `rate` with `pacing` does. No browser run.

## Drift Notes

AH-07 reachable via `setTimeline({ rate < 0, pacing })` and fixed in `core/pacing.ts` (sign carried separately from magnitude). Non-architectural; Design.md needs at most a note that pacing works on rate magnitude and keeps its sign.

Coordinator (orchestrate-g024-20261121): hand-off gates green for this Task's files (lint, typecheck, build; the three `npm test` failures are in T-343/T-348's in-flight `api/` files and are rechecked once those land); `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
