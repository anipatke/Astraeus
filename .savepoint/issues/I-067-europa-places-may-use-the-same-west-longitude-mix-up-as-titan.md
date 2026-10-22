---
id: I-067
title: Europa's places may be read with the same west-longitude mix-up as Titan's
type: defect
status: open
source:
  kind: report
  actor: {role: executor, session: 8d73d3f8}
  at: '2026-10-22T12:00:00Z'
tasks: [T-131]
severity: medium
history:
  - at: '2026-10-22T12:00:00Z'
    actor: {role: executor, session: 8d73d3f8}
    kind: observed
    note: 'Found by the O-039 T-131 builder (lane-t131, commit 097486fb) while pinning Europa feature longitudes: Tyre is stored as 147 in data/bodies/europa/features.json against 146.6 W in the USGS Gazetteer, so under the marker rule (shown = 180 - W for source-west data) it would sit about 114 degrees off its terrain. Pwyll and Conamara Chaos sit near 270 W where the two readings agree, which is why the 2026-10-21 audit (docs/evidence/map-audit-20261021/report.md) did not catch it. T-131 fixed only Titan (owner scope); Europa left unchanged and only Pwyll and Conamara pinned. Not yet checked: whether other Europa entries, or other Galilean moons, share the mix-up.'
---

# I-067: Europa's places may be read with the same west-longitude mix-up as Titan's

## Summary

Some of Europa's tagged places (Tyre at least) may sit on the wrong terrain because their longitudes look like west values read as east, the same mix-up O-039 fixed for Titan. Places near 270 W look right either way, which hid it.

## Evidence

T-131 Technical Evidence (O-039); `data/bodies/europa/features.json`, `data/bodies/europa/map.json`, `tests/mapOrientation.test.ts`, `src/experiences/planets/surfacePlace.mjs` (`shownLongitude`).

## Proof Needed

Check every Europa place (and a sample on Io, Ganymede and Callisto) against looked-up USGS Gazetteer longitudes; if the stored values are west, mark Europa's map record with the source convention so the existing conversion applies, with a test pinning Tyre and two other places; the owner judges Europa on the preview.
