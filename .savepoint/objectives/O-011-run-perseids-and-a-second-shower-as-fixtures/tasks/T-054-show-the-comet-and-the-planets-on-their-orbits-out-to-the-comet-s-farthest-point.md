---
id: T-054
title: Show the comet and the planets on their orbits, out to the comet's farthest point
objective: O-011
status: planned
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

Pending execution.

## Drift Notes

Record architecture deltas here; T-040 reconciles them.
