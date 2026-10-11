---
id: T-048
title: Bring in the planets from the library's ephemeris with dated orientation
objective: O-014
status: planned
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

Pending execution.

## Drift Notes

Record architecture deltas here; the integration Task reconciles them into Design.
