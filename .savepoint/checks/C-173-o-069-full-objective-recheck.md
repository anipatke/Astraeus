---
id: C-173
scope: {kind: objective, id: O-069}
result: CLEAR
checked_by: {role: checker, session: o069-recheck2-20261112}
executed_session: o069-repair-20261112b
checked_at: '2026-11-12T06:15:30Z'
health_snapshot: sha256:eaa58aa3ac9a580a7523db0b2b352c300c5dd580d2eb8940356c27b545049b12
reviewed:
  base_commit: 369e76cb
  head_commit: 88a6d184
  files: [packages/astraeus/src/core/pacing.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/tests/pacing.test.ts, packages/astraeus/tests/pacingOverlaps.test.ts, packages/astraeus/tests/pacedAdvance.test.ts, packages/astraeus/tests/pacingRepairs.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: C-172
---

# C-173: O-069 Full Objective recheck (after the I-172 repair)

Fresh session; did not plan, build or repair O-069. Wrote only this record and the `verified` resolutions on I-170, I-171, I-172; probes in the session scratchpad, not the repo. Re-check under C-171's frozen scope lock (Success Conditions 1-4 as amended by the owner Decisions, T-307/T-308 Done When, I-170/I-171/I-172 Proof Needed). This is the convergence limit's targeted re-check.

## Closure map of prior Issues

- I-170: closed `verified` (C-172 probes re-run on HEAD: pass).
- I-171: closed `verified` (frozen 3,040-case cell re-run on HEAD: 0 skipped).
- I-172: closed `verified` (Proof Needed met under the owner's "Fix with the full rule").

## Checklist

- [x] Establish Scope  - [x] Freeze The Check Scope (C-171 lock reused)  - [x] Turn Acceptance Into Invariants  - [x] Build The Mandatory Coverage Matrix (C-171 matrix)  - [x] Finite External-Boundary Matrix (browser gate only)  - [x] Workflow And Side-Effect Check Lock (unchanged since C-172: the repair touches only `pacedRate`)  - [x] Matrix Completion Lock  - [x] Parallel Planning Advice (n/a)  - [x] Perform The Adversarial Pass  - [x] Re-check After Remediation  - [x] Verify File Reality  - [x] Verify Evidence And Gates  - [x] Collect Code Health Evidence  - [x] Complete The Issues Pass  - [x] Summarize Materiality  - [x] Review Code Style

## Owner decisions carried forward

- "Fix the engine to match the guide", "0.9.1, additions only": no API change (`api-surface.lock.json` untouched) — applies.
- "Ease only the switch" (05:45:43Z): ease code unchanged since C-172 — applies.
- "Fix with the full rule" (06:03:08Z): new; it defines the Success Condition 3 rule judged here and accepts the near-zone view-switch case — applies.
- T-307/T-308 `check_waiver`s: Task scope unchanged — apply.

## Coverage (independent scratch probes against HEAD `src/core/pacing.ts`)

| Criterion / cell | Result | Evidence |
|---|---|---|
| I-172 / SC3 as decided: 400 random mixes of fast spans, slow spans (touching, gapped, zero-ramp) and event rules vs an oracle written from the decision text (cruise = max of base and each fast span alone; rate = min of cruise and each slower piece easing from it) | Proven | 137 with fast spans meeting, 140 with slow spans meeting, 271 mixed; 10.0 M samples, worst \|log(rate/oracle)\| 1.0e-15 |
| Continuity at every ramp edge (non-zero ramps) | Proven | worst 1 ms either side of every edge 2.4e-5 |
| Order independence | Proven | shuffled and reversed lists, 0 differences (exact) |
| Base exact where untouched | Proven | 400/400 `=== base` |
| SC3 literal with no fast span: minimum of each piece alone (incl. the T-307 touching-span fixture and a gap) | Proven | 300 mixes, worst 8.9e-16; C-172's touching-span cell now 5,000x at +9 h (was 1,287x) |
| Paced advance over a fast cruise span with a touching slow span, a fast span after it and rules inside (16/33/100/250/1,000 ms frames) | Proven | every slow piece fully traversed at every frame length |
| I-170 cells (C-172 probes re-run) | Proven | edge jumps under 1e-4, 20 shuffles exact, F-15 slower alone exact, base exact, synthetic journey 1985-11-25 / 1986-03-25 continuous |
| I-171 frozen cell (C-172 probe re-run) | Proven | 3,040 cases, 0 skipped; constant-paced ease shape unchanged; `k0` fill timing as C-172 |
| No existing test's setup changed by the repair | Proven | `git diff c2a9d687..HEAD -- packages/astraeus/tests`: additions only (new spans test in `pacing.test.ts`, new `pacingOverlaps.test.ts`) |
| SC1, SC2, SC4, T-307/T-308 Done When (as amended) | Proven | suites green; README "Paced playback", CHANGELOG `## Unreleased` (two Fix entries) and Design `Journeys across years` / views item (3) state the decided rule; C-172's stale `story.ts` comment fixed |

## Gates

- `npm run test:full`: pass, 252 files, 3,752 passed, 2 skipped (68 s).
- `npm run check:engine-alone` pass (23 s); `npm run check:pack` pass (19 s); `npm run check:node-consumer` pass; `npm run measure:example` pass (first-open 1,760,713 B / 506,064 B gz).
- `git diff --check main...HEAD`: clean.
- `savepoint health check O-069`: snapshot above, "does not block clearance" (all instances optional, no finding).
- `npm run check:browser` (once): pass, 12 steps, 0 error lines, total 319 s (limit 320 s; at the limit as at C-171/C-172); evidence `docs/evidence/browser-20261112T061001Z`.

## Materiality

No Issues; no materiality actions required.

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

## Owner validation still needed

None required by the Tasks (`owner_validation.required: false`). The owner closes the Objective.

## Observations (non-blocking)

- Outside the frozen I-171 cell, C-172's wider ease probe (switch at frame 10, from-rates up to 30x cruise) still skips the zone in 213 of 2,880 cases, as it did at C-172 (ease code unchanged). Every skip is a switch at most 1.55 h before the zone, already deep in its ramp (paced 1,200x-15,000x), from a rate at least 390x faster: the near-zone switch the owner accepted in "Fix with the full rule". The distance reaches about 1.5 h rather than "about half an hour" when the clock is already slowed in the ramp; the owner may want to know.
