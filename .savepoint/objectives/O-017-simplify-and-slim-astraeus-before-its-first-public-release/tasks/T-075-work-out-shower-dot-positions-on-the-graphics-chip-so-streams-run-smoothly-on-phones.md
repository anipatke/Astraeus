---
id: T-075
title: Work out shower dot positions on the graphics chip so streams run smoothly on phones
objective: O-017
status: done
depends_on: []
owner_validation: {required: true, accepted_check: C-055, scope: [showers glide on laptops; phone-class improvement measured; real-phone look still owed], accepted_by: {role: owner, session: o017-orchestrator-check-20261017}}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Work out shower dot positions on the graphics chip so streams run smoothly on phones

## Outcome

Large orbit groups (the Geminids' 51,115 and the Perseids' 25,588 measured orbits) are positioned every frame by the graphics chip, straight from each member's orbital elements, instead of by periodic whole fills on the processor. Phones and laptops play both showers smoothly at one week per second, and each dot follows its true curved path rather than a straight-line blend between fills.

## User Check

On a phone and a laptop, open the Geminids and the Perseids and press Play: the dots glide at every speed. Pause anywhere: the dots sit where they sit today.

## Done When

1. Owner decision 2026-10-17 ("It will need to run on phones and laptops, we should optimise for that"; chose "use the graphics chip" after measurement: at 4x CPU throttle the Geminids run at about 3 frames a second, C-053 Observation 1). Each member's elements are uploaded once as vertex attributes; the vertex shader solves Kepler's equation (enough Newton iterations for the highest eccentricity in the shipped sets, with a starting guess that converges for e up to 0.99) and rotates into the scene frame. Time enters as a uniform relative to a recent epoch chosen on the CPU in 64 bits, so 32-bit shader arithmetic keeps its precision; the floating-origin offset stays a uniform (as in T-073).
2. Accuracy: the shader's math, mirrored in a JavaScript 32-bit emulation, reproduces the CPU orbit group's positions within a stated tolerance (in kilometres and in screen pixels at the closest camera the showers allow) across the whole timeline, for every member of both shipped sets and for a made-up group with eccentricities up to 0.99 (ARCH-03 first). Where a scale policy maps positions in a way the shader cannot reproduce exactly, that group keeps the CPU path (fills plus GPU blend from T-073), and the rule is tested.
3. Behaviour: pause, seek, reverse, scale change and the timeline bounds give the same positions as today within tolerance; centroid, extent, labels, selection and any readouts that read member positions keep working (from the CPU path on demand, not every frame).
4. Measured with the C-053 probe (`docs/evidence/c053-20261017T022500Z/frames.mjs`): desktop and phone-like runs (390x844 at 2x and 4x CPU throttle), both showers, before and after, with frames over 60 and 90 ms counted. Target: no periodic long frames for either shower at 2x and 4x; any remaining cost stated with its cause.
5. Gates: typecheck, tests, both builds, validator with budget, lite browser check, before/after pictures within tolerance (O-017 Decision 8), plus `tools/validate/run-full.sh` once before handoff since the drawing path changes.
6. Owner validation: the owner sees both showers glide on a phone and a laptop.

## Dependency Note — 2026-10-17

Planned with `depends_on: T-073 requires clear`. T-073's code is committed and its Quick Check C-053 is CLEAR; only its owner look remains, which the owner (remote) will do together with this Task's look on a phone and a laptop. The dependency was removed so this Task builds on the committed T-073 code now; it changes nothing T-073 delivered.

## Context Files

`src/app/PointsView.ts`, `src/core/orbitGroup.ts`, `src/core/listedOrbitGroup.ts`, `src/core/pointGroup.ts`, `src/core/scalePolicy.ts`, `src/experiences/showers/showerStream.ts`, `tests/pointsGpuBlend.test.ts`, `tests/pointsLookAhead.test.ts`, `.savepoint/checks/C-053-t-073-task-check.md`.

## Design References

Design.md points layer, floating origin, scale policies.

## Guardrails

ARCH-02 (frame layer only: State and the clock unchanged), ARCH-03, TEST-01, TEST-03, STYLE-01, STYLE-02.

## Implementation Plan

