---
id: T-399
title: Path lines skip unchanged frames
objective: O-087
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-399, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:11:52Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: paths
planned_reads: [packages/astraeus/src/app/pathRules.ts, packages/astraeus/tests/orbitLook.test.ts, packages/astraeus/tests/longOrbitPaths.test.ts, packages/astraeus/src/app/sceneFrame.ts]
planned_writes: [packages/astraeus/src/app/PathView.ts, packages/astraeus/tests/pathViewSync.test.ts]
---

# Path lines skip unchanged frames

## Outcome

A path or orbit line does not re-evaluate its vertices or re-sample its bright arc (about 129 source states per frame for the Moon's look) when the clock time, placement, scale and look are unchanged, and does not re-upload its buffers when the camera origin and screen are unchanged too (AH-14; Objective condition 5; Gemini RND-06 at the old `PathView.ts:209-239`, now `sync` ~541 and `#updateLook` ~285-329).

## User Check

None visual (draft 08 looks at the Moon's orbit line).

## Done When

- `setLook` (~450) compares the new look by value with the current one (the frame passes a fresh `{ ...defaultLook, ...orbitLook }` every frame, sceneFrame `syncViews`) and changes nothing, and marks nothing stale, when equal.
- `sync` (~541), after its resample check, returns early when `timeUtcMs`, the placement (centre and resolver), the scale policy and the look are the same as at its last full run and no resample happened; then no `stateAt`, `eqjMapped` or `#updateLook` call happens.
- `place` (~577) skips the vertex copy, ribbon build and `needsUpdate` when no sync ran and the origin (`scaledCameraOrigin`) and screen (`fovDeg`, `viewportHeightPx`) are unchanged; the zoom opacity rule is unchanged.
- New `packages/astraeus/tests/pathViewSync.test.ts` (made-up orbit, relative trail and inertial trail paths, ARCH-03), one table test across path kinds and input changes:
  - "does not re-evaluate an unchanged frame": spied `source.stateAt` is called 0 times on a second `sync` with identical inputs (and with a value-equal fresh look object).
  - "re-evaluates when an input changes": time, placement centre, policy, each look field each cause a full run with the same output as a fresh view.
  - "does not re-upload an unchanged frame": the position attributes' `version` is unchanged after a second `place` with the same origin and screen; it changes when either moves.
  - Each case fails on the old code (record which).
- `orbitLook.test.ts`, `longOrbitPaths.test.ts`, `renderHandedness.test.ts` pass unchanged.
- Engine size: raw growth at most ~300 B; engine-size check passes; bytes recorded.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/PathView.ts` (`#updateLook` ~285-329, `setColor`/`setLook`/`#applyOpacity` ~440-474, `sync` ~541-575, `place` ~577-602)
- `packages/astraeus/src/app/sceneFrame.ts` (`syncViews`; read only)
- `packages/astraeus/tests/orbitLook.test.ts` (read only)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` > `Paths across the solar system`.

## Guardrails

ARCH-02, ARCH-03, TEST-01, TEST-02, STYLE-02, STYLE-10.

## Implementation Plan

1. Value-equal `setLook`.
2. Early-out key in `sync`; output-equality with a fresh view.
3. `place` early-out.
4. Table test; fail-on-old proof; focused tests; size; gates.

## Boundaries

`PathView.ts` only. No change to sampling counts, refresh policy, look maths, `pathRules.ts`, `PointsView`, `StateResolver` caching or `sceneFrame.ts`.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/pathViewSync.test.ts packages/astraeus/tests/orbitLook.test.ts packages/astraeus/tests/longOrbitPaths.test.ts packages/astraeus/tests/renderHandedness.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
