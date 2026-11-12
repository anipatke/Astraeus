---
id: C-174
scope: {kind: objective, id: O-070}
result: NEEDS WORK
checked_by: {role: checker, session: o070-check-20261112}
executed_session: o070-run-20261112
checked_at: '2026-11-12T08:13:00Z'
health_snapshot: sha256:2d79e4b9a46b3a206be7911adf1c36d2c69ecad1ce4381c3a392b48db65cda00
reviewed:
  base_commit: 44d4902e
  head_commit: 348f36d8
  files: [packages/astraeus/src/api/providerPathTimes.ts, packages/astraeus/src/api/planPaths.ts, packages/astraeus/tests/providerPathTimes.test.ts, packages/astraeus/tests/fixtures/scenePin.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, .savepoint/Design.md]
  dependencies: []
issues: [I-173]
supersedes: null
unmet: [O-070-SC4]
---

# C-174: O-070 Full Objective Check

Fresh session; did not plan or build O-070. Wrote only this record and I-173; probes in the session scratchpad (one temporary public-API test file was created and removed). Diff `main...HEAD` (44d4902e..348f36d8).

## Checklist

- [x] Establish Scope  - [x] Freeze The Check Scope  - [x] Turn Acceptance Into Invariants  - [x] Build The Mandatory Coverage Matrix  - [x] Finite External-Boundary Matrix (provider only: throws, none, NaN, wrong length, fails mid-refinement)  - [x] Workflow And Side-Effect Check Lock (n/a: pure planner, called once per `addTrajectory`/re-track; no persistence)  - [x] Matrix Completion Lock  - [x] Parallel Planning Advice (n/a)  - [x] Perform The Adversarial Pass  - [ ] Re-check After Remediation (n/a, first run)  - [x] Verify File Reality  - [x] Verify Evidence And Gates  - [x] Collect Code Health Evidence  - [x] Complete The Issues Pass  - [x] Summarize Materiality  - [x] Review Code Style

## Scope lock

1. O-070 Success Conditions 1-6, Decisions (frame = path `center`; cap 4,096, no host setting); T-309 Done When; ARCH-02/03/04, API-01/07, TEST-01/02/03; Full gates.
2. `providerPathTimes` (new) and `providerBody` via public `Scene.addTrajectory({ provider, bounds, plane? })`.
3. Relied on: provider `stateAt`, `rotatedState`, scene pin, `autoStretches`/`TrackedBodyView` reading `pathTimesUtcMs`.
4. Axes: pass geometry (straight and hyperbolic; 1.2-10 Earth radii; 3-40 km/s), CA placement (at a seed, just after, mid, 0.27, 0.91; first/middle/last interval), plane (EQJ, ecliptic), bounds (1 ms-12 days, 6 years, fractional, negative, ±8.64e15), provider faults. N/a: `samples` paths (out of scope), text classes, output sinks.
5. Admission: supported public path, violates an SC/Done When/guardrail.

## Coverage

| Criterion | Result | Evidence |
|---|---|---|
| SC1 / F-05 line within 1% at every minute within CA ± 3 h | Proven | independent probe, 600 cases (2 geometries x 5 distances x 4 speeds x 5 placements x 3 intervals), window clipped to bounds: worst gap < 1% both as distance to the polyline and to the segment drawn at that minute; 0 failures |
| TEST-02 regression fails on 128 even moments alone | Proven | test asserts even-only gap > 0.01 (probe: 67x the distance for the hyperbolic case); a straight unbent pass is drawn exactly by any samples, so the test rightly uses a bending flyby |
| SC2 ≤ 4,096; first/last the bounds; whole ms, strictly increasing | Proven | every probe case and bounds row; cap hit exactly at 4,096 (aliased period = seed step, 60 s circle, ±8.64e15 bounds) |
| SC3 all 128 even moments kept | Proven | all 600 cases contain the even moments; formula identical to the old one |
| Deterministic | Proven | 600/600 repeat runs identical |
| Bad provider at planning | Proven | throws / none / NaN / 2-vector / all-at-origin / throws or NaN only after the seeds: 128 even moments, no throw |
| Wiring through public `Scene` (EQJ and `ecliptic-j2000`) | Proven | temporary test: Earth-centred flyby path refines above 128 in both planes |
| SC4 README text | **Issue I-173** | the how-it-is-drawn sentence is present; the known limit (bends seen only against another body) is missing |
| SC5 no API change; CHANGELOG Unreleased fix | Proven | `api-surface.lock.json` not in the diff; CHANGELOG top entry |
| SC6 no owner preview | Proven | no demo draws a provider path; node evidence |
| Existing tests' setups unchanged; pin only `bump` | Proven | diff in tests: new file + 4 pin lines (`bump` count 128→210 and sum, both orders); `publicApiProviderLines.test.ts` untouched and passing |
| Design reconciled | Proven | `Paths across the solar system` sentence matches the code |
| ARCH-02/03/04, API-01 | Proven | times only, State untouched; synthetic tests; file imports nothing; lock unchanged |

## Gates

- `npm run test:full`: pass, 253 files, 3,768 passed, 2 skipped (73 s).
- `npm run check:engine-alone` pass (27 s); `check:pack` pass (19 s); `check:node-consumer` pass; `measure:example` pass (first-open 1,762,367 B / 506,739 B gz).
- `git diff --check main...HEAD`: clean.
- `savepoint health check O-070`: snapshot above, "does not block clearance" (all instances optional, no finding).
- `npm run check:browser` (once, 08:06:32-08:12:24Z): pass, 12 steps, 0 error lines; total 348 s, over the 320 s limit (WARNING only, not a failure); evidence `docs/evidence/browser-20261112T080632Z`.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-173 README omits the known limit | High (the Closest Calls case: Sun-centred path fixed to Earth) | Low-Medium (host sees chords with no documented reason; one sentence fixes it) | Medium | Fix now: one README sentence |

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

## Owner decisions carried forward

- T-309 `check_waiver` (owner, o070-run-20261112): first assessment; Task scope as recorded — applies. Not technical clearance.

## Owner validation still needed

None (SC6). After I-173's repair, a recheck under this scope lock.

## Observations (non-blocking)

- Planning calls the provider when the path is added; a provider that cannot answer yet (data loaded later) keeps the 128 even moments for good. Design states it; the README does not. The owner may want it in the same sentence as I-173.
- The pin `bump` entries were regenerated with `vitest -u` and the 4-line diff reviewed, not typed by hand as the pin header says; the result is the same.
- A path that passes exactly through its centre (distance 0) scores 0 and is not refined; only reachable with a straight line, which needs no refinement.
- Fractional-ms bounds round the first/last moments (old behaviour, unchanged).
- `check:browser` took 348 s against its 320 s limit (smoke 142 s); C-173 was at 319 s. Not caused by O-070 (no browser-facing change); worth a look per build.md.
