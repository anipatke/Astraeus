---
id: I-054
title: Venus draws the wrong map, so it looks poor and its tagged places sit on the wrong terrain
type: defect
status: open
source:
  kind: report
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  at: '2026-10-21T21:20:00Z'
severity: high
history:
  - at: '2026-10-21T21:20:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'Owner, on the localhost:5490 preview during O-037: "Venus seems poor quality compared to planetary explorer". Coordinator confirmed O-037 did not change Venus: no texture or asset changed, and the only planet-definition edit (T-125) moved validation into validatePlanetSystem. Pre-existing since O-033 T-119.'
  - at: '2026-10-21T21:45:00Z'
    actor: {role: executor, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'Owner added: "venus is also mapped differently to planetary explorer, something is wrong with the tagged locations". Read-only comparison with the donor found the cause is the map file, not the markers or rotation: Astraeus draws the Solar System Scope 2k_venus_surface image (src/assets/textures/venus-2k.jpg, SHA dbe5db1c, the donor''s unused copy), which by eye looks like the Magellan map turned 180 degrees (Maxwell Montes highland drawn near 76S instead of 65N), so every tagged place sits on the wrong terrain. The donor draws venus-2k-balanced.jpg (phone) and venus-8k-balanced.jpg (desktop) from the USGS Magellan C3-MDIR mosaic (donor src/entities/venus.ts:22-25), which is what data/bodies/venus/map.json and features.json already describe. Marker maths (FeatureMarkers latLonToXYZ), feature coordinates and the IAU rotation match the donor. Lighting is also darker than the donor (ambient 0.08 vs 0.24, no emissive vs #4f2e16 at 0.04). Mercury and Mars maps match the donor byte for byte; outer planets and moons unchecked.'
  - at: '2026-10-21T21:55:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: deferred
    note: 'Owner chose "Later, as its own job" for swapping in the donor Magellan map and Venus lighting, keeping O-037 to code health.'
---

# I-054: Venus looks low detail next to Planetary Explorer

## Summary

In the planets demo, Venus looks noticeably poorer than the same planet in the owner's Planetary Explorer. Venus draws `src/assets/textures/venus-2k.jpg` (2k wide); the donor may use a sharper map, a cloud or haze layer, or different lighting. Not compared yet.

## Evidence

Owner report on the preview, 2026-10-21. Venus assets: `src/assets/textures/venus-2k.jpg`, `src/assets/bodies/venus.ts`, `src/core/bodies/venus.ts`, `data/planets/venus.json`. Out of scope for O-037 (G-007 boundary: no change to what the demos show).

## Proof Needed

Name what Planetary Explorer does for Venus (map resolution and source, any atmosphere layer, material and lighting), port it faithfully per the donor rule, and the owner judges Venus on the preview as matching Planetary Explorer.
