---
id: I-057
title: Ten body maps face the wrong way, and Titan's and Venus's tagged places sit on the wrong terrain
type: defect
status: open
source:
  kind: report
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  at: '2026-10-21T22:40:00Z'
tasks: []
severity: high
history:
  - at: '2026-10-21T22:40:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'Owner, during O-037, after I-054: "as part of this Goal, can we do a thourough check of all maps?"'
  - at: '2026-10-21T22:40:00Z'
    actor: {role: executor, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'Read-only audit of 24 textured bodies, each drawn map viewed with its features.json markers overlaid (docs/evidence/map-audit-20261021/report.md): 12 OK, 10 wrong, 2 unchecked (Sun; Enceladus physical centre). Venus: wrong map file (I-054). Titan: donor stores west longitudes but the image runs 360W to 0W, so markers need 180 minus W (Xanadu ~20 degrees off, Huygens ~180 off) and the globe needs a yaw of PI. Europa, Callisto, Pluto, Tethys, Dione, Rhea, Iapetus: map centred on 180E with textureYawRad 0, so markers sit on the right terrain but the globe faces the wrong way in the sky; need yaw PI. Ganymede: donor map already re-centred to 0E, so GANYMEDE_VISUAL yaw PI (src/core/bodies/galileanMoons.ts:47) turns it wrongly; should be 0. Assumes mesh +X is IAU longitude 0 (confirmed only for Earth and Moon). Some reference longitudes (Pwyll, Valhalla, Xanadu, Huygens, Tros, Osiris) were quoted from memory or the donor README, not looked up. Astraeus draws 2k/4k where the donor has 8k desktop variants for Mars, Mercury and Venus.'
---

# I-057: Ten body maps face the wrong way, and Titan's and Venus's tagged places sit on the wrong terrain

## Summary

A full map audit found ten of 24 mapped bodies wrong. Venus draws the wrong picture (I-054). Titan's places are read with the wrong longitude convention, so they sit on the wrong terrain. Seven moons (Europa, Callisto, Tethys, Dione, Rhea, Iapetus) and Pluto have maps centred on the far side with no turn applied, and Ganymede has a turn it no longer needs: their places line up with the picture, but the globe faces the wrong way relative to the real sky.

## Evidence

`docs/evidence/map-audit-20261021/report.md` (per-body table and fixes). Out of scope for O-037 (G-007 boundary: no change to what the demos show).

## Proof Needed

Before changing any turn, prove the mesh's longitude-zero axis for one moon against a known fact (e.g. Iapetus's dark side leads in its orbit, or a tidally locked moon's sub-planet point at 0 longitude faces its planet). Then one test per body pins its map turn and checks 2-3 looked-up feature longitudes land on the right pixel; Titan's places are converted with the right convention; the owner judges Iapetus, Titan and Ganymede on the preview.
