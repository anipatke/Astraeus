---
id: T-368
title: Check the render axes keep handedness
objective: O-085
status: done
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

| Done When | Evidence |
|---|---|
| Probe D reproduced | Flipping `-vector[1]` to `vector[1]` in `eqjToRenderVector` and running `sceneTransforms.test.ts`: 9 of 27 fail, including "preserves handedness and rotates vectors and quaternions consistently". Probe D IS caught by the existing check (reverted). |
| Determinant +1 and orthonormal | `renderHandedness.test.ts` "has determinant +1 and is orthonormal" (exact `toBe(1)`, MtM = I). Fails under Probe D (`expected -1 to be 1`). |
| Quaternion unit length, rotate-then-convert equals convert-then-rotate | "keeps a quaternion unit length and rotates consistently with the vector": seeded LCG quaternion, no ephemeris, vector [0.3,-0.5,0.8]. Fails under Probe D. |
| OrbitSetView fast path (~388) | No existing test caught it: flipping the sign at the fast path left `bodySet.test.ts` and `plutoOrbitLines.test.ts` at 18/18 passing. New row "the orbit lines' scale-only fast path draws what the general path draws": inclined made-up orbit, same view on `trueScale` vs the same scaling without `linearUnitsPerKm` (general path), compares drawn path and head vertices. Fails on the flip (`expected -4.35 to be close to 4.35`). |
| keplerShader (~111) | Covered by existing `astraeus-demo-showers/tests/keplerShader.test.ts` cases "matches a made-up group with eccentricities up to 0.99 across two years" and both shipped sets "matches every member across the timeline" (3 fail on the flip). No new row; noted in a comment in the new file. |
| Breaks reverted | `git diff packages/astraeus/src` empty after each break. |
| Existing tests unchanged | Only the new test file was added. |

Commands: focused `npx vitest run packages/astraeus/tests/renderHandedness.test.ts` (3 pass; breaks as above). Gates under flock: lint clean, typecheck clean, build ok, `npm test`: 303 files, 5037 passed, 2 skipped.

Files changed: `packages/astraeus/tests/renderHandedness.test.ts` (new). No extra reads beyond Context Files plus `OrbitSetView.ts` sync/place/mapPath, `scalePolicy.ts` (linearUnitsPerKm), `bodySet.test.ts` and `plutoOrbitLines.test.ts` (to find existing coverage and build a layer).

Limitations: the fast-path row compares to the general path (itself eqjToRenderVector), at float32 tolerance 1e-5 (units are scene units, magnitudes ~4).

## Drift Notes

If Probe D did not reproduce (the existing case catches the flip), say so here; the review's AH entry is then partly stale and the coordinator notes it at the Full Check.

None for Design. Probe D did reproduce (the existing case catches it), so the review's AH entry is partly stale: the `eqjToRenderVector` flip was already caught; the unguarded copy was the OrbitSetView fast path, now covered.

Coordinator (orchestrate-g024-20261121): gates green (lint, typecheck, build; `npm test` 303 files, 5037 passed). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
