---
id: T-186
title: Zoom out just far enough to see a whole orbit
objective: O-045
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o045-planning-20261028}
check_waiver:
  task: T-186
  reason: 'Owner said "orchestrate O45"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o045-run-20261028}
  recorded_at: '2026-10-28T11:33:06Z'
---

# Zoom out just far enough to see a whole orbit

## Outcome

`camera.fitOrbit(body)` sets the farthest zoom-out so the whole orbit of a body circling the Sun fits the actual canvas from any view direction, re-fitting when the canvas changes shape (a phone turning, a window resizing). It replaces the per-screen reach the showers site computed from the fixed 45° field of view (finding E7).

## User Check

None required (owner chose no extra look, 2026-10-28).

## Done When

- `SceneCamera.fitOrbit(body)` accepts a body reference or id of a body circling the Sun (planet, built-in comet, elements body); other bodies throw a named `SceneError` naming the body. It chains like the other camera calls and can be combined with `setReach` only by the documented rule the builder picks (later call wins, or an explicit error); state the rule in the doc comment.
- The fitted reach is the orbit's farthest Sun distance divided by sin of the narrower half field of view of the canvas (vertical 45°, horizontal from the aspect ratio), with a 1.1 margin; the far plane follows as for `setReach`. Node tests check the figure for a made-up orbit at 1280x800 and 390x844 (390x844 matches the showers rule 1.1 × Q / sin 10.8° within 1%).
- The viewer re-fits on canvas resize: a DOM or unit test changes the aspect and sees the zoom-out limit change. The opening view does not move: a scene with `fitOrbit` and no start view opens at the same distance as the same scene without it (TEST-03).
- No collision or overlap introduced at 375x667 or 1280x720 (owner standing rule).
- Hand-off gates green.

## Context Files

`packages/astraeus/src/api/scene.ts` under `SceneCamera`, `setReach` and `viewEntries`, `packages/astraeus/src/app/experienceDefinition.ts` under camera reach, `packages/astraeus/src/app/AstraeusScene.tsx`, `packages/astraeus/src/app/CameraController.tsx`, `packages/astraeus/src/app/sceneFraming.ts`, `packages/astraeus/tests/sceneCamera.test.ts`, `packages/astraeus/tests/startCamera.test.ts`, `packages/astraeus/tests/cameraAndNamesDom.test.ts`.

## Design References

Design Interfaces and Data Flow (camera and framing); Components/Codebase Map (`src/app/`).

## Guardrails

ARCH-01, ARCH-02, ARCH-03, TEST-01, TEST-02, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Carry a fit request (body id) in the definition alongside the fixed reach.
2. Compute the reach from the orbit's farthest distance and the live canvas aspect in the viewer; re-fit on resize.
3. Tests for the figure, the resize, the error and the unchanged opening view.

## Boundaries

No change to the opening view, field of view, labels flipping at the edge, or camera state reading (G4); no new option on `mount`/`AstraeusScene`; no browser runs, no screenshots.

## Technical Verification

Focused node and DOM tests; hand-off gates. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built by the T-186 builder (2026-10-28). Extra reads: none beyond Context Files, plus `packages/astraeus/src/api/sunOrbit.ts` and `src/core/bodies/index.ts` (BUILT_IN_SAMPLING) to find where an orbit's period and eccentricity live, and `src/app/sceneFrame.ts`, `src/app/sceneContentsHooks.ts` (the two places that read the declared reach). Step Check waived (O-045 run rules).

Farthest Sun distance source: a(1+e) with a from Kepler's third law about the Sun's GM, from the orbit's period and eccentricity (elements bodies and the built-in comet, via their eccentric sampling); for a planet, which has no stored orbit data, the largest Sun distance over one full turn of its own state source (361 samples, needs the planet series loaded, so it is read lazily). `farthestSunDistanceKm` in `src/api/sunOrbit.ts`.

Combination rule: `setReach` and `fitOrbit` set the same limit; the later call wins and clears the other (stated in both doc comments).

Mechanism: `CameraReach.fitOrbit = { farthestKm: () => number }` (memoised in the Scene); `liveReach(declared, policy, aspect)` in `sceneFraming.ts` turns it into `{ maxFocusDistance, far }` (`fitReach`: 1.1 x farthest / sin(min(vertical half 22.5 deg, horizontal half from aspect)); far = 2.5 x reach). Called every frame in `stepAndPoseCamera` with `camera.aspect` (so resize re-fits and the far plane follows) and in the pointer limits with canvas width/height.

Per criterion:
1. fitOrbit accepts a body or id, chains, throws `bad-camera` naming the body for a non-Sun-orbiting body (moon, sun) and `unknown-body` for a body not in the scene; rule stated. `tests/fitOrbit.test.ts` (6 tests).
2. Figure: made-up elements orbit (a 2.5 AU, e 0.3) at 1280x800 equals 1.1 x Q / sin 22.5 deg within 1e-5; at 390x844 within 1% of 1.1 x Q / sin 10.8 deg; far = 2.5 x reach. Tested.
3. Resize: same definition clamped a far zoom-out to a different limit at aspect 1.6 and 390/844 through `stepCameraTarget` (unit test, no browser). Opening view: with and without fitOrbit the first-frame distance at 2.4 x span is identical at both aspects (TEST-03).
4. No UI added or changed; no overlap risk at 375x667 / 1280x720 (not browser-checked, by rule).
5. Gates: `npm run lint` clean, `npm run typecheck` clean, `npm run build` ok, `npm test` 144 files, 1882 passed, 1 skipped.

Coordinator follow-up (same session): (a) Labels: a fitOrbit scene sets no label limit at all (Sun-centred or not), so labels stay shown at any distance the live-fitted camera can take; chosen because the definition is static and a planet's farthest distance is unknown before the series load. Test: a non-Sun-centred fitOrbit scene has `labelMaxDistance` undefined, a plain one keeps 500. (b) Planet path now tested: Mars with the preloaded planet series gives a farthest Sun distance within 1% of a(1+e) (1.523679 AU, e 0.0934). The test found a real bug, sampled times were not integers and `stateAt` rejected them; fixed with `Math.round` in `farthestSunDistanceKm`. Gates rerun: lint, typecheck, build clean; npm test 144 files, 1884 passed, 1 skipped.

Unverified: real browser resize (no browser runs by rule); a planet's farthest distance (planet-series path) is covered only by reading the code, the node tests use an elements body and the built-in comet and Earth by reference.

## Drift Notes

Defer Design notes to T-188 (the O-045 integration step), named in the note.

- For T-188: `CameraReach` gains `fitOrbit` (a lazy farthest Sun distance) beside `maxFocusDistance`/`far`; the viewer resolves it per frame with the canvas aspect (`liveReach`). Public `SceneCamera` gains `fitOrbit` and `fitted`.
- For T-188: a scene using `fitOrbit` sets no label limit (labels stay shown at any distance), where `setReach` raises the 500 default to the reach; the `addBody` label doc says so.
- For T-188: with fitOrbit the opening distance is clamped to the fitted limit like any other, so a scene that opens farther than 2.87 x the orbit's farthest distance would open nearer than without it; the default overview (2.4 x span) is inside it.
