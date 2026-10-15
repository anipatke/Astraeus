---
id: T-052
title: Draw a group from a list of measured orbits
objective: O-011
status: planned
depends_on: [{task: T-051, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o011-replan-i025-2026-10-13}
lane: stream-data
planned_reads: [src/core/pointGroup.ts, src/core/orbitGroup.ts, src/core/twoBodyAdapter.ts, src/core/provenance.ts, src/app/PointsView.ts, src/app/experienceDefinition.ts, tests/orbitGroup.test.ts, tests/pointsLayer.test.ts, docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md]
planned_writes: [src/core/listedOrbitGroup.ts, tests/listedOrbitGroup.test.ts, src/synthetic/syntheticListedDefinition.ts, tools/validate/browser-synthetic-listed.mjs]
---

# Draw a group from a list of measured orbits

## Outcome

A generic `PointGroup` built from a list of per-member orbits, each with its own elements, epoch and source record id, instead of one base orbit with a random spread. Each member's orbit is measured, but its position along that orbit is not (owner decision 2026-10-13, Objective.md "placing measured members"): the group places each member at a deterministic, evenly spread mean anomaly at a stated reference time, marked `illustrative` in provenance, and propagates it by two-body motion about its centre to the requested time, in one batch fill, as fast as the existing orbit group. Each member's `State` carries the record it came from. It is proven on a made-up list and drawn by the existing points layer, with no shower naming.

## Astraeus Hypothesis

- **Capability tested:** that measured populations (meteoroids, asteroids, debris) enter through the existing group contract, so a measured stream needs no shower-specific code.
- **Contract reused:** `PointGroup` (`fillPositionsKm`, `stateAt`), `TwoBodyAdapter.propagateMemberInto`, `Provenance`, `PointsView`.
- **Gap:** `createOrbitGroup` only invents members around one base orbit (`src/core/orbitGroup.ts`, uniform spread).
- **Generic change:** `createListedOrbitGroup({ id, center, plane, members: [{ recordId, epochUtcMs, elements }], phase: { referenceUtcMs, seed?, concentration?: { around: <a Trajectory, e.g. a parent body>, fraction, widthDeg } }, bounds?, provenance })`. Members are validated (finite, bound, `e < 1`), with the rejection rule from the research record. A per-member `recordId` is readable from `stateAt`.

## User Check

None required. The owner may open the made-up listed group and see dots following their own orbits.

## Done When

1. `createListedOrbitGroup` fills positions for every member at a time; each member equals a single-member `createTwoBodyTrajectory` with the same elements and epoch to 1e-6 km (independent oracle); `stateAt(i)` reports `recordId`.
2. Validation names the member and field for non-finite, unbound or hyperbolic elements, empty lists and duplicate record ids.
3. Phase rule (elements carry no anomaly: a, e, i, ω, Ω): members' mean anomalies at the reference time are evenly spread and deterministic; each member's drawn path lies on its own measured ellipse (relative distance from the analytic ellipse < 1e-6 at five times); provenance marks the along-orbit position `illustrative` and the elements measured. The epoch is kept as the record's time, not used to place the dot. With the optional `concentration` (owner decision 2026-10-13, clump near the parent), the stated fraction of members' mean anomalies cluster within `widthDeg` of the reference body's mean anomaly at the reference time (test on a made-up parent: fraction within the width is as stated ± sampling tolerance; the rest stay evenly spread; deterministic), and provenance marks the concentration as a model.
4. Performance: 30,000 members fill in under the frame budget measured by `FrameStats` (record the figure); same input gives bit-identical output.
5. A made-up listed experience (`src/synthetic/`) mounts with the points layer; `browser-synthetic-listed.mjs` passes at 1280×800 and 390×844 with zero console errors; the name check passes.
6. Gates pass; every browser script passes in a fresh run directory.

## Context Files

`src/core/pointGroup.ts`, `src/core/orbitGroup.ts`, `src/core/twoBodyAdapter.ts`, `src/core/sunCentredSources.ts`, `src/core/provenance.ts`, `src/app/PointsView.ts`, `src/app/experienceDefinition.ts`, `src/synthetic/syntheticRingDefinition.ts`, `tests/orbitGroup.test.ts`, `tests/pointsLayer.test.ts`, `tools/validate/browser-synthetic-ring.mjs`.

## Design References

Design: Interfaces and Data Flow (groups and the points layer); Guardrails ARCH-03.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, PROV-01, TEST-01, TEST-03, STYLE-01, STYLE-05, STYLE-07.

## Implementation Plan

1. Confirm the group contract and `TwoBodyAdapter` batch path; REPLAN REQUIRED if per-member epochs need a contract change.
2. Write `createListedOrbitGroup` beside `createOrbitGroup`, sharing the propagation helper.
3. Tests per Done When, with single-member trajectories as the oracle.
4. A made-up listed fixture and its browser script; run gates and every browser script.

## Boundaries

No real CAMS data here (T-038 loads it). No change to `createOrbitGroup`'s behaviour or to `State`.

## Technical Verification

Focused tests, then the configured gates and every browser script in a fresh run directory. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; T-040 reconciles them.
