---
id: T-098
title: Draw all of Jupiter's moons and its faint rings in the Jupiter scene
objective: O-025
status: in_progress
stage: audit
depends_on: [{task: T-096, requires: clear}, {task: T-097, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Draw all of Jupiter's moons and its faint rings in the Jupiter scene

## Outcome

The Jupiter demo shows every moon where NASA puts it: the big four as textured worlds with their tagged places, every other moon as a small grey dot that becomes a grey ball at its real size up close, names on hover, tap or zoom, and Planetary Explorer's four faint ring bands at the real rings' distances.

## User Check

Open the Jupiter demo, zoom out to see the swarm of dots far from Jupiter, zoom in on a small moon to see its grey ball, hover a dot for its name; look past the inner moons at the faint rings.

## Done When

1. O-025 Decisions 2, 7 and 9: dots for the small moons drawn as one batch (like the showers' points), a pixel floor so they never vanish, a grey ball at true size when close; names appear on hover, tap or near zoom only (no wall of labels).
2. The four mapped moons draw as today (textures, lighting, tagged places from their packages).
3. Rings: Planetary Explorer's bands lifted as-is in colour and opacity (halo #a0b0d0 0.105, main #d0a080 0.28, inner gossamer #b08060 0.065, outer gossamer #a07050 0.026; `/home/user/code/planetary-explorer/src/entities/jupiter.ts`, `PlanetRingSystem.tsx`), placed at the real rings' radii from a published source (the owner's chosen deviation), flat in Jupiter's equator; opacities and colours are live settings.
4. **Family-coloured orbits** (owner, 2026-10-18: "would be cool to have different coloured orbits for each family"): each moon's orbit line is drawn in its family's colour (families from T-097's `data/moons/jupiter.json`), in the faint I-035 orbit look and batched so 115 orbits stay cheap; one colour per family from a palette that reads on the dark sky and stays distinguishable for common colour-vision differences; the palette is live settings (owner rule); the dots stay grey (owner's choice, Decision 2); orbit labels stay off by default (owner, 2026-10-18); T-099's family highlight brightens that family's orbits.
5. Positions from the T-096 provider; generic engine and presentation code (no Jupiter names outside data, ARCH-01); an experience may choose which bodies to show (O-025 Decision 8: the rest stay "on the shelf").
6. Phone performance: frame time measured on a throttled phone-class run with all moons and rings shown, no worse than today's Jupiter–Io demo by more than a stated margin.
7. Browser checks through the shared driver (moon count drawn, a dot's name on hover, a small moon's ball up close, rings present, one orbit colour per family); full run passes; owner look.

## Context Files

`src/experiences/jupiter-io/jupiterIo.ts`, `src/app/PointsView.ts`, `src/app/bodyDraw.ts`, `src/app/AstraeusScene.tsx`, `src/assets/compositions.ts`, `src/assets/catalogue.ts`, `/home/user/code/planetary-explorer/src/entities/jupiter.ts`, `/home/user/code/planetary-explorer/src/features/moon/PlanetRingSystem.tsx`, `tools/validate/driver.mjs`, `tools/validate/browser-jupiter-io.mjs`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/Objective.md`.

## Design References

O-025 Decisions; Design.md presentation engine (points, bodies, floating origin, scales).

## Guardrails

ARCH-01, ARCH-02, PROV-01, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. All moons from the provider: batched dots, balls up close, names on demand.
2. Rings; performance measure; checks; owner look.

## Boundaries

Drawing only; the families panel, the demo's date and stories are later Tasks.

## Technical Verification

Configured gates, Jupiter script, throttled frame-time probe, full run. Evaluated under `agent-skills/references/check-method.md`.

## Evidence (lane o025-t098, builder session t098-builder-lane-20261018)

Base `75b57dd`; lane commits `71bf248` (work), `475949b` (merge of o018-o019 with T-102: no screenshots, scene readouts), then this handoff. Evidence: `docs/evidence/o025-t098-20261018/` (`lite/results.json`, `jupiter-io/results.json`, `probe/*.json`, logs). No screenshots kept (owner, 2026-10-18).

### How it is drawn

- **Positions.** Every moon from the T-096 core fits. `src/core/bodies/jupiterMoons.ts` holds the one loaded set, loads the index and only the chunks a window needs (`loadJupiterMoons`, `chunksNeeded` refuses a window whose chunks the build does not ship), decodes in 8 ms slices, and gives Io, Europa, Ganymede and Callisto their core bindings (fitted position and velocity, tidal-lock orientation from the fitted velocity, so no chunk outside the window is read). Io's core binding moved from the mean elements to the fits (Decision 3); the mean-element model stays as the T-078 record. `ExperienceDefinition.prepare` (new, generic) lets the entry await the load.
- **Small moons (111).** `src/core/ephemerisGroup.ts` (generic point group over a fit set) feeds `src/app/BodySetView.ts`: one `Points` draw for the dots (3 px floor, grey, live settings) and one `InstancedMesh` draw for the balls at true radius (lit along Jupiter's Sun direction like Io), positions camera-relative in Float64 each frame (0.05 ms for all 115 at 4x, T-096). The ball covers its dot by the depth test once wider. Names only on hover (mouse), tap (touch; a second tap on a named dot focuses it) or near zoom (ball ≥ 6 px across, nearest 8): `src/app/BodySetLabels.ts`. Members are focus targets with radius-aware limits (`sceneFraming.ts`, `MEMBER_MIN_DISTANCE` 0.0015 units, beyond the camera's 0.001 near plane).
- **Orbits.** `src/app/OrbitSetView.ts`: one `LineSegments` draw for 114 orbit lines (the 111 small moons plus Europa, Ganymede, Callisto through `extraOrbits`); Io keeps its I-035 composition loop as today, recoloured to its family colour. Each line is the moon's osculating ellipse about Jupiter at the clock time (128 points; passes through the moon; stale ellipses recomputed, at most 16 a frame, once the clock has moved 30 simulated minutes). Faint I-035 ring look per vertex in the shader: opacity 0.18, +0.45 brightening by 4 orbit sizes (donor values). Colours are shader uniforms per family. Palette (live settings, Developer > Moons and rings): galilean #f0e6da (the existing orbit cream), inner #f0e442, himalia #e69f00, ananke #56b4e9, carme #cc79a7, pasiphae #009e73, carpo #d55e00, loner #bbbbbb: Okabe-Ito without its black and dark blue. Simulated (Machado 2009, full severity) minimum pairwise CIE76 ΔE: normal 17.4, protan 16.8, deutan 14.6, tritan 13.3; lowest lightness L* 47. `familyGains` uniforms are ready for T-099's highlight. Orbit labels: none added.
- **Rings.** `data/rings/jupiter.json` (core data) read through `src/core/bodies/jupiterData.ts`, parsed in `src/assets/rings.ts`, drawn by `src/app/RingView.ts` (donor `SaturnRingMesh.tsx` copied: 2048 px radial canvas texture, 6 % soft edges, 256-segment ring, transparent, double-sided, no depth write) in Jupiter's oriented group (its equator). Donor colours and opacities as-is; radii from NASA NSSDC Jupiter Rings Fact Sheet (halo 89,400-123,000 km, main 123,000-128,940, Amalthea gossamer 128,940-181,350, Thebe gossamer 181,350-221,900). Opt-in per experience (`visualOverrides.jupiter.rings`); colour and opacity per band are live settings.
- **Mapped moons.** Europa, Ganymede, Callisto added to the core catalogue with the donor's 2K maps copied byte for byte (SHA-256 equal to their `map.json`), donor materials, Io's lighting. No Jupiter names in engine or shell code (name check passes; Jupiter names only in `src/core/bodies/`, `src/assets/bodies/`, compositions and the experience).

### Window

The January 2000 window was outside the fits (2010-2030), so the demo now starts 2016-11-04 with the same two-week span (Drift Note). The build ships and the page fetches only the 2016 chunks (116 files; one per moon plus Jupiter's series): `import.meta.glob(".../*/2016.bin")` in the experience; small chunks are inlined by Vite, 14 emitted as files. Unit test: the window's needed chunks are exactly the shipped 116.

### Phone performance (Done When 6)

`tools/validate/on-request/probe-phone-frames.mjs`: 390x844 touch, CPU throttled 4x through DevTools, 8 s of animation frames while playing, headless Chromium with SwiftShader (absolute numbers far above a real phone; compare only). Baseline is the base commit `75b57dd` served from a scratch copy on port 5691. Final run 2026-10-18 about 07:36-07:45Z, each launched only with no headless Chromium running and load under 6.

| Run | Mean ms | p50 | p95 | fps |
|---|---|---|---|---|
| Baseline Jupiter-Io, default opening | 21.3 | 16.7 | 33.4 | 46.9 |
| T-098, default opening (all moons, orbits, rings) | 23.0 | 16.7 | 33.4 | 43.5 |
| T-098, whole swarm in view (`jupiter,30,30,6000`) | 22.2 | 16.7 | 33.4 | 45.0 |
| T-098, close over the rings (`jupiter,0,80,120`) | 27.4 | 33.3 | 33.4 | 36.6 |
| Baseline, Jupiter and Io from 1000 units | 17.1 | 16.7 | 16.8 | 58.4 |

Stated margin: the default view is within 10 % of today's mean with the same p50 and p95 (measured +8 %). Close over the rings is about 29 % slower than today's default view (the ring disc fills much of the screen). The first build measured 33.5 ms at the default view; profiling showed three extra composition loops (per-frame trajectory arcs) and per-frame ellipse rebuilds, fixed by batching the three moons' orbits, the 30-minute refresh and a linear-scale fast path.

### Per-criterion outcomes

1. Decisions 2, 7, 9 — **Met.** One batch of dots with a 3 px floor, balls at true size close up (smallest moon S/2010 J 2, 0.5 km: 25 px radius ball against a 3 px dot at 0.003 units), names only on hover, tap or near zoom (0 or 1 names before asking).
2. Mapped moons — **Partly met.** Io draws as today (texture, lighting, loop); Europa, Ganymede and Callisto now draw the same way. Tagged places are not drawn: Astraeus draws no package features for any body today (no code reads `features.json`), so "as today" has none to carry. Drift Note.
3. Rings — **Met.** Donor bands at NSSDC radii, flat in Jupiter's equator, live colour and opacity.
4. Family-coloured orbits — **Met.** Batched, faint I-035 ring look, palette above as live settings, dots grey, no orbit labels, per-family gains for T-099.
5. Positions from the T-096 provider, generic code, experience chooses bodies — **Met.** ARCH-03: `tests/bodySet.test.ts` proves the body-set layer with a made-up two-body set.
6. Phone performance — **Met with the stated margin** (above).
7. Browser checks through the shared driver — **Met for the lane tier.** Full run deferred to the orchestrator's batch run. Owner look pending.

### Commands run (lane)

- `npx tsc --noEmit` — exit 0. `npx vitest run` — 72 files, 1089 passed, 1 skipped. `npm run build` — exit 0 (existing chunk-size warning). `node tools/validate/driver-guard.mjs` — passes.
- Public build `ASTRAEUS_PUBLIC_BUILD=1 npx vite build` + `node tools/validate/load-budget.mjs <dir>`: jupiter-io page 6,918,077 B raw / 4,404,908 B gzip (limits raised to 7,270,000 / 4,630,000, measured + 5 %; the page set now lists the three moon maps, the index chunk and the fetched 2016 chunks via a new `fetchedFiles` entry); whole build 24,474,635 / 16,576,626 (limit raised to 25,700,000 / 17,410,000). `assets.html` is over its limit by 815 B, as on the base commit (T-097's catalogue section, not this Task).
- `node tools/validate/browser-lite.mjs` (port 5690, 07:33-07:35Z) — 28/28.
- `node tools/validate/browser-jupiter-io.mjs` (07:31-07:33Z) — exit 0, zero console errors; readouts in `jupiter-io/results.json`.
- `node tools/validate/on-request/probe-phone-frames.mjs` — the table above.
- Full run deferred to the orchestrator's batch run.

### Files

Read (Context Files): all listed. Extra reads (logged): T-096 and T-097 Task evidence (inputs); `src/core/chebyshevEphemeris.ts`, `chebyshevSeries.ts` (exports), `pointGroup.ts`, `body.ts`, `provenance.ts`, `state.ts` (createState), `scalePolicy.ts` (mapping), `bodyOrientation.ts` (signature), `bodies/index.ts`, `bodies/io.ts`, `bodies/jupiter.ts`, `planetSeries.ts` (load pattern); `src/app/experienceDefinition.ts`, `sceneHooks.ts`, `sceneTargets.ts`, `sceneFraming.ts`, `sceneCamera.ts`, `CameraController.tsx` (near plane), `LayeredRender.tsx`, `sceneLights.ts`, `lighting.ts`, `sceneLayout.ts`, `PathView.ts`, `BodyView.tsx`, `BodyMesh.tsx`, `SceneLabels.ts`, `App.tsx`, `SettingControls.tsx`, `orbitLook.ts`, `visual.ts`, `licence.ts`, `src/main.tsx`; `data/bodies/README.md`, the four moons' `map.json`, `data/stories/jupiter-io/panels.json`; donor `jupiter.ts`, `europa.ts`, `ganymede.ts`, `callisto.ts`, `SaturnRingMesh.tsx`, `public/textures/README.md`; tests that broke (`jupiterIo`, `assets`, `planets`, `stateResolver`, `textureLicence`, `bodyMarkers`, `layerRule`, `nameCheck`), `vitest.setup.ts`, `tools/validate/load-budget.mjs`, `driver-guard.mjs`, `public-build-assets.mjs` (head), `docs/BROWSER_CHECKS.md`; NASA NSSDC Jupiter Rings Fact Sheet (web).
Changed: new `src/core/ephemerisGroup.ts`, `src/core/bodies/jupiterMoons.ts`, `src/core/bodies/jupiterData.ts`, `src/assets/moonCatalogue.ts`, `src/assets/rings.ts`, `src/assets/bodies/{galileanMoons,jupiterMoonCatalogue,jupiterRings}.ts`, `src/assets/textures/{europa,ganymede,callisto}-2k.jpg`, `src/app/{bodySet,BodySetView,BodySetLabels,OrbitSetView,RingView,sceneBodySets}.ts`, `data/rings/jupiter.json`, `tests/{bodySet,jupiterMoonsScene}.test.ts`, `tools/validate/on-request/probe-phone-frames.mjs`; changed `src/core/bodies/{index,io}.ts`, `src/assets/{catalogue,compositions,visual}.ts`, `src/app/{App.tsx,AstraeusScene.tsx,BodyView.tsx,PathView.ts,experienceDefinition.ts,sceneDebug.ts,sceneFraming.ts,sceneHooks.ts,sceneTargets.ts}`, `src/main.tsx`, `src/experiences/jupiter-io/jupiterIo.ts`, `data/stories/jupiter-io/panels.json`, `vitest.setup.ts`, tests (`assets`, `bodyMarkers`, `jupiterIo`, `planets`, `stateResolver`, `textureLicence`), `tools/validate/{driver.mjs,browser-jupiter-io.mjs,load-budget.mjs}`, `docs/BROWSER_CHECKS.md`, this Task.

### Limitations

- Owner look not done (owner_validation required). Headless frame times are SwiftShader numbers, not a phone's.
- Orbit lines are osculating ellipses at the clock time, not the fitted paths; for the Sun-perturbed irregular moons the real path wanders from the ellipse over months (stated in the set's provenance).
- Orbit vertices are float32 relative to Jupiter, so at the closest framing of a far small moon its line may sit a few km off its ball.
- Small moons have no information panel or list entry yet (T-099); a dot is reached by hover, tap, near zoom or a view link (`?view=<moon id>,...`).
- Ganymede's map licence rests on the donor's credits list ("USGS / NASA, Public Domain"); its README entry has no licence line. Ganymede's texture is turned 180 degrees to undo the donor's recentring (owner look should confirm).
- The default opening now frames to Callisto (the farthest drawn body), so Jupiter opens small; T-100 sets the start view.

### Drift Notes

- **Window (temporary):** the Jupiter demo starts 2016-11-04 for two weeks (was 2000-01-01): the old window was outside the fits. Story panel times moved by the same offset and three date-bound sentences reworded truthfully (Galileo "in late 1999"; positions from Horizons; Europa and Ganymede now drawn). T-100 owns the year-long window and the stories. Note for T-100: the slowest moons' "2016" chunks start on 9 February 2016 (segment grid), so a year from 4 Nov 2016 needs the 2017 chunks and possibly 2018 for long-segment moons; extend the glob in `jupiterIo.ts`.
- **Tagged places:** no Astraeus code draws body-package features, so the mapped moons' tagged places (Done When 2, Success Condition 3) are not drawn; needs a planned Task.
- **Io's core binding changed** from mean elements to the fits; Io is now valid 2010-2030 only. Tests depending on Io in 2000 moved to 2016 (test setup loads the 2016 fits, as it loads the planet series).
- **Load budget:** jupiter-io page and whole-build limits raised on purpose (above); `assets.html` over by 815 B on the base already (T-097).
- **Stale wording found, not changed:** the experience's Jupiter limitation says Jupiter is "drawn flat in one colour", but the catalogue's Jupiter has a CC BY 4.0 texture and draws it; the browser check still asserts that sentence.
- **Design reconciliation (deferred to the O-025 integration Task):** Design.md should gain the body-set layer (dots, balls, names on demand, batched family orbits), the curve-fit-backed moon bindings and their loader, `ExperienceDefinition.prepare` and `bodySets`, ring systems as opt-in visual data, and the `fetchedFiles` load-budget entry.
- Lane rules: no router edit; no Task, Check or Issue created.

### Orbit-line fix (owner report 2026-10-18: S/2021 J 7 off its line), commit `3d88a86` plus coordinator follow-up

Change (`3d88a86`): each moon's orbit line is its own fitted path over one period ending at the clock time, plus a head segment to the live place, replacing the osculating ellipses (Limitations bullet 1 no longer applies). History chunks 2014-2015 shipped and loaded.

Coordinator verification, session 009b0116, 2026-10-18 07:53-08:02Z, lane dev server `127.0.0.1:5199`:
- `browser-jupiter-io.mjs` first run (`docs/evidence/o025-t098-orbits-20261018/jupiter-io-20261018T075352Z.log`) passed, but its on-own-line assertion was vacuous: `gapPx` is `min(gap, pathGap)` and `gap` includes the head segment, which ends on the body, so it is always 0. Measured to the sampled path alone (`pathGapPx`) at 0.5 units the gaps were 138-968 px.
- Scratch probe over view distances 5/50/500/3000 units: `pathGapPx` falls as 1/distance (S/2021 J 7 25.6/2.0/0.21/0.05 px; Himalia 52.9/12.3/0/0.19), so the gap is the short head chord along the path, not a body off its line.
- Assertion corrected in `tools/validate/browser-jupiter-io.mjs`: views at 500 units, `pathGapPx <= 1.5`. Rerun (`jupiter-io-20261018T075802Z/`): exit 0, zero console errors; desktop 0.29/0.46/1.11/0.45/0.93 px, phone 0.19/0.46/0.79/0.50/0.83 px (S/2021 J 7, Sinope, Carme, Ananke, Himalia).
- Phone probe (`on-request/probe-phone-frames.mjs`, 4x throttle, compare only), before = main checkout `o018-o019` at `860548b` on `127.0.0.1:5691`, two interleaved rounds (`probe/*.json`), mean/p50/p95 ms: default opening before 24.1/16.7/33.4 and 24.2/16.7/33.4, fix 25.4/33.2/33.4 and 25.9/33.3/33.4; whole swarm before 24.3/16.7/33.4 twice, fix 25.6/33.2/33.4 and 24.8/16.7/33.4. Mean +5-7 % (inside the stated 10 % margin); p50 at the default opening is 33 ms against 16.7 ms in both rounds, which misses the stated "same p50" margin. Load at the default opening 2.0-3.7 s against 1.5-1.6 s (history chunks). Owner decision pending.
- Owner decision 2026-10-18 (asked in session 009b0116, answer "Merge, then judge"): merge the orbit-line fix despite the p50 miss; the owner judges smoothness on the preview (`localhost:5490`). Not technical `CLEAR`.

### Steady line up close (owner on the preview 2026-10-18: "up close the line is a bit jumpy"), main checkout `o018-o019`, session 009b0116

Causes: every re-sample slid all 128 sample times with the clock, so each chord moved; the single straight head segment grew for a step and snapped back; heads were Float32 about Jupiter (about 1.2e-4 units at Himalia's distance, tens of pixels at the closest zooms). Change in `src/app/OrbitSetView.ts`: samples at whole multiples of a fixed per-path step (period / (samples - 1), set at first sample), the path ending a whole step before the clock's step; the head is `ORBIT_HEAD_SUBSTEPS` (8) fine points per step from the path's last sample, kept between frames and only extended, then a last chord to the live place; heads written each frame about the floating origin in Float64 before rounding. Readout gains `offLinePx` (body's distance from the last sampled chord continued); `pathGapPx` now excludes only the last chord. `browser-jupiter-io` asserts `offLinePx <= 1.5` (the old `pathGapPx` assertion would fail by design: the body is up to one fine step past its last fine point). `tests/bodySet.test.ts` asserts points on the line do not move across a re-sample.
- `npx tsc --noEmit` exit 0; `npx vitest run` 74 files, 1103 passed, 1 skipped; driver guard passes.
- `browser-jupiter-io.mjs` (`jupiter-io-steady-20261018T081642Z/`): exit 0, zero console errors; `offLinePx` desktop 0.004-0.059, phone 0.001-0.070. (First run, `jupiter-io-steady-20261018T081236Z.log`, failed on the old `pathGapPx` assertion, 5.2 px, before the readout change.)
- `browser-lite.mjs` (`lite-steady-20261018T081310Z/`): 28/28.
- Phone probe (`probe-steady/`), lane `o025-t098` as before against this change, mean/p50/p95 ms: default before 23.5/16.7/33.4 and 25.2/16.8/33.4, after 26.5/33.3/33.4 and 24.2/16.7/33.4; close on Himalia (`himalia,30,20,5`) before 18.6/16.7/33.3, after 17.3/16.7/16.8. No difference beyond run-to-run noise. Owner look pending.
- Owner decision 2026-10-18 (session 009b0116): Ganymede's 180 degree texture turn accepted ("That's ok at some point we'll redo the tagged location"); tagged locations to be redone under T-103.
