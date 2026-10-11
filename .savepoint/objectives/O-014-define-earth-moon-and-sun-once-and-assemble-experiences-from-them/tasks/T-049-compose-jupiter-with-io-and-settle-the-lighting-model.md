---
id: T-049
title: Compose Jupiter with Io and settle the lighting model
objective: O-014
status: planned
depends_on: [{task: T-047, requires: clear}, {task: T-048, requires: clear}]
owner_validation: {required: true}
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

Pending execution.

## Drift Notes

Record architecture deltas here, including the lighting measurement and choice; the integration Task reconciles them into Design.
