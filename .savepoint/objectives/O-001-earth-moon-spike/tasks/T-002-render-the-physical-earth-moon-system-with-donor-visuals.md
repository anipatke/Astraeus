---
id: T-002
title: Render the physical Earth–Moon system with donor visuals
objective: O-001
status: done
depends_on: [{task: T-001, requires: clear}]
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: astraeus-spike-01-planning-2026-10-05}
check_waiver:
    task: T-002
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-05T20:59:43Z"
---

# Render the physical Earth–Moon system with donor visuals

## Outcome

A working Earth–Moon scene preserves donor appearance while consuming the scientific core through the scale policy, with independent transforms, scientific orientations and illumination, a separate floating-origin layer, trajectory-derived path and camera/focus interaction.

## User Check

Compare the donor Earth/Moon textures, material and atmosphere to the spike. View the Moon at real/compressed distance, focus Earth and Moon, and rotate/zoom while playback continues without changing physical motion.

## Done When

1. Adapt Earth/Moon spheres, materials, texture colour/orientation handling and Earth atmosphere from the donor with source attribution. Keep unclear-licence textures in local application assets, outside any public package; record unresolved provenance without claiming redistribution rights.
2. Earth visual mesh, Moon orbital transform and path are siblings under a stationary scene root. Scientific time/position/orientation do not depend on drag state or camera orientation. Earth rotation comes from scientific State; presentation offsets only align texture axes.
3. Both scale policies draw the same scientific state with correct body radius ratio; real-scale framing, near/far clipping and focus remain usable. Fixed coordinate conversion preserves EQJ handedness.
4. An open sampled path derives from the exact same trajectory and scale policy, includes the selected timestamp and refreshes appropriately on seek/window changes and playback. No circular ring or independent orbital solution remains.
5. Consume scientific Earth/Moon quaternions, consistently convert EQJ orientation and apply documented texture-facing offsets. Earth rotation is date-based and the designated lunar near-side axis points toward Earth across dates. Verify texture orientation visually; do not implement libration.
6. Camera drag, zoom and Earth/Moon focus act on camera/target only, remain usable during playback and follow moving Moon focus. Preserve donor interaction behaviour where sensible without importing full application metadata/store.
7. Actual Three.js hierarchy regression tests verify unchanged scientific state and relative rendered geometry after rotating camera and Earth visual mesh; path mapping and locking tests pass. Record donor comparison/browser evidence and configured gate results.

8. A small rendering-owned floating-origin helper subtracts Float64 scaledCameraOrigin from mapped absolute Earth/Moon/path/camera/target positions before GPU conversion. It remains independent from ScalePolicy and the core. Tests verify distances/projections under origin changes, a common near-one-AU translation and close Moon focus under both policies; browser evidence checks no visible jump during rebasing.
9. Use physical Sun directions from the core for body illumination, independent of readable distance compression. Earth day/night boundary and lunar phase follow date and viewing geometry. Test fixed-date orientation/light conversion and visually validate independently sourced new/quarter/full-Moon dates with restrained ambient fill. No phase animation or eclipse simulation.

## Context Files

Existing donor: `/home/user/code/planetary-explorer/src/features/moon/MoonScene.tsx`, `/home/user/code/planetary-explorer/src/features/moon/MoonMesh.tsx`, `/home/user/code/planetary-explorer/src/features/moon/EarthCompanions.tsx`, `/home/user/code/planetary-explorer/src/features/moon/OrbitingMoon.tsx`, `/home/user/code/planetary-explorer/src/features/moon/CompanionMoon.tsx`, `/home/user/code/planetary-explorer/src/features/moon/AtmosphereGlow.tsx`, `/home/user/code/planetary-explorer/src/features/moon/usePlanetTexture.ts`, `/home/user/code/planetary-explorer/src/features/moon/CameraController.tsx`, `/home/user/code/planetary-explorer/src/features/moon/OrbitalTrail.tsx`, `/home/user/code/planetary-explorer/src/entities/earth.ts`, `/home/user/code/planetary-explorer/src/entities/moon.ts`, `/home/user/code/planetary-explorer/public/textures/earth-2k.jpg`, `/home/user/code/planetary-explorer/public/textures/moon-orig-2k.jpg`, `/home/user/code/planetary-explorer/public/textures/moon-orig-4k.jpg`.

