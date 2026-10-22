---
id: T-144
title: Check the scene sums in fast tests
objective: O-038
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o038-planning-20261023}
lane: scene
check_waiver:
  task: T-144
  reason: 'owner asked for one full fresh check at the end of O-038 instead. Owner quote: "orchestrate the delivery of O-38. ask clrifying questions front, one full (new) chek at the end"'
  actor: {role: owner, session: o038-orchestration-20261023}
  recorded_at: '2026-10-23T00:00:00Z'
---

# Check the scene sums in fast tests

## Outcome

What the engine browser scripts and the six on-request number checks prove about the scene is proven by fast node tests against the plain scene modules (the per-frame stages, placement, framing, labels, picking, sky and lighting): the made-up scene and its ring and listed variants, orbit and trail looks, orbit arcs moving with time, the twelve anchor labels, tap and hover picking, the sky staying fixed under camera changes, the Sun halo, the sphere-to-marker swap, whole-orbit framing and position precision far from the Sun.

## User Check

None on screen. Run `npm test` and see the new scene tests pass.

## Done When

- Each behaviour scenario in `browser-synthetic`, `browser-synthetic-ring`, `browser-synthetic-listed`, `browser-orbit-look`, `browser-orbit-motion`, `browser-anchor-labels`, `browser-tap-focus` and the on-request `browser-sky`, `browser-sun`, `browser-precision`, `browser-synthetic-belt`, `browser-synthetic-eccentric`, `browser-marker-existing` is listed in Technical Evidence with the test file and case that now proves it, or "draws: smoke check", or "looks: owner's look on the preview". `probe-phone-frames` is listed as a retired measuring tool.
- Existing tests are reused where they already prove a scenario (named exactly, TEST-03); new cases go in the matching existing test file where one exists (for example `tests/sceneFrame.test.ts`, `tests/sky.test.ts`, `tests/sunLook.test.ts`, `tests/scenePicking.test.ts`).
- Precision: the Float32-in, Float64-projection experiment at 1 AU and at 50 AU runs as a node test on the same coordinates the renderer is given, with the same limits the scripts recorded.
- Scripts are not deleted here. The fast suite stays about a minute or less (time recorded). Configured gates pass.

## Context Files

`tools/validate/browser-synthetic.mjs`, `tools/validate/browser-synthetic-ring.mjs`, `tools/validate/browser-synthetic-listed.mjs`, `tools/validate/browser-orbit-look.mjs`, `tools/validate/browser-orbit-motion.mjs`, `tools/validate/browser-anchor-labels.mjs`, `tools/validate/browser-tap-focus.mjs`, `tools/validate/on-request/browser-sky.mjs`, `tools/validate/on-request/browser-sun.mjs`, `tools/validate/on-request/browser-precision.mjs`, `tools/validate/on-request/browser-synthetic-belt.mjs`, `tools/validate/on-request/browser-synthetic-eccentric.mjs`, `tools/validate/on-request/browser-marker-existing.mjs`, `tools/validate/on-request/probe-phone-frames.mjs`, `src/app/sceneFrame.ts`, `src/app/sceneFraming.ts`, `src/app/scenePicking.ts`, `src/app/AnchorLabels.ts`, `src/app/sceneSky.ts`, `src/app/bodyDraw.ts`, `src/app/floatingOrigin.ts`, `src/app/renderCoordinates.ts`, `tests/sceneFrame.test.ts`, `tests/scenePicking.test.ts`, `tests/sky.test.ts`, `tests/sunLook.test.ts`, `tests/orbitLook.test.ts`.

## Design References

Design: Current Technical State, precision at 1 AU (T-045); Tap to focus (O-022); The sky (T-051, T-053); the `src/app/` row.

## Guardrails

ARCH-02, ARCH-03, CODE-02, TEST-01, TEST-03; STYLE rules as listed in `.savepoint/Guardrails.md`.

## Implementation Plan

1. For each script, list its assertions; find the module that computes each value.
2. Reuse an existing test where it already proves the value; otherwise add a case against the module.
3. Where a value is only computed inside the React scene component, not a plain module, record it as smoke or owner-look rather than moving code; if a scenario matters and cannot be reached without moving code, stop and return REPLAN REQUIRED naming it.
4. Record the scenario map and suite time.

## Boundaries

No change to what visitors see or to scene code beyond exporting an existing value for a test. No browser runs, no script deletion, no doc edits. No screenshots.

## Technical Verification

