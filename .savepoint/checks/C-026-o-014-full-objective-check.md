---
id: C-026
scope: {kind: objective, id: O-014}
result: CLEAR
checked_by: {role: checker, session: o014-orchestrator-check-20261013}
executed_session: o014-sonnet-executor-sessions-20261011-20261013
checked_at: '2026-10-13T08:20:00Z'
health_snapshot: sha256:28aaf233de3402ff3d493382634124cd90bdee6187628aa0595ef393efd6e382
reviewed:
  base_commit: 8fc6fce
  head_commit: c06605d
  files:
    - src/core/
    - src/assets/
    - src/app/
    - src/shell/
    - src/experiences/
    - src/synthetic/
    - src/main.tsx
    - vite.config.ts
    - tests/
    - tools/validate/
    - .savepoint/Design.md
    - docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md
    - docs/ASTRONOMY_VALIDATION.md
    - docs/DONOR_PROVENANCE.md
  dependencies: []
issues: []
supersedes: null
---

# C-026: O-014 Full Objective Check

Independence: the checker is the orchestrating session. Every Task was built by separate Sonnet executor sub-sessions; the checker wrote no implementation. Scope: 12 commits 8fc6fce..c06605d (131 files under `src/`, `tests/`, `tools/`; +8,830 / −1,508 lines).

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Objective Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. O-014 Success Conditions 1–5 (Gates A–D, Regression); every owned Task (T-042…T-050) and its Task Check (C-015…C-025); Guardrails ARCH-01…05, PROV-01, PROV-02, TEST-01…04; project rules (scene-affecting fuller gate, browser regression maintenance, historical evidence, deferred Design reconciliation).
2. Public entry points: `createStateResolver`, `createCatalogue`, `createComposition`, `createSolarSystemScale`, `scaleChoicesFor`, path rules, `planetPositionFromSunKm`, `iauRotation`, `ExperienceDefinition` (composition, sceneCenter, scaleChoices, visualOverrides), the four experiences and `?experience=` routing, the public build and its validator.
3. External boundaries: the Orb astronomy library (pinned), JPL Horizons (fixtures only, fetched once), headless Chromium via donor `playwright-core`, vite.
4. Out of scope: I-022 (owner-decided follow-up), O-011/O-012 work, Saturn and the rest of design step 7.

## Coverage Matrix (Success Conditions)

