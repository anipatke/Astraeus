---
id: C-206
scope: {kind: objective, id: O-087}
result: CLEAR
checked_by: {role: checker, session: recheck-o087-20261122}
executed_session: orchestrate-g024-20261121 (T-394..T-401); repair-o087-c205-20261122 and orchestrate-g024-20261122 (I-196, I-197)
checked_at: '2026-11-22T02:19:15Z'
health_snapshot: sha256:f9fbccf9c56dde539c1fff1f3733854e280e9c7f7b1f6633faf7e30c6c5318f2
reviewed:
  base_commit: ab920e9d
  head_commit: 89f0deaf
  files: [packages/astraeus/src/app/OrbitSetView.ts, packages/astraeus/tests/orbitSetSync.test.ts, .savepoint/Design.md, packages/astraeus/CHANGELOG.md]
  dependencies: []
issues: []
supersedes: C-205
---

# C-206: O-087 Full Objective re-check

This is a fresh session; it did not plan, build or repair any O-087 work. It re-checks C-205's frozen scope lock against head `89f0deaf` (repair commit for I-196 and I-197). Whole-Objective diff `ab920e9d..89f0deaf`.

**Result: CLEAR.** Both Issues are repaired and proven, every gate is green on this head, and no new in-scope failure was found.

## Closure map

| Issue | State | Evidence |
|---|---|---|
| I-196 | Closed (verified) | `OrbitSetView.sync` sets `#backlog` when the budget runs out with a path `moved >= 1`; `#nothingToDo` skips only when no backlog. New `orbitSetSync.test.ts` cases (30 paths > `ORBITS_PER_FRAME` 12, 12 h step): fail on `994ce09e`'s `OrbitSetView.ts` (checked by swapping the file in, 1 failed / 7 passed) and pass on head. Independent probe (temporary, deleted): 3 play steps of 7 h, hidden 5 frames, shown, then paused syncs: idle (0 source reads) within 4 frames, every head within one fine step of its body. `orbitSetSync`, `plutoOrbitLines`, `bodySet` pass unchanged; engine size check passes. |
| I-197 | Closed (verified) | Design `### A lighter frame loop (O-087)` and CHANGELOG 0.10.0 now give `data-paths`, `data-points`, `data-body-screen` (and `data-scene` in Design) as the opt-in readouts and say `data-frames-drawn`, `data-pick-hover` and the others stay on. Matches `LayeredRender.tsx:39` (always written) and `frameDiagnostics.test.ts`. |

## Gates (this session, head 89f0deaf)

| Gate | Result |
|---|---|
| `npm run lint` / `typecheck` / `build` | pass (6 s / 8 s / 7 s) |
| `npm run test:full` | 322 files, 5159 passed, 3 skipped; 51 s |
| `npm run check:engine-alone` | 245 files, 3942 passed, 2 skipped; 30 s |
| `npm run check:pack` | pass; engine 1,836,247 B raw (limit 1,838,000), 525,636 B gzip (limit 527,000) |
| `npm run check:node-consumer` | 12 passed |
| `npm run check:public-build` | pass (4 s) |
| `npm run measure:example` | first-open 1,836,247 / 525,636 |
| `git diff --check ab920e9d..HEAD` | clean |
| `savepoint health check O-087` | snapshot above (created); "does not block clearance"; coverage and tests instances "stale" (optional; collection statement, not a finding) |
| Browser | Reused C-205's full-tier run `docs/evidence/browser-20261122T020302Z` (head 994ce09e, exit 0, all 12 steps). Browser policy: one run per Objective Check, a later check reuses it; the repair touches only `OrbitSetView.ts` (not a listed camera, layout, shader, sky or packaging path), a unit test and docs. The paused catch-up is proved in the fast suite. |

## Success conditions (re-assessed against the frozen lock)

| # | Condition | Class |
|---|---|---|
| 1 | Before/after profiles | Proven (C-205; the repair adds work only in paused frames with a backlog, which ends within a few frames) |
| 2 | Diagnostics only with the flag | Proven (unchanged since C-205) |
| 3 | Label sizes cached, arithmetic collisions | Proven (unchanged) |
| 4 | No re-render while the clock is unchanged | Proven (unchanged) |
| 5 | Orbit-line unchanged-time early-out | Proven: kept once nothing is stale (new test: 0 source reads, `computed` unchanged); T-398's existing cases pass |
| 6 | No visual change | Proven technically: the paused catch-up behaves as on main (I-196); owner look below |
| T-400 | Design reconciled | Proven (I-197) |

## Owner decisions

- **T-401 owner look** (2026-11-22T01:58:34Z, all five items passed; in T-401 Technical Evidence). Not yet recorded as `owner_validation.accepted_check`, since C-205 was not CLEAR. Carry-forward assessment: applies. The repair changes behaviour only in a sync whose time, placement and scale are unchanged while a backlog remains (a paused clock after a large step). Item 3's scope (lines while playing; hide and show) is unchanged: while playing the time changes every frame, so the early-out never applied, and hiding clears `#lastPlacement`, so showing always runs a full sync, as before. Items 1, 2 and 4 touch no repaired code. The owner need not look again; the owner records acceptance against C-206 (`accepted_check: C-206`).
- **Task-check waivers** (T-394..T-401, owner, 2026-11-21T22:11:52Z): scope unchanged; still apply.

## Re-check admission ledger

| Item | Prior claim | Frozen cell | Result |
|---|---|---|---|
| I-196 reproduction | backlog when the clock stops | C-205 matrix, orbit sets: stale backlog when the clock stops | pass |
| Early-out kept | T-398 unchanged frame | orbit sets: unchanged | pass |
| Hide/show | T-398 hidden 100 frames | orbit sets: hidden then shown | pass (also with a backlog, probe) |
| I-197 wording | Design/CHANGELOG example | T-400 Design reconciled | pass |

## Observations (non-blocking)

- Design's rewritten sentence reads awkwardly: after "cheap state attributes ... stay on and are written only when they change", the clause ": they run only when `globalThis.__ASTRAEUS_DIAGNOSTICS__` is set" grammatically attaches to the cheap attributes. The intended meaning (the costly readouts need the flag) is clear from the sentence start and the CHANGELOG; a later Design touch could move the flag clause after the opt-in list.
- C-205's observations stand (after-profile taken before the border-box repair; Saturn profile rows; one-frame-late size after a style change).

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-205 lock reused, immutable)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-205 matrix; repaired cells rerun)
- [x] Finite External-Boundary Matrix (browser run reused per policy)
- [x] Workflow And Side-Effect Check Lock (gates only)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality (every changed and cited file exists)
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality (no Issues; no materiality actions required)
- [x] Review Code Style

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
