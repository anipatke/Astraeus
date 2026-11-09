---
id: C-159
scope: {kind: objective, id: O-063}
result: NEEDS WORK
checked_by: {role: checker, session: o063-check-20261110}
executed_session: o063-run-20261110
checked_at: '2026-11-09T23:43:52Z'
health_snapshot: sha256:027cc073cd9b51d530fa66ab9d15f298a894c14ea46e461156876684cef8dd0d
reviewed:
  base_commit: fc1909ff
  head_commit: '70840174'
  files: [packages/astraeus/tools/import/planet-fits.mjs, packages/astraeus/tools/import/planet-accuracy-fetch.mjs, packages/astraeus/data/ephemerides/planets/planets.json, packages/astraeus/src/core/bodies/planetTrajectory.ts, packages/astraeus/src/core/bodies/index.ts, packages/astraeus/src/core/bodies/planetMoons.ts, packages/astraeus/src/core/bodies/planetRecords.ts, packages/astraeus/src/core/bodies/mercury.ts, packages/astraeus/src/core/bodies/venus.ts, packages/astraeus/src/core/bodies/mars.ts, packages/astraeus/src/core/bodies/jupiter.ts, packages/astraeus/src/core/bodies/outerPlanets.ts, packages/astraeus/src/core/planetModels.ts, packages/astraeus/src/core/planetSeries.ts, packages/astraeus/src/core/astronomyAdapter.ts, packages/astraeus/tests/planetAccuracyFlybys.test.ts, packages/astraeus/tests/fixtures/planet-accuracy-o063-horizons.json, packages/astraeus/tests/planetFits.test.ts, packages/astraeus/tests/outerPlanetFits.test.ts, packages/astraeus/tests/fixtures/scenePin.json, packages/astraeus-demo-showers/tests/rebuildComparison.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, docs/architecture/planet-accuracy-o063.md, .savepoint/Design.md]
  dependencies: []
issues: [I-161]
unmet: [AGENTS Deferred Design reconciliation]
supersedes: null
---

# C-159: O-063 Full Objective Check

