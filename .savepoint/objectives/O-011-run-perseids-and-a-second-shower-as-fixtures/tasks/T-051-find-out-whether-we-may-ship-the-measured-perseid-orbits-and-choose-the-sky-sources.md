---
id: T-051
title: Find out whether we may ship the measured Perseid orbits, and choose the sky sources
objective: O-011
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o011-replan-i025-2026-10-13}
lane: stream-data
planned_reads: [docs/ASTRAEUS_SPIKE_04_PERSEIDS_REFERENCE.md, data/showers/perseids.json, src/core/orbitGroup.ts, src/core/pointGroup.ts, docs/DONOR_PROVENANCE.md, docs/ASTRONOMY_VALIDATION.md]
planned_writes: [docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md]
---

# Find out whether we may ship the measured Perseid orbits, and choose the sky sources

## Outcome

A decision record, `docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md`, settles three data sources with evidence: (1) whether the NASA CAMS Meteoroid Orbit Database may be redistributed as a filtered Perseid (and Geminid) subset, with its licence text, format, member counts, accuracy and how each member is turned into a position; (2) the star catalogue; (3) the Milky Way image and its licence. Nothing is built. If CAMS may not be redistributed, the record says so and the Task returns REPLAN REQUIRED for the owner's decision (no fallback, owner decision 1).

## Astraeus Hypothesis

- **Capability tested:** none yet. This settles the data the next three Tasks build on.
- **Gap:** the stream data decision (Success Condition 6) and the sky sources (Success Condition 11) are open.

## User Check

None required. The owner reads the decision record's summary.

## Done When

1. **CAMS:** the record cites the exact release (version, date, URL) and quotes its licence or terms of use, with the access date. It answers "may a filtered subset be committed to this repository and shipped in a public build?" yes or no, and gives the evidence. If the terms are silent, it records whom to ask and stops with REPLAN REQUIRED.
2. **CAMS content:** the columns used (orbital elements or radiant and speed, epoch, shower code, uncertainties), the Perseid (IAU 7) and Geminid (IAU 4) member counts, and how members with unreliable or hyperbolic orbits are treated. It also gives the propagation method, with a worked example on three real records: a CAMS orbit at its observed epoch is placed at a common display time through two-body motion about the Sun, using the existing `TwoBodyAdapter`. The planned on-disk subset format and size (compressed) are stated.
3. **Factual reference values** for the later checks, each with source and access date: 109P/Swift–Tuttle elements (JPL SBDB), Perseid and Geminid peak solar longitude and radiant (IAU MDC or IMO), plus an independent check of 109P's position from JPL Horizons at three dates.
4. **Star catalogue:** a public-domain catalogue (for example the Yale Bright Star Catalogue, 5th revised ed.), with source URL, licence, star count, columns (J2000 RA, Dec, V magnitude, B−V for colour) and the planned subset size.
5. **Milky Way image:** a source with a recorded licence that permits redistribution (for example ESO/S. Brunier, CC BY 4.0, or NASA public domain). The record states its projection and frame (equirectangular galactic or equatorial) and the rotation needed to align it with EQJ, with the galactic pole's J2000 coordinates cited.
7. **After the owner's decisions (replan 2026-10-13):** the record states the local-data approach (git-ignored `data/local/`, fetch tools, nothing committed or shipped, no fallback), the exact upstream URLs each fetch tool will use, and includes a short draft permission request to the CAMS PI for the owner to send. The published peak solar longitude and radiant for Perseids and Geminids come from a reachable published source (not CAMS self-computation), or are recorded as unavailable with the sources tried. The galactic pole and centre J2000 constants are cited from a fetched source. Yale BSC: columns and V ≤ 6.5 subset size from the fetched catalogue.
6. No source, test or data file changes; `git diff --stat` touches only the decision record and this Task file.

## Context Files

`docs/ASTRAEUS_SPIKE_04_PERSEIDS_REFERENCE.md`, `data/showers/perseids.json`, `src/core/orbitGroup.ts`, `src/core/pointGroup.ts`, `src/core/twoBodyAdapter.ts`, `docs/DONOR_PROVENANCE.md`, `docs/ASTRONOMY_VALIDATION.md`.

## Design References

Design: Interfaces and Data Flow (groups, `createOrbitGroup`, `TwoBodyAdapter`); Decisions (provider selection).

## Guardrails

PROV-01, PROV-02, TEST-01.

## Implementation Plan

1. Fetch the CAMS release page and readme; download the database to a scratch directory outside the repository; quote the licence or terms.
2. Count IAU 7 and IAU 4 members; inspect the columns; propagate three Perseid records by hand through `TwoBodyAdapter` in a scratch script; record the method and figures.
3. Fetch SBDB and Horizons values for 109P; record the published peak and radiant figures.
4. Choose and record the star catalogue and the Milky Way image with licences and frame alignment.
5. Write the decision record; stop with REPLAN REQUIRED if CAMS cannot be redistributed.

## Boundaries

Research only: no code, no committed data. No invented values: every figure is from a cited source or a recorded computation.

## Technical Verification

A Quick Task Check reviews the record's sources and computations (`agent-skills/references/check-method.md`). The checker re-fetches at least one licence and one count independently.

## Technical Evidence

Executed 2026-10-13 (builder). Decision record: `docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md` (all sources, quotes, commands and outputs are there).

