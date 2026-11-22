---
id: T-435
objective: O-090
title: One place for how to run the checks
status: planned
depends_on: [{task: T-434, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-435, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T05:30:31Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
lane: docs
planned_reads: [docs/README.md, docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, docs/agents/verification.md, docs/agents/build.md, README.md, packages/astraeus-site/tests/gateLimits.test.ts, packages/astraeus-site/tools/validate/run-browser.mjs]
planned_writes: [docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, docs/agents/verification.md, docs/agents/build.md, README.md, packages/astraeus-site/tests/gateLimits.test.ts, docs/README.md]
---

# One place for how to run the checks

## Outcome

Owner plan step 2. The root README's checks section gives the shortest local invocation and links on; the browser policy keeps tier selection; `docs/BROWSER_CHECKS.md` is trimmed to what each class of check protects, how to diagnose a failure, and where the runner, limits and results live, keeping the retired-scenario → replacement mapping only where it explains coverage. Copied elapsed-time claims ("under a minute", "230 s", "about 320 s") are removed or replaced by one dated, labelled measurement that points to its evidence; time limits (thresholds) have one maintained source, kept distinct from observations. A short "how to find the latest run's evidence" instruction exists in one place. Any test that reads a doc table (`gateLimits.test.ts` reads the BROWSER_CHECKS limit table) still passes, or now reads the source of truth instead, consistent with O-088's outcome checks.

## User Check

From the root README, a maintainer finds the command, what it covers, and a measured result in at most one link.

## Done When

| Item | Evidence |
|---|---|
| Every browser/verification contradiction in the T-434 list fixed | before/after table |
| No undated elapsed-time claim left in README, BROWSER_CHECKS, browser-policy, verification, build (grep for seconds/minutes reviewed) | grep output |
| One maintained source for time limits, named in `docs/README.md` | file + test |
| Evidence-lookup instruction present (one place) | file |
| `gateLimits.test.ts` green; if its doc-table read is kept, the reason is recorded; existing test setup unchanged (new cases allowed) | vitest run |
| Before/after word counts of edited files | wc -w |

## Context Files

T-434 Technical Evidence (contradictions + consumed material); `docs/README.md`; `docs/BROWSER_CHECKS.md`; `docs/agents/browser-policy.md`; `docs/agents/verification.md`; `docs/agents/build.md`; `README.md` under `Running the checks` and `Develop`; `packages/astraeus-site/tests/gateLimits.test.ts`; `packages/astraeus-site/tools/validate/run-browser.mjs` (tiers, limits, where results are written).

## Design References

Design `Verification in tiers (O-086)`.

## Guardrails

PROV-01, PROV-02 (provenance labels kept); TEST-01..04; ARCH-06 (mechanise a trap where cheap).

## Implementation Plan

1. Read the runner to confirm tiers, step list, limit source and evidence output path.
2. Rewrite BROWSER_CHECKS.md around: running it (link to policy), what each class protects, diagnosing, where things live, retired mapping (trimmed), evidence lookup.
3. Trim duplicate tier/timing prose in verification.md, build.md and browser-policy.md to links; the policy keeps tier selection.
4. README `Running the checks`: the shortest commands and one link.
5. Keep or redirect the limit-table test; run it.

## Boundaries

No change to runner behaviour, tiers, limits or browser steps. Evidence folders untouched. AGENTS.md and CLAUDE.md untouched.

## Technical Verification

`npx vitest run packages/astraeus-site/tests/gateLimits.test.ts`; prettier on changed files; typecheck and eslint if the test changes.

## Technical Evidence

Pending execution.

## Drift Notes

Pending.
