---
id: T-374
title: Hold the Earth and Moon positions to their real error
objective: O-093
status: planned
depends_on: []
check_waiver: {task: T-374, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T19:19:52Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: accuracy
planned_reads: [packages/astraeus/tests/fixtures/moon-horizons.json, packages/astraeus/tests/fixtures/moon-horizons-source.txt, packages/astraeus/tests/fixtures/sun-horizons.json, packages/astraeus/tests/fixtures/sun-horizons-source.txt, packages/astraeus/src/core/moonTrajectory.ts, packages/astraeus/src/core/astronomyAdapter.ts]
planned_writes: [packages/astraeus/tests/core.test.ts, packages/astraeus/src/core/bodies/moon.ts, packages/astraeus/tests/fixtures/scenePin.json]
---

# Hold the Earth and Moon positions to their real error

## Outcome

The Moon and Sun-from-Earth accuracy checks allow about the measured error with a stated margin instead of 100 km and 1–2 arcminutes, a deliberate 69 s time slip now fails them, and the Moon's provenance says what its series cannot do (AH-46: Claude section G.3 `audits/2026-11-21_anthropic_claude-fable-5-2_auditfindings.md:283-284`, F-20).

## User Check

None visual. The Moon's info card lists one more known limitation (the time-scale approximation and its size); no layout change.

## Done When

- The current maximum errors are measured on the existing eight-sample fixtures and recorded: angle (arcseconds), radial (km) and full vector difference (km) for the Moon (`moon-horizons.json`) and for the Sun seen from Earth (`sun-horizons.json`). The Claude audit's probe found about 6 km for the Moon and 4.2 km for Earth.
- `tests/core.test.ts` cases "matches offline geometric JPL Moon vectors within the unchanged targets" and "matches offline geometric JPL Sun vectors": thresholds become named constants set to the measured maximum times a stated margin (proposal: 2×, rounded up to a whole km and whole arcsecond), each with a comment naming the measurement date and value. A full vector-difference bound (km) is added beside the radial and angle bounds. The Moon case's title drops "within the unchanged targets". The fixtures, sample loops and helpers stay as they are (only the threshold lines and the title change).
- A new case in the same describe block evaluates the Moon at each fixture time plus 69 s and asserts the vector error exceeds the new bound for at least one sample (the slip the audit says passes today); it is shown to pass the old 100 km bound first (recorded), proving the tightening has teeth.
- `core/bodies/moon.ts` `MOON_EPHEMERIS`: `provenance.accuracy` states the checked maximum and sample range instead of "within the project's acceptance targets"; `knownLimitations` gains one sentence: the series uses its own ΔT approximation (about 4.7 s off in 2024, about 5 km along track) and steps by up to about 0.1 km at month boundaries, so the Moon's path is not exactly continuous; and the series has no stated validity range beyond the 2022–2025 comparison samples. Wording is checked against the measured numbers from this Task, not copied blindly from the audit; if a number cannot be reproduced, say so in the evidence and use only what was measured.
- `positionLimitations` picks the new sentence up through its existing filter (`moon.ts:68`); if `tests/fixtures/scenePin.json` pins the Moon's card text, regenerate it and show the diff holds only the Moon's limitation and accuracy text.
- Horizons planet fits stay at 1 km, untouched (Objective).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/tests/core.test.ts` (describe "provider trajectories and scale policies", lines ~84-128)
- `packages/astraeus/src/core/bodies/moon.ts` (`MOON_EPHEMERIS`, `MOON.accuracy`)
- `packages/astraeus/src/core/moonTrajectory.ts` (`stateAt`)
- `packages/astraeus/src/core/astronomyAdapter.ts` (Moon and Sun reads, ΔT handling)
- `packages/astraeus/tests/fixtures/moon-horizons-source.txt`, `sun-horizons-source.txt` (header lines only: sample dates and frame)

## Design References

`.savepoint/Design.md` under `Core layers and demos` (validity and sampled accuracy ranges are distinct).

## Guardrails

PROV-01, DATA-01, TEST-01, TEST-02, TEST-03.

## Implementation Plan

1. Measure the three error figures for both cases; record them.
2. Write the 69 s slip case; show it passes at 100 km.
3. Set the named thresholds; add the vector bound; retitle.
4. Update the Moon's provenance text; regenerate the scene pin only if it moves.
5. Focused tests, gates.

## Boundaries

No change to the Moon or Sun model, to any fixture file, or to the three TT−UTC models (unifying them is not in the Success Conditions). No new Horizons samples. Thresholds are set from the existing fixtures only.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/core.test.ts packages/astraeus/tests/scenePin.test.ts packages/astraeus/tests/positionLimitations.test.ts` (O-083's card-limitations test). Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

For Design reconciliation (`Core layers and demos`): Moon and Earth accuracy bounds as measured; the Moon's ΔT approximation is a published limitation.
