# Astraeus Spike 04 — Stream and Sky Data Decision Record (T-051)

All sources accessed 2026-10-13 (UTC) unless stated. Scratch downloads and scripts lived outside the repository (`/tmp/claude-1000/-home-user-code-Astraeus/9f41da67-d196-4cdd-b989-572f65eae286/scratchpad/t051/`). Nothing was built.

## Summary

| Question | Answer |
|---|---|
| May a filtered CAMS Perseid/Geminid subset be committed and shipped publicly? | **Unclear. The published terms are silent.** No licence, terms of use or redistribution statement was found on any CAMS page, in the v3.0 readme, in the workbook, or at the IAU MDC. The only stated condition is a request to cite. Result: **REPLAN REQUIRED**, owner decision (no fallback chosen). |
| Whom to ask | Dr. Peter Jenniskens, SETI Institute (CAMS Principal Investigator and curator), petrus.m.jenniskens@nasa.gov, the contact printed on cams.seti.org. |
| Star catalogue | Yale BSC (CDS V/50), fetched locally and never committed (owner decision). 9,110 records, 8,404 with V <= 6.5. |
| Milky Way image | ESO/S. Brunier "The Milky Way panorama" (eso0932a), CC BY 4.0. Equirectangular galactic frame, verified from the image. |

**Owner decision, 2026-10-13 (Objective.md, Replan T-051 data terms):** ask the CAMS PI and keep the data local meanwhile; Yale BSC the same way; ESO Milky Way may be committed with credit. Section 5 states the approach and holds the permission email draft. Sections 2 to 4 below were extended after that decision (published peak and radiant, pole constants, Yale BSC columns and count).

## 1. CAMS Meteoroid Orbit Database

### Release

