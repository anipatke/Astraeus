---
id: C-128
scope: {kind: objective, id: O-047}
result: CLEAR
checked_by: {role: checker, session: o047-recheck2-20261031}
executed_session: o047-repair2-20261031
checked_at: '2026-10-31T04:25:00Z'
health_snapshot: sha256:aa38b9db967ccf064b1030033d7a6e0da8cd8f02162387faac1aaff8f6499534
reviewed:
  base_commit: 4355fa1f
  head_commit: 6878f277
  files: [packages/astraeus/src/api/scene.ts, packages/astraeus/tests/dataSpans.test.ts]
  dependencies: []
issues: []
supersedes: C-127
---

# C-128: O-047 targeted re-check after the I-110 surface repair

Targeted re-check allowed by C-127 (one targeted repair under I-110, then rows 3 and 18 plus the full and node-consumer gates), under C-126's frozen scope lock and matrix (not restated). Owner decision for the repair (2026-10-31): "Repair: report it when the viewer loads".

**Independence.** This session did not plan, build, repair or coordinate O-047. It wrote only gate outputs (`coverage/`, `junit.xml`, `dist/`, scratch pack folders), the official health snapshot, two throwaway probe tests (copied into `packages/astraeus/tests/`, run, deleted), one temporary revert of `scene.ts` to `4355fa1f` to prove the probe catches the regression (restored with `git checkout HEAD`; tree clean after), this record and the Issue resolutions below.

**Baseline.** HEAD `6878f277` on `o047-historical-probe`, not a lane. Repair diff since C-127's head `4355fa1f`: `api/scene.ts` (+21/-3) and `tests/dataSpans.test.ts`; `tools/check-node-consumer.mjs`, README and CHANGELOG unchanged (gate not weakened; docs already say "fails once, as `ready` rejecting at mount"). `docs/prds/`, `docs/research/` untouched.

**Verdict: CLEAR.** The I-110 regression is repaired: an out-of-span planet window never throws from `toDefinition()` / `prepareScene` (so `mount`), and `prepare` / `ready` rejects with `out-of-span` naming the planet and 1950-01-01 to 2045-01-01, for plain, orbit, fitOrbit and both, series loaded and not. `check:node-consumer` 4/4. All gates pass.

## Closure map of prior Issues

| Issue | C-127 | Now |
|---|---|---|
| I-110 surface regression (toDefinition throws, node-consumer red) | open | **Fixed, proven** -> verified |
| I-112 slower-wins | fixed, proven, awaiting CLEAR | unchanged code -> verified |
| I-099, I-106, I-111, I-113, I-114, I-115 | proven in C-126 (rows 6, 8, 9, 14, 15, 16), re-run in C-127 | unaffected by the repair; full gate re-run -> verified |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-126 lock reused, immutable)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-126 matrix; rows 3 and 18 by probe and gate, the rest through the fresh full gate)
- [x] Finite External-Boundary Matrix (unchanged; browser run reused, see Gates)
- [x] Workflow And Side-Effect Check Lock (toDefinition -> prepare -> ready: fault recorded at setup, thrown first in prepare, before any load or data install; repeated prepare rejects again)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature in scope)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality (both files in the `repair_attempted` note exist)
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission ledger

| # | Re-check item | Prior claim | Frozen cell | Allowed result |
|---|---|---|---|---|
| B1 | Plain / orbit / fitOrbit / orbit+fit outside the series, series loaded: toDefinition does not throw, ready rejects named | I-110 repair 2 | Row 3 plain, orbit and fit cells | blocking |
| B2 | Same, series not loaded (fresh module graph), then a second scene in the now-loaded instance | I-110 repair 2 | Row 3, "series loaded and not" | blocking |
| B3 | Exact 1950-01-01 to 2045-01-01 with orbit and fit still resolves | I-110 repair 2 | Row 6 "1950 to 2045 timeline prepares" | blocking |
| B4 | Packed-package Node consumer | gate | Row 18; scope lock item 1 | blocking |

## Probe results (independent harness; Jupiter, Mars, Mercury, Neptune; windows 1930, straddling 2045, 2050; through `prepareScene`, the path `mount` uses)

