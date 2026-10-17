---
id: C-059
scope: {kind: task, id: T-078}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: t078-builder-lane-20261017
checked_at: '2026-10-17T23:35:00Z'
reviewed:
  base_commit: 2b4e9bc
  head_commit: 9751289
  files:
    - data/orbits/ (14 records)
    - docs/MOON_ORBITS.md
    - src/core/satelliteMeanElements.ts (new), src/core/twoBodyAdapter.ts (one parameter type widened)
    - tests/moonOrbits.test.ts, tests/fixtures/moon-orbits-horizons.json
  dependencies: []
issues: []
supersedes: null
---

# C-059: T-078 Task Check (Quick)

## Scope Lock

T-078 Done When 1–7: sources for 13 moons and Pluto saved as data with citations; each propagated through the existing two-body path and measured against JPL Horizons on at least six dates plus one orbit; IAU rotation models recorded; report; offline test; gates. Built in lane `o019-t078` (9751289), checked after merging into `o018-o019` (1bbb77c).

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1–2 sources | 14 JSON records under `data/orbits/`, each with source URL, epoch, plane and access date; raw responses kept under `docs/evidence/o019-t078-*`. | files |
| DW3 accuracy | Report table read: Charon within one diameter (36 km); Io, Europa, Ganymede, Callisto, Triton (at the edge) and Pluto approximate demonstrations; all seven Saturn moons "not usable as published" (phase wrong at the epoch, period and plane right), stated as a finding with figures, no new propagator written. The builder added a third class; recorded as such. | `docs/MOON_ORBITS.md` |
| DW4 rotation | IAU WGCCRE 2015 (NAIF pck00011) pole and prime meridian for all 14, asserted equal to the saved kernel by test. | report, test |
| DW5–6 report, offline test | `tests/moonOrbits.test.ts` (10 tests) re-propagates from saved data against the saved Horizons fixture; passes in the checker's suite. | `docs/evidence/c058-20261017T042418Z/test.txt` |
| DW7 gates | Checker on the merged tree: tsc 0, 937 passed, build 0 (shared with C-058). The `twoBodyAdapter.ts` widening leaves Io and every existing test unchanged. | `docs/evidence/c058-20261017T042418Z/` |

## Issues Pass

DW1–DW7 Proven. The Saturn result is a finding for O-019 planning, not a defect in this Task. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. Saturn's seven moons need another source before any is placed (suggested to the owner: Horizons-sampled tables over each demo window, as Apollo 11's path works).
2. Io's period rule changed to the IAU prime-meridian rate for synchronous moons; the shipped Io definition still uses the old rule (9,388 km vs 4,196 km on the same dates); a later O-019 Task should move Io to the new data.

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
