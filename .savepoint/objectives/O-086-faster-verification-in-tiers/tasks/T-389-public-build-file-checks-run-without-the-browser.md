---
id: T-389
title: Public build file checks run without the browser
objective: O-086
status: planned
depends_on: [{task: T-382, requires: clear}, {task: T-386, requires: clear}, {task: T-388, requires: clear}]
check_waiver: {task: T-389, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T20:47:35Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: browser
planned_reads: [packages/astraeus-site/tools/validate/public-addresses.mjs, packages/astraeus-site/tools/validate/load-budget.mjs, packages/astraeus-site/tools/validate/engine-budget.mjs, packages/astraeus-site/tests/publicBuild.test.ts, tools/time-gates.mjs]
planned_writes: [tools/check-public-build.mjs, tools/check-public-build.d.mts, package.json, packages/astraeus-site/tools/validate/runner.mjs, packages/astraeus-site/tools/validate/browser-steps.mjs, packages/astraeus-site/tools/validate/public-build-assets.mjs, packages/astraeus-site/tests/checkPublicBuild.test.ts, tools/gate-limits.json, docs/BROWSER_CHECKS.md, docs/agents/build.md]
---

# Public build file checks run without the browser

## Outcome

The two browser-free steps, `public-build-assets` and `public-addresses`, leave `check:browser` and become one build gate, `npm run check:public-build`: it makes the scratch public build and runs both file checks on it, failing on the same conditions, and leaves an evidence file on failure (AH-29/AH-30; all three audits: MOVE; Claude I.4: `public-build-assets` was the most frequent failing step and left no evidence when it failed).

## User Check

None visual.

## Done When

- `tools/check-public-build.mjs` (run by the new `package.json` script `check:public-build`) builds `packages/astraeus-site` with `ASTRAEUS_PUBLIC_BUILD=1 ASTRAEUS_ENGINE_SHARE=1` into a scratch folder (the same command and env as `runner.mjs` `startServers`; share it rather than copy it if a small export makes that possible, and record which), runs `public-build-assets.mjs` and `public-addresses.mjs` on it, prints one line per check with its time, writes `summary.txt` and each check's results to a fresh `docs/evidence/public-build-<stamp>/` whether it passes or fails, removes the scratch build, and exits non-zero if either check fails.
- `public-build-assets.mjs` no longer calls `checkEngineBudget` (draft 01 moved the engine limit to `check:pack`); every other check it makes (local-only bytes, licences, no made-up scenes, page load budgets, required pages, its `prove*` self-checks) is unchanged. Its header comment says where the engine limit now lives.
- `browser-steps.mjs` drops both steps; `check:browser` then builds the public site only for `smoke-public-showers`.
- `tools/gate-limits.json`: both step limits removed; `gates["check:public-build"]` added from measured time (three runs, slowest × about 1.4); `docs/agents/build.md`'s gate table gains the row and its gate list sentence (line 12) names it (the test checks the table). `tools/time-gates.mjs` picks it up from the file without a code change (confirm).
- `packages/astraeus-site/tests/checkPublicBuild.test.ts`: the command fails and leaves its evidence folder when a check fails (run its exported function on a planted scratch build dir with a made-up scene module name, or with an injected failing check; no real site build in the test).
- `docs/BROWSER_CHECKS.md`: the two step bullets and rows move to a short "Public build files (no browser)" note naming `npm run check:public-build`.
- Measured: `npm run check:public-build` three times (record), and `npm run check:browser -- --list` for both tiers. No browser run is needed (no browser step changed); if one is run, it follows the one-browser-job rule.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-site/tools/validate/browser-steps.mjs` (from draft 07)
- `packages/astraeus-site/tools/validate/runner.mjs` (`startServers` ~84, the public build lines ~88–95)
- `packages/astraeus-site/tools/validate/public-build-assets.mjs` (header and the main/CLI block; the `checkEngineBudget` call)
- `packages/astraeus-site/tools/validate/public-addresses.mjs` (CLI block)
- `tools/gate-limits.json`
- `docs/agents/build.md` (line 12 and the gate table)
- `docs/BROWSER_CHECKS.md` under `What it runs` and `Time limits (O-060 T-283)`

## Design References

`.savepoint/Design.md` under `Size budgets are split` (read only).

## Guardrails

TEST-01, TEST-03, STYLE-01, STYLE-07, STYLE-10, PROV-02.

## Implementation Plan

1. Write `check-public-build.mjs` around the existing two scripts (call their exported functions where they exist; spawn them otherwise, as the runner does).
2. Remove the engine budget call from `public-build-assets.mjs`.
3. Drop the two steps; add the gate, the limit, the build.md row.
4. Failure-path test; three timed runs; gates.

## Boundaries

No change to what either file check accepts or rejects (apart from the engine limit moving to `check:pack`, done in draft 01). No change to the browser scripts or driver. browser-policy.md is draft 12's.

## Technical Verification

Focused: `npx vitest run packages/astraeus-site/tests/checkPublicBuild.test.ts packages/astraeus-site/tests/gateLimits.test.ts packages/astraeus-site/tests/publicBuild.test.ts`; `npm run check:public-build`. Handoff: `quality_gates`. No browser run required.

## Technical Evidence

Pending execution.

## Drift Notes

Design `Size budgets are split` says `public-build-assets.mjs` enforces the engine limit in the browser check; after drafts 01 and 08 it is `check:pack`. Reconciled before the Full Check (draft 12 lists it).
