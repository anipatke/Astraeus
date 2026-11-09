---
id: C-160
scope: {kind: objective, id: O-063}
result: CLEAR
checked_by: {role: checker, session: o063-recheck-20261110}
executed_session: o063-run-20261110
checked_at: '2026-11-09T23:46:48Z'
health_snapshot: sha256:027cc073cd9b51d530fa66ab9d15f298a894c14ea46e461156876684cef8dd0d
reviewed:
  base_commit: '70840174'
  head_commit: 957cbbc6
  files: [.savepoint/Design.md, docs/ASTRONOMY_VALIDATION.md, .savepoint/issues/I-161-design-not-reconciled-for-the-o-063-planet-series-drift-note.md, packages/astraeus/src/core/bodies/planetTrajectory.ts, packages/astraeus/src/core/bodies/index.ts, packages/astraeus/src/core/bodies/planetRecords.ts, packages/astraeus/src/core/bodies/mercury.ts, packages/astraeus/src/core/bodies/venus.ts, packages/astraeus/src/core/bodies/mars.ts, packages/astraeus/src/core/bodies/jupiter.ts, packages/astraeus/src/core/bodies/outerPlanets.ts, packages/astraeus/src/core/planetModels.ts, packages/astraeus/src/core/planetSeries.ts, packages/astraeus/src/core/astronomyAdapter.ts, packages/astraeus/tools/import/planet-fits.mjs, packages/astraeus/tests/planetAccuracyFlybys.test.ts, packages/astraeus/data/ephemerides/planets/planets.json]
  dependencies: []
issues: []
supersedes: C-159
---

# C-160: O-063 Full Objective Re-check

