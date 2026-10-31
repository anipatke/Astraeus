---
id: C-127
scope: {kind: objective, id: O-047}
result: NEEDS WORK
checked_by: {role: checker, session: o047-recheck-20261031}
executed_session: o047-repair-20261031
checked_at: '2026-10-31T04:10:00Z'
health_snapshot: sha256:884a8fcf8c47b039abce1f135ce05a5afc138df1a3871083660c41363710d5fa
reviewed:
  base_commit: 2bf6c06b
  head_commit: 4355fa1f
  files: [packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/core/pacing.ts, packages/astraeus/src/api/prepared.ts, packages/astraeus/src/api/mount.ts, packages/astraeus/tests/dataSpans.test.ts, packages/astraeus/tests/pacing.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, tools/check-node-consumer.mjs]
  dependencies: []
issues: []
unmet: [I-110]
supersedes: C-126
---

# C-127: O-047 Full Objective re-check

Full re-check of O-047 (T-195 to T-201, T-203; T-202 retired) after C-126 NEEDS WORK and repair commit `4355fa1f`, under C-126's frozen scope lock and matrix (not restated; same 21 rows, same axes).

**Independence.** This session did not plan, build, repair or coordinate O-047. It wrote only gate outputs (`coverage/`, `junit.xml`, `dist/`, example builds), the official health snapshot, browser run folder `docs/evidence/browser-20261031T040322Z/`, one throwaway probe test (copied into `packages/astraeus/tests/`, run after the full gate, then deleted), this record and `rechecked` history on I-110 and I-112.

**Baseline.** HEAD `4355fa1f` on `o047-historical-probe`, merge base `2bf6c06b`; not a lane. Repair diff since C-126: `scene.ts`, `story.ts`, `pacing.ts`, two tests, README, CHANGELOG. `docs/prds/`, `docs/research/` untouched.

**Verdict: NEEDS WORK.** I-112 is repaired and proven. I-110's repair makes every planet case give the named `out-of-span`, but it moved the error for an ordinary planet (no orbit line, no fit) from `prepare` / `ready` to a synchronous throw from `toDefinition()` whenever the planet series are already loaded, and the release gate `npm run check:node-consumer` now fails on exactly that (deterministic, two runs). Everything else passes.

## Closure map of prior Issues

| Issue | C-126 finding | Now |
|---|---|---|
| I-112 slower-wins | slow span + faster event rule gave the faster rate | **Fixed, proven** (stays open: `verified` needs a CLEAR Check) |
| I-110 orbit/fitOrbit before 1950 | raw `TimeScaleOutOfRangeError` | **Named error fixed; regression introduced** (still open) |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-126 lock reused, immutable)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-126 matrix; every row re-run through the full gate, rows 3, 11, 18 also by probe)
- [x] Finite External-Boundary Matrix (unchanged; browser runner used its own servers, :5490 left alone)
- [x] Workflow And Side-Effect Check Lock (mount path: toDefinition, prepare, ready)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature in scope)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality (every file named in the two `repair_attempted` notes exists)
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission ledger

| # | Re-check item | Prior claim | Frozen cell | Allowed result |
|---|---|---|---|---|
| A1 | Faster event rule inside a slow span, both listing orders, and inside its ramp | I-112 repair | Row 11 "event rule faster than span" | blocking |
| A2 | Slower event rule inside a faster span | I-112 repair | Row 11 "event rule slower than span" | blocking |
| A3 | Two rules of different types on overlapping events | I-112 repair | Row 11 "two rules of different types" | blocking |
| A4 | Cruise, seek determinism, continuity over the whole window | I-112 repair | Row 10 "cruise; monotone; loop/seek" | blocking |
| A5 | Planet with orbit line / fitOrbit / both, before 1950, straddling 1950, after 2045, series loaded and not | I-110 repair | Row 3 orbit and fitOrbit cells | blocking |
| A6 | Plain planet outside the series | I-110 repair | Row 3 "plain planet before 1950 / after 2045" | blocking |
| A7 | Exact series edges 1950-01-01 to 2045-01-01 with orbit and fit | I-110 repair | Row 6 "1950 to 2045 timeline prepares" | blocking |
| A8 | Packed-package Node consumer (Saturn line, pacing, spans, out-of-span) | gate | Row 18; scope lock item 1 release gate | blocking |

## Probe results (throwaway harness, Jupiter, Uranus, Neptune, Mercury, Saturn; independent of the executor's Saturn-only test)

- A1: span `{40..60 d, rate 7}` with flyby rule `rate 5000, within 2 d`: day 50 gives 7 in both orders; day 41 gives 7. **Pass.**
- A2: span rate 9000, rule rate 3: 3. **Pass.** A3: rules of types `flyby` (5000) and `probe` (2) at day 50.4: 2 in both orders. **Pass.**
- A4: cruise exactly 86,400; same time twice gives the identical rate; hourly sweep over 100 days stays within [2, 86,400], no step above e^1.5, and never above 7 inside the span. **Pass.**
- A5: all 12 orbit / fit / orbit+fit cells give `SceneError out-of-span` naming the planet and "1950-01-01 to 2045-01-01", on first (series not loaded) and second (loaded) build. **Pass.**
- A7: Neptune `{orbit: true}` + `fitOrbit` on exactly 1950-01-01 to 2045-01-01 resolves. **Pass.**
- A6: the named error is right, but with the series loaded `new Scene().addBody(sun).addBody(saturn).setTimeline({1945..1946}).toDefinition()` now **throws synchronously** (before the repair a plain planet reached only `prepare`). `mount()` calls `toDefinition()` through `prepareScene` (`api/prepared.ts:13`) outside any promise, so `mount(element, scene)` itself throws instead of returning a handle whose `ready` rejects. Cause: `#planetRead` (`api/scene.ts:561`) calls `#checkPlanetSpan` up front at the three `toDefinition` call sites (`:689`, `:691`, `:699`), including the fit read and group layers that a plain planet passes through. **Issue.** (`AstraeusScene` catches the throw and calls `onError`, so the React path is unaffected.)
- A8: `npm run check:node-consumer` **fails**, 1 of 4: "a 1979 journey: Saturn orbit line, pacing and span provenance on the packed package (O-047)" at `consumer.test.mjs:44`, `expect(early.toDefinition().prepare()).rejects...` gets a synchronous `SceneError` from `toDefinition` (`#planetRead` <- `Scene.toDefinition`). The line-42 assertions (Saturn line, pacing, spans) pass. Rerun: same failure. Not load-related. **Issue.** The executor's note lists lint, typecheck, build and test only; the repo's own `dataSpans.test.ts` wraps both calls in `Promise.resolve().then(...)`, which accepts either surface, so it could not see this.

