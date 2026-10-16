---
id: T-037
title: Let each experience say how far the camera can reach
objective: O-011
status: done
depends_on: []
owner_validation:
    required: false
    accepted_check: ""
planned_by: {role: planner, session: o011-plan-2026-10-11}
lane: camera-reach
planned_reads: [src/app/experienceDefinition.ts, src/app/EarthMoonScene.tsx, src/app/CameraController.tsx, src/app/App.tsx, src/app/PointsView.ts, src/synthetic/syntheticRingDefinition.ts, tests/experienceDefinition.test.ts, tests/pointsLayer.test.ts, tests/syntheticRing.test.ts, tools/validate/browser-synthetic-ring.mjs]
planned_writes: [src/app/experienceDefinition.ts, src/app/EarthMoonScene.tsx, src/app/CameraController.tsx, src/main.tsx, src/synthetic/syntheticRingDefinition.ts, tests/experienceDefinition.test.ts, tests/syntheticRing.test.ts, tools/validate/browser-synthetic-ring.mjs]
check_waiver:
    task: T-037
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-11T07:44:52Z"
---

# Let each experience say how far the camera can reach

## Outcome

`ExperienceDefinition` takes an optional camera reach (at least the farthest focus distance and the far plane). The scene uses it instead of its constants when it is given, and uses today's values exactly when it is not. The made-up Sun-centred belt (about 2.5 AU) becomes visible in the app through this setting.

## Astraeus Hypothesis

- **Capability tested:** that the presentation layer can frame scenes of very different sizes without per-experience code in the scene.
- **Contract reused:** `ExperienceDefinition`, the camera controller, `focusLimits`, `ScalePolicy`, the floating origin, centre composition in `PointsView`.
- **Gap or hypothesis:** camera reach (`far = 5000`, focus reach `max(30, moonDistance × 3.5)`) is a scene constant, deferred twice in Design (T-024/T-025 note, T-028 note), so a group beyond about 1.3 million km can't be framed. Hypothesis: an optional reach on the definition is enough. Floating-origin precision or near/far depth precision at AU distances may also fail; if so, that is measured and reported.
- **Generic change:** an optional `camera` reach field on `ExperienceDefinition`, read by the scene and camera controller. Defaults equal today's constants.
- **Perseids-independent evidence:** the made-up Sun-centred belt mounted as a visible experience (for example `?experience=synthetic-belt`) with a declared reach. Contract tests show the defaults are unchanged.

## User Check

None required. Optionally, open the made-up belt and zoom out to see it around the Sun.

## Done When

1. The optional reach validates its input with named errors (finite, positive, max greater than min where relevant). Omitted, the scene's limits equal today's values for every focus kind, shown by a test that names the old constants.
2. Declared, the camera can zoom out to the stated reach and the far plane follows it. Near-plane behaviour stays sensible at close focus, with no depth fighting visible in the screenshots.
3. The made-up Sun-centred belt is mounted through the entry and is visible at True and Readable scale. A browser script (an extended `browser-synthetic-ring.mjs` or a new one) asserts it with zero console errors.
4. State is untouched: group fills and body State are identical with and without a declared reach (test).
5. The name check covers the changed generic files. Apollo, synthetic and the ring pass every browser script in a fresh run directory (`docs/evidence/o011-<task>-<date>/`).
6. Configured typecheck, build and test gates pass; record counts.

## Context Files

`.savepoint/objectives/O-011-run-perseids-and-a-second-shower-as-fixtures/Objective.md`, `src/app/experienceDefinition.ts`, `src/app/EarthMoonScene.tsx`, `src/app/CameraController.tsx`, `src/app/App.tsx`, `src/app/PointsView.ts`, `src/main.tsx`, `src/synthetic/syntheticRingDefinition.ts`, `tests/experienceDefinition.test.ts`, `tests/pointsLayer.test.ts`, `tests/syntheticRing.test.ts`, `tools/validate/browser-synthetic-ring.mjs`.

## Design References

Design: Experience plug-in boundary; Groups and the `points` layer (O-009), including the camera-reach drift notes.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, TEST-01, TEST-03, STYLE-04, STYLE-06, STYLE-07, STYLE-10.