**Verdict: NEEDS WORK, on paperwork only.** The behaviour is proven against an independent oracle: with its moon package loaded each planet sits within 0.5 km of a fresh JPL Horizons planet centre (17 new requests made by this checker, not the builder's fixture), the Voyager flyby errors fell from 629 to 13,338 km to 0.11 to 0.31 km, the barycentre-only figures match the stated wobble, and the pre-1972 difference is shown by measurement to be the time label. All nine gates pass, the browser check passes, Code Health does not block. One Issue holds the verdict: Design.md was not reconciled for T-290's drift note (I-161). No code change is needed to repair it, so the gate and browser runs below stay reusable for a re-check.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here; nothing to evaluate)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria.** O-063 Outcome (planet positions near flybys match Horizons within a measured tolerance stated in provenance) and Owner Decisions (replace with Horizons; DATA-01 approval; match Horizons' planet centre for Uranus/Neptune); T-289 Done When; T-290 Done When; I-154 Proof Needed; Guardrails ARCH-05, PROV-01, DATA-01, API-07, TEST-01, TEST-02; the AGENTS.md "Deferred Design reconciliation" rule; gates per `docs/agents/build.md` and the browser policy.
2. **Changed files and entry points.** `git diff fc1909ff..70840174` files in `reviewed.files`. Entry points: the catalogue planet bindings (`BUILT_IN_BINDINGS`, what `Scene.stateOf`, the resolver and the viewer use), `AstronomyAdapter.planetPositionFromSunKm`, `planetSeriesSpan`, planet `accuracy.position` provenance, the importer `planet-fits.mjs`.
3. **Relied-on orchestration.** Moon systems' `isLoaded`/`ephemeris().centreOffsetKm` (unchanged); Orb ecliptic-to-EQJ transform; the planet time-scale table (unchanged, byte-identical).
4. **Matrix axes.** Planet (Mercury to Pluto) x date class (Voyager flyby, inside package years, outside package years, pre-1972 UT1 era, 1962-1972 UTC era, package edge, series edge) x moon package (loaded, not loaded, failing) x representation (barycentre series, placed planet, provenance text, README, CHANGELOG). Input shape, text classes, output sinks: not applicable (no parser or text width in scope; dates are validated by existing `assertUtcUnixMs`).
5. **Admission boundary.** Supported engine use (catalogue binding, adapter, public scene paths through the gates and browser check); Issues only against the criteria above.

## Coverage Matrix And Outcome Coverage

Independent oracle: 20 fresh Horizons requests by this checker (`VEC_CORR=NONE`, `REF_PLANE=FRAME` i.e. ICRF equator directly, no obliquity turn, `CENTER=500@10`, `TIME_TYPE=UT`, `VEC_DELTA_T=YES`), compared in a temporary harness `packages/astraeus/tests/zzO063CheckProbe.test.ts` (written, run, deleted; copy at the session scratchpad) that loads every moon package's committed years as the Task test does.

| Row | Case | Expected | Actual | Class |
|---|---|---|---|---|
| Flyby | Neptune 1989-08-25 03:55:40 (V2), placed | about 1 km | 0.270 km (barycentre 74.2) | Proven |
| Flyby | Uranus 1986-01-24 17:58:51 (V2), placed | about 1 km | 0.199 km (barycentre 28.4) | Proven |
| In package | Jupiter 2001-12-30, Saturn 1990-02-14, Uranus 2025-03-03, Neptune 2003-10-11 | within 0.5-0.6 km | 0.104, 0.192, 0.168, 0.493 km | Proven |
| In package | Pluto 2020-05-05 | within 1.5 km | 0.411 km (barycentre 2,132) | Proven |
| No moons | Mercury 2033-09-09; Mars 1977-07-07, 2015-07-02, 2016-12-31, 2025-11-11 | within 0.6 km | 0.264; 0.164, 0.210, 0.384, 0.227 km | Proven |
| Out of package | Jupiter 2037, Saturn 2038, Uranus 2040, Neptune 2041 | at barycentre, within stated wobble (216/304/45/74 km) | 190.0, 287.1, 5.4, 74.2 km; placed equals barycentre | Proven |
| Pre-1972 | Mercury 1955 (UT1), 1966 (UTC); Venus 1958 | difference explained by time label | 27.0, 2.0, 6.8 km; after evaluating at the label shifted by (engine TT-UTC minus Horizons TDB-UT) 0.248, 0.436, 0.269 km | Proven |
| Pre-1972 | fixture yearly rows 1950-1971, all seven planets | same | worst 34.5 (Mercury 1956) ... 3.5 km (Neptune); max label difference 0.698 s; after the shift every planet within 0.55 km | Proven (attribution shown by measurement) |
| Package edge | Jupiter/Saturn/Uranus/Neptune after the HISTORICAL span | barycentre once chunks end | placed equals barycentre from 2030-01-01T00:58Z; no jump inside the span | Proven |
| Unloaded/failing package | `planetBinding` with `isLoaded()` false, with `ephemeris()` throwing, with no system; Mercury | barycentre | exactly the barycentre in all cases | Proven |
| Series span | 1950-01-01 answers, 1949-12-31 and 2050 refuse; `planetSeriesSpan` | unchanged | 1950-01-01 to 2045-01-01; time-scale table byte-identical to base | Proven |
| Importer one rule | `planet-fits.mjs` | no VSOP87A, one table | `SOURCES` table only; Orb VSOP87A imports gone; Pluto's `data` string byte-identical to base | Proven |
| Binding rule | mutation M1 (Uranus binding without its moon system) | tests fail | 2 fail | Proven |
| Binding rule | mutation M2 (offset subtracted, not added) | tests fail | 3 fail | Proven |
| Size | `planets.json` | measured, budget met | 432,063 to 348,839 B (git show); browser public build and engine budget pass | Proven |
| Earth | EPV00 measured, not changed | reported | test pins 7.3 km; README states it | Proven |
| Goldens | `scenePin.json` | moves explained | 338 leaf changes, all under the made-up journey, Sun, Jupiter, groups and camera entries of the planet-fed scenes (positions, derived spans, Uranus-like orbit elements, provenance text); no other entry moved | Proven |
| Goldens | `rebuildComparison.test.ts` | capture untouched, tolerances unchanged | fixture untouched; `toBeCloseTo(...,0)` and `settle` unchanged; only `sun-to-<planet>`/`<planet>-range` distance rows, `<planet>-orbit` lines and planet provenance read today's planet; every other row, line and provenance still compares with the capture (non-planet provenance takes the old exact-equality branch) | Proven |
| Tightened limits | `outerPlanetFits.test.ts` | to measured wobble | 310/40/80 km and 0.05/0.01/0.01 arcsec (was 3,000/21,000/40,000) | Proven |
| Provenance | every planet record: source DE441 + satellite file, retrieval date, measured figures, limits | not overstated (PROV-01) | each figure matched or bounded by the independent probes; pre-1972 limit stated with measured values; barycentre-only wobble stated per planet | Proven |
| No API change | exports, lock | unchanged | `api-surface.lock.json` not in the diff; check:pack, node and react consumer gates pass | Proven |
| I-154 Proof Needed | comparison at the Voyager flybys with a stated tolerance met | met | as above | Proven |
| Design reconciliation | T-290 drift note in Design.md | reflected | Design.md unchanged | **Issue I-161** |

Note on one probe: a fresh Mars request at exactly 2015-07-01T00:00:00Z (the instant after the 2015 leap second) came back with Horizons' pre-leap TDB-UT (67.184 s, engine 68.184 s), giving 23 km. Requests one day later and elsewhere agree within 0.4 km; this is the boundary reading of a JD at a leap second, not an engine fault.

Finite external-boundary matrix: Horizons is used only by the importer and the fetch tool (offline at run time; replies cached under the git-ignored `.horizons-cache`); the engine makes no network call. The browser runner ran once, passed, kept its evidence folder. Redirect, timeout, secret cells: not applicable (no runtime network code in scope).

Workflow lock: the importer workflow (fetch body about the Sun, fetch body about its barycentre, subtract per instant, rotate to ecliptic, fit, write) was read; failure before write throws (`--from` guard, Horizons client errors) and nothing partial is written. Regeneration was not rerun by this checker (network and about 2 minutes); Pluto's unchanged bytes and the independent oracle above stand in for it.

## Commands And Results

- `npm run check:gates` (2026-11-09T23:35Z to 23:38Z): lint 3.5 s, typecheck 5.8 s, build 2.3 s, test 40.5 s, test:full 72.1 s, check:engine-alone 23.7 s, check:pack 17.4 s, check:node-consumer 4.7 s, check:react-consumer 4.4 s; all passed, total 174 s, 0 over limit.
- `npm run check:browser` (run once, 23:39:11Z): all ten steps exit 0, error-lines 0, total 227 s (limit 320 s); evidence `docs/evidence/browser-20261109T233911Z/`.
- `savepoint health check O-063`: snapshot `sha256:027cc073cd9b51d530fa66ab9d15f298a894c14ea46e461156876684cef8dd0d` (created), "Code Health does not block clearance"; complexity, duplication, vulnerabilities no finding; coverage and tests "stale" (optional, non-blocking): this checker's probe and mutation runs touched source files after `test:full`, so the reports are older than the files; the contents are restored and `git status` shows no source change.
- `git diff --check fc1909ff..70840174`: clean. `savepoint resume`: loads.
- Probe harness: 5 tests passed (output above). Mutations M1, M2 each restored with `git checkout`, tree verified clean.

## Issues

- **I-161**: Design.md not reconciled for the T-290 drift note (AGENTS "Deferred Design reconciliation"). `git diff fc1909ff..HEAD -- .savepoint/Design.md` is empty; Design names neither the planet series source nor `planetBinding`.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-161 | High: the gap is certain | Low: nothing in Design is wrong, it is silent; code, provenance, README and CHANGELOG are right | Low | Fix now: one Design.md paragraph; no gate rerun needed |

## Observations (non-blocking)

1. Retrieval dates use two conventions. The fixture says `retrieved: 2026-11-09` (UTC date from `toISOString`), not 2026-11-10 as T-290's evidence says; the planet provenance says `PLANET_SERIES_RETRIEVED = "2026-11-10"` (the local AEDT date: the Horizons cache files were written 2026-11-10 10:25 AEDT, 2026-11-09 23:25 UTC). Same retrieval, one day apart by time zone; DE441 is fixed, so no value is affected. A planner may make both UTC.
2. `docs/ASTRONOMY_VALIDATION.md` still says the planet models are "piecewise Chebyshev fits of this same full VSOP87A series" and that its six-date maxima "are recorded in each definition's `accuracy.position`"; both are now false. `astronomyAdapter.ts` error strings still say "Orb VSOP87A". Worth folding into the I-161 repair.
3. The committed tests bound the pre-1972 difference (< 40 km) but do not themselves show it is the time label; this Check shows it (residual under 0.55 km after the shift). A test that shifts by the measured label difference would pin the stated limitation.
4. `tests/planets.test.ts` keeps its VSOP87A-era limits (Jupiter 1,500 km; inner planets 40 to 120 km) while the series is now within 1 km; `outerPlanetFits.test.ts` was tightened, this one was not.
5. The README table gives "(1950 to 2029)" for the Jupiter/Saturn/Uranus/Neptune "within 0.5/0.6 km" row; that is the package's years, while the sub-kilometre figure holds from 1972 (before that up to 8.5 km, which the next README sentence states). Provenance strings say 1972 to 2029 correctly. `PLANET_VALIDATED_UTC` (1969-07-21 to 2030-06-01) still sets the planets' `validUtc`, narrower than the measured range.
6. T-289's note says the time-scale difference is "0.003 s or less from 1962"; a fresh 1966 request shows 0.035 s (2 km at Mercury). Inside the provenance's stated "up to 0.7 s".
7. In `rebuildComparison.test.ts`, the planet distance rows, planet lines and planet provenance now compare the engine with its own planet series, so for those rows the test proves consistency rather than fidelity to the capture; that is the coordinator's recorded choice, with tolerances unchanged and every non-planet row still against the capture.
8. At the end of a moon package's chunks (2030-01-01T00:58Z for the 1950 sets) a planet steps from its centre to its barycentre by its wobble (up to about 300 km, Saturn); documented in each record's limitation.
9. T-289's owner validation is recorded in prose (`## Owner Validation`), not as the structured `owner_validation.accepted_by` shape; with the step check waived there is no Check to name in `accepted_check`.

## Owner Validation Still Needed

- None for I-161 (a planner repair, then a re-check).
- T-289's owner choice is recorded; T-290 declares no owner validation. Both Tasks carry recorded check waivers.

## Prior Owner Decisions

First Check on O-063: no prior Check-linked acceptance or exception to carry forward. The Objective's Owner Decisions (Horizons replacement with DATA-01 approval; follow Horizons' planet centre for Uranus and Neptune) are honoured by the code and stated in provenance (Uranus/Neptune records name the satellite ephemeris and the gap to DE441 bodies 7 and 8).

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
- [ ] STYLE-10 **Small diffs** — the one change re-records 338 leaves of `scenePin.json`; explained in T-290, but large to review.
