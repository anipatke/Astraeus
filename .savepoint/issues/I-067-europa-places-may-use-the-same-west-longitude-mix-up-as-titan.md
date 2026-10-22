---
id: I-067
title: Europa's places may be read with the same west-longitude mix-up as Titan's
type: defect
status: open
source:
  kind: report
  actor: {role: executor, session: 8d73d3f8}
  at: '2026-10-22T12:00:00Z'
tasks: [T-131, T-139, T-140]
checks: [C-096]
severity: medium
history:
  - at: '2026-10-22T12:00:00Z'
    actor: {role: executor, session: 8d73d3f8}
    kind: observed
    note: 'Found by the O-039 T-131 builder (lane-t131, commit 097486fb) while pinning Europa feature longitudes: Tyre is stored as 147 in data/bodies/europa/features.json against 146.6 W in the USGS Gazetteer, so under the marker rule (shown = 180 - W for source-west data) it would sit about 114 degrees off its terrain. Pwyll and Conamara Chaos sit near 270 W where the two readings agree, which is why the 2026-10-21 audit (docs/evidence/map-audit-20261021/report.md) did not catch it. T-131 fixed only Titan (owner scope); Europa left unchanged and only Pwyll and Conamara pinned. Not yet checked: whether other Europa entries, or other Galilean moons, share the mix-up.'
  - at: '2026-10-22T11:19:28Z'
    actor: {role: checker, session: o039-full-check-20261022}
    kind: rechecked
    check: C-096
    note: 'Still open. T-139 corrected Europa''s map record (marker scale 1, offset 0), and `shownLongitude(147, europaMap.coordinates)` gives 33, but the Jupiter system never passes that record to the builder: `src/experiences/planets/systems/jupiter.ts:43-48` imports Europa''s features and categories only, with no `map`, so `placedFeatures` gets `coordinates` undefined and draws Europa''s places as stored. Probe (scratch vitest, removed): `buildPlanetDefinition(parsePlanetSettings(data/planets/jupiter.json), jupiterSystem, …)` gives Tyre 147 and Thera Macula 181 (expected 33 and -1); Titan''s Xanadu in the Saturn definition gives 80 (correct, Saturn''s glob carries map.json). The T-139 tests call `shownLongitude` directly with the map record, so they never reach the Jupiter wiring; Design.md (O-039, Source-west longitudes) says Europa qualifies through its record, which is not so in the app. Proof still needed: Jupiter''s system carries Europa''s map record (as Saturn''s glob does), with a test that builds the real Jupiter definition and finds Tyre at 33; the owner looks at Europa on the preview.'
---

# I-067: Europa's places may be read with the same west-longitude mix-up as Titan's

## Summary

Some of Europa's tagged places (Tyre at least) may sit on the wrong terrain because their longitudes look like west values read as east, the same mix-up O-039 fixed for Titan. Places near 270 W look right either way, which hid it.

## Evidence

T-131 Technical Evidence (O-039); `data/bodies/europa/features.json`, `data/bodies/europa/map.json`, `tests/mapOrientation.test.ts`, `src/experiences/planets/surfacePlace.mjs` (`shownLongitude`).

## Proof Needed

Check every Europa place (and a sample on Io, Ganymede and Callisto) against looked-up USGS Gazetteer longitudes; if the stored values are west, mark Europa's map record with the source convention so the existing conversion applies, with a test pinning Tyre and two other places; the owner judges Europa on the preview.