## Implementation Plan

1. Confirm `focusLimits`, `far` and the group framing still match Design; return REPLAN REQUIRED if the camera has changed shape.
2. Add the optional reach type and its validation; pass it from `App` to the scene and camera controller.
3. Use it in `focusLimits` and the far-plane setting, with today's values as defaults.
4. Give the made-up belt a visible entry and a declared reach; check floating-origin and depth precision at its distance.
5. Tests, browser script, all browser scripts, gates.

## Boundaries

No change to `ScalePolicy`, the floating-origin threshold, State or group contracts. No shower data. No timeline or shell change. No logarithmic depth buffer unless precision fails; if it fails, report it as a finding before adding one.

## Technical Verification

Focused tests during iteration. Handoff runs the configured gates and every browser script (scene-affecting fuller gate). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

**Per criterion**
1. Met. `validateCameraReach` throws named errors (`camera.maxFocusDistance must be finite/positive`, `camera.far ...`, `camera.far (x) must exceed camera.maxFocusDistance (y)`). Tests in `tests/experienceDefinition.test.ts` pin today's limits (Earth min 1.15, Moon min 1.6 x radius, tracked min 0.002, max `max(30, moonDistance x 3.5)`, far 5000) for Earth, Moon and a tracked focus at three Moon distances when omitted.
2. Met. Declared reach replaces only the farthest distance (test) and the far plane (`poseCamera` takes `far`; Canvas `far` follows). Belt run zoomed out to the 400,000-radius reach and back in at True and Readable; near plane formula unchanged. Screenshots show no depth fighting. Depth precision at close focus was only inspected visually, not measured numerically.
3. Met. `?experience=synthetic-belt` (`syntheticBeltDefinition`, Sun-centred, points layer only) shows the belt at True and Readable (lit-pixel counts 93k focused, 33k-57k zoomed out); `tools/validate/browser-synthetic-belt.mjs` passes with zero console errors.
4. Met. Test: belt group fills and `experienceWithGroups` output are identical with and without a declared reach. State, scale policy and floating-origin threshold untouched.
5. Met. Name check (no meteor/shower/Perseids) covers `experienceDefinition.ts`, `EarthMoonScene.tsx`, `CameraController.tsx`, `App.tsx`. All seven browser scripts passed with zero errors in fresh folder `docs/evidence/o011-t037-2026-10-11/<script>/` (results in `<script>.json`).
6. Met. `npm run typecheck`, `npm run build` and `npm test`: 17 files, 326 tests passed. No lint gate configured.

**Commands run:** `npm run typecheck`; `npm run build`; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`; `node tools/validate/browser-*.mjs` (7 scripts, Vite dev server on port 5199, 2026-10-11).

**Files read:** the Task's Context Files plus `tests/pointsLayer.test.ts` (planned read). Extra reads: `src/shell/ObjectControls.tsx` grep only, to learn why camera buttons need an overview preset. **Files changed:** `src/app/experienceDefinition.ts`, `EarthMoonScene.tsx`, `CameraController.tsx`, `App.tsx`, `src/main.tsx`, `src/synthetic/syntheticRingDefinition.ts`, `tests/experienceDefinition.test.ts`, `tests/syntheticRing.test.ts`, new `tools/validate/browser-synthetic-belt.mjs`, new evidence folder.

**Limitations:** headless software rendering only; no owner visual judgement. Floating-origin and depth precision at about 2.5 AU looked fine in screenshots but were not measured. No logarithmic depth buffer was needed or added. `poseCamera` keeps a default far of 5000 that duplicates `DEFAULT_CAMERA_FAR`.

## Drift Notes

Record architecture deltas here; T-040 reconciles them into Design.

- `ExperienceDefinition` gains optional `camera?: CameraReach` (`maxFocusDistance`, `far`, Earth radii), validated by `validateCameraReach`; `SceneRuntime` carries `cameraReach`. This closes the camera-reach drift notes from T-024/T-025 and T-028 (architectural; T-040 reconciles). `focusLimits` is now exported.
- New made-up entry `?experience=synthetic-belt` (`syntheticBeltDefinition`); `main.tsx` entry list changes (non-architectural).
