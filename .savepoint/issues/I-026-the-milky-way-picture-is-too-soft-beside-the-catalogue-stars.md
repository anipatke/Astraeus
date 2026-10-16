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
  - at: '2026-10-16T10:23:02Z'
    actor: {role: executor, session: i026-repair-2026-10-16}
    kind: repair_attempted
    note: 'Owner asked for a better Milky Way picture. Licence decided first: NASA SVS Deep Star Maps 2020 states no licence of its own (SVS help: public domain "unless otherwise noted"), but is built from Gaia DR2, which the Gaia users page licenses as CC BY-NC 3.0 IGO (not CC BY-SA; share-alike is on ESA images). Whether the render inherits the non-commercial term is not established, so decision (b): local only (docs/DONOR_PROVENANCE.md has the quotes). tools/data/fetch-sky-map.mjs fetches the 16k EXR, tone-maps it (exposure 10, gamma 2.2, settings) and writes 4x2 tiles of 4096 px (8.69 MB, JPEG q20) plus a manifest to git-ignored data/local/sky/nasa/. The sky now draws N tiles from a manifest (frame equatorial-j2000 or galactic), picks the source by ?skymap=nasa|eso or sky.source (default nasa, loaded only when the picture is first switched on, falls back to ESO when absent or in a public build). Registration to the 16k pixels: Vega, Deneb, Sirius and Capella within one pixel. Gates: tsc, vite build, full vitest 828 passed 1 skipped, public-build validator ok, browser-sky.mjs zero console errors; before/after images in docs/evidence/o011-i026-20261016T101356Z/. The 16k set is about 715 MB of GPU memory with mipmaps; 8k is one argument away. The picture stays off by default; the owner''s look decides default-on, and a Brunier original can drop in by the same manifest. Issue left open for the owner and a Check.'
  - at: '2026-10-16T10:26:21Z'
    actor: {role: executor, session: i026-repair-2026-10-16}
    kind: repair_attempted
    note: 'Owner decision 2026-10-16: "use ESO, give credit". Default picture source set back to eso (ESO/S. Brunier, CC BY 4.0, credited in the Sky item''s Sources); the NASA tiles stay local-only, by ?skymap=nasa or sky.source. Tests that assert the default updated. Issue stays open; the better-texture question is the owner''s.'
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
