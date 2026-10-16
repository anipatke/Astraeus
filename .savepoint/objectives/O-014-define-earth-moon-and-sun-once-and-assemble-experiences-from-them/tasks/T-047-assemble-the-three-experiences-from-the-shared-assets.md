---
id: T-047
title: Assemble the three experiences from the shared assets
objective: O-014
status: done
depends_on: [{task: T-045, requires: clear}, {task: T-046, requires: clear}]
owner_validation: {required: true, accepted_check: C-021, accepted_by: {role: owner, session: owner-chat-o014-live-look-20261013}}
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

### Context Log

- Step 2 (folder moves, behaviour-free; committed by the orchestrator as 2d8b2dd "Move mission and shower code under src/experiences (T-047, no behaviour change)"): `git mv src/mission src/experiences/apollo11`; `git mv src/showers src/experiences/showers`. Updated relative imports inside the moved files (extra directory depth), `src/main.tsx` imports, and `src/experiences/...` paths in tests (sunCentred, metricVisuals, experiencePlugIn, compositions, infoProvenance, pointsLayer, showers, timeline, experienceDefinition, paths, missionScene). No change in tools/validate/ or vite.config.ts (no references). `MissionPanel`/`DebugControls` remain in `src/app/` until the later build step.
- Test-guard adjustment: tests/experienceDefinition.test.ts import-guard regex now matches `/experiences/` as well as `/mission/` so the generic-app boundary check stays meaningful after the move (no production behaviour change).
- Gate after moves: `npm run typecheck` clean; `npm test` 25 files / 494 tests passed.



### Per-criterion evidence (executor claims, to be verified by a fresh Check)

Run directory for every browser run: `docs/evidence/o014-t047-20261012-1943/` (fresh; no earlier evidence directory written to). Dev server on port 5199 (stopped afterwards), `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`, run 2026-10-12 about 19:43-20:10 local. Every browser log ends `"errors": []` (zero console and page errors).

