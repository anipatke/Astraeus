---
id: T-053
title: Put the real stars and the Milky Way behind every experience
objective: O-011
status: planned
depends_on: [{task: T-051, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o011-replan-i025-2026-10-13}
lane: sky
planned_reads: [src/app/AstraeusScene.tsx, src/app/renderCoordinates.ts, src/app/floatingOrigin.ts, src/app/CameraController.tsx, src/assets/licence.ts, src/app/experienceDefinition.ts, vite.config.ts, tools/validate/public-build-assets.mjs, docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md]
planned_writes: [src/assets/sky.ts, tools/data/fetch-stars.mjs, .gitignore, src/assets/textures/milky-way.jpg, src/app/SkyView.ts, src/app/AstraeusScene.tsx, src/app/experienceDefinition.ts, tests/sky.test.ts, tools/validate/browser-sky.mjs, docs/DONOR_PROVENANCE.md]
---

# Put the real stars and the Milky Way behind every experience

## Outcome

Every experience draws a starry sky behind the scene: stars from the catalogue chosen in the research record, at their J2000 positions in the EQJ frame, sized and tinted by magnitude and colour index, plus the licensed Milky Way image, rotated into the same frame. The sky sits at infinity. It does not move with the scene centre, the floating origin or the scale policy, and it turns only with the camera. Each experience may dim or hide it; the default is on. The information panel's sky item cites both sources.

## Astraeus Hypothesis

- **Capability tested:** that a background frame layer can be shared by every experience and composition without touching State (ARCH-02) or any experience's code.
- **Contract reused:** render axes (`eqjToRenderVector`), the camera, `TextureRef`/`AssetLicence`, the public-build gate, the shell's item list.
- **Gap:** the scene has a black background; nothing places directions at infinity.
- **Generic change:** `SkyView` (stars as one points object, plus an inside-out sphere for the image), a sky asset record in `src/assets/sky.ts`, and `ExperienceDefinition.sky?: { visible?: boolean; brightness?: number }`.

## User Check

Open Perseids, Earth–Moon Explorer and Apollo. Stars and the Milky Way are behind everything. Rotating the view turns the sky; following Earth or changing scale does not shift it. Recognisable constellations (Orion, the Plough, Perseus) look right. Compare the sky around Perseus with a planetarium or star chart.

## Done When

1. Star directions: for at least five named stars (Sirius, Polaris, Betelgeuse, Vega, Algol), the drawn direction equals the catalogue RA/Dec through `eqjToRenderVector` to 1e-9 rad (independent oracle: the catalogue values).
2. The Milky Way alignment is checked: the galactic north pole and the galactic centre fall at their cited J2000 coordinates within 0.5°.
3. Invariance: changing scene centre, scale policy, floating-origin rebase or follow target changes no star's screen direction for a fixed camera orientation (test); State is untouched.
4. A made-up three-star catalogue mounts in a test first (ARCH-03); the real catalogue subset and image carry licences (PROV-02); the public-build validator passes and proves no `data/local/` content is in the build.
5. Performance: the frame rate with the sky on is recorded for Perseids and Apollo, and each stays at or above the previous figure minus 10% (recorded).
6. `browser-sky.mjs` asserts stars are drawn, the sky is fixed under a centre change, and zero console errors at both sizes; every browser script passes in a fresh run directory; the owner's look recorded separately.

## Context Files

`src/app/AstraeusScene.tsx`, `src/app/renderCoordinates.ts`, `src/app/floatingOrigin.ts`, `src/app/CameraController.tsx`, `src/assets/licence.ts`, `src/assets/catalogue.ts`, `src/app/experienceDefinition.ts`, `vite.config.ts`, `tools/validate/public-build-assets.mjs`, `docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md`.

## Design References

Design: Architecture (asset layer); Interfaces and Data Flow (render axes, floating origin); Guardrails ARCH-02, PROV-02.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, PROV-01, PROV-02, TEST-01, TEST-03, STYLE-05, STYLE-09.

## Implementation Plan

1. Confirm the research record named both sources with licences; REPLAN REQUIRED otherwise.
2. Write a committed fetch tool that downloads the Yale BSC from its source and writes the subset with a provenance header to the git-ignored `data/local/` (owner decision, T-051 replan); nothing from the catalogue is committed. Without the file, the sky draws the Milky Way only and says the stars are not fetched; tests needing real stars skip with a stated reason.
3. Write `SkyView` (camera-relative, no floating-origin offset, drawn first, depth write off).
4. Tests per Done When on a made-up catalogue first, then the real one.
5. Wire the default-on sky into the scene; add `browser-sky.mjs`; run gates, the public build and every browser script.

## Boundaries

No planet or body changes. No sky motion with time beyond the J2000 frame (no precession of the star field), stated as a limitation. No ground view.

## Technical Verification

Focused tests, configured gates, the public-build validator and every browser script in a fresh run directory. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; T-040 reconciles them.
