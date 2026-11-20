# Astraeus 0.9.3

## astraeus 0.9.3 (2026-11-20)

A patch release so an app can draw real catalogue objects as one group of dots: each dot can sit at its record's own position along its orbit instead of an illustrative spread. Additions only; no call changed shape and groups that do not use the new field are unchanged, card text included. The nine packages move together to 0.9.3; the `astraeus-data*` packages keep peering on `astraeus` `>=0.9.0 <0.10.0`.

First download of the packed example (`npm run measure:example`): 1,775,354 bytes raw, 510,719 bytes gzip (code and styles loaded on first open), against 1,773,029 raw and 510,085 gzip at 0.9.2 (+2,325 raw, +634 gzip).

### What changed for app makers

- **Real positions for groups.** `addGroup` orbits take `meanAnomalyDeg`: the catalogue mean anomaly in degrees at the orbit's own `time` (its epoch); finite, wrapping to 0 to 360. When every orbit gives it, each dot sits at its record's position, advanced by unperturbed two-body motion about the centre with the same GM the group moves with. An orbit without `time` has its mean anomaly read at the group's `referenceTime`. (O-077)
- **Honest cards.** Such a group's card and `scene.groups[].provenance` keep the caller's `sourceType`, sources and accuracy, add a note that each position comes from its record's mean anomaly, and state that positions drift from the truth the further the time is from each epoch (perturbations are ignored). (O-077)
- **Refusals.** A group where some orbits give `meanAnomalyDeg` and some do not (naming the first without one), a non-finite value, or `seed` or `clump` with it throws `bad-group`. No new error code. (O-077)
- **Scale.** 110,000 orbits in one group build in about 0.4 s and fill once in about 0.1 s in Node (a measurement, not a promise). (O-077)

Full details: `packages/astraeus/CHANGELOG.md`.

## astraeus-data 0.9.3

No changes to the pictures, data or code. Released with `astraeus` 0.9.3 to keep the version numbers together.

## Other data packages 0.9.3

`astraeus-data-jupiter`, `-saturn`, `-uranus`, `-neptune`, `-mars`, `-pluto` and `-constellations`: no changes; version moved to keep the nine packages together.
