---
id: T-366
title: Run the patched dot shaders in tests
objective: O-085
status: done
depends_on: []
check_waiver: {task: T-366, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:50:31Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: shaders
planned_reads: [packages/astraeus/src/app/PointsView.ts, packages/astraeus/src/app/KeplerPoints.ts, packages/astraeus/src/app/dotMaterial.ts, packages/astraeus/src/app/keplerShader.ts, packages/astraeus/tests/groupLookRender.test.ts, packages/astraeus-demo-showers/tests/keplerShader.test.ts]
planned_writes: [packages/astraeus/tests/patchedShaders.test.ts]
---

# Run the patched dot shaders in tests

## Outcome

Each stock material the engine patches through `onBeforeCompile` is run in a test against the real three.js shader source, and the test fails when one of its chunk replacements does not land, so a chunk rename inside the `three >=0.169 <1` peer range is caught (AH-32: Claude F-02 and its suggested shader-injection test).

## User Check

None visual.

## Done When

- New `packages/astraeus/tests/patchedShaders.test.ts`, one table over the two patched materials the planner found (`src/app/PointsView.ts:185` → `#blendInVertexShader` ~368; `src/app/KeplerPoints.ts:45` → `#placeInVertexShader` ~75). Each row:
  - builds the real view (`new PointsView(...)` as `tests/groupLookRender.test.ts:49` does; `new KeplerPoints(elements, "#ffffff", 1.5)` as `packages/astraeus-demo-showers/tests/keplerShader.test.ts:53` does, with a small synthetic element set) and takes its material (for `PointsView`, from the `Points` in `view.group`, or the Kepler child where the group is large enough to have one; no new public accessor);
  - hands `material.onBeforeCompile` a shader object made from three's own source: `ShaderLib.points.vertexShader`, `ShaderLib.points.fragmentShader` and `UniformsUtils.clone(ShaderLib.points.uniforms)` (the source `PointsMaterial` compiles from);
  - asserts every replacement landed: each needle (`void main() {`, `#include <begin_vertex>`) was present in three's source before the call, is replaced after it (`#include <begin_vertex>` gone, the replacement text present: `positionTo`/`uBlend`/`uOffset` for the blend, the Kepler attribute and begin-vertex GLSL for Kepler), and the uniforms the material needs are on `shader.uniforms`;
  - asserts three's own chunks the patch must keep are still there (`#include <logdepthbuf_vertex>`, `#include <logdepthbuf_pars_vertex>`, `#include <project_vertex>`).
- The test also expands the patched vertex shader's `#include <...>` lines through three's `ShaderChunk` (`ShaderChunk[name]`) once and asserts every include named resolves to a chunk that exists in the installed three, so a renamed chunk the patch relies on fails here rather than at GPU compile time.
- Deliberate break, recorded and reverted: change the needle in `#blendInVertexShader` to `"#include <begin_vertexX>"`; the blend row fails. Same for Kepler. Show `git diff packages/astraeus/src` empty afterwards.
- The row list is the set of `onBeforeCompile` assignments in `packages/*/src` (grep recorded in Technical Evidence); a further one found is added as a row.
- Existing tests unchanged, including `tests/logDepth.test.ts` "the patched stock-material shaders keep the built-in chunks" (a text pin; retiring it is O-088).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/PointsView.ts` (constructor ~170–195; `#blendInVertexShader` ~368–374)
- `packages/astraeus/src/app/KeplerPoints.ts` (constructor ~30–51; `#placeInVertexShader` ~75–80)
- `packages/astraeus/src/app/dotMaterial.ts` (`dotMaterial` ~39)
- `packages/astraeus/src/app/keplerShader.ts` (the exported GLSL constants the Kepler patch inserts; names only)
- `packages/astraeus/tests/groupLookRender.test.ts` (the `belt` helper and `new PointsView` lines ~40–66)
- `packages/astraeus-demo-showers/tests/keplerShader.test.ts` (how it builds `KeplerPoints`, ~40–55)

## Design References

`.savepoint/Design.md` under the heading "Groups and the `points` layer (O-009)".

## Guardrails

TEST-01, TEST-02, TEST-03, ARCH-03.

## Implementation Plan

1. Build the shader object from `ShaderLib.points`; confirm the needles exist in the installed three (0.169.x).
2. Write the table test; run it green.
3. Break each needle in turn; record; revert.

## Boundaries

Test only; no change to `src/app` (no `replaceOnce` helper or new export unless a row cannot reach its material without one, in which case return REPLAN REQUIRED). No GPU read-back. The atmosphere material is draft 07's.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/patchedShaders.test.ts packages/astraeus/tests/logDepth.test.ts packages/astraeus/tests/groupLookRender.test.ts packages/astraeus-demo-showers/tests/keplerShader.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

New `packages/astraeus/tests/patchedShaders.test.ts` (only file changed). Grep `onBeforeCompile packages/*/src`: exactly two assignments (PointsView.ts:185, KeplerPoints.ts:45), both rows.

| Done When | Evidence |
|---|---|
| One table, two rows, real views, three's own `ShaderLib.points` source, replacements landed, uniforms present, kept chunks present | `it.each(ROWS)` in patchedShaders.test.ts; green (3 tests) |
| Includes resolve through `ShaderChunk` | same test, `names` loop |
| Deliberate break | `#include <begin_vertexX>` in PointsView: blend row failed ("begin_vertex replaced"); same in KeplerPoints: Kepler row failed; `void mainX() {` in KeplerPoints: Kepler row failed; all reverted, `git diff --stat packages/astraeus/src` empty |
| Row list = grep | two assignments, two rows |
| Existing tests unchanged | none edited |
| Gates | lint, typecheck, build clean; npm test 5032 passed, 2 failed, both in packages/astraeus-site/tests/loadingCoverChain.test.ts (T-365's in-progress file), not mine |

Limitation: no GPU compile; text-level only.

## Drift Notes

None expected.

Coordinator (orchestrate-g024-20261121): lint, typecheck, build green; `npm test` 5032 passed, the two failures in T-365's in-flight `loadingCoverChain.test.ts` (passed alone, rechecked at the Full Check). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
