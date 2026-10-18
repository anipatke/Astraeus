---
id: O-026
title: Pack the shower meteor orbits as compact numbers
status: planned
depends_on: []
release: G-007
priority: low
---

# O-026: Pack the shower meteor orbits as compact numbers

## Outcome

The Showers demo downloads its meteor orbits as compact binary numbers instead of JSON text, roughly halving that part of the download, with every orbit and every drawn position unchanged.

## Why

Owner, 2026-10-18, asking whether the showers would benefit from the curve-fit format: curve fits would not help (each meteor already is a six-number orbit, computed on the graphics chip), but the orbit files are text (`gmn-iau-7` about 2.6 MB, `gmn-iau-4` about 5.1 MB in the public build). Owner: "Add it to a clean up goal".

Priority (owner, 2026-10-18): "It's not core like the moons, so not a priority but would like to clean up" — low priority within G-007.

## Success Conditions

1. The public build ships each shower's orbits as a compact binary file (for example Float32 per orbital element, with the provenance and licence kept in a small text header or sidecar, PROV-02); the source JSON stays the master copy, converted at build time.
2. Bit-level or stated-tolerance equality: every orbit read from the binary matches the JSON within float32 rounding, and the drawn positions match the current build (picture check and a numeric test).
3. Download size measured before and after over the wire (compressed), recorded; the load budget limits are lowered to the new size.
4. Shower data stays demo data, not engine (owner rule); full run passes; owner look on a phone.

## Boundaries

**In scope:** the meteor orbit files' format and loader.

**Out of scope:** textures, stars and other assets; changing which meteors are shown.
