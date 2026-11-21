---
id: T-397
title: No re-render while paused
objective: O-087
status: done
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

| Done When | Evidence |
|---|---|
| Interval uses functional update with `sameClock` | `App.tsx`: `sameClock(a, b)` helper (time, playing, rate) and `setClockSnapshot((prev) => ...)` in the 100 ms interval; `host?.publish` untouched; other `setClockSnapshot` calls left as they are |
| New table test, both paths, paused / playing / paused seek | `packages/astraeus/tests/pausedRenders.test.ts`, 6 cases pass (mount and AstraeusScene x 3); render counter on the stubbed scene plus a MutationObserver on `.timeline-time` |
| Paused case fails with old unconditional set | Local edit (`return { ...next }`): 4 of 6 fail (paused and paused-seek on both paths); reverted, 6 pass |
| Engine size <= ~200 B | Not measured (no `check:size` script found); source growth is about 11 lines; coordinator measures |
| Gates | Focused (pausedRenders, hostCallOrder, lifecycle, domShell): 118 pass. lint: one error `Method 'sync' complexity 21` (OrbitSetView, T-398 file, not mine). typecheck: errors in `tests/orbitSetSync.test.ts` (T-398, not mine). build ok. Full test: 4 failures, all in other builders' files (frameDiagnostics.test.ts x2, orbitSetSync.test.ts x2); none in mine |

Notes: the test advances the clock in 100 ms `act` steps because one `act` around a whole span batches the polls into one render. Limitations: no browser run.

## Drift Notes

None.

## Coordinator

Set done by the orchestrating session after the combined handoff gates passed with T-395, T-397, T-398, T-399 together (owner: "I mark them as they pass", O-038; G-024 decision 7 "Orchestrate each objective to completion"; "carry on orchestrating G-024", 2026-11-22): lint and Prettier clean, typecheck clean, build ok, `npm test` 321 files, 5147 passed, 3 skipped; `npm run check:pack` engine budget 1,835,598 B raw (limit 1,836,000), 525,328 B gzip (limit 527,000).
