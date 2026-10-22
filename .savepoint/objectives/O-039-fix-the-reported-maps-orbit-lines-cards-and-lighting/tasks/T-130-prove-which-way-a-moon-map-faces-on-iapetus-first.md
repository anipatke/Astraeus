---
id: T-130
title: Prove which way a moon map faces, on Iapetus first
objective: O-039
status: done
check_waiver:
  task: T-130
  reason: "Owner skipped the optional Task Check for the O-039 overnight run ('Skip them, one big check at the end'); the Full Objective Check covers it."
  actor: {role: owner, session: 8d73d3f8}
  recorded_at: '2026-10-22T10:40:06Z'
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

Step 1 (code read): `applyOrientation` (`src/app/sceneLayout.ts`) sets the mesh quaternion to the EQJ-to-render conjugate of the IAU orientation, then multiplies by a rotation of `textureYawRad` about +Y. Conjugating by the render axes (x, z, -y) means mesh local +X = body +X = longitude 0 and mesh local -Z = body +Y = 90E, matching `latLonToXYZ` (lon 0 -> +X, lon 90 -> -Z) and the Three.js sphere UV centre on +X. Markers are placed in the sphere's own frame, so they turn with the mesh. The audit's assumption holds; no REPLAN.

Changes: `sphere()` in `src/assets/bodies/planetSystemMaps.ts` takes `textureYawRad = 0`; Iapetus passes `Math.PI`; all other bodies unchanged. New `tests/mapOrientation.test.ts` (3 tests). `docs/DONOR_PROVENANCE.md` Texture orientation records the proof.

Looked-up longitudes (USGS Gazetteer of Planetary Nomenclature, https://planetarynames.wr.usgs.gov/SearchResults?Target=76_Iapetus, read 2026-10-22; planetographic, +West, 0-360): Cassini Regio (feature 1047) 28.10 S, 92.60 W; Engelier (feature 14463) 40.50 S, 264.70 W. Cross-check only: `data/bodies/iapetus/features.json` stores 87.4 and -82 (marker frame 180 - W gives 87.4 and -84.7; Engelier is 2.7 degrees off in the donor data, inside the test's 3 degree tolerance).

Orientation result (Iapetus about Saturn at 2016-06-01, inside the loaded fit window): dark centre (lat 0, marker lon 87.4) is 0.83 degrees from the orbital velocity with yaw PI and 179.17 degrees from it with yaw 0.

Tests: `tests/mapOrientation.test.ts` "uses yaw PI for Iapetus", "points the drawn dark centre along the orbital velocity with yaw PI, and backwards with yaw 0", "puts two gazetteer features on the map column the marker frame expects": 3 passed.

Gates: `npm run lint` pass; `npm run typecheck` pass; `flock /tmp/astraeus-build.lock npm run build` pass (chunk size warning only); `npm test` (junit) 93 files, 1290 passed, 1 skipped.

Owner look on preview (2026-10-22T10:42:04Z, localhost:5490, Saturn, Iapetus): "Iapetus looks right, go ahead" (owner, session 8d73d3f8). This releases T-131. No browser scripts, no screenshots.

## Drift Notes

Design notes for map orientation are deferred to T-137 (owner walk-through and Design notes).
