---
id: I-054
title: Venus looks low detail next to Planetary Explorer
type: defect
status: open
source:
  kind: report
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  at: '2026-10-21T21:20:00Z'
severity: low
history:
  - at: '2026-10-21T21:20:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'Owner, on the localhost:5490 preview during O-037: "Venus seems poor quality compared to planetary explorer". Coordinator confirmed O-037 did not change Venus: no texture or asset changed, and the only planet-definition edit (T-125) moved validation into validatePlanetSystem. Pre-existing since O-033 T-119.'
---

# I-054: Venus looks low detail next to Planetary Explorer

## Summary

In the planets demo, Venus looks noticeably poorer than the same planet in the owner's Planetary Explorer. Venus draws `src/assets/textures/venus-2k.jpg` (2k wide); the donor may use a sharper map, a cloud or haze layer, or different lighting. Not compared yet.

## Evidence

Owner report on the preview, 2026-10-21. Venus assets: `src/assets/textures/venus-2k.jpg`, `src/assets/bodies/venus.ts`, `src/core/bodies/venus.ts`, `data/planets/venus.json`. Out of scope for O-037 (G-007 boundary: no change to what the demos show).

## Proof Needed

Name what Planetary Explorer does for Venus (map resolution and source, any atmosphere layer, material and lighting), port it faithfully per the donor rule, and the owner judges Venus on the preview as matching Planetary Explorer.
