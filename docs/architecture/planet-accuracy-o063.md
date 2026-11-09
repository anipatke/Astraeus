# Planet accuracy at the Voyager flybys (O-063 T-289)

Measured 2026-11-10 against JPL Horizons (DE441). The test `packages/astraeus/tests/planetAccuracyFlybys.test.ts` holds every figure below and fails if the engine's planets move; `PLANET_ACCURACY_PRINT=1` prints the full table. No engine position or data was changed in this step.

## Summary

How far the engine's planet is from where NASA's Horizons puts the planet's centre, about the Sun:

| Planet | Date (UTC) | Off by | In planet radii | Seen from the probe | Why |
|---|---|---:|---:|---:|---|
| Jupiter | 1979-03-05 12:04 (Voyager 1) | 755 km | 0.01 | 0.12° | The planet series (VSOP87A), mostly a small fixed turn of its frame |
| Jupiter | 1979-07-09 22:29 (Voyager 2) | 629 km | 0.01 | 0.05° | Same |
| Saturn | 1980-11-12 23:46 (Voyager 1) | 1,629 km | 0.03 | 0.51° | Same |
| Saturn | 1981-08-26 03:24 (Voyager 2) | 1,790 km | 0.03 | 0.64° | Same |
| Uranus | 1986-01-24 17:59 (Voyager 2) | 6,314 km | 0.25 | 3.4° | The planet series' own orbit for Uranus |
| Neptune | 1989-08-25 03:56 (Voyager 2) | 13,338 km | 0.54 | 24.5° | The planet series' own orbit for Neptune |
| Jupiter | 2035-03-01 (made up) | 795 km | 0.01 | | Series, frame turn |
| Saturn | 1962-05-01 (made up) | 1,090 km | 0.02 | | Series, frame turn |
| Uranus | 2020-01-01 (made up) | 12,738 km | 0.50 | | Series' own orbit |
| Neptune | 1955-09-01 (made up) | 4,833 km | 0.20 | | Series' own orbit |

Worst over the whole span (2 January each year, 1950 to 2044): Jupiter 1,456 km, Saturn 2,805 km, Uranus 20,023 km, Neptune 43,747 km (Mercury 58, Venus 76, Mars 132).

**Was the Voyagers app's re-placing caused by the engine?** Yes. Its Horizons probe samples were centred correctly (on the Sun's centre, `500@10`, ecliptic J2000, as its files show), so they sit where NASA has them; the engine's planets do not. Voyagers measured only the change in probe-to-planet *distance* (260 to 2,318 km). The full miss is larger and mostly sideways: at Neptune the probe's distance changes by 120 km, but the planet is 13,338 km off.