Predecessor outputs: `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/core/clock.ts`, `src/core/body.ts`, `src/core/state.ts`, `src/core/trajectory.ts`, `src/core/moonTrajectory.ts`, `src/core/scalePolicy.ts`, `src/core/astronomyAdapter.ts`, `src/core/referenceCenters.ts`, `src/core/bodyOrientation.ts`, `src/core/illumination.ts`, `tests/orientationIllumination.test.ts`, `tests/core.test.ts`, `docs/ASTRONOMY_VALIDATION.md`, `.savepoint/config.yml`, `.savepoint/Design.md`.

Planned new outputs: `src/main.tsx`, `src/app/App.tsx`, `src/app/EarthMoonScene.tsx`, `src/app/BodyMesh.tsx`, `src/app/AtmosphereGlow.tsx`, `src/app/useBodyTexture.ts`, `src/app/renderCoordinates.ts`, `src/app/floatingOrigin.ts`, `src/app/orbitPath.ts`, `src/app/CameraController.tsx`, `src/app/style.css`, `tests/sceneTransforms.test.ts`, `docs/DONOR_PROVENANCE.md`. Inspect exact gesture/focus/licence dependencies through logged targeted extra reads; these remain unverified.

## Design References

Owning Objective: Confirmed core contracts, Astronomy choice and accuracy, Scene integration, Verification and handoff, and Discovered risks. Planned changes remain in the Objective until implementation is reconciled into Design.

## Guardrails

SEC-01, TEST-01, TEST-02, TEST-03, TEST-04 and STYLE-01 through STYLE-10. Existing scaffold rules outside this work do not introduce authentication or unrelated infrastructure requirements.

## Implementation Plan

1. Confirm predecessor core contracts and identify minimal donor gesture/focus and licence dependencies using logged reads.
2. Adapt proven visual components and required local textures, preserving source/provenance records.
3. Wire scientific state through policy, Float64 origin subtraction and fixed axis conversion into sibling transforms. Apply scientific orientation with texture-only offsets and physical Sun-direction lighting.
4. Replace fake ring/trail with a sampled open trajectory path; consume core locking without duplicating its calculation.
5. Adapt camera interaction/focus and real-scale reach; keep viewing transforms outside physical hierarchy.
6. Test actual transform independence, locking and path correspondence; compare appearance in the browser and run gates.

## Boundaries

No donor repository edits, editorial UI, full donor store, additional planetary bodies, full libration, eclipses, generic scene management or streaming. Minimal Sun illumination is in scope; no visible Sun mesh is required. Scientific orientation lives in the predecessor core.

## Technical Verification

Configured build/typecheck/test gates; meaningful Three.js transform tests, sampled-path mapping, scientific quaternion conversion, floating-origin invariance and Sun illumination tests; browser checks for appearance, focus, drag/zoom and both scale modes. Record any browser/environment limits honestly.

## Technical Evidence

Gates run at handoff (2026-10-06): `npm run typecheck` (clean), `npm run build` (built), `npm test` (3 files, 33 tests passed). Lint is not configured.

