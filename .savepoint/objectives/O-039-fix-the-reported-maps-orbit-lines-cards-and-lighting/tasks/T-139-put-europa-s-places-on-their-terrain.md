---
id: T-139
title: Put Europa's places on their terrain
objective: O-039
status: planned
check_waiver:
  task: T-139
  reason: "Owner skipped the optional Task Check for the O-039 overnight run ('Skip them, one big check at the end'); the Full Objective Check covers it."
  actor: {role: owner, session: 8d73d3f8}
  recorded_at: '2026-10-22T11:01:45Z'
depends_on: [{task: T-131, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: 8d73d3f8}
lane: maps
planned_reads: [.savepoint/issues/I-067-europa-places-may-use-the-same-west-longitude-mix-up-as-titan.md, data/bodies/europa/features.json, data/bodies/europa/map.json, data/bodies/io/map.json, data/bodies/ganymede/map.json, data/bodies/callisto/map.json, data/bodies/titan/map.json, src/experiences/planets/surfacePlace.mjs, src/experiences/planets/planetDefinition.ts, tests/mapOrientation.test.ts, tests/planetDefinition.test.ts]
planned_writes: [data/bodies/europa/map.json, tests/mapOrientation.test.ts, docs/DONOR_PROVENANCE.md]
---

# Put Europa's places on their terrain

## Outcome

Europa's tagged places sit on their terrain: if the stored longitudes are west values, Europa's map record names that convention so the conversion T-131 added for Titan applies to it too; the other Galilean moons are spot-checked (I-067, owner 2026-10-22: "fix Europa too while I look").

## User Check

On the preview, open Jupiter and focus Europa: Tyre's marker sits on the ringed impact scar, Pwyll on its rayed crater, Conamara Chaos on the chaotic terrain.

## Done When

- Every Europa place is compared with its USGS Gazetteer longitude (looked up and cited); the evidence lists any that do not match either reading.
- If the stored values are west: `data/bodies/europa/map.json` carries the same source-convention field Titan's record uses, so `shownLongitude` converts Europa's places; `data/bodies/europa/features.json` stays byte-for-byte unchanged. If the cause differs, stop and report.
- Io, Ganymede and Callisto: two or three places each checked against the Gazetteer; any mismatch is reported, not fixed here.
- `tests/mapOrientation.test.ts` pins Tyre and two other Europa places on the right map column. Configured gates pass. Owner look recorded.

## Context Files

`.savepoint/issues/I-067-europa-places-may-use-the-same-west-longitude-mix-up-as-titan.md`, `data/bodies/europa/features.json`, `data/bodies/europa/map.json`, `data/bodies/io/map.json`, `data/bodies/ganymede/map.json`, `data/bodies/callisto/map.json`, `data/bodies/titan/map.json`, `src/experiences/planets/surfacePlace.mjs`, `src/experiences/planets/planetDefinition.ts`, `tests/mapOrientation.test.ts`, `tests/planetDefinition.test.ts`.

## Design References

Design: Components/Codebase Map rows for `data/planets/` and `src/experiences/planets/`.

## Guardrails

ARCH-01, STYLE-07, STYLE-09, STYLE-10, DATA guardrails.

## Implementation Plan

1. Read how T-131 keyed the Titan conversion on the map record.
2. Compare all Europa places with the Gazetteer; decide west or not from the evidence.
3. Mark Europa's map record if so; pin the test.
4. Spot-check the other Galilean moons; report.

## Boundaries

No edits to `features.json`; no code change unless the record route cannot express it (then stop and report). No browser sets, no screenshots.

## Technical Verification

Focused node tests; configured gates at handoff; owner's look on the preview. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None expected beyond T-131's; deferred to T-137.
