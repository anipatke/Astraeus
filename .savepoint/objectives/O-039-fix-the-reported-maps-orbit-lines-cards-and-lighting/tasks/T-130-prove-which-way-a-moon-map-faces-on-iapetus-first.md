---
id: T-130
title: Prove which way a moon map faces, on Iapetus first
objective: O-039
status: planned
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o039-planning-20261022}
lane: maps
planned_reads: [docs/evidence/map-audit-20261021/report.md, docs/DONOR_PROVENANCE.md, src/assets/bodies/planetSystemMaps.ts, src/assets/visual.ts, src/app/BodyMesh.tsx, src/app/FeatureMarkers.ts, data/bodies/iapetus/features.json, data/bodies/iapetus/map.json, tests/assets.test.ts]
planned_writes: [src/assets/bodies/planetSystemMaps.ts, tests/mapOrientation.test.ts, docs/DONOR_PROVENANCE.md]
---

# Prove which way a moon map faces, on Iapetus first

## Outcome

It is proven, for a moon other than Earth's, that the globe puts map longitude 0 on mesh +X: with Iapetus turned half a revolution, its dark hemisphere (centred near 90 W) leads in its orbit, and the owner confirms it on the preview. Only then may any other map turn change (I-057).

## User Check

On the preview (localhost:5490), open Saturn, focus Iapetus and play time: the dark half faces the direction Iapetus is moving. Say whether it looks right before the next step runs.

## Done When

- `sphere()` in `planetSystemMaps.ts` takes a yaw argument defaulting to 0; Iapetus uses `Math.PI`; every other body is unchanged.
- A node test (`tests/mapOrientation.test.ts`) builds Iapetus's rendered orientation at one fixed time and shows that the surface point at 90 W points along Iapetus's velocity about Saturn (within about 20 degrees), and that with yaw 0 it would point backwards.
- The same test checks two looked-up Iapetus feature longitudes (for example Cassini Regio's centre and Engelier crater, values looked up and cited in Technical Evidence, not quoted from memory) land on the right map column.
- `docs/DONOR_PROVENANCE.md` Texture orientation section records the Iapetus proof.
- The owner's verdict on the preview is recorded. Configured gates pass.

## Context Files

`docs/evidence/map-audit-20261021/report.md`, `docs/DONOR_PROVENANCE.md`, `src/assets/bodies/planetSystemMaps.ts`, `src/assets/visual.ts`, `src/app/BodyMesh.tsx`, `src/app/FeatureMarkers.ts`, `data/bodies/iapetus/features.json`, `data/bodies/iapetus/map.json`, `tests/assets.test.ts`.

## Design References

Design: Components/Codebase Map rows for `src/assets/` and `planetSystemMaps.ts`; Asset architecture (O-014).

## Guardrails

ARCH-01, ARCH-02, STYLE-07, STYLE-10, TEST guardrails as listed in `.savepoint/Guardrails.md`.

## Implementation Plan

1. Read how `BodyMesh.tsx` applies `textureYawRad` and the body's IAU rotation; confirm the mesh +X = longitude 0 claim in code. If the rotation path differs from the audit's assumption, stop and return REPLAN REQUIRED with what you found.
2. Add the yaw argument to `sphere()`; set Iapetus to `Math.PI`.
3. Write the orientation test from the body's resolved rotation and its state about Saturn.
4. Look up the two feature longitudes (USGS Gazetteer of Planetary Nomenclature) and cite them.
5. Ask the owner to look on the preview; record the verdict.

## Boundaries

Iapetus only. No other body's turn, no Titan conversion, no browser sets, no screenshots.

## Technical Verification

Focused node test during iteration; configured lint, typecheck, build and test gates at handoff. Owner's look on the preview. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Design notes for map orientation are deferred to T-137 (owner walk-through and Design notes).
