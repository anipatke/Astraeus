---
id: T-103
title: Draw the tagged places on the four mapped moons
objective: O-025
status: done
depends_on: [{task: T-098, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
check_waiver:
    task: T-103
    reason: "Owner waived the optional Task Check for O-025 ('Skip, one check at the end'); the Full Objective Check covers it."
    actor:
        role: owner
        session: o025-run-20261019
    recorded_at: "2026-10-19T00:00:00Z"
---

# Draw the tagged places on the four mapped moons

## Outcome

Io, Europa, Ganymede and Callisto show the tagged places the owner verified in Planetary Explorer: markers at their exact latitude and longitude, named on hover or tap, with each place's description and details on tap.

## User Check

Fly to Io: its volcanoes and other tagged places sit where they did in Planetary Explorer; tap one to read it. Same on Europa, Ganymede and Callisto.

## Done When

1. O-025 Decision 1 (owner: the verified coordinates and tagged places are carried bit for bit, never "corrected"); T-098 Drift Note 2 (Astraeus draws no body-package features yet).
2. A generic feature-marker layer draws a body package's `features.json` on its body, placed with the package's recorded coordinate convention (`map.json` `coordinates`, the donor's `latLonToXYZ`), lifted from Planetary Explorer's marker look as-is (owner rule: name any deviation); markers hide on the far side and when too small to read.
3. Tap or hover shows the place's name; a tap opens its description, details and sources in the information panel.
4. Positions proven: a test places every feature of the four packages and compares with the donor's own formula on the same inputs (bit-for-bit inputs, `tests/bodyPackages.test.ts` stays green); the owner looks at known places (for example Io's Loki Patera, Ganymede's Galileo Regio), including Ganymede's 180° texture turn from T-098.
5. Generic (no moon names in engine or shell, ARCH-01), so the post-launch planets reuse it; performance on a phone measured.
6. Browser checks through the shared driver (scene readouts, no screenshots); lite and the Jupiter script pass.

## Context Files

`data/bodies/README.md`, `data/bodies/io/features.json`, `data/bodies/io/map.json`, `tools/import/planetary-explorer-conventions.json`, `src/app/bodyDraw.ts`, `src/app/StoryMarkers.ts`, `/home/user/code/planetary-explorer/src/features/hotspots/usePlanetContent.ts`, `tests/bodyPackages.test.ts`, `tools/validate/driver.mjs`, `tools/validate/browser-jupiter-io.mjs`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/Objective.md`.

## Design References

O-025 Decisions 1 and 8; O-018 T-077 body packages.

## Guardrails

ARCH-01, PROV-01, TEST-01, TEST-03.

## Implementation Plan

1. Feature-marker layer from the package convention; positions test.
2. Names, info panel, checks, owner look.
- Owner, 2026-10-18: Ganymede's texture stays turned 180 degrees (T-098, `GANYMEDE_VISUAL` yaw pi, from the I-032 trace); the tagged locations will be redone here, so place Ganymede's features against the turned picture and confirm Tros (about 11 N, 27 W) and Osiris (about 38 S, 166.5 W) land on their craters.

## Boundaries

The four mapped moons' features; other bodies' features are post-launch (O-018).

## Technical Verification

Configured gates, positions test, lite, Jupiter script. Evaluated under `agent-skills/references/check-method.md`.

## Evidence (executor, 2026-10-19; Task Check waived by owner, recorded in `check_waiver`)

Built: `src/app/FeatureMarkers.ts` (donor `latLonToXYZ`, `isFeatureVisible`, tolerance -0.02, 1.02 radius and marker look ported verbatim; DOM marker layer), `src/shell/bodyFeatures.ts` (generic feature-set types and info), `AstraeusScene.tsx`/`App.tsx`/`AstraeusShell.tsx`/`infoModel.ts`/`experience.ts` wiring (`controls.featureMarkers`, feature info target), `style.css`, the four packages wired in `src/experiences/jupiter-io/jupiterIo.ts` (the only place naming moons, ARCH-01), `tests/featureMarkers.test.ts`, driver and `browser-jupiter-io.mjs` extensions, `docs/BROWSER_CHECKS.md`.

Criteria: (2) generic layer, markers parented to the body's own frame so they turn with orientation and the picture turn; hidden on the far side (donor rule), when the sphere is swapped for a dot, and when narrower than 60 px (`?featurepx=`). (3) hover or focus name (CSS label, `aria-label`), press opens the information panel with description, details and provenance. (4) `tests/featureMarkers.test.ts`: all 78 features carried bit for bit and placed identically to the donor formula at three radii; donor-function comparison when the donor is present; u=(lon+180)/360, v=(lat+90)/180 equals SphereGeometry's own uv. Ganymede: the markers are children of the yawed frame (GANYMEDE_VISUAL yaw pi), so they stay on the picture exactly as in the donor; the texture pixel at Tros (11.14 N, 27.26 W) and Osiris (38.5 S, 166.5 W) was cut from `ganymede-2k.jpg` with ImageMagick and each lands on a bright ray crater centre (offline image check, not a browser screenshot, nothing saved in the repo). (5) no moon names in engine or shell; phone performance not measured: deferred to the Objective check (owner, 2026-10-19). (6) browser checks written, not run: deferred to the Full Objective Check (owner, 2026-10-19).

Collisions (owner rule 2026-10-19, no new floating element): the shell owns the screen areas of the info panel (`.info-panel`, phone bottom sheet), moons sheet and button, timeline and its drawer, top bar, story panel, controls drawer and handles. The marker layer re-measures those areas five times a second and hides any marker whose point, plus a 5 px margin, falls inside one, so a marker is never drawn under or tappable through a panel. Markers sit at z-index 2, below every panel (3 to 8). The place's information reuses `InfoPanel` (phone bottom sheet pattern). Marker tap target 44 px (hit area), name label flips inward near the left, right and top edges and is capped at 60 vw. Checked by `featureCollisions`, `featureNameFits`, `featureTapTarget` at 1280x800, 390x844, 375x667, 1280x720 (not run). T-099's own overlap not touched.

Deviations from the donor: (a) DOM layer instead of drei `Html` (same look, one layer for all markers); (b) hover name label and 44 px hit area added; (c) markers hidden under shell panels and when the body is under 60 px wide (the donor moon fills the screen); (d) selected state is `aria-pressed` styling with the same 14 px filled look; (e) the donor's `isFeatureVisible` radius is the drawn radius. Limitation: a marker on a moon hidden behind Jupiter is not depth-occluded (DOM overlay).

Gates (2026-10-19, `date -u` 11:06Z): `npm run typecheck` pass; `npm run build` pass; `npm test` 76 files, 1112 passed, 1 skipped; `git diff --check` clean. Extra reads: donor `HotspotMarker.tsx`, `hotspot.ts`, `mathUtils.ts`; `sceneLayout.ts`, `BodyView.tsx`, `AstraeusShell.tsx`, `App.tsx`, `style.css` (to wire the layer and avoid panel areas).

