# Moon and Pluto orbits against JPL Horizons (O-019 / T-078)

Measured 2026-10-17. Data: `data/orbits/<body>.json` (one file per body). Offline test: `tests/moonOrbits.test.ts`. Raw responses: `docs/evidence/o019-t078-*` (listed under Sources). Nothing here is drawn yet.

## The table

Largest distance from Horizons over 31 dates (the six dates 1969-07-21, 1985-06-01, 2000-01-01 12:00 UTC, 2010-07-01, 2024-01-01, 2030-06-01 plus 25 equal samples over one orbit from 2000-01-01 12:00 UT); Pluto over 66 dates (every 1 January 1970 to 2030 plus the other five of the six). Positions are planet-centred (Pluto: Sun-centred), geometric, ICRF treated as EQJ.

| Body | Source (epoch, plane) | Largest error | Diameters | Fraction of semi-major axis | Class |
|---|---|---|---|---|---|
| Io | JPL SSD mean elements, JUP365, 2000-01-01.5 TDB, Laplace plane | 4,196 km (1969-07-21) | 1.15 | 0.995% | approximate demonstration |
| Europa | same, JUP365 | 13,351 km (2030-06-01) | 4.28 | 1.99% | approximate demonstration |
| Ganymede | same, JUP365 | 6,101 km (2030-06-01) | 1.16 | 0.57% | approximate demonstration |
| Callisto | same, JUP365 | 10,861 km (2024-01-01) | 2.25 | 0.58% | approximate demonstration |
| Mimas | JPL SSD, SAT441, 2000-01-01.5, Laplace plane | 184,683 km | 466 | 99% | not usable as published |
| Enceladus | same, SAT441 | 27,765 km | 55 | 11.6% | not usable as published |
| Tethys | same | 302,549 km | 285 | 103% | not usable as published |
| Dione | same | 732,463 km | 652 | 194% | not usable as published |
| Rhea | same | 1,034,059 km | 677 | 196% | not usable as published |
| Titan | same (own Laplace pole) | 2,436,395 km | 473 | 199% | not usable as published |
| Iapetus | same (own Laplace pole, tilt 14.8 deg) | 6,815,197 km | 4,641 | 191% | not usable as published |
| Triton | JPL SSD, NEP097, 2000-01-01.5, Laplace plane | 33,573 km (2030-06-01) | 12.4 | 9.46% | approximate demonstration |
| Charon | JPL SSD, PLU060, 2000-01-01.5, Pluto equatorial plane | 36 km (2030-06-01) | 0.03 | 0.18% | **within one diameter** |
| Pluto (about the Sun) | JPL SBDB osculating elements, epoch 2016-07-31 TDB, ecliptic J2000 | 15,475,866 km (1971-01-01) | 6,512 | 0.26% | approximate demonstration |

Class rule (applied by the test, not chosen per body): within one diameter if the largest error is at most the body's mean diameter; approximate demonstration if at most one tenth of the semi-major axis; otherwise "not usable as published". The Task asked for the first two classes; the third is a finding (below). Triton sits right at the edge of the second (9.46%).

Errors at each of the six dates, km (1969, 1985, 2000, 2010, 2024, 2030):

| Body | six dates | worst within one orbit from the epoch |
|---|---|---|
| Io | 4,195; 1,970; 825; 1,408; 575; 3,178 | 879 |
| Europa | 5,881; 7,823; 303; 9,473; 2,606; 13,351 | 885 |
| Ganymede | 1,897; 799; 1,619; 3,090; 4,921; 6,101 | 3,791 |
| Callisto | 8,638; 8,504; 4,781; 1,044; 10,861; 5,985 | 4,820 |
| Triton | 33,268; 31,771; 25,062; 24,415; 19,960; 33,573 | 25,317 |
| Charon | 27; 29; 28; 14; 35; 36 | 31 |
| Pluto | 15,396,023; 12,222,096; 5,613,280; 2,566,895; 4,111,803; 6,526,601 | (66 yearly dates) |

The Saturn rows are in `data/orbits/<body>.json` under `accuracy`.

## Method

