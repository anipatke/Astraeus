---
id: T-096
title: Store Jupiter's moon positions as NASA-checked curve fits in the core data
objective: O-025
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Store Jupiter's moon positions as NASA-checked curve fits in the core data

## Outcome

Every moon JPL Horizons lists for Jupiter has its position over a wide span (target 1950-2050) stored as piecewise Chebyshev curve fits in Astraeus's core data, chunked by moon and time span, with a core trajectory provider that answers `stateAt(time)` from them, and a measured report of size, accuracy against Horizons and speed.

## User Check

Read the report in the Task evidence: how many moons, how big the files are against raw tables, the worst position error per moon against Horizons, and how fast a phone-class device evaluates all moons.

## Done When

1. O-025 Decisions 3, 8 and 9 (owner, 2026-10-18): exact positions from JPL Horizons, core package data (not demo data), curve-fit format with no database.
2. A reproducible importer (under `tools/import/`) fetches Jupiter-centred state vectors from the JPL Horizons API for every moon it lists for Jupiter (count and fetch date recorded), politely (rate-limited, cached on disk, resumable), and fits Chebyshev segments with segment length and degree chosen per moon from its orbital period; the source, Horizons version and licence (US Government work) are recorded (PROV-02).
3. Core data files under `data/` (core, not a story), chunked by moon and span (for example per decade), compact binary or compact JSON, plus a small index (moon id, name, span, chunk paths, fit parameters, provenance).
4. A core provider (`src/core/`) evaluates the fits for any time in span, returning position in the existing frames and units, with named errors outside the span; deterministic (Idea success criterion 1).
5. Accuracy: for every moon, positions from the fits are compared with Horizons at independent sample dates (not the fit nodes) across the span; worst and typical error recorded per moon; target metre-level for the inner and Galilean moons and well under one pixel at any demo view for the outer ones; moons discovered after a date carry Horizons' own uncertainty note in the provenance.
6. Size: total and per-decade sizes recorded against raw position tables at the step each moon would need; only the chunks a demo's window needs are fetched at run time.
7. Speed: evaluating every moon for one frame measured in Node and in headless Chromium with CPU throttling (phone class); well under one millisecond is the target.
8. Unit tests for the provider (span edges, segment joins continuous, errors) and the importer's fitting (round trip on synthetic data). Configured gates pass.

## Context Files

