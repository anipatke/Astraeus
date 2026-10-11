---
id: T-047
title: Assemble the three experiences from the shared assets
objective: O-014
status: planned
depends_on: [{task: T-045, requires: clear}, {task: T-046, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o014-plan-2026-10-11}
lane: experiences
planned_reads: [src/main.tsx, src/app/App.tsx, src/app/experienceDefinition.ts, src/app/metricReadouts.ts, src/app/MissionPanel.tsx, src/app/DebugControls.tsx, src/mission/apollo11.ts, src/mission/apollo11Definition.tsx, src/showers/showerDefinition.ts, src/showers/showerSettings.ts, src/synthetic/syntheticDefinition.ts, src/synthetic/syntheticRingDefinition.ts, src/assets/catalogue.ts, src/assets/compositions.ts, vite.config.ts, tests/experienceDefinition.test.ts, tests/experiencePlugIn.test.ts, tests/showers.test.ts, tests/missionScene.test.ts, tools/validate/browser-showers.mjs, tools/validate/browser-spike02.mjs, docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md]
planned_writes: [src/main.tsx, src/app/App.tsx, src/app/experienceDefinition.ts, src/app/metricReadouts.ts, src/assets/bodyMetrics.ts, src/experiences/earth-moon/earthMoonExplorer.ts, src/experiences/apollo11/apollo11.ts, src/experiences/apollo11/apollo11Definition.tsx, src/experiences/apollo11/MissionPanel.tsx, src/experiences/apollo11/DebugControls.tsx, src/experiences/apollo11/apolloMetrics.ts, src/experiences/showers/showerDefinition.ts, src/experiences/showers/showerSettings.ts, vite.config.ts, tools/validate/public-build-assets.mjs, tools/validate/browser-earth-moon.mjs, tools/validate/browser-showers.mjs, tools/validate/browser-spike02.mjs, tools/validate/browser-spike03.mjs, tools/validate/browser-shell.mjs, tools/validate/browser-anchor-labels.mjs, tests/experienceDefinition.test.ts, tests/experiencePlugIn.test.ts, tests/showers.test.ts, tests/missionScene.test.ts, tests/metricVisuals.test.ts]
---

# Assemble the three experiences from the shared assets

## Outcome

Three experiences run from the same catalogue with no body definitions of their own: a new Earth–Moon Explorer (Earth, Moon, real motion, textures, timeline and camera, nothing else), Apollo 11 rewired to the Earth–Moon composition with its behaviour and browser evidence unchanged, and the Perseids shower rewired to the Sun–Earth composition with the Sun drawn, Earth on its orbit and no Moon (Sun, Earth, Earth's path, the parent orbit and the stream; the planets' paths wait for the planets Task). The Apollo and shower code moves under `src/experiences/`, the `earth-moon` alias is retired, scale choices and per-body enlargement are declared by each experience, the metrics factory is split into body metrics and Apollo metrics, and a public build is shown to contain no local-only texture bytes.

## Astraeus Hypothesis

- **Capability tested:** Gate B and the first half of Gate C: that an experience adds only data and configuration (design D.4), and that an Earth-centred and a Sun-centred experience are both consumers of the same assets.
- **Contract reused:** `ExperienceDefinition`, `ExperienceConfig`, the shell, `TrackedBody`, groups, windows, `createOrbitGroup`, `createTwoBodyTrajectory`, the compositions, the solar-system policy.
- **Gap:** experiences still carry Earth and Moon shell items and Apollo-flavoured metrics; the shower builder sits in the Earth–Moon scene (O-011 Re-plan).
- **Generic change:** `ExperienceDefinition.scaleChoices` and `visualOverrides` (design C.6); `catalogueItem(id)` for shell items from the catalogue's definition and accuracy record; the public build alias and validator (C.3). Folder moves per Decision 3, each as a behaviour-free commit.
- **Evidence independent of any experience:** the plug-in contract tests on the synthetic fixtures; the name check over `src/assets/` (bodies allowed, experiences never); a fake local-only texture in the public-build validator test.

## User Check

Open the Earth–Moon Explorer: Earth and Moon move, the Moon's path is drawn, the timeline and presets work, no mission content. Open Apollo at the six telemetry times: nothing changed. Open Perseids (`?experience=shower-perseids`): the Sun is at the centre, Earth moves on its path, no Moon, the stream loops the Sun; switch to the solar-system scale and Earth becomes visible with its factor stated in its info panel; follow Earth through the activity window. Desktop and phone.

## Done When

1. `src/experiences/earth-moon/` defines the Explorer with `composition: earthMoonSystem`, catalogue items, presets (overview, focus Earth, focus Moon, follow Moon) and body metrics (distance, phase, coordinates); `?experience=earth-moon` mounts it; `tools/validate/browser-earth-moon.mjs` passes at both sizes.
2. Apollo moves to `src/experiences/apollo11/` with `MissionPanel`, `DebugControls` and its metrics; it declares `composition: earthMoonSystem` and `scaleChoices: ["true-scale", "readable-scale"]`; `browser-spike02.mjs`, `browser-spike03.mjs`, `browser-shell.mjs` and `browser-anchor-labels.mjs` pass with only path updates.
3. The shower builder moves to `src/experiences/showers/`, declares `composition: sunEarthSystem`, `sceneCenter: "sun"`, catalogue items for Sun and Earth (no Moon), `scaleChoices: ["true-scale", "solar-system"]` with Earth's factor, Earth's orbit path and the parent's orbit path as `orbit` paths, the stream as today; `browser-showers.mjs` asserts the Sun at the origin, no Moon item, Earth on its path at start and peak, the solar-system scale showing Earth, each prior scenario kept and mapped. Geminids is untouched (still a settings file).
4. The `earth-moon` alias is removed; every definition names a composition; `ExperienceRuntime` carries `resolver` and `catalogue`, not `moon`; the metrics factory is split so a Moon-free experience never reads the Moon (closes the Design gap noted under T-026).
5. Name check: no mission, shower or dataset name in `src/core/`, `src/assets/`, `src/shell/` or generic `src/app/`; body names are allowed only in `src/core/bodies/` and `src/assets/bodies/`.
6. Public build: `ASTRAEUS_PUBLIC_BUILD=1 npm run build` substitutes the two local-only textures at the import; `tools/validate/public-build-assets.mjs` hashes `dist/` and fails on a match with any local-only source; a test proves it fails on a fake unlicensed texture; the normal build is unchanged.
7. Gates pass; every browser script passes in fresh run directories at 1280×800 and 390×844; the owner's look at all three is recorded separately.

## Context Files

`docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md` (C.3 texture rights, C.6, D.1–D.4, E step 5, Decisions 3, 5, 7), `src/main.tsx`, `src/app/App.tsx`, `src/app/experienceDefinition.ts`, `src/app/metricReadouts.ts`, `src/app/MissionPanel.tsx`, `src/app/DebugControls.tsx`, `src/mission/apollo11.ts`, `src/mission/apollo11Definition.tsx`, `src/showers/showerDefinition.ts`, `src/showers/showerSettings.ts`, `src/synthetic/syntheticDefinition.ts`, `src/synthetic/syntheticRingDefinition.ts`, `src/assets/catalogue.ts`, `src/assets/compositions.ts`, `vite.config.ts`, `tests/experienceDefinition.test.ts`, `tests/experiencePlugIn.test.ts`, `tests/showers.test.ts`, `tests/missionScene.test.ts`, `tools/validate/browser-showers.mjs`, `tools/validate/browser-spike02.mjs`.

## Design References

Design: Experience plug-in boundary; deferred notes on `createObjectMetrics` and selecting an experience; Current Technical State (browser validation split). Design document D, E step 5, Gates B and C, O-011 Re-plan item 4.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, PROV-01, PROV-02, TEST-01, TEST-03, STYLE-01, STYLE-07, STYLE-09, STYLE-10.

## Implementation Plan

1. Confirm compositions, path kinds and the solar-system policy landed; REPLAN REQUIRED if not.
2. Move `src/mission/` and `src/showers/` under `src/experiences/` in behaviour-free commits; update scripts and tests.
3. Add `scaleChoices` and `visualOverrides` to the definition; wire them in `App`; retire the alias.
4. Split the metrics factory; write `catalogueItem`.
5. Write the Explorer; rewire Apollo; rewire the shower builder to Sun–Earth.
6. Public build alias and validator; the new browser script; gates, all scripts, owner look.

## Boundaries

No planets or planet paths (the planets Task adds them to Perseids). No stream data decision, no Geminids change (O-011). No Moon texture swap. No star field.

## Technical Verification

Focused tests during iteration; handoff runs the gates, the public build and every browser script (scene-affecting fuller gate). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; the integration Task reconciles them into Design.
