---
id: T-044
title: Mount a composition of bodies with its centre as a setting
objective: O-014
status: in_progress
stage: audit
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

### Context Log

- Started 2026-10-11: status in_progress, stage build; router task T-044 (release G-004 preserved).
- Rename step (no behaviour change): `git mv src/app/EarthMoonScene.tsx src/app/AstraeusScene.tsx`; component `EarthMoonScene` -> `AstraeusScene`; imports updated in `src/app/App.tsx` and `tests/experienceDefinition.test.ts` (import and the camera source-file list). No browser script or test id referenced the old name. `npm run typecheck` clean; `npm test` 23 files / 426 tests passed. Committed by the orchestrator as 3e881cf ("Rename EarthMoonScene to AstraeusScene (T-044, no behaviour change)"); the generalisation follows on top of it.
- Implementation complete (see Files changed below); `npm run typecheck` clean and `npm test` 24 files / 460 tests pass. Stage moved build -> test for the browser validation scripts and the before/after capture.

### Extra reads (logged)

- `src/assets/visual.ts`, `src/assets/bodies/*`, `src/core/bodies/*`, `src/core/body.ts`, `src/core/state.ts`, `src/core/scalePolicy.ts`, `src/core/illumination.ts`, `src/core/referenceCenters.ts`, `src/core/trajectory.ts`, `src/app/orbitPath.ts`, `src/app/bodyDraw.ts`, `src/app/BodyMesh.tsx`, `src/app/App.tsx` callers: to place the Sun, Earth and Moon through the resolver and keep lights, radii and the Moon path identical.
- `tests/layerRule.test.ts`, `tests/stateResolver.test.ts`, `tests/sceneTransforms.test.ts`, `tests/pointsLayer.test.ts`, `tests/sunCentred.test.ts`, `tests/infoProvenance.test.ts`, `tests/showers.test.ts`: callers of changed signatures; layer rule for `src/assets`.
- `tools/validate/browser-spike02.mjs`, `browser-spike03.mjs` (six mission times), `.savepoint/issues/I-020*`, `.savepoint/checks/C-015*`, `C-016*`.

### Files changed

- New: `src/assets/compositions.ts`, `src/app/sceneFraming.ts`, `tests/compositions.test.ts`, `tests/scenePlacement.ts`, `tools/validate/capture-apollo-compare.mjs`, `tools/validate/diff-screenshots.mjs`.
- Changed: `src/app/{AstraeusScene.tsx,App.tsx,BodyView.tsx,PointsView.ts,SunCentredView.ts,TrackedBodyView.ts,experienceDefinition.ts,sceneLayout.ts}`, `src/core/moonTrajectory.ts`, `src/synthetic/syntheticRingDefinition.ts`, `tests/{experienceDefinition,infoProvenance,metricVisuals,missionScene,pointsLayer,stateResolver,sunCentred,syntheticRing}.test.ts`, `tools/validate/browser-synthetic-belt.mjs`.
- Not touched: `src/app/orbitPath.ts` (planned writes listed `src/app/mission.ts`, `src/app/CameraController.tsx`, `tests/experiencePlugIn.test.ts`, `src/core/moonTrajectory.ts` partly: mission.ts, CameraController.tsx, experiencePlugIn test needed no change). Rename commit 3e881cf precedes all of this.

### Per-criterion outcome

