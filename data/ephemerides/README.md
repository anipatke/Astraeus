# Ephemerides (core data)

Positions of bodies as piecewise Chebyshev fits of JPL Horizons state vectors, the way NASA's SPICE kernels store them. Core data, usable by any experience (O-025 Decisions 8 and 9); never engine code (ARCH-01). An experience fetches only the chunks its time window needs.

## `jupiter-moons/`

Every moon Horizons lists for Jupiter, and Jupiter itself, each relative to the Jupiter system barycentre (NAIF 5), geometric, ICRF (Astraeus's EQJ), km, in TDB. `src/core/chebyshevEphemeris.ts` subtracts Jupiter's series to answer Jupiter-centred `stateAt(utcMs)`; `src/core/timeScale.ts` turns UTC into TDB with the TT - UTC table held in the index.

| File | Holds |
|---|---|
| `index.json` | Format `astraeus.chebyshev-ephemeris/1`: span, source and licence, the TT - UTC table, and per body its id, name, NAIF id, Horizons ephemeris and header notes, fit (segment length, degree, quantum), chunk list, measured accuracy and provenance. |
| `<body>/<year>.bin` | One calendar year (TDB) of one body: a 20-byte header (`ACF1`, segment count, coefficients per axis, start TDB seconds) and every coefficient as a whole number of quanta, zig-zag base-128 varints, ordered segment, axis, k (`src/core/chebyshevSeries.ts`). |

Segments are aligned with the record grid of JPL's own kernels (found from the data), because a fit across a record boundary cannot reach metre level; each body's length and degree are the cheapest that keep the worst error at independent dates within 1 m (0.1 m for Jupiter, whose series enters every moon). The measured errors, sizes and speeds are in the O-025 T-096 Task evidence.

Source: JPL Horizons On-Line Ephemeris System API (NASA/JPL-Caltech Solar System Dynamics), used as US Government work with credit. The fit error is against Horizons; Horizons' own uncertainty (large for recently discovered moons) is separate and stated in each body's provenance.

Rebuild or extend: `node tools/import/horizons-moons.mjs --from 2010-01-01 --to 2030-01-01` (resumable; raw responses cached in the git-ignored `tools/import/.horizons-cache/`; fit choices kept in `tools/import/horizons-moons-fit.json`). Size and speed report: `node tools/import/horizons-moons-measure.mjs [--browser]`.
