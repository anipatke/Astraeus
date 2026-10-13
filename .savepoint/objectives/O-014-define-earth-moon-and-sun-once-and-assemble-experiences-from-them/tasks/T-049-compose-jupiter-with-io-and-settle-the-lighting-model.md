---
id: T-049
title: Compose Jupiter with Io and settle the lighting model
objective: O-014
status: done
depends_on: [{task: T-047, requires: clear}, {task: T-048, requires: clear}]
owner_validation: {required: true, accepted_check: C-023, accepted_by: {role: owner, session: owner-chat-o014-live-look-20261013}}
planned_by: {role: planner, session: o014-plan-2026-10-11}
lane: planets
planned_reads: [src/core/bodies/jupiter.ts, src/core/sunCentredSources.ts, src/core/twoBodyAdapter.ts, src/core/illumination.ts, src/assets/catalogue.ts, src/assets/compositions.ts, src/app/AstraeusScene.tsx, src/app/BodyView.ts, src/experiences/showers/showerDefinition.ts, src/main.tsx, tests/fixtures/planets-horizons.json, tests/orientationIllumination.test.ts, docs/DONOR_PROVENANCE.md, docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md]
planned_writes: [src/core/bodies/io.ts, src/core/bodies/index.ts, src/assets/bodies/io.ts, src/assets/textures/io-2k.jpg, src/assets/catalogue.ts, src/assets/compositions.ts, src/experiences/jupiter-io/jupiterIo.ts, src/experiences/showers/showerDefinition.ts, src/main.tsx, src/app/AstraeusScene.tsx, tests/fixtures/io-horizons-source.txt, tests/fixtures/io-horizons.json, tests/jupiterIo.test.ts, tests/orientationIllumination.test.ts, tools/validate/browser-jupiter-io.mjs, tools/validate/browser-showers.mjs, docs/ASTRONOMY_VALIDATION.md, docs/DONOR_PROVENANCE.md]
---

# Compose Jupiter with Io and settle the lighting model

## Outcome

A Jupiter–Io composition mounts about Jupiter: Io from published mean orbital elements about Jupiter's gravitational parameter through the existing Keplerian provider, with its Jupiter-centred position checked against JPL Horizons and classified by the one-Io-diameter line; Jupiter the spheroid; Io with the donor's public-domain USGS texture. The scene's lighting loop runs over any composition, and a single Sun light at the Sun's scaled position is measured against the per-body lights so the lighting model for larger systems is chosen on evidence. Perseids gains the planets' orbit paths from the catalogue. This is the architecture's stress test: a centre that is neither Earth nor the Sun, through the same contracts as everything else.

## Astraeus Hypothesis

- **Capability tested:** Gate C's second half: that the contracts are not "Earth–Moon with configurable names"; and the lighting question deferred under Decision 4.
- **Contract reused:** `createTwoBodyTrajectory` about a definition's GM, `StateSourceBinding`, `SystemComposition`, `AstraeusScene`, `BodyView`, `PathLayer` orbits, `directionToSun`, `lunarIlluminatedFraction` generalised by body id.
- **Gap:** no non-Earth, non-Sun centre has ever been mounted; the per-body render layers cap at 32 (design B.4).
- **Generic change:** the lighting loop over the composition; `illumination.ts` checks by role not literal id; otherwise none expected. If Io's mean elements or the Jupiter GM path need a contract change, record it and return REPLAN REQUIRED.
- **Evidence independent of any experience:** a fake parent–child pair about a fake GM through the same binding; the Horizons check is the physics evidence (Addendum 2 issue 4).

## User Check

Open `?experience=jupiter-io` at desktop and phone: Jupiter visibly flattened, Io orbiting it, both lit from the Sun's direction, Io's shadow side correct; focus and follow Io; open both info panels and read the accuracy records (Io's classification and figure; Jupiter's missing texture stated). Open Perseids: the planets' orbit paths are drawn around the Sun with Earth's. Record the look separately from the engine evidence.

## Done When

