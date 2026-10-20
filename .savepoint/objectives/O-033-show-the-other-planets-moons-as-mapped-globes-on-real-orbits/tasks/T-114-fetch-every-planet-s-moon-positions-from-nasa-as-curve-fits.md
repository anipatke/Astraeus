---
id: T-114
title: Fetch every planet's moon positions from NASA as curve fits
objective: O-033
status: done
depends_on: []
check_waiver:
    task: T-114
    reason: "Owner waived the optional Task Checks for O-033 ('waive checks for tasks one big check at end'); the Full Objective Check covers it."
    actor:
        role: owner
        session: 827ddc8a-e534-43b0-98b9-9af4e2acda26
    recorded_at: '2026-10-20T11:04:00Z'
owner_validation: {required: false}
planned_by: {role: planner, session: o033-planning-20261020}
lane: data
planned_writes: [tools/import/horizons-moons.mjs, tools/import/horizons-moons-fit.json, data/ephemerides/README.md, data/ephemerides/planets/planets.json]
---

# Fetch every planet's moon positions from NASA as curve fits

## Outcome

The core data holds NASA-checked positions for every moon Horizons lists around Mars, Saturn, Uranus, Neptune and Pluto, and positions for Saturn, Uranus, Neptune and Pluto themselves, in the same compact curve-fit form as Jupiter's, so any experience can place them.

## User Check

Read the Task evidence: one table per system with moon count, worst and typical error against Horizons, and bytes per year; Jupiter's files unchanged.

## Done When

1. `tools/import/horizons-moons.mjs` takes a system (barycentre NAIF id, centre body, GM, fastest period, output folder) instead of Jupiter constants; Jupiter is one entry; rerunning Jupiter from the cache writes byte-identical `data/ephemerides/jupiter-moons/` (proof: checksum list before and after).
2. `data/ephemerides/<planet>-moons/` for Mars, Saturn, Uranus, Neptune and Pluto (Pluto system barycentre, NAIF 9), 2010-2030, metre-level fits with measured errors in each `index.json`, as O-025 T-096 did.
3. Saturn, Uranus and Neptune added to `data/ephemerides/planets/planets.json` from VSOP87A by the existing planet-fit path, each checked against Horizons at the six dates; Pluto's heliocentric series as a Horizons fit, with its error; the planet-series loader accepts them (`isPlanetId`) with tests.
4. Data README updated (systems, rebuild command, sizes); Node version used recorded (needs 22.18+).

## Context Files

`tools/import/horizons-moons.mjs`, `tools/import/horizons-moons-policy.mjs`, `tools/import/horizons-moons-measure.mjs`, `tools/import/horizons-client.mjs`, `tools/import/horizons-moons-fit.json`, `data/ephemerides/README.md`, `data/ephemerides/jupiter-moons/index.json`, `data/ephemerides/planets/planets.json`, `src/core/planetSeries.ts`, `src/core/planetModels.ts`, `src/core/chebyshevEphemeris.ts`, `tests/jupiterMoonsEphemeris.test.ts`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/tasks/T-096-store-jupiter-s-moon-positions-as-nasa-checked-curve-fits-in-the-core-data.md`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/tasks/T-101-show-off-the-curve-fits-on-the-home-page-and-move-planet-positions-to-curve-fits-if-smaller.md`.

## Design References

Design: core row (curve-fit provider), `data/ephemerides/` row, Planets.

## Guardrails

ARCH-01, ARCH-04, PROV-01, DATA-01, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Lift the Jupiter constants into a system table; prove Jupiter byte-identical.
2. Fetch, calibrate, build and verify each new system (resumable cache).
3. Add the three planets' VSOP87A fits and Pluto's Horizons fit; extend the planet ids and tests.
4. Record sizes and errors.

## Boundaries

Data and tools only: no bodies, visuals or experience wiring (later Tasks). Never overwrite Jupiter's data unless byte-identical.

## Technical Verification

Configured gates; offline rerun reproduces every index; evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

**Result: ready for the Full Objective Check (Task Check waived by the owner, see `check_waiver`).** Run 2026-10-20, Node v24.16.0 (needs 22.18+), builder session 827ddc8a. Bulk output: `docs/evidence/o033-t114-20261020T1130Z/` (per-system importer reports, logs, `system-stats.md`, Jupiter checksums before and after, planet-fit report). Raw Horizons responses are in the git-ignored `tools/import/.horizons-cache/`. No browser was run; no screenshots.

