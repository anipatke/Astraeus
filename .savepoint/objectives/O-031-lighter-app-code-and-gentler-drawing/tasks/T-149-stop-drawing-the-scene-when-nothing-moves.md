---
id: T-149
title: Stop drawing the scene when nothing moves
objective: O-031
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o031-planning-20261023}
lane: idle
planned_writes: [src/app/AstraeusScene.tsx, src/app/LayeredRender.tsx, src/app/sceneFrame.ts, tests/sceneFrame.test.ts, tools/validate/driver.mjs, tools/validate/browser-smoke.mjs, tools/validate/journey-meteor-shower.mjs]
check_waiver:
  task: T-149
  reason: 'owner asked for one full fresh check at the end of O-031 instead; quote: "orchestrate the delivery of O-31. Ask questions before execution, one full test at end"'
  actor:
    role: owner
    session: owner-run-rules
  recorded_at: "2026-10-23T00:00:00Z"
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

Built in lane `lane-t149`. Task Check waived (see `check_waiver`); the Full Objective Check covers this.

**Approach and why.** The renderer's frame loop keeps running (React Three Fiber `frameloop: "always"`), and the new stage 8 of `runFrame`, `decideDraw` in `src/app/sceneFrame.ts`, sets `FrameState.drawThisFrame`; `LayeredRender` (priority 1, after the scene frame) skips its `gl.render` passes when it is false. Chosen over `frameloop: "demand"` + `invalidate()` because the GPU draws are the cost, the per-frame logic (names, markers, readouts, camera tweens, picking) is cheap and must keep running, and demand mode would need every DOM overlay, hover, load and in-place settings edit to call `invalidate()`: one missed wake freezes the picture. Here a missed wake only costs a skipped redraw until the next change, and the default when unsure is to draw.

**The rule (`shouldDrawFrame`, fed by `readDrawInputs`).** Draw when: the clock plays; the clock reads a new time (seek, step); the camera pose moved by more than 1e-6 (relative) since the last drawn pose, or its tweens (distance, elevation, azimuth, focus transition) are not within 1e-6 of their targets; any `SceneControls` field changed (by identity, flat look objects such as `glowLook` by value, because the Developer panel edits those in place; `viewReadout` is ignored since the frame rewrites it every frame); the canvas size or device pixel ratio changed; a body's parts mounted or unmounted; or a wake fired (a loader started, progressed, ended or failed on three's `DefaultLoadingManager`, which covers body textures and sky tiles; a restored graphics context). After the last such frame it keeps drawing `IDLE_GRACE_FRAMES` = 30 frames (about half a second), which also covers the first frames after mount, a late React texture swap and fades. Not drawing needs paused and idle for those 30 frames.

