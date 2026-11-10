# Changelog: astraeus-data

Versions follow [semantic versioning](https://semver.org). It is released together with `astraeus`, with the same version number.

## 0.9.0 (2026-11-11)

No changes to the pictures, data or this package's code. Released with `astraeus` 0.9.0 to keep the version numbers together; every `astraeus-data*` package now peers on `astraeus` `>=0.9.0 <0.10.0`. New sibling package: `astraeus-data-constellations` (the 88 IAU constellations' figures, outlines and names; see the `astraeus` 0.9.0 changelog).

## 0.8.1 (2026-11-10)

No changes to the pictures, data or this package's code. Released with `astraeus` 0.8.1 to keep the version numbers together; the engine peer stays `>=0.8.0 <0.9.0`. With `astraeus` 0.8.1 the engine reads each planet's offset from its barycentre from that planet's moon package, so a planet whose moon package is loaded sits on JPL Horizons' planet centre (see the `astraeus` 0.8.1 changelog); the packages themselves are unchanged.

## 0.8.0 (2026-11-07)

Released with `astraeus` 0.8.0, with the same version number. Every `astraeus-data*` package now peers on `astraeus` `>=0.8.0 <0.9.0`.

Added (O-059 T-268): the tagged surface places of 24 bodies, moved from the engine's `data/bodies/` and published for the first time as `astraeus-data/bodies/<body>/{features,categories,overview,map}.json` plus `catalogue.json` (about 840 KB, 98 files), for `scene.addPlaces`. NOTICE credits the lists to Planetary Explorer (the owner's own work) and keeps the overview sources' own credits.

## 0.7.0 (2026-11-01)

No changes to the pictures, data or this package's code. The README now lists the moons the picture pack has pictures for (Io, Europa, Ganymede, Callisto, Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus, Triton and Charon) and says every other listed moon draws flat-coloured (O-050 T-215, I-127). Released with `astraeus` 0.7.0 to keep the version numbers together.

## 0.6.0 (2026-11-01)

No changes to the pictures, data or this package's code. Released with `astraeus` 0.6.0 to keep the version numbers together; the six moon-position packages are unchanged, and every moon they hold can now be added by id with `scene.addBody` (see the `astraeus` 0.6.0 changelog).

## 0.5.1 (2026-10-31)

No changes to the pictures, data or this package's code. Released with `astraeus` 0.5.1 to keep the version numbers together; the six moon-position packages are unchanged.

## 0.5.0 (2026-10-31)

No changes to the pictures or this package's code. Released with `astraeus` 0.5.0 to keep the version numbers together. The moon-position packages changed: `astraeus-data-jupiter`, `-saturn`, `-uranus` and `-neptune` now hold their main moons and planet from 1950-01-01 (see the `astraeus` 0.5.0 changelog); `-mars` and `-pluto` are unchanged.

## 0.4.0 (2026-10-31)

No changes to the code, data or public API. Released with `astraeus` 0.4.0 to keep the version numbers together.

## 0.3.0 (2026-10-29)

The Milky Way picture is now the starless Gaia EDR3 render by Kevinmloch (CC BY-SA 4.0), 3840x1920, 0.53 MB, replacing the two ESO halves (3.7 MB). The picture is `milky-way` (the names `milky-way-left` and `milky-way-right` are gone) and its licence record travels with it. The package is about 35.5 MB packed. The moon-position and data code is unchanged.

## 0.2.0

No changes to the code, data or public API. Released with `astraeus` 0.2.0 to keep the version numbers together.

## 0.1.1

No changes to the code, data or public API. The first version published by the GitHub release workflow, with npm provenance ("Built and signed on GitHub Actions").

## 0.1.0 (preview)

First release: the pictures kept out of the engine (maps of the Jupiter, Saturn, Uranus, Neptune and Pluto moons, Triton, Charon, the 8k Venus map and the Milky Way panorama), each with its licence record. Moon positions are in the separate `astraeus-data-jupiter`, `-saturn`, `-uranus`, `-neptune`, `-mars` and `-pluto` packages.