1. `src/core/bodies/io.ts`: definition (fact-sheet radius, parent `jupiter`, `orientation: "tidal-lock"` reusing the Moon's model with Jupiter as the parent, accuracy record) and a binding from published mean elements (source cited) through `createTwoBodyTrajectory` about Jupiter's GM, `reconstructed` provenance.
2. Io physics: raw Horizons responses (target 501, centre 500@599, geometric vectors, at least six dates across the validated range) archived; the maximum Jupiter-centred position error recorded; inside one Io diameter (3,643 km) the record says ephemeris-tier approximate with the figure, outside it the record says approximate demonstration with the figure in `knownLimitations`; either way the test asserts the recorded figure and the classification matches it.
3. Round trip: `stateOf("io", t, "sun") − stateOf("jupiter", t, "sun")` equals `stateOf("io", t, "jupiter")` within 1e-6 km; `stateOf("io", t, "io")` is zero.
4. `jupiterIoSystem` composition (Jupiter, Io, default centre Jupiter) and a small `src/experiences/jupiter-io/` definition (presets: overview, focus Jupiter, focus Io, follow Io; solar-system scale allowed) mount through `?experience=jupiter-io`; `tools/validate/browser-jupiter-io.mjs` asserts both bodies, both labels, Io's motion between two dates and zero console errors at both sizes.
5. Lighting: the per-body light loop runs over the composition (Jupiter and Io each lit along their own Sun direction, test); a comparison run draws the Earth–Moon composition with one Sun light at the Sun's scaled position and records the illuminated-fraction difference at the Spike 01 USNO dates and a screenshot pair; the choice is recorded in Drift Notes with the figures (keep per-body if the difference is visible, otherwise the integration Task may switch).
6. Perseids declares `orbit` paths for Mercury, Venus, Mars and Jupiter from the catalogue (settings or builder, no planet list in generic code); `browser-showers.mjs` asserts them.
7. Gates pass; every browser script passes in fresh run directories; the owner's look recorded separately.

## Context Files

`docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md` (B.4, Decision 4, Decision 8 and its donor reuse table, Addendum 2 issue 4, E step 6, Gate C), `src/core/bodies/jupiter.ts`, `src/core/sunCentredSources.ts`, `src/core/twoBodyAdapter.ts`, `src/core/illumination.ts`, `src/assets/catalogue.ts`, `src/assets/compositions.ts`, `src/app/AstraeusScene.tsx`, `src/app/BodyView.ts`, `src/experiences/showers/showerDefinition.ts`, `src/main.tsx`, `tests/fixtures/planets-horizons.json`, `tests/orientationIllumination.test.ts`, `docs/DONOR_PROVENANCE.md`.

## Design References

Design: Architecture (illumination geometry); Current Technical State (USNO phase checks). Design document B.4, D, E step 6, Gates C and D.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, PROV-01, PROV-02, TEST-01, TEST-03, STYLE-01, STYLE-07, STYLE-10.

## Implementation Plan

1. Confirm the planets and the three experiences landed; REPLAN REQUIRED if not.
2. Io definition, elements binding, Horizons fixtures and classification.
3. Io visual from the donor's licensed texture; composition and the small experience; browser script.
4. Generalise the lighting loop; run the single-light comparison on Earth–Moon; record.
5. Planet paths in the shower builder; update its browser script.
6. Gates, all scripts, owner look.

## Boundaries

No rings (step 7), no other moons, no Saturn, no Jupiter texture, no stream changes, no Geminids. The lighting switch itself is not made here; only measured.

## Technical Verification

Focused tests during iteration; handoff runs the gates and every browser script (scene-affecting fuller gate). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor session o014-exec-T-049, 2026-10-12. Claims for a fresh Check to verify, not clearance. Fresh browser run directory: `docs/evidence/o014-t049-20261012-211714/` (screenshots git-ignored; logs, JSON and the validator result are there).

### Per-criterion outcomes

1. Io definition and binding. `src/core/bodies/io.ts`: `IO` (id io, parent jupiter, `orientation: "tidal-lock"`, radius 1821.49 km and GM 5959.9155 km^3/s^2 from the Horizons satellite header archived in the fixture, position record `reconstructed`), `IO_BINDING` building `createTwoBodyTrajectory` about Jupiter's GM (126,686,531.9, Horizons physical data, recorded in T-048) from the JPL SSD Planetary Satellite Mean Elements row for Io (https://ssd.jpl.nasa.gov/sats/elem/, JUP365, Laplace frame, epoch 2000-01-01.5 TDB, read 2026-10-12; a 421,800 km, e 0.004, omega 49.1, M 330.9, P 1.762732 d, Papsis 1.333 yr, Laplace pole RA 268.1 Dec 64.5), wrapped to add the Moon's tidal-lock orientation about Jupiter. No contract change (the binding ignores the AstronomyAdapter it is handed and builds its own two-body adapter). Registered in `BUILT_IN_BODIES` and `BUILT_IN_BINDINGS`.
2. Io physics. Raw Horizons response archived verbatim in `tests/fixtures/io-horizons-source.txt` (one response preceded by a `==== QUERY ... ====` line; target 501, centre 500@599, VEC_TABLE=1, VEC_CORR=NONE, KM-S, ICRF, REF_PLANE=FRAME, UT, TLIST JD 2440423.5 2446217.5 2451545.0 2455378.5 2460310.5 2462653.5; fetched with curl from https://ssd.jpl.nasa.gov/api/horizons.api on 2026-10-12; source jup365_merged), normalized in `tests/fixtures/io-horizons.json`. Errors (km): 2398.0, 1114.2, 825.5, 2780.3, 5536.7, 9387.5; **max 9,387.47 km = 2.58 Io diameters** (diameter 3,642.98 km). That is outside the one-Io-diameter line, so the record says "approximate demonstration" with the figure, and the figure (9,388, rounded up) is in the known limitations. `tests/jupiterIo.test.ts` asserts the recorded figure equals the measured one and that the classification follows from it (it would require "ephemeris-tier approximate" inside the line). The J2000 sample is 825.5 km, inside one diameter; the error grows away from the epoch.
3. Round trip. `tests/jupiterIo.test.ts`: `stateOf("io", t, "sun") - stateOf("jupiter", t, "sun")` equals `stateOf("io", t, "jupiter")` within 1e-6 km at all six dates; `stateOf("io", t, "io")` is exactly zero with an orientation. A fake parent-child pair about a fake GM (origin, planet, satellite; GM 4e5, a 1e4 km) goes through the same `createTwoBodyTrajectory` binding and resolver: period, quarter-period radius and composition through the parent are asserted.
4. Composition and experience. `jupiterIoSystem` (jupiter, io, default centre jupiter, Io loop one sidereal period) in `src/assets/compositions.ts`; `src/experiences/jupiter-io/jupiterIo.ts` (presets overview, focus Jupiter, focus Io, follow Io; True scale only, because the Readable scale (distances x0.1) puts Io inside Jupiter and the solar-system scale enlarges both) mounted by `?experience=jupiter-io` in `src/main.tsx`. `tools/validate/browser-jupiter-io.mjs` (new): both bodies and labels, scene centre jupiter, Io's loop drawn, Io's label moves between 2000-01-01 and six hours later (desktop 791,464 to 549,398) and its readings change, four presets draw, Jupiter's panel states the missing texture, Io's states "approximate demonstration", 9,388 km and the source's own warning, zero console errors at 1280x800 and 390x844; exit 0.
5. Lighting. The per-body light loop already ran over any set of catalogued bodies; it is now the pure `bodyLightDirections` (`src/app/lighting.ts`) used by `AstraeusScene`, and `illumination.ts` gained `illuminatedFraction(bodyFromParent, sunFromParent)` by role (`lunarIlluminatedFraction` is a wrapper keeping its Moon guard), so the developer readout, which measured only Earth and the Moon, now measures whatever pair is mounted (labels from the catalogue). Test: Jupiter and Io each lit along their own Sun direction (render-axis equal to the resolver's to 1e-12), the two differing by Io's parallax, under 0.04 degrees. Single-Sun comparison (`?lighting=single-sun`, a measurement mode with an optional `&sunLight=<directional>,<ambient>` strength override; one point light, decay 0, at the Sun's scaled position, all bodies in one pass). Geometry on the four Spike 01 USNO January 2024 events, True and Readable scales (`tests/jupiterIo.test.ts`, logged): point-light illuminated fraction vs per-body at most 7.2e-9, direction at most 1.5e-6 degrees (float32 narrowing applied); one directional light at the centre's direction at most 1.36e-3 in fraction and 0.156 degrees. Rendered (`tools/validate/browser-lighting.mjs`, 1280x800, settled frames, labels hidden, per-pixel over lit pixels; screenshots `lighting/*-per-body.png` and `*-single-sun.png`, numbers `lighting/lighting-comparison.json`): Earth frames mean difference 0.0 and 0.006 of 255; Jupiter 0.004 and 0.006; Io 0.0, 0.0, 0.0; **Moon frames 7.7 to 13.0 (mean brightness 9.1 to 10.6, 19.2 to 22.0)**. The Moon difference is intensity, not position: Earth's own light is stronger (directional 1.8, ambient 0.18) than the Moon's (1.4, 0.08) and one light has one strength (it took the strongest). The control run with the single light given the Moon's strength (`sunLight=1.4,0.08`) gives mean differences 0.0008, 0.0091, 0.0012, 0.0005 (max channel 1 on three frames; one frame has a max of 25 on 0.03% of pixels). The lighting comparison ran before the final Sun-direction fix below, which does not touch scenes without the Sun mounted. Choice and reasoning in Drift Notes.
6. Perseids planet paths. `createPlanetOrbitPathLayers` in `src/experiences/showers/showerDefinition.ts` declares one `orbit` path for every catalogued body that circles the root and is not in the composition (no planet is named; today Mercury, Venus, Mars, Jupiter), from the body's own catalogue state source, one full turn from the peak (`fullTurnSpanMs`, new in `src/core/sunCentredSources.ts`: sums the angle between successive positions in two-day steps), colour and info from the catalogue record; Jupiter's states that its turn reaches past 2030, the last compared year. `tests/experiences.test.ts` asserts the six paths; `tests/jupiterIo.test.ts` asserts the found turns equal the sidereal periods of Mercury (87.969 d), Mars (686.98 d) and Jupiter (4332.59 d) within 0.5%. `browser-showers.mjs` asserts `data-sun-centred` 6, the four orbit items, their provenance panels and tan orbit-line pixels around the Sun (desktop 508, phone 430).
7. Gates. After the final code edit: `npm run typecheck` exit 0; `npm run build` exit 0 (JS 2,947.50 kB, gzip 1,025.08 kB, was 2,938.7 / 1,022.5 after T-048; `io-2k` 364.82 kB); `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 31 files, 568 tests pass (555 before; 13 new in `tests/jupiterIo.test.ts`; five existing tests edited for the new body and paths); `ASTRAEUS_PUBLIC_BUILD=1 npm run build -- --outDir <scratch>` then `node tools/validate/public-build-assets.mjs <scratch> o014-t049-20261012-211714/public-build-assets.json`: ok true, 7 files checked, 2 local-only sources, 0 matches (Io's map is public domain, licensed, not local-only, so it ships). Public bundle smoke (vite preview of the public build): default, earth-moon, jupiter-io and shower-perseids mount with zero console errors and no failed requests (`logs/public-build-smoke.log`). Browser (own vite on 5199, PLAYWRIGHT_CORE donor playwright-core, fresh run directory, output-dir argument every time): jupiter-io, showers, earth-moon, synthetic, synthetic-ring, synthetic-belt, precision, spike02, spike03, anchor-labels, shell all exit 0 with `"errors": []` in `logs/browser-*.json`. History: the first full browser pass (`o014-t049-20261012-211714-first-attempt-sun-direction-bug`) failed in `browser-showers`, `browser-synthetic-belt` and `browser-precision` with "center-to-Sun vector has no direction": my refactor of the light loop asked the Sun for its own direction. Fixed in `AstraeusScene` (only bodies that have a light), then the whole set was re-run in the fresh directory; `browser-showers` failed once more on my own new planet-orbit check (the panel was already open, so my click closed it), the script was corrected and re-run into `showers/` (the failed partial run is kept as `showers-first-attempt-failed/`). Typecheck, build, test and public build were re-run after the fix (logs in `logs/`). Vite stopped. Earlier spike evidence directories were not touched.

### Owner validation (screenshots, local, git-ignored)

Under `docs/evidence/o014-t049-20261012-211714/`: `jupiter-io/desktop-*.png` and `phone-*.png` (overview-t0, overview-t6h, focus-jupiter, focus-io, follow-io, follow-io-later, jupiter-info, io-info); `owner/desktop-perseids-planet-orbits-oblique.png` and `phone-...` (planets' orbits with Earth's path and the stream, camera tilted and pulled back); `showers/*-planet-orbits.png` (default edge-on framing); `lighting/earth-moon-moon-d10-per-body.png` and `-single-sun.png` (and the other pairs). The owner's look is not recorded here.

### Extra reads (logged)

- Source needed to wire a new body and a new experience: src/core/{body,moonTrajectory,bodyOrientation,stateResolver,state,orbitGroup,provenance,astronomyAdapter,scalePolicy}.ts, src/core/bodies/{moon,index,planetRecords,planetTrajectory}.ts, src/assets/{licence,visual}.ts, src/assets/bodies/{moon,venus,jupiter}.ts, src/app/{sceneLayout,sceneFraming,experienceDefinition,App,DebugOverlay,metricReadouts,bodyMetrics,catalogueItem,PathView,SceneLabels,floatingOrigin}, src/shell/scaleModel.ts, src/experiences/earth-moon/earthMoonExplorer.ts, vite.config.ts, tests/{nameCheck,stateResolver,planetFixtures,assets,planets,compositions,textureLicence,experiences}.test.ts. Reason: the Task's Context Files do not include the resolver, orientation helper, readout and metrics that a Jupiter-centred scene exercises; nameCheck and the hard-coded body lists broke.
- tools/validate/browser-*.mjs (conventions and output-directory behaviour).
- Donor: /home/user/code/planetary-explorer/public/textures/README.md (Galilean Moons), src/entities/io.ts (material colour).
- External, fetched 2026-10-12: JPL SSD Planetary Satellite Mean Elements page; JPL Horizons API (Io vectors and the satellite header).

### Files changed

New: src/core/bodies/io.ts; src/assets/bodies/io.ts; src/assets/textures/io-2k.jpg; src/app/lighting.ts; src/experiences/jupiter-io/jupiterIo.ts; tests/jupiterIo.test.ts; tests/fixtures/io-horizons-source.txt; tests/fixtures/io-horizons.json; tools/validate/browser-jupiter-io.mjs; tools/validate/browser-lighting.mjs; docs/evidence/o014-t049-20261012-211714/ (and the first-attempt directory).
Modified: src/core/bodies/index.ts; src/core/illumination.ts; src/core/sunCentredSources.ts; src/assets/catalogue.ts; src/assets/compositions.ts; src/app/AstraeusScene.tsx; src/app/App.tsx; src/app/DebugOverlay.tsx; src/app/metricReadouts.ts; src/experiences/showers/showerDefinition.ts; src/main.tsx; tools/validate/browser-showers.mjs; tests/assets.test.ts, planets.test.ts, stateResolver.test.ts, textureLicence.test.ts, experiences.test.ts; docs/ASTRONOMY_VALIDATION.md; docs/DONOR_PROVENANCE.md; this Task file and .savepoint/router.md (selection). `tests/orientationIllumination.test.ts` was not changed.

### Limitations and unverified

- Io is an approximate demonstration: 9.39 thousand km (2.6 Io diameters) from Horizons at the worst of six dates, 0.83 thousand km at J2000. The elements are the source's own "not for ephemeris computation" mean elements. The sign of the apsidal motion (retrograde) is not stated by the table; it was chosen because it reproduces Io's known sidereal period (1.7691 d; Horizons header: about 1.77 d) and, measured, is the only variant within thousands of km of Horizons (the others were 150,000 to 790,000 km off at the far dates; table in docs/ASTRONOMY_VALIDATION.md). That is a choice among three variants made with the comparison dates in view, disclosed here, not an independent derivation.
- The Laplace-plane reference direction (node on the EQJ equator at RA + 90 degrees) is the convention for a pole given as RA/Dec and was not confirmed by the source text; the J2000 sample at 826 km supports it.
- Io's tidal-lock orientation is the Moon's approximate model (no libration) and not compared with any reference. Io texture alignment (`textureYawRad` 0) is not verified; the owner's look decides. Licence is the donor README's statement; the USGS page was not opened.
- Jupiter flattening and the lit-side look are judged by the owner; browser scripts do not measure them.
- The lighting comparison is one renderer (headless Chromium, swiftshader) over two scenes; it is evidence for these frames, not for a larger system or other GPUs. The lighting switch was not made (Task boundary).
- The 2030 Horizons sample uses a predicted UT offset (labelled UT~).
- Planet orbit paths beyond 2030 (Jupiter's turn) are extrapolated; the info panel says so.
- Bundle size grew by about 9 kB; I-022 (lazy planet ephemeris) remains follow-up after O-014, not attempted.
- Not run: no Task Check (the orchestrator runs it); no owner look recorded.

### Context Log

Started T-049 (router task T-049; status in_progress, stage build); read Task and Context Files; found the Io binding needs no contract change; fetched Io mean elements and Horizons; found the table's P is anomalistic and measured four variants; implemented Io, composition and experience; generalised the light loop and illumination; added the measurement mode and compared; added planet paths; stage test (new tests, five edited, scratch test removed); stage audit once gates and the browser set passed; found and fixed a Sun-direction regression through the browser scripts; reran everything fresh.

## Drift Notes

Architecture deltas for the integration Task (T-050) to reconcile into Design.md (each is either reflected in Design or accounted as non-architectural, with a reason):

1. **Lighting choice (measured).** Per-body lights and one point light at the Sun's scaled position give the same lighting geometry: illuminated fraction differs by at most 7.2e-9 and direction by 1.5e-6 degrees on the four USNO phase events at True and Readable scales; rendered, the Earth, Jupiter and Io frames differ by at most 0.006 of 255 on average. The one visible difference (Moon frames, 7.7 to 13.0 of 255 on average) is brightness, not terminator position, because Earth is tuned to 1.8/0.18 and the Moon to 1.4/0.08 and one light has one strength; with the Moon's own strength the difference is 0.0005 to 0.009. A directional light at the centre's direction (rather than a point at the Sun) would be 0.16 degrees off at the Moon. **Recommendation: keep per-body lights for Spike 04** (the Task keeps them when a difference is visible, and one is), **and note the single point light is viable for larger systems**: it removes the 31-lit-body render-layer cap and the pass per body, at the cost of per-body intensity tuning, which would then move into material or a per-body exposure. The integration Task may switch; if it does it must decide what carries Earth's brighter look (candidate: a per-body material colour or emissive scale). The switch itself was not made.
2. **Generic changes made.** `illumination.ts`: `illuminatedFraction` by role (any satellite, the Sun as source); `lunarIlluminatedFraction` is a wrapper keeping its guard. `DebugReadout` and the scene metrics carry the measured pair's labels (default Earth and Moon). `src/app/lighting.ts` holds the per-body direction function, the Sun's scaled position and the measurement-mode query (`?lighting=single-sun`, `&sunLight=`); `SceneRuntime.lighting` and `sunLight`; canvas attribute `data-lighting`. `fullTurnSpanMs` in `sunCentredSources.ts`. Io's trajectory wraps `createTwoBodyTrajectory` with tidal-lock orientation inside `core/bodies/io.ts`; a generic tidally-locked wrapper is a candidate to lift if a third moon arrives.
3. **Contracts held.** No change to `StateSourceBinding`, `CelestialBodyDefinition`, `createTwoBodyTrajectory`, `ScalePolicy`, `SystemComposition` or `ExperienceDefinition`: Io came through the same binding, resolver, composition, scene and shell as the Moon, with Jupiter as a centre that is neither Earth nor the Sun (Gate C's second half). Compositions name catalogue ids only; a light direction is computed only for bodies that have a light (the Sun has none).
4. **Scale choices.** Jupiter-Io offers True scale only: Readable scale (x0.1) buries Io inside Jupiter (Io's orbit radius is 421,800 km, 5.9 Jupiter radii, drawn at 0.59) and the solar-system scale enlarges bodies. A scale policy defined by the scene's own radii rather than Earth's is not needed yet; a note for the design's scale section.
5. **Io accuracy tier.** Published mean elements through two-body motion are an approximate demonstration (2.6 diameters worst case), not an ephemeris-tier source; ephemeris tier needs a satellite theory or an SPK reader (not in the library). Reconstructed provenance is used; the elements' own warning is carried in the known limitations.
6. **Perseids planet orbits.** The planets come from the catalogue (every body whose parent is the root and not already in the composition), so adding a planet to the catalogue adds its orbit to every Sun-centred shower with no code change. Jupiter's full turn reaches 2039; the series is extrapolated past the 2030 comparison range and says so. The default Sun overview is edge-on to the ecliptic, so the orbits read as thin ellipses until the camera is tilted (the owner may want a tilted default).
7. **Planned-write drift.** `src/core/bodies/index.ts`, `src/core/illumination.ts`, `src/core/sunCentredSources.ts`, `src/app/{App,DebugOverlay,metricReadouts}`, `src/app/lighting.ts`, `tools/validate/browser-lighting.mjs`, five existing tests and the docs were touched beyond the manifest; all were required (the readout threw for Io; five tests assert the catalogue lists).

## Completion

- 2026-10-13T08:49:53Z — Owner accepted T-049 against C-023 after a live side-by-side look (pre-O-014 8fc6fce on :5301 vs 20a4aff on :5302; code identical to c06605d). Owner's words: "accept T-047, T-049, T-050". Recorded and `status: done` set by the orchestrator on the owner's direct instruction. The owner noted at the same time that Jupiter has no texture and that O-011 must give the Perseids stream and 109P/Swift-Tuttle their right shape and orbit (recorded as Issues, not conditions on this acceptance).
