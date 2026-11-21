---
id: T-342
title: Make an orbit's start date mean one instant in any time scale
objective: O-082
status: planned
depends_on: []
check_waiver: {task: T-342, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T11:00:13Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g024-20261121}
lane: epoch
planned_reads: [packages/astraeus/src/core/timeScale.ts, packages/astraeus/src/core/twoBodyAdapter.ts, packages/astraeus/tests/planetAccuracyFlybys.test.ts]
planned_writes: [packages/astraeus/src/core/elementsBody.ts, packages/astraeus/tests/elementsEpoch.test.ts]
---

# Make an orbit's start date mean one instant in any time scale

## Outcome

A body built from orbital elements gives the same state whether its epoch is written in UTC, TT or TDB for the same instant, and its two-body motion uses the given centre's mass (AH-02, AH-08).

## User Check

None visual. The same orbit with its epoch written as UTC and as the equivalent TT gives positions within a metre of each other instead of 2,154 km apart.

## Done When

- `buildElementsBody` converts the epoch to TDB (through `core/timeScale.ts`) before subtracting `perihelionJdTdb`, so the mean anomaly and `periapsisUtcMs` are computed in one scale.
- The two-body adapter receives the centre's `gmKm3S2`, so mean motion and propagation use the same mass.
- New `tests/elementsEpoch.test.ts`: Codex's probe case (a = 1 AU, e = 0.2, perihelion JD 2451500 TDB; epoch JD 2451545 UTC versus JD 2451545 + 64.184/86400 TT with `ttMinusUtcSeconds: 64.184`) gives states within 1 m; the same equivalence for a TDB epoch and for the `meanAnomalyDeg` branch; it fails against the current `elementsBody.ts` (show it).
- Existing elements-body, Perseids parent-body and Horizons tests unchanged and green.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/elementsBody.ts` (around `parseEpoch`, `epochUtcMsOf`, `buildElementsBody`)
- `packages/astraeus/src/core/timeScale.ts` (the UTC/TT/TDB conversions)
- `packages/astraeus/src/core/twoBodyAdapter.ts` (adapter options)
- `.savepoint/objectives/O-082-orbit-maths-that-converge-and-agree-on-time/Objective.md`

## Design References

`.savepoint/Design.md` under `Architecture`.

## Guardrails

ARCH-04, PROV-01, API-04, TEST-01..04.

## Implementation Plan

1. Write the equivalence test first and show the 2,154 km gap.
2. Convert the epoch once to TDB seconds/JD for the anomaly computation; keep `epochUtcMs` for the clock.
3. Pass the centre GM to the adapter.
4. Run elements-body and Horizons suites, then the gates.

## Boundaries

No change to the public elements record schema, its validation ranges or the solver (the other Task). Pre-1972 civil time limits stay as documented.

## Technical Verification

Focused tests while iterating; Task handoff gates. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
