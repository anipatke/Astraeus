---
id: C-172
scope: {kind: objective, id: O-069}
result: NEEDS WORK
checked_by: {role: checker, session: o069-recheck-20261112}
executed_session: o069-repair-20261112
checked_at: '2026-11-12T06:00:00Z'
health_snapshot: sha256:17736e3c423ccd978c7119f43e86bbe7f40cd64d8f9537cfb7efaa076fff7ebc
reviewed:
  base_commit: 369e76cb
  head_commit: 38c05537
  files: [packages/astraeus/src/core/pacing.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/tests/pacing.test.ts, packages/astraeus/tests/pacedAdvance.test.ts, packages/astraeus/tests/pacingRepairs.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, .savepoint/Design.md]
  dependencies: []
issues: [I-172]
unmet: [O-069-SC3]
supersedes: C-171
---

# C-172: O-069 Full Objective recheck

Fresh session; did not plan, build or repair O-069. Wrote only this record, I-172, `rechecked` entries on I-170/I-171, and scratch probes (session scratchpad, not in the repo). Re-check under C-171's frozen scope lock (Success Conditions 1-4, T-307/T-308 Done When, I-170/I-171 Proof Needed).

## Closure map of prior Issues

- I-170: Proof Needed met; stays open only because this run is not `CLEAR` (its repair caused I-172).
- I-171: Proof Needed met under the owner's "Ease only the switch"; stays open only because this run is not `CLEAR`.

## Checklist

- [x] Establish Scope  - [x] Freeze The Check Scope (C-171 lock reused)  - [x] Turn Acceptance Into Invariants  - [x] Build The Mandatory Coverage Matrix (C-171 matrix)  - [x] Finite External-Boundary Matrix (browser gate only)  - [x] Workflow And Side-Effect Check Lock (frame stage: step, wrap/stop, re-apply; switch, seek, auto)  - [x] Matrix Completion Lock  - [x] Parallel Planning Advice (n/a)  - [x] Perform The Adversarial Pass  - [x] Re-check After Remediation  - [x] Verify File Reality  - [x] Verify Evidence And Gates  - [x] Collect Code Health Evidence  - [x] Complete The Issues Pass  - [x] Summarize Materiality  - [x] Review Code Style

## Owner decisions carried forward

- "Fix the engine to match the guide" and "0.9.1, additions only" (Objective Decisions): scope unchanged by the repair (no API change, `api-surface.lock.json` untouched) — applies.
- "Ease only the switch" (2026-11-12T05:45:43Z): new since C-171; applied as the I-171 acceptance shape — applies.
- T-307/T-308 `check_waiver`s: Task scope unchanged — apply.

## Coverage (independent probes, scratch harness against `src/core/pacing.ts`, the T-307 version from cc260617 and main's)

| Criterion / cell | Result | Evidence |
|---|---|---|
| I-170: continuous at every ramp edge, rule inside / touching / straddling a faster span (1 yr/s span over 26 d/s, six rules) | Proven | worst |dlog| over 2 ms at all 24 edges 1.0e-6 (T-307 version 2.64); fine scan worst 1.1e-3 per 1 s |
| I-170: order-independent | Proven | 20 shuffles, exact equality on a 5 h grid |
| I-170 / SC3: F-15 case, two slower rules | Proven | min of each alone exactly (|log| 0) with and without a span around them |
| I-170: base exact untouched | Proven | `toBe(base)` |
| I-170: shipped synthetic journey | Proven | 1985-11-25 328.37 -> 328.37 d/s, 1986-03-25 360.70 -> 360.70 d/s (T-307: 328.37 -> 30.00, 30.00 -> 360.70); worst per minute 2.0e-4 |
| SC3: pieces slower than the base whose ramps meet — spans (C-171 proven cell) | **Issue I-172** | T-307's touching-span fixture: HEAD 1,287x where the minimum alone is 5,000x; gap case 0.056 vs 0.100 x cruise. Regression from 38c05537 |
| I-171: frozen cell (76 offsets 12-40 h, ease from the first frame, frames 16/33/100/250/1,000 ms, from 5x to 10x cruise) | Proven | 3,040 cases, 0 skipped; cause `playback` covered by `pacingRepairs.test.ts` (reviewed) |
| I-171: ease in a constant-paced stretch keeps today's shape | Proven | `applyPacing` rate vs the old blend, worst |log| 3.6e-15; `pacedAdvance` area vs numeric integral 0.17% |
| `k0` filled on first use | Proven for normal flows | switch while paused fills at the frozen switch time; switch between frames fills at `last.timeUtcMs` with the rate continuous at the switch; a second switch resets and refills; `seekTo` and "auto" delete the ease; open starts no ease |
| SC1, SC2, SC4, T-308 Done When | Proven (unchanged from C-171; suites green) | `pacedAdvance`, `pacing`, `pacingViews`, `syntheticJourney`, `sceneFrame` tests pass; CHANGELOG `## Unreleased` two Fix entries; Design `Journeys across years` and views item (3) reconciled with the repair |

## Gates

- `npm run test:full`: pass, 251 files, 3,738 passed, 2 skipped (76 s).
- `npm run check:engine-alone` pass (26 s); `npm run check:pack` pass (15 s); `npm run check:node-consumer` pass (5 s); `npm run measure:example` pass (first-open 1,760,575 B / 506,063 B gz).
- `git diff --check main...HEAD`: clean.
- `savepoint health check O-069`: snapshot above, "does not block clearance".
- `npm run check:browser` (once): pass, 12 steps, 0 error lines, total 320 s (limit 320 s; at the limit, as C-171's 314 s was close); evidence `docs/evidence/browser-20261112T055418Z`.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-172 | Low: needs two spans slower than the base that touch or nearly touch (spans are mostly fast cruise stretches) | Low: a smooth extra slow-down near the meeting point, nothing skipped; the F-15 kind of error | Low | Owner decides: a narrow fix in `pacedRate` (minimum of each slow span alone, keeping I-170 continuity), or accept spans easing into one another and record it against Success Condition 3. This is the convergence limit's one remaining targeted round |

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — the touching-span case in `pacing.test.ts` was turned into rules; no test of spans meeting (I-172).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**

## Observations (non-blocking)

- A view switch that newly shows a zone the clock is already close to (0.5 h before it at 16-1,000 ms frames, 2 h at 1 s frames) still passes it unreported: the ease treats the slow-down already in force at the switch as the switch's own change, so the rate in the zone stays near cruise for the ease's first frames. This follows the owner's "Ease only the switch" and was not a frozen C-171 cell; the owner may want to know.
- `packages/astraeus/src/api/story.ts` line 270 comment still says `pacedRate` lays the zones fastest first (now only spans are laid; rules take the minimum).