1. Measure the before figures (desktop, 2x, 4x).
2. Shader path for orbit groups behind a capability check; CPU path kept for groups or policies it cannot serve.
3. 32-bit emulation tests on a made-up group, then the shipped sets; behaviour tests; probe; pictures; full run.

## Boundaries

No change to orbit data, State or the clock. No fewer dots drawn (O-017 Decision 7). No worker threads.

## Technical Verification

Configured gates, lite, pictures, one full run, the frame probe at desktop, 2x and 4x. Evaluated under `agent-skills/references/check-method.md`.

## Executor Evidence — 2026-10-17 (build session; not a Check)

### Design as built

- `src/core/keplerElements.ts` (new): `KeplerElements` per member, derived once in 64 bits from the group's own state vectors (position, velocity, mu): `a`, `e`, unit vectors P and Q (EQJ), mean anomaly at the group's epoch in [-pi, pi), mean motion. `PointGroup.keplerElements?()` is optional; `createOrbitGroup` and `createListedOrbitGroup` provide it (memoised). `fillKeplerRangeKm` is a 64-bit fill straight from the elements (about 8 ms for 51,115 members against 60 ms for the library path; agrees to under 1e-9 of the member's distance, under 1e-12 for both shipped sets).
- `ScalePolicy.linearUnitsPerKm?` (new, optional): present on True, Readable and Solar-system (exact multiplication). A policy without it is never placed by the shader.
- `src/app/keplerShader.ts` (new): GLSL and its 32-bit JavaScript twin side by side. Attributes: `position` = a P (render axes, km), `keplerQ` = a sqrt(1-e^2) Q, `keplerShape` = (e, M0 at epoch, n). Uniforms: `uDt` (seconds since epoch), `uUnitsPerKm`, `uOffset` (minus floating origin plus the group centre's offset from the scene centre, 64-bit then narrowed). Kepler: start `M + 0.85 e sign(M)` on M wrapped to [-pi, pi), then Halley steps (third order), count by eccentricity: 2 below 0.5, 3 below 0.95, 4 up to 0.99 (Newton needed 7 for e up to 0.99; Halley cut shader work by about 40%). Chosen from emulation tables in the session (each count leaves worst error under 2e-7 of a sqrt((1+e)/(1-e)); one fewer leaves 1e-6 to 1e-4).
- `src/app/KeplerPoints.ts` (new): the `Points` object and material (same colour, size, opacity, sizeAttenuation, depthWrite, layer, frustumCulled=false as before; depthTest rule unchanged: True scale only). Epoch handling: attributes hold M0 at an epoch chosen on the CPU in 64 bits; re-based only when the clock is more than a window away (window = 0.5 rad / fastest mean motion), to just ahead of the clock in its direction (so one rebase per window while playing, a rewrite of the `keplerShape` attribute).
- `src/app/PointsView.ts`: a group with elements and more than 1,024 members under a policy with `linearUnitsPerKm` is drawn by `KeplerPoints`; the earlier fills-plus-blend path is unchanged and still serves every other group or policy (switching resets the fills). In shader mode fills serve only the centroid and extent (camera focus, label, framing): exact fills 7 days apart (`KEPLER_CENTROID_SPAN_MS`), filled from the elements, linear between, no per-member mapping or upload; a seek fills exactly. `memberLocalPosition` reads the shader twin. Public additions: `placedByShader`, `rebases`.
- Fallback rule (tested): no `keplerElements`, 1,024 members or fewer, or a policy without `linearUnitsPerKm` keeps the T-073 path.

### Per-criterion outcome

1. DW1 met. Elements uploaded once (rebase rewrites one attribute per window); vertex shader solves Kepler and positions each dot; time is a uniform relative to a CPU-chosen epoch; floating-origin offset stays a uniform. Test `tests/keplerShader.test.ts`, `tests/pointsKepler.test.ts`.
2. DW2 met (ARCH-03 first). Twin vs 64-bit group positions through the real `KeplerPoints` epoch handling, camera at the centroid. Made-up group, e up to 0.99 (2,000 members, 40 times over two years): worst 156-186 km on orbits up to 4e8 km across (1.7e-7 of a sqrt((1+e)/(1-e))), 0.016 px at the closest camera (0.002 units from the centroid, 900 px window). Perseids 25,588 members, 24 times across the timeline: worst 2.4e-7 of the same measure, 0.010 px (the 1.98e6 km worst-by-km is a record with a = 152,000 AU, 1e-7 of its own distance). Geminids 51,115 members, 24 times: worst 94-139 km (1.1e-7), 0.002 px. Stated tolerances (asserted): 4e-7 of a sqrt((1+e)/(1-e)) and 0.03 px. A direct sweep of Kepler's equation over e in [0, 0.99] gives worst 2.8e-7 (asserted under 4e-7). Structural test pairs the GLSL operation order, loop bound, step rule and `begin_vertex` replacement with the twin. Scale rule tested: a policy without `linearUnitsPerKm` keeps the blend path, and `tests/pointsLookAheadShowers.test.ts` now runs on that path (shipped showers' look-ahead still proven there).
3. DW3 met. `tests/pointsKepler.test.ts` (7 tests): pause (no fills, same positions), forward and reverse stepping, seeks (including to the bounds), scale change True to Readable and to a blend-path policy and back, time bounds (hidden outside, one visible object at both ends, no fill outside), centre offset (scene about Earth, group about the Sun, every frame), focus point exact after a seek and within 2e-4 of the extent while playing with at most 6 fills in 30 days, epoch moves once per window not per frame. Centroid, extent, label and readouts read the fills; `memberLocalPosition` the twin.
4. DW4 measured (probe copied to `docs/evidence/o017-t075-probe-20261017T025809Z/`, run in the same sitting, dev server 5487, headless swiftshader). Before is HEAD at the start of the session; the 4x "before" Geminids run reached only 45 frames in 12 s.

| run | shower | before: >60 / >90 / frames / median / p95 / max | after: >60 / >90 / frames / median / p95 / max |
|---|---|---|---|
| desktop | Perseids | 0 / 0 / 449 / 33.3 / 33.4 / 50.1 | 0 / 0 / 438 / 33.3 / 33.4 / 50.1 |
| desktop | Geminids | 3 / 0 / 299 / 33.4 / 50.1 / 66.7 | 1 / 0 / 349 / 33.3 / 50.0 / 66.7 |
| 2x | Perseids | 2 / 1 / 350 / 33.3 / 50.0 / 100.1 | 0 / 0 / 386 / 33.3 / 49.9 / 50.1 |
| 2x | Geminids | 73 / 28 / 142 / 66.6 / 200 / 216.8 | 26 / 1 / 250 / 50.0 / 66.7 / 100 |
| 4x | Perseids | 61 / 28 / 159 / 50.0 / 183.4 / 249.9 | 16 / 0 / 275 / 49.9 / 66.6 / 66.8 |
| 4x | Geminids | 44 / 29 / 45 / 366.7 / 400 / 400.1 | 120 / 13 / 184 / 66.6 / 100 / 183.3 |

   The periodic long frames are gone (traced in the page: no sync over 20 ms and no placement over 8 ms during play at 4x). What remains is a steady floor from software rendering: with the Kepler loop forced to zero steps the Geminids at 4x still run median 66.6, p95 83.4, max 100 (swiftshader draws and vertex-shades on the CPU; 51,115 points at 780x1688); the Kepler maths adds the rest of the p95/max there. These runs cannot show a real phone GPU; the owner's phone look is the real test. Honest reading: Geminids at 4x are about 15 frames a second (before: about 3), not 30.
   Two earlier iterations were measured and rejected: all fills from the library path with the shader (a 450 ms whole fill each week at 4x, because fills took 60 ms there against 8 ms from the elements), and Newton at 7 steps (median 49.9 desktop Geminids in software GL).
5. DW5 met except the pictures tolerance, see below. `npx tsc --noEmit` pass; `npx vitest run` 55 files, 919 passed 1 skipped; `npm run build` pass; public build + `node tools/validate/public-build-assets.mjs <dir>`: ok, 45 files checked (`docs/evidence/o017-t075-gates-20261017T032157Z/`); lite 26/26 loads, zero console errors (`docs/evidence/o017-t075-lite-20261017T032238Z/`); `tools/validate/run-full.sh` once: every step exit 0, zero error lines (`docs/evidence/o017-t075-full-20261017T032832Z/summary.txt`, 515 s).
   Pictures: `docs/evidence/o017-t075-after-20261017T032416Z/` against `o017-before-20261016T205125Z`: 18 same-size pictures all within tolerance except the four shower pictures: Geminids desktop 0.2108% and phone 0.0319%, Perseids desktop 0.2523% and phone 0.0966% (tolerance 0.024% over 16 levels); the full run's own diff agrees (0.2522%). Cause shown: the differing pixels cluster on the arcs next to the Sun (diff image reviewed). With the shader path forced off (temporary edit, reverted) the same capture is back within tolerance against before (`docs/evidence/o017-t075-cpuforced-20261017T032640Z/`, max 0.0234%), so the difference is the shader path drawing the true position where the earlier path drew the straight-line blend (next item). OWNER DECISION: accept the new shower pictures as the baseline for the two showers.
6. DW6 owner validation: pending (owner looks on a phone and a laptop, with T-073's look).

### Added proof (coordinator, from the owner's look: "where geminids orbits the sun, it appears to pulse back and forth")

`tests/pointsBlendCorner.test.ts`: Geminids (all 51,115), five fill pairs across the timeline (peak -60, -20, 0, +25, +70 days), 72 h apart, at blend factor 0.5, the 6,424 member-instants within 0.3 AU of the Sun (distance at the true mid time). Largest distance between drawn and true position: T-073 fills-plus-blend path 3,481,918 km = 5.24 px at the default Geminids view (camera at 2.5 extents, 900 px window); shader path 43 km = 0.0001 px. The straight-line blend cuts the corner of the tight perihelion arcs by several pixels, which is the pulsing; the shader removes it (remaining error is 32-bit precision only). Asserted: shader under 0.02 px and blend over 100x the shader's error.

### Extra reads, files, limits

- Extra reads (outside Context Files): `src/core/twoBodyAdapter.ts` (how the group propagates), `src/app/sceneLayout.ts`, `src/app/renderCoordinates.ts` (offset and axes), `src/app/sceneFraming.ts` (closest camera distance 0.002 units, group framing 2.5 extents), `src/app/experienceDefinition.ts` (GroupLayer, camera fov), `src/app/sceneDebug.ts`, `src/app/sceneHooks.ts`, `src/app/AstraeusScene.tsx` (who calls sync/place), `tests/helpers/measuredOrbits.ts`, `tests/scenePlacement.ts`, `data/showers/geminids.json` (timeline, refill settings), `tools/validate/run-full.sh` header, `tools/validate/capture-experience-pictures.mjs` header. Reason: to see how positions are computed, who reads them, and how to run the gates.
- Files changed: `src/core/keplerElements.ts`, `src/core/pointGroup.ts`, `src/core/orbitGroup.ts`, `src/core/listedOrbitGroup.ts` (gravitational parameter helper moved to keplerElements), `src/core/scalePolicy.ts`, `src/app/keplerShader.ts`, `src/app/KeplerPoints.ts`, `src/app/PointsView.ts`; tests `tests/keplerShader.test.ts`, `tests/pointsKepler.test.ts`, `tests/pointsBlendCorner.test.ts`, `tests/pointsLookAheadShowers.test.ts` (forced onto the blend path). `.savepoint/task-ids.yml` shows `last_issued: 76`: not this session's change.
- Limits: GLSL `sin`/`cos` accuracy on real GPUs is not emulated (the twin uses `Math.sin` rounded to 32 bits); shader precision assumes highp floats (the default for three on WebGL2 hardware). No real-GPU or real-phone frame figures exist. Centroid and extent are exact only at seeks and 7-day fills (interpolated between; error under 2e-4 of the extent on the harsh fixture, 3e-5 on the Geminids). A record with a = 152,000 AU in the Perseids set is drawn within 1e-7 of its distance.

### Drift Notes

- Design.md points layer: the shader-placed path (per-member ellipse attributes, epoch uniform, Halley steps, 7-day centroid fills, `linearUnitsPerKm` rule) is not in Design.md yet; deferred to the Objective's integration Task per the project rule (the coordinator names it).
- `docs/BROWSER_CHECKS.md` and the lite/full scripts were not changed; no browser script scenario was invalidated.

## Owner Completion — 2026-10-17

Owner: "cant reach, but thats OK i think previous version ran ok and this should be better" (after the laptop look at the T-073 build: "thats way smoother"). Accepted with C-055; a real-phone look at the T-075 build is still owed once it is on a preview link or live.
