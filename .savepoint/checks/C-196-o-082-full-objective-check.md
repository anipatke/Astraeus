---
id: C-196
scope: {kind: objective, id: O-082}
result: CLEAR
checked_by: {role: checker, session: check-o082-orchestrator-20261121}
executed_session: orchestrate-g024-20261121 (Sonnet builders for T-341, T-342)
checked_at: '2026-11-21T11:21:49Z'
health_snapshot: sha256:610ad1300889f073e45861860fdde4e9385117ac89f85317db52774d4a2fa1a4
reviewed:
  base_commit: 0c04934b
  head_commit: b1c02807
  files: [packages/astraeus/CHANGELOG.md, packages/astraeus/src/core/elementsBody.ts, packages/astraeus/src/core/keplerAnomaly.ts, packages/astraeus/src/core/listedOrbitGroup.ts, packages/astraeus/src/core/sunCentredSources.ts, packages/astraeus/src/types/orb.d.ts, packages/astraeus/tests/elementsEpoch.test.ts, packages/astraeus/tests/keplerSolver.test.ts]
  dependencies: []
issues: []
supersedes: null
---

# C-196: O-082 Full Objective Check

Run by the orchestrating session under G-024 decision 7 ("Orchestrator session runs it"); this session planned the Design reconciliation but did not build T-341 or T-342 (Sonnet builders did). Diff `0c04934b..b1c02807` (12 files, +315/−36). Step checks waived on both Tasks (`check_waiver`).

**Result: CLEAR.** No Issues.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (not applicable: science core only; the browser runner is exercised as a gate)
- [x] Workflow And Side-Effect Check Lock (not applicable: pure functions, no persistence)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; T-341/T-342 ran side by side in one checkout; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality (every file named in T-341/T-342 evidence exists; `t342-before.txt` is scratch)
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. Criteria: the four O-082 Success Conditions and Decisions (including the planner decision on the TDB clock convention); T-341 and T-342 Done When; ARCH-04, ARCH-05, PROV-01, API-04, CODE-01, TEST-01..04; the Full Check gates in `docs/agents/build.md`; browser tier per decision 1 (the quick tier does not exist until O-086, so the whole `check:browser` ran once, a superset).
2. Entry points: `eccentricAnomalyFromMean`/`trueAnomalyFromMean` (`core/keplerAnomaly.ts`), `listedOrbitGroup.eccentricAnomalyRad`/`trueAnomalyFromMeanRad`, `sunCentredSources.eccentricAnomalyFromMean`, `keplerElements.fillKeplerRangeKm`, `buildElementsBody`/`epochUtcMsOf`, public `Scene.addBodyFromElements` + `stateOf`.
3. Relied-on: orb `ttMinusUtc` (exported from `@lizard-isana/orb/time`, checked in `src/time/index.js`), `tdbMinusTtSeconds`, the orb two-body adapter's per-centre GM.
4. Matrix: e ∈ {0, 0.5, 0.9, 0.99, 0.995, 0.999, 0.9999} × mean anomaly (0, ±tiny, near ±π, ±π, large unwrapped ±) × every entry point; e < 0, e ≥ 1, NaN refused; epoch scale UTC/TT/TDB × placement (perihelion time, mean anomaly); centre GM; Node 22 and 24.
5. Admission: supported paths above against the criteria.

## Coverage

- **One convergent solver** (T-341): Proven. Shared bracketed Newton with bisection fallback, residual/rounding stop, 100-step cap, `KeplerEccentricityError`. `keplerSolver.test.ts` holds all six entry points (fill included) to an independent bisection; builder showed 3 failures on the old solver (e = 0.9999, M ≈ 0.00178). Fill stays inline by the Objective's 5% rule (measured ×1.46/×1.63).
- **Independent probe (this session)** through public `Scene.addBodyFromElements` + `stateOf`, perihelion at the epoch, Sun distance against `a(1 − e cos E)` with E by my own bisection, for all seven e and Δt from 1 s to 20,000 days: worst relative error 1.3×10⁻⁶ (e = 0.9999, 60 s after perihelion, 0.14 km at ~2,400 km/s, consistent with sub-ms epoch timing), against a 50 million km error before. Probe source kept at the scratchpad `probe-o082.test.ts` (not committed).
- **Equivalent epochs** (T-342): Proven. `elementsEpoch.test.ts` (Codex probe, UTC vs TT < 1 m, both placement branches; UTC vs TDB < 5 m by the recorded planner decision); builder red-first output shows 2,153,975 m. My probe in 2020 (TT−UTC 69.184 s): 0.20 m perihelion branch, 0 m mean-anomaly branch.
- **Centre GM**: Proven. `createOrbTwoBodyAdapter([{ id: centre.id, gmKm3S2: gm }])`; test shows the 1 s displacement now matches the GM (was half).
- **Existing tests unchanged and green**: Proven. No existing test file in the diff; Horizons, `jupiterIo`, `longOrbitPaths`, `listedOrbitGroup`, `pointsKepler`, showers `keplerShader` green.
- **Node 22 and 24**: Proven for scope. Focused suites on Node 22.23.5: 7 files, 78 passed. Full suite on Node 22: 3 failures in `astraeus-demo-showers/tests/rebuildComparison.test.ts` (exact float, `10.061483108762513` vs `…515`), the same three cases and value the Codex audit recorded at 0.9.5 (F10, AH-35), owned by O-085; not introduced here.
- **Design reconciliation**: Design "Orbit maths (O-082)" written from both drift notes (commit 758eac92); CHANGELOG 0.10.0 (proposed) Fixed lines.

## Gates (this session)

- `git diff --check 0c04934b HEAD` clean; `lint` 0 (5 s); `typecheck` 0 (10 s); `build` 0 (3 s); `test:full` 0: 291 files, 4640 passed, 2 skipped (82 s).
- `check:engine-alone` pass (28 s); `check:pack` pass (16 s); `check:node-consumer` pass (10 s); `measure:example` first-open 1,828,479 / 522,568 B gzip (+341 / +97 vs 0.9.5).
- `npm run check:browser` once, 11:14:46–11:21:09 UTC: exit 0, every step exit 0, no error lines; evidence `docs/evidence/browser-20261121T111446Z`. Time warnings (look-out 103 s / 75, hello-sky 24 s / 15, total 383 s / 320) are the known AH-29 overrun owned by O-086; not failures.
- `savepoint health check O-082`: snapshot above, "does not block clearance"; every instance optional.

## Adversarial pass

Wrapping at exactly ±π returns +π (kept for `jupiterIo`); NaN eccentricity refused (`!(e >= 0 && e < 1)`); e = 0 and M = 0 short-circuit; large |M| (−98,765) within the turn-reduction allowance; the unwrapped sun-centred solve adds whole turns back with the same ceil rule as the wrap, so no off-by-one turn at odd multiples of π; the TT branch requires `ttMinusUtcSeconds` (parser, 32–120 s), so no silent zero offset; UTC branch converts through orb's leap-second table.

## Materiality

No Issues; no materiality actions required.

## Owner Decisions

No owner acceptance or exception on O-082; no `carried_forward` entries. Owner validation: none required by any Task.

## Observations (non-blocking)

- `KeplerEccentricityError` is a raw `RangeError`; public callers cannot reach it (the elements parser refuses e ≥ 1 with `bad-element`), and O-083 owns coded errors.
- TDB-written epochs agree with UTC to TDB−TT (≤ ~1.7 ms) by the recorded planner decision; flagged to the owner.

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
