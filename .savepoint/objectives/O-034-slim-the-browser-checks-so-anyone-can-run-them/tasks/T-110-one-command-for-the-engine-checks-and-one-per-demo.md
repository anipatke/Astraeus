---
id: T-110
title: One command for the engine checks and one per demo
objective: O-034
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o034-planning-20261020}
planned_writes: [package.json, tools/validate/run-engine.mjs, tools/validate/run-demo.mjs, tools/validate/driver.mjs, tools/validate/run-full.sh]
---

# One command for the engine checks and one per demo

## Outcome

`npm run check:engine` and `npm run check:demo -- <apollo|showers|jupiter>` each start their own dev server, run their set's scripts one after another into a fresh evidence directory, print a one-line summary per script and a total, stop the server, and exit non-zero on any failure or console error. Scripts load the project's own `playwright-core`; `PLAYWRIGHT_CORE` is only an optional override. `run-full.sh` is removed.

## User Check

In a fresh terminal with no environment variables set, run `npm run check:engine`: it runs without pointing at any other project and prints a summary with a total time. Run `npm run check:demo -- jupiter`: only Jupiter's scripts run.

## Done When

1. Every script under `tools/validate/` (and `on-request/`) resolves `playwright-core` from the project when `PLAYWRIGHT_CORE` is unset, in one place (the driver or a tiny shared loader), not copied per script.
2. The two runners exist (Node, so they also work where bash is absent), with the set membership as a short list at the top of each runner. For now the engine list holds today's generic scripts that already use made-up scenes or no demo-specific assertions (`browser-shell`, `browser-synthetic`, `browser-synthetic-ring`, `browser-synthetic-listed`, `browser-orbit-look`) plus the licence gate (`public-build-assets.mjs`, `public-addresses.mjs` on a scratch `ASTRAEUS_PUBLIC_BUILD=1` build); the demo lists hold the demo scripts. The next step moves the rest.
3. One browser job at a time: no parallel lanes.
4. Evidence: fresh directory per run (`docs/evidence/<set>-<UTC stamp>/`), never reused; logs and `summary.txt` only, no pictures.
5. `run-full.sh` deleted; references to it in `docs/BROWSER_CHECKS.md` and scripts updated or noted for the last step.
6. Gates: `npm run typecheck`, `npm run build`, `npm test` (including `tests/browserDriverGuard.test.ts`). Run `npm run check:engine` once at handoff to prove the runner (the only browser run in this step).

## Context Files

`package.json`, `tools/validate/run-full.sh`, `tools/validate/driver.mjs`, `tools/validate/driver-guard.mjs`, `tools/validate/browser-lite.mjs`, `tools/validate/browser-shell.mjs`, `tools/validate/public-build-assets.mjs`, `tools/validate/public-addresses.mjs`, `docs/BROWSER_CHECKS.md`, `tests/browserDriverGuard.test.ts`.

## Design References

Design: Components/Codebase Map row for `tools/validate/`; "Shell layout (O-020)" (Browser driver). O-034 Confirmed Decisions 2-4 and Planned Technical Decisions.

## Guardrails

TEST-01, TEST-03; STYLE rules.

## Implementation Plan

1. Add the shared `playwright-core` loader; switch scripts to it.
2. Write the two runners and the npm scripts.
3. Delete `run-full.sh`; note doc references for the last step.
4. Gates, then one `check:engine` run.

## Boundaries

No script rewrites beyond the loader line; no app changes; no screenshots.

## Technical Verification

Configured gates and one `check:engine` run; evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record Design deltas for reconciliation in the last step.