1. **Source.** The elements of each moon are the row of the JPL Solar System Dynamics "Planetary Satellite Mean Elements" table (https://ssd.jpl.nasa.gov/sats/elem/, read 2026-10-17): a, e, argument of periapsis, mean anomaly, inclination and node at 2000-01-01.5 TDB, in the Laplace plane the row names, with the plane's pole (RA, Dec). Charon's row is in the planet's equatorial frame and carries no pole; Pluto's IAU pole is used. Triton's pole is Neptune's Laplace pole. The page's own warning applies: the elements "are not intended for ephemeris computation". Mean radius and GM of each moon are from the JPL SSD satellite physical parameters page; the parent's GM is the Horizons physical-data value (Saturn 37,931,206.234; Neptune 6,835,099.97; Pluto 869.326; Jupiter 126,686,531.9 as already used for Io). Pluto's heliocentric elements are the JPL Small-Body Database orbit (solution by R. S. Park, DE441, epoch JD 2457588.5).
2. **Propagation: the existing path, no new propagator.** `src/core/satelliteMeanElements.ts` does for every body what `src/core/bodies/io.ts` does for Io: the epoch is converted from TDB to UTC (TT minus UTC), the plane is turned into EQJ (here for a general inclination and node, which Io's `inclination 90 - Dec, node RA + 90` is the zero case of), the mean anomaly is solved to a true anomaly, and `createTwoBodyTrajectory` propagates unperturbed two-body motion. The only addition to existing code is that `createOrbTwoBodyAdapter` takes `Pick<CelestialBodyDefinition, "id" | "gmKm3S2">`. The relative-motion GM is parent plus moon (Charon's mass is 12% of Pluto's, so the sum matters there; elsewhere it is below 0.03%).
3. **Period rule (a finding of the measurement, kept with the data as `model`).** A fixed ellipse cannot precess, so its semi-major axis is set so the two-body period equals the sidereal period, as for Io. The table's P is the sidereal period for the Saturn rows (Mimas 0.942422 d) but not for the Jovian rows (Europa 3.525463 d against the real 3.551181 d); Io's rule, `1 / (1/P - 1/P_apsis)`, which fixed Io, fails for Europa, Ganymede and Callisto (1.3, 2.1 and 1.9 million km) and for Tethys (whose tabulated P_apsis, 0.005 yr, is shorter than P). All of these moons turn synchronously, so the sidereal mean motion is the IAU prime-meridian rate (published, used by the rotation work anyway): period = 360 / rate. With it the Jovian moons come out as the table above. Pluto uses the SBDB semi-major axis and the Sun's GM.
4. **Comparison.** Horizons vectors (`COMMAND` the moon, `CENTER='500@<planet>'`, `VEC_TABLE=1`, `VEC_CORR=NONE`, `OUT_UNITS=KM-S`, `REF_SYSTEM=ICRF`, `REF_PLANE=FRAME`, `TIME_TYPE=UT`, TLIST) are parsed into `tests/fixtures/moon-orbits-horizons.json`; the test also parses the raw responses and asserts the fixture equals them. The six dates are those used for the planets and Io. "Fraction of its orbit" is the error divided by the table's semi-major axis.

## Findings for the owner

1. **The published Saturn rows do not reproduce SAT441 at the epoch.** Period and plane are right (the error does not grow: Dione is 729,709 to 732,318 km at all six dates), but the phase at 2000-01-01.5 is off, by an angle that differs from body to body: fitting a shift of the mean anomaly to the Horizons position at the epoch gives 49 (Mimas), 5.5 (Enceladus), -61 (Tethys), -151 (Dione), -157 (Rhea), -154 (Titan), +145 (Iapetus) degrees. It is not a constant frame rotation (Enceladus and Dione are both i = 0.0 in the same plane), not a time shift, and not a swap of columns (tried integer combinations of omega, M, node). Mimas does have a 43 degree libration in its resonance with Tethys, which could account for part of Mimas only, not for the others. The cause was not found, so I did not guess one. With that fitted shift (a measurement aid, stored as `accuracy.diagnosticPhase`, not a source: it is fitted to the same Horizons position) the remainder is 5,060 km (Enceladus), 4,817 (Dione), 5,209 (Rhea), 17,556 (Tethys), 125,315 (Titan), 105,925 (Iapetus) and 223,645 (Mimas): Enceladus, Tethys, Dione and Rhea would then be "approximate demonstration", while Titan (e = 0.029; 125 thousand km against a tenth of its orbit, 122 thousand), Iapetus and Mimas still would not, which points at eccentricity, periapsis and plane terms too. Two-body from these rows is therefore not good enough as published; a better source is needed for Saturn's moons: either a corrected reading of the table (ask JPL SSD, or find the convention) or phase taken from a Horizons vector at an epoch, which then needs its own owner decision and test.
2. **Triton** (retrograde, inclination 157.3 deg to the Laplace plane, node precessing once in 340 years): 33.6 thousand km is 9.5% of the orbit. A 4 degree phase offset at the epoch (25 thousand km) explains most of the error there; the table's P (5.876994 d) against the IAU rate period (5.876854 d) accounts for the drift. The cause of the phase offset was not found. Class: approximate demonstration at the edge.
3. **Iapetus** (79 d period, 3.56 million km out, inclined 7.6 deg to a Laplace plane tilted 14.8 deg from Saturn's equator): the largest case; a phase shift alone leaves 106 thousand km. One fixed ellipse in the Laplace plane cannot follow it.
4. **The Jovian moons are all about one to four diameters off** (Io 1.15, Ganymede 1.16, Callisto 2.25, Europa 4.28): approximate demonstration, as Io's record already says. Io's shipped rule gives 9,388 km on the same six dates, the IAU-rate rule 4,196 km; Io's definition could take the better rule.
5. **Pluto about the Sun** is 0.26% of its distance at worst (15.5 million km): unperturbed osculating elements, no Neptune. Good for an overview, not for a close pass.
6. Horizons' Triton ephemeris is `nep098_merged`, the table's is NEP097; Horizons' Charon is relative to Pluto's body centre (`plu060_merged`), not the system barycentre.

## Rotation models (data only)

The IAU WGCCRE 2015 report (Archinal et al. 2018, Celest. Mech. Dyn. Astron. 130:22) as transcribed in NAIF `pck00011.tpc` (read 2026-10-17, raw file saved), recorded in each body's `rotation` block: pole RA and Dec (constant, per century), prime meridian W (constant, per day), and the periodic terms with the parent's nutation-precession angles where the report has them. A test asserts every polynomial equals the saved kernel text. The synchronous rotators' W rates (deg/day) equal their sidereal mean motions, which is why step 3 above can use them.

| Body | pole RA, Dec at J2000 (deg) | W0, rate (deg, deg/day) | Periodic terms |
|---|---|---|---|
| Io | 268.05, 64.50 | 200.39, 203.4889538 | yes (Jupiter system angles J3, J4) |
| Europa | 268.08, 64.51 | 36.022, 101.3747235 | yes |
| Ganymede | 268.20, 64.57 | 44.064, 50.3176081 | yes |
| Callisto | 268.72, 64.83 | 259.51, 21.5710715 | yes |
| Mimas | 40.66, 83.52 | 333.46, 381.9945550 | yes |
| Enceladus | 40.66, 83.52 | 6.32, 262.7318996 | no |
| Tethys | 40.66, 83.52 | 8.95, 190.6979085 | yes |
| Dione | 40.66, 83.52 | 357.6, 131.5349316 | no |
| Rhea | 40.38, 83.55 | 235.16, 79.6900478 | yes |
| Titan | 39.4827, 83.4279 | 186.5855, 22.5769768 | all zero (removed in the 2015 report) |
| Iapetus | 318.16 (-3.949 per century), 75.03 (-1.143) | 355.2, 4.5379572 | no |
| Triton | 299.36, 41.17 | 296.53, -61.2572637 | yes (Neptune system angle N7 and multiples) |
| Charon | 132.993, -6.163 | 122.695, 56.3625225 | no |
| Pluto | 132.993, -6.163 | 302.695, 56.3625225 | no |

Notes: the kernel's variable names are kept in each record. Pole values are linear in Julian centuries from J2000; W is linear in days. Iapetus's pole moves 3.9 and 1.1 degrees per century.

## Sources

- JPL SSD Planetary Satellite Mean Elements: https://ssd.jpl.nasa.gov/sats/elem/ (saved: `docs/evidence/o019-t078-sats-elem-20261017T034943Z/sats-elem.html`). References for the rows: Jacobson 2021 (JUP365, personal communication to Horizons/NAIF), Jacobson 2022 (AJ 164:199, SAT441), Brozovic 2020 (NEP097), Brozovic and Jacobson 2024 (AJ 167:256, PLU060).
- JPL SSD Planetary Satellite Physical Parameters: https://ssd.jpl.nasa.gov/sats/phys_par/ (saved: `docs/evidence/o019-t078-sats-phys-20261017T035359Z/`).
- JPL Horizons API (vectors and physical data): `docs/evidence/o019-t078-horizons-20261017T035154Z/` (each file begins with its `==== QUERY ... ====` line; text unaltered below it).
- JPL Small-Body Database, 134340 Pluto: `docs/evidence/o019-t078-sbdb-20261017T035428Z/pluto-sbdb.json`.
- NAIF `pck00011.tpc`: `docs/evidence/o019-t078-iau-rotation-20261017T035441Z/pck00011.tpc`.
- Licence: all are NASA/JPL numbers published without a licence statement; they are facts cited with their source, as the other JPL-sourced data here is; no JPL page text or images are redistributed beyond the saved raw responses used as evidence.