Focused `npx vitest run <files>` while building; configured gates at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Builder lane `lane-t144`, no browser runs, no scene code changed, no scripts deleted. Extra reads: none beyond Context Files plus `src/app/sceneDebug.ts`, `src/app/PathView.ts`, `tests/missionScene.test.ts`, `tests/timeline.test.ts`, `tests/experiencePlugIn.test.ts`, `tests/syntheticRing.test.ts` (to name existing cases).

New cases (4 files changed, all tests): `tests/orbitLook.test.ts` ("reports each layer and the ring's opacity in the scene's path readout as the controls change them, and reset restores them"; "keeps the arc head on its body and the arc free of chords through load, seeks and fast playback ..."), `tests/sceneTransforms.test.ts` (describe "position precision far from the Sun (Float32 in, Float64 projection)", 4 cases), `tests/sceneFrame.test.ts` ("reports the Milky Way picture and the live brightness settings on the canvas, ..."), `tests/sceneBodies.test.ts` ("reads the halo as over the stream dots from afar and behind the disc once the disc is big").

Precision: Float32-narrowed `FloatingOrigin.toLocal` positions projected in Float64 through a `PerspectiveCamera` (1280x800, 45 deg), 60 frames at about one mouse pixel of turn per frame, Sun focused. Limit one pixel, as the scripts recorded. Error is measured against the exact Float64 projection (stronger than the scripts' cubic-fit residual, which it bounds); "still" is bit-identical output for repeated input. Cases: Earth at 1 AU (camera 0.5, 3, 9 AU out), a vertex over 50 AU out (camera 40, 80 AU), a focused Earth close-up (exact at the GPU origin), and the Float32 grid at 1 AU (2^-9 units).

Gates (all pass): `npm run lint`; `npm run typecheck`; `flock /tmp/astraeus-build.lock npm run build`; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 99 files, 1347 passed, 1 skipped (pre-existing), vitest duration 34.06 s, wall 37.5 s (inside the about-a-minute budget).

Scenario map. Test files are under `tests/`; "draws: smoke check" means the pixels or DOM wiring, left to the new quick browser check (T-145); "looks: owner" means the owner's look on the preview.

browser-synthetic.mjs
1. Timeline glow: one glow, peak mark, gradient brightest at the peak, quiet ends fainter, text equivalent, tooltip in and out of the window: `timeline.test.ts` "timeline activity glow (T-084)" cases "maps the rate to a 0-1 profile ...", "is brighter with activity ...", "draws a smooth gradient ...", "gives the rate at a time, a tooltip and a text equivalent ..."; `experiencePlugIn.test.ts` "mounts one window through ExperienceConfig.windows, inside the timeline". Glow sits on the slider line and timeline height limits: looks: owner (layout; also `phoneLayout.test.ts` for phone rules).
2. Stops at window opens, peaks, closes: `timeline.test.ts` "stops Previous/Next at event times and each window's start, peak and end".
3. "Inside" line at the peak and rate readout on the marker, unavailable outside: `experiencePlugIn.test.ts` "computes its rate readout from the same window samples as rateAt", "shows the rate as unavailable outside the window"; `timeline.test.ts` "reports the windows the clock is inside, with their rate, boundaries included". The Events-button DOM toggling: draws: smoke check.
4. Source wording ramp then fall, never "measured": `experiencePlugIn.test.ts` "changes its source wording across the span boundary, never labelled measured".
5. Seeking inside the window lands at that point: `timeline.test.ts` "positions markers within the configured window"; the slider drag itself: draws: smoke check.
6. Marker listed once, no debris ring, two events listed, focus/follow presets: `experiencePlugIn.test.ts` "hands the shell its own objects", "draws exactly the tracked bodies it lists", "keeps its clock and events inside its own window"; `syntheticStoryAnchors.test.ts` "holds two panels inside the timeline ...". Camera actually flying: draws: smoke check.
7. Bare variant mounts with no bodies, marker still available; `data-bodies` "earth,moon" otherwise: `syntheticStoryAnchors.test.ts` "is carried by the bare variant too"; `experiencePlugIn.test.ts` "draws exactly the tracked bodies it lists".
8. Ring experience has its own objects and no marker: `syntheticRing.test.ts` "is listed once in the shell with its provenance, and has focus and follow presets", "names no meteor, shower or Apollo object".
9. No-rate scene: even glow, no text, no tooltip, steady-brightness setting live: `timeline.test.ts` "glows evenly at the steady brightness when there is no rate (T-086)"; slider drag and scrubber height: draws: smoke check / looks: owner.

browser-synthetic-ring.mjs
10. Points layer mounted, group listed once, no marker: `syntheticRing.test.ts` "is an Earth-centred group of at least 10,000 members ...", "is listed once in the shell ..."; `data-point-groups` wiring: draws: smoke check.
11. Panel: Illustrative badge, "Made up", two-body: `syntheticRing.test.ts` "is an Earth-centred group ... with illustrative provenance and a two-body limitation"; `infoProvenance.test.ts` for badge rules.
12. Focus and follow presets work: `syntheticRing.test.ts` "has focus and follow presets"; `sceneCamera.test.ts` "handles a focus request ...", "a follow request keeps the framing distance"; flight on screen: draws: smoke check.
13. Group information identical under True and Readable: `syntheticRing.test.ts` "maps through both scales and leaves the group's State unchanged (ARCH-02)".
14. Frame-rate counter absent, present, labelled, graph: `frameStats.test.ts` (counter) and the developer panel DOM: draws: smoke check. Frame pacing was measured, never asserted: retired measurement (software renderer), looks: owner.
15. Marker scene has no groups, its marker, no ring: `experiencePlugIn.test.ts` "shows none of Apollo's objects and carries illustrative provenance".

browser-synthetic-listed.mjs
16. One group listed, no marker: `listedOrbitGroup.test.ts` "mounts one group through the points layer, with illustrative provenance and focus and follow presets".
17. Panel wording (Made up, two-body, position along each orbit illustrative, model not measurement, clump, not shown): `listedOrbitGroup.test.ts` "marks the position along each orbit illustrative and the elements as listed, keeping the sources", "marks the concentration as a model, and adds no orbit".
18. Name check, no real names: `listedOrbitGroup.test.ts` "passes the name check ..."; `nameCheck.test.ts`.
19. Dots drawn in view in True and Readable (more than 20): `listedOrbitGroup.test.ts` "takes its dot size and colour from settings, and draws through the existing points view in both scales", "fills 30,000 members with finite positions"; dots actually in view: draws: smoke check.
20. Group information identical under True and Readable: `listedOrbitGroup.test.ts` same "both scales" case.
21. Playback without console errors, other experience unaffected: draws: smoke check (console errors are the quick check's own assertion).

browser-orbit-look.mjs
22. Four layers start on, switch off and back on, drawn as the scene reports: `orbitLook.test.ts` "switches each layer off and back on" and new "reports each layer and the ring's opacity in the scene's path readout as the controls change them, and reset restores them" (covers the `data-paths` look flags).
23. Ring opacity slider raises the drawn opacity; reset returns it: same new case, plus `orbitLook.test.ts` "carries a slider change to the material and the shape at once". The slider widget readout "0.80": draws: smoke check.
24. Same at desktop and phone, True and Readable: the look is scale-independent; `orbitLook.test.ts` uses `readableScale`, `sceneFrame.test.ts` "gives an owned orbit path its family colour and every path the live look"; True-scale draw: draws: smoke check.

browser-orbit-motion.mjs
25. Arc head stays on its body (gap under 0.002) and no chord (segment under 0.1) at load, after seeks, in fast playback: new `orbitLook.test.ts` "keeps the arc head on its body and the arc free of chords through load, seeks and fast playback ..." (publishes through the real `publishOrbitHeadGap`); plus existing "keeps the arc on the body between window rebuilds and across one", "draws an arc of the true path right after a clock jump, at load and mid-play", "gives the same arc whether the ring window is stale or freshly built".

browser-anchor-labels.mjs
26. Twelve labelled anchors created: `syntheticStoryAnchors.test.ts` "labels every anchor, in time order, inside the marker's path" (12 labels).
27. Layer hidden at start, toggle reports on, labels shown, hidden again on second press: the layer is DOM (`AnchorLabelLayer` creates spans): draws: smoke check (no DOM environment in this lane; `AnchorLabelLayer` DOM test belongs to T-143's happy-dom if wanted). The "off screen anchor is hidden, on-screen one shown" rule: `missionScene.test.ts` `projectToScreen` case (centre maps to pixels, behind the camera and far off screen are null).
28. Follow the marker with labels on, phone count 1 to 12: draws: smoke check; the visibility rule is item 27's `projectToScreen` case.

browser-tap-focus.mjs
29. Hit tolerance, nearest wins, label hit, hidden label ignored, empty space: `scenePicking.test.ts` "pickTarget" cases ("hits inside a body's disc", "hits a sub-pixel body within the pointer's tolerance, more generously for touch", "hits a shown label away from the disc", "ignores a hidden label (no rectangle)", "lets the nearest hit win where candidates overlap", "returns null for empty space").
30. A drag or pinch selects nothing; touch wobble allowance: `scenePicking.test.ts` "TapTracker" cases ("counts a small move as a tap and a large one as a drag", "allows a finger a wider wobble than a mouse", "never counts a pinch ...", "never counts a cancelled press ...").
31. Hover sets the readout and the hand cursor; touch never hovers: `scenePicking.test.ts` "hover" cases ("resolves the same target as a tap at the same point", "gives no hover for touch or pen") and `sceneFrame.test.ts` "carries the hover and pick targets into the canvas readouts" (pickHover and cursor).
32. Which bodies and names a tap can reach: `scenePicking.test.ts` "pickCandidatesOf" cases. Taps reaching the picker, the info sheet staying shut, name-tag tap focusing the body: draws: smoke check (pointer events and Object list).

on-request/browser-sky.mjs
33. Star count from the committed HYG file, `?sky=off` none: `sky.test.ts` "validates a star file and names the bad row", "mounts a made-up three-star catalogue", "cites its sources and says plainly which star file is drawn"; `sceneFrame.test.ts` "updates the sky only when the scene has a sky view ..." (no sky view, no readouts). Stars on screen: draws: smoke check.
34. Sky fixed under camera position/near/far change, turns with rotation, probe equals orientation-only position: `sky.test.ts` "moves no star on screen when the camera's position, near and far change but its orientation does not", "turns with the camera: a rotation moves the probe on screen and a translation does not"; `sceneFrame.test.ts` "updates the sky only when ... reads it back only in developer mode" (`data-sky-probe`).
35. Panel cites HYG and ESO/S. Brunier with licences and star count: `sky.test.ts` "licenses the Milky Way image and credits ESO/S. Brunier", "cites its sources and says plainly which star file is drawn", "adds the item once, and not when the experience hides the sky".
36. Milky Way picture off by default, on by `?milkyway=on` and live button, picture shown readout, nothing fetched while off, two tiles once on: `sky.test.ts` "defaults to on at full brightness with the Milky Way picture off ...", "switches the Milky Way picture on and off without touching the stars"; `skyPicture.test.ts` "is built only when asked for, once, keeping the on/off state and brightness"; new `sceneFrame.test.ts` case (readouts `skyPicture`, `skyPictureShown`, request only when on). Network request counting: draws: smoke check.
37. Brightness sliders and `?stars=1.4` change the uniform in place, no rebuild: `sky.test.ts` "reads brightness from the address, ignoring bad values with a warning, and changes the uniforms in place"; new `sceneFrame.test.ts` case (`skyStarBrightness`, `skyMilkyWayBrightness`).
38. Frame rate with and without sky: recorded, never asserted: retired measurement, looks: owner. High-DPI stars drawn: draws: smoke check.

on-request/browser-sun.mjs
39. Halo wider with halo than without, brightness over zero, over the dots from afar, behind the disc when the disc is big: `sunLook.test.ts` "is an emissive sphere ... with a halo", "size the halo as the larger of the setting and the reach times the disc's projected diameter"; `sceneBodies.test.ts` "includes a glow readout for a body with a halo and honours the live look" and new "reads the halo as over the stream dots from afar and behind the disc once the disc is big".
40. Live sliders, defaults 72 / 1 / 2.5, address sets the start: `sunLook.test.ts` "start from the record's halo and are read from the address", "keep the default, with a console warning, for an unusable value", "read the halo's reach from the address and default it to 2.5 times the disc"; slider widget: draws: smoke check.
41. Sun drawn at the middle of the view from Overview to the closest zoom; closest zoom keeps the camera outside the sphere: `sunLook.test.ts` "keeps the camera outside the Sun's drawn sphere: 1.15 radii ...", "follows the policy, and leaves a plain marker and a tracked point at the point minimum"; `sceneCamera.test.ts` "clamps distance and target distance to the focus limits"; `sceneBodies.test.ts` "reads a body in front of the camera as in view, centred, and drawn as its sphere". The disc texture: looks: owner (already dropped in T-102).
42. Sun label off by default in Perseids, still selectable, live toggle: demo setting, belongs to T-146 (demo rules); label layer DOM: draws: smoke check.
43. No stray Sun in other demos: `experiences.test.ts` "mounts the Sun, Earth, the planets and the comet about the Sun, with no Moon anywhere" (Perseids only) and `sunLook.test.ts` "is the only catalogued body with a halo or an emissive sphere"; per-demo body lists: T-146.

on-request/browser-precision.mjs
44. Earth one AU from the Sun within one pixel still and over a 60-frame sweep (Sun focused, three distances), focused Earth exact at the GPU origin: new `sceneTransforms.test.ts` "position precision far from the Sun (Float32 in, Float64 projection)" cases 1, 3 and 4. The scene being Sun-centred: `syntheticRing.test.ts` "is a Sun-centred illustrative group of at least 10,000 members".

on-request/browser-synthetic-belt.mjs
45. Belt dots visible after focus and zoomed out, True and Readable, declared reach: `syntheticRing.test.ts` "mounts only the points layer and lists the belt once with focus and follow presets", `longOrbitPaths.test.ts` "asks for a framing distance the declared camera reach allows ..."; dots in view: draws: smoke check.
46. Mounts Sun and Earth about the Sun, Sun at zero, Earth on its path, path passes through Earth, Sun and two paths drawn, listed once: `sunCentred.test.ts` "Earth's path and the Sun are placed through centre composition" cases ("composed to the Earth-centred scene, the line passes through the origin where Earth is", "places every path vertex at %s scale from the scene centre"), "the Sun and path declaration", "a path is a state source sampled over a span"; `syntheticRing.test.ts` "the made-up belt as a mounted experience"; `bodyMarkers.test.ts` "mounts the Sun and Earth, enlarges Earth only through the solar-system scale override, and offers both scales".
47. Sun labelled; ids open their info with badge and description: `sunCentred.test.ts` "frames the Sun by the farthest path and anchors a path's label on its own line", "states the Sun's size is a drawing choice and gives every landmark provenance"; label DOM and info panel: draws: smoke check.
48. Apollo and ring draw no Sun or paths: `sunCentred.test.ts` "keeps the belt's own items and reach when the layer is left out, and adds exactly the Sun and two paths when listed", "leaves group fills identical with and without drawing the Sun and paths".

on-request/browser-synthetic-eccentric.mjs
49. Marker rule: Earth a sphere close up, a marker at 1 AU and pulled back; default 3 px; `?markerpx=0` never swaps; 100 accepted: `bodyMarkers.test.ts` "decides at the boundary ...", "takes the threshold from the settings, and a threshold of 0 never swaps", "makes Earth a marker at a Sun-centred distance and a sphere close up ...", "swaps at one distance ...", "default to a 3 px threshold and a 6 px dot, and read ?markerpx= from the address"; the marker visibly drawn: draws: smoke check.
50. Solar-system scale: enlarged Earth stays a sphere where true scale is a marker, and becomes a marker far enough back: `bodyMarkers.test.ts` "under the solar-system scale an enlarged planet stays a sphere at distances where the true-scale one is a marker", "the synthetic long-orbit experience" case.
51. Whole 1 to 51 AU orbit framed (99 percent of vertices, inside the view with margin, fills the view, still drawn farthest out): `longOrbitPaths.test.ts` "puts every vertex of the orbit inside a 45 degree, 16:10 view at that distance, looked at from any of 86 directions", "is centred on the middle of the line, not on the crowded end", "asks for a framing distance the declared camera reach allows ..."; `sceneTargets.test.ts`.
52. Precision of a vertex over 50 AU out within one pixel, still and swept: new `sceneTransforms.test.ts` precision case 2.

on-request/browser-marker-existing.mjs
53. The marker rule across existing demos at True and other scales with the rule on and off, mounts without error: it asserted only that every view mounts without a console error and logged data; the rule itself is proved by item 49; per-demo mounting: draws: smoke check / T-146.

on-request/probe-phone-frames.mjs
54. Retired measuring tool: a throttled-CPU frame-time probe that asserted nothing (SwiftShader numbers only compare between runs); no test replaces it.

Count: 54 scenario lines over the 13 scripts plus the retired probe; none left unmapped. Items 42, 43 and the per-demo part of 53 point to T-146 (demo rules). Limitations: DOM parts (AnchorLabelLayer spans, Events button, sliders, info panel, tap pointer events) are left to the smoke or journey check; no DOM test added by design.

Needed Issues or Tasks: none.

Marked done by the coordinator at 2026-10-22T20:13:55Z on the owner's authority (2026-10-23, asked "Should I mark each step finished as it passes its tests": "I mark them as they pass"). Merged to o038-browser-checks as 8b18c8af; focused re-run there: 4 files, 66 passed.

## Drift Notes

None expected.
