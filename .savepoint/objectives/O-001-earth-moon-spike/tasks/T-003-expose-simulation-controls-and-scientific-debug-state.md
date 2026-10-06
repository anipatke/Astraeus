---
id: T-003
title: Expose simulation controls and scientific debug state
objective: O-001
status: done
depends_on: [{task: T-002, requires: clear}]
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: astraeus-spike-01-planning-2026-10-05}
check_waiver:
    task: T-003
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-05T21:02:51Z"
---

# Expose simulation controls and scientific debug state

## Outcome

The spike allows direct exploration of time and visual scale, with an optional overlay proving physical state and rendered geometry remain separate.

## User Check

Seek forward/backward while paused and playing, change speed, switch TrueScale/ReadableScale, scrub the shown window, and inspect physical versus rendered distances while rotating and focusing the scene.

## Done When

1. Minimal accessible play/pause controls, explicit UTC date/time input/display and bounded scrub window use the existing Clock. Invalid input shows a clear error without corrupting time; seeking keeps playback behaviour explicit.
2. Speeds are 1×, 1 hour/sec, 1 day/sec and 7 days/sec, mapped to rates 1/3600/86400/604800. Rate changes do not change the state for a requested timestamp or introduce time discontinuity.
3. TrueScale/ReadableScale toggle changes only rendering policy. Scientific state including orientation, physical Sun direction, physical distance, orbital phase and time are unchanged; both body radius mappings remain identical.
4. Optional overlay displays timestamp, Earth–Moon distance in km, rendered distance in scene units, policy, Moon position with frame/center/units, speed, scientific Earth/Moon orientation, physical Sun direction, approximate geometric illuminated fraction, and scaled origin versus local render coordinates. Keep the overlay optional; values are diagnostic rather than an extra animation. Values come from the same state and mapping used by the scene.
5. Tests and browser evidence cover controls, pause/seek/rate/scale interactions, path refresh, moving focus and continued playback during drag/zoom. Configured gates pass.

## Context Files

Predecessor outputs: `src/core/clock.ts`, `src/core/body.ts`, `src/core/state.ts`, `src/core/moonTrajectory.ts`, `src/core/scalePolicy.ts`, `src/core/referenceCenters.ts`, `src/core/bodyOrientation.ts`, `src/core/illumination.ts`, `src/app/floatingOrigin.ts`, `src/app/App.tsx`, `src/app/EarthMoonScene.tsx`, `src/app/CameraController.tsx`, `src/app/renderCoordinates.ts`, `src/app/orbitPath.ts`, `src/app/style.css`, `tests/core.test.ts`, `tests/sceneTransforms.test.ts`, `package.json`, `vite.config.ts`, `.savepoint/config.yml`, `.savepoint/Design.md`.

Planned new outputs: `src/app/DebugControls.tsx`, `src/app/DebugOverlay.tsx`, `tests/controls.test.ts`. Add a browser test configuration only if necessary for meaningful verification, recording exact added paths and why.

## Design References

Owning Objective: Confirmed core contracts, Astronomy choice and accuracy, Scene integration, Verification and handoff, and Discovered risks. Planned changes remain in the Objective until implementation is reconciled into Design.

## Guardrails

SEC-01, TEST-01, TEST-02, TEST-03, TEST-04 and STYLE-01 through STYLE-10. Existing scaffold rules outside this work do not introduce authentication or unrelated infrastructure requirements.

## Implementation Plan

1. Expose one application-owned clock/state snapshot to scene and debug controls without duplicating orbital calculation rules.
2. Add play/pause, validated UTC seeking, bounded scrub and named speed choices.
3. Add policy toggle and optional overlay with explicit scientific/render units.
4. Verify paused/playing seeks, rate continuity and scale invariance through tests and browser scenarios.
5. Run configured gates and record evidence.

## Boundaries

Debug UI only; no final Astraeus UI system, storytelling controls, speculative global store or framework hooks package.

## Technical Verification

Configured build/typecheck/test gates, meaningful input/interaction tests and browser scenarios. Verify displayed distance equals the scene mapping and physical values remain identical at the same timestamp across policies.

## Technical Evidence

Gates run at handoff (2026-10-06): `npm run typecheck` (clean), `npm run build` (built; chunk-size warning only), `npm test` (4 files, 58 tests passed; 25 new in `tests/controls.test.ts`). Lint is not configured.

Per criterion:
1. Controls: `DebugControls.tsx` drives the existing `SimulationClock` (play/pause, UTC text seek, ±30-day scrub slider, step 1 min). `parseUtcInput` is strict (rejects Feb 30, hour 24, out-of-1900–2100 range); tests confirm an invalid entry never reaches the clock. Browser: invalid input showed an alert and left time unchanged; seek while paused stayed paused; seek while playing kept playing from the target; keyboard scrub moved time; window re-centres on typed seek or when playback leaves it.
2. Speeds 1/3600/86400/604800 (labels 1×, 1 hour/sec, 1 day/sec, 7 days/sec). Tests: `setRate` across all speeds leaves `now()` and trajectory state unchanged; pause/resume and rate change are continuous (fake monotonic clock).
3. Scale toggle: test compares readouts for both policies at one timestamp — all scientific fields (time, Moon position, orientations, Sun directions, illuminated fraction, scaled origin) identical; Moon/Earth radius mapping identical in both policies. Browser: paused policy switch changed only policy, rendered distance (59.67→5.97), origin and local coordinates.
4. Overlay (`DebugOverlay.tsx`, optional toggle): timestamp, km distance, rendered distance, policy, Moon position with frame/centre/units, speed, Earth/Moon quaternions, Earth and Moon-to-Sun directions, geometric lit fraction, scaled origin and Earth/Moon local coordinates. `EarthMoonScene` builds it via `buildDebugReadout` from the same state, `bodyAbsolutes` mapping and `FloatingOrigin` it places bodies with; test checks rendered distance equals `policy.mapPosition` norm.
5. Tests above plus path-refresh tests (seek outside sampled window forces rebuild; drift threshold). Browser (headless Chromium via playwright-core, SwiftShader, scratchpad install outside the project): play/pause/seek/rate/scale sequence, Moon focus while playing at 7 days/sec, drag + wheel zoom with time still advancing, screenshots true/readable reviewed.

Files read: all Context Files listed except `tests/core.test.ts`, `src/app/CameraController.tsx`, `src/app/renderCoordinates.ts`, `.savepoint/Design.md` (not needed). Extra reads: `tsconfig.json`, `src/main.tsx`, `src/core/astronomyAdapter.ts` (jsx/entry and ephemeris range for validation bounds).
Files changed: `src/app/App.tsx`, `src/app/EarthMoonScene.tsx` (SceneReadout is now `DebugReadout`), `src/app/style.css`. New: `src/app/DebugControls.tsx`, `src/app/DebugOverlay.tsx`, `tests/controls.test.ts`. No browser test config added.

Limitations: no automated DOM/browser test in the repo (node-only vitest); browser checks were a manual scripted run and are not reproducible from the repo. Continuous visual smoothness during drag/zoom was observed only through sampled time readouts and screenshots. One 404 console message in the browser run (not investigated; likely favicon). 1900–2100 seek bounds are a chosen limit, not a proven ephemeris accuracy range. Note: App replaces the earlier "1 min/s" speed and renamed scale buttons to TrueScale/ReadableScale.

## Drift Notes

Record implementation deltas and reconcile Design before the independent Full Objective Check. Return REPLAN REQUIRED for a material design gap.
