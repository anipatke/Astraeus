---
id: I-127
title: 'Docs do not say which moons the picture pack has pictures for'
type: other
status: resolved
source:
  kind: report
  actor: {role: owner, session: probe-switch-20261101}
  at: '2026-11-01T00:00:00Z'
severity: low
resolution:
  disposition: escalated
  actor: {role: planner, session: probe-switch-20261101}
  at: '2026-11-01T01:00:00Z'
  reason: 'Repair promoted into O-050 (Follow a probe as one path), owner-confirmed design.'
escalated_to: O-050
history:
  - at: '2026-11-01T00:00:00Z'
    actor: {role: planner, session: probe-switch-20261101}
    kind: observed
    note: 'Listed as "docs, cosmetic" in the Voyager probe app''s open-requests summary of 2026-11-01 (astraeus@0.6.0), pasted by the owner.'
  - at: '2026-11-01T01:00:00Z'
    actor: {role: planner, session: probe-switch-20261101}
    kind: escalated
    note: 'Escalated to O-050 (Follow a probe as one path) under G-014; owner confirmed the design.'
---

# I-127: Docs do not say which moons the picture pack has pictures for

## Summary

With the picture pack loaded, Uranus's five main moons (Miranda, Ariel, Umbriel, Titania, Oberon) still draw as plain grey spheres, and the probe app could not tell from the docs whether that was expected. The `astraeus-data` README lists the moons it has maps for, but does not say that every other listed moon, Uranus's five included, stays flat-coloured even with the pack. Nothing points a reader from `listedMoons` or `addBody` to that list.

## Evidence

- Probe app report, astraeus@0.6.0.
- `packages/astraeus-data/README.md:5` lists maps for Io, Europa, Ganymede, Callisto, Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus, Triton, Pluto and Charon. No Uranus moon is listed, and there is no sentence about moons outside the list.

## Proof Needed

The published docs (engine README or API reference where `listedMoons` and `addBody` are described, and the `astraeus-data` README) say which moons have pictures and that the others, Uranus's five named, draw flat-coloured with the pack loaded. A docs test or the existing package checks keep that list in step with the pack's contents.