1. Explorer. `src/experiences/earth-moon/earthMoonExplorer.ts`: `composition: earthMoonSystem`, `catalogueItem` shell items, presets overview / focus Earth / focus Moon / follow Moon, `bodyMetrics` (distance, phase, position), no events, no developer sections; `?experience=earth-moon` mounts it (`src/main.tsx`). `tools/validate/browser-earth-moon.mjs` passes at 1280x800 and 390x844 (`earth-moon/`, `logs/earth-moon.log`): mounted bodies `earth,moon`, Moon path mounted, object list is Earth and Moon only, no mission text, Moon distance/phase/position change over two weeks, all four presets draw. Unit: `tests/experiences.test.ts` (Explorer block).
2. Apollo. Moved earlier (2d8b2dd); `MissionPanel`, `DebugControls` moved into `src/experiences/apollo11/`; new `apolloMetrics.ts`; definition declares `composition: earthMoonSystem`, `scaleChoices: ["true-scale","readable-scale"]`, `createMetrics: ({resolver}) => apolloMetrics(...)`; Earth and Moon shell items from `catalogueItem` (Apollo's own colours, descriptions and Moon limitation list passed explicitly, so the item text is unchanged). `browser-spike02.mjs`, `browser-spike03.mjs`, `browser-shell.mjs`, `browser-anchor-labels.mjs` pass with NO edits to the scripts (they held no path references to the moved code). Apollo before/after pixel comparison below.
3. Shower. `src/experiences/showers/showerDefinition.ts`: `composition: sunEarthSystem`, `sceneCenter: "sun"`, `scaleChoices: ["true-scale","solar-system"]`, `visualOverrides: {earth: {exaggeration: 400}}` (one constant, `EARTH_EXAGGERATION`, also feeds the sentence in Earth's info), catalogue items for Sun and Earth (no Moon), Earth's path (`createEarthSunTrajectory`, one-year fixed span about the peak, 361 samples) and the parent's orbit (`createTwoBodyTrajectory`, peak +/- 180 days) as `orbit` paths, the stream unchanged; presets keep overview / focus stream / follow stream and add focus Earth / follow Earth. `browser-showers.mjs` keeps every earlier scenario (mapping in the script header) and adds `checkSunEarth`: scene centre `sun`, bodies `sun,earth`, no `moon` option, Earth's blue path and the parent's violet orbit drawn at start and peak, path runs both sides of Earth when focused, solar-system scale grows Earth (bright pixels 36665 -> 56072 on desktop), Earth's info states "400 times larger than life", follow Earth at start, middle and end of the window; passes at both sizes. "Earth on its path" is also proven numerically in `tests/experiences.test.ts` (Earth within 2 Earth radii of the sampled polyline at start and peak). Geminids: there is no Geminids settings file in `data/showers/` (only `perseids.json`), so nothing was touched.
4. Alias and runtime. `"earth-moon"` removed from `SceneLayerId`; `ExperienceRuntime` is `{clock, resolver, catalogue}` (the old `adapter` and `moon` fields are gone); the Moon trajectory the Apollo panels need is `resolverTrajectory(resolver, "moon", "earth")`; metrics split into `src/app/bodyMetrics.ts` (catalogue bodies, kinds distance/phase/coordinates) and `apolloMetrics.ts` plus `createTrackedMetrics` (tracked bodies); `tests/experiences.test.ts` proves a spy resolver never sees `moon` for Perseids. Every shipped and fixture definition names a composition except the bodiless `syntheticBareDefinition` (see Drift Notes).
5. Name check. `tests/experiencePlugIn.test.ts` glob extended to `src/assets/**`; the existing regex (apollo|columbia|eagle|perseid|meteor) passes over core, assets, shell and generic app. Not mechanised: "body names only in `src/core/bodies/` and `src/assets/bodies/`" (see Limitations).
6. Public build. `vite.config.ts`: `ASTRAEUS_PUBLIC_BUILD=1` aliases the two local-only texture modules to a 1x1 white `src/assets/textures/public-placeholder.png` at the import. `ASTRAEUS_PUBLIC_BUILD=1 npm run build -- --outDir <scratch>` then `node tools/validate/public-build-assets.mjs <scratch> docs/evidence/o014-t047-20261012-1943/public-build-assets.json` exits 0 (3 files hashed, 0 matches). The same validator on the normal `dist/` exits 1 (both textures found as identical files), showing it has teeth. `tests/publicBuild.test.ts`: aliases equal the records' local-only declarations, and a fake unlicensed texture is caught as a copied file and as embedded base64 while a clean build passes. Normal build unchanged (still emits both textures). Public bundle smoke: Earth-Moon, Apollo and Perseids load with zero console errors (`logs/public-build-smoke.log`, `public-build-earth-moon.png`).
7. Gates and browser.

Commands run (all exit 0): `npm run typecheck`; `npm run build`; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` (27 files, 524 tests; junit.xml is git-ignored); browser scripts, each with an explicit fresh output argument: `browser-earth-moon`, `browser-showers`, `browser-spike02`, `browser-spike03`, `browser-shell`, `browser-anchor-labels`, `browser-synthetic`, `browser-synthetic-ring`, `browser-synthetic-belt`, `browser-precision`, `capture-apollo-compare` (twice on the old tree, once on the new). Desktop 1280x800 and phone 390x844 are run by `browser-earth-moon`, `browser-showers`, `capture-apollo-compare`; the other scripts keep their own viewport sets. The owner's visual look at all three experiences is NOT recorded here; it is a separate owner action.

Owner validation set (screenshots are git-ignored and stay local). Before = detached worktree at 2d8b2dd (behaviour-free moves, equal to the pre-T-047 behaviour), served on port 5198 and removed afterwards; after = this tree.
- Apollo, six telemetry times (earth-orbit, translunar, lunar-orbit-columbia, lunar-surface-eagle, return, entry), True and Readable, desktop and phone, plus the made-up belt: `docs/evidence/o014-t047-20261012-1943/compare-before/` and `.../compare-after/` (160 PNGs each, full page and `-scene` variants).
- Pixel diff (`tools/validate/diff-screenshots.mjs`, `compare-diff.json`): 160 files compared, 18 byte-identical, largest share of pixels differing by more than 16 levels 0.162 %, largest per-pixel delta 145. Noise floor from running the OLD tree twice (`compare-before-repeat/`, `compare-noise.json`): 2 identical, largest over-16 share 0.676 %, largest delta 240. All differences are inside the software-GL run-to-run noise; 11 files exceed their paired noise value by small margins (at most 0.05 % of pixels over 16 levels, scattered belt and stream dots, not a placed object).
- New Earth-Moon Explorer: `earth-moon/{desktop,phone}-{overview,focus-earth,focus-moon,follow-moon}.png`.
- Perseids: `showers/{desktop,phone}-{start,peak,end}[-focus].png`, `*-zoomed-out.png`, `*-stream-details.png`, `*-window-details.png`, `*-sun-overview-{start,peak}.png`, `*-earth-on-path-{start,peak}.png`, `*-earth-solar-system.png`, `*-follow-earth-end.png`.
- Public-build Earth-Moon (flat colours): `public-build-earth-moon.png`.

### Extra reads (outside the Context Files, with reason)

`src/app/AstraeusScene.tsx`, `BodyView.tsx`, `bodyDraw.ts`, `sceneFraming.ts`, `sceneLayout.ts`, `PathView.ts` (how overrides, radii and the Moon trajectory reach the scene; C-017 obs 1); `src/core/stateResolver.ts`, `body.ts`, `scalePolicy.ts`, `sunCentredSources.ts`, `moonTrajectory.ts`, `illumination.ts`, `twoBodyAdapter.ts`, `core/bodies/*` (resolver and policy contracts); `src/shell/AstraeusShell.tsx`, `ScaleControl.tsx`, `scaleModel.ts`, `experience.ts`, `metrics.ts` (scale choices and metric types); `src/app/MissionPanel.tsx`, `DebugControls.tsx` (moved into Apollo); `src/synthetic/syntheticRingDefinition.ts` (belt Sun and alias users); `src/assets/visual.ts`, `licence.ts`, `bodies/*.ts`, `textures` (texture rights, public build); tests `layerRule`, `textureLicence`, `controls`, `metricVisuals`, `infoProvenance`, `pointsLayer`, `compositions`, `syntheticRing`, `sunCentred` (alias and runtime users to update); `tools/validate/browser-synthetic.mjs`, `browser-spike03.mjs`, `capture-apollo-compare.mjs`, `diff-screenshots.mjs` (script conventions, before/after tooling); `tsconfig.json`, `package.json`, `.gitignore` (no node types, ignored paths). Also noted: the Task files of T-043 and T-044 showed as modified in `git status` from before this work resumed; I did not touch them.

### Limitations and unverified

- Owner visual validation not done; headless evidence does not replace it.
- The Moon's public replacement (donor LROC map) is not in this repository, so the public build draws the Moon, like Earth, in its flat material colour; only smoke-checked (zero errors), not visually judged.
- The body-name rule ("body names only in `core/bodies` and `assets/bodies`") is not mechanised: `catalogue.ts` and `compositions.ts` legitimately name the built-in bodies, and generic `src/app` code names Earth in several places (e.g. `sceneLayout.ts`). Experience names (mission, shower, dataset) are mechanised over `src/assets/` as well now.
- "Earth on its path" in the browser is a pixel-level check (line on both sides of Earth, screenshots); the quantitative check is the unit test.
- Browser scripts other than the Earth-Moon, shower and compare scripts run at their own viewports, not a forced 390x844.
- Precision at 1 AU for the new Sun-Earth Perseids scene was not re-measured beyond the unchanged `browser-precision.mjs` run (T-045 owns that measurement).


### Repair of I-021 (Task Check C-020 NEEDS WORK; DW5)

Stage went audit -> build -> test -> audit. Fresh run directory `docs/evidence/o014-t047-repair-20261012-2012/` (earlier directory untouched); dev server on 5199 (stopped); output-directory arguments on every script.

- Proof 1, mechanised check: `tests/nameCheck.test.ts` scans src/core, src/assets, src/shell and generic src/app (comments stripped). Fails on experience/mission/shower/dataset names (apollo, columbia, eagle, perseid, geminid, meteor, shower, survey-marker, debris-ring, dust-belt) anywhere, and on the literals "sun", "earth", "moon" or the constants EARTH, MOON, SUN outside `src/core/bodies/` and `src/assets/bodies/` unless the file is allowlisted with a reason. It catches a planted tree (shell literal, app constant import, core experience name, assets template literal) while ignoring comments, `bodies/` files and an allowlisted file, and it fails on a stale allowlist entry or a reason under 20 characters. Result: src/shell and generic src/app have no body literal or constant and no experience name.
- Allowlist (file: reason, all in the test): `src/assets/compositions.ts` (a composition is a list of catalogue ids); `src/core/astronomyAdapter.ts` (Orb library boundary: Sun-from-Earth and Moon series); `src/core/body.ts` (re-exports built-in body constants); `src/core/illumination.ts` (lunar phase is Moon-from-Earth with the Sun as source); `src/core/moonTrajectory.ts` (the Moon's own provider); `src/core/referenceCenters.ts` (Earth-from-Sun geometry, root of every chain); `src/core/scalePolicy.ts` (True and Readable are in Earth radii); `src/core/state.ts` (body-id guards and frame defaults for the built-ins); `src/core/sunCentredSources.ts` (Earth's Sun-centred trajectory and two-body defaults); `src/core/twoBodyAdapter.ts` (default GM from the three built-in definitions).
- Proof 2, defaults from the experience: `initialObjectIdOf(definition)` (scene centre when the experience lists it, else its first shell item) feeds `App`'s initial selection; `createOrbitCameraState(distance, focus)` now takes the focus and the scene passes `sceneCenter`; `sceneCenterOf` no longer falls back to Earth (an experience with no composition must declare `sceneCenter`; the bodiless fixture does); the Sun body is `rootBodyId()` (new, `src/assets/catalogue.ts`); the developer readout pair comes from `readoutPairOf(mountedBodies)` (a satellite and its planet) instead of literal Earth and Moon. Tests: `tests/experiences.test.ts` (Moon-alone and Sun-alone compositions: mounted body list, scene centre, initial selection and camera focus are the mounted body and never Earth; first-shell-item fallback; the three experiences still start on their own centre; readout pair), `tests/compositions.test.ts` (`rootBodyId`, `readoutPairOf` on a made-up star/world/moonlet catalogue).
- Proof 3, remaining body names in generic app: spacecraft metrics that read Earth and Moon radii moved to `src/experiences/apollo11/spacecraftMetrics.ts` (also used by the synthetic marker fixture); the Earth/Moon hierarchy helper (`createSceneHierarchy`, `placeBodies`) moved to `tests/scenePlacement.ts` as a test fixture; `usesEarthMoon` removed (tests use a helper); `data-earth-moon` canvas flag removed (browser scripts assert `data-bodies`). Nothing else remains in generic app. `DebugOverlay`/`sceneMetrics` still use Earth/Moon wording in labels and field names (no body id literal or constant), because the developer readout is an Earth-Moon pair readout; the pair itself is now chosen generically.
- Proof 4, gates and browsers: `npm run typecheck` exit 0; `npm run build` exit 0; `npm test` 28 files, 535 tests passed. Browser scripts, all exit 0 with `"errors": []`: `browser-earth-moon`, `browser-showers`, `browser-spike02`, `browser-spike03`, `browser-shell`, `browser-anchor-labels`, `browser-synthetic`, `browser-synthetic-ring`, `browser-synthetic-belt`, `browser-precision`. `browser-synthetic` and `browser-synthetic-belt` first failed because they asserted the retired `data-earth-moon` canvas flag; they now assert `data-bodies` (bare: empty; marker: `earth,moon`; belt: `sun,earth`) and pass. The public-build validator and `capture-apollo-compare` were not re-run (no change to the build, textures or drawing code); the earlier run's results stand.
- Limitations: owner visual look not done; Apollo before/after pixel comparison not repeated after the repair (no drawing path changed; spike02/03 passed unchanged); the bodiless `syntheticBareDefinition` now starts selected on its marker rather than on an unmounted Earth.

## Drift Notes

Record architecture deltas here; the integration Task reconciles them into Design.

- Layer boundary (ARCH-04): `bodyMetrics` and `catalogueItem` live in `src/app/` (`bodyMetrics.ts`, `catalogueItem.ts`), not `src/assets/` as `planned_writes` said: they need shell types (`Metric`, `ExperienceObject`) and `tests/layerRule.test.ts` lets `src/assets/` import only core, assets and Three. Design should say so (D.1's `catalogueItem`, `bodyMetrics`). Deferred reconciliation: T-050.
- `ExperienceRuntime` is `{clock, resolver, catalogue}`; the `adapter` field went with `moon`. C-018 obs 1 closed: the Apollo panels get the Moon from the resolver (`resolverTrajectory`); `MoonTrajectory` remains only as the Moon's state source in `core/bodies`.
- `composition` stays optional on `ExperienceDefinition` (D.1 shows it required) only for the bodiless fixture `syntheticBareDefinition`, which proves a scene mounts with no composition; all other definitions name one. T-050 to decide whether the fixture or the type changes.
- `SunBody` is now only the Sun's shell item (and its validation); colour and marker size come from the catalogue Sun, with the belt's size 10 kept as `visualOverrides: {sun: {marker: {sizePx: 10}}}`. Closes C-016 obs 2 / T-043 drift. The Perseids scene has no `SunBody`: the Sun is a composition body and its shell item is `catalogueItem("sun")`.
- C-017 obs 1 closed: `drawnRadii` and `focusLimits`' sphere radius pass the body id to `mapRadius`, so per-body factors apply to drawn radii and camera limits. The solar-system policy is supplied by `App` from the experience's `exaggeration` overrides (default factor 1 for other bodies).
- `visualOverrides` (design C.6) is implemented for `visible`, `exaggeration` and any appearance field of the record (merged over it); a body with `visible: false` is not mounted but still resolves as a centre.
- C-019: `sunEarthSystem` still declares no path; the Perseids experience declares Earth's path itself (fixed one-year span about the peak, 361 samples, `createEarthSunTrajectory`). The parent's orbit is drawn only for peak +/- 180 days (the full 109P orbit reaches about 51 AU, beyond the declared camera reach); its provenance is `illustrative` because its position along the orbit is set by the stream's node choice. T-050 to reflect both in Design.
- Shower presets gained focus Earth and follow Earth; Earth's panel now reads "Distance from Sun" (it read "Distance to Moon" in the retired Earth-Moon scene). The Perseids scene mounts no Moon anywhere.
- The Explorer's window is 2025-01-01 to 2025-04-01, inside the Moon's checked range (mid-2022 to mid-2025), not the design sketch's 2026.
- Public build: aliases and the local-only list live in `vite.config.ts` (exported for the test; no Node types in the project); `tools/validate/public-build-assets.mjs` finds local-only sources from `src/assets/bodies/*.ts`; the 1x1 white placeholder is `src/assets/textures/public-placeholder.png`.
- Small additions: canvas attribute `data-composition-paths` (browser assertion), `tests/experiences.test.ts`, `tests/publicBuild.test.ts`, `tools/validate/public-build-assets.d.mts`; `tests/experienceDefinition.test.ts` import guard extended to `experiences` (see Context Log).
- Deferred Design notes, to be accounted for as reflected in Design.md or non-architectural by T-050: the layer-boundary placement, optional `composition`, `SunBody` reduction, `visualOverrides` semantics, Earth-path and parent-orbit declaration, public-build mechanism.
- Core providers outside `src/core/bodies/` name the built-in bodies and are allowlisted with reasons in `tests/nameCheck.test.ts` (astronomyAdapter, body, illumination, moonTrajectory, referenceCenters, scalePolicy, state, sunCentredSources, twoBodyAdapter), as is `src/assets/compositions.ts`. The Task text (bodies only in `src/core/bodies/` and `src/assets/bodies/`) and design section E check 7 differ on this; T-050 to reconcile it in Design.md (or move the providers).
- Repair additions for T-050: `rootBodyId` and `readoutPairOf` and `initialObjectIdOf` are generic lookups; `ExperienceDefinition.sceneCenter` is required when there is no composition; spacecraft metrics live under `src/experiences/apollo11/` (the synthetic fixture imports them from there); `data-earth-moon` replaced by `data-bodies` in browser assertions.

## Completion

- 2026-10-13T08:49:53Z — Owner accepted T-047 against C-021 after a live side-by-side look (pre-O-014 8fc6fce on :5301 vs 20a4aff on :5302; code identical to c06605d). Owner's words: "accept T-047, T-049, T-050". Recorded and `status: done` set by the orchestrator on the owner's direct instruction. The owner noted at the same time that Jupiter has no texture and that O-011 must give the Perseids stream and 109P/Swift-Tuttle their right shape and orbit (recorded as Issues, not conditions on this acceptance).
