---
id: T-044
title: Mount a composition of bodies with its centre as a setting
objective: O-014
status: planned
depends_on: [{task: T-043, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o014-plan-2026-10-11}
lane: scene
planned_reads: [src/app/EarthMoonScene.tsx, src/app/App.tsx, src/app/experienceDefinition.ts, src/app/sceneLayout.ts, src/app/PointsView.ts, src/app/SunCentredView.ts, src/app/TrackedBodyView.ts, src/app/mission.ts, src/app/CameraController.tsx, src/app/BodyView.ts, src/core/stateResolver.ts, src/core/moonTrajectory.ts, src/assets/catalogue.ts, src/synthetic/syntheticRingDefinition.ts, tests/metricVisuals.test.ts, tests/experienceDefinition.test.ts, tests/experiencePlugIn.test.ts, tests/syntheticRing.test.ts, tests/missionScene.test.ts, tools/validate/browser-synthetic-belt.mjs]
planned_writes: [src/assets/compositions.ts, src/app/AstraeusScene.tsx, src/app/App.tsx, src/app/experienceDefinition.ts, src/app/sceneLayout.ts, src/app/PointsView.ts, src/app/SunCentredView.ts, src/app/TrackedBodyView.ts, src/app/mission.ts, src/core/moonTrajectory.ts, src/synthetic/syntheticRingDefinition.ts, tests/metricVisuals.test.ts, tests/experienceDefinition.test.ts, tests/experiencePlugIn.test.ts, tests/syntheticRing.test.ts, tests/missionScene.test.ts, tests/compositions.test.ts, tools/validate/browser-synthetic-belt.mjs]
---

# Mount a composition of bodies with its centre as a setting

## Outcome

The scene, renamed `AstraeusScene`, mounts the bodies of a `SystemComposition` with one `BodyView` each and treats the experience's `sceneCenter` as its zero. Overview, focus limits, default distances and labels come from the composition and the body definitions instead of literal Earth and Moon. Every view that placed Sun-centred data by calling the Sun's position itself (`PointsView`, `SunCentredView`, `trackedAbsolute`) takes offsets from the resolver. The Moon's self-recentring Sun branch is removed, its three test callers moved to the resolver. The `sceneLayers: "earth-moon"` shorthand still works as an alias for the Earth–Moon composition, so Apollo and the fixtures are untouched and render pixel-identically; the made-up belt mounts the Sun–Earth composition with `sceneCenter: "sun"`.

## Astraeus Hypothesis

- **Capability tested:** that one scene can present any composition about any catalogued centre, through the resolver, the existing scale policy, render axes and floating origin, with State unaffected by the choice.
- **Contract reused:** `StateResolver`, `BodyView`, `FloatingOrigin`, `eqjToRenderVector`, the orbit camera, `SceneLabelLayer`, `PointsView`, `TrackedBodyView`, `PathView`.
- **Gap:** design A.3 rows 6–12: the scene is Earth-centred by construction and the Moon is mandatory with Earth.
- **Generic change:** `SystemComposition`, `ExperienceDefinition.composition` and `sceneCenter` (design C.5–C.6), the generalised scene, resolver offsets in the views (B.3), removal of the Moon's Sun branch (C.2).
- **Evidence independent of any experience:** a made-up composition of three fake bodies about a non-Earth centre renders, focuses and labels each; the invariance tests of E step 3 on fake and real bodies.

## User Check

Open Apollo at the six telemetry times, True and Readable, desktop and phone: nothing changed, including the overview framing, the Moon-focus start side, labels and the Moon path. Open the belt: the Sun is at the centre, Earth moves on its path, the belt and the made-up path sit where they did.

## Done When

1. `src/assets/compositions.ts` exports `earthMoonSystem` (Earth, Moon, default centre Earth) and `sunEarthSystem` (Sun, Earth, default centre Sun); a composition is ids only and `createComposition` rejects an id the catalogue lacks or a centre not in the list.
2. `ExperienceDefinition.composition` and optional `sceneCenter`; `sceneLayers: "earth-moon"` maps to `earthMoonSystem` (alias kept for this Task, retired in the experiences Task); `usesEarthMoon` and friends keep their results for every existing definition (test naming Apollo, synthetic, bare, ring, belt).
3. `AstraeusScene` (renamed from `EarthMoonScene`, one commit with no behaviour change, then the generalisation): N `BodyView`s from the composition; overview targets `sceneCenter`; `focusLimits`, `defaultDistance` and `focusRadius` read body radii and the composition's span, with Apollo's numbers reproduced exactly (test).
4. `trackedAbsolute`, `PointsView` and `PathView` place through `resolver.offsetKm(from, sceneCenter, t)`; the Moon path in the Earth–Moon composition is unchanged (same samples, same vertices).
5. `MoonTrajectory.stateAt(t, "sun")` removed; the three `tests/metricVisuals.test.ts` cases use the resolver; the equality test from the core Task now guards the removal.
6. Invariance tests (design E step 3): (i) `stateOf(b, t, c)` byte-identical for every `c` whatever `sceneCenter`, overrides, scale or camera; (ii) round trips within 1e-6 km and the exact Sun negation; (iii) two experiences with separately created resolvers give identical bytes.
7. The made-up three-body composition about a non-Earth centre mounts in a test render (positions, focus targets, label anchors); the belt declares `composition: sunEarthSystem, sceneCenter: "sun"` and `browser-synthetic-belt.mjs` asserts the Sun at the origin and Earth on its path at two dates, each prior scenario kept and mapped.
8. Gates pass; every browser script passes in a fresh run directory; Apollo pixel-identical at the six telemetry times by the owner's look, recorded separately.

## Context Files

`docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md` (B.3, C.2, C.5, C.6, E step 3, Decision 3), `src/app/EarthMoonScene.tsx`, `src/app/App.tsx`, `src/app/experienceDefinition.ts`, `src/app/sceneLayout.ts`, `src/app/PointsView.ts`, `src/app/SunCentredView.ts`, `src/app/TrackedBodyView.ts`, `src/app/mission.ts`, `src/app/CameraController.tsx`, `src/app/BodyView.ts`, `src/core/stateResolver.ts`, `src/core/moonTrajectory.ts`, `src/assets/catalogue.ts`, `src/synthetic/syntheticRingDefinition.ts`, `tests/metricVisuals.test.ts`, `tests/experienceDefinition.test.ts`, `tests/experiencePlugIn.test.ts`, `tests/syntheticRing.test.ts`, `tests/missionScene.test.ts`, `tools/validate/browser-synthetic-belt.mjs`.

## Design References

Design: Experience plug-in boundary; Groups and the `points` layer (centre composition in `PointsView`); drift notes on camera limits and the Earth-centred scene. Design document B.3, C.5, C.6, E step 3, Gates A and B.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-07, STYLE-10.

## Implementation Plan

1. Confirm the catalogue, `BodyView` and resolver landed; REPLAN REQUIRED if not.
2. Rename `EarthMoonScene` to `AstraeusScene` in a behaviour-free commit (file, component, test ids, browser scripts).
3. Add compositions and the definition fields with the alias.
4. Generalise the scene: body views from the composition, scene centre from the definition, focus and limit helpers from definitions, label positions from views.
5. Route the three view offsets through the resolver; remove the Moon's Sun branch and retarget its tests.
6. Invariance tests, the made-up composition test, the belt update; gates, browser scripts, owner look.

## Boundaries

No path-kind change (next Task); no scale policy change; no experience moves; the alias stays; no planet. A precision or depth problem at AU scale is measured in the next Task, not patched here.

## Technical Verification

Focused tests during iteration; handoff runs the gates and every browser script (scene-affecting fuller gate). Evaluated later under `agent-skills/references/check-method.md`.

**Mandatory Task Check (owner decision, 2026-10-11).** An independent `savepoint-check` session must run a Task Check on this Task when it reaches `stage: audit`, before T-045 or T-048 starts. The owner has declined a Task-check waiver for this Task in advance: the executor must not record a `check_waiver`, and the dependants' `requires: clear` is satisfied only by a `CLEAR` Check record. Reason: this Task generalises the scene and removes the Moon's own recentring; it is where an Earth-centred assumption would most easily survive unnoticed.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; the integration Task reconciles them into Design.
