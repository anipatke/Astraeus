---
id: T-429
title: Views free what they own when a viewer goes
objective: O-092
status: done
depends_on: [{task: T-428, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-429, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "Carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T04:52:00Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: views
planned_reads: [packages/astraeus/src/app/PathView.ts, packages/astraeus/src/app/PointsView.ts, packages/astraeus/src/app/KeplerPoints.ts, packages/astraeus/src/app/TrackedBodyView.ts, packages/astraeus/src/app/BodyView.tsx, packages/astraeus/src/app/bodyDraw.ts, packages/astraeus/src/app/sceneHooks.ts, packages/astraeus/src/app/BodySetView.ts, packages/astraeus/src/app/OrbitSetView.ts, packages/astraeus/src/app/SkyView.ts, packages/astraeus/src/app/SkyFiguresView.ts, packages/astraeus/src/app/RingView.ts, packages/astraeus/tests/sceneHooksDom.test.ts, packages/astraeus/tests/bodyViewDom.test.ts, packages/astraeus/tests/patchedShaders.test.ts]
planned_writes: [packages/astraeus/src/app/disposeOwned.ts, packages/astraeus/src/app/PathView.ts, packages/astraeus/src/app/PointsView.ts, packages/astraeus/src/app/KeplerPoints.ts, packages/astraeus/src/app/TrackedBodyView.ts, packages/astraeus/src/app/BodyView.tsx, packages/astraeus/src/app/sceneHooks.ts, packages/astraeus/src/app/SkyView.ts, packages/astraeus/src/app/SkyFiguresView.ts, packages/astraeus/src/app/RingView.ts, packages/astraeus/src/app/OrbitSetView.ts, packages/astraeus/tests/viewDisposal.test.ts, packages/astraeus/tests/sceneViewsDisposalDom.test.ts, packages/astraeus/tests/bodyViewDisposalDom.test.ts]
---

# Views free what they own when a viewer goes

## Outcome

Unmounting a viewer disposes every geometry, material and picture its views made, and nothing another viewer uses: the path, point-group (with its shader-placed child) and tracked-body views gain `dispose`, the scene calls it, and a body's marker, stand-in dot and halo are disposed with the body. A table test listens for `dispose` on everything each view owns, and a scan fails when a new view class makes GPU objects without joining that table (AH-13 "path, points and tracked-body views have no dispose"; Claude audit R-7 and its suggested table test, `audits/2026-11-21_anthropic_claude-fable-5-2_auditfindings.md` ~316, ~511; Gemini RND-05).

## User Check

None visual: disposal happens only when a viewer or a view set goes away. Draft 01's `two-viewers` step, which the Full Check adds by its policy row (this Task's view `dispose` paths are in it), proves the second viewer keeps drawing; `PointsView.ts`/`KeplerPoints.ts` (Shaders) and `SkyView.ts`/`SkyFiguresView.ts` if touched (Sky) also add `look-out`.

## Done When

- New `packages/astraeus/src/app/disposeOwned.ts` exports one function that walks an `Object3D` and disposes each mesh, line, points or sprite's geometry, its material or materials, and each material's `map`. It disposes nothing else (no shader-uniform textures; the views that hold those already dispose them).
- `PathView`, `PointsView`, `KeplerPoints` and `TrackedBodyView` each have `dispose(): void`. `PointsView.dispose` covers its `KeplerPoints` child; `PathView.dispose` covers the arc mesh and material when the orbit look made them (`PathView.ts` `#addLookLayers` ~238–290). Each uses `disposeOwned(this.group)` (or `this.points` for `KeplerPoints`) unless a view needs more.
- `dispose()` only frees GPU copies: it clears no field and drops no array, so a view disposed and then drawn again (React StrictMode runs an effect's cleanup and then the effect again on the same `useMemo` value) is re-uploaded by three and still draws. A table case proves it: after `dispose()`, every geometry attribute still holds its array and count.
- `useSceneViews` (`sceneHooks.ts` ~63–122) disposes `trackedViews`, `groupViews`, `sunCentredViews` and `compositionPaths` in effect cleanups, one effect per memo, the way it already does for `bodySetViews` and `orbitSetViews` (~100–111) and `skyFiguresView` (~91). Re-checked after O-087/O-089 (2026-11-22): none of the four memos has a cleanup yet, and no `dispose` exists on `PathView`, `PointsView`, `KeplerPoints` or `TrackedBodyView`.
- `BodyView` (`BodyView.tsx` ~73–84) disposes `marker`, `standIn` and `glow` with `disposeOwned` in effect cleanups keyed on each memo.
- New `tests/viewDisposal.test.ts`, one table over every view class that makes GPU objects: `PathView` (with and without the orbit look), `PointsView` (small, and large enough to build `KeplerPoints`, as `patchedShaders.test.ts` builds one), `KeplerPoints`, `TrackedBodyView`, `BodySetView`, `OrbitSetView`, `SkyView` (stars set, picture built), `SkyFiguresView`, `RingView`. Each row builds the view from made-up data, collects every geometry, material and texture reachable from its root (including `material.map` and texture values in `ShaderMaterial` uniforms), listens for `dispose` on each, calls `dispose()` and asserts each heard it at least once. Three's shared sprite geometry (`new Sprite().geometry`) hears none.
- A two-view row (API-03): two views built from the same layer object share no geometry, material or texture, and disposing one leaves every object of the other undisposed.
- A scan case in the same file reads `packages/astraeus/src/app/*.ts` and `*.tsx` and, for every exported class whose body constructs a three.js geometry, material or texture (`new \w*(Geometry|Material|Texture)\(` or `dotMaterial(`), requires a `dispose(` method in the class and the class's name among the table's rows, so a new view cannot skip disposal (strategic-fix rule: the trap becomes a failing test).
- If a table row for an existing view (`BodySetView`, `OrbitSetView`, `SkyView`, `SkyFiguresView`, `RingView`) fails, the omission is fixed in that view's `dispose` in this Task and named in Technical Evidence; only the missing dispose lines change.
- New `tests/sceneViewsDisposalDom.test.ts` (r3f, `assets/sky` and `app/sceneFrame` mocked exactly as `sceneHooksDom.test.ts` ~13–30 does; a stand-in `gl` with `getPixelRatio` and `capabilities.getMaxAnisotropy`): a probe calling `useSceneViews` with a runtime that has a tracked body, a point group, a Sun-centred path, a composition path, a body set and a sky; unmount disposes every owned object of every view once. Two probes from the same runtime: unmounting the first leaves every object of the second undisposed; unmounting the second then disposes them.
- New `tests/bodyViewDisposalDom.test.ts` (mocks as `bodyViewDom.test.ts` ~10–33): a marker body, a sphere body (stand-in dot) and a body with a halo each dispose their objects on unmount; two `BodyView`s of the same asset share nothing and one's unmount leaves the other's objects undisposed.
- Engine size from `npm run check:pack` recorded before and after; allowance +400 B (cap 1,838,000 B raw; about 11.5 KB headroom at C-211 before O-092).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/sceneHooks.ts` (`useSceneViews` ~63–122)
- `packages/astraeus/src/app/PathView.ts` (constructor and `#addLookLayers` ~197–290; `createPathViews` ~764, `compositionPathView` ~810)
- `packages/astraeus/src/app/PointsView.ts` (fields and constructor ~127–210)
- `packages/astraeus/src/app/KeplerPoints.ts` (constructor ~41–65)
- `packages/astraeus/src/app/TrackedBodyView.ts` (`lineWithCapacity` ~39–47, constructor ~108–138)
- `packages/astraeus/src/app/BodyView.tsx` (memos and effects ~71–124)
- `packages/astraeus/src/app/bodyDraw.ts` (`createMarker` ~90–106, `createGlow` ~231)
- `dispose` of `BodySetView.ts` (~266), `OrbitSetView.ts` (~677), `SkyView.ts` (`#clear` ~188, `dispose` ~280), `SkyFiguresView.ts` (~400), `RingView.ts` (~143)
- `packages/astraeus/tests/sceneHooksDom.test.ts` (mocks and harness ~1–70; the mocks ~13–30 include `app/sceneFrame` since O-087)
- `packages/astraeus/tests/bodyViewDom.test.ts` (mocks and harness ~1–70)
- `packages/astraeus/tests/patchedShaders.test.ts` (the made-up `belt()` ~31; `new PointsView(belt(2500))` builds `KeplerPoints`, ~46 and ~105)

## Design References

`.savepoint/Design.md` under `Good guest`.

## Guardrails

API-03, ARCH-03, TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Start from the merged head (draft 02 merged; O-087's changes to `PathView.ts` and `OrbitSetView.ts` are already on `main`, anchors refreshed 2026-11-22). Re-read those two files at Task start.
2. Write the table and the scan; see the new rows fail (no `dispose`) and record which existing rows pass.
3. Add `disposeOwned.ts` and the four `dispose` methods.
4. Wire `useSceneViews` and `BodyView` cleanups; write the two hook tests.
5. Fix any existing-view omission the table found.
6. Focused tests, size, gates.

## Boundaries

No change to drawing, sampling or the frame loop. No change to existing tests. No loading-manager or picture-ownership change (drafts 04 and 02). r3f-declared meshes in `BodyMesh.tsx` and `AtmosphereGlow.tsx` are disposed by react-three-fiber itself and stay as they are.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/viewDisposal.test.ts packages/astraeus/tests/sceneViewsDisposalDom.test.ts packages/astraeus/tests/bodyViewDisposalDom.test.ts packages/astraeus/tests/sceneHooksDom.test.ts packages/astraeus/tests/bodyViewDom.test.ts packages/astraeus/tests/patchedShaders.test.ts`, plus the existing test files of any existing view whose `dispose` changes (`rg -l '<ViewName>' packages/astraeus/tests`). Plus `npm run typecheck`, eslint (`node --require ./tools/lint/use-typescript6.cjs node_modules/eslint/bin/eslint.js <changed files>`) and `npx prettier --check <changed files>` (builder rule 7; no repo-wide `npm test` or `npm run lint`). Size: `npm run check:pack`. No browser run; `renderer.info.memory` needs a real WebGL context, so counting is by `dispose` events here and the real page is draft 01's step in the Full Check's browser run.

## Technical Evidence

Extra reads: none beyond Context Files (also `OrbitSetView`/`SkyView`/`SkyFiguresView`/`RingView` `dispose` bodies, and test fixtures in `bodySet.test.ts`, `orbitSetSync.test.ts`, `skyFigures.test.ts`, `publicApiLineStretches.test.ts`, `pathViewSync.test.ts`, `skyPicture.test.ts`, `overlayLayers.test.ts` to copy made-up data).

| Done When | Evidence |
|---|---|
| `disposeOwned.ts` walks an Object3D: geometry, material(s), `map` only | `src/app/disposeOwned.ts`; exercised by every row of `viewDisposal.test.ts` |
| `dispose()` on `PathView`, `PointsView`, `KeplerPoints`, `TrackedBodyView` | those four rows (PathView bare and with orbit look; PointsView small and large; KeplerPoints direct) in `viewDisposal.test.ts` |
| dispose clears nothing | table case compares every attribute's array length and count before and after `dispose()` |
| `useSceneViews` disposes tracked, group, sun-centred and composition views | four effects in `sceneHooks.ts`; `sceneViewsDisposalDom.test.ts` (unmount frees every owned object, all views incl. sky via `useSkyStars`, which already frees the sky view) |
| `BodyView` disposes marker, stand-in and glow | three effects in `BodyView.tsx`; `bodyViewDisposalDom.test.ts` (marker, sphere, halo bodies) |
| One table over every view class | `viewDisposal.test.ts` (11 rows: Path x2, Points x2, Kepler, Tracked, BodySet, OrbitSet, Sky, SkyFigures, Ring); all existing-view rows passed without change, so no existing `dispose` was edited |
| Two-view row (API-03) | second `it.each` in `viewDisposal.test.ts`; also two probes in `sceneViewsDisposalDom.test.ts` and two BodyViews in `bodyViewDisposalDom.test.ts` |
| Scan case | last `describe` of `viewDisposal.test.ts`: every exported class in `src/app` that constructs geometry/material/texture/`dotMaterial(` needs `dispose(` and a table row |
| Two DOM tests | `sceneViewsDisposalDom.test.ts`, `bodyViewDisposalDom.test.ts` |
| Size | `npm run measure:example`: first-open total 1,827,398 B raw (C-211: 1,826,428; includes T-428/T-431/T-432 and in-flight T-430); cap 1,838,000. No separate before-figure for this Task alone (no stash allowed). |

Commands (in the gate lock): `npm run typecheck` clean; eslint on changed files clean; `prettier --check` clean; `npx vitest run` on `viewDisposal`, `sceneViewsDisposalDom`, `bodyViewDisposalDom`, `sceneHooksDom`, `bodyViewDom`, `patchedShaders`, `pathViewSync`, `publicApiLineStretches`, `overlayLayers`: 9 files, 87 tests pass.

Files changed: `disposeOwned.ts` (new), `PathView.ts`, `PointsView.ts`, `KeplerPoints.ts`, `TrackedBodyView.ts`, `BodyView.tsx`, `sceneHooks.ts`; tests `viewDisposal.test.ts`, `sceneViewsDisposalDom.test.ts`, `bodyViewDisposalDom.test.ts`, plus `tests/disposalFixtures.ts` (new shared made-up fixtures and the dispose listener; not in planned_writes, test support only).

Limitations: `SkyView` is freed by `useSkyStars`, not `useSceneViews`, as before. No browser run; counting is by `dispose` events. `BodyView` does not dispose the r3f-declared meshes (as planned).

## Drift Notes

Design `Good guest` gains: every view that makes GPU objects has `dispose`, held by `tests/viewDisposal.test.ts` (reconciled by draft 07).

## Coordinator (gates)

Combined wave-2 gate with T-429 and T-430: typecheck clean; `npm run lint` clean; `npm test` 336 files, 5478 passed, 1 failed (twoViewers shelf-panel case, a 1 s waitFor flake under load -> I-204, repaired), then a full rerun 336 files, 5479 passed, 2 skipped. Engine first open 1,827,398 B raw after both (cap 1,838,000): T-429 + T-430 together add 1,004 B against their combined planned allowance of 650 B; the Objective total (+970 B since C-211) stays far under the cap, so the planner allowance is recorded as exceeded, not a cap red. Set done by the orchestrating session (owner: "I mark them as they pass", O-038; G-024 decision 7; owner 2026-11-22 "Carry on").
