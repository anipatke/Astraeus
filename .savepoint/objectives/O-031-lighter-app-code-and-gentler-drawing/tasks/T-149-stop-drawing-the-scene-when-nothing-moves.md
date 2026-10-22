---
id: T-149
title: Stop drawing the scene when nothing moves
objective: O-031
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o031-planning-20261023}
lane: idle
planned_writes: [src/app/AstraeusScene.tsx, src/app/LayeredRender.tsx, src/app/sceneFrame.ts, tests/sceneFrame.test.ts, tools/validate/driver.mjs, tools/validate/browser-smoke.mjs, tools/validate/journey-meteor-shower.mjs]
---

# Stop drawing the scene when nothing moves

## Outcome

When playback is paused and nothing is moving, the scene stops drawing; any input, settings change, playing clock or running animation draws again at once, with no visible difference.

## User Check

None on screen in this step (the owner's look is the last step). Run `npm test` and `npm run check:browser` and see the idle cases pass.

## Done When

- A named stage in `src/app/sceneFrame.ts` decides "draw this frame?" from plain inputs (clock playing, camera moving or damping, an animation or fade running, a pending input or settings change, the first frames after mount or resize); `tests/sceneFrame.test.ts` covers each case, including "paused and idle: no draw" and "paused, camera still settling: draw".
- The scene draws on demand (React Three Fiber `frameloop: "demand"` with `invalidate()`, or a skip in `LayeredRender`; the choice and reason are recorded). Pointer, wheel, key, resize and settings changes wake it; a playing clock keeps it drawing every frame.
- A canvas readout counts frames drawn (for example `data-frames-drawn`), read through a new driver function. The smoke check asserts that a paused, untouched view stops counting within a few seconds, and the meteor journey asserts that play and a tap resume it. The driver guard passes; no screenshots.
- Scientific State is unchanged (ARCH-02). The frame-rate readout in the developer panel still reads sensibly when idle (recorded).
- Configured gates pass; one `npm run check:browser` run (this step changes the browser scripts), time and folder recorded.

## Context Files

`src/app/AstraeusScene.tsx`, `src/app/LayeredRender.tsx`, `src/app/sceneFrame.ts`, `src/app/sceneHooks.ts`, `src/app/sceneContentsHooks.ts`, `src/app/CameraController.tsx`, `src/app/scenePointer.ts`, `src/app/frameStats.ts`, `src/app/FrameRateSection.tsx`, `src/app/sceneDebug.ts`, `tests/sceneFrame.test.ts`, `tools/validate/driver.mjs`, `tools/validate/browser-smoke.mjs`, `tools/validate/journey-meteor-shower.mjs`, `docs/BROWSER_CHECKS.md`.

## Design References

Design: the `src/app/` row; Current Technical State, per-frame stages (O-037).

## Guardrails

ARCH-02, CODE-01, CODE-02, TEST-01, TEST-03; STYLE rules as listed in `.savepoint/Guardrails.md`.

## Implementation Plan

1. List everything that changes the picture while paused (camera flights and damping, label and panel fades, story markers, the boot loader, the sky, body-set refills, path fades). Each one either reports "still moving" to the rule or is shown not to animate.
2. Write the rule as a stage with node tests.
3. Switch the scene to draw on demand and wire the wake-ups.
4. Add the frames-drawn readout, the driver function and the two browser assertions.
5. Run the gates and one browser run.

## Boundaries

No change to what visitors see, to Scientific State or to the pixel ratio. Browser runs only for the scripts this step changes. No screenshots.

## Technical Verification

Focused `npx vitest run tests/sceneFrame.test.ts` while building; configured gates and one `npm run check:browser` at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Note for Design: the scene draws on demand. Reconciled in the last step of this Objective.
