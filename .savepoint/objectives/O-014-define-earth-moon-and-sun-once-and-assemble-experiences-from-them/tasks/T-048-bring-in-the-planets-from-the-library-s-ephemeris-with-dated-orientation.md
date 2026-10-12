---
id: T-048
title: Bring in the planets from the library's ephemeris with dated orientation
objective: O-014
status: done
depends_on: [{task: T-043, requires: clear}, {task: T-044, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o014-plan-2026-10-11}
lane: planets
planned_reads: [src/core/astronomyAdapter.ts, src/core/bodyOrientation.ts, src/core/bodies/index.ts, src/core/body.ts, src/assets/catalogue.ts, src/assets/bodies/earth.ts, src/app/BodyView.ts, docs/ASTRONOMY_VALIDATION.md, docs/DONOR_PROVENANCE.md, tests/fixtures/moon-horizons.json, tests/core.test.ts, docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md]
planned_writes: [src/core/astronomyAdapter.ts, src/core/iauRotation.ts, src/core/bodies/mercury.ts, src/core/bodies/venus.ts, src/core/bodies/mars.ts, src/core/bodies/jupiter.ts, src/core/bodies/index.ts, src/assets/bodies/mercury.ts, src/assets/bodies/venus.ts, src/assets/bodies/mars.ts, src/assets/bodies/jupiter.ts, src/assets/catalogue.ts, src/assets/textures/mercury-2k.jpg, src/assets/textures/venus-2k.jpg, src/assets/textures/mars-2k.jpg, tests/fixtures/planets-horizons-source.txt, tests/fixtures/planets-horizons.json, tests/planets.test.ts, tests/iauRotation.test.ts, docs/ASTRONOMY_VALIDATION.md, docs/DONOR_PROVENANCE.md]
---

# Bring in the planets from the library's ephemeris with dated orientation

## Outcome

Mercury, Venus, Mars and Jupiter are catalogued bodies: positions from the pinned astronomy library's VSOP87A model through one new adapter method, validated against JPL Horizons the way the Moon was; orientation from the IAU pole and prime-meridian model in a new core module; dimensions from the NASA fact sheets with equatorial and polar radii where flattening is visible; visuals from the donor's licensed textures (Mercury, Venus, Mars under CC BY 4.0 with attribution; Jupiter drawn with its material colour because its donor texture has no recorded source). Jupiter is drawn as a spheroid with its actual radii. Nothing mounts them yet except tests; the next Task composes Jupiter with Io.

## Astraeus Hypothesis

- **Capability tested:** that a new ephemeris and a new orientation model enter through the existing adapter and definition contracts with no change to `State`, `Trajectory` or the scene.
- **Contract reused:** `AstronomyAdapter` (one new method), `StateSourceBinding`, `CelestialBodyDefinition` with `accuracy`, `BodyVisual`, `TextureRef` with `AssetLicence`, the Horizons fixture method in `docs/ASTRONOMY_VALIDATION.md`.
- **Gap:** design A.4 items 3 and 4.
- **Generic change:** `planetPositionFromSunKm(planet, t)` on the adapter (VSOP87A heliocentric ecliptic J2000 in AU, converted to EQJ km inside the adapter with its frame and centre checked like the others); `src/core/iauRotation.ts` (pole RA/Dec and W(t) from the IAU Working Group report, data per body, quaternion through `quaternionFromMatrix`); planet definitions and visuals.
- **Evidence independent of any experience:** Horizons fixtures at six dates per planet with recorded maxima; IAU rotation against a published sub-Earth longitude for Mars and Jupiter at a stated date; a fake planet with fake coefficients through the same code paths.

## User Check

None required in this Task; the Jupiter look is in the next Task.

## Done When

1. `planetPositionFromSunKm` for the four planets returns EQJ km about the Sun; raw Horizons responses (target 199, 299, 499, 599, centre 500@10, geometric vectors, six dates spanning 1969–2030) are archived under `tests/fixtures/` like the Moon's; the maximum position error per planet is recorded in `docs/ASTRONOMY_VALIDATION.md` and in each definition's `accuracy.position`, with the validated date range as `accuracy.validUtc`.
2. `iauRotation.ts` builds a body-to-EQJ quaternion from published pole and W coefficients; tests against a published sub-Earth or central-meridian longitude for Mars and Jupiter within a stated tolerance; the data and its report citation are in each definition; limitations (no nutation terms, secular pole only) in `accuracy.orientationLimitations`.
3. Definitions carry mean, equatorial and polar radii (Jupiter, Mars, Venus: fact-sheet values; Mercury mean only), GM, `parentId: "sun"`, `orientation: "iau-rotation"`; the catalogue validates them; the layer-rule test still passes.
4. Visuals: Mercury, Venus, Mars `TextureRef`s with `AssetLicence` from the donor README (source, URL, CC BY 4.0, attribution, access date), files copied under `src/assets/textures/`; Jupiter has no texture and uses the donor's material colour, with a note in `docs/DONOR_PROVENANCE.md` that its texture awaits a source; `BodyView` draws Jupiter as a spheroid with independently mapped radii (test).
5. Gates pass; every browser script passes in a fresh run directory (no mounted change expected; record it).

## Context Files

`docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md` (C.1, C.3, Decision 2, E step 6, Gate D), `src/core/astronomyAdapter.ts`, `src/core/bodyOrientation.ts`, `src/core/bodies/index.ts`, `src/core/body.ts`, `src/assets/catalogue.ts`, `src/assets/bodies/earth.ts`, `src/app/BodyView.ts`, `docs/ASTRONOMY_VALIDATION.md`, `docs/DONOR_PROVENANCE.md`, `tests/fixtures/moon-horizons.json`, `tests/core.test.ts`.

## Design References

Design: Decisions (provider selection; Astronomy Engine rejected); `docs/ASTRONOMY_VALIDATION.md` (fixture method). Design document section G, E step 6, Gate D.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, PROV-01, PROV-02, TEST-01, TEST-03, STYLE-01, STYLE-06, STYLE-07, STYLE-10.

## Implementation Plan

1. Confirm the catalogue and `BodyView` spheroid support landed; REPLAN REQUIRED if not.
2. Fetch and archive the Horizons fixtures (API, same parameters as Spike 01, raw text kept); add the adapter method with frame and centre checks.
3. Write `iauRotation.ts` with the report's coefficients as data; tests.
4. Write the four definitions and visuals; copy the three licensed textures with their licence records; record Jupiter's texture gap.
5. Validation doc update; gates; browser scripts.

## Boundaries

No composition, scene or experience change; no Io; no rings; no Saturn or outer planets; no Jupiter texture; no new dependency. Velocities are not modelled for planets (recorded in limitations).

## Technical Verification

Focused tests during iteration; handoff runs the gates and every browser script. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor session o014-exec-T-048, 2026-10-12. Claims for a fresh Check to verify, not clearance.

### Per-criterion outcomes

1. Positions. `planetPositionFromSunKm` (src/core/astronomyAdapter.ts) returns EQJ km about the Sun for mercury, venus, mars, jupiter, via Orb VSOP87A and the `ecliptic-j2000` to `equatorial-j2000` transform with label checks. Raw Horizons responses (199, 299, 499, 599; centre 500@10; geometric vectors; ICRF; six dates, 1969-07-21 to 2030-06-01) are archived verbatim in tests/fixtures/planets-horizons-source.txt (curl against ssd.jpl.nasa.gov/api/horizons.api on 2026-10-12; each response preceded by a `==== QUERY ... ====` line naming the parameters, so it is four responses in one file, not one). Normalized: tests/fixtures/planets-horizons.json. Measured maxima (tests/planets.test.ts asserts targets): Mercury 30.4 km / 0.108 arcsec (range 1.7 km); Venus 50.1 km / 0.095 arcsec (0.9 km); Mars 95.8 km / 0.092 arcsec (3.5 km); Jupiter 1269.4 km / 0.325 arcsec (166.9 km). Recorded in docs/ASTRONOMY_VALIDATION.md and each definition's `accuracy.position`; `accuracy.validUtc` is 1969-07-21 to 2030-06-01. The compact default VSOP87A table was measured and rejected (errors 2,877 to 142,044 km), so the full series is registered (see drift).
2. Rotation. src/core/iauRotation.ts builds the body-to-EQJ quaternion from pole RA/Dec (per century) and W (per day). Constants: IAU 2015 report via NAIF pck00011.tpc (fetched 2026-10-12), exact lines archived in tests/fixtures/iau-pck-excerpt.txt; a test asserts the shipped numbers equal them. Horizons OBSERVER fixtures (tests/fixtures/planets-rotation-horizons-source.txt, .json; quantities 14 and 20): Jupiter sub-Earth west longitude max difference 0.0051 degrees (tolerance 0.02). Mars with the IAU 2009 constants (pck00010.tpc, in the same excerpt) 0.0028 degrees (tolerance 0.02), which shows Horizons uses the 2009 Mars constants. Mars with the shipped IAU 2015 constants 0.934 degrees (test: over 0.3, under 1.2); this is the size of the change between reports (pole moved ~1.5 degrees), not a code error, and it means the shipped Mars data is not itself confirmed by Horizons beyond that. Limitations (no periodic terms, TT for TDB) in `accuracy.orientationLimitations`. Citation is carried in `IauRotationElements.citation` beside the data (src/core/bodies/<planet>.ts).
3. Definitions. src/core/bodies/{mercury,venus,mars,jupiter}.ts: parent sun, orientation iau-rotation, GM from the Horizons physical-data header (22031.86855, 324858.592, 42828.375662, 126686531.9), radii from NASA NSSDC fact sheets fetched 2026-10-12: Mercury mean 2439.7 only; Venus 6051.8 (equatorial and polar both given, equal); Mars 3389.5/3396.2/3376.2; Jupiter 69911/71492/66854. Catalogue validates (createCatalogue); layer-rule/name-check tests pass.
4. Visuals. Mercury, Venus, Mars `TextureRef`s with `AssetLicence` (Solar System Scope, CC BY 4.0, attribution, access date 2026-10-12 = date the donor README was read; the SSS page itself was not opened), files copied byte-for-byte to src/assets/textures/{mercury,venus,mars}-2k.jpg (2048x1024). Jupiter: no texture, donor material colour #d4a97a; gap recorded in docs/DONOR_PROVENANCE.md. `drawnRadii` test: Jupiter equatorial 71492/6371 and polar 66854/6371, mapped independently.
5. Gates (all run after the final edit unless noted): `npm run typecheck` clean; `npm run build` clean (chunk-size warning); `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 30 files, 555 tests pass. Public build: `ASTRAEUS_PUBLIC_BUILD=1 npm run build` then `node tools/validate/public-build-assets.mjs`: ok true, 6 checked, no matches (the planet textures are licensed, not local-only; the local-only list is unchanged: earth, moon). The normal build was re-run afterwards. Browser: own vite on port 5199, PLAYWRIGHT_CORE donor playwright-core, fresh run directory docs/evidence/o014-t048-20261012T203410/ (one subdirectory and stdout.txt per script): earth-moon, showers, spike02, spike03, synthetic, synthetic-belt, synthetic-ring, precision, shell, anchor-labels; all exit 0 with `"errors": []`. anchor-labels first failed only because PLAYWRIGHT_CORE was missing from that shell; rerun with it passed. Vite stopped. No mounted change was expected and none was seen; earlier spike screenshots were not overwritten.

### Extra reads (logged)

- node_modules/@lizard-isana/orb/{package.json,usage.en.md,src/orb-planet.js,src/orb-vsop87a-registry.js}, src/types/orb.d.ts: to find the planet API and full-coefficient registration (reason: the Task names "the library's VSOP87A" without saying how it is exposed).
- src/core/{stateResolver,referenceCenters,sunCentredSources,trajectory,state,provenance,moonTrajectory}.ts, src/core/bodies/{earth,sun,moon}.ts, src/assets/{licence,visual}.ts, src/assets/bodies/{moon,sun}.ts, src/app/bodyDraw.ts, tests/nameCheck.test.ts, tests/assets.test.ts, tests/stateResolver.test.ts, tests/textureLicence.test.ts, tests/compositions.test.ts, tests/experiences.test.ts: patterns for the new files, and failing tests found after cataloguing four bodies.
- Donor: /home/user/code/planetary-explorer/public/textures/README.md, src/entities/{jupiter,mars,mercury,venus}.ts (material values).
- External, fetched 2026-10-12: JPL Horizons API (vectors, observer table, physical data); NASA NSSDC fact sheets (mercury, venus, mars, jupiter); NAIF pck00011.tpc and pck00010.tpc.
- C-015 observation 1 (resolver composes positions only, no velocity): planets need none here; no velocity is modelled and the definitions say so.

### Files changed

New: src/core/iauRotation.ts; src/core/bodies/{mercury,venus,mars,jupiter,planetRecords,planetTrajectory}.ts; src/assets/bodies/{mercury,venus,mars,jupiter}.ts; src/assets/textures/{mercury,venus,mars}-2k.jpg; tests/{planets,iauRotation}.test.ts; tests/planetFixtures.ts; tests/fixtures/{planets-horizons-source.txt,planets-horizons.json,planets-rotation-horizons-source.txt,planets-rotation-horizons.json,iau-pck-excerpt.txt}; docs/evidence/o014-t048-20261012T203410/.
Modified: src/core/astronomyAdapter.ts; src/core/bodies/index.ts; src/assets/catalogue.ts; src/types/orb.d.ts; docs/ASTRONOMY_VALIDATION.md; docs/DONOR_PROVENANCE.md; tests/assets.test.ts, compositions.test.ts, experiences.test.ts, stateResolver.test.ts, textureLicence.test.ts (their hard-coded three-body expectations and the use of "mars" as an uncatalogued example; behaviour unchanged).

### Limitations and unverified

- Mars's shipped IAU 2015 orientation is not confirmed by Horizons (Horizons uses 2009 constants for Mars); its constants are confirmed only against the NAIF kernel text. Mercury and Venus rotation were not compared with Horizons at all, only with the kernel text.
- Positions are sample maxima over six dates, not bounds; Jupiter's 1.3 thousand km is the largest. No velocity.
- The 2030 Horizons sample uses a predicted UT offset (labelled UT~).
- Texture licence is the donor README's statement; the Solar System Scope page was not opened. The Mercury `2k_mercury.jpg` and Venus `2k_venus_surface.jpg` files are taken as the donor says.
- Fact sheet radius for Mercury (2439.7) differs from Horizons' 2439.4.
- Bundle size: the full VSOP87A tables raise the JS bundle from 1,537.6 kB (458.8 kB gzip) to 2,938.7 kB (1,022.5 kB gzip), because the catalogue imports them although nothing mounts the planets yet. Lazy loading was not attempted (outside the boundaries).
- Not run: no Task Check (the orchestrator runs it).

### Context Log

Started T-048 (status in_progress, stage build; router task T-048); read Task, Context Files; fetched Horizons vectors and observer tables, fact sheets, NAIF kernels; found compact VSOP87A too coarse and switched to the full series; found Horizons Mars uses IAU 2009 constants and recorded both comparisons; implemented, then stage test, then audit; gates and browser scripts as above.


## Drift Notes

Record architecture deltas here; the integration Task (T-050) reconciles them into Design.md (each as reflected, or explicitly non-architectural, with a reason).

1. `AstronomyAdapter` gained two methods, not one: `planetPositionFromSunKm(planet, t)` and `daysSinceJ2000Tt(t)` (the IAU models count TT days; only the adapter may import Orb, and a UTC to TT table in core would duplicate the library's). Architectural (adapter contract); T-050.
2. The full VSOP87A coefficient series is registered by the adapter (`registerVSOP87A`, mutating Orb's module-level registry) because the compact default is off by tens of thousands of km. Costs about 1.4 MB raw (0.56 MB gzip) of bundle even though no experience mounts the planets. Architectural (provider choice and bundle cost); a lazy-loaded planet provider is a later option; T-050.
3. Rotation data sit beside each definition (`MARS_ROTATION` etc. in src/core/bodies/<planet>.ts, with a citation field) and `CelestialBodyDefinition` was not changed; `src/core/bodies/planetTrajectory.ts` is the one generic planet state source (placed under bodies/ so the name check needs no allowlist entry). Architectural (where rotation data live); T-050.
4. Horizons uses IAU 2009 constants for its Mars frame; the engine ships the 2015 report's. Recorded in ASTRONOMY_VALIDATION.md. Non-architectural (data provenance note).
5. Existing tests that assumed a three-body catalogue or used "mars" as an unknown id were updated. Non-architectural.
6. `CelestialBodyDefinition.accuracy.validUtc` for planets is the sampled range, as for the Moon.

## Completion

- 2026-10-12T10:00Z — Task Check C-022 CLEAR. `status: done` set by the orchestrator under the owner's explicit delegation in chat on 2026-10-11 ("I authorise you to move tasks to Done once you have checked and are satisfied"), actor {role: owner-delegate, session: o014-orchestrator-check-20261012}. Bundle-size observation (C-022 obs 1) raised with the owner.
