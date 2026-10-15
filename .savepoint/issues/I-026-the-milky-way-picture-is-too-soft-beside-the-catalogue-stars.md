---
id: I-026
title: The Milky Way picture is too soft beside the catalogue stars
type: other
status: open
source:
  kind: report
  actor: {role: owner, session: owner-chat-o011-t053-sky-look-20261015}
  at: '2026-10-15T07:30:00Z'
tasks: [T-053]
checks: [C-028]
history:
  - at: '2026-10-15T07:30:00Z'
    actor: {role: owner, session: owner-chat-o011-t053-sky-look-20261015}
    kind: observed
    note: 'Owner: "I like the idea of the milky way, we do need to find a better texture ... still find the stars arent sharp with the mily way on, but we could find better textures later". Owner decision 2026-10-15: the picture ships off by default. Recorded by the T-053 builder on the owner''s direct words; not in O-011 scope.'
---

# I-026: The Milky Way picture is too soft beside the catalogue stars

## Summary

The Milky Way picture (ESO eso0932a, ESO/S. Brunier, CC BY 4.0) is the largest free version available, 6000x3000 pixels, which is 16.7 px/deg. A 60 degree view on a 1920 px screen needs about 32 px/deg, so it is magnified about 2x and looks soft beside the sharp catalogue stars. Its registration to the galactic frame is also good only to a few degrees (T-053 evidence, criterion 2), and it carries its own baked-in faint stars that do not coincide with the catalogue stars. Owner decision 2026-10-15: the picture starts switched off (`?milkyway=on`, or Developer > Display settings > "Milky Way picture", turns it on) until a better texture is found. This is outside O-011.

## Evidence

- T-053 evidence ("Owner feedback 2" and the 2026-10-15 rework): the owner finds the stars not sharp with the picture on.
- eso0932a's Fullsize Original is 6000x3000; no larger version is published.

## Proof Needed

Evaluate better sources and pick one with a recorded licence (PROV-02):

- NASA SVS Deep Star Maps 2020 (licence to be confirmed).
- Gaia DR3 all-sky maps (ESA/Gaia/DPAC, CC BY-SA 3.0 IGO; check the share-alike effect on the repository).
- Tiled HiPS surveys (resolution on demand, needs a loader).

A replacement should reach roughly 30 px/deg or be tiled to do so, register to the galactic frame better than the current few degrees, and carry no baked-in stars that disagree with the catalogue. The owner's look then decides whether it can be on by default.
