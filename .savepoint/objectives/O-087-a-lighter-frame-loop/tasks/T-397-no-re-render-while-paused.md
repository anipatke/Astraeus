---
id: T-397
title: No re-render while paused
objective: O-087
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-397, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:11:52Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: coordinator
planned_reads: [packages/astraeus/src/core/clock.ts, packages/astraeus/src/api/viewerClock.ts, packages/astraeus/tests/hostCallOrder.test.ts, packages/astraeus/tests/domSetup.ts]
planned_writes: [packages/astraeus/src/app/App.tsx, packages/astraeus/tests/pausedRenders.test.ts]
---

# No re-render while paused

## Outcome

A paused viewer stops re-rendering its React tree ten times a second: the 100 ms clock poll updates the coordinator's clock state only when the time, playing state or rate actually changed (AH-11; Objective condition 4).

## User Check

None visual (draft 08: the time text and play button still behave).

## Done When

- In `App.tsx`'s 100 ms interval (~736-743) the clock state is set through a functional update that returns the previous snapshot when `timeUtcMs`, `playing` and `rate` are all equal (React then skips the render). One small helper (`sameClock(a, b)`) holds the rule; the other `setClockSnapshot(runtime.clock.snapshot())` calls (seek, rate, play) may use it too. `host?.publish(...)` is left as it is (`viewerClock.publish` already reports only changes).
- New `packages/astraeus/tests/pausedRenders.test.ts` (happy-dom; the 3D scene stubbed as `hostCallOrder.test.ts` does; a made-up scene, ARCH-03), on both embedding paths (`mount` and `AstraeusScene`, API-02), as one table:
  - "does not re-render while the clock is paused": after mount and settle, advancing fake timers 2 s while paused adds 0 renders of the stubbed scene component (render counter) and of the timeline time text node.
  - "re-renders while playing": playing for 1 s adds at least 5 renders.
  - "re-renders once for a paused seek": a host `seek` while paused adds exactly 1 render and the time text shows the new time.
  - The paused case fails with the old unconditional `setClockSnapshot` (local edit, revert, record).
- Engine size: raw growth at most ~200 B; engine-size check passes; bytes recorded.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/App.tsx` (the clock state ~493, the interval ~735-743, `seekTo` ~745-760, rate change ~770-780)
- `packages/astraeus/src/core/clock.ts` (`ClockSnapshot`, `snapshot`; read only)
- `packages/astraeus/tests/hostCallOrder.test.ts` (lines 1-60, the stub pattern; read only)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` > `Host calls land in order`.

## Guardrails

API-02, ARCH-03, TEST-01, TEST-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Add `sameClock` and the functional update in the interval.
2. Write the table test on both paths; prove the paused case fails without the fix.
3. Focused tests, size check, gates.

## Boundaries

No coordinator restructuring, memo boundaries or `AstraeusScene` ref changes (O-089). No change to the developer-mode 250 ms poll, `frameTime`, pacing or host publishing.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/pausedRenders.test.ts packages/astraeus/tests/hostCallOrder.test.ts packages/astraeus/tests/lifecycle.test.ts packages/astraeus/tests/domShell.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
