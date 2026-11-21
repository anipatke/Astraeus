---
id: O-082
title: Orbit maths that converge and agree on time
status: planned
depends_on: []
release: G-024
priority: critical
rank: 1
lanes: [{key: solver, title: One Kepler solver}, {key: epoch, title: Epoch time scale}]
---

# O-082: Orbit maths that converge and agree on time

## Outcome

A body built from orbital elements is placed correctly for every eccentricity the API accepts (0 ≤ e < 1) and for every equivalent way of writing its epoch: the core has one convergent CPU Kepler solver (the GPU solver and its Float32 twin stay), and the epoch is converted to one time scale before the mean anomaly is computed.

## Why

AH-01 (Codex F02, Claude F-01, Gemini SCI-10/S-05): `core/keplerAnomaly.ts` runs 50 fixed Newton steps with no convergence test; e = 0.999 gave a 50 million km radial error, and from e ≈ 0.995 positions can land on the wrong side of the orbit under an accuracy badge. AH-02 (Codex F04, Gemini SCI-05): `core/elementsBody.ts:229` subtracts a TDB perihelion date from an epoch JD in its own scale; the same instant written as UTC and as TT gave positions 2,154 km apart. AH-08: the two-body adapter is built with default masses.

## Success Conditions

- One CPU elliptic Kepler solver in `core/`, used by every core caller (`keplerAnomaly`, `keplerElements`, `sunCentredSources`, `listedOrbitGroup`); a table test against bisection for e ∈ {0, 0.5, 0.9, 0.99, 0.995, 0.999, 0.9999} over many mean anomalies, including large unwrapped values.
- Equivalent UTC, TT and TDB epochs give the same state (test independent of the mean-anomaly branch).
- The elements body's two-body model uses the centre's own GM.
- Existing Horizons and group tests unchanged and green; the GPU solver's CPU twin agreement unchanged; run on Node 22 and 24.

## Architectural Considerations

Science core only (`src/core/`); ARCH-04. No public API change. Scientific tolerances are not loosened.

## Boundaries

**In scope:**
- The core solvers, the elements-body epoch handling, their tests.

**Out of scope:**
- The GLSL solver and its twin; the Apollo tool's propagator; hyperbolic orbits; unit types (O-093).

## Decisions

- Owner 2026-11-21 (plan-g024-20261121): design confirmed, "Confirm, write the tasks".
- Planner, from targeted evidence: the shared solver keeps the name and file `core/keplerAnomaly.ts` (callers `elementsBody`, `satelliteMeanElements`, `bodies/io` keep their import) and gains an exported eccentric-anomaly solve used by `listedOrbitGroup` and `sunCentredSources`; `eccentricAnomalyRad` stays exported from `listedOrbitGroup` as a re-export because `astraeus-demo-showers/tests/keplerShader.test.ts` imports it there. The per-member fill loop in `keplerElements.fillKeplerRangeKm` (already convergence-tested, Danby-style start) may call the shared solve only if a measured fill of 110,000 members is not slower by more than 5%; otherwise it stays inline and the bisection table test covers it too.
