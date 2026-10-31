---
id: T-204
objective: O-048
title: Keep near planets visible at any zoom
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-2-20261031}
---

# Keep near planets visible at any zoom

## Outcome

The engine renders with a logarithmic depth buffer, so a planet or moon near the camera draws correctly however far the far plane reaches (I-117); every custom shader carries the log-depth chunks, and a test fails if one does not.

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- The renderer is created with `logarithmicDepthBuffer: true` (`src/app/AstraeusScene.tsx` Canvas `gl`), engine-wide, not per scene.
- Every custom shader in `src/app/` works with it: `SkyView.ts` (ShaderMaterial: add `logdepthbuf_pars_*` and `logdepthbuf_*` chunks, or state why the sky needs none, e.g. drawn without depth), `OrbitSetView.ts`, and the `onBeforeCompile` patches in `PointsView.ts`, `KeplerPoints.ts`, `dotMaterial.ts` (built-in chunks kept).
- A test fails if a ShaderMaterial/RawShaderMaterial in `src/app/` lacks the log-depth chunks (allowlist only with a reason), like the dot-material check.
- A test (or measured evidence) shows the depth set-up the I-117 scene uses: Sun-centred, 170 AU path, whole-path reach, camera 0.01 AU from Saturn; record near, far and depth mode.
- Frame-time cost measured on the synthetic journey before/after in a headless run or a unit measure; if it is unacceptable or a shader cannot carry log depth, return REPLAN REQUIRED naming reversed-Z as the alternative.
- CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/app/AstraeusScene.tsx`, `packages/astraeus/src/app/CameraController.tsx`, `packages/astraeus/src/app/sceneFraming.ts`, `packages/astraeus/src/app/SkyView.ts`, `packages/astraeus/src/app/OrbitSetView.ts`, `packages/astraeus/src/app/PointsView.ts`, `packages/astraeus/src/app/KeplerPoints.ts`, `packages/astraeus/src/app/dotMaterial.ts`, `packages/astraeus/tests/dotMaterial.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (presentation).

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Turn on log depth; fix each custom shader.
3. Add the shader-chunk guard test and the depth set-up test.
4. Measure cost; record. CHANGELOG.

## Boundaries

No change to the I-114 reach rule, scale, or looks.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
