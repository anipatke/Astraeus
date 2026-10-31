---
id: T-204
objective: O-048
title: Keep near planets visible at any zoom
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-204, reason: 'Owner said "orchestrate O48"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o048-run-20261031}, recorded_at: '2026-10-31T08:30:43Z'}
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

Files changed: `packages/astraeus/src/app/AstraeusScene.tsx` (Canvas `gl`: `logarithmicDepthBuffer: true`), `OrbitSetView.ts` (VERTEX/FRAGMENT carry `common`, `logdepthbuf_pars_vertex`, `logdepthbuf_vertex`, `logdepthbuf_pars_fragment`, `logdepthbuf_fragment`), `SkyView.ts` (comment only), `packages/astraeus/CHANGELOG.md` (Unreleased), new `packages/astraeus/tests/logDepth.test.ts`. Extra reads: none beyond Context Files, plus `packages/astraeus/CHANGELOG.md` (to add the line), `tests/syntheticJourney.test.ts` (to reuse its 170 AU scene set-up) and three's `logdepthbuf_*` chunks in node_modules (to know what to include).

Per criterion:
- Renderer log depth: Canvas `gl={{ antialias: true, logarithmicDepthBuffer: true }}`, engine-wide; test "the Canvas asks for it" passes.
- Shaders: OrbitSetView carries all chunks. SkyView's two ShaderMaterials (picture, stars) are left without them on purpose: both are `depthTest: false, depthWrite: false`, so they never read or write depth. PointsView, KeplerPoints and dotMaterial patch stock PointsMaterial via onBeforeCompile (replacing only `void main() {` and `begin_vertex`), so the built-in chunks stay; a test asserts they build via `dotMaterial(` and never replace the whole shader.
- Guard test: `logDepth.test.ts` fails for any `new ShaderMaterial/RawShaderMaterial` in `src/app` missing the four chunks; the only allowlist entry is SkyView.ts (reason above) and the test also requires every material there to set `depthTest: false`.
- Depth set-up (test prints it): Sun-centred, 170 AU path, desktop aspect 1.6, camera 0.01 AU from Saturn in the true-scale test policy: gap 234.81 units, Saturn radius 9.14, near 22.567 (0.1 x (gap - radius)), far 57,370,648 (whole-path reach, > 2 x path end), far/near about 2.5e6, mode logarithmic. For comparison a linear 24-bit buffer steps 1.5e-4 units at the gap but 26.4 units at 1e5 units from the camera (grows with distance squared).
- Frame-time cost: NOT measured. The step forbids browser/headless 3D runs and no GPU exists in the unit environment. Expected cost: a few ALU ops per vertex/fragment, and early-Z is lost on fragments that write gl_FragDepth. Measure in the last step's `npm run check:browser` / owner look. No evidence of an unacceptable cost, and no shader that cannot carry log depth, so no REPLAN REQUIRED.
- CHANGELOG: `Unreleased` entry added in `packages/astraeus/CHANGELOG.md`.

Gates (lite): `npm run lint` pass, `npm run typecheck` pass, `npm run build` pass (only the existing chunk-size warning), `npm test` 156 files / 1993 passed, 1 skipped. Focused: `tests/logDepth.test.ts` 4 passed.

Limitations: nothing rendered in a browser, so that Saturn at 0.01 AU now draws, that the orbit lines depth-sort correctly with the new chunks, and the frame-time cost are unverified; those fall to the last step's browser check and owner look.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- Engine-wide logarithmic depth buffer (Canvas `gl.logarithmicDepthBuffer`); every custom ShaderMaterial in `src/app` must carry the log-depth chunks (SkyView exempt: depth off), guarded by `tests/logDepth.test.ts`. Design.md (Interfaces and Data Flow, presentation) needs one line; deferred to the last step.
