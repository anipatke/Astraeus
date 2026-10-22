---
id: T-131
title: Turn the other moon maps and put Titan's places on their terrain
objective: O-039
status: planned
depends_on: [{task: T-130, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o039-planning-20261022}
lane: maps
planned_reads: [docs/evidence/map-audit-20261021/report.md, src/assets/bodies/planetSystemMaps.ts, src/assets/bodies/galileanMoons.ts, src/experiences/planets/planetDefinition.ts, src/experiences/planets/surfacePlace.mjs, src/experiences/planets/surfacePlace.d.mts, data/bodies/titan/map.json, data/bodies/titan/features.json, tests/mapOrientation.test.ts, tests/featureMarkers.test.ts]
planned_writes: [src/assets/bodies/planetSystemMaps.ts, src/assets/bodies/galileanMoons.ts, src/experiences/planets/planetDefinition.ts, src/experiences/planets/surfacePlace.mjs, src/experiences/planets/surfacePlace.d.mts, tests/mapOrientation.test.ts, docs/DONOR_PROVENANCE.md]
---

# Turn the other moon maps and put Titan's places on their terrain

## Outcome

Europa, Callisto, Pluto, Tethys, Dione, Rhea and Titan face the right way in the sky (half a revolution), Ganymede loses the turn it no longer needs, and Titan's tagged places are converted from stored west longitudes as they load, so they sit on their terrain (I-057).

## User Check

On the preview, look at Titan (Xanadu's bright patch under its marker, Huygens landing site on the dark plains), Ganymede and one Saturn moon. Say whether places sit on their terrain.

## Done When

- Turns as the audit measured: `Math.PI` for Europa, Callisto, Pluto, Tethys, Dione, Rhea, Titan; 0 for Ganymede; all others unchanged.
- Titan's places are converted when loaded (shown longitude = 180 − stored west value), keyed by the map record's convention, not a Titan name check in shell code; `data/bodies/titan/features.json` is byte-for-byte unchanged.
- `tests/mapOrientation.test.ts` gains one case per changed body pinning its turn and checking two or three looked-up feature longitudes against the map column; Titan's case checks Xanadu, Huygens landing site and Ontario Lacus. Every longitude used is looked up (USGS Gazetteer) and cited, not quoted from memory.
- `docs/DONOR_PROVENANCE.md` records the turns and the Titan conversion. Owner verdict recorded. Configured gates pass.

## Context Files

`docs/evidence/map-audit-20261021/report.md`, `src/assets/bodies/planetSystemMaps.ts`, `src/assets/bodies/galileanMoons.ts`, `src/experiences/planets/planetDefinition.ts`, `src/experiences/planets/surfacePlace.mjs`, `src/experiences/planets/surfacePlace.d.mts`, `data/bodies/titan/map.json`, `data/bodies/titan/features.json`, `tests/mapOrientation.test.ts`, `tests/featureMarkers.test.ts`.

## Design References

Design: Components/Codebase Map rows for `data/planets/`, `src/experiences/planets/` and `planetSystemMaps.ts`.

## Guardrails

ARCH-01, STYLE-07, STYLE-09, STYLE-10, DATA guardrails as listed in `.savepoint/Guardrails.md`.

## Implementation Plan

1. Confirm the previous step's proof is recorded and the owner accepted Iapetus; otherwise stop.
2. Apply the turns; extend the test per body.
3. Find where feature longitudes become marker positions; add the convention-driven conversion there, reading the Titan map record's convention field.
4. Look up and cite the Titan reference longitudes; pin them in the test.
5. Ask the owner to look on the preview; record the verdict.

## Boundaries

No edits to donor data files; no map file changes; no Venus work (its own step); no browser sets.

## Technical Verification

Focused node tests during iteration; configured gates at handoff; owner's look on the preview. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Design notes deferred to T-137.