## Gates (fresh, HEAD 4355fa1f, 2026-10-31 UTC, Node v24.16.0)

| Gate | Result |
|---|---|
| `npm run test:full` 03:59:51-04:00:57 | **pass** first run, 155 files, 1989 passed, 1 skipped; statements 91.69%, branches 86.35%, lines 94.28% |
| `npm run lint`, `typecheck`, `build` | pass |
| `npm run check:engine-alone` | pass (16 s) |
| `npm run check:pack` | pass: astraeus 458 files (460), Saturn 53.46 MB (59), Uranus 40.63 (45), Jupiter 30.90 (34), Neptune 18.54 (20.5) |
| `npm run check:node-consumer` | **FAIL** 1 of 4, twice (A8) |
| `npm run measure:example` | first open 1,607,952 B raw, 457,776 gzip (matches the refreshed README and CHANGELOG) |
| `git diff --check main...HEAD` | clean |
| `npm run check:browser` (once) 04:03:22 | **pass**, 8 steps exit 0, 0 error lines, 170 s; `docs/evidence/browser-20261031T040322Z`; logs `/tmp/astraeus-check-logs-0MPwfN`; smoke includes `synthetic-journey` and `synthetic-probe` desktop and phone |

No load-induced timeouts this run.

## Code Health

`savepoint health check O-047 .` after the full gate: snapshot `sha256:884a8fcf...d5fa` (created), "Code Health does not block clearance"; no finding in complexity, coverage, vulnerabilities, duplication or tests.

## Owner Decisions Assessed

No structured `owner_validation.accepted_check` or `exception` exists on O-047, so no `carried_forward` entries. The prose decisions stand and their scope is unchanged by the repair: T-200 package sizes (pack figures identical), T-203 Jupiter page raw limit 7,160,000 (`public-build-assets` passes), T-203 owner look (the repair changes no visuals). Eight Task-check waivers stand.

## Issue (recorded on existing I-110; no new ID)

**I-110 regression: a plain planet outside the series now throws from `toDefinition()` / `mount()` instead of rejecting `ready`, and `check:node-consumer` fails.** Violates the release gate `check:node-consumer` (scope lock item 1, row 18) and the T-195 contract as written in CHANGELOG ("fails once, as `ready` rejecting at mount"). Scenario: load the planet series (any earlier scene's `prepare`), then `mount(el, new Scene().addBody(sun).addBody(saturn).setTimeline({ start: "1945-01-01", end: "1946-01-01" }))`. Expected: a handle whose `ready` rejects with `out-of-span`; actual: `mount` throws. Missing test: one that asserts the surface (`prepare()` / `ready` rejects, `toDefinition()` does not throw), for plain, orbit and fit, series loaded. Repair, one decision: either keep the span check out of `toDefinition` (when the window is outside the series, skip the early planet reads so `prepare` throws the named error, including for orbit and fit), or decide that a synchronous throw is the contract and change the CHANGELOG line, README and the node-consumer gate to match. The first matches the documented contract and the C-126 "fails once through `ready`" wording; whichever is chosen, run `check:node-consumer` before hand-off.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-110 surface regression | Medium (any page that already loaded the series, e.g. a second scene; and the gate fails every run) | Medium (release gate red; a host using `mount(...).ready.catch` gets an uncaught throw) | Medium | Fix now: one targeted repair, then a targeted re-check |

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — no test asserts where the planet out-of-span error surfaces (`dataSpans.test.ts` accepts sync or async).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — unchanged from C-126 (`moonSystem.ts` comment names `tests/moonSpans.test.ts`; the guard is `tests/historicalMoons.test.ts`).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — unchanged from C-126 (T-200 data refit, explained).

## Owner Validation Still Needed

T-203 (`owner_validation.required: true`): once a Check is CLEAR, the owner may record `accepted_check` against it.

## Non-blocking Observations

1. With slowest-last ordering, a slow piece's ramp now always eases into a faster neighbour's interior (before, listing order decided for spans). Continuous and inside the documented rule; noted only.
2. C-126 observations 1, 3, 5 and 6 stand; 2 (stale download figures) is fixed; 4 (load timeouts) did not recur.

## Next

Convergence: this was the one full re-check; one in-scope failure remains. Per the method, one targeted repair under I-110 (executor), then one targeted re-check of rows 3 and 18 plus the full and node-consumer gates (browser run reused unless the repair touches the viewer). If that still fails, stop and ask the owner. I-112 closes as `verified` at the next CLEAR Check.
