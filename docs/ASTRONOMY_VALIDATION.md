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

## Io about Jupiter (O-014 / T-049)

### Source of the elements

Mean orbital elements of Io about Jupiter are the JPL Solar System Dynamics "Planetary Satellite Mean Elements" table (`https://ssd.jpl.nasa.gov/sats/elem/`, ephemeris JUP365 after R. A. Jacobson 2021, read 2026-10-12), row for Io (501), Laplace-plane frame, epoch 2000-01-01.5 TDB: a = 421,800 km, e = 0.004, omega = 49.1 deg, M = 330.9 deg, i = 0.0 deg, node = 0.0 deg, P = 1.762732 d, period of the apsides 1.333 yr, Laplace-plane pole RA 268.1 deg, Dec 64.5 deg, tilt 0.0 deg. The page itself warns the elements "are not intended for ephemeris computation". Jupiter's GM, 126,686,531.9 km^3/s^2, is the Horizons physical-data value recorded in T-048; Io's GM 5959.9155 and mean radius 1821.49 km are printed in the Horizons satellite header archived in `io-horizons-source.txt` (the radius is 3642.98 km as a diameter, the one-Io-diameter line).

### How the elements become a position

`src/core/bodies/io.ts` builds the Laplace plane as an EQJ-plane orbit with inclination 90 - Dec and node RA + 90 deg (the plane whose pole is RA/Dec, with its node reference on the EQJ equator), keeps omega as the table gives it, converts M to the true anomaly by solving Kepler's equation, and propagates by unperturbed two-body motion about Jupiter's GM through `createTwoBodyTrajectory` (no contract change). Two choices came from measurement against Horizons, not from the table text:

- J2000 in UTC is 64.184 s before 2000-01-01 12:00 UTC (TT minus UTC); the epoch is converted, because 64 s of Io's motion is about 1100 km.
- The table's P (1.762732 d) is the anomalistic period, not the sidereal one, and the period of the apsides is given without a sign. A fixed ellipse cannot precess, so the semi-major axis is the one whose two-body period equals the sidereal period 1 / (1/P - 1/Papsis) = 1.7691 d (the retrograde sign; the Horizons header says about 1.77 d). Tried first, the table's own a of 421,800 km gives a period of 1.7699 d and the prograde sign 1.756 d.

| Variant | Distance from Horizons at the six dates (km), 1969 to 2030 |
|---|---|
| Table a, M from epoch | 301,922; 785,042; 830; 18,355; 632,498; 319,784 |
| a from the anomalistic period (1.762732 d) | 396,570; 150,618; 1,335; 323,870; 14,739; 454,808 |
| a from a prograde sidereal period (1.756 d) | 700,704; 297,183; 2,218; 598,463; 23,931; 768,224 |
| **a from the retrograde sidereal period (shipped)** | **2,398; 1,114; 826; 2,780; 5,537; 9,387** |

### Horizons comparison

