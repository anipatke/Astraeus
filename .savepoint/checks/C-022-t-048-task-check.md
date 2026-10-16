---
id: C-022
scope: {kind: task, id: T-048}
result: CLEAR
checked_by: {role: checker, session: o014-orchestrator-check-20261012}
executed_session: o014-t048-sonnet-executor-20261012
checked_at: '2026-10-12T10:00:00Z'
reviewed:
  base_commit: 4702e20
  head_commit: 4702e20
  files:
    - src/core/astronomyAdapter.ts
    - src/core/iauRotation.ts
    - src/core/bodies/mercury.ts
    - src/core/bodies/venus.ts
    - src/core/bodies/mars.ts
    - src/core/bodies/jupiter.ts
    - src/core/bodies/planetRecords.ts
    - src/core/bodies/planetTrajectory.ts
    - src/core/bodies/index.ts
    - src/assets/bodies/mercury.ts
    - src/assets/bodies/venus.ts
    - src/assets/bodies/mars.ts
    - src/assets/bodies/jupiter.ts
    - src/assets/catalogue.ts
    - src/assets/textures/mercury-2k.jpg
    - src/assets/textures/venus-2k.jpg
    - src/assets/textures/mars-2k.jpg
    - src/types/orb.d.ts
    - tests/planets.test.ts
    - tests/iauRotation.test.ts
    - tests/planetFixtures.ts
    - tests/fixtures/planets-horizons-source.txt
    - tests/fixtures/planets-horizons.json
    - tests/fixtures/planets-rotation-horizons-source.txt
    - tests/fixtures/iau-pck-excerpt.txt
    - docs/ASTRONOMY_VALIDATION.md
    - docs/DONOR_PROVENANCE.md
  dependencies: []
issues: []
supersedes: null
---

# C-022: T-048 Task Check (Quick)

Independence: orchestrator checker session; T-048 was built by a separate Sonnet executor sub-session.

## Scope Lock

1. Done When 1–5 of T-048; ARCH-03, ARCH-04, ARCH-05, PROV-01, PROV-02, TEST-01, TEST-03, the name check, STYLE.
2. Changed files in `reviewed.files` (working tree over 4702e20).
3. Out of scope: mounting planets (T-049), lazy loading or bundle splitting (not in the Task).

## Outcome Coverage

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `planetPositionFromSunKm` EQJ km about the Sun; raw Horizons responses archived (199/299/499/599, 500@10, geometric vectors, six dates 1969–2030); maxima recorded in docs and `accuracy.position`; `validUtc` set | Proven | `tests/fixtures/planets-horizons-source.txt` carries genuine Horizons API headers (API VERSION 1.2, DE441, query parameters, EOP file); recorded maxima Mercury 30.4 km, Venus 50.1 km, Mars 95.8 km, Jupiter 1269 km. **Independent oracle:** checker queried Horizons directly for Jupiter at 2020-01-01T00:00Z (not one of the six fixture dates): app vs Horizons differ by 1159 km, consistent with the recorded maximum. Unknown planet id throws. |
| 2 | `iauRotation.ts` quaternion from pole and W; Mars and Jupiter against published sub-Earth longitude within a stated tolerance; citation and limitations in definitions | Proven, with the stated reading | Jupiter with shipped IAU 2015 constants: 0.0051° vs Horizons. Mars with IAU 2009 constants (the set Horizons uses): 0.0028°, which validates the code path, light time and time scale. Mars with shipped IAU 2015 constants differs from Horizons by 0.934°, explained by the 2009→2015 pole revision (≈1.5° pole move) and bounded in the test. Constants match `tests/fixtures/iau-pck-excerpt.txt` (NAIF `pck00011`/`pck00010` lines checked by the checker) |
| 3 | Radii, GM, parent Sun, `iau-rotation`; catalogue validates; layer rule passes | Proven | Jupiter 71492/66854 km eq/polar; Mercury mean only; `tests/planets.test.ts`; `tests/layerRule.test.ts` and `tests/nameCheck.test.ts` pass with no new allowlist entry |
| 4 | Mercury/Venus/Mars textures with `AssetLicence` (CC BY 4.0, attribution); Jupiter material colour with a provenance note; Jupiter drawn as a spheroid | Proven | Checker probe: the three textures carry `CC BY 4.0` licences; Jupiter has no texture; `drawnRadii` gives polar/equatorial in the definition's ratio; public build `ok: true`, 6 checked, no matches |
| 5 | Gates; every browser script in a fresh run directory | Proven | Checker: typecheck 0, build 0, 30 files / 555 tests passed, `git diff --check` clean. Executor run `docs/evidence/o014-t048-20261012T203410/`: all 14 result files `"errors": []`; no committed evidence changed |

## Issues

None. No materiality actions are required.

## Observations (non-blocking)

1. **Bundle size doubled.** Registering the full VSOP87A series raises the main bundle from 1,537.6 kB to 2,938.7 kB (458.8 → 1,022.5 kB gzip), for every experience, though nothing mounts planets until T-049. Not a Done When criterion. This is an owner decision: accept, or plan lazy loading of the series as follow-up.
2. The licence text is the donor README's statement; the Solar System Scope page itself was not opened. Its access date is the README read date.
3. Mercury and Venus rotation are checked only against the kernel text, not Horizons; maxima are sample maxima over six dates.
4. Mercury's fact-sheet mean radius (2439.7 km) differs from the Horizons header (2439.4 km); the fact sheet is used, as the Task says.

## Owner Validation Still Needed

None (`owner_validation.required: false`).

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
