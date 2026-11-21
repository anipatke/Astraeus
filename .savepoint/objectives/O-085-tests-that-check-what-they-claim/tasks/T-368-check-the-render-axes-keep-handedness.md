---
id: T-368
title: Check the render axes keep handedness
objective: O-085
status: planned
depends_on: []
check_waiver: {task: T-368, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:50:31Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: handedness
planned_reads: [packages/astraeus/src/app/renderCoordinates.ts, packages/astraeus/src/app/OrbitSetView.ts, packages/astraeus/src/app/keplerShader.ts, packages/astraeus/tests/sceneTransforms.test.ts, packages/astraeus-demo-showers/tests/keplerShader.test.ts]
planned_writes: [packages/astraeus/tests/renderHandedness.test.ts]
---

# Check the render axes keep handedness

## Outcome

A test computes the determinant of the EQJ-to-render axis change and requires +1, and every place that writes the same change by hand is checked against it, so a sign slip that mirrors the scene fails a test (AH-35 area: Gemini Probe D and its recommended "`eqjToRenderVector` right-handed determinant (+1)" control).

## User Check

None visual.

## Done When

- First, reproduce Gemini Probe D and record the result: flip `-vector[1]` to `vector[1]` in `eqjToRenderVector` (`src/app/renderCoordinates.ts:11`) and run `npx vitest run packages/astraeus/tests/sceneTransforms.test.ts`. The planner's reading is that "fixed render-axis conversion › preserves handedness and rotates vectors and quaternions consistently" (`tests/sceneTransforms.test.ts:35-37`, x × y = z) already fails on that flip; record whether it does. Revert.
- New `packages/astraeus/tests/renderHandedness.test.ts`:
  - builds the 3×3 matrix from `eqjToRenderVector` of the three unit vectors and asserts determinant exactly `1` and the matrix orthonormal (MᵀM = I);
  - asserts `eqjToRenderQuaternion` keeps unit length and that converting a rotation then the vector equals rotating the converted vector (one random-but-seeded quaternion and vector; the existing case uses Earth's orientation, this one does not need the ephemeris);
  - one row per hand-written copy of the conversion found by the planner, each compared with `eqjToRenderVector` on a non-symmetric vector (for example `[0.3, -0.5, 0.8]`):
    - `src/app/OrbitSetView.ts` ~385–388, the scale-only fast path (`out[to + 2] = -(km[at + 1] - my) * linear`): drive it through the class's public placement on a scale-only policy and compare with the general path (~391), unless an existing test already does (search `tests/` for it first and record the case name; then this row is "covered by <case>");
    - `src/app/keplerShader.ts` ~109–115 (`axisP`/`axisQ` written as `(x, z, -y)`): compare the axes the exported builder writes with `eqjToRenderVector` of the EQJ axes, or record the existing `keplerShader` case that already pins it.
- Deliberate breaks, each recorded and reverted: the Probe D flip fails the determinant case; flipping the sign at `OrbitSetView.ts` ~388 fails its row (or the named existing case); flipping at `keplerShader.ts` ~111 fails its row (or the named existing case). `git diff packages/astraeus/src` empty afterwards.
- Existing tests unchanged.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/renderCoordinates.ts` (whole file, 20 lines)
- `packages/astraeus/tests/sceneTransforms.test.ts` (lines ~1–45)
- `packages/astraeus/src/app/OrbitSetView.ts` (~370–396, the placement function around the fast path)
- `packages/astraeus/src/app/keplerShader.ts` (~95–120)
- `packages/astraeus-demo-showers/tests/keplerShader.test.ts` (case names only, to find an existing axis check)

## Design References

`.savepoint/Design.md` under `Core layers and demos` (the app projects state into render coordinates).

## Guardrails

ARCH-02, TEST-01, TEST-02, TEST-03, STYLE-07.

## Implementation Plan

1. Probe D; record.
2. Determinant and quaternion cases.
3. Search for existing coverage of the two hand-written copies; add rows only where none fails on the sign flip.
4. Breaks; revert; gates.

## Boundaries

Test only. Do not refactor `OrbitSetView` or `keplerShader` to call `eqjToRenderVector` (the copies exist for per-frame speed); if a copy cannot be reached without a new export, record it as a finding for the coordinator instead.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/renderHandedness.test.ts packages/astraeus/tests/sceneTransforms.test.ts packages/astraeus-demo-showers/tests/keplerShader.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

If Probe D did not reproduce (the existing case catches the flip), say so here; the review's AH entry is then partly stale and the coordinator notes it at the Full Check.
