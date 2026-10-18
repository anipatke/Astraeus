---
id: C-076
scope: {kind: task, id: T-096}
result: CLEAR
checked_by: {role: checker, session: o020-orchestrator-20261018}
executed_session: t096-builder-20261018
checked_at: '2026-10-18T06:40:00Z'
reviewed:
  base_commit: 0c6b1c0
  head_commit: cfc78e7
  files:
    - src/core/chebyshev.ts, chebyshevSeries.ts, chebyshevEphemeris.ts, timeScale.ts (new)
    - tools/import/horizons-moons.mjs, horizons-client.mjs, horizons-moons-policy.mjs, horizons-moons-measure.mjs, chebyshevFit.ts, horizons-moons-fit.json (new); test-io.mjs, test-io.d.mts
    - data/ephemerides/README.md, data/ephemerides/jupiter-moons/ (index.json and 2,320 yearly chunks)
    - tests/chebyshevFit.test.ts, chebyshevEphemeris.test.ts, jupiterMoonsEphemeris.test.ts, fixtures/jupiter-moons-horizons.json
    - .gitignore (raw Horizons cache)
  dependencies: []
issues: []
supersedes: null
---

# C-076: T-096 Task Check (Quick)

## Scope Lock

1. T-096 Done When 1-8 (owner validation not required). Research-and-build: the measured report is in the Task evidence and `docs/evidence/o025-t096-20261018T043531Z/`.
2. Lane o025-t096 at cfc78e7 merged into o018-o019 without conflict. No UI change; the public build does not bundle the chunks yet (0 `.bin` files in a public build of the merged head).

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW2 importer | Reproducible, rate-limited, cached (git-ignored, about 500 MB), resumable; moon list from Horizons' own major-body list (115 moons: 72 numbered, 43 provisional; fetched 2026-10-18T04:30:41Z); Horizons ephemeris names and the US-Government-work licence recorded; 63 "recently discovered" notes carried into provenance. | `tools/import/`, `index.json` |
| DW3 core data | Compact binary, one file per body per year (20-byte header, 1 cm quanta as zig-zag varints; 1 mm for Jupiter), with an index; bodies stored about the Jupiter system barycentre, ICRF/EQJ, km, TDB. Span narrowed to 2010-2030 for size (20 years 22.3 MB; 1950-2050 about 111 MB, beyond the whole-build limit); extension is an importer rerun. | data, README |
| DW4 provider | Jupiter-centred EQJ km and km/s for a UTC millisecond; named errors outside the span; deterministic. UTC to TDB from a TT-UTC table plus the SOFA dtdb series, within 5.6 microseconds of Horizons. | `src/core/chebyshevEphemeris.ts`, `timeScale.ts`, tests |
| DW5 accuracy | Against Horizons at about 10,000 independent dates per body: Galileans worst 0.037 m, inner moons 0.038 m, outer moons 0.99 m, Jupiter 0.004 m; end to end through the provider at 1,001 UTC dates worst 0.97 m; segments aligned to JPL's own Chebyshev record grid. | Task evidence table |
| DW6 size | 22.27 MB raw for 20 years, about 40 times smaller than raw tables at the needed step; the demo window (from 2016-11-04, a year) needs 2.22 MB; only needed chunks are fetched (`chunksFor`, `loadEphemerisWindow`). | report |
| DW7 speed | All 115 moons per frame: 0.014 ms Node, 0.078 ms mean at 6x CPU throttle in Chromium; one-time decode of the demo window 110 ms (673 ms at 6x). | report |
| DW8 tests, gates | 38 new tests (fitting round trip, span edges, segment continuity, errors, Horizons fixture). Checker on the merged head: `npx tsc --noEmit` 0, `npx vitest run` 1060 passed 1 skipped, `npm run build` 0, public build 0. | summaries |

## Issues Pass

DW1-DW8 Proven, with the span narrowed to 2010-2030 for size as the Task allows ("record the final span and why"); reported to the owner. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. Load budget: T-098 and T-100 must ship only the chunks experiences use and decode on demand or in a worker (Drift Note 2).
2. The four inner moons take 13.2 MB at a 1 m target; a looser target for them and the outer moons (still far below a pixel at any view) would shrink the set substantially if the span is extended.
3. Design.md gains the curve-fit provider, the core UTC-to-TDB table and `data/ephemerides/` at the O-025 integration (Drift Note 1). `StateResolver` composition carries position only (Drift Note 3).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
