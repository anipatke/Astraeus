---
id: T-131
title: Turn the other moon maps and put Titan's places on their terrain
objective: O-039
status: in_progress
stage: audit
check_waiver:
  task: T-131
  reason: "Owner skipped the optional Task Check for the O-039 overnight run ('Skip them, one big check at the end'); the Full Objective Check covers it."
  actor: {role: owner, session: 8d73d3f8}
  recorded_at: '2026-10-22T10:40:06Z'
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

### Evidence (builder, 2026-10-22, lane-t131)

Criteria:
- Turns: `Math.PI` set for Europa, Callisto (`galileanMoons.ts`), Pluto, Tethys, Dione, Rhea, Titan (`planetSystemMaps.ts`); Ganymede 0; others untouched. Pinned in `tests/mapOrientation.test.ts` ("T-131: moon maps centred on 180 E turn half a revolution").
- Titan conversion: `shownLongitude` (`surfacePlace.mjs`/`.d.mts`) called from `placedFeatures` (`planetDefinition.ts`); `packagesOf` and the Saturn glob now carry `map.json`. Keyed by the map record's `coordinates` (positive-west source, marker scale 1 offset 0), no Titan name in code. `data/bodies/titan/features.json` unchanged (`git diff` empty). Wiring pinned in `tests/planetDefinition.test.ts`.
- Longitudes: all looked up 2026-10-22 on the USGS Gazetteer (ids and values in `tests/mapOrientation.test.ts` comments and `docs/DONOR_PROVENANCE.md`). Titan: Xanadu 15 S 100 W [6958], Ontario Lacus 72 S 183 W [7003]. Huygens landing site is not in the Gazetteer; used Wikipedia's 10.573 S 192.335 W (stored 192.3 is that west value, so the conversion is right for it).
- `docs/DONOR_PROVENANCE.md` updated.

Deviations and findings for the owner:
- Europa: only Pwyll and Conamara Chaos are pinned. Pwyll (271 W) and Conamara (273 W) cannot tell the west-direct frame from the 180 - W frame, because both lie near 270 W; Tyre (stored 147, Gazetteer 146.6 W [lookup 2026-10-22]) shows the donor stored Europa's west values directly, which puts Tyre about 114 degrees from its terrain. Europa's places therefore likely have the same defect as Titan's (the audit judged it from Pwyll alone). Not fixed: out of this Task's scope (Titan only). Needs an Issue or a follow-up Task; I may not create one in a lane.
- Tolerances: Europa 8 degrees (Conamara stored 274 vs Gazetteer-derived 267), Pluto 6 (Sputnik stored -5, gazetteer 178.69 E), others 3.
- Pluto's Gazetteer record is planetocentric +East (all others planetographic +West); the test uses the east value negated.

Gates (lane dir): lint pass; typecheck pass; build pass (chunk size warning only); `npm test` pass (see final run below).

Owner look on preview: pending. On localhost:5490 (Planets demo, switch to Saturn): Titan: Xanadu's marker should sit on the large bright region, Ontario Lacus' marker on the dark southern lake patch, the Huygens landing site marker on the dark plains west of Xanadu. Ganymede: Tros/Osiris markers on their craters (should look as before, with the globe now facing 0 E). One of Tethys/Dione/Rhea: the dark trailing hemisphere should be on the side away from motion; Europa/Callisto: Pwyll's rayed crater and Valhalla's rings under their markers.

## Drift Notes

Design notes deferred to T-137.
