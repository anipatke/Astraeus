---
id: T-373
title: Make a drawing-space vector used as an EQJ vector fail to compile
objective: O-093
status: planned
depends_on: []
check_waiver: {task: T-373, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T19:19:52Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: frames
planned_reads: [packages/astraeus/src/core/state.ts, packages/astraeus/src/core/bodyOrientation.ts, packages/astraeus/tests/sceneTransforms.test.ts, packages/astraeus/tests/scaleChoice.test.ts]
planned_writes: [packages/astraeus/src/app/renderCoordinates.ts, packages/astraeus/src/core/state.ts, packages/astraeus/src/core/scalePolicy.ts, packages/astraeus/tests/frameBrands.test.ts]
---

# Make a drawing-space vector used as an EQJ vector fail to compile

## Outcome

Vectors and quaternions in the drawing library's axes (`RenderVector`, `RenderQuaternion`) carry a light nominal frame tag, and the EQJ inputs of the frame boundary (`eqjToRenderVector`, `eqjToRenderQuaternion`, `ScalePolicy.mapPosition`) refuse a tagged render value, so converting twice or scaling a render vector fails `npm run typecheck` (AH-21 part a: Gemini CQ-02 recommendation `EqjKmVec3` vs `RenderVec3`, `EqjQuat` vs `RenderQuat`, `audits/2026-11-21_google_gemini-4-neon_auditfindings.md:204`).

## User Check

None visual. `npm run typecheck` passes; the planted slips in `tests/frameBrands.test.ts` are each under `// @ts-expect-error`.

## Done When

- `core/state.ts` (where `EQJ` lives) declares a type-only frame brand symbol and `EqjVectorInput = ArrayLike<number> & { readonly [frame]?: "eqj" }`: plain arrays and `Float64Array`s still pass; a value tagged `"render"` does not. `EqjQuaternionInput` likewise.
- `app/renderCoordinates.ts`: `RenderVector` and `RenderQuaternion` carry `{ readonly [frame]: "render" }`; the two converters take the EQJ input types and return tagged values (the casts live only there). Runtime arrays are unchanged (`[x, z, -y]`).
- `core/scalePolicy.ts`: `mapPosition(positionKm: EqjVectorInput)` on the interface and the three policies.
- Call sites that build a render vector by hand compile through the converters or one named maker in `renderCoordinates.ts`; the number of touched call sites is recorded. If more than about fifteen files need edits beyond a type annotation, stop and report REPLAN.
- New `tests/frameBrands.test.ts`: planted slips under `// @ts-expect-error`: `eqjToRenderVector(eqjToRenderVector(v))`, `trueScale.mapPosition(renderVector)`, `eqjToRenderQuaternion(eqjToRenderQuaternion(q))`. Each is shown to compile without the brand (scratch removal, typecheck), then restored. One runtime case checks the converters still return `[x, z, -y]` and `[x, z, -y, w]`.
- `tests/sceneTransforms.test.ts` (handedness) green and unedited; `tests/fixtures/scenePin.json` byte-identical.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/renderCoordinates.ts`
- `packages/astraeus/src/core/state.ts` (`EQJ`, `Quaternion`)
- `packages/astraeus/src/core/scalePolicy.ts` (`ScalePolicy.mapPosition`, the three policies)
- `packages/astraeus/tests/sceneTransforms.test.ts`
- `packages/astraeus/tests/scaleChoice.test.ts` (the `@ts-expect-error` pattern)

## Design References

`.savepoint/Design.md` under `Core layers and demos` (the app projects state into render coordinates).

## Guardrails

ARCH-02, ARCH-04, STYLE-04, STYLE-05, TEST-01, TEST-02.

## Implementation Plan

1. Add the brand and input types in `core/state.ts`; tag the render types.
2. Retype the converters and `mapPosition`; follow the compiler through `src/app`.
3. Write `frameBrands.test.ts`; prove each slip.
4. Focused tests, typecheck time, gates.

## Boundaries

No runtime change, no public signature change (the API lock must not move; `ScalePolicy` is public, so `mapPosition`'s parameter must stay assignable from `ArrayLike<number>`: check `npm run api:lock` shows no diff, else stop and report). The hand-written axis changes in `OrbitSetView.ts` and `keplerShader.ts` are O-085's (draft 08), not this Task's. No change to `scalePolicy.ts` beyond the parameter type (O-093 draft 08 moves the file later).

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/frameBrands.test.ts packages/astraeus/tests/sceneTransforms.test.ts packages/astraeus/tests/scenePin.test.ts packages/astraeus/tests/sceneTargets.test.ts`, plus `npm run typecheck`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

For Design reconciliation (`Core layers and demos`): render values are frame-tagged; EQJ inputs refuse them at the boundary.