**Per system (2010-01-01 to 2030-01-01, from each `index.json`; error = shipped quantised fit against independent Horizons samples at about 10,000 dates, never fit nodes; end-to-end = through the provider against Horizons' own planet-centred UT vectors).**

| System | Moons listed = built | Worst span error | Typical (median rms) | Worst end-to-end | Raw bytes | Per year | Files |
|---|---|---|---|---|---|---|---|
| mars (NAIF 4) | 2 | 0.55 m (Deimos) | 0.02 m | 0.51 m | 5,477,241 | 273,862 | 60 |
| saturn (6) | 292 | 19.9 m Daphnis, otherwise 0.99 m (Beli) | 0.011 m | 26.2 m Daphnis, then 6.5 m (Epimetheus, Pandora, Atlas) | 38,451,220 | 1,922,561 | 5,849 |
| uranus (7) | 28 | 0.88 m (Sycorax) | 0.064 m | 0.62 m | 32,395,892 | 1,619,794 | 580 |
| neptune (8) | 16 | 0.84 m (Neso) | 0.070 m | 61.4 m (all nep104_merged irregulars) | 17,660,279 | 883,013 | 340 |
| pluto system barycentre (9) | 5 | 0.69 m (Charon) | 0.031 m | 0.62 m | 1,740,942 | 87,047 | 120 |
| jupiter (5), for comparison, unchanged | 115 | 0.99 m | 0.10 m | 0.97 m | 22,265,007 | 1,113,250 | 2,320 |

Sizes are raw bytes of the chunk files (centre planet included); on disk (block sizes) saturn 52 MB, uranus 33 MB, neptune 18 MB, mars 5.4 MB, pluto 2.0 MB. Every moon Horizons lists was built (no `unavailable`).

Findings the Check should weigh:
- **Daphnis (Saturn 635)**: Horizons has no ephemeris after 2018-01-17, so its series covers 2010-01-01 to 2018-01-15 (stated in its provenance notes, `fit.chunks` are 9 years). Its fit also missed the 1 m target after the importer's 16 attempts: worst 19.9 m at one date (2015-12-31), rms 0.32 m, demo-window worst 0.06 m. It has no detectable source record grid. Not iterated further (8 km moon, 20 m is under a pixel); the figure is in its index entry.
- **End-to-end gaps are Horizons-internal, not fit error.** For Neptune's irregular moons (ephemeris `nep104_merged`) all 61.4 m is a constant planet-offset difference between Horizons' kernel solutions; Triton, fitted in the same index, is within 0.4 m end to end (checked at 11 dates). A direct Horizons query at JD 2457700.5 showed Horizons' own moon-about-planet vector equals its moon-about-barycentre minus planet-about-barycentre exactly, so the importer's subtraction is right. Saturn's ring moons show the same effect at 6.5 m.
- **Pluto uses body 999 (Pluto itself) about the Sun in `planets.json`**, per the Done When; its 6.4-day wobble about the barycentre costs 150,021 raw bytes (200,028 base64) against 11,329 raw (15,108 base64) if the barycentre (NAIF 9) had been fitted instead (trial run, not shipped). planets.json is now 511 KB (was 214 KB) and every planet-using experience downloads it (note for the coordinator, below).
- Whole new data is about 94 MB raw in git (7,000 files). Experiences fetch only the chunks a window needs.

**Done When**
1. Importer takes a system table (`SYSTEMS` in `tools/import/horizons-moons.mjs`, `--system`, default jupiter; barycentre id, centre id, GM, fastest period, output folder `data/ephemerides/<system>-moons`). The Jupiter cache is not on this checkout (git-ignored), so the full cache rerun was not possible; the proof used a live rerun of Jupiter (centre) and Io into a scratch folder, then an offline rerun from the cache after the last importer edit: every `.bin` of both bodies byte-identical (`cmp`) to the committed files, both index lines identical, and `data/ephemerides/jupiter-moons/` never written (2,321 files, sha256 list before and after identical: `jupiter-sha256-before.txt` / `-after.txt`). The other 113 Jupiter moons were not re-fetched (their policies in `horizons-moons-fit.json` are unchanged: all 116 old entries equal after parse). Two importer fixes were needed that cannot affect Jupiter's output (they act only where the old code failed): record-grid length snapped to the half hour (Deimos found 721 min for 720) and a calibration step that divides a grid of odd length (Titan 73 h), starting on the grid; calibration requests chunked over Horizons' row limit; a body whose Horizons coverage ends inside the span is fitted to what exists.
2. Mars, Saturn, Uranus, Neptune and Pluto folders built with measured errors per body in each `index.json` (table above).
3. `planets.json` now holds eight planets: Saturn, Uranus, Neptune refitted from VSOP87A (0.53, 0.54, 0.63 km worst against it), Pluto fitted to Horizons (body 999, 6-hourly states, 12-point interpolation; 0.67 km worst against them). The existing four are byte-identical to before (compared parsed, per planet). Checked against Horizons at the six dates (`tests/fixtures/outer-planets-horizons.json`, source text archived beside it): Saturn 2,256 km and 0.32 arcsec, Uranus 19,070 km and 1.36 arcsec, Neptune 36,192 km and 1.62 arcsec (VSOP87A model error against DE441, not fit error), Pluto 0.3 km and 0.004 arcsec. `isPlanetId` and `PLANET_IDS` accept all eight (`tests/outerPlanetFits.test.ts`, 6 tests; `tests/planetFits.test.ts` extended to the seven VSOP planets and the size bound).
4. `data/ephemerides/README.md` updated (systems, sizes, rebuild command, `planets/`), Node 24.16.0 recorded here and in the README.

**Gates (this checkout, Node 24.16.0):** `npm run typecheck` clean; `npm run build` built (existing chunk-size warning only); `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 81 files, 1,155 passed, 1 skipped, 0 failed.

**Commands:** `node tools/import/horizons-moons.mjs --system <mars|pluto|neptune|uranus|saturn> --report docs/evidence/o033-t114-20261020T1130Z/<system>` (Mars without `--report`); `node tools/import/planet-fits.mjs --write --report .../planet-fits-report.json`; the Jupiter proof runs above; tests as listed.

**Files changed:** `tools/import/horizons-moons.mjs`, `tools/import/horizons-moons-policy.mjs`, `tools/import/horizons-moons-fit.json` (new systems' policies appended), `tools/import/planet-fits.mjs`, `data/ephemerides/README.md`, `data/ephemerides/planets/planets.json`, `data/ephemerides/{mars,saturn,uranus,neptune,pluto}-moons/` (new), `src/core/planetSeries.ts`, `src/core/planetModels.ts`, `src/types/orb.d.ts`, `tests/planetFits.test.ts`, `tests/planetFixtures.ts` (PLANETS kept the four catalogue planets), `tests/planets.test.ts` (the "no model" probe uses `earth`, since Saturn now has one), `tests/outerPlanetFits.test.ts` and `tests/fixtures/outer-planets-horizons{.json,-source.txt}` (new), `docs/evidence/o033-t114-20261020T1130Z/` (new). `tools/import/horizons-moons-measure.mjs` and `horizons-client.mjs` unchanged (the measure tool is still Jupiter-only).

**Extra reads (outside Context Files), with reasons:** `agent-skills/savepoint-task/SKILL.md` and `AGENTS.md` (required); `.savepoint/objectives/O-025-*/tasks/T-098-*.md` lines 9-15 (waiver shape); `.gitignore` (cache ignored); `src/core/astronomyAdapter.ts` (how ecliptic fits become EQJ, so Pluto's Horizons states are turned with Orb's own transform); `tests/planets.test.ts`, `tests/planetFixtures.ts`, `tests/planetFits.test.ts`, `tests/fixtures/planets-horizons.json` and `-source.txt` (the six dates and fixture shape to extend); `src/types/orb.d.ts` (module declarations); `node_modules/@lizard-isana/orb` package exports and `src/vsop87a` listing (Saturn, Uranus, Neptune series exist); `package.json` (script names); `data/orbits/io.json` grep (GM source).

**Limitations:** the rest of Jupiter's 113 moons were not re-fetched (proved by two bodies plus unchanged policies and untouched folder); Mars, Pluto, Uranus and Neptune were rebuilt offline from the cache with the final importer and every file is byte-identical (sha256 lists) to the first run, as is Saturn's run (final importer); an offline Saturn rerun was not repeated; Horizons' own uncertainty for newly discovered moons is not in these figures; no browser, no visual check; the Full Objective Check should confirm the byte count claims. Run took about 110 minutes against the 90 planned (Saturn's 292 moons took 55 of them).

**Notes for the coordinator (not created as Issues or Tasks, per lane rules):** (1) decide whether Pluto's planet series should be the barycentre (13x smaller, moons index then supplies Pluto's offset) before T-117 relies on the 511 KB `planets.json`; (2) about 94 MB of new data in git, and Saturn alone 5,849 files; (3) `.savepoint/.../T-117-*.md` shows as modified in this checkout, not by this builder; (4) `tools/import/horizons-moons-measure.mjs` is Jupiter-only (a later Task if the owner wants size and speed for the other systems).


## Drift Notes

Record architecture deltas and reconcile through the planner before Check.

## Owner Completion

Marked done by the coordinator on 2026-10-20T12:54:52Z under the owner's instruction for the O-033 overnight run (owner, 2026-10-20: "waive checks for tasks one big check at end"; chose "Yes, mark them done" once build and tests pass). Gates passed (typecheck, build, 1155 tests). Coordinator decisions carried forward: Pluto moves to a Pluto-system-barycentre heliocentric fit (about 11 KB, not 150 KB) with Pluto's offset from `data/ephemerides/pluto-moons`, done in T-116 so every planet experience stops paying for Pluto's wobble; the repository-size question (about 94 MB raw for 2010-2030, Jupiter's precedent) is reported to the owner, committed locally only.
