---
id: I-056
title: Pluto's moon orbit lines draw the wrong number of laps, so they look like thick wobbly bands
type: defect
status: open
source:
  kind: report
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  at: '2026-10-21T22:20:00Z'
severity: medium
history:
  - at: '2026-10-21T22:20:00Z'
    actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'Owner, on the preview during O-037: "why are plutos moons wonky", then "the orbit lines wobble and aren''t round. If this is accurate all good, but check please".'
  - at: '2026-10-21T22:30:00Z'
    actor: {role: executor, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
    kind: observed
    note: 'Read-only measurement (scratch script, 2016-07-01): the lines come from the fitted Pluto-moon curves (fit errors under 1 m) drawn about Pluto''s centre, 128 samples. Deviation from a best-fit circle about Pluto vs about the barycentre vs the expected 2,110 km reflex wiggle: Charon 0.00%/0.00%/0%; Styx 6.3%/0.87%/~5%; Nix 5.3%/0.30%/~4%; Kerberos 3.8%/0.11%/~3.7%; Hydra 3.4%/0.06%/~3.3%. The wiggle is real. The defect is the sampled span: OrbitSetView.ts:130 / moonSystem.ts:134 take the osculating period from the Pluto-relative state with Pluto''s GM alone, which Pluto''s reflex motion corrupts: Charon 8.2 vs 6.39 d (1.3 laps), Styx 46.9 vs 20.2 (2.3), Nix 17.7 vs 24.9 (0.71, an open arc), Kerberos 85.2 vs 32.2 (2.65), Hydra 97.7 vs 38.2 (2.6). Overlapping laps with shifting wiggle phase draw a thick band. Titan (0.02%) and Phobos (0.01%) are round.'
---

# I-056: Pluto's moon orbit lines draw the wrong number of laps, so they look like thick wobbly bands

## Summary

In the Pluto view the moons' orbit lines wobble and overlap. A small wiggle (3 to 6% of each small moon's radius) is real: they orbit the Pluto–Charon balance point, not Pluto. But each line covers the wrong span of time (from 0.7 to 2.65 laps) because its period is worked out from Pluto's mass alone, so laps pile up into a thick band and Nix's line is an open arc.

## Evidence

Measurements in the history entry; scratch script `/tmp/claude-1000/-home-user-code-Astraeus/9d85e5d6-91d4-454a-a0d6-81701c464056/scratchpad/pluto/shape.test.ts`. Code: `src/app/OrbitSetView.ts:130`, `src/core/bodies/moonSystem.ts:134`. Out of scope for O-037 (G-007 boundary: no change to what the demos show).

## Proof Needed

Each Pluto moon's line spans exactly one true lap (period from the system mass about the balance point, or a fitted mean period), with a test that measures laps for Charon and the four small moons and keeps Titan and Phobos unchanged; optionally the small moons' lines are drawn about the balance point (then under 1% from round). The owner judges the Pluto view on the preview.
