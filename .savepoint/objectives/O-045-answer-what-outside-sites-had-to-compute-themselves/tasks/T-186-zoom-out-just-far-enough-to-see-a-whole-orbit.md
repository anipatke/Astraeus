---
id: T-186
title: Zoom out just far enough to see a whole orbit
objective: O-045
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o045-planning-20261028}
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

Pending execution.

## Drift Notes

Defer Design notes to T-188 (the O-045 integration step), named in the note.
