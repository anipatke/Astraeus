---
id: I-092
title: The Apollo reconstruction tool keeps its own copy of the Moon rotation constants
type: drift
status: open
source:
  kind: check
  check: C-117
  actor: {role: checker, session: c117-improvements-check-20261024}
  at: '2026-10-24T03:45:00Z'
checks: [C-117]
guardrail_ids: [STYLE-07, ARCH-05]
severity: low
history:
  - at: '2026-10-24T03:45:00Z'
    actor: {role: checker, session: c117-improvements-check-20261024}
    kind: observed
    note: 'Found while verifying I-091. Non-blocking for C-117: the runtime has one definition; the duplicate lives in an offline tool.'
    check: C-117
---

# I-092: The Apollo reconstruction tool keeps its own copy of the Moon rotation constants

## Summary

Since I-091 the engine owns the Moon's IAU rotation model (`MOON_ROTATION`, `packages/astraeus/src/core/bodies/moon.ts`, cited as the 2009 report via NAIF pck00011). The Apollo 11 reconstruction tool still carries its own copy of the same pole, prime meridian and E1 to E13 terms (`packages/astraeus-demo-apollo11/tools/apollo11/frames.ts` lines 89-135, `LIBRATION_ANGLES`, `RIGHT_ASCENSION_TERMS`, `DECLINATION_TERMS`, `PRIME_MERIDIAN_TERMS`, `lunarOrientation`), cited as "Archinal et al. 2018", with per-day angle rates and the d² term the engine leaves out. Two copies of one model can drift apart silently (STYLE-07; ARCH-05 asks that a body's orientation be defined once in `src/core/`). The landing-site offset in `validation.json` (0.01 km) measures only the difference between these two copies.

## Evidence

C-117 matrix row "I-091 one definition (ARCH-05)". `tools/apollo11/validation.ts` already imports `MOON_ROTATION` and `iauOrientation` for the offset, while `lunarFixedToEqj` in `frames.ts` (used to convert the NASA selenographic anchors) uses the private copy.

## Proof Needed

`frames.ts` builds its lunar frame from the engine's `MOON_ROTATION` (through `iauBodyToEqjMatrix` or equivalent), or the owner records why the offline tool keeps a separate copy; the reconstruction re-runs with anchors still within their published residuals and the regenerated data differing only by the stated amount; Apollo suites pass.