- CAMS Meteoroid Orbit Database v3.0, "CAMS combined (322 Mb)", file `CAMS-v3-2010to2016.xlsx`, https://cams.seti.org/CAMS-v3-2010to2016.xlsx. HTTP `Last-Modified: Wed, 08 Jan 2020 23:33:44 GMT`, 321,511,540 bytes, SHA-256 `ec8864967785b18edcd78d503e82da77dfe837537e13dddde0fcd4b9c5a85845`, downloaded 2026-10-13T09:02Z. Readme: https://cams.seti.org/Readme_CAMSv3.0.pdf (104,429 bytes, dated 2020-01-06 per search listing).
- Sheet title: "CAMS Meteoroid Orbit Database v3.0 (2010-2017)", sheet name "CAMS v1.6 (2010-2016)", 471,582 rows (matches the figure papers quote for v3.0).
- Not posted on NASA Open Data, Zenodo or the IAU MDC as a full database. A Zenodo record (https://zenodo.org/records/18664293, CC BY 4.0) holds a shower-removed CAMS v3.0 extract made by another author. It states no CAMS permission and defers to the CAMS readme for citations. The IAU MDC site (https://www.iaumeteordatacenter.org/) states no data licence; it says "a set of meteors is regarded as published if it is accessible on a website and a description of the observational facility and the method of orbit determination has been published." Papers say CAMS data are also submitted to the MDC; no MDC download of CAMS orbits was found.
- Other CAMS pages (cams.seti.org home, `/MDC.html`, `/FDL/` portal) carry no terms, licence or copyright text. The portal footer says "Hosted by: The SETI Institute. Curator: Peter Jenniskens. Responsible NASA Official: Lindley Johnson". Note: cams.seti.org returns HTTP 410 to a bare curl and 200 with a browser User-Agent.

### Terms text (the whole of it)

Workbook row 2 and the v3.0 readme both read: "When using this data, please refer to: P. Jenniskens, J. Baggaley, I. Crumpton, P. Aldous, P. Pokorny, D. Janches, P. S. Gural, D. Samuels, J. Albers, A. Howell, C. Johannink, M. Breukers, M. Odeh, N. Moskovitz, J. Collison, S. Ganju, 2018. A survey of southern hemisphere meteor showers. Planetary and Space Science 154, 21-29."

The lookup table (https://cams.seti.org/FDL/data/CAMS-ShowerLookUpTable-v2018-01.txt) says: "If database is used, please reference: ..." the same paper.

That is a citation request. It grants no licence and states neither permission nor prohibition on redistribution. CAMS is a SETI Institute project funded by NASA (the site says SETI received a NASA grant on 2026-02-24); that does not establish public-domain status, so none is assumed.

### How the owner's visual reference sources its data

https://www.meteorshowers.org/view/Perseids says the orbits "are based on those measured by NASA's CAMS video camera surveillance network", credits "Meteor data from Peter Jenniskens, visualization developed by Ian Webster", links http://cams.seti.org, and asks visitors to "attribute this site". It states no licence or data download. The engine is SpaceKit.js (https://typpo.github.io/spacekit/). The site's actual data file was not located.

### Verdict

**Unclear (terms silent).** Returned as REPLAN REQUIRED. Options for the owner to take to the curator: written permission to ship a filtered subset with citation, or a different measured-orbit source. This record does not pick one.

### Content (if permission is given)

Computed from the downloaded workbook with a stdlib streaming parser (scratch `scripts/xl.py`, `scripts/scan.py`; `python3 -I`; 80 s). Dates use the Excel **1904** date system (`workbookPr date1904="1"`), so the `Date` serial plus 1462 days is the 1900 serial; `Date` + `Time` (day fraction) give UTC. Reading it as 1900 puts the data in 2006 to 2012, which is wrong.

| Item | IAU 7 Perseids | IAU 4 Geminids |
|---|---|---|
| Members (`Shower I.D.`, column AK) | 24,928 | 14,905 |
| Hyperbolic or parabolic (`e` >= 1; `a` is the sentinel 999) | 6,229 (25.0%) | 32 |
| `e` < 1 | 18,699 | 14,873 |
| `e` < 1 and Pairs Flag = 0 | 18,600 | 14,709 |
| `e` < 1, Pairs Flag = 0, `e` sigma <= 0.05 | 11,345 | 14,526 |
| Median `e`, `i`, `w`, Node | 0.938, 113.1, 150.4, 139.7 | 0.888, 22.9, 324.3, 261.6 |
| Median sigma `e`, `i`, `w`, Vg | 0.044, 0.86, 1.32, 0.39 | 0.0055, 1.37, 1.06, 0.37 |
| Vg flag = 1 (entry speed below Earth escape speed) | 0 | 0 |
| Peak bin of Sol. Long. (0.5 deg bins) | 140.0 | 262.0 |
| Median geocentric radiant RA, Dec, Vg within 1 deg of peak | 47.77, +57.87, 59.07 km/s | 113.38, +32.29, 33.83 km/s |

Columns used: `Date`, `Time` (UTC epoch of the orbit), `Solar Longitude` (BF), `R.A./Decl./V Geocentric` and their sigmas, `a` (BL), `e` (BM, sigma BN), `i` (BO), `w` (BQ), `Node` (BS), `Pairs Flag`, `Flag Vg=0`, `Network`. Elements are ecliptic J2000 (readme: "º, J2000"), `a` in AU.

Treatment proposed (not applied): drop `e` >= 1 and Pairs Flag = 1 rows; a stricter `e` sigma cut costs half the Perseids. Perseid orbits scatter widely: members have `a` of 12 to 49 AU in the worked examples (period 43 to 341 years) against 109P's 26.1 AU, because speed error dominates `a`. A display should treat measured `e`, `i`, `w`, Node and the 1 AU node crossing as reliable, and `a` as weak.

Planned on-disk subset (columns epoch, solar longitude, a, e, i, w, node; `e` < 1): Perseids 18,699 rows, 1,778 KB raw, 457 KB gzip; Geminids 14,873 rows, 1,451 KB raw, 318 KB gzip (computed from the real rows; format CSV or packed typed array, to be chosen in the build Task).

### Propagation method and worked example

Each member is placed at a common display time by two-body motion about the Sun with the existing `TwoBodyAdapter`:

1. Epoch t0 = Date + Time (1904 system). The meteoroid is at Earth's heliocentric position then.
2. Earth's distance r_E and ecliptic longitude come from `createOrbAstronomyAdapter().earthPositionFromSunKm(t0)` rotated to ecliptic with `eclipticJ2000ToEqjMatrix()` (transposed).
3. True anomaly: cos(nu) = (p / r_E - 1) / e, p = a(1 - e^2); the sign of nu is the candidate whose ecliptic longitude and latitude best match Earth's (descending node, nu about +26 to +33 deg).
4. `elementsToState({a, e, i, Node, w, nu}, "sun")` gives an ecliptic-J2000 state; `propagateMemberInto(state, 0, (display - t0) s, "sun", out)` advances it; the `eclipticJ2000ToEqjMatrix()` rotation gives EQJ.

Run (scratch, 2026-10-13T09:06Z): `node /home/user/code/Astraeus/node_modules/vitest/vitest.mjs run --root <scratch>/prop --config <scratch>/prop/vitest.config.mjs --disable-console-intercept` with `<scratch>/prop/prop.test.ts` (imports the repo's `twoBodyAdapter.ts` and `astronomyAdapter.ts`; input is the extracted Perseid rows). Display time 2027-08-13T00:00Z. Output (AU):

| Catalog # | Epoch UTC | Sol. long | a, e, i, w, Node | Earth r_E | nu | Placed lon/lat vs Earth lon | r at display | Display EQJ (x, y, z) |
|---|---|---|---|---|---|---|---|---|
| 16320 | 2011-08-11T03:56:17Z | 138.016 | 46.1, 0.97914, 111.3, 153.71, 138.006 | 1.01358 | +26.31 | 317.999 / -0.017 vs 318.009 | 31.96 (dt 16.0 y) | -22.768, 17.126, -14.480 |
| 128652 | 2013-08-11T04:19:48Z | 138.500 | 12.32, 0.923, 114.15, 149.96, 138.486 | 1.01350 | +29.93 | 318.533 / +0.104 vs 318.488 | 21.79 (dt 14.0 y) | -16.588, 11.659, -7.974 |
| 332652 | 2016-08-10T10:37:17Z | 138.014 | 48.82, 0.9809, 113.46, 146.72, 138.001 | 1.01358 | +33.03 | 318.100 / +0.228 vs 318.000 | 25.37 (dt 11.0 y) | -16.873, 11.396, -15.138 |

Checks: with dt = 0 the radius reproduces r_E to 5 digits; placed longitudes match Earth's to under 0.1 deg and latitude is within 0.23 deg (orbit-element rounding). The adapter handles ~11 to 16 year offsets with no change.

Design consequence (for the build Tasks, drift note below): a single common timestamp scatters members along their orbits, 22 to 32 AU from the Sun here, because each member's observed year differs and `a` is uncertain. A snapshot of the stream at the encounter date does not put particles at Earth. The stream should be drawn from orbit geometry (ellipse lines, the measured node crossing at 1 AU) with member dots placed per the owner's chosen rule; that rule is a planning decision, not made here.

## 2. Factual reference values

- **109P/Swift-Tuttle elements** (JPL SBDB API, https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=109P&full-prec=1, accessed 2026-10-13, solution SB405-CPV-2, 2001-10-09, epoch JD 2450000.5): e 0.963225755046038, a 26.0920694978266 AU, q 0.959516155068868 AU, i 113.453816997171 deg, Node 139.3811920815948 deg, w 152.9821676305871 deg, tp JD 2448968.499784556297 TDB, period 48681.19346262312 d. Identical to `data/showers/perseids.json`.
- **Horizons check** (https://ssd.jpl.nasa.gov/api/horizons.api, `COMMAND='DES=109P;CAP'`, vectors, centre `500@10`, ecliptic plane, ICRF, AU, accessed 2026-10-13T09:06Z) against `TwoBodyAdapter` propagation of the SBDB elements from the epoch (scratch `prop/swift.test.ts`; same vitest command; true anomaly at epoch 147.115 deg from tp via Kepler's equation; UTC taken as TDB):

| Date (00:00) | Horizons x, y, z (AU) | Adapter x, y, z (AU) | Difference | r |
|---|---|---|---|---|
| 1992-12-12 | 0.7602, -0.4192, 0.4057 | 0.7618, -0.4248, 0.3999 | 0.0082 AU (0.86%) | 0.958 AU |
| 2010-01-01 | -22.9205, 9.3031, -18.0603 | -22.8904, 9.3075, -18.0643 | 0.0307 AU (0.10%) | 30.6 AU |
| 2027-08-13 | -33.7268, 16.2199, -22.1185 | -33.6606, 16.2258, -22.1216 | 0.0665 AU (0.15%) | 43.5 AU |

  The residual is the cost of two-body motion from a 1995 epoch against a perturbed fit (planets, non-gravitational terms); it is a limitation to state, not an error.
- **Peak solar longitude and radiant (published, not CAMS self-computation).** Source: IAU Meteor Data Center, "Established meteor showers" data file, https://www.ta3.sk/IAUC22DB/MDC2022/Etc/streamestablisheddata2026.txt (header: "Last update: Oct 09, 20:00:00 UTC, 2026"; "All records on J2000"; Vg is geocentric velocity), fetched 2026-10-13T09:14Z. Columns LoSb/LoSe (solar longitude at start and end of activity), LoS (solar longitude of peak), Ra, De (geocentric radiant), Vg. The newest parameter set of each shower, citing Jenniskens (2023), Atlas of Earth's Meteor Showers (Elsevier, ISBN 978-0-323-88447-1):

| Shower | MDC set | Activity LoSb to LoSe | Peak LoS | Radiant RA, Dec (J2000) | Vg | Parent (MDC) |
|---|---|---|---|---|---|---|
| Perseids (PER, 7) | AdNo 9, 2023-10-01 | 115.0 to 175.0 deg | 140.1 deg | 47.9, +57.9 deg | 58.8 km/s | 109P/Swift-Tuttle |
| Geminids (GEM, 4) | AdNo 8, 2023-10-01 | 225.0 to 273.0 deg | 261.6 deg | 113.0, +32.4 deg | 33.8 km/s | 3200 Phaethon |

  The same file's earlier sets agree within a degree or so (Perseids 2015-08-23 set, Jenniskens et al. 2016 era: peak 140, RA 48.2, Dec +58.1, Vg 59.1; Geminids: 262, 113.5, +32.3, 33.8), and the CAMS-derived medians above (Perseid peak bin 140.0, RA 47.8, Dec +57.9; Geminid 262.0, 113.4, +32.3) match them. Caution: the MDC mean orbit for the Perseids lists a = 12.7 AU, e = 0.925, against 109P's 26.1 AU, the same weak-`a` effect as in the CAMS members. The IMO calendar (imo.net, mid-restoration, PDF URL returned HTML) and a 109P-specific MDC page could not be read; they were tried and are not needed.
- The repository's activity window, peak night and ZHR stay as in `data/showers/perseids.json` (American Meteor Society calendar).

## 3. Star catalogue

**Decision (owner, 2026-10-13): Yale Bright Star Catalogue, fetched locally, never committed** (Section 5). The terms are not established as public domain (ReadMe states none; the only redistribution statement is second-hand via a Debian packaging file, which says the ADC allowed redistribution with acknowledgement and that the data must not be altered), so nothing from it is committed or shipped. Hipparcos (CC BY-NC 3.0 IGO, "Credit: ESA") and HYG (CC BY-SA 4.0 over Hipparcos/BSC/Gliese) were set aside.

Fetched catalogue (https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz, 573,921 bytes gzip, fetched 2026-10-13T09:13Z; ReadMe https://cdsarc.cds.unistra.fr/ftp/V/50/ReadMe, titled "The Bright Star Catalogue, 5th Revised Ed. (Preliminary Version)", Hoffleit and Warren, ADC/NSSDC 1991). Read with `python3 -I` from a new scratch directory:
- 9,110 fixed-width records of 196 characters; 9,096 have J2000 position and V (14 are novae or extragalactic entries kept for numbering).
- Columns used (ReadMe byte ranges): HR 1-4; Name 5-14; RAh/RAm/RAs J2000 76-77, 78-79, 80-83; DE- 84, DEd 85-86, DEm 87-88, DEs 89-90; GLON 91-96; GLAT 97-102; Vmag 103-107; B-V 110-114 (0.01 mag); SpType 128-147; pmRA 149-154, pmDE 155-160 (arcsec/yr, J2000). Positions are epoch 2000.0, so proper motion is available if wanted.
- **V <= 6.5: 8,404 stars** (8,160 of them with a B-V value). The catalogue reaches V 7.96, so the cut matters.
- Planned local subset (RA, Dec, V, B-V per star): about 8,400 rows, well under 150 KB packed (estimate, not written).

## 4. Milky Way image

- **Source:** "The Milky Way panorama", ESO/S. Brunier, https://www.eso.org/public/images/eso0932a/. Licence: https://www.eso.org/public/outreach/copyright/, "licensed under a Creative Commons Attribution 4.0 International License" (credit must stay with the image; changes must be indicated, including any AI modification; not for implying ESO endorsement). Credit line: "ESO/S. Brunier".
- **Files:** large JPEG 6000 x 3000, 7.8 MB (https://cdn.eso.org/images/large/eso0932a.jpg); publication JPEG 4.6 MB; screen JPEG 1280 x 640 152 KB. Planned use: a downscaled copy, 4096 x 2048 or smaller.
- **Projection and frame:** equirectangular, 2:1. Checked on the downloaded screen JPEG: the Galactic Centre is at the image centre, the plane runs horizontally through the middle, and the Large Magellanic Cloud sits right of centre and below the plane at pixel (935, 433) of 1280 x 640 (expected for l = 280 deg, b = -33 deg if longitude increases to the left: x = 640 + 80 / 360 x 1280 = 924, y = 320 + 33 x 640 / 180 = 437). The image is therefore galactic, centred on l = 0, b = 0, longitude increasing leftwards.
- **Alignment with EQJ:** rotate galactic to equatorial J2000 with the IAU 1958 pole. Constants from a fetched source: Astropy `astropy/coordinates/builtin_frames/galactic.py` (https://raw.githubusercontent.com/astropy/astropy/main/astropy/coordinates/builtin_frames/galactic.py, fetched 2026-10-13T09:14Z; cites Blaauw et al. 1960): north galactic pole RA 192.8594812065348 deg, Dec +27.12825118085622 deg (FK5/J2000), longitude of the north celestial pole 122.9319185680026 deg. These are the IAU 1958 B1950 definition (192.25, +27.4, 123 deg) carried to J2000. Checks computed here: (1) they give the Galactic Centre (l = 0, b = 0) at RA 266.405, Dec -28.936 deg (J2000); (2) applied to all 9,096 Yale BSC stars they reproduce the catalogue's own GLON/GLAT to within 0.088 deg (the catalogue rounds to 0.01 deg and was converted from B1950).
- **Not verified:** that eso0932a's alignment matches the IAU galactic frame to better than a degree; only the centre and Magellanic-cloud positions were checked.

## 5. Local-data approach (owner decision 2026-10-13)

- Until written permission from the CAMS PI is recorded, CAMS orbit data and Yale BSC data are **never committed and never in a public build**. No invented fallback: without the local file an experience says the data is not fetched and how to fetch it, and draws no stream (stars: Milky Way only, and says the stars are not fetched).
- Committed, generic fetch tools download from the source and write filtered files under the git-ignored `data/local/`. CAMS members are selected by the IAU shower code in each shower's settings file. Exact upstream URLs:
  - CAMS: `https://cams.seti.org/CAMS-v3-2010to2016.xlsx` (321,511,540 bytes, SHA-256 ec8864967785b18edcd78d503e82da77dfe837537e13dddde0fcd4b9c5a85845 for the 2020-01-08 file; the tool should check size or hash and say if it changed). Send a browser-like `User-Agent`: bare curl got HTTP 410 from the site root (the xlsx was fetched with a browser-like agent). Readme for the citation: `https://cams.seti.org/Readme_CAMSv3.0.pdf`.
  - Yale BSC: `https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz` (573,921 bytes) and `https://cdsarc.cds.unistra.fr/ftp/V/50/ReadMe`.
  - Committed with credit (CC BY 4.0, "ESO/S. Brunier"): `https://cdn.eso.org/images/large/eso0932a.jpg`, downscaled.
- The xlsx is a 1.5 GB sheet XML; reading it needs a streaming parser (the scratch parser took 80 s). The 1904 date system must be honoured.
- A build check should prove nothing under `data/local/` reaches the public build (Objective planner consequence).

### Draft permission email (for the owner to send)

To: petrus.m.jenniskens@nasa.gov
Subject: Request: permission to redistribute a filtered subset of the CAMS Meteoroid Orbit Database v3.0

Dear Dr. Jenniskens,

I am building Astraeus, an open-source browser project that shows astronomy scenes from documented data. One demonstration is a Sun-centred view of the Perseids and Geminids, similar in spirit to meteorshowers.org, drawn from measured meteoroid orbits.

I would like to use the CAMS Meteoroid Orbit Database v3.0 (CAMS-v3-2010to2016.xlsx from cams.seti.org). I found a request to cite Jenniskens et al. (2018, Planetary and Space Science 154, 21-29), which I would do, but no statement of terms for reuse. For now my software only downloads the file to the user's own machine and does not include any CAMS data.

Would you be willing to allow a small filtered subset, only the Perseid (IAU 7) and Geminid (IAU 4) rows and only the columns needed to draw the orbits (epoch, solar longitude, a, e, i, omega, Omega), to be committed to the public repository and shipped in the open-source project, with the requested citation and a link to cams.seti.org on the page that uses it? If you would prefer other conditions, I would be glad to follow them. If this is not possible, I will keep the data local, and a short reply saying so would help just as much.

Thank you for the CAMS project and for making the data available.

Kind regards,
Ani Patke
(Astraeus project)

## Drift notes (architecture)

- A common-timestamp snapshot of a measured stream (Section 1) is not the encounter; Design's group and presentation notes should say orbit geometry carries the encounter, member dots are a sampled display. T-040 reconciles.
- `TwoBodyAdapter.elementsToState` takes true anomaly; CAMS gives no anomaly, so the build needs a "place at Earth's distance on the stated node" helper (generic, not Perseid-specific).
- The `.xlsx` date system is 1904; any ingest tool must read `date1904`.

## Unverified

- CAMS terms beyond the citation request (no contact made).
- The IMO calendar values (site down); the MDC values are cited instead.
- The Yale BSC licence (kept local for that reason); the precise ESO image alignment to the IAU frame.
- Whether the meteorshowers.org page uses the v3.0 file or a newer private CAMS set.
