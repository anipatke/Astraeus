---
id: T-346
title: Type the scale setting as the three choices it is
objective: O-083
status: planned
depends_on: [{task: T-345, requires: clear}]
check_waiver: {task: T-346, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T11:22:41Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: contract
planned_reads: [packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/tests/viewerLinkPin.test.ts, packages/astraeus/tests/publicApi.test.ts, packages/astraeus/tests/sceneCheck.test.ts, packages/astraeus/tests/viewerHandleType.test.ts]
planned_writes: [packages/astraeus/src/core/scalePolicy.ts, packages/astraeus/src/shell/scaleModel.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/planBodies.ts, packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/api/viewerLooks.ts, packages/astraeus/src/api/index.ts, packages/astraeus/api-surface.lock.json, packages/astraeus/README.md, packages/astraeus/tests/scaleChoice.test.ts]
---

# Type the scale setting as the three choices it is

## Outcome

The public scale types say what the engine accepts: one of three built-in scales. A host's editor offers exactly `"true-scale"`, `"readable-scale"` and `"solar-system"`, and `ScalePolicy` is no longer documented as open (AH-23; owner decision 5: custom scales wait for a real need; decision 6: typed as a closed choice).

## User Check

None visual. In a TypeScript host, `handle.setScale("huge")` is a compile error; `handle.setScale("readable-scale")` compiles; `scene.setScale(trueScale)` compiles as before.

## Done When

- `core/scalePolicy.ts` exports `type ScaleId = "true-scale" | "readable-scale" | "solar-system"`; `ScalePolicy.id` is `ScaleId`; its doc comment says the engine offers three scales and `setScale` accepts only those (no "Open:" claim). `trueScale`, `readableScale` and `solarSystemScale` keep their names and values.
- Every public place that carries a scale id uses `ScaleId`: `Scene.scales`, `ViewerHandle.scale`/`setScale`, the `ViewerChange` scale field, and any other the lock lists (find them with `grep -n '"name": "scale' packages/astraeus/api-surface.lock.json`). Internal `shell/scaleModel.ts` `ScaleId = string` becomes the core type (one source). `ScaleId` is exported from `astraeus`.
- Runtime checks stay: a JavaScript caller passing another id or object still gets `bad-scale` (existing tests `sceneCheck`, `publicApi`, `scenePin`, `viewerLinkPin` unchanged and green; they cast with `as never`).
- New `tests/scaleChoice.test.ts`: type-level assertions (`expectTypeOf` or `// @ts-expect-error` lines checked by the typecheck gate) that `setScale` on the handle and the scene refuse a fourth id and accept the three, and that `Scene.scales` is `readonly ScaleId[]`; one runtime row confirming `bad-scale` is unchanged.
- Lock regenerated (`npm run api:lock`) and the diff reviewed; README rows for `setScale` and `scales` (headings `Looks, controls and views` and `Looks, picker, scale and switches`) say the three ids and drop any wording that implies custom policies.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/scalePolicy.ts` (the `ScalePolicy` interface, the three exports)
- `packages/astraeus/src/shell/scaleModel.ts` (`ScaleId`, `scalePolicyFor`)
- `packages/astraeus/src/api/scene.ts` (around `setScale` line ~492, `scales` line ~292, `SCALES`)
- `packages/astraeus/src/api/planBodies.ts` (around `checkSolarSystemScale`, `scaleChoices`)
- `packages/astraeus/src/api/viewerHandle.ts` (lines ~76–79)
- `packages/astraeus/src/api/viewerLooks.ts` (around `setScale`)
- `packages/astraeus/src/api/index.ts` (line ~31)
- `packages/astraeus/README.md` under `Looks, controls and views` and `Looks, picker, scale and switches`

## Design References

`.savepoint/Design.md` under `Decisions`: `Public API shape (G-016, owner 2026-11-01)`; under `Interfaces and Data Flow`: `Headless use and looks as settings`.

## Guardrails

API-01, API-04, API-07, ARCH-02, STYLE-04, STYLE-07, TEST-01..04.

## Implementation Plan

1. Write `scaleChoice.test.ts` with the type assertions; show the typecheck failing (a fourth id accepted today).
2. Add `ScaleId`; narrow `ScalePolicy.id`; switch the internal alias and public reads/writes to it.
3. Update the doc comments and README rows; regenerate the lock.
4. Focused tests, typecheck, then gates.

## Boundaries

No custom scale policies, no new scales, no change to how scales map positions or radii, no change to the address `scale` parameter's behaviour (`app/viewLink.ts` keeps returning a string the caller checks). `createSolarSystemScale` stays internal.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/scaleChoice.test.ts packages/astraeus/tests/viewerLinkPin.test.ts packages/astraeus/tests/sceneCheck.test.ts packages/astraeus-site/tests/apiSurface.test.ts` and `npm run typecheck`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

Record for Design reconciliation: the scale is a closed `ScaleId` choice in the public types.