**Per-criterion outcome**
1. CAMS release and terms: met as evidence, answer is **unclear (terms silent)**. Release v3.0, `CAMS-v3-2010to2016.xlsx`, SHA-256 ec886496...a85845, accessed 2026-10-13. Only text is a citation request (Jenniskens et al. 2018). Contact recorded: P. Jenniskens, petrus.m.jenniskens@nasa.gov. REPLAN REQUIRED recorded above; no fallback chosen.
2. CAMS content: met. Counts IAU 7 = 24,928 and IAU 4 = 14,905 (of 471,582). e >= 1: 6,229 and 32. Workbook uses the 1904 date system. Three real Perseid records propagated through `createOrbTwoBodyAdapter()` to 2027-08-13 (table in the record). Subset size: 457 KB and 318 KB gzip.
3. Reference values: partly met. SBDB elements and a three-date Horizons comparison done (0.0082, 0.031, 0.067 AU). IAU MDC and IMO published peak and radiant could not be read; CAMS-computed values recorded instead and marked unverified.
4. Star catalogue: not met as a single choice. Yale BSC5, Hipparcos (CC BY-NC 3.0 IGO) and HYG (CC BY-SA 4.0) all carry unresolved or restrictive terms. Owner chooses. Subset size not measured.
5. Milky Way: met. ESO/S. Brunier eso0932a, CC BY 4.0, equirectangular galactic frame checked on the image. Precise galactic pole constants unverified (Wikipedia approximate values cited).
6. Diff scope: `git diff --stat` / `git status --short` shows only this Task file and the new decision record (checked below).

**Commands run** (scratch dir `/tmp/claude-1000/-home-user-code-Astraeus/9f41da67-d196-4cdd-b989-572f65eae286/scratchpad/t051/`): curl downloads of cams.seti.org pages, readme PDF and workbook (with a browser User-Agent; bare curl gets HTTP 410); `python3 -I scripts/pdftxt.py`, `scripts/scan.py` (80 s over 471,582 rows); Horizons API via curl at 3 dates; `node /home/user/code/Astraeus/node_modules/vitest/vitest.mjs run --root <scratch>/prop --config <scratch>/prop/vitest.config.mjs --disable-console-intercept` (`prop.test.ts`, `swift.test.ts`, both passed). No repository gate (build, test) was run: no source, test or data file changed, so none applies.

**Files read (planned):** Task file, `docs/ASTRAEUS_SPIKE_04_PERSEIDS_REFERENCE.md`, `data/showers/perseids.json` (head), `src/core/twoBodyAdapter.ts`, `src/core/orbitGroup.ts` (head), `docs/DONOR_PROVENANCE.md` (grep only).
**Extra reads (logged):** `src/core/astronomyAdapter.ts` and `src/core/bodies/planetTrajectory.ts` (to take Earth's heliocentric position for the worked example); `.savepoint/config.yml` (gate commands); `src/core/bodies/sun.ts` (Sun GM). `docs/ASTRONOMY_VALIDATION.md` and `src/core/pointGroup.ts` were not needed.
**Files changed:** `docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md` (new), this Task file. Nothing committed.

**Done When 7 (added by the owner's 2026-10-13 decision; executed 2026-10-13T09:15:19Z).** All in `docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md`:
- (a) Local-data approach and exact upstream URLs: Section 5 (CAMS `https://cams.seti.org/CAMS-v3-2010to2016.xlsx`, Yale `https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz`, ESO `https://cdn.eso.org/images/large/eso0932a.jpg`). Nothing from CAMS or Yale committed; no fallback.
- (b) Permission email draft to Dr. Jenniskens: Section 5, for the owner to send. Not sent.
- (c) Published peak and radiant from the IAU MDC established-showers file (`.../MDC2022/Etc/streamestablisheddata2026.txt`, fetched 2026-10-13T09:14Z, citing Jenniskens 2023): Perseids LoS 140.1, RA 47.9, Dec +57.9, Vg 58.8; Geminids LoS 261.6, RA 113.0, Dec +32.4, Vg 33.8. IMO calendar unreachable (tried, recorded).
- (d) Pole constants from Astropy `galactic.py` (fetched 2026-10-13T09:14Z): RA 192.8594812065348, Dec +27.12825118085622, l_NCP 122.9319185680026. Checked against the Yale catalogue's own GLON/GLAT for 9,096 stars (max 0.088 deg) and gives Galactic Centre RA 266.405, Dec -28.936.
- (e) Yale BSC fetched to a new scratch directory (`bsc2/`), read with `python3 -I`: 9,110 records, 9,096 stars with position and V, 8,404 with V <= 6.5 (8,160 with B-V); columns recorded.
Commands: curl of the MDC file, Astropy source, CDS catalogue; inline `python3 -I` parsers (counts and pole check). Extra reads: none beyond the earlier logged ones. Files changed: the decision record and this Task file only. Still unverified: IMO calendar values; ESO image alignment to better than a degree; meteorshowers.org's actual data file; CAMS permission (owner to ask).

**Limitations:** CAMS owner not contacted. MDC and IMO values, galactic pole constants and BSC/HYG subset sizes unverified. The cams.seti.org readme PDF was read with a small text extractor, not a PDF viewer.


## Drift Notes

Record architecture deltas here; T-040 reconciles them.

- A common-timestamp snapshot of a measured stream scatters members 22 to 32 AU from the Sun; orbit geometry, not the snapshot, carries the encounter.
- `TwoBodyAdapter.elementsToState` needs true anomaly; CAMS gives none, so the build needs a generic place-at-Earth-distance-on-node helper.
- The CAMS workbook uses the 1904 date system; ingest must honour it.
- 2026-10-13T09:18:02Z — Task Check C-027 CLEAR. `status: done` set by the O-011 orchestrator under the owner's delegation in chat on 2026-10-13 ("You may mark a task Done after a satisfactory check, except tasks that need my look"), actor {role: owner-delegate, session: o011-orchestrator-check-20261013}.
