---
id: T-110
title: One command for the engine checks and one per demo
objective: O-034
status: done
depends_on: []
owner_validation: {required: false}
check_waiver:
  task: T-110
  reason: Owner skips per-Task checks for O-034; one Full Objective Check at the end.
  actor: {role: owner, session: o034-run-20261020}
  recorded_at: '2026-10-20T08:44:15Z'
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

Owner waiver: per-Task Check waived for O-034 (check_waiver in frontmatter); the Full Objective Check covers this Task.

Criteria:
1. Met. New `tools/validate/playwright.mjs` loads `playwright-core` (project devDependency; `PLAYWRIGHT_CORE` optional override). Every script in `tools/validate/` and `on-request/` now does `import { pw } from "./playwright.mjs"` (`../` in on-request); `browser-scale-menu.mjs` too. No script still reads `PLAYWRIGHT_CORE`.
2. Met. `run-engine.mjs` and `run-demo.mjs` (Node) with the membership lists at the top, sharing `runner.mjs`. Engine: shell, synthetic, synthetic-ring, synthetic-listed, orbit-look, plus public-build-assets and public-addresses on a scratch `ASTRAEUS_PUBLIC_BUILD=1` build. Demos: apollo (lite, phone, controls, spike02, spike03, anchor-labels, tap-focus, view-link, embedded, home-curve-fits, sky), showers (perseids, geminids light, public-showers, story-panels), jupiter (jupiter-io, moon-panel, orbit-motion). Every `run-full.sh` step is in exactly one list. npm scripts `check:engine` and `check:demo`.
3. Met. Steps run sequentially in one process.
4. Met. `docs/evidence/<set>-<UTC stamp>/` created fresh (refuses a non-empty one); logs and summary.txt only.
5. Met. `run-full.sh` removed (git rm). `docs/BROWSER_CHECKS.md` (3 lines) and the `browser-showers.mjs` comment updated; AGENTS.md line 172 still names `run-full.sh` and is left for T-113.
6. Gates: `npm run typecheck` clean; `npm run build` ok; `npm test` 78 files, 1139 passed, 1 skipped (incl. browserDriverGuard). `env -u PLAYWRIGHT_CORE npm run check:engine`: all 7 steps exit 0, 0 error lines, total 155s; evidence docs/evidence/engine-20261020T084601Z. `check:demo` not run (the Task asks for one browser run only); only the unknown-demo usage path is untested too.

Files read: those in Context Files plus the Objective; extra read: grep of PLAYWRIGHT_CORE across tools/ to find every loader line, and first lines of the demo scripts to assign them to sets.
Files changed: package.json, tools/validate/{playwright,runner,run-engine,run-demo}.mjs (new), the loader line in every other tools/validate script, run-full.sh deleted, docs/BROWSER_CHECKS.md, browser-showers.mjs comment. `runner.mjs` is not in planned_writes (shared by both runners to avoid duplicating it); driver.mjs unchanged.
Limitations: demo set membership is a first guess for T-111/T-112 to refine; engine scripts still open demos until T-111 moves them; the 155s run was on a machine possibly not idle.

## Drift Notes

Design delta for T-113: Codebase Map row for `tools/validate/` gains `playwright.mjs` (shared loader), `runner.mjs`, `run-engine.mjs`, `run-demo.mjs`; `run-full.sh` is gone; `PLAYWRIGHT_CORE` is an optional override. AGENTS.md line 172 and BROWSER_CHECKS.md still describe the tiers.

Owner closed this Task on 2026-10-20T08:49:07Z through the coordinator (structured question: "Yes, mark them done", owner authorised marking each O-034 step done once its build and tests pass). No Task Check by owner waiver; the O-034 Full Objective Check covers it.
