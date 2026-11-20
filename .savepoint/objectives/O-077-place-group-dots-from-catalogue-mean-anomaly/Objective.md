---
id: O-077
title: Place group dots from catalogue mean anomaly
status: in_progress
depends_on: []
release: G-021
priority: high
rank: 1
last_check: C-189
---

# O-077: Place group dots from catalogue mean anomaly

## Outcome

`GroupOrbitInput.meanAnomalyDeg` (optional, degrees at the orbit's own `time`) makes a group "measured-phase": each dot sits at its catalogue position, advanced by two-body motion, and the group card keeps the caller's `sourceType` with a measured note and limit. Without it, groups are byte-for-byte as in 0.9.2.

## Why

G-021: the Asteroid Belt app needs ~110,000 real asteroid positions as point groups; illustrative placement breaks its science rules.

## Success Conditions

- All or none: every orbit gives a finite `meanAnomalyDeg` (wrapped to 0–360) → measured-phase; none → unchanged; a mix throws `bad-group` naming the first orbit without one; non-finite throws `bad-group`.
- Measured placement: `M_ref = M_epoch + n·(referenceUtcMs − epochUtcMs)/1000`, `n = sqrt(GM/a³)` with the same GM the group propagates with (`gravitationalParameterOf(adapter, center)`), wrapped to 0–2π, then `trueAnomalyFromMeanRad` as now. Absent `time` → epoch = reference time.
- `seed` or `clump` with measured-phase throws `bad-group` with a clear message.
- Card and `scene.groups[].provenance` agree: measured-phase keeps the caller's `sourceType`; a measured phase note replaces PHASE_NOTE and a measured placement limit replaces PLACEMENT_LIMIT; MOTION_LIMIT kept. Illustrative groups unchanged (exact-string test).
- `ListedOrbitGroup.meanAnomalyDegAt(index)` returns the real reference-time value for a measured group.
- Ceres (JPL SBDB) at epoch and epoch + 1 year matches an independent two-body calculation within 1 km and agrees with `addBodyFromElements` within a stated GM-difference tolerance; quarter-period advance; wrap; determinism and order independence; a 110,000-orbit smoke test with build and fill times recorded as measurement.
- README `addGroup` row and "Groups of dots" wording, CHANGELOG entry for the proposed version (0.9.3 after the owner's 2026-11-20 choice; first 0.10.0), no version bump, API lock and doc comments updated; `bad-group` reused (no error code change); configured gates plus `check:engine-alone` and `check:pack` pass; a packed tarball is reported for the belt app.

## Architectural Considerations

- Public API rules (Design "Public API shape", Guardrails API-01..07): additive optional field, existing `bad-group` code, units in field names (`Deg`).
- Core stays the owner of placement (`createListedOrbitGroup`); `api/group.ts` validates and passes through. Typed arrays for per-member anomalies; no per-member allocations added to the new path.
- Meteor Showers relies on illustrative groups: their card text must not change.

## Decisions

- Owner 2026-11-20: new Goal G-021, version 0.10.0 proposed in the CHANGELOG; the owner bumps and publishes.
- Owner 2026-11-20, after C-189: "yes, make it 0.9.3" (additions only; data peers stay `>=0.9.0 <0.10.0`). CHANGELOG heading changed; no code change.
- Owner 2026-11-20: the single Task's optional Task Check is waived; the mandatory Full Objective Check runs once, by a fresh checker session.
- Planner: the measured card keeps the caller's `accuracy` text unchanged (no "illustrative" clause); only `notes` gains the measured phase note.

## Boundaries

**In scope:**
- `packages/astraeus/src/api/group.ts`, `packages/astraeus/src/core/listedOrbitGroup.ts`, their tests, README, CHANGELOG, API lock.

**Out of scope:**
- Per-dot colour/size, member picking, member orbit lines, perturbations; Meteor Showers or belt app changes; version bump and publishing.
