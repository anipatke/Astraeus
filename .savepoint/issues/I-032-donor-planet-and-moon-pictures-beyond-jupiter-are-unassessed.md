---
id: I-032
title: Donor planet and moon pictures beyond Jupiter are unassessed and unused
type: other
status: open
source:
  kind: report
  actor: {role: checker, session: o011-orchestrator-morning-20261017}
  at: '2026-10-17T08:00:00Z'
history:
  - at: '2026-10-17T08:00:00Z'
    actor: {role: checker, session: o011-orchestrator-morning-20261017}
    kind: observed
    note: 'Owner asked why the donor''s other moon and planet pictures were never pulled in and assessed. Astraeus ships maps only for the bodies it can position (Sun to Jupiter, the Moon, Io); the donor holds about 20 more (Galilean moons, Saturn and seven of its moons, Uranus, Neptune, Triton, Pluto, Charon, Ceres). Owner decision 2026-10-17: assess now, add later. Inventory written to docs/DONOR_TEXTURE_INVENTORY.md; nothing copied.'
  - at: '2026-10-17T08:00:00Z'
    actor: {role: checker, session: o011-orchestrator-morning-20261017}
    kind: deferred
    note: 'Adding the bodies needs ephemeris providers for each (engine work) and belongs in a later Objective after the Spike 04 merge and launch; owner chose "Check them now, add later".'
  - at: '2026-10-17T09:30:00Z'
    actor: {role: checker, session: o011-orchestrator-morning-20261017}
    kind: observed
    note: 'Owner asked to trace the rest, the rings for all planets and the Mars moons. Traced by comparison with downloaded originals: Uranus and Neptune byte-identical to Solar System Scope; Charon byte-identical to the USGS 2017 mosaic preview; Pluto is NASA PIA11707; Ganymede is the USGS 1 km mosaic shifted 180 degrees; Ceres surface is the USGS/DLR Dawn mosaic but its colour and polar fill are untraced (do not ship). JPL image policy confirms the Cassini and Voyager maps. Rings checked against NASA NSSDC fact sheets: Saturn, Uranus, Neptune close; Jupiter about 20 percent too close in. Mars moons and other small moons have no picture; candidates listed. docs/DONOR_TEXTURE_INVENTORY.md and the assets page section Traced, not in the app yet, updated.'
  - at: '2026-10-17T08:30:00Z'
    actor: {role: planner, session: o017-plan-20261017}
    kind: deferred
    note: 'Owner, 2026-10-17: include all the moons before go-live, as globes you can spin, and update the catalogue. Planned as O-018 (reuse Planetary Explorer moon maps and tagged features through a reusable importer, a Moons experience, catalogue rows; rescoped 2026-10-17 on the owner''s correction), after O-017 and before the deploy. Planets, rings, Mars moons, small moons and real orbits stay out; this Issue stays open for them.'
---

# I-032: Donor planet and moon pictures beyond Jupiter are unassessed and unused

## Summary

The donor has surface maps for Europa, Ganymede, Callisto, Saturn, Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus, Uranus, Neptune, Triton, Pluto, Charon and Ceres. Astraeus uses none of them and has no position source for those bodies. Five maps (Uranus, Neptune, Pluto, Charon, Ceres) have no recorded source. Ganymede's source is vague. Two files are far over the size budget (Dione 10.3 MB, Triton 4.3 MB at 14k pixels).

## Evidence

`docs/DONOR_TEXTURE_INVENTORY.md` (2026-10-17): pixel sizes and weights measured from the files; sources from the donor `public/textures/README.md`; untraced files dated by donor git history.

## Proof Needed

1. An Objective that adds one or more of these bodies, each with an ephemeris provider checked against JPL like the existing planets.
2. Every shipped map has a traced source page, licence and credit, an `AssetLicence` record and an assets-page entry; Ceres in particular is confirmed to be a real Dawn-derived map, not an artistic one.
3. Each shipped map meets the 2k/4k size budget, and the public build's asset check stays green.