| Condition | Invariant | Evidence | Result |
|-----------|-----------|----------|--------|
| A1 Core isolation | `src/core/` imports nothing outside itself and the library | `tests/layerRule.test.ts` (self-proving); C-015 | Proven |
| A2 Native-centre and root rules; self-centre only at zero, `stateOf(b,t,b)` is that State | provider answers only its parent; root has no binding | `tests/stateResolver.test.ts`; C-015 probes (−0 accepted, 1e-300 rejected) | Proven |
| A3 Invariance (i) presentation, (ii) round trip ≤1e-6 km, (iii) byte-equal resolvers | for every body and centre | `tests/compositions.test.ts:316–357`; **checker probe (this Check):** all 9 catalogued bodies × 9 centres at 2024-08-12T03Z: two separately created resolvers byte-equal, every pair antisymmetric ≤1e-6 km, all finite | Proven |
| A4 Moon-from-Sun = removed branch ≤1e-9 km at Horizons dates | | `tests/stateResolver.test.ts` (formula written out after removal); C-018 | Proven |
| B1 Defined once; duplicates rejected; no definition or binding exported outside core | | catalogue and resolver duplicate tests (C-015, C-016); checker grep: the only `CelestialBodyDefinition`/`StateSourceBinding` uses outside `src/core/` are type references in `src/assets/catalogue.ts` and `src/app/bodyDraw.ts`; no values | Proven |
| B2 Explorer and Apollo from the same assets with identical science; `browser-spike02.mjs` passes without modification; owner finds Apollo unchanged | | both use `earthMoonSystem` (C-020, C-021); **checker ran the unmodified pre-O-014 `browser-spike02.mjs` (from 8fc6fce) against c06605d's code: exit 0, `errors: []`** (the committed copy gained phone runs under I-023 with desktop assertions unchanged, C-025); owner accepted Apollo unchanged at the six telemetry times under T-043/T-044 | Proven |
| C1 Perseids on Sun–Earth, Sun drawn, Earth on its orbit, no Moon; builder changed in composition and catalogue items (plus the T-047 plan's scale choices, presets and paths) | | `showerDefinition.ts`; `browser-showers.mjs` (both sizes); C-020/C-021, C-023 | Proven |
| C2 Jupiter+Io renders, focuses, labels, lights both; Io vs Horizons ≥6 dates, classified, figure recorded | | `browser-jupiter-io.mjs` (both sizes); fixture max 9,387.5 km = 2.58 Io diameters → approximate demonstration; checker's seven independent Horizons dates 575–4,893 km (C-023) | Proven |
| D1 GPU precision at 1 AU, 60 frames, both centres | | `browser-precision.mjs`; focused body ≤1.3e-12 px, Sun focus ≤5.8e-4 px (C-019) | Proven |
| D2 Planets and IAU rotation vs Horizons with maxima | | Mercury 30.4, Venus 50.1, Mars 95.8, Jupiter 1269 km; checker's independent Jupiter 2020-01-01: 1159 km; sub-Earth longitude Jupiter 0.0051°, Mars 0.0028° (2009 constants) / 0.934° (2015 constants, explained) (C-022) | Proven |
| D3 Accuracy record on every definition incl. Moon 254 km / 8.4° | | **checker probe:** all 9 bodies carry dimensions, position, a valid `validUtc` range and non-empty orientation limitations; Moon text names 254 km and 8.4° | Proven |
| D4 Per-body vs single Sun light compared, choice recorded | | `lighting-comparison.json`; Design.md records per-body kept (C-023, C-024) | Proven |
| D5 Every texture licensed or local-only; public build has no local-only bytes | | `tests/textureLicence.test.ts`; checker probe: every catalogued texture passes the rights rule; public build `matches: []` and the validator fails on the normal build (C-020, C-025) | Proven |
| R1 Configured gates | | checker 2026-10-13T08:15Z: typecheck 0, build 0, 31 files / 568 tests | Proven |
| R2 Every browser script, zero errors, fresh dirs, 1280×800 and 390×844 | | `docs/evidence/o014-t050-repair-20261013T080032/`: all 12 exit 0, 19 result files `errors: []`; precision and lighting fixed-viewport by their own criteria (C-025) | Proven |
| R3 Name check extended to `src/assets/` | | `tests/nameCheck.test.ts`, self-proving; checker planted offences caught (C-021); §E check 7 amended in Design | Proven |
| R4 Design reconciled, every drift note accounted for | | T-050 evidence table: 63 rows (53 reflected, 10 non-architectural with reasons); Design.md "Asset architecture (O-014)" and Codebase Map; design doc "Built — 2026-10-12" (C-024) | Proven |

Owned Tasks: T-042 C-015, T-043 C-016, T-044 C-018, T-045 C-019, T-046 C-017, T-047 C-020→C-021, T-048 C-022, T-049 C-023, T-050 C-024→C-025 — all CLEAR. No Task Check was waived (the T-042 and T-044 mandatory Checks ran).

## Finite External-Boundary Matrix

| Boundary | Cell | Classification |
|----------|------|----------------|
| Orb library | configured target = pinned package, no new dependency | Passed (no dependency change; bundle growth from the full VSOP87A series is I-022, owner-decided follow-up) |
| JPL Horizons | data fetched once into raw fixtures; tests never call the network | Passed (fixtures carry genuine API headers; checker queried live Horizons only as an independent oracle) |
| Browser runner | startup, own vite per run, output-dir arguments, cleanup | Passed (runs stopped their servers; no committed evidence changed: checker `git status`) |
| Unavailable dependency, timeout, redirect, malformed response, secret output | | Not applicable: no runtime network or secrets in the app; Horizons is not called at runtime |

## Workflow And Side-Effect Lock

The only multi-step side-effecting workflow added is the public build: `ASTRAEUS_PUBLIC_BUILD=1` substitution at import → bundle → validator hashes `dist/` against local-only sources. Failure owner: the validator (exit 1, names the match). Oracle: the same validator on the normal build exits 1 (both textures found), and `tests/publicBuild.test.ts` catches a copied and a base64-embedded fake texture. Passed.

## Parallel Planning Advice

The Objective named `assets`/`scale` as an independent pair; Tasks ran sequentially on the main checkout. Advisory only; not a finding.

## Adversarial Pass

- Bypass of single definition: no value of a definition or binding outside core (grep above); the catalogue rejects a visual without a definition and a definition without a visual (C-016).
- Centre changes: probed with Moon-, Sun-, Jupiter- and made-up-centred scenes (C-018, C-021, C-023); generic defaults no longer assume Earth (I-021).
- Validation of reference data against itself: Io's apsidal sign and the planet maxima were cross-checked on dates the executors did not use (C-022, C-023).
- Regression scripts modified during the Objective: the original Apollo script still passes unmodified (B2); the three scripts edited under I-023 keep every desktop assertion (C-025).
- Fixed-size measurement scripts versus the both-sizes rule: scoped explicitly in I-023 and C-025, not silently excluded.

## File Reality

Every file named in Task evidence and drift notes exists, or is recorded as intentionally deleted (`src/app/SunCentredView.ts`→`PathView.ts`, `src/app/orbitPath.ts`, `src/mission/`, `src/showers/`). Screenshots are git-ignored at the owner's request (882fa1c); they exist locally under each run directory.

## Code Health

Snapshot `sha256:28aaf233…e382` (created 2026-10-13T08:16Z after the full gate): "Code Health does not block clearance". Complexity, vulnerabilities, duplication, tests: no finding. Coverage: optional instance reports **stale** evidence. That is a collection gap, not a code finding, and it does not block.

## Issues

None open against this Check. Linked Issues: I-020 (verified, C-019), I-021 (verified, C-021), I-023 (verified, C-025). I-022 is an owner-decided follow-up after O-014 and is not a requirement of this Objective. No materiality actions are required.

## Observations (non-blocking, follow-up candidates)

1. I-022: the full VSOP87A series doubles every experience's bundle (≈1.0 MB gzip).
2. Apollo-flavoured labels remain in `MissionPanel`, `DebugControls` and `DebugOverlay`; the `sunEarthSystem` doc comment is stale (recorded in Design as open).
3. The Code Health coverage instance is stale; refresh coverage in the next gate run.
4. All browser evidence is headless SwiftShader; precision excludes GPU Float32 matrix arithmetic.
5. Record timestamps C-020/I-021 were ahead of the clock (corrected note in C-021).

## Owner Validation Still Needed

T-047, T-049 and T-050 declare `owner_validation.required` and are `CLEAR` but not yet accepted; the live run sheet was given on 2026-10-13. The Objective can close only after those three are accepted and set `done`, and the owner closes O-014.

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
- [ ] STYLE-10 **Small diffs** — T-044, T-047 and T-049 were large single changes (noted in C-018, C-023); behaviour-free renames and moves were split out as asked.
