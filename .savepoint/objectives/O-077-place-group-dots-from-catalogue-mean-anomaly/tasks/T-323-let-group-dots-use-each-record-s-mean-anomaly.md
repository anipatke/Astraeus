---
id: T-323
title: Let group dots use each record's mean anomaly
objective: O-077
status: in_progress
stage: build
depends_on: []
check_waiver: {task: T-323, reason: 'Owner chose "Skip the step check (Recommended)" for the single build step of O-077; the mandatory Full Objective Check covers the same diff.', actor: {role: owner, session: plan-g021-20261120}, recorded_at: '2026-11-20T08:09:59Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g021-20261120}
planned_reads: [packages/astraeus/src/api/group.ts, packages/astraeus/src/core/listedOrbitGroup.ts, packages/astraeus/tests/listedOrbitGroup.test.ts, packages/astraeus/tests/publicApiGroup.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/src/api/group.ts, packages/astraeus/src/core/listedOrbitGroup.ts, packages/astraeus/tests/listedOrbitGroup.test.ts, packages/astraeus/tests/publicApiGroup.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
---

# Let group dots use each record's mean anomaly

## Outcome

`addGroup` orbits may carry `meanAnomalyDeg`; a group where every orbit does places each dot at its real catalogue position (O-077 Success Conditions), and illustrative groups are unchanged.

## User Check

None required; proven by Node tests. The belt app tests the packed tarball separately.

## Done When

Every O-077 Success Condition has named test evidence; configured gates plus `npm run check:engine-alone` and `npm run check:pack` pass; `npm run api:lock` updated; tarball path, build time and one full fill time for 110,000 orbits recorded below.

## Context Files

`packages/astraeus/src/api/group.ts`, `packages/astraeus/src/core/listedOrbitGroup.ts`, `packages/astraeus/tests/listedOrbitGroup.test.ts`, `packages/astraeus/tests/publicApiGroup.test.ts`, `packages/astraeus/README.md` under the addGroup row and "Groups of dots", `packages/astraeus/CHANGELOG.md` (top section only), `docs/agents/build.md`.

## Design References

`.savepoint/Design.md` under "Public API shape (G-016, owner 2026-11-01)".

## Guardrails

API-01..API-07, TEST rules, STYLE (advisory).

## Implementation Plan

1. Core: optional `meanAnomalyDeg` on `ListedMember`; all-or-none check; measured branch computing M_ref into a Float64Array with GM from `gravitationalParameterOf`; reject seed/concentration with measured; conditional `listedGroupProvenance`.
2. API: field and doc comments; validation in `checkOrbits`/`planGroup` (finite, all-or-none naming first missing, no seed/clump); pass through in `buildGroupLayer`; conditional card provenance and limitations.
3. Tests per O-077 (Ceres independent calculation, addBodyFromElements agreement, quarter period, wrap, errors, card strings, determinism/order, 110k smoke with timings).
4. README, CHANGELOG 0.10.0 (proposed), `npm run api:lock`; gates; `npm run build:packages` and `npm pack` of the built package.

## Boundaries

O-077 Boundaries. No new error code; no change to illustrative output.

## Technical Verification

Focused vitest during iteration; configured gates, `check:engine-alone`, `check:pack` at handoff. Evaluated later by the Full Objective Check (`agent-skills/references/check-method.md`).

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