**Recommendation:** fit every planet's *system barycentre* from Horizons (DE441) instead of VSOP87A, in the same file format, and add the planet's own wobble about it from its moon package when one is loaded: exactly what Pluto does today, made the rule for all planets. Expected: about 1 km from Horizons with the moon package, up to about 300 km (Saturn's wobble) without; core download about the same as today; 1950 to 2045 kept. **Alternative:** state the measured figures above in each planet's provenance and the README, and stop.

## Method

- **Engine:** the planet series as the astronomy adapter reads it (`planetModels()[planet].xyz(date)`, heliocentric ecliptic J2000, km), and the same planet from `scene.stateOf` in a Sun-first scene (equatorial J2000) for the "as a probe app sees it" figure.
- **Horizons settings:** API `https://ssd.jpl.nasa.gov/api/horizons.api`, `EPHEM_TYPE=VECTORS`, `VEC_TABLE=1`, `VEC_CORR=NONE` (geometric: no light time, no aberration), `REF_SYSTEM=ICRF`, `REF_PLANE=ECLIPTIC` (ecliptic of J2000) and once more `REF_PLANE=FRAME` (ICRF equator), `OUT_UNITS=KM-S`, `TIME_TYPE=UT` with `VEC_DELTA_T=YES` (TDB minus UT per row), centre `500@10` (Sun's centre) and `500@0` (solar-system barycentre). Targets: planet centres 599, 699, 799, 899 (and 199, 299, 499), system barycentres 5 to 8, the Sun (10).
- **Flyby times:** each probe's closest approach to the planet's centre in Horizons itself (Voyager 1 `-31`, Voyager 2 `-32`, trajectory `Voyager_*_ST+refit2022_m`), searched at 1-minute then 1-second steps over the day the probe's Horizons header timeline names. The header's Voyager 2 Saturn line says 1981-Aug-25; the trajectory's closest approach is 1981-08-26 03:24 UTC. Before 1989-08-29 Horizons describes the Voyager trajectories as a patched-conic mission-design fit "providing a rough accuracy", so these times can differ from the navigated ones by minutes; that moves the epoch, not the size of the planet error.
- **Fixture:** `packages/astraeus/tests/fixtures/planet-accuracy-o063-horizons.json` (87 KB; source, settings, retrieval date inside; rows rounded to 1 m), written by `packages/astraeus/tools/import/planet-accuracy-fetch.mjs` (raw replies in the git-ignored `.horizons-cache`).

## Causes, each measured

| Candidate | Measured | Verdict |
|---|---|---|
| The Chebyshev refit | Fit minus the full VSOP87A series at every epoch: under 0.3 km | Not a cause |
| Time scale (UTC/TT/TDB) | Engine TT−UTC minus Horizons TDB−UT: 0.003 s or less from 1962; 0.71 s in 1955 (Horizons reads UT1 before 1962), 3.8 km of Neptune's motion | Not a cause (the known pre-1972 limit, a few km) |
| Planet centre vs system barycentre | Horizons centre minus barycentre: Jupiter 154 to 213 km, Saturn 276 to 295, Uranus 88 (1986) and 712 (2020), Neptune 74 to 210. The engine is about as far from the barycentre as from the centre (Neptune 1989: 13,347 against 13,338 km) | Small beside the series' error; becomes the main term once the series is fixed |
| Sun's centre vs solar-system barycentre | The Sun is 0.2 to 1.4 million km from the barycentre at these dates | Would give errors of a million km. Voyagers used `500@10`, so this was not its cause; a host that fetches `@0` vectors would see it |
| Frame turn | One fixed small rotation fitted to Jupiter and Saturn over 1950–2044 (about 0.22 arcsec, mostly about the ecliptic pole) cuts their angular error from 0.23 to 0.085 arcsec rms (Jupiter's worst 1,290 to 611 km). The same fit over all four outer planets helps little (0.66 to 0.60 arcsec) | A frame offset between VSOP87's ecliptic and Horizons' ICRF ecliptic is a real part of Jupiter's and Saturn's error; it is not Uranus's or Neptune's |
| The series' own orbit | What is left: Uranus up to 20,023 km and Neptune up to 43,747 km over the span, unchanged by any rotation or time shift | The main cause at Uranus and Neptune. VSOP87A (1988) is a fit to an older JPL ephemeris made before Voyager 2's tracking pinned these two planets down |
| The scene's own ecliptic-to-equator turn | Orb's ecliptic J2000 to equatorial turn differs from Horizons' by up to 902 km at Neptune's distance (about 0.04 arcsec) | Cancels for a host that passes Horizons ecliptic vectors with `plane: "ecliptic-j2000"` (probe and planet take the same turn); a host passing Horizons ICRF-equator vectors sees it added (the scene figures differ from the ecliptic ones by up to 174 km at these epochs) |

The current provenance says "compared at six dates from 1969 to 2030" with maxima (Neptune 36,192 km) below the 1950 to 2044 maxima measured here (Neptune 43,747 km): whichever option is chosen, the provenance figures should be replaced by these.

## Recommendation: Horizons barycentres for every planet

One general rule, no special case for a planet or a probe: **every planet's series is a fit of its system barycentre from Horizons (DE441), and the planet's own offset from that barycentre comes from its moon package when loaded.** Pluto already works this way (`planet-fits.mjs` fits body 9 from Horizons; `PLUTO_BINDING` adds the offset from its system's centre series). The fix generalises both to Mercury through Neptune (for a planet without a moon system, barycentre and centre are within metres: Mercury, Venus; Mars's under a metre).

- **Accuracy gained:** at the flybys, from 629 to 13,338 km down to the fit tolerance (the importer's 1 km target) where the moon package covers the date (main moons and planet 1950 to 2030), and to the planet's wobble about its barycentre without it (up to about 300 km, Saturn; 213 km Jupiter; 74 to 210 km Neptune). Across the span, Neptune's worst goes from 43,747 km to about 1 km with its moon package and at most about 210 km without.
- **Download:** a barycentre is as smooth as the VSOP87A orbit it replaces, so the importer's existing size search should land at about today's 432 KB `planets.json` (Pluto's Horizons fit is 19 KB of base64 against 25 to 52 KB for the VSOP87A giants). Estimate, to be measured by the importer: not verified in this step.
- **Years:** 1950 to 2045 kept (Horizons covers them; the fetch is about 140,000 six-hourly rows per planet, in the importer's existing cached, paced requests).
- **Effort:** one build step and one test step: run `planet-fits.mjs` with Horizons as the source for every planet; give each planet with a moon system the offset binding Pluto has; replace `planetFits.test.ts`'s comparison with the series by one with Horizons; rewrite the planet provenance (source DE441, measured figures). A data change in the core package, so the owner approves it (DATA-01).
- **Rejected:** a fixed frame correction on top of VSOP87A (fixes part of Jupiter and Saturn only); fitting each planet's centre directly (its moon wobble needs short segments, so a much larger core file, and it duplicates the moon packages).

## Alternative: state it and stop

Change no positions. Replace each planet's accuracy text with the figures measured here, for example "Neptune: up to 43,747 km from the JPL Horizons (DE441) planet centre over 1950 to 2044 (13,338 km at Voyager 2's 1989 closest approach); VSOP87A's own error", and add a README line for probe apps: near a flyby, place Horizons planet-centred samples on the engine's planet (what the Voyagers app does). Cost: a provenance and README edit; apps keep re-placing samples.
