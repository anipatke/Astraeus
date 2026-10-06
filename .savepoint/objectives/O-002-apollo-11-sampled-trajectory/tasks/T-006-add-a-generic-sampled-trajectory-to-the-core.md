---
id: T-006
title: Add a generic sampled trajectory to the core
objective: O-002
status: done
depends_on: []
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: astraeus-spike-02-planning-2026-10-06}
lane: core
planned_reads: [src/core/state.ts, src/core/trajectory.ts, src/core/body.ts, src/core/referenceCenters.ts, src/core/moonTrajectory.ts, src/core/scalePolicy.ts, src/app/floatingOrigin.ts, src/core/clock.ts]
planned_writes: [src/core/body.ts, src/core/trajectory.ts, src/core/sampledTrajectory.ts, src/core/provenance.ts, src/core/events.ts, tests/sampledTrajectory.test.ts]
check_waiver:
    task: T-006
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-05T22:06:16Z"
---

# Add a generic sampled trajectory to the core

## Outcome

Astraeus core can represent any spacecraft as a bounded, sampled Trajectory that returns ordinary scientific State, with provenance and timeline events as small separate data, and with no mission-specific naming.

## User Check

Read `src/core/sampledTrajectory.ts`, `provenance.ts` and `events.ts`: no mention of Apollo or any mission. Run the test file and see determinism, bounds, interpolation, rejection, scale, floating-origin and playback cases pass alongside unchanged Spike 01 tests.

## Done When

1. Body identity is opened so a spacecraft id can be a State subject; center ids remain the natural bodies; Earth/Moon orientation requirement and all existing behaviour are unchanged.
2. Trajectory gains an optional generic time-bounds declaration; MoonTrajectory stays unbounded and unchanged in behaviour.
3. `SampledTrajectory` implements `Trajectory`: validated construction (finite values, strictly increasing times, ≥2 samples, single EQJ frame and single center, velocity on all samples or none); exact State at sample times; cubic Hermite with velocity, linear without; a named out-of-range error before first / after last; loud rejection of a requested center it does not hold; fresh snapshots that never expose internal buffers; `orientation: null`.
4. Provenance metadata type with `sourceType: ephemeris | observed | reconstructed | illustrative`, sources, accuracy, notes; attached to SampledTrajectory without affecting State.
5. Generic event type `{ timeUtcMs, id, label, type? }` with validation (sorted, unique ids), independent of trajectories.
6. `tests/sampledTrajectory.test.ts` covers brief section 21: determinism; before-first, first, between, last, after-last; analytic interpolation fixtures (linear motion exact; Hermite exact for cubic motion and close on a circular orbit fixture); invalid frame/center/order rejections; TrueScale vs ReadableScale leave State unchanged; floating-origin rebasing leaves State unchanged; same T via seek, 1× and accelerated clock playback yields identical State.
7. Configured typecheck, build and test gates pass; existing 58 tests still pass.

## Context Files

`src/core/state.ts`, `src/core/trajectory.ts`, `src/core/body.ts`, `src/core/referenceCenters.ts`, `src/core/moonTrajectory.ts`, `src/core/scalePolicy.ts`, `src/core/clock.ts`, `src/app/floatingOrigin.ts`, `tests/core.test.ts`, `tests/sceneTransforms.test.ts`, `docs/ASTRAEUS_SPIKE_02_BRIEF.md`, `.savepoint/objectives/O-002-apollo-11-sampled-trajectory/Objective.md`.

## Design References

Design: Interfaces and Data Flow; O-002 Architectural Considerations.

## Guardrails

TEST-01, TEST-03, STYLE-01, STYLE-04, STYLE-05, STYLE-06, STYLE-07.

## Implementation Plan

1. Widen body identity minimally and confirm all existing call sites still typecheck; keep center types narrow.
2. Add optional bounds to Trajectory.
3. Implement SampledTrajectory with binary search and per-interval Hermite/linear interpolation in Float64.
4. Add provenance and event types.
5. Write the section 21 tests using small synthetic fixtures (no Apollo data).
6. Run gates.

## Boundaries

No mission data, propagation, reconstruction, rendering or UI. No runtime reference-centre switching inside SampledTrajectory. Do not redesign State, ScalePolicy or floating origin.

## Technical Verification

Focused Vitest runs during iteration; configured gates at handoff per AGENTS.md. Later evaluation follows `agent-skills/references/check-method.md`.

## Technical Evidence

Per-criterion outcomes:
1. Body identity opened: `BodyId = string`; new `CenterId = "earth"|"moon"|"sun"` keeps centers natural (`State.center`, `Trajectory.stateAt` center param, `Body.parentId`). Runtime guard `assertCenterId` in `createCenteredPosition` and `inverseCenteredPosition`. Earth/Moon orientation requirement untouched. Typecheck clean; the 58 existing tests pass.
2. `Trajectory.bounds?: TimeBounds` added; MoonTrajectory unchanged in behaviour (only its center param type narrowed to `CenterId`).
3. `SampledTrajectory` in `src/core/sampledTrajectory.ts`: all construction rules and rejections, exact sample states, Hermite/linear, `TrajectoryOutOfRangeError`, foreign-center rejection, fresh snapshots, `orientation: null`. Tests: "SampledTrajectory sampling and bounds", "interpolation", "validation".
4. `src/core/provenance.ts`: `Provenance`, `createProvenance`. Test "attaches provenance without affecting State".
5. `src/core/events.ts`: `TimelineEvent`, `createEvents` (sorted, unique ids). Test "validates events".
6. `tests/sampledTrajectory.test.ts` (13 tests) covers determinism, before/first/between/last/after, linear exact, cubic Hermite, circular orbit (<0.05 km), invalid frame/center/order/velocity/finite, scale and floating-origin invariance, seek vs 1x vs accelerated playback.
7. Gates run: `npm run typecheck` (pass), `npm run build` (pass; only the existing chunk-size warning), `npm test` (71/71 pass; 58 prior + 13 new). Lint is not configured, so none ran.

Mid-task finding: the invalid-center test showed center validation was only lazy; fixed by validating in the constructor.

Files read: all Task Context Files plus `tests/core.test.ts`/`tests/sceneTransforms.test.ts` (headers only). Extra reads: none beyond the Context Files (grep of `BodyId` usages across `src` to confirm the change is contained to `src/core`).
Files changed: `src/core/body.ts`, `state.ts`, `trajectory.ts`, `moonTrajectory.ts`, `referenceCenters.ts`; added `sampledTrajectory.ts`, `provenance.ts`, `events.ts`, `tests/sampledTrajectory.test.ts`. `grep -i "apollo|mission" src/core` finds nothing.

Limitations: Hermite is only checked against synthetic fixtures, not real mission data. The playback test uses an injected monotonic clock, not a real timer. No Task Check requested and no waiver recorded. The owner sets `done`.

## Drift Notes

Record each change as UNCHANGED / GENERIC EXTENSION for the design note. If opening body identity forces wider changes than planned, return REPLAN REQUIRED.

Drift record:
- `BodyId` (body.ts): GENERIC EXTENSION (opened to any string; `CenterId` carries the old natural union).
- `State.center`, `Trajectory.stateAt` center param, `Body.parentId`: UNCHANGED in behaviour, retyped to `CenterId`.
- `Trajectory.bounds`: GENERIC EXTENSION (optional).
- `SampledTrajectory`, `Provenance`, `TimelineEvent`: GENERIC EXTENSION (new). No MISSION-SPECIFIC change.
- `State`/`ScalePolicy`/floating origin/clock: UNCHANGED.
