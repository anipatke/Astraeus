# Ephemerides (core data)

Positions of bodies as piecewise Chebyshev fits of JPL Horizons state vectors, the way NASA's SPICE kernels store them. Core data, usable by any experience (O-025 Decisions 8 and 9); never engine code (ARCH-01). An experience fetches only the chunks its time window needs.

## `<planet>-moons/` (jupiter, mars, saturn, uranus, neptune, pluto)

Moved in O-036 T-161: these six sets are no longer in the engine. Each lives in its own package, `packages/astraeus-data-<planet>/data/<planet>-moons/`, published as `astraeus-data-<planet>` (120 MB in all, split so no download is over about 40 MB). The engine reads a set only when the package is handed to it (`mount(..., { data })`, or `provideIndex` on the moon system). The paths below are relative to that package; rebuild commands run from `packages/astraeus` and write there.

Every moon Horizons lists for the planet, and the planet itself, each relative to the planet's system barycentre (NAIF 5 Jupiter, 4 Mars, 6 Saturn, 7 Uranus, 8 Neptune, 9 Pluto), geometric, ICRF (Astraeus's EQJ), km, in TDB. `src/core/chebyshevEphemeris.ts` subtracts Jupiter's series to answer Jupiter-centred `stateAt(utcMs)`; `src/core/timeScale.ts` turns UTC into TDB with the TT - UTC table held in the index.

| File | Holds |
|---|---|
| `index.json` | Format `astraeus.chebyshev-ephemeris/1`: span, source and licence, the TT - UTC table, and per body its id, name, NAIF id, Horizons ephemeris and header notes, fit (segment length, degree, quantum), chunk list, `span` (`fromUtc`, `toUtc`: the years that body's positions are claimed for, since O-047; optional, absent means its chunks' extent), measured accuracy and provenance. |
| `<body>/<year>.bin` | One calendar year (TDB) of one body: a 20-byte header (`ACF1`, segment count, coefficients per axis, start TDB seconds) and every coefficient as a whole number of quanta, zig-zag base-128 varints, ordered segment, axis, k (`src/core/chebyshevSeries.ts`). |

Segments are aligned with the record grid of JPL's own kernels (found from the data), because a fit across a record boundary cannot reach metre level; each body's length and degree are the cheapest that keep the worst error at independent dates within 1 m (0.1 m for Jupiter, whose series enters every moon). The measured errors, sizes and speeds are in the O-025 T-096 Task evidence.

Source: JPL Horizons On-Line Ephemeris System API (NASA/JPL-Caltech Solar System Dynamics), used as US Government work with credit. The fit error is against Horizons; Horizons' own uncertainty (large for recently discovered moons) is separate and stated in each body's provenance.

Rebuild or extend: `node tools/import/horizons-moons.mjs --system <jupiter|mars|saturn|uranus|neptune|pluto> --from 2010-01-01 --to 2030-01-01` (Node 22.18+ for built-in TypeScript; built with 24.16.0) (resumable; raw responses cached in the git-ignored `tools/import/.horizons-cache/`; fit choices kept in `tools/import/horizons-moons-fit.json`). Size and speed report: `node tools/import/horizons-moons-measure.mjs [--browser]`.

Systems and sizes (2010 to 2030, plus the main moons and the planet from 1950 in the four systems marked; measured errors are in each `index.json`; O-033 T-114 Task evidence has the per-system table):

| System | Moons (plus the planet) | Raw size (2010-2030) | Per year | Worst fit error vs Horizons |
|---|---|---|---|---|
| `jupiter-moons/` (Io, Europa, Ganymede, Callisto and Jupiter from 1950) | 115 | 22.3 MB for 2010-2030; 33.4 MB with the 1950 bodies | 1.11 MB | 0.99 m (1950 bodies: 0.19 m end to end) |
| `mars-moons/` | 2 | 5.5 MB | 274 KB | 0.55 m |
| `saturn-moons/` (Mimas to Phoebe, nine moons, and Saturn from 1950) | 292 | 38.5 MB for 2010-2030; 57.6 MB with the 1950 bodies | 1.92 MB | 1.0 m (Daphnis 19.9 m, 2010 to 2018 only; 1950 bodies: 0.53 m end to end) |
| `uranus-moons/` (Miranda to Oberon and Uranus from 1950) | 28 | 32.4 MB for 2010-2030; 42.9 MB with the 1950 bodies | 1.62 MB | 0.88 m (1950 bodies: 0.08 m end to end) |
| `neptune-moons/` (Triton, Nereid and Neptune from 1950) | 16 | 17.7 MB for 2010-2030; 20.0 MB with the 1950 bodies | 883 KB | 0.84 m (1950 bodies: 0.51 m end to end) |
| `pluto-moons/` (Pluto system barycentre, NAIF 9) | 5 | 1.7 MB | 87 KB | 0.69 m |

Bodies of one set may cover different years: `node tools/import/horizons-moons.mjs --system <planet> --only <naif ids> --from 1950-01-01 --to 2030-01-01` rebuilds just those bodies (and the centre, over the union) over the longer span and merges them into the existing `index.json`; the other bodies keep their chunks and span, and the set's `span` and time-scale table grow to hold the union. The engine answers each body only inside its own span (and the centre's); a scene whose timeline reaches outside it fails once at mount with `SceneError` code `out-of-span`, naming the body, the data package and the span.

A moon whose Horizons ephemeris ends inside the span (Cassini-era Saturn moons such as Daphnis, 2018) is fitted over what Horizons has; its index entry says so in its provenance notes. A moon Horizons cannot calibrate at all is listed in the index under `source.unavailable`. The end-to-end figure (moon about its planet, through the provider, against Horizons' own planet-centred vectors) is looser than the barycentre fit where Horizons takes a moon and the planet from different kernel solutions (Neptune's irregular moons, about 61 m).

## `planets/`

`planets.json`: the eight planets' heliocentric ecliptic-J2000 positions as piecewise Chebyshev fits in TT (`astraeus.planet-fits/1`), base64 chunks. Mercury to Neptune are refits of Orb's full VSOP87A series (each within 1 km of it); Pluto, which has no VSOP87 series, is a fit of JPL Horizons states (body 999 about the Sun, ICRF turned to ecliptic J2000 with Orb's frame transform; 0.67 km worst against the interpolated Horizons samples). Span 1950 to 2045 (O-047 T-200 refit all eight from 1950-01-01: worst error 0.86 km (Mars), Pluto 0.79 km against Horizons; the segments from 1969 on are byte for byte those of the earlier fit, earlier segments are prepended; the engine reads it from the stored time-scale table; a scene before it fails with `out-of-span`). `--from 1950-01-01` refits from an earlier start (it is what the committed file uses). Rebuild: `node tools/import/planet-fits.mjs --write --from 1950-01-01` (all eight; `--only <ids>` for a trial without writing; Pluto's Horizons samples come from the same git-ignored cache). Test fixtures against Horizons: `tests/fixtures/planets-horizons.json` and `tests/fixtures/outer-planets-horizons.json`.
