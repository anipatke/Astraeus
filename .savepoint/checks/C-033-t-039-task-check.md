---
id: C-033
scope: {kind: task, id: T-039}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261013}
executed_session: t039-builder-2026-10-16
checked_at: '2026-10-16T06:45:00Z'
reviewed:
  base_commit: 1734bd8
  head_commit: 1734bd8 (working tree, uncommitted)
  files:
    - data/showers/geminids.json
    - data/showers/perseids.json
    - tests/helpers/streamFacts.ts
    - tests/solarLongitudeConvention.test.ts
    - tests/fixtures/earth-ecliptic-j2000-horizons.json
    - tools/validate/browser-showers.mjs
    - docs/ASTRONOMY_VALIDATION.md
  dependencies: [T-038, T-055]
issues: [I-027]
supersedes: null
---

# C-033: T-039 Task Check (Quick), with I-027 verification

Checker: the O-011 orchestrator session. The Sonnet builder for T-039 and the separate Sonnet repair session for I-027 are both independent of the checker.

## Scope Lock

1. Done When 1–6 of T-039 (the owner look is not required), plus I-027's Proof Needed 1–4.
2. T-039's own change since 1734bd8 is `data/showers/geminids.json` only (2 insertions, 2 deletions). The other files are I-027's repair.
3. History: attempt 1 was a FINDING (Phaethon not catalogued). The owner decided "Let settings define a body (Recommended)", and T-055 (C-032) added that. Attempt 2 passed but read the MDC solar longitude in the equinox of date. The checker found the convention error and raised I-027. Attempt 2b is checked here.

## Acceptance Coverage

| DW | Result | Independent evidence |
|----|--------|----------------------|
| 1 Facts, sources, local CAMS subset | Proven | The checker fetched the IAU MDC `streamestablisheddata2026.txt` live. Its GEM line, IAU 4 parameter set 008 (2023-10-01), reads solar longitude 261.6, RA 113.0, Dec +32.4, Vg 33.8, matching the settings. Its header reads "All records on J2000". Phaethon's SBDB elements match `parentElements` exactly (C-032). The checker recounted `data/local/cams-iau-4.json` in Python: 14,873 bound members, 12,439 reliable (Q ≥ 15°, σVg ≤ 10%), median Vg 33.77 km/s (MDC 33.8). The busiest 0.5° solar-longitude bin is 262.0 (that is, 261.75–262.25), next to the published 261.6. The window and ZHR 150 are labelled AMS. `git ls-files data/local` = 0. |
| 2 Diff is the settings file only | Proven | Against 1734bd8, the only T-039 change outside `.savepoint/` and `docs/evidence/` is `data/showers/geminids.json`. Its `parentElements` shape came in through T-055, and the T-039 FINDING record explains why. |
| 3 Browser run | Proven | Strict `browser-showers.mjs`, without soft-peak mode, in `docs/evidence/o011-t039-20261016T062113Z/`: Geminids exit 0 with a crossing difference of −0.007° and Perseids exit 0 with −0.006°, at desktop and phone with zero console errors. The checker viewed the Geminid overview and whole-orbit screenshots (C-032): the stream crosses Earth's path, and Phaethon and the planets are labelled. |
| 4 Existing tests unchanged | Proven | T-039 changed no test. The checker ran vitest at 06:40Z: 42 files, 786 passed, 1 skipped. |
| 5 Result recorded | Proven | The Technical Evidence records attempt 1's FINDING, the owner decision, attempt 2's PASS and the corrected 2b. **Configuration only: PASS after T-055.** |
| 6 Gates | Proven | Typecheck and build are clean (builder at 2b). Vitest as above (checker). |

## I-027 verification

- **Proof 1 (convention).** `streamFacts.solarLongitudeDeg` now returns the geometric J2000 longitude. `browser-showers.mjs` subtracts IAU 2006 general precession from the of-date almanac formula. `tests/solarLongitudeConvention.test.ts` pins this against an archived live Horizons fetch. The checker's own Meeus chapter 25 figures agree: 2027-08-13T00:00Z gives 139.674° J2000 (Horizons 139.6726°), and 2026-12-14T00:00Z gives 261.620°.
- **Proof 2 (tolerance).** It stays 0.3°, now in J2000.
- **Proof 3 (instants).** Perseids `peakUtc` is 2027-08-13T10:41:18Z, 140.100° J2000. Geminids `peakUtc` is 2026-12-13T23:31:44Z; the checker's own figure is 261.600° J2000. ASTRONOMY_VALIDATION restates the stream geometry: the minimum-distance fit is 2027-08-13T14:37Z, 0.16 d from the peak, with the radiant 0.29° off.
- **Proof 4 (runs).** `docs/evidence/o011-i027-20261016T061219Z/` has Perseids exit 0. The Geminids peak failure there was expected before 2b. Both pass in the T-039 2b run above.

I-027 is verified by this Check.

## Issues

- I-027: verified and resolved here.

## Observations (non-blocking)

1. The repair builder's report named the evidence directory `…T062009Z`. The directory and the Issue history both read `…T061219Z`, and the checker used that.
2. `docs/evidence/o011-t039-20261016T053602Z/` is attempt 2's run under the wrong convention. It stays as history.
3. `tests/showersMeasured.test.ts` hard-codes Perseid figures, so the radiant and distance helpers cannot run on the Geminids without a test edit. The browser script's radiant and peak checks did run on them. This goes to T-040 and O-012: make that test discover showers the way the browser script now does.
4. The all-shower browser run takes over 9 minutes for two showers; per-shower runs are the workaround. This is an O-012 note.
5. The wall-clock fill test flaked in the builder's runs (C-030 observation 3) and passed in the checker's run.
