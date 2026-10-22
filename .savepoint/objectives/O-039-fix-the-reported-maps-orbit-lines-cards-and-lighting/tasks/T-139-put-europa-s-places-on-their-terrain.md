---
id: T-139
title: Put Europa's places on their terrain
objective: O-039
status: done
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

Lane `lane-t139`, built by an executor session; extra reads: none beyond Context Files, except `tools/import/planetary-explorer-conventions.json` and `tools/import/planetary-explorer.mjs` (the importer regenerates `map.json`, so the edit belongs in its conventions file; `tests/bodyPackages.test.ts` failed otherwise). Deviation from `planned_writes`: also wrote `tools/import/planetary-explorer-conventions.json`.

**Gazetteer comparison** (USGS Gazetteer of Planetary Nomenclature, planetarynames.wr.usgs.gov, SearchResults by feature name, Europa, planetographic +West, looked up 2026-10-22). Stored (features.json) vs Gazetteer west: Conamara Chaos [1282] 274 / 272.7; Murias Chaos [4074] 83.8 / 83.8; Thera Macula [5967] 181 / 181.2; Thrace Macula [5984] 172 / 172.1; Cyclades Macula [1361] 191.3 / 191.3; Castalia Macula [1048] 225 / 225.7; Tyre [6170] 147 / 146.6; Pwyll [4878] 271 / 271.4; Cilix [1216] 181.9 / 181.9; Manannan [3622] 240 / 239.7; Tara Regio [14296] 75 / 75.0. All stored values are Gazetteer west values, so the cause is the same as Titan's.
Matching neither reading (line or region centres the donor placed loosely, left unchanged, reported only): Agave Linea [83] 220 / 273.1; Belus Linea [681] 185 / 231.4; Cadmus Linea [955] 160 / 191.7; Rhadamanthys Linea [5012] 250 / 200.5; Powys Regio [14295] 125 / 145.0. Argo Linea is not a Gazetteer name. The two polar entries (lat +-80, lon 0 and 180) have no Gazetteer longitude; at the poles longitude barely moves the marker.

**Change.** `tools/import/planetary-explorer-conventions.json` Europa entry now says marker scale 1, offset 0 (the signature `shownLongitude` keys on); `data/bodies/europa/map.json` regenerated by the importer (`node tools/import/planetary-explorer.mjs --out <scratch>`, copied). `data/bodies/europa/features.json` is byte-for-byte unchanged (git shows no diff). No code change. Tyre 147 is now drawn at 33 (was 114 degrees off).

**Other Galilean moons** (spot check, no mismatch, nothing fixed): Io Pele [4638] 255.28 W / stored east 104.5 (360-255.28 = 104.72); Loki Patera [3459] 308.79 W / 51.2; Prometheus [4836] 153.94 W / 206.3; Tvashtar Paterae [14131] 123.53 W / 237.2. Ganymede Tros [6091] 27.26 W / -27.26; Osiris [4509] 166.31 W / -166.5; Gilgamesh [2161] 124.83 W / -124.83. Callisto Valhalla [6284] 56.0 W / 124 (180-W); Asgard [420] 139.9 W / 40.1 (180-W).

**Tests.** `tests/mapOrientation.test.ts`: the old Europa Pwyll/Conamara pin (asStored) replaced by a T-139 block pinning Tyre, Pwyll, Conamara Chaos and Thera Macula on the right map column through `shownLongitude(…, europaMap.coordinates)` (tolerance 8 degrees), plus a test that Tyre stored 147 shows at 33, the data is untouched, and without the conversion Tyre fails the pin. Docs: `docs/DONOR_PROVENANCE.md` paragraph added.

**Gates (from the lane directory):** `npm run lint` pass; `npm run typecheck` pass; `flock /tmp/astraeus-build.lock npm run build` pass; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` 99 files passed, 1335 tests passed, 1 skipped. (A first run failed `bodyPackages` importer-identical-files test before the conventions file was edited; fixed, not a repeat failure.)

Owner look on preview: pending. On localhost:5490 open Jupiter, focus Europa, open its places: Tyre's marker on the ringed impact scar (about 33 degrees east on the marker frame), Pwyll on its rayed crater in the southern hemisphere, Conamara Chaos on the chaotic terrain near the equator; Thera Macula and Murias Chaos should also sit on their dark patches.

## Drift Notes

None expected beyond T-131's; deferred to T-137.