**Verdict: CLEAR.** C-159's one Issue, I-161, is repaired: Design.md "Interfaces and Data Flow" now carries a "Planet positions from Horizons (O-063 ...)" paragraph, and every claim in it matches the code at HEAD and the measured evidence (table below). The repair touched records and docs only: `git diff 70840174..957cbbc6 -- packages/` is empty, so C-159's `check:gates`, `check:browser` (`docs/evidence/browser-20261109T233911Z/`) and Code Health snapshot are reused, not rerun. The owner may record O-063 done (Task and Objective status remain the owner's call).

**Closure map.**

| Prior Issue | State | Why |
|---|---|---|
| I-161 (Design not reconciled for T-290's drift note) | **closed, verified** | Design.md paragraph matches `planetTrajectory.ts`, `bodies/index.ts`, `planetRecords.ts`, the planet records, `planet-fits.mjs`, `planetModels.ts`/`planetSeries.ts` and `planetAccuracyFlybys.test.ts` claim by claim; the T-290 drift note is reflected |

**Prior owner decisions.** No structured `exception` or `owner_validation.accepted_check` is recorded on O-063 or its Tasks, so no `carried_forward` entries are needed. T-289's owner choice ("Replace with NASA's numbers", DATA-01 approval) and the Objective's Owner Decisions (follow Horizons' planet centre for Uranus and Neptune) are unchanged since C-159 and still honoured: no code changed. T-289/T-290 `check_waiver`s are waivers, not exceptions.

**Independence.** This session did not plan, build, coordinate or repair any O-063 work and is not the C-159 checker session (`o063-check-20261110`). The I-161 repair note and commit message were treated as claims. Not a lane: `git rev-parse --git-dir` equals `--git-common-dir` (`.git`), branch `o063-flyby-accuracy` on the main checkout.

## Re-check Scope

Frozen scope lock: C-159's, unchanged (criteria, entry points, matrix axes, admission boundary). Convergence: this is the one full re-check after the initial Check.

Admission ledger:

| Re-check item | Prior Issue / claim | Frozen cell | Allowed result |
|---|---|---|---|
| Design paragraph present and accurate | I-161 Proof Needed | C-159 row "Design reconciliation: T-290 drift note in Design.md" | Proven / Issue |
| No code change since C-159 gates | I-161 repair note ("No code change") | C-159 Commands And Results (gate, browser, health reuse) | Proven / rerun gates |
| ASTRONOMY_VALIDATION superseded note | C-159 Observation 2 (folded into repair) | none (observation) | observation only |
| All other C-159 matrix rows | unchanged code | C-159 Coverage Matrix rows | reused (code identical) |

## Design Claims Against The Code

| Design.md claim | Code / evidence at 957cbbc6 | Class |
|---|---|---|
| Every planet's series in `planets.json` is a piecewise Chebyshev fit made by `tools/import/planet-fits.mjs` of its system barycentre about the Sun from JPL Horizons, no longer VSOP87A | `planet-fits.mjs` header and `SOURCES` table (mercury..pluto, `system` 1..9); no VSOP87A import; `planetModels.ts` doc names the Horizons barycentre within 1 km; C-159 importer row | Proven |
| With a moon system: Horizons' planet centre (DE441 + satellite ephemeris) minus the centre about its barycentre; Mercury and Venus their own barycentre | `planet-fits.mjs` lines 4-8 and `barycentreFromHorizons` (lines 140-147): `body` 499..999 about 500@10 minus about 500@4..9; Mercury/Venus `system` only; Mars `mar099`, Jupiter `jup365_merged`, Saturn `sat441l`, Uranus `ura184_merged`, Neptune `nep098_merged` in the records | Proven |
| One binding rule `planetBinding` / `barycentreOffsetKm` in `core/bodies/planetTrajectory.ts`, bindings listed in `core/bodies/index.ts`, adds the offset when the package is loaded (Pluto's old binding made general) | `planetTrajectory.ts`: `barycentreOffsetKm` returns null unless `isLoaded()`, and on a throw; `planetBinding` adds it in `createPlanetSunTrajectory`; `index.ts` lines 36-43: all eight planets through `planetBinding`, Mars..Pluto with their moon systems; `PLUTO_BINDING` gone (C-159 M1/M2 mutations) | Proven |
| With the package: planet equals Horizons' centre, under 1 km from 1972 | test "holds over 1972 to 2044" (`withMoonsKm < FIT_KM`, 1 km); C-159 independent probes 0.10-0.49 km (Pluto 0.41) | Proven |
| Before 1972 up to about 35 km from time labels (UT1, UTC rubber seconds vs smooth TT-UTC) | `PRE_1972_LIMITATION` (Mercury 34.5 km worst); test bound `< 40`; C-159 showed residual under 0.55 km after the label shift | Proven |
| Without the package: barycentre, wobble up to about 300 km at Saturn | `WITHOUT_MOONS_SPAN_KM` saturn 303.9; Saturn record "up to 304 km"; C-159 probe 287.1 km in 2038 | Proven |
| Uranus and Neptune follow satellite-ephemeris barycentres, differing from DE441 bodies 7 and 8 by up to 3,441 and 742 km (owner choice) | `BARY_SPAN_GAP_KM = { uranus: 3440.7, neptune: 742.0 }` asserted within 5 km over 1972-2044; T-290 evidence line 116; records say "about 3,400" / "about 740"; O-063 Owner Decisions | Proven |
| One shared `planetEphemeris` provenance carries the measured figures | `planetRecords.ts` `planetEphemeris(...)`, used by mercury, venus, mars, jupiter and outerPlanets (Saturn, Uranus, Neptune, Pluto) | Proven |
| Earth keeps EPV00, measured within 7.3 km from 1972 | `astronomyAdapter.ts` imports `earthEpv00`; test `EARTH_KM = 7.3` (within 0.5 km); README line 396 "1972 to 2044" | Proven |
| First download unchanged; planet data a lazy chunk, 348,839 B (was 432,063 B) | `planetSeries.ts` line 52 `import("./planetModels")`, only importer of `planets.json`; `git show` sizes 348,839 / 432,063 B; C-159 engine budget and public build pass | Proven |
| `tests/planetAccuracyFlybys.test.ts` pins the errors against a saved Horizons fixture | test reads `tests/fixtures/planet-accuracy-o063-horizons.json` (flybys, yearly rows, Earth) | Proven |

Placement: the paragraph sits in `## Interfaces and Data Flow` (Design.md line 47), before "Journeys across years", whose existing text gives the series span (1950 to 2045, `planetSeriesSpan()`). The T-290 drift note (series source, barycentre rule, one binding, Earth EPV00) is fully reflected. No Design statement contradicts the code.

## Commands And Results

- `git diff --stat 70840174 957cbbc6`: only `.savepoint/Design.md`, the C-159 record, the health snapshot JSON, I-161, `docs/ASTRONOMY_VALIDATION.md` and `docs/evidence/browser-20261109T233911Z/`; `git diff 70840174 957cbbc6 -- packages/` is empty (0 bytes). `git status`: only the untracked `docs/prds/`, `docs/research/` (not touched).
- `git diff --check 70840174 957cbbc6`: clean.
- Reused, not rerun (code identical to what they ran on): C-159 `npm run check:gates` (all nine gates pass, 174 s), `npm run check:browser` (ten steps exit 0, 227 s, evidence `docs/evidence/browser-20261109T233911Z/`), `savepoint health check O-063` snapshot `sha256:027cc073...dd0d` ("does not block clearance").
- `savepoint resume`: run after writing this record (loads).

## Issues

None. No materiality actions are required.

## Observations (non-blocking)

1. `planet-fits.mjs` header comment (line 8) still gives the Uranus/Neptune barycentre gap as "up to about 3,200 km ... 660 km", while the test, T-290 evidence and Design give 3,441 / 742 km and the records "about 3,400 / 740". A comment only; a later tidy may align it.
2. Design does not repeat the importer's 1 km fit tolerance in words; it states the measured result (under 1 km from 1972) and the span sits in the next paragraph. Adequate for the drift note.
3. The `docs/ASTRONOMY_VALIDATION.md` superseded note addresses C-159 Observation 2's doc half; `astronomyAdapter.ts` error strings still say "Orb VSOP87A" (unchanged code). C-159 Observations 1 and 3-9 stand as recorded there.

## Owner Validation Still Needed

None for the re-check. The owner records T-290 and O-063 done (T-289 is already done).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [ ] STYLE-08 **Comments explain why** — `planet-fits.mjs` line 8 states a stale barycentre-gap figure (Observation 1).
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — unchanged since C-159: T-290 re-records 338 leaves of `scenePin.json`.