`src/core/trajectory.ts`, `src/core/sampledTrajectory.ts`, `src/core/satelliteMeanElements.ts`, `src/core/moonTrajectory.ts`, `src/core/provenance.ts`, `data/orbits/io.json`, `.savepoint/checks/C-059-t-078-task-check.md`, `docs/ASTRONOMY_VALIDATION.md`, `tools/validate/load-budget.mjs`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/Objective.md`.

## Design References

Design.md providers and scientific state; Idea success criteria 1 and 4; O-019 T-078 findings (C-059).

## Guardrails

ARCH-01, PROV-01, PROV-02, TEST-01, STYLE-06, STYLE-09.

## Implementation Plan

1. Horizons importer with cache; Chebyshev fitting; index.
2. Core provider; accuracy, size and speed report.

## Boundaries

Data and provider only; drawing the moons is a later Task. Other planets are post-launch (O-018, O-019).

## Technical Verification

Configured gates; the accuracy, size and speed report; no browser change yet. Evaluated under `agent-skills/references/check-method.md`.

## Evidence (lane o025-t096, builder session t096-builder-lane-20261018)

Base commit `0c6b1c0`. Run folder: `docs/evidence/o025-t096-20261018T043531Z/` (`importer.log`, `importer-report.json`, `measure.json`).

### Report

**Moons.** Horizons' major-body list (`COMMAND='MB'`, fetched 2026-10-18T04:30:41Z, API 1.2) lists **115 moons of Jupiter**: 72 numbered (501-572) and 43 provisional (55501-55544, no 55524). All 115 plus Jupiter itself are stored. Ephemerides as Horizons names them: `jup365_merged` (Galileans, the four inner moons, Jupiter), `jup347_merged_DE442` and `jup349_merged_DE442` (the irregular moons). 63 moons carry Horizons' note "recently discovered"; their provenance says the true position can differ from Horizons by far more than the fit does (Horizons prints no number for its own uncertainty).

**Frame and time.** Every series is about the Jupiter system barycentre (NAIF 5), geometric, ICRF (= Astraeus EQJ, the frame of `data/orbits/io.json` and the existing providers), km, in TDB. The provider subtracts Jupiter's series to answer Jupiter-centred EQJ km (velocity km/s) for a UTC millisecond, like the other trajectories. Why barycentric: about Jupiter's centre the outer moons carry Jupiter's own wobble (about 100 km at the Galilean periods), which would need as many coefficients as Io; about the barycentre they are smooth. UTC to TDB: TT - UTC from a table in the index (leap-second steps; Horizons' own TDB - UT sampled monthly 1950-2050), TDB - TT from the leading SOFA `dtdb` terms; against Horizons the table plus series agree to **5.6 microseconds** over 1972-2050.

**Format (Decision 9).** Piecewise Chebyshev, SPICE style. A key finding: JPL's kernels are themselves piecewise Chebyshev records (0.375 d for the inner moons, 1.125 d for Io, Europa and Ganymede, 2.25 d for Callisto and Jupiter, 6 d for `jup347`, 9 d for `jup349` moons), and the source's higher derivatives jump at every record boundary. A fit straddling a boundary has a floor (Metis: about 150 m with 0.75-day segments), while segments aligned with the records reproduce Horizons exactly (Metis, degree 15 on 0.375 d: 0.000 m before quantisation). Also found and avoided: Horizons' printed Julian dates (9 decimals) and double-precision JDs each lose about 40 microseconds, a metre at Metis' speed, so all times are TDB seconds from J2000 taken from the requested grid.
- Policy per body (`tools/import/horizons-moons-policy.mjs`): from its period, a dense probe finds the source's record grid (sixth differences spike at a boundary); over a calibration year (2016-10-01 to 2017-12-01, the demo window and a month either side, so it is measured first) the importer tries segment lengths that are whole multiples or fractions of that grid and picks the cheapest (coefficients per day) whose worst error at the interleaved test times is half the target, with the sparsest sample step that still meets it. Over the full span the independent check then raises the degree, and if needed shortens the segment, until the target is met (27 bodies were adjusted; columns marked "cal."). Choices are kept in `tools/import/horizons-moons-fit.json`.
- Target: worst error at most **1 m** for every moon (the owner's metre level for inner and Galilean moons; for the outer ones 1 m is under a pixel even at the closest framing of a 1 km moon), **0.1 m** for Jupiter's series because it enters every moon.
- Storage: compact binary, one file per body per calendar year (`data/ephemerides/jupiter-moons/<body>/<year>.bin`, 2,320 files): 20-byte header, then each coefficient as whole quanta (1 cm; 1 mm for Jupiter) in zig-zag varints (about 3.8 bytes per coefficient). Index `index.json` (406 KB raw, 36 KB gzip; one body per line): id, name, NAIF id, designation, Horizons ephemeris and header notes, fit, chunks, measured accuracy, provenance, the TT - UTC table, source and licence. No database.

**Span: 2010-01-01 to 2030-01-01 (narrowed from 1950-2050, for size).** Measured size of the 20 years is 22.3 MB; the same fits for 1950-2050 would be **111 MB** (each body's measured bytes per segment times its segments in a century), beyond the public build's whole-build limit (22.5 MB) and heavy for the repository. 2010-2030 covers the demo year (4 Nov 2016 for a year) and today with margin. Horizons itself serves every moon 1950-2050 (checked at both ends for S2021_J8 and S2003_J2), so extending is a rerun: `node tools/import/horizons-moons.mjs --from 1950-01-01 --to 2050-01-01` (the TT - UTC table already reaches 1950, drifting pieces before 1972).

**Accuracy (Decision 3; Done When 5).** Each body was checked at about 10,000 independent dates over the span (every 1,051 min, never fit nodes), at about 3,400 dates in the demo window (half-step offsets), and end to end through the provider at 1,001 UTC dates against Horizons' own Jupiter-centred UT vectors (Horizons' centre subtraction and time scale).

| Group | Bodies | Worst over span | Median of worst | Median rms | Worst Jupiter-centred, UTC, through the provider |
|---|---|---|---|---|---|
| Jupiter (centre series) | 1 | 0.004 m | 0.004 m | 0.001 m | - |
| Inner (Metis, Adrastea, Amalthea, Thebe) | 4 | 0.038 m | 0.035 m | 0.014 m | 0.166 m |
| Galilean | 4 | 0.037 m | 0.033 m | 0.013 m | 0.099 m |
| Outer and provisional | 107 | 0.989 m | 0.604 m | 0.109 m | 0.967 m |

The inner and Galilean moons reproduce JPL's records (the residual is the 1 cm quantum); the end-to-end figure adds the UTC to TDB series (a few microseconds) times their speed. Every body is within its target; the demo-window worst is 0.78 m.

**Size (Done When 6).**

| | Raw | gzip |
|---|---|---|
| All 2010-2030 (116 bodies, 2,320 files) | 22.27 MB | 20.87 MB |
| 2010s / 2020s | 11.14 MB / 11.13 MB | 10.43 MB / 10.43 MB |
| One year (all bodies) | about 1.11 MB | about 1.04 MB |
| Demo window (2016 and 2017 chunks, all bodies) | 2.22 MB | 2.08 MB |
| 1950-2050, estimated from measured bytes per segment | 111.3 MB | - |
| By group, 2010-2030: inner 13.19 MB, Galilean 3.10 MB, outer 5.52 MB, Jupiter 0.45 MB | | |

Against raw tables: the step each body would need as a plain table read by the engine's cubic Hermite interpolation (`SampledTrajectory`) to stay within 1 m, measured on the dense probe samples (Metis and Adrastea 2 min, Amalthea 4, Thebe 5, Io 10, Europa and Ganymede 20, Callisto 60 min, outer moons 3-45 h). Those tables for 2010-2030 would be **900 MB** as six float64 per row (3.65 GB as Horizons' CSV): about **40 times** the fits (Metis 67x, Adrastea 70x, Io 47x; outer moons 3-16x, least for the strongly perturbed ones such as Carpo 2.8x). Three steps (Ganymede, Callisto, Themisto) are the probe's own step, so their table figures are upper bounds within a factor of two. The varints barely gzip (6%). Only the chunks a window needs are fetched: `ChebyshevEphemeris.chunksFor` / `loadEphemerisWindow` (tested).

**Speed (Done When 7).** All 115 moons' Jupiter-centred positions for one frame (`positionsKmInto`, no allocation), 3,000 frames stepping an hour through the demo year:

| Where | Mean | p95 |
|---|---|---|
| Node 24 | 0.014 ms | 0.016 ms |
| Headless Chromium, no throttling | 0.013 ms | 0.015 ms |
| Headless Chromium, CPU throttled 4x | 0.051 ms | 0.075 ms |
| Headless Chromium, CPU throttled 6x (phone class) | 0.078 ms | 0.115 ms |

Well under the 1 ms target. `stateOf` (allocating State objects) for all 115 is 0.15 ms in Node. Decoding the demo window's chunks once (2.2 MB, base64 in the page included) took 110 ms unthrottled and 673 ms at 6x: a one-time load cost a later Task should spread (decode per chunk on demand, or in a worker). Zero console errors in all three page runs. The probe ran only after `pgrep -f '[c]hrome-headless-shell'` was empty and the 1-minute load was 5.59.

### Per-criterion outcomes

1. Decisions 3, 8, 9 — **Met.** Positions are Horizons state vectors fitted per body (no mean elements); the data live in core `data/ephemerides/` with a generic core provider; Chebyshev files, no database.
2. Importer — **Met.** `tools/import/horizons-moons.mjs` (+ `horizons-client.mjs`, `horizons-moons-policy.mjs`, `chebyshevFit.ts`): body list from Horizons (115, fetched 2026-10-18T04:30:41Z), one request at a time with a 1 s pause and retries, every response cached gzipped in git-ignored `tools/import/.horizons-cache/` (500 MB, 899 cached responses), resumable (a rerun with the cache made 4 requests); segment length and degree chosen per body from its period and the source grid. Source, API version (1.2), ephemeris names and licence note (US Government work, credit NASA/JPL-Caltech SSD) are in the index and every body's provenance (PROV-02).
3. Core data files — **Met.** `data/ephemerides/jupiter-moons/` per body per year, compact binary, plus `index.json`; `data/ephemerides/README.md` describes the format and rebuild.
4. Core provider — **Met.** `src/core/chebyshevEphemeris.ts` (`ChebyshevEphemeris`: `trajectory(id).stateAt(utcMs)`, `stateOf`, `positionsKmInto`, `chunksFor`, `addChunk`, `boundsOf`; `loadEphemerisWindow`), `src/core/chebyshevSeries.ts` (chunk decode/evaluate), `src/core/chebyshev.ts` (Clenshaw), `src/core/timeScale.ts` (UTC to TDB). EQJ km, km/s, the set's centre; named errors `TrajectoryOutOfRangeError` (reused), `EphemerisChunkMissingError`, `UnknownEphemerisBodyError`, `EphemerisIndexError`, `SeriesFormatError`, `TimeScaleOutOfRangeError`; deterministic (tested bit-identical). No dataset or body names in `src/core/` (name check passes; ARCH-01).
5. Accuracy — **Met.** Per body worst and rms at independent dates over the span and the demo window, and end to end, in the table below and in each body's `accuracy` and `provenance.accuracy`; recently discovered moons carry Horizons' note.
6. Size — **Met.** Above; span narrowed with the reason.
7. Speed — **Met.** Above.
8. Tests and gates — **Met.** `tests/chebyshevFit.test.ts` (11: Clenshaw value and slope, least squares exact and refusals, synthetic round trip fit-quantise-encode-decode-evaluate under 1 mm before and 5 cm after quantising, velocity, joins, damaged chunks), `tests/chebyshevEphemeris.test.ts` (22: time scale incl. leap second and Horizons TDB - UT values, centre-relative states, determinism, batch path, continuity at segment and chunk joins, span edges to the millisecond, named errors, window loading, nine index validation failures), `tests/jupiterMoonsEphemeris.test.ts` (5: committed data — 115 moons, every chunk present at its size, recorded errors within target, whole span covered, provider against the Horizons fixture `tests/fixtures/jupiter-moons-horizons.json` within 2 m at 495 dates).

### Commands run (lane, 2026-10-18)

- `npx tsc --noEmit` — exit 0.
- `npx vitest run` — 69 files, 1060 passed, 1 skipped.
- `npm run build` — exit 0 (the existing chunk-size warning only).
- `node tools/import/horizons-moons.mjs --from 2010-01-01 --to 2030-01-01 --report docs/evidence/o025-t096-20261018T043531Z` — final run 116 bodies, all within target.
- `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js node tools/import/horizons-moons-measure.mjs --browser --report docs/evidence/o025-t096-20261018T043531Z` — 16:18 local, 0 console errors.
- No UI change, so no browser-lite or full browser run (per the Task's Technical Verification).

### Files

Read (Context Files): `src/core/trajectory.ts`, `src/core/sampledTrajectory.ts`, `src/core/satelliteMeanElements.ts`, `src/core/moonTrajectory.ts`, `src/core/provenance.ts`, `data/orbits/io.json`, `.savepoint/checks/C-059-t-078-task-check.md`, `docs/ASTRONOMY_VALIDATION.md` (time-scale lines), `tools/validate/load-budget.mjs` (head), the O-025 Objective.
Extra reads (logged): `src/core/state.ts`, `src/core/body.ts`, `src/core/astronomyAdapter.ts` (head) — State/centre contracts and the existing time handling; `tests/nameCheck.test.ts` (head) — the name rule for new core files; `tools/import/planetary-explorer.mjs` (head), `tools/import/ts-resolve-hook.mjs`, `tools/import/test-io.mjs` — importer and test-helper conventions; `package.json`, `tsconfig.json`, `.gitignore`, `.savepoint/config.yml`, `vite.config.ts` (test section) — tooling and gates; `data/bodies/README.md` — core data conventions; `.savepoint/Design.md` (grep for providers) — where providers are described; `tools/validate/browser-lite.mjs` (launch lines) — how Chromium is launched.
Changed: `src/core/chebyshev.ts`, `src/core/chebyshevSeries.ts`, `src/core/chebyshevEphemeris.ts`, `src/core/timeScale.ts` (new); `tools/import/horizons-moons.mjs`, `tools/import/horizons-client.mjs`, `tools/import/horizons-moons-policy.mjs`, `tools/import/horizons-moons-measure.mjs`, `tools/import/chebyshevFit.ts`, `tools/import/horizons-moons-fit.json` (new); `tools/import/test-io.mjs`, `tools/import/test-io.d.mts` (`readBytes`); `data/ephemerides/README.md`, `data/ephemerides/jupiter-moons/` (index and 2,320 chunks); `tests/chebyshevFit.test.ts`, `tests/chebyshevEphemeris.test.ts`, `tests/jupiterMoonsEphemeris.test.ts`, `tests/fixtures/jupiter-moons-horizons.json`; `.gitignore` (the Horizons cache); this Task; the run folder.

### Limitations

- The fit error is against Horizons, not against the sky; Horizons' own uncertainty is not quantified (it prints none), and for the 63 recently discovered moons it is far larger than the fit.
- Span 2010-2030 only (size); before 1972 the TT - UTC table interpolates monthly (UTC then had fractional steps), stated in the index; not exercised by the committed span.
- After adjustment a few outer moons use more coefficients than needed (Carpo: 6-day segments kept its calibrated degree 36, 203 KB for 20 years against about 50 KB typical); a smarter shortening rule would trim them.
- The outer moons' "under a pixel at any view" target is met by the same 1 m as the inner moons; a looser target would roughly halve their 5.5 MB.
- The browser probe measured evaluation in a bare page, not inside the scene; decode time includes base64 conversion.
- Raw-table steps for Ganymede, Callisto and Themisto are bounded by the probe step (upper bounds on table size).

### Drift Notes

- **Design reconciliation (deferred to the O-025 integration Task):** Design.md's Components / Current Technical State should gain the curve-fit provider (`chebyshevEphemeris.ts`, `chebyshevSeries.ts`, `chebyshev.ts`), the first UTC-to-TDB table in core (`timeScale.ts`, independent of the Orb adapter's own conversion), and `data/ephemerides/` as core data. Not edited here (data and provider only).
- **Load budget:** the whole-build limit in `tools/validate/load-budget.mjs` (22.5 MB) is about the size of the committed 20 years; T-098/T-100 will need to ship only the chunks experiences use, or raise the limit on purpose, and spread the one-time decode (110 ms unthrottled, 673 ms at 6x for the demo window).
- **Composed velocity:** this provider is the first catalogued-style source to supply velocity; `StateResolver` composition carries position only (Design note), so velocity is lost if a later Task composes these states.
- **Decision 11 input:** Jupiter's own barycentric series is already in the set (0.45 MB for 20 years at 0.1 m); a planet fit would need Jupiter barycentre about the Sun, a separate series.
- No Task, Check or Issue created (lane rules).

### Per body (worst and rms at ~10,000 independent dates 2010-2030; demo window ~3,400 dates; Jupiter-centred UTC 1,001 dates through the provider)

| Body | NAIF | Horizons ephemeris | Segment (d) | Degree | Sample step (min) | Worst / rms over span (m) | Worst, demo window (m) | Worst, Jupiter-centred UTC (m) | Fitted bytes 2010-2030 | Hermite table step for 1 m (min) |
|---|---|---|---|---|---|---|---|---|---|---|
| jupiter | 599 | jup365_merged | 2.25 | 15 | 180 | 0.0039 / 0.0014 | 0.0036 | centre | 451,791 | 120 |
| io | 501 | jup365_merged | 1.125 | 15 | 60 | 0.0354 / 0.0143 | 0.042 | 0.0994 | 1,077,981 | 10 |
| europa | 502 | jup365_merged | 1.125 | 15 | 60 | 0.0365 / 0.0138 | 0.0372 | 0.0755 | 941,049 | 20 |
| ganymede | 503 | jup365_merged | 1.125 | 9 | 60 | 0.0287 / 0.0114 | 0.0274 | 0.0662 | 705,300 | 20 (probe-limited) |
| callisto | 504 | jup365_merged | 2.25 | 10 | 270 | 0.0314 / 0.0119 | 0.0297 | 0.0521 | 375,786 | 60 (probe-limited) |
| amalthea | 505 | jup365_merged | 0.375 | 13 | 30 | 0.0349 / 0.0136 | 0.0358 | 0.1397 | 3,084,530 | 4 |
| himalia | 506 | jup347_merged_DE442 | 24 | 29 | 180 | 0.7053 / 0.1221 | 0.498 | 0.473 | 58,895 | 540 |
| elara | 507 | jup347_merged_DE442 | 24 | 31 | 180 | 0.5316 / 0.105 | 0.4978 | 0.4611 | 60,139 | 540 |
| pasiphae | 508 | jup347_merged_DE442 | 36 | 35 | 180 | 0.8806 / 0.0768 | 0.4703 | 0.6715 | 38,885 | 540 |
| sinope | 509 | jup347_merged_DE442 | 36 | 31 | 360 | 0.5067 / 0.092 | 0.4672 | 0.3894 | 35,361 | 2160 |
| lysithea | 510 | jup347_merged_DE442 | 24 | 28 | 180 | 0.5677 / 0.1237 | 0.4894 | 0.4634 | 57,354 | 540 |
| carme | 511 | jup347_merged_DE442 | 36 | 31 | 360 | 0.5211 / 0.1022 | 0.5057 | 0.5451 | 35,935 | 900 |
| ananke | 512 | jup347_merged_DE442 | 24 | 21 | 540 | 0.5529 / 0.102 | 0.4612 | 0.4946 | 42,662 | 1620 |
| leda | 513 | jup347_merged_DE442 | 24 | 31 | 180 | 0.584 / 0.1202 | 0.4923 | 0.481 | 60,678 | 540 |
| thebe | 514 | jup365_merged | 0.375 | 11 | 20 | 0.0297 / 0.0124 | 0.0331 | 0.1269 | 2,761,885 | 5 |
| adrastea | 515 | jup365_merged | 0.375 | 14 | 30 | 0.0349 / 0.0139 | 0.0401 | 0.1659 | 3,600,122 | 2 |
| metis | 516 | jup365_merged | 0.375 | 15 | 30 | 0.0381 / 0.0143 | 0.0371 | 0.1584 | 3,743,865 | 2 |
| callirrhoe | 517 | jup347_merged_DE442 | 48 | 42 (cal. 40) | 360 | 0.9779 / 0.1341 | 0.6364 | 0.9128 | 33,358 | 2700 |
| themisto | 518 | jup347_merged_DE442 | 6 | 14 | 180 | 0.4984 / 0.0734 | 0.3024 | 0.3781 | 138,201 | 180 (probe-limited) |
| megaclite | 519 | jup347_merged_DE442 | 36 | 32 | 360 | 0.822 / 0.0996 | 0.3935 | 0.7068 | 36,310 | 2700 |
| taygete | 520 | jup347_merged_DE442 | 24 | 20 | 540 | 0.5691 / 0.115 | 0.4411 | 0.4927 | 40,465 | 1620 |
| chaldene | 521 | jup347_merged_DE442 | 12 (cal. 48) | 21 | 720 | 0.1225 / 0.0183 | 0.0383 | 0.0914 | 76,577 | 1260 |
| harpalyke | 522 | jup347_merged_DE442 | 36 | 30 | 360 | 0.5214 / 0.1416 | 0.4675 | 0.5261 | 36,234 | 1620 |
| kalyke | 523 | jup347_merged_DE442 | 48 | 40 | 360 | 0.6854 / 0.1372 | 0.4874 | 0.5636 | 32,314 | 900 |
| iocaste | 524 | jup347_merged_DE442 | 36 | 31 | 360 | 0.7993 / 0.1423 | 0.4771 | 0.6943 | 36,620 | 2160 |
| erinome | 525 | jup347_merged_DE442 | 24 (cal. 48) | 27 | 720 | 0.7561 / 0.0342 | 0.1895 | 0.2856 | 47,070 | 900 |
| isonoe | 526 | jup347_merged_DE442 | 12 | 9 | 1080 | 0.7585 / 0.1629 | 0.4879 | 0.6268 | 54,522 | 1260 |
| praxidike | 527 | jup347_merged_DE442 | 12 | 10 (cal. 9) | 1080 | 0.8109 / 0.1636 | 0.3674 | 0.79 | 56,489 | 900 |
| autonoe | 528 | jup347_merged_DE442 | 18 | 15 | 720 | 0.9066 / 0.1267 | 0.4626 | 0.7411 | 45,604 | 2160 |
| thyone | 529 | jup347_merged_DE442 | 36 | 31 | 360 | 0.6341 / 0.1174 | 0.4654 | 0.603 | 36,679 | 1620 |
| hermippe | 530 | jup347_merged_DE442 | 24 | 14 | 1080 | 0.869 / 0.235 | 0.4886 | 0.8497 | 35,851 | 1260 |
| aitne | 531 | jup347_merged_DE442 | 36 | 31 | 360 | 0.5086 / 0.103 | 0.4226 | 0.4709 | 35,922 | 1260 |
| eurydome | 532 | jup347_merged_DE442 | 36 | 32 | 360 | 0.6554 / 0.1046 | 0.5975 | 0.5953 | 36,822 | 2160 |
| euanthe | 533 | jup347_merged_DE442 | 24 | 20 | 540 | 0.5033 / 0.1283 | 0.4484 | 0.4674 | 41,673 | 900 |
| euporie | 534 | jup347_merged_DE442 | 36 | 30 | 360 | 0.5011 / 0.1791 | 0.4399 | 0.4437 | 37,202 | 1620 |
| orthosie | 535 | jup347_merged_DE442 | 36 | 34 | 360 | 0.8465 / 0.1024 | 0.3554 | 0.8558 | 39,223 | 2160 |
| sponde | 536 | jup347_merged_DE442 | 36 | 32 | 360 | 0.6768 / 0.0829 | 0.4794 | 0.5225 | 36,499 | 900 |
| kale | 537 | jup347_merged_DE442 | 48 | 40 | 360 | 0.7214 / 0.1406 | 0.4991 | 0.5613 | 32,372 | 900 |
| pasithee | 538 | jup347_merged_DE442 | 24 (cal. 48) | 34 | 540 | 0.9472 / 0.0345 | 0.3711 | 0.4885 | 53,576 | 900 |
| hegemone | 539 | jup347_merged_DE442 | 36 | 35 | 360 | 0.3752 / 0.0456 | 0.3866 | 0.2428 | 38,582 | 540 |
| mneme | 540 | jup347_merged_DE442 | 36 | 33 | 360 | 0.5316 / 0.0919 | 0.3982 | 0.4375 | 38,311 | 1260 |
| aoede | 541 | jup347_merged_DE442 | 36 | 35 | 360 | 0.6318 / 0.0509 | 0.4273 | 0.4636 | 38,528 | 1620 |
| thelxinoe | 542 | jup347_merged_DE442 | 36 | 30 | 360 | 0.5717 / 0.1442 | 0.4254 | 0.5041 | 36,157 | 1620 |
| arche | 543 | jup347_merged_DE442 | 24 | 20 | 540 | 0.6439 / 0.1247 | 0.573 | 0.5363 | 40,675 | 2160 |
| kallichore | 544 | jup347_merged_DE442 | 36 | 30 | 540 | 0.7052 / 0.1288 | 0.476 | 0.5965 | 35,299 | 2160 |
| helike | 545 | jup347_merged_DE442 | 12 | 9 | 1080 | 0.5493 / 0.179 | 0.4974 | 0.4844 | 54,818 | 1260 |
| carpo | 546 | jup347_merged_DE442 | 6 (cal. 36) | 36 | 180 | 0.0359 / 0.0125 | 0.0316 | 0.0394 | 202,766 | 900 |
| eukelade | 547 | jup347_merged_DE442 | 24 | 20 | 540 | 0.6523 / 0.1259 | 0.4847 | 0.5349 | 40,874 | 900 |
| cyllene | 548 | jup347_merged_DE442 | 18 (cal. 36) | 37 (cal. 35) | 360 | 0.8876 / 0.0301 | 0.2607 | 0.9672 | 73,206 | 2160 |
| kore | 549 | jup347_merged_DE442 | 18 (cal. 36) | 19 (cal. 18) | 1080 | 0.9892 / 0.0516 | 0.5523 | 0.8181 | 50,373 | 1260 |
| herse | 550 | jup347_merged_DE442 | 18 | 15 | 720 | 0.5358 / 0.1132 | 0.4792 | 0.4686 | 45,650 | 1260 |
| s2010-j1 | 551 | jup347_merged_DE442 | 36 | 31 | 360 | 0.4479 / 0.0988 | 0.4589 | 0.4452 | 35,617 | 900 |
| s2010-j2 | 552 | jup347_merged_DE442 | 36 | 32 | 360 | 0.7398 / 0.1212 | 0.4292 | 0.6741 | 37,564 | 900 |
| dia | 553 | jup347_merged_DE442 | 18 | 23 | 180 | 0.5913 / 0.1042 | 0.4922 | 0.4951 | 64,351 | 540 |
| s2016-j1 | 554 | jup347_merged_DE442 | 36 | 30 | 360 | 0.5721 / 0.1326 | 0.4533 | 0.5067 | 36,105 | 1620 |
| s2003-j18 | 555 | jup347_merged_DE442 | 48 | 34 | 360 | 0.4929 / 0.2065 | 0.4786 | 0.4809 | 30,517 | 1260 |
| s2011-j2 | 556 | jup347_merged_DE442 | 24 (cal. 48) | 25 (cal. 23) | 1080 | 0.7318 / 0.0403 | 0.22 | 0.4892 | 45,592 | 1620 |
| eirene | 557 | jup347_merged_DE442 | 12 (cal. 48) | 21 | 720 | 0.0969 / 0.0178 | 0.0511 | 0.102 | 76,416 | 1620 |
| philophrosyne | 558 | jup347_merged_DE442 | 48 | 41 (cal. 40) | 360 | 0.7617 / 0.1192 | 0.4141 | 0.5715 | 33,000 | 900 |
| s2017-j1 | 559 | jup347_merged_DE442 | 36 | 33 | 180 | 0.8323 / 0.0853 | 0.4953 | 0.5826 | 37,293 | 720 |
| eupheme | 560 | jup347_merged_DE442 | 24 | 21 | 540 | 0.7464 / 0.1391 | 0.4425 | 0.6075 | 42,777 | 900 |
| s2003-j19 | 561 | jup347_merged_DE442 | 36 | 30 | 360 | 0.7298 / 0.1379 | 0.4837 | 0.715 | 35,363 | 900 |
| valetudo | 562 | jup347_merged_DE442 | 24 | 21 | 540 | 0.6528 / 0.1172 | 0.4814 | 0.5078 | 43,690 | 1260 |
| s2017-j2 | 563 | jup347_merged_DE442 | 12 (cal. 48) | 20 | 720 | 0.3837 / 0.0246 | 0.0782 | 0.1899 | 74,653 | 1620 |
| s2017-j3 | 564 | jup347_merged_DE442 | 48 | 39 | 360 | 0.7647 / 0.178 | 0.6032 | 0.6561 | 32,588 | 1620 |
| pandia | 565 | jup347_merged_DE442 | 24 | 29 | 180 | 0.6829 / 0.1313 | 0.4662 | 0.492 | 58,645 | 540 |
| s2017-j5 | 566 | jup347_merged_DE442 | 24 | 20 | 540 | 0.5212 / 0.1164 | 0.4655 | 0.4824 | 40,725 | 2160 |
| s2017-j6 | 567 | jup347_merged_DE442 | 36 | 35 | 360 | 0.3928 / 0.0461 | 0.4022 | 0.3947 | 38,631 | 900 |
| s2017-j7 | 568 | jup347_merged_DE442 | 36 | 30 | 360 | 0.7829 / 0.153 | 0.4802 | 0.7369 | 36,016 | 900 |
| s2017-j8 | 569 | jup347_merged_DE442 | 36 | 31 | 360 | 0.5359 / 0.1087 | 0.5148 | 0.5038 | 36,136 | 2160 |
| s2017-j9 | 570 | jup347_merged_DE442 | 48 | 40 | 360 | 0.6595 / 0.1389 | 0.4457 | 0.5633 | 32,601 | 900 |
| ersa | 571 | jup347_merged_DE442 | 24 | 26 | 180 | 0.6732 / 0.1516 | 0.6065 | 0.6297 | 55,931 | 720 |
| s2011-j1 | 572 | jup347_merged_DE442 | 12 | 9 | 1080 | 0.8948 / 0.1788 | 0.5013 | 0.8295 | 53,972 | 900 |
| s2003-j2 | 55501 | jup347_merged_DE442 | 24 | 20 | 540 | 0.7657 / 0.156 | 0.4615 | 0.6686 | 41,608 | 900 |
| s2003-j4 | 55502 | jup347_merged_DE442 | 12 (cal. 48) | 21 | 720 | 0.3303 / 0.0233 | 0.0331 | 0.1348 | 77,026 | 1620 |
| s2003-j9 | 55503 | jup347_merged_DE442 | 12 (cal. 48) | 22 | 720 | 0.0618 / 0.0168 | 0.0338 | 0.0485 | 78,235 | 1620 |
| s2003-j10 | 55504 | jup347_merged_DE442 | 36 | 30 | 360 | 0.6633 / 0.1272 | 0.4642 | 0.5883 | 35,232 | 900 |
| s2003-j12 | 55505 | jup347_merged_DE442 | 24 | 21 | 540 | 0.8122 / 0.1363 | 0.4808 | 0.6929 | 42,845 | 2160 |
| s2003-j16 | 55506 | jup347_merged_DE442 | 36 | 33 | 360 | 0.6042 / 0.0876 | 0.4215 | 0.4931 | 38,298 | 900 |
| s2003-j23 | 55507 | jup347_merged_DE442 | 24 | 21 (cal. 20) | 540 | 0.8907 / 0.0897 | 0.3405 | 0.7775 | 41,499 | 1620 |
| s2003-j24 | 55508 | jup347_merged_DE442 | 36 | 31 | 360 | 0.5295 / 0.1005 | 0.443 | 0.48 | 35,916 | 900 |
| s2011-j3 | 55509 | jup347_merged_DE442 | 24 | 31 | 180 | 0.5329 / 0.1014 | 0.4569 | 0.4812 | 60,073 | 540 |
| s2018-j2 | 55510 | jup347_merged_DE442 | 18 | 21 | 180 | 0.6467 / 0.1329 | 0.4983 | 0.5746 | 63,376 | 540 |
| s2018-j3 | 55511 | jup347_merged_DE442 | 36 | 31 | 360 | 0.4996 / 0.1016 | 0.4626 | 0.4135 | 35,962 | 900 |
| s2021-j1 | 55512 | jup347_merged_DE442 | 24 (cal. 48) | 30 (cal. 28) | 720 | 0.8075 / 0.0428 | 0.6053 | 0.5752 | 50,784 | 900 |
| s2021-j2 | 55513 | jup347_merged_DE442 | 24 | 21 (cal. 19) | 720 | 0.9871 / 0.1347 | 0.7788 | 0.7101 | 42,472 | 900 |
| s2021-j3 | 55514 | jup347_merged_DE442 | 36 | 34 | 360 | 0.3403 / 0.0634 | 0.4008 | 0.3407 | 38,936 | 2160 |
| s2021-j4 | 55515 | jup347_merged_DE442 | 48 | 28 (cal. 26) | 720 | 0.9482 / 0.2278 | 0.5043 | 0.9597 | 26,861 | 1260 |
| s2021-j5 | 55516 | jup347_merged_DE442 | 48 | 40 | 360 | 0.6981 / 0.1344 | 0.4261 | 0.7114 | 32,313 | 900 |
| s2021-j6 | 55517 | jup347_merged_DE442 | 18 | 15 | 720 | 0.6439 / 0.1264 | 0.4834 | 0.5749 | 46,034 | 900 |
| s2016-j3 | 55518 | jup347_merged_DE442 | 36 | 31 | 360 | 0.4917 / 0.1006 | 0.4593 | 0.4651 | 36,018 | 900 |
| s2016-j4 | 55519 | jup347_merged_DE442 | 12 (cal. 48) | 22 | 720 | 0.1143 / 0.018 | 0.037 | 0.077 | 78,344 | 1260 |
| s2018-j4 | 55520 | jup347_merged_DE442 | 36 | 31 | 360 | 0.4674 / 0.1517 | 0.4328 | 0.4174 | 39,257 | 900 |
| s2022-j1 | 55521 | jup347_merged_DE442 | 24 | 20 | 540 | 0.5696 / 0.1202 | 0.4374 | 0.4568 | 40,676 | 1260 |
| s2022-j2 | 55522 | jup347_merged_DE442 | 36 | 30 | 360 | 0.6609 / 0.1351 | 0.4498 | 0.5916 | 35,359 | 1620 |
| s2022-j3 | 55523 | jup347_merged_DE442 | 24 | 20 | 540 | 0.84 / 0.154 | 0.4571 | 0.6951 | 41,732 | 1620 |
| s2017-j10 | 55525 | jup347_merged_DE442 | 24 (cal. 48) | 25 (cal. 23) | 1080 | 0.5045 / 0.0342 | 0.1925 | 0.3946 | 45,970 | 1260 |
| s2017-j11 | 55526 | jup347_merged_DE442 | 12 | 10 | 720 | 0.5518 / 0.1194 | 0.4794 | 0.4787 | 56,313 | 900 |
| s2011-j4 | 55527 | jup348_merged_DE442 | 9 | 8 | 1440 | 0.0318 / 0.0109 | 0.0263 | 0.0269 | 76,832 | 540 |
| s2018-j5 | 55528 | jup348_merged_DE442 | 9 | 6 | 180 | 0.7642 / 0.1716 | 0.4897 | 0.667 | 62,806 | 2160 |
| s2024-j1 | 55529 | jup348_merged_DE442 | 9 | 7 (cal. 6) | 1080 | 0.6483 / 0.1301 | 0.25 | 0.632 | 63,890 | 1260 |
| s2011-j5 | 55530 | jup348_merged_DE442 | 9 | 7 | 360 | 0.4757 / 0.1074 | 0.4693 | 0.4188 | 65,283 | 1620 |
| s2010-j3 | 55531 | jup349_merged_DE442 | 9 | 8 | 1440 | 0.0285 / 0.011 | 0.0235 | 0.026 | 67,187 | 720 |
| s2010-j4 | 55532 | jup349_merged_DE442 | 9 | 8 | 1440 | 0.0281 / 0.0109 | 0.0263 | 0.0274 | 67,912 | 2160 |
| s2010-j5 | 55533 | jup349_merged_DE442 | 27 (cal. 54) | 27 | 720 | 0.8851 / 0.0662 | 0.4744 | 0.57 | 42,086 | 2160 |
| s2010-j6 | 55534 | jup349_merged_DE442 | 9 | 8 (cal. 7) | 1080 | 0.0288 / 0.0109 | 0.0276 | 0.03 | 67,327 | 1620 |
| s2011-j6 | 55535 | jup349_merged_DE442 | 27 (cal. 54) | 26 | 360 | 0.5134 / 0.068 | 0.1899 | 0.3977 | 41,564 | 1260 |
| s2017-j12 | 55536 | jup349_merged_DE442 | 9 (cal. 54) | 24 | 480 | 0.0265 / 0.0109 | 0.0251 | 0.0266 | 106,091 | 1620 |
| s2017-j13 | 55537 | jup349_merged_DE442 | 9 (cal. 54) | 25 | 480 | 0.0273 / 0.011 | 0.0275 | 0.0284 | 109,479 | 1260 |
| s2017-j14 | 55538 | jup349_merged_DE442 | 9 (cal. 54) | 32 | 360 | 0.0269 / 0.0111 | 0.0246 | 0.0316 | 126,019 | 900 |
| s2017-j15 | 55539 | jup349_merged_DE442 | 27 | 25 | 540 | 0.539 / 0.0783 | 0.4737 | 0.5526 | 40,771 | 900 |
| s2017-j16 | 55540 | jup349_merged_DE442 | 9 | 7 | 1080 | 0.7712 / 0.1488 | 0.4675 | 0.7302 | 65,076 | 900 |
| s2017-j17 | 55541 | jup349_merged_DE442 | 9 | 8 | 1440 | 0.0294 / 0.0109 | 0.0264 | 0.0375 | 75,549 | 540 |
| s2017-j18 | 55542 | jup349_merged_DE442 | 9 | 7 | 1080 | 0.6869 / 0.141 | 0.4729 | 0.5996 | 65,377 | 900 |
| s2021-j7 | 55543 | jup349_merged_DE442 | 9 | 8 | 1440 | 0.0282 / 0.011 | 0.0244 | 0.0322 | 66,596 | 1260 |
| s2021-j8 | 55544 | jup349_merged_DE442 | 9 | 8 | 1440 | 0.0271 / 0.0109 | 0.022 | 0.031 | 68,800 | 720 |
