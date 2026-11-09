---
id: O-067
title: Ship the 88 constellations as a data package
status: planned
depends_on: [O-066]
release: G-018
priority: medium
---

# O-067: Ship the 88 constellations as a data package

## Outcome

`astraeus-data-constellations`: all 88 IAU constellations' stick figures (an openly licensed set, endpoints as HIP ids), IAU boundaries (Delporte 1930, machine-readable), names and abbreviations, each source and licence recorded once; a way to add one or many by abbreviation; small download; the planet packages' pattern (peer range, `check:pack`). An example in `examples/` traces Orion in three story steps on it.

## Why

G-018: owner chose an "Optional data package" so any app can trace any constellation without redoing the data work.

## Success Conditions

To be detailed when planned; licence of the figure set confirmed before any data is shipped (PROV-02, DATA-01).

## Boundaries

**In scope:** the package, its import tool, provenance, the Orion example.
**Out of scope:** facts and myths (story apps own them); the Zodiac app.
