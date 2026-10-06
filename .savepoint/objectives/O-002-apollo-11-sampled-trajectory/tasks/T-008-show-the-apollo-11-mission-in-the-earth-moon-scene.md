---
id: T-008
title: Show the Apollo 11 mission in the Earth–Moon scene
objective: O-002
status: done
depends_on: [{task: T-007, requires: clear}]
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: astraeus-spike-02-planning-2026-10-06}
check_waiver:
    task: T-008
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-06T01:54:00Z"
---

# Show the Apollo 11 mission in the Earth–Moon scene

## Outcome

The existing Earth–Moon scene shows Columbia and Eagle moving along their reconstructed paths across the mission window, inspectable with generic focus, follow and overview views, accelerated playback and event jumps, under both scale policies.

## User Check

Open the app, jump to the mission and play at 1×, 100×, 1,000× and 10,000×. Jump to each event. Focus Earth, Moon and the spacecraft; follow Columbia from Earth orbit through translunar coast and lunar orbit and back; switch TrueScale/ReadableScale. Confirm no jitter or jumps, anchors visibly distinct from samples, the reconstruction wording visible, and Earth/Moon looking and behaving as in Spike 01.

## Done When

1. Columbia and Eagle States come from SampledTrajectory over the generated data and pass through the existing ScalePolicy → floating origin → render-axis conversion; no Apollo-specific coordinate path exists. Outside a trajectory's bounds its marker and current-position UI are hidden.
2. Spacecraft markers are simple and their visual size is a presentation-only exaggeration independent of State.
3. Travelled and future path segments split at the current time, built from the same samples and policy; anchor markers are distinguishable from reconstructed samples.
4. Generic camera behaviours: focus Earth, focus Moon, focus a chosen trajectory body, follow a chosen body, Earth–Moon overview. No mission naming in camera code.
5. Timeline: existing controls plus a mission-window preset, rates 1×/100×/1,000×/10,000×, and event-jump control from the generic event list. Same T yields identical State however reached.
6. Mission-specific wiring (data import, labels, preset window) lives in one mission module outside scene, camera, scale and floating-origin code. UI text reads "Apollo 11 educational trajectory reconstruction based on NASA postflight trajectory data" and never "exact flight path".
7. Earth orientation, Moon locking, Sun direction, phase and terminators unchanged; all prior tests pass. Floating origin is changed only for a reproducible, recorded problem.
8. Tests cover mission-module wiring (bounds hiding, path split, event jumps) and scale/rebasing independence for spacecraft State. Configured gates pass; browser evidence is recorded for the User Check scenarios.

## Context Files

`src/app/App.tsx`, `src/app/EarthMoonScene.tsx`, `src/app/sceneLayout.ts`, `src/app/orbitPath.ts`, `src/app/floatingOrigin.ts`, `src/app/renderCoordinates.ts`, `src/app/CameraController.tsx`, `src/app/DebugControls.tsx`, `src/app/DebugOverlay.tsx`, `src/core/sampledTrajectory.ts`, `src/core/events.ts`, `src/core/provenance.ts`, `src/core/scalePolicy.ts`, `src/core/clock.ts`, `data/apollo11/generated/columbia.json`, `data/apollo11/generated/eagle.json`, `data/apollo11/generated/events.json`, `tests/sceneTransforms.test.ts`, `tests/controls.test.ts`, `docs/ASTRAEUS_SPIKE_02_BRIEF.md`, `.savepoint/objectives/O-002-apollo-11-sampled-trajectory/Objective.md`.

## Design References

Design: Architecture, Components/Codebase Map, Current Technical State (rendering and rebasing); O-002 Architectural Considerations (rendering).

## Guardrails

TEST-01, TEST-03, STYLE-01, STYLE-05, STYLE-07, STYLE-09.

## Implementation Plan

1. Confirm generated data and SampledTrajectory API; return REPLAN REQUIRED if absent.
2. Add the mission module that builds trajectories, events and labels from data.
3. Generalise scene layout to include trajectory bodies; add marker and split path rendering.
4. Extend camera with generic focus/follow/overview targets.
5. Extend controls with mission preset, rates and event jumps.
6. Browser-validate the floating-origin stress path from brief section 16; fix only reproducible problems.
7. Run tests and gates.

## Boundaries

No spacecraft attitude, detailed models, narration, storytelling DSL or Apollo-specific camera. No runtime propagation or centre switching.

## Technical Verification

Focused tests during iteration; configured gates and recorded browser evidence at handoff per AGENTS.md. Later evaluation follows `agent-skills/references/check-method.md`.

## Technical Evidence

**Per-criterion outcomes**

