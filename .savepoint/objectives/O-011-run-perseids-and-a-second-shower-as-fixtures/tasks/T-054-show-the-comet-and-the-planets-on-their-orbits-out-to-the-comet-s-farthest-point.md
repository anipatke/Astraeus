---
id: T-054
title: Show the comet and the planets on their orbits, out to the comet's farthest point
objective: O-011
status: done
depends_on: [{task: T-051, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o011-replan-i025-2026-10-13}
lane: bodies
planned_reads: [src/core/bodies/index.ts, src/core/bodies/planetTrajectory.ts, src/core/sunCentredSources.ts, src/core/twoBodyAdapter.ts, src/assets/catalogue.ts, src/assets/compositions.ts, src/app/BodyView.tsx, src/app/bodyDraw.ts, src/app/sceneFraming.ts, src/app/PathView.ts, src/app/pathRules.ts, src/app/AstraeusScene.tsx, tests/planets.test.ts, docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md]
planned_writes: [src/core/bodies/swiftTuttle.ts, src/core/bodies/index.ts, src/assets/bodies/swiftTuttle.ts, src/assets/catalogue.ts, src/app/bodyDraw.ts, src/app/BodyView.tsx, src/app/sceneFraming.ts, src/app/pathRules.ts, src/app/PathView.ts, tests/fixtures/swift-tuttle-horizons-source.txt, tests/fixtures/swift-tuttle-horizons.json, tests/swiftTuttle.test.ts, tests/bodyMarkers.test.ts, tests/paths.test.ts, tools/validate/browser-synthetic-belt.mjs, docs/ASTRONOMY_VALIDATION.md]
---

# Show the comet and the planets on their orbits, out to the comet's farthest point

## Outcome

109P/Swift–Tuttle becomes a catalogued body: a definition with published SBDB elements and a two-body state source about the Sun, its accuracy checked against JPL Horizons. Any composition body that would be smaller than a few pixels is drawn as a labelled marker at its real position (stated as a drawing aid), while larger ones stay spheres; under the solar-system scale planets show as enlarged spheres. Paths of highly eccentric orbits are sampled densely near perihelion, so the comet's whole orbit (aphelion about 51 AU) draws smoothly, and the camera can frame it at true scale. All of this is proven on the made-up belt first.

## Astraeus Hypothesis

- **Capability tested:** that a comet enters through the same definition and binding contracts as a planet, and that "visible on its orbit" is a generic drawing rule rather than a per-body setting.
- **Contract reused:** `CelestialBodyDefinition`, `StateSourceBinding`, `createTwoBodyTrajectory`, `BodyView`/`createMarker`, `PathLayer` orbits, camera reach, `ScalePolicy`.
- **Gap:** composition bodies at true scale vanish (owner's look, 2026-10-13); uniform time sampling crowds an e ≈ 0.96 orbit's perihelion; no comet in the catalogue.
- **Generic change:** a minimum on-screen size rule in `BodyView` (sphere when large enough, marker plus label otherwise); eccentric-orbit sampling by eccentric anomaly in the path rules; framing and reach to about 60 AU.

## User Check

None required here. T-038 carries the owner's look at Perseids.

## Done When

1. 109P is defined in `src/core/bodies/` with SBDB elements and epoch cited, a nucleus radius from a cited source, `parentId: "sun"`, and an accuracy record. Its Sun-centred position is checked against Horizons (raw response archived) at six or more dates spanning 1990–2030; the maximum error is recorded and classified, with the test asserting the figure.
2. Marker rule: on the made-up belt, a body whose drawn radius falls below the stated pixel threshold renders as a marker with its label, and above it as a sphere (test on the decision function at boundary values; browser assertion). Marker size never changes State or metrics.
3. Eccentric sampling: for e = 0.96, the maximum chord between samples, as a fraction of the local orbit radius, is at most one tenth of uniform-time sampling's (test). The path still passes through the source's own positions at sample times.
4. Framing: the made-up belt with a made-up 50 AU eccentric body frames its whole orbit; precision at 50 AU from the origin is measured with the existing precision method and recorded.
5. The name check passes (the comet's name only in `src/core/bodies/` and `src/assets/bodies/`); gates pass; every browser script passes in a fresh run directory.

## Context Files

`src/core/bodies/index.ts`, `src/core/bodies/planetTrajectory.ts`, `src/core/bodies/jupiter.ts`, `src/core/sunCentredSources.ts`, `src/core/twoBodyAdapter.ts`, `src/assets/catalogue.ts`, `src/assets/compositions.ts`, `src/app/BodyView.tsx`, `src/app/bodyDraw.ts`, `src/app/sceneFraming.ts`, `src/app/PathView.ts`, `src/app/pathRules.ts`, `src/app/AstraeusScene.tsx`, `tests/planets.test.ts`, `tests/paths.test.ts`, `tools/validate/browser-synthetic-belt.mjs`, `tools/validate/browser-precision.mjs`, `docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md`.

## Design References

Design: Asset architecture (O-014): catalogue, compositions, path kinds, scale policies.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-05, PROV-01, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Fetch SBDB elements and the Horizons comparison; archive raw responses (never invent values; REPLAN REQUIRED if unavailable).
2. Add the comet definition, binding and visual (marker; no texture).
3. Add the marker rule and eccentric-anomaly sampling, made-up proof first.
4. Extend framing and reach; measure precision at 50 AU.
5. Gates and every browser script.

## Boundaries

No Perseids changes (T-038). No non-gravitational forces or perturbations; this is stated in the comet's accuracy record.

## Technical Verification

Focused tests, configured gates, every browser script in a fresh run directory. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Executed 2026-10-15 (build 08:37Z to 09:15Z UTC) by the builder session. Sources fetched live and archived raw, nothing invented: SBDB (2026-10-15T08:39:27Z) and Horizons (2026-10-15T08:39:41Z) in `tests/fixtures/swift-tuttle-horizons-source.txt`, parsed into `tests/fixtures/swift-tuttle-horizons.json`. The values equal the ones the research record already cited (docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md section 2); that record cited three Horizons dates, this check uses eight.

### Per-criterion outcomes

1. **109P definition and Horizons check: met.** `src/core/bodies/swiftTuttle.ts` defines it (`parentId: "sun"`, radius 13 km from the SBDB diameter 26 km, Lamy et al. 2004, matching Horizons `RAD= 13.`; no GM because neither source gives one) with SBDB elements (solution SB405-CPV-2, epoch JD 2450000.5 TDB converted to UTC with TT-UTC 61.184 s) and a two-body state source, bound in `BUILT_IN_BINDINGS`, visual `src/assets/bodies/swiftTuttle.ts` (marker, no texture). Horizons check at **8 dates, 1990-01-01 to 2030-01-01**: **maximum error 10,686,093 km (0.0714 AU) at 2030-01-01; largest fraction 0.857% at the 1992-12-12 perihelion (1,228,932 km); 0.160% at the 2030 maximum**. **Classification: approximate** (within 1% of distance from the Sun at every date; not an ephemeris; a body-diameter yardstick is meaningless for a 26 km nucleus). Tests assert the figure, the fraction and the classification (`tests/swiftTuttle.test.ts`: "has a maximum Sun-centred error equal to the figure the definition records", "has a largest fractional error equal to the recorded one", plus elements-equal-archived-SBDB, radius, epoch, aphelion/perihelion distances, resolver from Sun and Earth). Accuracy record states two-body only, no perturbations or non-gravitational forces, and valid 1990 to 2030. docs/ASTRONOMY_VALIDATION.md has the full table.
2. **Marker rule: met.** `drawsAsMarker(radiusPx, settings)` and `projectedRadiusPx` in `src/app/bodyDraw.ts`; BodyView carries a hidden stand-in marker on the overlay layer beside every sphere and the scene swaps them each frame. Decision tested at boundary values (just below, exactly at, just above the threshold; threshold 0 never swaps; projection matches Three's own matrices; solar-system-scale enlarged Earth stays a sphere where true-scale Earth is a marker) in `tests/bodyMarkers.test.ts`. Browser assertion (`browser-synthetic-eccentric.mjs`, made-up belt): Earth close up is a sphere (`data-marker-bodies=""`), pulled back is a marker with 35 near-white pixels at its place, from the Sun at 1 AU it is a marker; `?markerpx=0` never swaps (0 pixels), `?markerpx=100` swaps at the larger value; under the solar-system scale (Earth x200) with the camera at the Sun Earth is a sphere while the true-scale one is a marker, and pulled far back the enlarged one becomes a marker too. The marker never changes State or metrics: the rule's inputs are a screen radius and a settings record; a test asserts every state is equal before and after the rule runs.
3. **Eccentric sampling: met.** `eccentricPathTimesUtcMs` (src/core/sunCentredSources.ts) spaces samples evenly in eccentric anomaly; `PathLayer.sampling` opts in. For e = 0.96 at 512 samples the longest chord as a fraction of local orbit radius is 1.373 even in time against 0.086 by eccentric anomaly: **ratio 16.0 (limit 10)**. At 256 samples the ratio is only 9.9, so a path that declares `sampling` defaults to 512 samples (setting `samples`). The path passes through the source's own positions at every sample time (test compares every vertex with `source.stateAt(time)` exactly). Tests: `tests/longOrbitPaths.test.ts`.
4. **Framing and precision at 50 AU: met.** The made-up belt experience with a made-up 1 to 51 AU orbit (`?experience=synthetic-eccentric`, `src/synthetic/syntheticEccentricDefinition.ts`) frames the whole orbit: unit test projects all 512 vertices through a 45 degree 16:10 camera at the framing distance from 86 directions, none outside the view; browser, True scale: the orbit's pixels sit inside the canvas with margin at 1280x800 (span 0.68 of the view) and 390x844 (0.68), and stay drawn at the farthest zoom. **Precision at 50.96 AU from the origin (Sun focused), by the browser-precision.mjs method: vertex static displacement 0 px over 60 frames, sweep cubic residual 0.0019 px; Float32 grid there 0.125 Earth radii = 796 km.** Unit test: all vertices within 0.11 scaled units (700 km) of Float64 with the Sun at the origin.
5. **Name check, gates, browser scripts: met.** Name check test (`tests/swiftTuttle.test.ts`): the comet's name appears only under `src/core/bodies/` and `src/assets/bodies/` plus the one import line in `src/assets/catalogue.ts`. Gates below. Every app browser script ran in the fresh run directory with zero console errors.

### Commands and results

- `npm run typecheck` (clean), `npm run build` (built), `npm test`: **36 files, 654 tests passed** at 2026-10-15T09:14Z to 09:15Z (baseline before this Task 613 in 33 files; this Task adds `swiftTuttle.test.ts` 16, `bodyMarkers.test.ts` 12, `longOrbitPaths.test.ts` 13; existing id-list assertions in `tests/assets.test.ts`, `tests/planets.test.ts`, `tests/stateResolver.test.ts` now include the comet). One earlier run (08:48Z, concurrent with a build) failed the wall-clock performance test `tests/listedOrbitGroup.test.ts` "fills 30,000 members inside the frame budget" (a timing ratio); it passed alone and in the later full run; a flaky timing test, not changed.
- Browser, dev server on port 5199 (stopped afterwards; 5301 and 5302 untouched), `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`, `ASTRAEUS_EVIDENCE_DIR=<subfolder>`. **Run directory `docs/evidence/o011-t054-20261015T085030Z/`, one subfolder and one `<script>.log` per script, `summary.txt` with times.** All exit 0 and `errors: []` (sky prints `errors: 0`): synthetic-eccentric (new; 08:50Z), synthetic-belt, synthetic-listed, synthetic-ring, synthetic, earth-moon, jupiter-io, lighting, precision, shell, showers, sky, spike02, spike03 (08:53Z to 09:12Z), and marker-existing (new, 09:13Z). `browser-anchor-labels.mjs` was not run; `docs/evidence/regression-spike01-02` and `docs/evidence/spike03` untouched (`git status` shows no change under them). The existing scripts were not edited; none of their scenarios needed replacement, so no coverage is deferred.

### Visible changes to existing experiences (for the owner)

From `marker-existing/` (screenshot pair per view, rule on and `?markerpx=0` for the old look):
- **Earth-Moon Explorer, True scale, default overview: the Moon is now drawn as a 6 px marker** (it was a speck under 2 px). Readable scale unchanged.
- **Jupiter and Io, True scale, default overview: Io is now a marker** (it was a speck under 2 px).
- **Perseids (Sun-centred), True and Solar system scale, default overview: Earth is now a marker** (it was invisible at that distance). The solar-system scale in Perseids does not yet enlarge it enough to stay a sphere in the default overview; that is T-038's look.
- Apollo 11 default view: no change.
- Developer mode gains a "Body marker threshold (px)" slider (0 to 20, default 3) under Display settings in any experience that mounts a sphere. `?markerpx=` sets it from the address.
- Perseids' planet-orbit list is unchanged: the comet is catalogued as a Sun child, so the shower builder's planet-orbit loop would have found it and thrown (its turn is 133 years, the search covers 16); `createPlanetOrbitPathLayers` now leaves out a body whose turn the search cannot find. Test: the four planet orbits and nothing else.

### Extra reads (outside the Context Files), with reasons

`src/core/bodies/io.ts` (the binding and Kepler helper pattern to follow), `src/core/bodies/sun.ts` (the GM the two-body source uses), `src/core/bodies/planetRecords.ts` (accuracy record shape), `src/core/body.ts`, `src/core/provenance.ts`, `src/core/scalePolicy.ts` (solar-system scale and exaggeration), `src/assets/visual.ts` and `src/assets/bodies/jupiter.ts` and `io.ts` (visual record shape), `src/app/experienceDefinition.ts` (PathSpec, camera reach, validation), `src/app/App.tsx` and `src/app/SkyView.ts` (settings and query-parameter pattern for the new setting), `src/app/CameraController.tsx` (poseCamera), `src/app/floatingOrigin.ts`, `src/app/sceneLayout.ts`, `src/main.tsx`, `src/synthetic/syntheticRingDefinition.ts` (the made-up belt), `src/experiences/showers/showerDefinition.ts` (found by grep for catalogue enumeration; read and edited, see above), `src/shell/experience.ts`, `src/shell/scaleModel.ts`, `tests/scenePlacement.ts`, `tests/planetFixtures.ts`, `tests/jupiterIo.test.ts`, `tests/stateResolver.test.ts`, `tests/assets.test.ts`, `docs/ASTRONOMY_VALIDATION.md` (format of the Io section), the T-038 Task file (to see what it expects of the comet), `.savepoint/Guardrails.md` (rule IDs), other `tools/validate/browser-*.mjs` headers (environment options).

### Files changed

New: `src/core/bodies/swiftTuttle.ts`, `src/assets/bodies/swiftTuttle.ts`, `src/synthetic/syntheticEccentricDefinition.ts`, `tests/fixtures/swift-tuttle-horizons-source.txt`, `tests/fixtures/swift-tuttle-horizons.json`, `tests/swiftTuttle.test.ts`, `tests/bodyMarkers.test.ts`, `tests/longOrbitPaths.test.ts`, `tests/scalePolicies.ts`, `tools/validate/browser-synthetic-eccentric.mjs`, `tools/validate/browser-marker-existing.mjs`, `docs/evidence/o011-t054-20261015T085030Z/`. Changed: `src/core/bodies/index.ts`, `src/assets/catalogue.ts`, `src/core/sunCentredSources.ts`, `src/app/bodyDraw.ts`, `src/app/BodyView.tsx`, `src/app/AstraeusScene.tsx`, `src/app/App.tsx`, `src/app/PathView.ts`, `src/app/experienceDefinition.ts`, `src/app/sceneFraming.ts`, `src/experiences/showers/showerDefinition.ts`, `src/main.tsx`, `tests/assets.test.ts`, `tests/planets.test.ts`, `tests/stateResolver.test.ts`, `docs/ASTRONOMY_VALIDATION.md`. Written outside `planned_writes`: App.tsx, AstraeusScene.tsx, experienceDefinition.ts, sunCentredSources.ts, showerDefinition.ts, main.tsx, the synthetic definition, the extra tests and scripts (all needed to carry the generic rule and its proof; none is a Perseids look change). Planned but unchanged: `pathRules.ts` (sample-time spacing went to `sunCentredSources.ts` beside `pathTimesUtcMs`), `tests/paths.test.ts`, `tools/validate/browser-synthetic-belt.mjs` (the eccentric proof is its own script and experience so the belt's scenarios keep their counts).

### Limitations

Position accuracy is approximate and valid only 1990 to 2030 (stated). The marker rule's pixel threshold reads the screen radius from a vertical field of 45 degrees and the canvas height; headless software rendering was used, not a GPU; the owner's visual judgement of the marker size, colour and label is not claimed. The Float32 precision figure is from the browser read-back of buffer values, not the GPU's own matrix arithmetic (same limitation as `browser-precision.mjs`). The comet is not drawn in any experience yet (T-038).

## Drift Notes

Record architecture deltas here; T-040 reconciles them.

1. **New generic capability: eccentric-anomaly path sampling.** `PathSpec.sampling?: EccentricSampling` (core `EccentricSampling`, `eccentricPathTimesUtcMs`, `eccentricAnomalyFromMean` in `src/core/sunCentredSources.ts`); default 512 samples when set (`DEFAULT_ECCENTRIC_SAMPLE_COUNT`); fixed spans only (validation refuses it on a rolling window). A path with it is centred by the middle of its extremes (`boundsMidpoint` in `PathView.ts`) and framed to fit whole (`fitDistance`, `FIT_MARGIN` 1.05 in `sceneFraming.ts`, used by the scene for a path with `fitsWhole`) instead of the mean-of-vertices and `GROUP_FRAMING` rule. Design.md: path kinds and path sampling (architectural; reflect in Asset architecture).
2. **New generic capability: the marker rule.** `BodyMarkerSettings`, `DEFAULT_BODY_MARKER` (3 px threshold, 6 px dot), `projectedRadiusPx`, `drawsAsMarker`, `markerSettingsFromSearch` in `bodyDraw.ts`; `BodyView` mounts a hidden stand-in marker beside each sphere and exposes `BodyParts` via `onParts`; the scene swaps per frame and writes `data-marker-bodies` and `data-marker-px` on the canvas; `SceneControls.bodyMarker`; Developer > Display settings slider; `?markerpx=`. Presentation only, never feeds State or metrics (ARCH-02). Design.md: presentation layer (architectural).
3. **Catalogue now holds a body that is not a planet.** `swift-tuttle` (Sun child, `orientation: "none"`, no GM, marker visual, two-body source with a stated approximate position record). Any code that enumerates the catalogue for "bodies orbiting the Sun" now sees it; the shower builder's planet-orbit loop was changed to skip a body whose full turn the search cannot find (`turnSpanOrNull`). T-038 decides how the comet is drawn in the shower scene and may replace that skip. Design.md: catalogue contents and the two-body-from-published-elements pattern for a small body (architectural).
4. **Two-body timing helper shape.** A body that wants an eccentric path exports its `EccentricSampling` next to its trajectory (`SWIFT_TUTTLE_SAMPLING`: eccentricity, model period, periapsis time from the model). Non-architectural detail: periapsis is rounded to whole milliseconds because `stateAt` requires integer times.
5. **Accuracy classification for a small body.** "Approximate" is judged as a fraction of the distance from the Sun (1% line), not in body diameters as for Io; recorded in the definition and docs/ASTRONOMY_VALIDATION.md. Non-architectural (documentation) unless T-040 wants a project-wide rule.
6. **New made-up experience `synthetic-eccentric`** (belt plus a made-up 1 to 51 AU orbit, camera reach 4,000,000 / far 12,000,000 Earth radii, solar-system scale with Earth x200). A test fixture, not architecture.
7. **Visible look changes to existing experiences** (Moon in Earth-Moon True overview, Io in Jupiter-Io overview, Earth in Perseids overview become markers; Display settings slider) are recorded above for the owner; the Perseids composition and presets are T-038's.

## Done

Task Check C-030 CLEAR, 2026-10-15T09:17:50Z. No owner look required. `status: done` set by the O-011 orchestrator under the owner's delegation in chat ("You may mark a task Done after a satisfactory check, except tasks that need my look"), actor {role: owner-delegate, session: o011-orchestrator-check-20261013}.