1. Met. `src/assets/compositions.ts` exports `earthMoonSystem` (earth, moon, centre earth, Moon path over a sidereal month) and `sunEarthSystem` (sun, earth, centre sun, no path: path drawing is T-045 and the belt still declares Earth's path as its own path layer). `createComposition` rejects an id the catalogue lacks, repeats, a centre not in the list, a path off the list. `tests/compositions.test.ts`.
2. Met. `ExperienceDefinition.composition` and `sceneCenter`; `compositionOf` maps `sceneLayers: "earth-moon"` to `earthMoonSystem`; `usesEarthMoon` is true for Apollo, synthetic, ring, a shower, false for bare and the belt; `sceneCenterOf` rejects a centre outside the catalogue or composition. Tests: `tests/compositions.test.ts` ("experience definitions keep their results through the alias"), plus the existing `experienceDefinition`/`pointsLayer`/`syntheticRing` tests.
3. Met. `AstraeusScene` mounts one `BodyView` per composition body (including the Sun, through `BodyView` with a marker override carrying the experience's colour and size: C-016 observation 1), overview targets `sceneCenter`, `focusLimits`/`defaultDistance`/`focusRadius` live in `src/app/sceneFraming.ts` and read radii and kinds from the catalogue and the composition's span. Apollo's numbers reproduced exactly under True and Readable (test "Apollo's framing numbers come out of the body definitions exactly"); Earth and Moon keep render layers 1 and 2; the placement test compares positions, orientations and light directions to `placeBodies` and the old formulas. The Moon-focus start side is now "the side facing the body's parent", the same vector for the Moon.
4. Met. `trackedAbsolute`, `PointsView`, `PathView`, `TrackedBodyView` (relative trail: each sample shifted by its own-time offset) and the Moon's orbit line go through `resolver.offsetKm(from, sceneCenter, t)` via `sceneOffsetKm`, which returns null (nothing added) when the data's centre is the scene centre, so Apollo, the ring and the Moon path are unchanged bit for bit; the Moon path samples come from the resolver (test) and are cached exactly as before when the centre is Earth. Tests in `tests/compositions.test.ts` ("tracked data and groups follow the scene centre"), `tests/pointsLayer.test.ts`, `tests/sunCentred.test.ts`, `tests/missionScene.test.ts`.
5. Met. `MoonTrajectory.stateAt(t, "sun")` removed (any centre but Earth throws); the three `tests/metricVisuals.test.ts` cases use the resolver; the `tests/stateResolver.test.ts` equality test now writes the old branch's arithmetic out (Moon-from-Earth plus Earth-from-Sun, 1e-9 km at every archived Horizons date) and a new test asserts the branch is gone.
6. Met. Invariance tests (i) byte-identical `stateOf` for every body/time/centre across scene centres, both scales, a tracked view, a points view and camera changes; (ii) round trips within 1e-6 km and the exact Sun negation; (iii) two resolvers created separately, mounted for Apollo and the belt in different orders, give identical bytes. `tests/compositions.test.ts`.
7. Met, with one named limit. A made-up three-body composition (star, world, moonlet) about a non-Earth centre (the world): positions, span, focus limits and default distances, render layers, label anchors/focus points (the placed absolutes the scene uses) and `placeBody` group positions are tested (`tests/compositions.test.ts`). The belt declares `composition: sunEarthSystem, sceneCenter: "sun"`; `browser-synthetic-belt.mjs` keeps every prior scenario and adds the composition scenario at desktop and phone, True and Readable, at two dates one half day apart: canvas attributes (`data-scene-center="sun"`, `data-bodies="sun,earth"`, no Moon), the Sun marker sits at the camera centre when the Sun is focused, Earth is drawn at the camera centre when focused, and Earth's path line passes through Earth when pulled back (new belt preset "Focus Earth"). Limit: the belt timeline only spans one day, so Earth moves about 400 Earth radii between the two dates, not across the year.
8. Partly met, one pre-existing failure. Gates pass (below). Every browser script passes except `browser-synthetic-belt.mjs`, which fails its unchanged I-020 assertion; the HEAD script fails identically on both trees (see I-020 below). Apollo pixel look is recorded separately for the owner (below).

### Gates (this run, final code, 2026-10-12)

- `npm run typecheck`: clean. `npm run build`: built. `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 24 files, 460 tests passed (`docs/evidence/o014-t044-20261012T073652/gates-unit.txt`). `junit.xml` is untracked/ignored output.
- Browser scripts, vite started by me on :5199, `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`, fresh run directory `docs/evidence/o014-t044-20261012T073652/gates/<script>/` with logs `docs/evidence/o014-t044-20261012T073652/gates/<script>.log`, `docs/evidence/o014-t044-20261012T073652/results.txt`: spike03 exit 0, spike02 exit 0, showers exit 0, synthetic exit 0, synthetic-ring exit 0, anchor-labels exit 0 (output dir passed as argv so the historical `docs/evidence/regression-spike01-02` is untouched), shell exit 0, synthetic-belt exit 1. Zero console errors in every log that finished. (An earlier attempt, before an overnight interruption, overwrote the tracked `docs/evidence/regression-spike01-02/anchor-labels` files by running anchor-labels without an output argument; I restored them with `git checkout` before continuing and none of that remains modified.)
- I-020 (belt, owned by T-045): the HEAD (3e881cf) script fails `desktop/True: Earth's path is drawn (16)` on both the before tree and this tree, identically (`docs/evidence/o014-t044-20261012T073652/i020-head-script-5198.log`, `-5199.log`). The current script fails at `phone/True: Earth's path is drawn (29)` because my composition scenario runs before it and changes the state it starts from; the assertion, threshold and counts rule are untouched. Supplementary only, not a pass: the current script with that family's two thresholds temporarily lowered to 5 in a scratch copy (deleted) exits 0, so every assertion after the I-020 one (Sun label, info text, provenance, Apollo/ring unchanged, my composition counts) passes (`docs/evidence/o014-t044-20261012T073652/i020-current-script-threshold5.log`, counts for the composition scenario are in it). My work does not change I-020's cause.

### Owner look (owner_validation required): before/after screenshots

Before tree: detached worktree at 3e881cf (behaviour-identical to b9081fd; the rename only), removed afterwards. Capture script `tools/validate/capture-apollo-compare.mjs` pauses the clock; each state is saved full-page and scene-only (controls hidden, `*-scene.png`); 160 PNGs per tree.

- Before: `docs/evidence/o014-t044-20261012T073652/before/`. After: `docs/evidence/o014-t044-20261012T073652/after/`. Noise baseline (same before tree, second run): `docs/evidence/o014-t044-20261012T073652/before-rerun/`.
- Apollo at the six Spike 02 mission times (earth-orbit 1969-07-16 14:30, translunar 07-18 12:00, lunar-orbit-columbia and lunar-surface-eagle 07-21 06:00, return 07-23 12:00, entry 07-24 16:30), each overview and follow, True and Readable, desktop 1280x800 and phone 390x844, plus Moon focus and Earth focus at 1969-07-20 20:17: `apollo-<desktop|phone>-<true|readable>-<phase>-<overview|follow>[-scene].png`, `...-moon-focus`, `...-earth-focus`.
- Belt (desktop and phone, True and Readable, at 2030-01-01 01:00 and 2030-04-01): `belt-<vp>-<scale>-<start|spring>-<sun-view|focus-belt|overview>[-scene].png`. The Earth sphere on its path: `docs/evidence/o014-t044-20261012T073652/gates/synthetic-belt/` and `docs/evidence/o014-t044-20261012T073652/i020/current-script-threshold-5/*-earth-on-path.png`.
- Pixel diff (`docs/evidence/o014-t044-20261012T073652/pixel-diff.json`; counts of pixels whose largest channel differs by more than 16, over total, canvas read in Chromium): Apollo, 56 full-page and 56 scene-only pairs, after-vs-before max 0.066 % full-page and 0.109 % scene-only; the same before tree against its own rerun gives max 0.117 % and 0.246 % (`docs/evidence/o014-t044-20261012T073652/pixel-diff-baseline-noise.json`), so Apollo is within software-GL noise at every captured state, which is what pixel-identical can mean here; exact placement equality is proven by tests, not pixels. Belt: sun-view and focus-belt pairs are within noise except one (phone, Readable, start, sun view: 1.1 %, looked at: same picture, belt dots one hour apart); the six overview-per-scale/viewport pairs differ by 6.2-6.5 % (desktop) and 12.6-13.1 % (phone) because the belt Overview now frames the whole Sun-centred system instead of sitting 144 Earth radii from Earth: an intended consequence of `sceneCenter: "sun"`, not a regression. I viewed before/after for belt desktop True start sun view and overview and Apollo moon focus; the owner's look is still required.
- Unverified: I did not enumerate the "six telemetry times" beyond the six Spike 02 mission phases above; a viewed spot check, not a full visual review of 320 images.

### Limitations

- Sun-earth composition has no declared path (T-045); the belt keeps its Earth path layer.
- `bodyDraw.ts` calls `policy.mapRadius(radius)` without the body id, so a per-body factor on the solar-system scale is not applied to drawn radii (not in this Task's boundaries); framing uses the same call and so stays consistent with what is drawn.
- Belt composition at True scale: Earth is a 1-unit sphere 23,455 units from the Sun; no precision or depth problem was seen; measurement is the next Task's.

## Drift Notes

Deferred to T-050 (the integration Task); each to be accounted for as reflected in Design.md or explicitly non-architectural before the Full Objective Check.

- `ExperienceDefinition.composition` is optional and the `earth-moon` layer is a kept alias (retire in the experiences Task); `sceneCenter` defaults to the composition's centre, else Earth. A declared `sun` is mounted as the Sun body when the composition lacks it. Design C.6 shows composition required.
- `SceneRuntime` now carries `resolver`, `bodies`, `composition`, `sceneCenter` (the `earthMoon` flag and the Moon trajectory are gone from the scene); `ExperienceRuntime` still hands experiences `moon: MoonTrajectory`, not a resolver (C.6 says the resolver replaces it).
- Framing and layer assignment live in a new `src/app/sceneFraming.ts` (pure, catalogue-driven); `placeComposition`, `placeBody`, `ScenePlacement`, `sceneOffsetKm`, `createSceneResolver` in `sceneLayout.ts`. Centre body: min 1.15 x radius, default max(3.2, 2.4 x span); other spheres 1.6 and 4 x radius; markers (the Sun) are points framed by their paths' reach. Not in Design.
- Per-body light on layers 1.. skipping the overlay layer 3; pass loop generalised over the composition (Design B.4's "up to a measured limit"; the limit is 29 lit bodies, not measured).
- `SunBody` is now presentation (colour, marker size, shell item) for the Sun body; `BodyMarkerView`/`createSunCentredViews(sun, paths)` removed; `BodyView` takes a `markerOverride`.
- `TrackedBodyView` draws a relative trail shifted per sample by the data centre's own-time offset from the scene centre; the Moon's orbit line is a co-moving orbit shifted by the parent's offset at the clock time (C.6 path semantics for the Earth-Moon composition; the path kinds are T-045's).
- The Moon-focus start side is generalised to "toward the body's parent".
- `data-scene-center`, `data-bodies` attributes on the canvas; `data-earth-moon` now means both Earth and Moon are mounted.
- Belt gained a "Focus Earth" preset; selecting Earth there applies the parent-facing start side.
- Test-only: `tests/scenePlacement.ts`; tools `capture-apollo-compare.mjs`, `diff-screenshots.mjs`.