Raw Horizons response archived in [`io-horizons-source.txt`](../tests/fixtures/io-horizons-source.txt) (one API response preceded by a `==== QUERY ... ====` line with the exact parameters; text unaltered). Fetched 2026-10-12 with `curl` against `https://ssd.jpl.nasa.gov/api/horizons.api` (`format=text`, `COMMAND='501'`, `CENTER='500@599'` Jupiter's body centre, `EPHEM_TYPE=VECTORS`, `VEC_TABLE=1`, `VEC_CORR=NONE`, `OUT_UNITS=KM-S`, `REF_SYSTEM=ICRF`, `REF_PLANE=FRAME`, `TIME_TYPE=UT`, `TLIST` the same six Julian dates as the planets: 2440423.5, 2446217.5, 2451545.0, 2455378.5, 2460310.5, 2462653.5). Target Io (501) and centre Jupiter (599) are both `jup365_merged`. Normalized vectors: `io-horizons.json`.

Largest Jupiter-centred position difference: **9,387.5 km (2.58 Io diameters)**, at 2030-06-01; the J2000 sample is 825.5 km. The one-Io-diameter line (3,643 km) is exceeded, so Io's record says "approximate demonstration" and the figure is in its known limitations; the test asserts the recorded figure (9,388 km, rounded up) equals the measured one and that the classification follows from it. The error grows away from the epoch (mean elements fitted for a precessing ellipse, no Europa and Ganymede resonance, fixed rather than precessing periapsis). Orientation is the Moon's approximate tidal lock about Jupiter (near side towards the parent, no libration).

### Lighting model measurement

Each frame's lit body is lit along its own Sun direction (one pass per body), or by one point light at the Sun's scaled position (`?lighting=single-sun`, a measurement mode). Geometric result on the four January 2024 USNO phase events, True and Readable scales, Moon seen from Earth (`tests/jupiterIo.test.ts`): the point light's illuminated fraction differs from the per-body figure by at most 7.2e-9 and its direction by at most 1.5e-6 degrees (float32 narrowing included); one directional light pointed at the scene centre differs by 1.36e-3 in fraction and 0.156 degrees. Rendered comparison (`tools/validate/browser-lighting.mjs`, headless Chromium, per-pixel mean difference of 255 over lit pixels): Earth 0.0 and 0.006, Jupiter 0.004 and 0.006, Io 0.0, 0.0 and 0.0; Moon 7.7 to 13.0, which is brightness only: Earth's light is stronger (1.8/0.18) than the Moon's (1.4/0.08) and one light has one strength. With the Moon's own strength the Moon difference is 0.0005 to 0.009. Recommendation: keep per-body lights for Spike 04; the single point light is viable for larger systems.

## 109P/Swift-Tuttle about the Sun (O-011 / T-054)

### Source of the elements

JPL Small-Body Database API (`https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=109P&full-prec=1&phys-par=1`, fetched 2026-10-15T08:39Z), solution SB405-CPV-2 (M.S.W. Keesey, 2001-10-09; 652 observations 1737 to 1995), epoch JD 2450000.5 TDB (1995-10-10), ecliptic J2000: e 0.963225755046038, a 26.0920694978266 AU, i 113.453816997171 deg, node 139.3811920815948 deg, omega 152.9821676305871 deg, M 7.631696167124212 deg, tp JD 2448968.499784556297, period 48681.19346262312 d, aphelion 51.2246 AU. The raw response is archived in [`swift-tuttle-horizons-source.txt`](../tests/fixtures/swift-tuttle-horizons-source.txt) (first of two responses, each preceded by a `==== QUERY ... ====` line); `tests/swiftTuttle.test.ts` asserts every constant equals the archived value. Nucleus diameter 26 km (Lamy, Toth, Fernandez and Weaver 2004, Comets II, pp. 223-264, as SBDB prints it), so radius 13 km, which is also what Horizons prints (`RAD= 13.`). Neither source gives a gravitational parameter for the comet, so none is recorded and it cannot be a centre.

### How the elements become a position

`src/core/bodies/swiftTuttle.ts` converts M to the true anomaly by solving Kepler's equation and propagates by unperturbed two-body motion about the catalogue's solar GM through `createTwoBodyTrajectory`. The epoch is converted from TDB to UTC (TT minus UTC was 61.184 s in October 1995; a 61 s error would move the comet at most 2.6 thousand km, small beside the figures below). The model period from the catalogue's GM is 48681.19347 d against SBDB's 48681.19346 d. There are no planetary perturbations and no non-gravitational forces; the accuracy record says so.

### Horizons comparison

Raw Horizons response archived in the same file, second response, with its query line: fetched 2026-10-15T08:39:41Z against `https://ssd.jpl.nasa.gov/api/horizons.api` (`format=text`, `COMMAND='DES=109P;CAP'` (solution JPL#32, the same fit as SBDB, small perturbers on), `CENTER='500@10'`, `EPHEM_TYPE=VECTORS`, `VEC_TABLE=1`, `VEC_CORR=NONE`, `REF_SYSTEM=ICRF`, `REF_PLANE=FRAME`, `OUT_UNITS=KM-S`, `TIME_TYPE=UT`, eight dates in `TLIST`). Positions parsed into [`swift-tuttle-horizons.json`](../tests/fixtures/swift-tuttle-horizons.json); ICRF is treated as EQJ and UTC as UTC. A date list is not a bound for other dates.

| Date (UTC) | Distance from the Sun | Difference from Horizons | As a fraction of the distance |
|---|---|---|---|
| 1990-01-01 | 10.14 AU | 2,715,375 km | 0.179% |
| 1991-01-01 | 7.61 AU | 1,896,210 km | 0.167% |
| 1992-12-12 (perihelion) | 0.958 AU | 1,228,932 km | **0.857%** |
| 2000-01-01 12:00 | 18.06 AU | 1,527,641 km | 0.057% |
| 2010-01-01 | 30.63 AU | 4,587,715 km | 0.100% |
| 2020-01-01 | 38.91 AU | 7,592,269 km | 0.130% |
| 2026-08-13 | 42.94 AU | 9,384,149 km | 0.146% |
| 2030-01-01 | 44.65 AU | **10,686,093 km (0.0714 AU)** | 0.160% |

Maximum error **10,686,093 km (0.071 AU) at 2030-01-01**; largest fraction 0.857% at the 1992 perihelion. The error grows with distance from the 1995 epoch because Horizons integrates the same fit with the planets' pull and a fixed two-body ellipse cannot. **Classification: approximate.** A body's own diameter is no yardstick (the nucleus is 26 km), so the line is the comet's distance from the Sun: within 1% at every compared date is good enough to draw the orbit and the comet's place on it at overview scale, not an ephemeris and not good enough for a close approach. The test asserts the recorded figure and that the classification follows from it (`tests/swiftTuttle.test.ts`, "has a maximum Sun-centred error equal to the figure the definition records" and "has a largest fractional error equal to the recorded one"). Validity is stated as 1990 to 2030 only; the 2026 comparison date is the nearest to the Perseid peak the comparison covers.

### Drawing a long orbit (O-011 / T-054)

Even-in-time sampling of an e = 0.96 orbit leaves a few long chords across the sharp end. `eccentricPathTimesUtcMs` (`src/core/sunCentredSources.ts`) spaces the samples evenly in eccentric anomaly instead; the source is still asked for its own state at each time, so the line passes through the source's positions. Measured on a made-up e = 0.96, a = 26 AU orbit (`tests/longOrbitPaths.test.ts`), longest chord as a fraction of the local orbit radius (mean of the segment's end radii):

| Samples | Even in time | Even in eccentric anomaly | Ratio |
|---|---|---|---|
| 256 | 1.708 | 0.172 | 9.9 |
| 512 (default for such a path) | 1.373 | 0.086 | 16.0 |

At 256 samples the ratio misses the one-tenth requirement by a hair, so a path declared with `sampling` defaults to 512 samples (a setting, `PathLayer.samples`). Precision 50 AU out is measured in the browser with the method of `tools/validate/browser-precision.mjs`; figures are in the Task evidence and the run directory named there.

## Perseid stream from measured CAMS orbits (O-011 / T-038)

### Source and what is drawn

The stream is the 18,699 bound Perseid orbits (IAU shower 7) of the CAMS Meteoroid Orbit Database v3.0 (`CAMS-v3-2010to2016.xlsx`, 321,511,540 bytes, SHA-256 `ec886496...a85845`, the release T-051 recorded; Jenniskens et al. 2018, Planetary and Space Science 154, 21-29). `tools/data/fetch-meteoroid-orbits.mjs 7` downloads it, reads the workbook with Node built-ins only and writes `data/local/cams-iau-7.json` (git-ignored; never committed, never in a public build, no stand-in when absent). The workbook uses the 1904 date system, so the Date serial plus 1,462 days is the 1900 serial. **The header labels sit over the wrong letters** (for example "a" is printed over BJ while its values are in BL, "Shower I.D." over AM while the shower number is in AK), so the tool reads the letters found from the data (shower AK; a BL, e BM, i BO, w BQ, node BS; solar longitude BF; Catalog # A; date C and time D, repeated in AN and AO) and verifies them from the values on every run: elements in range, the repeated date and time equal to 9 s, and the node within 1 degree (mod 180) of the solar longitude for at least 95% of the rows.

IAU 7 has 24,928 records; 6,229 have e >= 1 (a is the sentinel 999) and are dropped; 18,699 remain, none with a <= 0 and none with an empty element. All 18,699 are drawn (under the 20,000 line). Each dot's `recordId` is its Catalog # and the file keeps its sheet row. A sample of 20 members resolves to its record: the member's own energy gives back the record's semi-major axis to 1e-4, and with `CAMS_XLSX` set the same 20 are read back from the workbook (catalogue number, shower and elements equal), run 2026-10-15 against the scratch copy of the workbook.

### The clump near the comet

Each orbit's dot is placed by an even spread of mean anomaly (illustrative); 30% of the dots are placed within 20 degrees of mean anomaly of 109P's (about 15 years of its 133-year orbit), settings in `data/showers/perseids.json`. These are **illustrative defaults, not a published fit**: no citation is claimed. Because the orbits differ in size (CAMS `a` runs 12 to 49 AU in the worked examples T-051 recorded, against the comet's 26 AU), members at the comet's phase lie along the same direction from the Sun at their own distances, so the clump is a band at the comet's phase and not a blob on the comet; the panel says so.

### Factual checks (`tests/showersMeasured.test.ts`, run with the fetched data)

Method: the measured ellipses themselves (not the dots), from the elements in the ecliptic J2000 frame, with Earth from the engine's ephemeris and the Sun's GM; the geometry is in `tests/helpers/streamFacts.ts` and does not use the engine's propagation. **Convention (I-027): J2000 against J2000.** The IAU MDC file states "All records on J2000" and the CAMS solar longitudes are J2000 too, so the published peak 140.1 degrees is a longitude in the J2000.0 ecliptic and equinox. The helper therefore uses the Sun's geometric J2000 longitude (Earth's heliocentric longitude in the J2000 ecliptic plus 180 degrees); general precession is not added (adding it gives the longitude of date, 0.37 degrees larger in 2027, and had put the peak about 9 hours early); aberration and nutation, under 0.01 degree, are not applied. The browser check (`tools/validate/browser-showers.mjs`) uses the Astronomical Almanac low-precision formula, which is of date, and subtracts general precession (5,028.796 arcsec per Julian century, IAU 2006 / Capitaine et al. 2003). `tests/solarLongitudeConvention.test.ts` pins the convention against JPL Horizons geometric vectors of Earth about the Sun in the J2000 ecliptic (fetched 2026-10-16, raw response in `tests/fixtures/earth-ecliptic-j2000-horizons.json`): 139.673 degrees at 2027-08-13T00:00Z and 261.620 at 2026-12-14T00:00Z (the old helper read 140.06 and 262.00), the helper within 0.005 degrees of Horizons. The published peak instant is where that longitude is 140.1 degrees (IAU MDC, `streamestablisheddata2026.txt`, Perseids set AdNo 9): **2027-08-13T10:41:18Z**, now `activity.peakUtc` in `data/showers/perseids.json` (it was 2027-08-13T00:00Z; the earlier note of 01:02Z was the of-date reading).

- **(a) Peak.** The distance from Earth to the nearest measured ellipse (closest point by a golden-section search along each ellipse) was found daily across the window, and the mean distance of the 100 nearest ellipses is smallest on 2027-08-13 (0.00028 AU; 0.00041 on the 12th, 0.00035 on the 14th). A parabola through the minimum puts it at 2027-08-13T14:37Z, **0.16 days from the published peak** (limit 2 days; re-run 2026-10-16 after I-027: the daily samples are taken at the peak's time of day, so they moved with the peak, and the earlier 05:41Z was against the 01:02Z peak, 0.19 days). The number of ellipses within 0.01 AU of Earth is largest (5,004) on the same day, against 2,514 on the 12th and 2,730 on the 14th. The test checks 6 days either side, daily; a 40-day sweep run once while building showed the same single peak, falling to 389 ellipses within 0.01 AU on 3 August and 361 on 18 August.
- **(b) Radiant.** The 7,769 members whose ellipse passes within 0.02 AU of Earth at the peak were taken; for each, the heliocentric velocity at its closest point (vis-viva with the record's own a) minus Earth's velocity (a plus-or-minus 1 hour central difference of the ephemeris) is its geocentric velocity, and the radiant is the direction it comes from, rotated to equatorial J2000. Mean direction: **RA 48.39, Dec +57.78** against the MDC's RA 47.9, Dec +57.9, **0.29 degrees apart** (limit 3; 7,769 members within 0.02 AU of Earth at the corrected peak); median geocentric speed 58.76 km/s against the MDC's 58.8. No zenith-attraction correction is applied, so this is the geocentric radiant before that correction, as the orbit elements give it.
- **(c) and (d)** The comet's position and orbit, and the planets' positions and orbits, are the catalogue bodies' own (T-054 and T-048); the test asserts the comet path's source returns the catalogue body's positions.

Limits: the check uses only orbit geometry, so it is a consistency check of the data against the published values and not a measurement of the stream's density; the dots' places along their orbits (illustrative) play no part in it.

## A body defined in a settings file: 3200 Phaethon (O-011 / T-055)

### What is validated

`src/core/elementsBody.ts` builds a body from a validated record (published elements, epoch with time scale, source and solution, optional radius with source, accuracy class and statement) with the same two-body Sun-centred source the built-in comet uses. `tests/elementsBody.test.ts` holds both checks below. No body name appears in the generic code (the name check asserts it).

**Equivalence.** The built-in comet's published elements, written as a record and built through the generic path, give positions identical to the hand-written source at 1990-01-01, 1995-10-10, 2000-06-01, 2026-08-13 and 2100-01-01: relative difference 0 (bit-identical) against a bound of 1e-9. The epoch and the periapsis instant also match exactly. The TDB epoch is converted with the record's stated TT minus UTC (61.184 s there), the same figure the hand-written source uses.

### Source of the elements

JPL Small-Body Database API (`https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=3200&full-prec=1&phys-par=1`, fetched 2026-10-16T03:43:15Z), solution SB441-N16 of 2026-10-15 (8682 observations 1983 to 2026), epoch JD 2461200.5 TDB (2026-06-09), ecliptic J2000: a 1.271464620766258 AU, e 0.8896722843984632, i 22.31052728903618 deg, node 265.0988060336058 deg, omega 322.300168494526 deg, M 301.4858238591272 deg, q 0.1402777870773155 AU, period 523.67 d. Radius 3.125 km (SBDB effective diameter 6.25 km, Taylor et al. 2019; Horizons prints RAD = 3.125). The fit also carries a small transverse non-gravitational term (A2 = -6.2e-15 au/d^2) that the two-body model leaves out. TT minus UTC at the epoch is 69.184 s (32.184 s plus 37 leap seconds). The record is in `data/showers/geminids.json` (`parentElements`); the raw responses are archived in [`phaethon-horizons-source.txt`](../tests/fixtures/phaethon-horizons-source.txt) (first the SBDB response, second the Horizons response, each preceded by a `==== QUERY ... ====` line) and parsed into [`phaethon-horizons.json`](../tests/fixtures/phaethon-horizons.json).

### Horizons comparison

Fetched 2026-10-16T03:43:16Z from `https://ssd.jpl.nasa.gov/api/horizons.api` (`format=text`, `COMMAND='3200;'` (solution JPL#1017, soln. date 2026-Oct-15 11:51:19, the same fit as SBDB), `CENTER='500@10'`, `EPHEM_TYPE=VECTORS`, `VEC_TABLE=1`, `VEC_CORR=NONE`, `REF_SYSTEM=ICRF`, `REF_PLANE=FRAME`, `OUT_UNITS=KM-S`, `TIME_TYPE=UT`, eight dates in `TLIST`). ICRF is treated as EQJ and UT as UTC. The dates span 12 years, about 8 orbits, around the December 2026 peak.

| Date (UTC) | Distance from the Sun | Difference from Horizons | As a fraction of the distance |
|---|---|---|---|
| 2020-12-14 | 0.287 AU | **935,344 km** | **2.18%** |
| 2022-12-14 | 2.348 AU | 100,735 km | 0.029% |
| 2024-12-14 | 1.780 AU | 120,713 km | 0.045% |
| 2026-06-09 (the epoch) | 1.606 AU | 47 km | 0.00002% |
| 2026-12-14 (the peak) | 1.774 AU | 11,309 km | 0.004% |
| 2028-12-14 | 2.349 AU | 37,653 km | 0.011% |
| 2030-12-14 | 0.308 AU | 48,316 km | 0.105% |
| 2032-12-14 | 2.315 AU | 32,673 km | 0.009% |

Maximum error **935,344 km at 2020-12-14**, 2.18% of its 0.287 AU distance from the Sun there; the agreement at the epoch (47 km) confirms the time-scale conversion. The error is largest close to perihelion, as expected: the body moves fastest there (q = 0.14 AU), so a small timing difference is a large position difference, and Horizons integrates the planets' pull and the non-gravitational term that the fixed ellipse leaves out. **Classification: indicative** (rule in `classifyPositionError`: within 1% of the distance from the Sun at every compared date is "approximate", within 5% "indicative"; 2.18% earns the second). It is good enough to show where the asteroid is on its orbit at overview scale (935,344 km is 0.4% of the semi-major axis), not an ephemeris and not good enough for a close approach. The record states two-body, no perturbations, no non-gravitational forces, and names the small perihelion as the weak point; validity is stated as 2020-12-14 to 2032-12-14 only. The test asserts the recorded figure, the percentage and that the classification follows from them. A date list is not a bound for other dates.
