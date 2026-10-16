---
id: I-027
title: Shower peak instants read the IAU MDC solar longitude in the wrong equinox
type: defect
status: resolved
source:
  kind: report
  actor: {role: checker, session: o011-orchestrator-check-20261013}
  at: '2026-10-16T06:20:00Z'
tasks: [T-038, T-039]
checks: [C-033]
history:
  - at: '2026-10-16T06:20:00Z'
    actor: {role: checker, session: o011-orchestrator-check-20261013}
    kind: observed
    note: 'Found while checking T-039 attempt 2. The IAU MDC file header reads "All records on J2000"; our peak instants and the browser crossing check use the equinox of date.'
  - at: '2026-10-16T06:20:12Z'
    actor: {role: executor, session: i027-repair-20261016}
    kind: repair_attempted
    note: 'Perseids repaired, Geminids left to T-039. tests/helpers/streamFacts.ts now returns the geometric J2000 solar longitude (no precession); tools/validate/browser-showers.mjs subtracts IAU 2006 general precession (5028.796195 arcsec/century) from the of-date almanac formula; the 0.3 deg tolerance now applies in J2000. New tests/solarLongitudeConvention.test.ts pins the convention against live JPL Horizons Earth-Sun J2000-ecliptic vectors (raw response tests/fixtures/earth-ecliptic-j2000-horizons.json): 139.673 deg at 2027-08-13T00:00Z, 261.620 at 2026-12-14T00:00Z, helper within 0.005 deg. data/showers/perseids.json activity.peakUtc 2027-08-13T00:00:00Z -> 2027-08-13T10:41:18Z (J2000 longitude 140.100 by bisection; method in activity.source.name; peakRate and fallOffPerDay unchanged about the new peak). geminids.json not touched.'
  - at: '2026-10-16T06:20:12Z'
    actor: {role: executor, session: i027-repair-20261016}
    kind: repair_attempted
    note: 'Evidence. typecheck clean; build ok; vitest 42 files, 786 passed, 1 skipped. ASTRONOMY_VALIDATION updated: stream-geometry fitted minimum 2027-08-13T14:37Z is 0.16 d from the corrected peak (fresh run; was 05:41Z vs 01:02Z); radiant 0.29 deg off. Strict browser-showers.mjs (no ASTRAEUS_SOFT_PEAK), vite on 5199 stopped afterwards, in docs/evidence/o011-i027-20261016T061219Z/: perseids exit 0, crossing 2027-08-13T10:41:18Z at J2000 140.094 deg vs 140.1; geminids exit 1 on the peak assertion only, current peak 2026-12-13T14:48:22Z is J2000 261.22 deg vs 261.6 (expected until T-039 sets 261.6 J2000, about 2026-12-13T23:31:44Z). Open for the checker; proof need 3 for geminids.json remains with T-039.'
  - at: '2026-10-16T06:45:00Z'
    actor: {role: checker, session: o011-orchestrator-check-20261013}
    kind: rechecked
    note: 'C-033 verified the J2000 convention (Horizons-pinned test; checker Meeus figures agree), Perseids peak 2027-08-13T10:41:18Z at 140.100 J2000, Geminids peak 2026-12-13T23:31:44Z at 261.600 J2000, and strict browser runs passing for both showers.'
    check: C-033
resolution:
  disposition: verified
  check: C-033
  actor: {role: checker, session: o011-orchestrator-check-20261013}
  at: '2026-10-16T06:45:00Z'
---

# I-027: Shower peak instants read the IAU MDC solar longitude in the wrong equinox

## Summary

The IAU MDC `streamestablisheddata2026.txt` header states "All records on J2000", so its peak solar longitudes (Perseids 140.1°, Geminids 261.6°) are J2000.0 values. CAMS solar longitudes (workbook column BF) are J2000 too. Two places read them as equinox of date, which is about 0.37° (about 9 h of Earth's motion) different in 2026–27:

- `tests/helpers/streamFacts.ts` adds general precession to Earth's J2000 longitude, so `docs/ASTRONOMY_VALIDATION.md` gives the Perseid peak as 2027-08-13T01:02Z.
- `tools/validate/browser-showers.mjs` checks the peak crossing with the Astronomical Almanac low-precision formula, which is of date.

The Geminids' T-039 attempt 2 then set `peakUtc` to 2026-12-13T14:48:22Z to meet the of-date check.

Checker figures (Meeus ch. 25 of date, minus 1.397°·T for J2000):

| Instant | Of date | J2000 | Published J2000 |
|---|---|---|---|
| Perseids `peakUtc` 2027-08-13T00:00Z | 140.06° | 139.67° | 140.1° |
| Geminids 2026-12-13T14:48:22Z | 261.61° | 261.23° | 261.6° |
| Geminids 2026-12-14T00:00Z | 262.00° | 261.62° | 261.6° |

## Evidence

- MDC header line ":  All records on J2000, velocities are VG" (fetched 2026-10-16 by the checker).
- `tests/helpers/streamFacts.ts:94-98`; `docs/ASTRONOMY_VALIDATION.md:218`; `tools/validate/browser-showers.mjs:493-500`.

## Proof Needed

1. The crossing check and the fact helpers compare J2000 to J2000. Either convert the low-precision of-date longitude to J2000 by subtracting cited general precession, or compute the J2000 longitude directly. Name the convention in code comments and in ASTRONOMY_VALIDATION.
2. Fix the 0.3° tolerance so it applies in J2000.
3. Correct the peak instants for 140.1° and 261.6° J2000 in both settings files, with the method recorded, and restate the stream-geometry comparison (peak vs minimum-distance day) in ASTRONOMY_VALIDATION.
4. Run the strict browser-showers.mjs over both showers, plus the gates, into a fresh evidence directory.