**List of things that animate or change the picture while paused (plan step 1; the owner's checklist in T-151 is built from this).** Each is either reported to the rule or shown not to animate:
1. Camera flights to a focus (Focus / Follow / Overview, picking a body, story marker, event jump): orbit tweens, and the focus-transition offset; reported (tween not settled / pose moved).
2. Camera damping after a drag, wheel or pinch: the manual gestures set the pose directly and cancel tweens; the pose change is reported.
3. A change of scale (Readable / True), up direction, loop, label toggles, marker size, Sun halo size and brightness, sky strengths, Milky Way, orbit look, moon/body-set look, ring look, illuminate-all, hover brightness setting, selected object, open story panel / feature place (marker pressed state): all fields of `SceneControls`; reported (changed controls; flat looks by value).
4. Resizing the window, rotating a phone, a pixel ratio change (browser zoom): reported (size and ratio).
5. Textures arriving (body maps, ring bands, the Milky Way and star pictures), and the body-set / dot refill finishing: reported by a loader wake plus the 30-frame grace. Dot refills run only for look-ahead while the clock moves; while paused the dots shown do not change.
6. The boot loader hiding on the first frame, and the first frames after mount: covered by the first-frame input changes and the grace.
7. Seeking, stepping events, jump to peak, timeline scrubbing: the clock reads a new time; reported.
8. Playing at any speed, looping: the clock plays; draws every frame.
9. Path ring / arc fades and zoom-brighten: a function of clock time and camera distance only (checked in `PathView.sync` / `place`); no wall-clock animation. Rolling-path resampling by real time (`pathNeedsRefresh`) needs the clock to have drifted, so it only happens while time moves.
10. Hover: the mouse only changes name brightness and the cursor on DOM elements, not the canvas picture; not reported (no canvas change). Name labels, story markers, feature markers and anchor labels are DOM; they are still updated every frame because the frame logic keeps running.
11. Story marker and feature marker pulses, if any, are CSS animation on DOM, independent of the canvas.
12. Not covered by the grace, by design: a tap on empty sky selects nothing and so changes nothing; no draw follows it.
Open item for the owner's look (T-151): a texture that finishes loading more than half a second after its loader event is the one case that could show a stale body until the next input; none seen.

**Frame-rate readout.** The developer panel's `FrameStats` ticks in the scene frame callback, which still runs at the display's rate, so while idle it keeps reading about 60 fps (it measures the frame loop, not draws). Recorded as sensible: no red 0 fps when the page is simply resting. `data-frames-drawn` on the canvas counts real draws.

**Files.** `src/app/sceneFrame.ts` (FrameState fields `drawThisFrame`, `framesDrawn`, `wakes`, `drawn`; `shouldDrawFrame`, `cameraSettled`, `readDrawInputs`, `decideDraw`, `IDLE_GRACE_FRAMES`, stage 8 in `runFrame`), `src/app/LayeredRender.tsx` (skip, count, `data-frames-drawn`), `src/app/AstraeusScene.tsx` (the frame state is created once in `AstraeusScene` and passed to both), `tests/sceneFrame.test.ts` (+11 cases), `tools/validate/driver.mjs` (`framesDrawn`, `waitUntilSceneIdle`, `waitForMoreFrames`, `nudgeCamera`), `browser-smoke.mjs` (Apollo 11 must stop drawing once paused: 40 and 45 frames at desktop / phone), `journey-meteor-shower.mjs` (idle at 37 frames, a wheel turn gives 45, play gives 80 frames in 1.5 s).

**Edits outside `planned_writes`.** `src/app/sceneContentsHooks.ts` (the `drawThisFrame = true` default at the start of the frame callback; new `useDrawWakes`), which `AstraeusScene.tsx` calls. Not touched: `src/main.tsx`, `App.tsx`, `DeveloperSettings.tsx`, `vite.config.ts`, `load-budget.mjs`. Extra reads beyond Context Files: `src/app/BodyView.tsx`, `PathView.ts`, `PointsView.ts`, `pathRules.ts`, `FeatureMarkers.ts`, `src/core/clock.ts`, `App.tsx` (controls writes, read only), `DeveloperSettings.tsx` (read only), `tools/validate/harness.mjs`, `run-browser.mjs`, to list what animates and where controls are edited.

**Finding worth a note.** The canvas element carries the `data-*` readouts, not the `earth-moon-canvas` wrapper (R3F puts `data-testid` on the wrapper div), so the driver reads `canvas` directly like the other readouts. First browser run failed for exactly that (readout read as 0); fixed in `driver.mjs`, second run passed. No Issue needed.

**Reversal check.** An early version woke the scene on every React render of the scene contents; a probe showed the page re-renders about 3 times a second while paused (it never stopped drawing), so that wake was removed in favour of the loader wake.

**Gates (lane, 2026-10-23).** `npm run lint` pass; `npm run typecheck` pass; `flock /tmp/astraeus-build.lock npm run build` pass; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 111 files, 1513 passed, 1 skipped. No `test:full`, no health check.

**Browser (one `npm run check:browser`, passing run).** `docs/evidence/browser-20261022T215309Z`, 65 s total (smoke 33 s, smoke-public-showers 9 s, planets-phone 12 s, meteor-shower 9 s, files-only steps 1 s); all steps exit 0, 0 error lines. The earlier failing run (meteor-shower, driver readout bug above) was deleted. No screenshots. The probe servers I started were stopped; the owner's preview on 5490 was not touched.

Marked done by the coordinator at 2026-10-22T21:55:55Z on the owner's authority (O-031 run, 2026-10-23: "Yes, same as O-038", whose rule was "I mark them as they pass"). Merged to o031-lighter-app as 1ae421a9; combined run there: typecheck pass, `npm test` 111 files, 1513 passed, 1 skipped.

## Drift Notes

Note for Design: the scene draws on demand. Reconciled in the last step of this Objective.