- B1: 48 cells (3 windows x 4 variants x 4 planets): `prepareScene` never throws; `ready` rejects `out-of-span` matching `<planet>.*1950-01-01 to 2045-01-01`, no `TimeScale` text; a second `definition.prepare()` rejects the same. **Pass.**
- B2: 24 cells (before / straddle x 4 variants x Jupiter, Neptune, Mercury) after `vi.resetModules()` with `planetSeriesLoaded() === false`: no sync throw, `ready` rejects named, series then loaded; a second scene in that instance (loaded) also does not throw and rejects. **Pass.**
- B3: Jupiter `{orbit: true}` + `fitOrbit`, 1950-01-01 to 2045-01-01: resolves. Sun-only before 1950: no `out-of-span`. **Pass.**
- Mutation: with `scene.ts` at `4355fa1f` the same probe fails 49 of 51 (sync `SceneError` from `toDefinition`), so it discriminates.
- B4: `npm run check:node-consumer` 4/4 pass, including `consumer.test.mjs` "a 1979 journey" (Saturn line, pacing, spans, `early.toDefinition().prepare()` rejects `out-of-span`). **Pass.**

## Gates (fresh, HEAD 6878f277, 2026-10-31 UTC, Node v24.16.0)

| Gate | Result |
|---|---|
| `npm run test:full` | **pass**, 155 files, 1989 passed, 1 skipped; statements 91.7%, branches 86.36%, lines 94.29% |
| `npm run lint`, `typecheck`, `build` | pass |
| `npm run check:engine-alone` | pass |
| `npm run check:pack` | pass (14.5 s): astraeus 458 files (460), Saturn 53.46 MB (59), Uranus 40.63 (45), Jupiter 30.90 (34); figures identical to C-127 |
| `npm run check:node-consumer` | **pass** 4/4 |
| `git diff --check main...HEAD` | clean |
| `npm run check:browser` | reused: C-127 run `docs/evidence/browser-20261031T040322Z` (8 steps pass, at `4355fa1f`). Browser policy: one run per Objective Check, never twice for one change; C-127 named reuse unless the repair touches the viewer. The repair changes only the out-of-span branch (`#deferredRead` returns `#planetRead`'s value unchanged in span), and every browser journey runs in span. Not re-run. |

## Code Health

`savepoint health check O-047 .` after the full gate: snapshot `sha256:aa38b9db...9534` (created), "Code Health does not block clearance"; no finding in complexity, coverage, vulnerabilities, duplication or tests.

## Owner Decisions Assessed

No structured `owner_validation.accepted_check` or `exception` on O-047, so no `carried_forward` entries. Prose decisions stand, scope unchanged by this repair: T-200 package sizes (pack figures identical), T-203 Jupiter page raw limit 7,160,000 (browser run reused, no page change), T-203 owner look (no visual change), the 2026-10-31 "report it when the viewer loads" decision (implemented as decided). Eight Task-check waivers stand.

## Issues

None. No materiality actions are required.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** — `dataSpans.test.ts` now asserts the surface (no throw from `toDefinition`, `prepare` rejects).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — unchanged from C-126 (`moonSystem.ts` comment names `tests/moonSpans.test.ts`; the guard is `tests/historicalMoons.test.ts`).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — unchanged from C-126 (T-200 data refit, explained).

## Owner Validation Still Needed

T-203 (`owner_validation.required: true`): the owner may record `accepted_check: C-128`. O-047 then closes once the owner marks its Tasks done and accepts the outcome.

## Non-blocking Observations

1. `dataSpans.test.ts`'s "series not loaded yet" step is vacuous inside the shared test instance: `vitest.setup.ts` preloads the planet series, so both its passes run loaded. The not-loaded surface is covered by this Check's fresh-module probe and by `check:node-consumer`; a `vi.resetModules()` case (as in `publicApiSunOrbits.test.ts`) would pin it in the repo.
2. While out of span, `toDefinition()` returns a definition without the fit or early layers (fallbacks); harmless because `prepare` rejects first and the viewer draws only after it resolves.
3. C-126 observations 1, 3, 5, 6 and C-127 observation 1 stand.
