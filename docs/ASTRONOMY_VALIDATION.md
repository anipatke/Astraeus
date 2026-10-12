# Astronomy provider evaluation and reference validation

Research performed 2026-10-06 for O-001/T-001. The local values below were reproduced from the pinned npm tarball in `/tmp/astraeus-orb-eval/package`; this records provider research, not yet a claim about the Astraeus implementation.

## Provider comparison

| Capability | `@lizard-isana/orb` 3.1.1 | `astronomy-engine` 2.1.19 | Astraeus consequence |
|---|---|---|---|
| Moon position | `Luna().xyz(Date)` supplies a geocentric ecliptic-of-date position in km from a truncated Meeus-style series. | `GeoMoon(date)` supplies geocentric equatorial J2000 position in AU; `GeoMoonState` also supplies velocity. | Orb's root Moon result needs one explicit ecliptic-of-date → EQJ conversion. Its observed results meet the current fixture targets; there is no measured need to add a second provider. |
| Time | `AstroInstant` accepts UTC `Date`/Unix milliseconds, stores two-part TT Julian date, and supports UTC, UT1 and TT. `dut1` defaults to 0; JS `Date` cannot represent a leap-second label. Legacy `Luna` accepts `Date` and applies Orb's `delta_t()` conversion internally. | Public date-based APIs accept JavaScript `Date`; the reviewed Moon API does not expose the same structured UTC/UT1/TT object boundary. | Keep absolute UTC milliseconds in Astraeus and construct `AstroInstant` only inside the adapter. Do not claim leap-second-label support or observatory-grade Earth orientation. |
| Frames and transforms | `/frames` provides explicit centers, km/km/s states, EQJ/ecliptic/date/ECEF/TEME frame graph, IAU 2006 precession, IAU 2000B nutation and IAU 1982 GMST rotation. | `GeoMoon` directly returns EQJ, but the reviewed API does not provide Orb's same general state/frame conversion and center operations. | Use Orb conversions internally; expose only Astraeus `EQJ` and named centers. The implemented adapter will validate its returned frame and center. |
| Earth/Sun | `/models/earth-epv00` provides Earth and Sun EQJ states in km and km/s, based on ERFA EPV00 fitted to DE405, with stated 1900–2100 validity and approximately 1 arcsecond source accuracy. | The reviewed Moon API was the relevant candidate; no need was established to add it for Sun states. | Use EPV00's geocentric Sun vector, checked against DE441 Horizons fixtures. The model's source accuracy statement is not a project-wide accuracy guarantee. |
| Kepler propagation | `/kepler` has a universal-variable two-body propagator for elliptic, parabolic and hyperbolic states, in km, km/s, seconds, radians and km³/s². It is unperturbed two-body propagation, not a lunar ephemeris. | Not needed for the selected Moon ephemeris path. | Do not propagate the Moon with a hand-built Kepler orbit; query the dated Moon ephemeris instead. |
| Orientation and Sun geometry | Frame transforms provide date-dependent Earth rotation/orientation inputs; EPV00 provides Sun/Earth geometry. Orb does not provide a physical lunar body-fixed attitude with libration. | `GeoMoon` supplies an EQJ direction/state; it does not by itself supply the selected Earth orientation and EPV00 combination. | Compute Earth orientation from Orb's ECEF→EQJ transform. Derive a stable approximate Moon lock basis from the Earth-facing direction and local orbital-plane normal. Compute lunar illuminated fraction from Moon→Sun and Moon→Earth vectors. Exclude libration, polar motion and eclipse claims. |
| License and package shape | MIT package; the selected EPV00 subpath includes its ERFA notice. Package also contains an SGP4 module and its Python-SGP4 notice, which Astraeus does not use. | MIT, no runtime dependencies in the reviewed npm metadata. | Pin Orb 3.1.1 alone. Preserve Orb, ERFA and Python-SGP4 notices with the spike; the last notice is included because it is shipped in the pinned package, not because Astraeus calls SGP4. |

Primary sources reviewed:

- [Orb.js 3.x repository and documentation](https://github.com/lizard-isana/orb.js/), especially [`Luna`](https://github.com/lizard-isana/orb.js/blob/master/src/orb-luna.js), [structured frames](https://github.com/lizard-isana/orb.js/blob/master/src/frames/state.js), [sidereal rotation](https://github.com/lizard-isana/orb.js/blob/master/src/frames/sidereal.js), [time](https://github.com/lizard-isana/orb.js/blob/master/src/time/astro-instant.js), [EPV00](https://github.com/lizard-isana/orb.js/tree/master/src/models/earth-epv00), and [Kepler](https://github.com/lizard-isana/orb.js/tree/master/src/kepler).
- [Orb.js npm package metadata](https://www.npmjs.com/package/%40lizard-isana/orb), evaluated release 3.1.1; package tarball integrity: `sha512-HvsGZ2TJOgha7yPHoTyeFYD0Ysu/adGi4qGTxR9pF0iIAUIW01cHlfOTtiGzCO8lPv5l9igye3SHH6rab0iRnw==`.
- [Astronomy Engine project](https://github.com/cosinekitty/astronomy), [JavaScript `GeoMoon` reference](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md#geomoondate--vector), and [npm release metadata](https://www.npmjs.com/package/astronomy-engine?activeTab=versions), evaluated release 2.1.19.
- [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) and [user manual](https://ssd.jpl.nasa.gov/horizons/manual.html).
- [US Naval Observatory Moon phases and API](https://aa.usno.navy.mil/data/MoonPhases), endpoint documentation at [USNO API](https://aa.usno.navy.mil/data/api.html).
- IAU SOFA's public `iauGmst82` validation example, mirrored in [rsofa's source archive](https://docs.rs/rsofa/0.4.5/src/extern/src/t_sofa_c.c).

## Selected provider and conversion boundary

Use only `@lizard-isana/orb@3.1.1` behind `src/core/astronomyAdapter.ts`.

For the Moon, pass the requested UTC instant as a JavaScript `Date` to `Luna().xyz`, read its Earth-centered km vector in ecliptic-of-date, wrap that vector in Orb's structured state at the same instant, and transform it to `equatorial-j2000`. Copy the returned numbers into Astraeus-owned `Float64Array` storage. For the Sun, use `AstroInstant.fromUnixMs(utcMs)` and `sunEpv00` directly; its returned state is Earth-centered, EQJ and km. The Earth heliocentric state is `earthEpv00`; Moon/Sun is formed by vector addition from the two explicit center states.

The conversion functions reject invalid timestamps and non-finite coordinates. UTC-to-TT conversion occurs inside `AstroInstant`; Orb's legacy Moon routine independently applies its `delta_t()` approximation to its `Date` input. The two routines were compared together against UTC-tagged Horizons vectors below. Earth orientation uses Orb's EQJ↔ECEF transform with `dut1=0` unless a future caller supplies a sourced DUT1 value. Orb's frame path uses IAU 2006 precession, IAU 2000B nutation and IAU 1982 GMST; its frame source also uses the nominal Earth rotation rate `7.292115146706979e-5 rad/s` for rotating-frame velocity conversion. This is adequate for the visual spike and is not an IERS Earth-orientation solution. No Orb class, state, units token or frame string is part of the Astraeus public API.

Orb's package is pinned exactly, with npm lockfile integrity. Preserve the package's `MIT-LICENSE`, `src/models/earth-epv00/LICENSE-ERFA` and `src/sgp4/LICENSE-python-sgp4` texts in `licenses/`. The selected astronomy dependency has no runtime dependencies; no Astronomy Engine dependency is justified by this task's evidence.

## Scientific state conventions

`Earth` and `Moon` radii are their volumetric mean radii: 6371.0 km and 1737.4 km, respectively, from NASA NSSDC's [Earth](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html) and [Moon](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) fact sheets. Positions and optional velocities use km and km/s. The Sun is a geometric source in this spike; it has no modeled body attitude or radius requirement.

All Astraeus scientific positions are right-handed equatorial J2000 (EQJ) vectors: +X points to the mean equinox, +Z to the north celestial pole, and +Y completes the frame. A state orientation is a normalized Hamilton quaternion `[x,y,z,w]` mapping the body's local +X/+Y/+Z axes into EQJ. Earth local axes are the Orb ECEF axes: +X at the equator/Greenwich meridian, +Y at 90° east, +Z north. The Moon's local +X points toward Earth, +Z is the local orbit normal from the dated Moon trajectory, and +Y completes a right-handed basis. This is a zero-libration approximation; it does not claim a cartographic texture-axis alignment.

State factories copy caller coordinate buffers into owned `Float64Array` snapshots and never retain caller buffers. JavaScript cannot freeze typed-array elements, so callers must treat returned scientific buffers as read-only. Scale policies return separate arrays. State has no Three.js, rendering-axis or display-metadata fields; conversion to render coordinates belongs downstream.

The clock and state timestamp use integer UTC Unix milliseconds, matching JavaScript `Date` resolution. The clock derives time from its anchor and monotonic elapsed duration, then truncates sub-millisecond results; JavaScript `Date` cannot represent the `23:59:60` leap-second label. Orb converts UTC to TT internally for its structured models. Orb's Earth rotation transform defaults DUT1 to zero, so Earth orientation is date-based and visually credible but not an IERS precision solution.

`TrueScale` divides positions and radii by 6371 km, retaining all ratios. `ReadableScale` divides positions by the same normalization and applies an initial distance factor of 0.1; body radii use the unchanged TrueScale mapping. Both functions allocate new positions and do not modify State.

## JPL Horizons fixtures

Raw responses are archived in [`moon-horizons-source.txt`](../tests/fixtures/moon-horizons-source.txt) and [`sun-horizons-source.txt`](../tests/fixtures/sun-horizons-source.txt); normalized offline vectors are in the corresponding `*-horizons.json` fixtures.

Both queries used the JPL Horizons API Vectors endpoint with `COMMAND=301` (Moon) or `COMMAND=10` (Sun), `CENTER=500@399` (Earth center), `EPHEM_TYPE=VECTORS`, `VEC_TABLE=2` position components, `VEC_CORR=NONE` (geometric; no light-time/aberration), `OUT_UNITS=KM-S`, `REF_SYSTEM=ICRF`, and discrete `TLIST` samples. The raw headers report DE441, geometric cartesian output, position-only format, km-s units and UTC labels. Requested samples:

| UTC sample | Purpose |
|---|---|
| 2022-06-01 00:00:00 | earlier year and lunar distance |
| 2024-01-01 00:00:00 | phase-window start |
| 2024-01-08 00:00:00 | waxing crescent |
| 2024-01-15 00:00:00 | near first quarter |
| 2024-01-22 00:00:00 | near full Moon |
| 2024-01-28 07:43:11.390 | recurrence boundary, 27.321659606 days after Jan 1 |
| 2024-01-29 00:00:00 | waning phase |
| 2025-06-01 00:00:00 | later year |

Horizons returned UTC calendar labels and JDUT. The Orb adapter accepts those samples as UTC Unix milliseconds; `AstroInstant` maps UTC to TT using its leap-second table, while the legacy lunar routine maps its `Date` using Orb's `delta_t()`. The raw ICRF output is compared to Orb's EQJ output, using the standard J2000/ICRF alignment. That frame tie is far below these acceptance tolerances. The archived raw headers identify response generation on 2026-10-05 at 13:10:10 and 13:11:05 Pasadena time; both identify DE441. Ordinary tests use the archived normalized files and make no network calls.

Measured with the exact Orb 3.1.1 tarball and the above conversions across the eight archived samples:

| Target | Max angular separation | Max range residual | Acceptance target | Result |
|---|---:|---:|---:|---|
| Moon 301 relative Earth 399 | 0.071 arcmin (Jan 22, 2024) | 6.39 km (Jun 1, 2025) | ≤2 arcmin and ≤100 km | Pass |
| Sun 10 relative Earth 399 | 0.008 arcsec | 1.37 km | ≤1 arcmin and ≤100 km (spike sanity target) | Pass |

These are measured sample maxima, not global error bounds or guarantees for every valid JavaScript date. The Moon model is truncated and no lunar libration is supplied. The Sun comparison validates this small date sample; EPV00's published model validity remains 1900–2100.

For approximate sidereal recurrence, the Jan 1 position and the Jan 28 07:43:11.390 position are separated by 27.321659606 days. Their Moon-vector directions differ by 0.294954 degrees and their ranges by 655.927 km. Tests therefore allow 0.6 degrees and 1,500 km; this roughly doubles the actual sampled residual and acknowledges that a modern perturbed orbit does not close after a named month. It is a sanity check, not an ephemeris accuracy target.

## Independent phase and Earth orientation checks

[`usno-moon-phases-2024.json`](../tests/fixtures/usno-moon-phases-2024.json) preserves the USNO API v4.0.1 response for 2024. The selected phase events are Jan 4 03:30 UTC (last quarter), Jan 11 11:57 (new), Jan 18 03:52 (first quarter), and Jan 25 17:54 (full). The geometric fraction is

```text
clamp((1 + unit(Moon→Sun) · unit(Moon→Earth)) / 2, 0, 1)
```

using same-time, geometric EQJ vectors. The recorded Orb 3.1.1 values are 0.501443, 0.001911, 0.501177 and 0.998254. Tests allow absolute error 0.01 from the USNO event's ideal fraction (0, 0, 0.5, 1); this intentionally tolerates the difference between a named phase event and the simplified geometric model. This does not claim observed topocentric phase or include lunar shadow geometry.

For Earth rotation, Orb's `gmst82` was checked at UT1 JD 2453736.5 against the IAU SOFA validation value `1.754174981860675096` radians; the difference was about `1.29e-12` radians. A separate 24-hour check advances sidereal phase by approximately 360.985647366 degrees. These tests establish convention and rotation behavior; they do not remove the adapter's documented `dut1=0` default or substitute for polar-motion data.

## Planets: Mercury, Venus, Mars and Jupiter (O-014 / T-048)

### Position

`planetPositionFromSunKm(planet, t)` on the adapter takes the pinned Orb 3.1.1 `Mercury`, `Venus`, `Mars` and `Jupiter` VSOP87A series, reads the heliocentric ecliptic-J2000 position in au, and converts it to EQJ km about the Sun through Orb's `ecliptic-j2000` to `equatorial-j2000` transform, checking the library's documented coordinate, unit and centre labels like the other methods. **The full coefficient series is registered** (`@lizard-isana/orb/vsop87a/*`). The compact default table was measured first and is not usable here: against the same six Horizons dates its largest vector error was 18,929 km (Mercury), 2,877 km (Venus), 80,199 km (Mars) and 142,044 km (Jupiter). The full series cost about 780 kB of unminified source across the four planets (see the build size recorded in the Task evidence).

Raw Horizons responses are archived in [`planets-horizons-source.txt`](../tests/fixtures/planets-horizons-source.txt) (four concatenated API responses, each preceded by a `==== QUERY ... ====` line giving the exact parameters; the text of each response is unaltered). Fetched 2026-10-12 with `curl` against `https://ssd.jpl.nasa.gov/api/horizons.api` (`format=text`, `COMMAND` 199, 299, 499, 599, `CENTER='500@10'` the Sun's body centre, `EPHEM_TYPE=VECTORS`, `VEC_TABLE=1` position only, `VEC_CORR=NONE` geometric, `OUT_UNITS=KM-S`, `REF_SYSTEM=ICRF`, `REF_PLANE=FRAME`, `TIME_TYPE=UT`, `TLIST` of JD 2440423.5, 2446217.5, 2451545.0, 2455378.5, 2460310.5, 2462653.5). The normalized vectors are in `planets-horizons.json`. Targets are Mercury, Venus (DE441) and Mars (`mar099` satellite ephemeris on DE441) and Jupiter (`jup365_merged` on DE441) body centres. The 2030 sample is labelled `UT~` by Horizons, because UTC for that date uses a predicted leap-second offset.

| UTC sample | Why |
|---|---|
| 1969-07-21 00:00 | start of the validated range |
| 1985-06-01 00:00 | mid-range |
| 2000-01-01 12:00 | J2000 |
| 2010-07-01 00:00 | mid-range |
| 2024-01-01 00:00 | recent |
| 2030-06-01 00:00 | end of range |

Measured maxima over the six samples (Orb 3.1.1, full VSOP87A, `tests/planets.test.ts`):

| Planet | Max angular separation | Max range residual | Max vector distance | Test target |
|---|---:|---:|---:|---|
| Mercury 199 | 0.108 arcsec | 1.7 km | 30.4 km | under 40 km, 0.5 arcsec |
| Venus 299 | 0.095 arcsec | 0.9 km | 50.1 km | under 70 km, 0.5 arcsec |
| Mars 499 | 0.092 arcsec | 3.5 km | 95.8 km | under 120 km, 0.5 arcsec |
| Jupiter 599 | 0.325 arcsec | 166.9 km | 1269.4 km | under 1500 km, 0.5 arcsec |

These are sample maxima, not bounds for every date. They are recorded in each definition's `accuracy.position`, with the sampled range (1969-07-21 to 2030-06-01) as `accuracy.validUtc`; outside it the series is extrapolated without a measurement. Geometric positions only (no light time or aberration). No velocity is modelled for planets.

### Orientation

`src/core/iauRotation.ts` builds the body-to-EQJ rotation from a pole right ascension and declination (linear per Julian century) and a prime meridian W (linear per day), all from J2000 and counted here in TT days from the adapter's `daysSinceJ2000Tt` (TT standing in for TDB, a difference under 2 ms). Body +Z is the pole, +X the prime meridian and +Y completes the basis. The constants come from the IAU Working Group report of 2015 (Archinal et al., Celest. Mech. Dyn. Astron. 130, 22, 2018) as transcribed in NAIF `pck00011.tpc` (fetched 2026-10-12); the exact kernel lines are archived in [`iau-pck-excerpt.txt`](../tests/fixtures/iau-pck-excerpt.txt) and a test asserts the shipped numbers equal them. The report's periodic nutation and libration terms are left out (Mercury's would reach about 0.01 degrees in W; Mars's and Jupiter's pole terms are below 0.001 degrees), and the secular terms only are kept.

Independent check: Horizons' OBSERVER table for Mars and Jupiter at the same six dates, quantities 14 and 20 ([`planets-rotation-horizons-source.txt`](../tests/fixtures/planets-rotation-horizons-source.txt), fetched 2026-10-12, geocentre, normalized in `planets-rotation-horizons.json`). `ObsSub-LON` is the sub-observer planetographic longitude, west positive. The test makes the same number by taking the planet one light time ago, the Earth now, and the Earth direction in the body frame. Results:

| Case | Max sub-Earth longitude difference | Test tolerance |
|---|---:|---:|
| Jupiter, shipped constants (System III, identical in both reports) | 0.0051 degrees | 0.02 |
| Mars, IAU 2009 constants (NAIF `pck00010.tpc`) | 0.0028 degrees | 0.02 |
| Mars, shipped IAU 2015 constants | 0.934 degrees | under 1.2, over 0.3 |

Horizons evidently uses the earlier IAU 2009 Mars constants (pole 317.68143, 52.88650; W0 176.630) for its Mars frame: with those the code reproduces it to 0.003 degrees, which validates the rotation maths, light-time handling and time scale. The shipped Mars data are the 2015 report's (pole 317.269202, 54.432516; W0 176.049863), which moved the Mars pole by about 1.5 degrees and W by up to about 0.9 degrees at these dates; that difference is a change between published reports, not an error, and the 0.934 degree figure is the measured size of it. Mercury and Venus rotation were not compared with Horizons (unverified); their constants are checked only against the NAIF excerpt. Jupiter's latitude comparison is limited by Horizons' planetographic versus the model's planetocentric latitude.

### Dimensions and gravitational parameters

Radii are from the NASA NSSDC fact sheets (read 2026-10-12): Mercury volumetric mean 2439.7 km; Venus 6051.8 km (equatorial and polar equal); Mars 3389.5 mean, 3396.2 equatorial, 3376.2 polar; Jupiter 69,911 mean, 71,492 equatorial (1 bar), 66,854 polar. Gravitational parameters (km^3/s^2) are from the physical-data header of the Horizons API for each planet (Mercury 22031.86855, Venus 324858.592, Mars 42828.375662, Jupiter 126686531.9; fetched 2026-10-12). The Horizons header's volumetric mean radius for Mercury is 2439.4 km; the fact-sheet 2439.7 is used.