1. Met. `src/mission/apollo11.ts` builds Columbia/Eagle as `SampledTrajectory` from `data/apollo11/generated/*.json`; `TrackedBodyView` places them via `trackedAbsolute` (stateAt → ScalePolicy.mapPosition → `eqjToRenderVector` → `FloatingOrigin.toLocal`). No Apollo coordinate path. Marker/current-position rows hidden outside bounds (`stateIfInBounds`). Tests: `tests/missionScene.test.ts` "bounds hiding", "maps through the same ScalePolicy and render axes".
2. Met. Marker is a sphere sized by `markerRadiusUnits(cameraDistance)` only; test "sizes the marker from camera distance only, never from State".
3. Met. Travelled/future lines split at `travelledCount`, meeting at the marker, built from the same samples under both policies; anchors are a separate `Points` object (white dots) vs. coloured lines. Tests: "travelled/future path split" (4 cases). Browser: screenshots show dots vs lines.
4. Met. `CameraRequest` = focus | follow | overview over a generic `FocusId` string; Earth, Moon, each tracked body, overview. No mission naming in `CameraController.tsx`/scene.
5. Met. `DebugControls` gets optional `mission`: "Mission window" preset (scrubber spans first→last event), rates merged to 1×/100×/1,000×/3,600/10,000×/86,400/604,800 (existing speeds kept), event select + "Jump to event" from the generic list. Test "yields the same State at T whether reached by seek, jump or 10,000× playback".
6. Met. Data import, labels, notes, rates and window live only in `src/mission/apollo11.ts`; UI text is the required statement; test asserts exact wording and no "exact flight path".
7. Met. Earth/Moon/Sun/phase code untouched; floating origin unchanged (no reproducible problem found); all 94 prior tests pass unmodified.
8. Met (see limitations). 22 new tests; gates below; browser run recorded below.

**Commands run:** `npm run typecheck` (pass), `npm run build` (pass; existing chunk-size warning only), `npm test` (7 files, 116 tests pass; 94 pre-existing + 22 new). Lint: none configured.

**Browser evidence** (Playwright/Chromium headless, SwiftShader WebGL, vite dev server, scratchpad scripts `shots.mjs`, `jitter.mjs`): 0 console errors/warnings. Jumped to EOI, TLI cutoff, MCC-1, LOI-2, landing, TEI, entry interface, splashdown; focus Earth/Moon/Columbia/Eagle, follow both, overview, both scales; played 1×/100×/1,000×/10,000× (clock advanced as expected, e.g. 10,000× ≈ +4.7 h in 1.5 s). Follow-mode marker centroid held within ≈0.1 px of screen centre in steady frames (Eagle 100×, Columbia EOI 1,000×); early frames and one lunar-orbit 1× run varied by a few px (zoom/tween transients and line pixels in the colour mask). Floating-origin stress path (Earth orbit, coast, lunar orbit, return) showed no visible jump; floating origin not modified.

**Files read:** all Context Files listed above except `tests/*` beyond the heads of `controls.test.ts`/`sceneTransforms.test.ts` and the brief sections 13–23. **Extra reads (logged):** `.savepoint/Guardrails.md` rule rows (to confirm guardrail IDs), `tests/apollo11Reconstruction.test.ts` head (import style), `src/app/style.css`, `package.json`, `tsconfig.json`, `vite.config.ts`, `.savepoint/config.yml` (gates), `data/apollo11/generated/validation.json` keys (shape only).

**Files changed:** new `src/app/mission.ts`, `src/app/TrackedBodyView.ts`, `src/app/MissionPanel.tsx`, `src/mission/apollo11.ts`, `tests/missionScene.test.ts`; edited `src/app/App.tsx`, `EarthMoonScene.tsx`, `CameraController.tsx`, `DebugControls.tsx`, `sceneLayout.ts`, `orbitPath.ts`, `style.css`.

**Limitations**
- ReadableScale compresses positions (×0.1) but not body radii, so near Earth/Moon the spacecraft lies inside the bodies' spheres. To keep it visible, spacecraft overlays render in a final pass and only depth-test (occlude) under TrueScale. This is a presentation choice; ScalePolicy was not changed. Owner may want a different treatment.
- Jitter evidence is pixel-centroid in a software-GL headless browser, not a human visual check; owner validation is required (`owner_validation: required`).
- Paths drawn in Earth-centred inertial form loops/zig-zags in lunar orbit (Moon moves under them); this is inherent to the Earth-centred contract.
- "Follow" re-targets without resetting distance/angles; "Focus" resets distance. Focus on the Moon still starts Earth-side as in Spike 01.
- Moon-orientation/landing-site offset (documented in validation) is unchanged and not re-measured here.

## Drift Notes

Record each change as UNCHANGED / GENERIC EXTENSION / MISSION-SPECIFIC for the design note.

- `src/core/*`, Earth/Moon orientation, illumination, `floatingOrigin.ts`, `renderCoordinates.ts`, `scalePolicy.ts`: UNCHANGED.
- `FocusId` widened from `"earth" | "moon"` to string; `CameraRequest` (focus/follow/overview): GENERIC EXTENSION.
- `sceneLayout.trackedAbsolute`, `orbitPath.mapOrbitPath` accepting `Pick<…>`, `TrackedBodyView`, `mission.ts` (TrackedBody/MissionConfig, bounds, path split, event jump, rates), extra render pass for overlays, `DebugControls` optional `mission`: GENERIC EXTENSION.
- `src/mission/apollo11.ts` (data import, labels, notes, rates, window): MISSION-SPECIFIC.