Per criterion:
1. Donor sphere/material/atmosphere/texture loader adapted with attribution in `docs/DONOR_PROVENANCE.md`; textures are local assets under `src/app/assets/textures` (2k only). Earth and original-Moon texture provenance is UNRESOLVED in the donor README; no redistribution right claimed.
2. `tests/sceneTransforms.test.ts` "Three.js hierarchy independence": real Three.js hierarchy; Earth group, Moon group (and path) are siblings under one root; rotating camera and Earth mesh leaves Moon world position, Earth–Moon separation and scientific State (positions, quaternions, time) unchanged, both policies. Earth orientation is from core State; yaw offsets are 0 (texture-only constants in `sceneLayout.ts`).
3. Same test file: radius ratio equals 1737.4/6371 and True/Readable distance ratio is 10 with identical direction; EQJ→render (x,z,-y) handedness test. Browser: both modes framed, Moon-focus and Earth-focus usable in each.
4. `orbitPath.ts` samples `MoonTrajectory.stateAt` over one sidereal month, odd count so the selected time is a sample, open (end gap >1000 km), mapped by the same policy; refresh tests for seek, drift and playback cadence. Browser: line visible, open gap seen in screenshot, no ring.
5. Earth pole/lon0/east axes and Moon near-side axis (<0.01° off Earth direction on 5 dates 2020–2031) tested in the rendered world frame. Visual: India/Asia unmirrored with terminator at 2026-04-01 12:00 UTC; near-side maria with Tycho south at full Moon; no libration.
6. Camera-only drag, wheel/pinch zoom and Earth/Moon focus in `CameraController.tsx`; browser run at 1 day/s playing: Moon-focus stayed centred after drag while time advanced (2026-10-06T21:36Z → 2026-10-10T03:36Z), no page errors.
7. Donor comparison: Earth/Moon colour and Earth rim atmosphere visually consistent with donor parameters (not a pixel-for-pixel comparison against a donor render; the donor app was not run). Screenshots were reviewed in session, not archived.
8. `floatingOrigin.ts` Float64 subtraction; tests: distances and projections invariant across three origins for common offset 0 and ~1 AU, close Moon focus, Float32 comparison showing naive absolute narrowing loses >1e-4, rebase threshold. Browser: focus tracking Moon during playback (rebase at 1 Earth radius) showed no visible jump in screenshots; continuous visual jump was only checked via sampled frames, not video.
9. Sun directions from core (`directionFromCenterToSun`, `directionToSun`) drive one directional light per body via layered render passes. Tests: render conversion, Moon-vs-Earth parallax, subsolar point vs independent NOAA-style formula at 2026-04-01 12:00 UTC (<0.5° lon, <0.2° lat), illuminated fraction at USNO new/first/full/last quarter (2026-04-17 11:52, 04-24 02:32, 04-02 02:12, 04-10 04:51 UTC; fetched from aa.usno.navy.mil 2026-10-06) within 0.03. Browser: full, first-quarter and new Moon viewed from the Earth side match expected phases.

Files read: Context Files listed in the Task (donor files: CompanionMoon, AtmosphereGlow, usePlanetTexture, CameraController, OrbitalTrail, EarthCompanions, OrbitingMoon via one batched read, entities earth/moon, textures README, MoonScene, MoonMesh; core src files; package/config). Logged extra reads: `/home/user/code/planetary-explorer/src/features/moon/useGestures.ts` (gesture sensitivities; licence/gesture dependency named in the plan), `/home/user/code/planetary-explorer/package.json` (dependency versions), `/home/user/code/planetary-explorer/node_modules/playwright` (browser tooling only), `AGENTS.md`-routed skill file, `.savepoint/objectives/.../Objective.md`.
Files changed: `package.json`, `package-lock.json`, `tsconfig.json` (jsx), `index.html`, `src/main.ts` removed → `src/main.tsx`, `src/app/{App,EarthMoonScene,BodyMesh,AtmosphereGlow,CameraController,useBodyTexture}.ts(x)`, `src/app/{renderCoordinates,floatingOrigin,orbitPath,sceneLayout}.ts`, `src/app/style.css`, `src/app/assets/textures/*.jpg`, `tests/sceneTransforms.test.ts`, `docs/DONOR_PROVENANCE.md`.

Limitations: browser runs used headless Chromium with SwiftShader (software GL), so frame rate and GPU precision were not representative; Earth and Moon texture provenance unresolved; `vite.config.ts` untouched (no React plugin; Vite 8's built-in JSX transform used because `@vitejs/plugin-react@4` does not support Vite 8); one directional light per body is achieved with separate render passes sharing a depth buffer; the Moon-focus start view is placed on the Earth side. Owner validation (User Check) is pending. No owner Task-check waiver has been supplied.

## Drift Notes

Record implementation deltas and reconcile Design before the independent Full Objective Check. Return REPLAN REQUIRED for a material design gap.

Implementation deltas: added `src/app/sceneLayout.ts` (testable placement/orientation of the hierarchy) beyond the planned output list; replaced `src/main.ts` with `src/main.tsx`; dependencies react 18, react-dom 18, three 0.169, @react-three/fiber 8 and their types added. Design.md is not yet reconciled with these deltas.
