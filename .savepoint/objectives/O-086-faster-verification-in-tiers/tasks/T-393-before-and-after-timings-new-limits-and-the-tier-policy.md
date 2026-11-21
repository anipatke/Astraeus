---
id: T-393
title: Before and after timings, new limits and the tier policy
objective: O-086
status: done
depends_on: [{task: T-382, requires: clear}, {task: T-383, requires: clear}, {task: T-384, requires: clear}, {task: T-385, requires: clear}, {task: T-386, requires: clear}, {task: T-387, requires: clear}, {task: T-388, requires: clear}, {task: T-389, requires: clear}, {task: T-390, requires: clear}, {task: T-391, requires: clear}, {task: T-392, requires: clear}]
check_waiver: {task: T-393, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T20:47:35Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: browser
planned_reads: [.savepoint/releases/G-024-engineering-health-repairs-for-0-10-0/Release.md, packages/astraeus-site/tools/validate/browser-steps.mjs, tools/time-gates.mjs, .savepoint/Design.md]
planned_writes: [docs/agents/browser-policy.md, docs/agents/build.md, docs/agents/verification.md, docs/BROWSER_CHECKS.md, docs/RELEASING.md, tools/gate-limits.json, packages/astraeus-site/tests/gateLimits.test.ts]
---

# Before and after timings, new limits and the tier policy

## Outcome

The Objective's speed-up is measured on one machine, before and after, back to back; every time limit is set from those measurements; and the browser and verification policy say what owner decision 1 decided: a Full Objective Check runs the quick tier, and the full tier runs at release and for Objectives that touch camera, layout, shaders, sky or packaging.

## User Check

None visual. The owner may read the timing table in this Task's evidence.

## Done When

- **Timings, same machine, back to back, nothing else running** (one browser job at a time): a scratch worktree at the O-086 base commit (the branch point after O-093's merge; `git worktree add <scratch> <base>`, `npm ci --prefer-offline` there, same Node; record versions) and the branch head. Run in this order and record wall time and result of each: before `npm test`, after `npm test`, before `npm run test:full`, after `npm run test:full`, before `npm run check:browser` (the old single command), after `npm run check:browser -- --tier quick` (twice), after `npm run check:browser -- --tier full`. Also after: `npm run check:pack`, `npm run check:public-build`, and `npm run check:gates`. A table in Technical Evidence gives each number, its evidence folder, and the saving. Remove the scratch worktree afterwards.
- **Limits** in `tools/gate-limits.json`, each the slowest measured time × about 1.4, rounded up to 5 s (O-060 rule): `browser.total` (full tier), `browser.quickTotal`, every browser step, and the gates `test`, `test:full`, `check:pack` (grew with draft 01's move) and `check:public-build`. A limit that goes up is named with its cause in evidence (planner decision 12).
- `docs/agents/build.md`: the browser gate bullet (line 10) describes both tiers, the commands, `--step`, and the measured times; the gate table rows match the file, with one added row for the quick tier (`check:browser -- --tier quick`); `gateLimits.test.ts` gains a case holding that row to `browser.quickTotal`.
- `docs/agents/browser-policy.md` (owner-approved by decision 1): the first bullet becomes **Browser tiers**: a Full Objective Check runs `npm run check:browser -- --tier quick` once; it runs the full tier instead (never both) when the Objective changes camera, layout, shaders, the sky, or packaging; a release runs the full tier. It lists what counts, as paths, so a checker can decide from the diff: camera (`packages/astraeus/src/app/` camera and controls files, `src/api/` camera requests), layout (shell and panel components and any `.css` under `packages/astraeus/src` or the site), shaders (GLSL, `onBeforeCompile`), sky (sky, constellations and star code and data, `astraeus-data-constellations`), packaging (`tools/build-*.mjs`, `tools/check-packs.mjs`, any `package.json` `exports`/`files`, `examples/`); the builder confirms each folder exists and records the final list. When unsure, run full. A Task that changes a browser script or the runner runs only the affected steps (`--step`). The other bullets stay; "one browser run per Objective Check" keeps its meaning (one tier, once).
- `docs/agents/verification.md`: one line pointing at browser-policy.md for which tier a Full Objective Check runs (no restated list).
- `docs/BROWSER_CHECKS.md`: header times, the `look-out` bullet (reads the camera from the viewer handle, draft 09), the step list against `browser-steps.mjs`, and the time table's Before/After/Limit columns.
- `docs/RELEASING.md` step 4 adds the full browser tier and `check:public-build` to what passes here before a release.
- **Design reconciliation list** for the coordinator (who edits `.savepoint/Design.md` before the Full Check): every drift note from drafts 01–11 with the Design heading and the sentence to change, or "non-architectural" with a reason. Known now: `Size budgets are split` (engine limit held by `check:pack`, not `tests/engineBudget.test.ts` or `public-build-assets.mjs`); `Current Technical State` gate times paragraph.
- `npx vitest run packages/astraeus-site/tests/gateLimits.test.ts` green; gates per `docs/agents/verification.md`.

## Context Files

- `.savepoint/releases/G-024-engineering-health-repairs-for-0-10-0/Release.md` (decision 1 only)
- `docs/agents/browser-policy.md` (whole)
- `docs/agents/build.md` (lines 5–12 and the gate table)
- `docs/agents/verification.md` (whole)
- `docs/BROWSER_CHECKS.md` under `Running it`, `What it runs` and `Time limits (O-060 T-283)`
- `docs/RELEASING.md` (step 4)
- `tools/gate-limits.json`, `packages/astraeus-site/tests/gateLimits.test.ts`
- `.savepoint/Design.md` under `Size budgets are split` and `Current Technical State`
- Drafts 01–11's Drift Notes and Technical Evidence (the measured times)

## Design References

`.savepoint/Design.md` under `Size budgets are split` and `Current Technical State`.

## Guardrails

TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Make the scratch worktree; run the timing sequence; remove it.
2. Set limits; update `gateLimits.test.ts`.
3. Rewrite the policy bullet, build.md lines, verification.md line, BROWSER_CHECKS.md, RELEASING.md.
4. Write the Design reconciliation list; gates.

## Boundaries

Docs, the limits file and its test only; no script or test-logic change. Do not edit `agent-skills/` or `AGENTS.md`. No automatic tier choice from the diff (planner decision 7; the path list is for the checker).

## Technical Verification

`npx vitest run packages/astraeus-site/tests/gateLimits.test.ts`; handoff `quality_gates`. The browser runs are the timing runs above, the last browser jobs of the Objective, never alongside another. This Objective changes packaging and browser tooling, so its own Full Objective Check runs the **full** tier once (the after-full run here may be reused only under the verification policy's reuse rule).

## Technical Evidence

Machine: WSL2 Linux 6.18, Node v24.16.0, one browser job at a time, nothing else running. Branch head after T-392 (e453c7f5 plus this Task's edits); base = `git merge-base main HEAD` = f6380874 (the line `f638087489...` the merge-base printed is the same commit, G-024 decision 8).

**Before numbers are cited, not re-measured.** A scratch worktree at f6380874 (node_modules symlinked, root and per-package) ran `npm test`: 8 files failed, 34 tests (all `astraeus-demo-showers` files plus `loadingCoverChain`: generated data absent from a fresh worktree), the environment problem earlier attempts saw. The worktree was removed. The before column uses the numbers recorded by the Tasks and C-202 (browser run `docs/evidence/browser-20261121T203751Z`, the old single command at the base).

| Command | Before (cited) | After (this Task, 2026-11-21) | Saving |
|---|---|---|---|
| `npm test` | 52.5 s (T-384, loaded machine) | 38 s, 316 files, 5116 passed, 3 skipped | about 14 s |
| `npm run test:full` | 91 s (C-202) | 55 s, same counts | 36 s |
| `npm run check:browser` (old single command) / full tier | 413 s (C-202; look-out 110, smoke 139) | 345 s, `docs/evidence/browser-20261121T214027Z`: two steps failed for outside causes (below); steps from clean runs sum to about 320 s | about 90 s |
| `check:browser -- --tier quick`, run 1 | none (new) | 129 s, `docs/evidence/browser-quick-20261121T213608Z`, green | the quick tier is 413 -> 125 s, about 290 s |
| quick, run 2 | none | 122 s, `docs/evidence/browser-quick-20261121T213822Z`, green | |
| `check:pack` | about 12 s (T-382, build/pack alone) | 22.9 s (24.2 s in T-382) | grew 11 s: the pack rules that ran in `npm test` for 27.7 s now run here |
| `check:public-build` | 2 s as the two last browser steps | 4.2 s (T-389: 4.1 to 4.3 s) | out of the browser |
| `npm run check:gates` (lint, typecheck, build, check:engine-alone, check:pack, check:public-build, node-consumer, react-consumer) | | 89 s, 0 over limit (lint 7.5, typecheck 7.4, build 3.4, engine-alone 30.5, pack 22.9, public-build 4.2, node-consumer 7.2, react-consumer 5.9) | |

The full run: `smoke` failed (exit 1, 108 s) on `showers-geminids phone`: `locator.waitFor` timed out after a burst of `net::ERR_NETWORK_CHANGED` console errors (the network changed under the browser; the same step passed in both quick runs at 44 and 46 s, and in the quick tier's smoke); `look-out` failed (exit 1, 33 s) at the known phone step 3 "turns west to Kettle" (T-391 recorded the same failure before any change). All other full-tier steps passed (synthetic-journey 77, smoke-public-showers 9, planets-phone 9, meteor-shower 18, views 21, catalogue 6, hello-scene 13, hello-react 6, hello-planets 4, hello-sky 18). The task allows each tier once, so the full tier was not rerun: the coordinator's Full Objective Check runs the full tier (this Objective changes packaging and browser tooling) and settles the full-tier total and `look-out`. The `look-out` flake is not caused by this Task.

| Done When | Evidence |
|---|---|
| Timings, same machine, before and after | table above; before cited because the scratch worktree failed on missing generated data; the worktree is removed |
| Limits from measurement | `tools/gate-limits.json`: test 65 -> 55, test:full 105 -> 80, check:pack 30 -> 35, check:public-build 6 -> 10 (4.3 x 1.4 = 6.02, rounded up to 5 s), browser total 320 -> 450 (provisional, see below), quickTotal 200 (142 x 1.4 = 199), steps: smoke 65, synthetic-journey 110 -> 115, smoke-public-showers 12 -> 15, planets-phone 25 -> 20, meteor-shower 40 -> 30, views 40 -> 30, look-out 75 -> 100, catalogue 40 -> 10, hello-scene 25, hello-react 12 -> 10, hello-planets 15, hello-sky 15 -> 35. Causes for each rise are in `docs/BROWSER_CHECKS.md` under "Time limits": the 1.4 rule with 5 s round-up; look-out is 67 to 68 s in every green run since T-391; hello-sky has run 18 to 24 s in every run (the 15 s limit was never met); `check:pack` grew when its pack rules moved out of `npm test` (T-382); total is provisional because the one full run was cut short by two outside failures: clean-step sum about 318 s x 1.4 = 445, rounded to 450. Re-run the full tier at the Full Check and adjust `browser.total` only if it measures differently. |
| build.md: both tiers, commands, `--step`, times; table rows; quick row; test case | `docs/agents/build.md` browser bullet and table (`check:browser -- --tier quick` 200 s); `gateLimits.test.ts` new assertion on that row; `npx vitest run packages/astraeus-site/tests/gateLimits.test.ts` 14 passed |
| browser-policy.md Browser tiers | first bullet rewritten with path list; folders checked to exist: `packages/astraeus/src/app` (CameraController.tsx, sceneCamera.ts, viewUp.ts, PointsView.ts, KeplerPoints.ts, dotMaterial.ts, SkyView.ts, SkyFiguresView.ts, sceneSky.ts, skyFigures.ts, skyModel.ts), `src/api` (cameraRequest.ts, planCamera.ts, viewerCamera.ts, planSkyFigures.ts, skyFigureInput.ts, skyTraceInput.ts), `src/presentation/skyTrace.ts`, `src/shell/`, 15 `.css` files under the engine and site, `packages/astraeus-data-constellations/`, `tools/build-example.mjs` and `build-packages.mjs`, `tools/check-packs.mjs`, `examples/`. No GLSL files exist; `onBeforeCompile` is not used in `packages/*/src` today (the rule stays for future ones). Unsure means full. |
| verification.md line | one bullet pointing to browser-policy.md |
| BROWSER_CHECKS.md | header times, look-out bullet (viewer handle), time table with Before/After/Limit and the cause paragraph, size-limit bullet (check:pack holds the engine limit) |
| RELEASING.md step 4 | adds `check:public-build` and the full browser tier |
| Design reconciliation list | Drift Notes below |
| Leftovers | (a) `browser-steps.mjs` `views` and `catalogue` descriptions reworded to what the steps now check; (b) `engine-budget.mjs` header: `check:pack` holds the limit; `public-build-assets` only proves the split (it still imports `proveEngineDemoSplit`); (c) limits set above |
| Gates | `npm run lint` (ESLint and Prettier) pass, `npm run typecheck` pass, `npm test` and `test:full` above; `check:gates` above |

Files changed: see the list in the hand-off. Evidence folders kept (cited): the three browser runs above; `docs/evidence/public-build-20261121T213339Z` from `check:gates` was removed (uncited).

## Drift Notes

Integration Task. Design reconciliation list for the coordinator (heading and what to change):
1. `Size budgets are split`: the engine limit is held by `npm run check:pack` only (not `tests/engineBudget.test.ts`, not a limit check in `public-build-assets.mjs`, which only proves the split) (drafts 01, 08).
2. `Current Technical State`, gate times paragraph: `npm test` about 38 s (was about 52 s), `test:full` about 55 s, `check:pack` about 23 s, `check:public-build` about 4 s, browser full tier about 320 s (quick tier about 125 s), limits per `tools/gate-limits.json`.
3. Browser check description (wherever Design names `npm run check:browser` as one command or lists its steps): two tiers; `public-build-assets` and `public-addresses` are run by `check:public-build`, not the browser (T-388, T-389).
4. Gate for Full Objective Check: quick tier by default, full tier for camera, layout, shaders, sky, packaging and releases (decision 1; `docs/agents/browser-policy.md`).
5. T-386 (Full Check runs coverage suite instead of both suites), T-383 (Apollo double run only when tools change, fixture `tests/fixtures/apollo11ToolsProven.json`), T-384 (moon data loaded only where listed; `NotLoadedError`), T-385 (constellation finder arc-extreme skip), T-387 (views and catalogue checks moved to Vitest), T-390 (camera readout from `window.astraeusHost.camera`), T-391 (polls in the driver, `waitUntil`), T-392: non-architectural (test and tool internals), unless Design names the Apollo reconstruction proof, test setup or sky check readout; then the sentence follows the Task's Drift Note.
6. Known open: `look-out` phone step 3 flake; `smoke` timing out on `ERR_NETWORK_CHANGED` in a run (environmental).

Coordinator (orchestrate-g024-20261121): accepted with the before numbers cited (a fresh worktree lacks generated data; C-202, T-382 and T-384 evidence). Limits raised are each named with their cause; time limits only warn. The full-tier red (`smoke` network burst, `look-out` phone step 3) is re-run once at the Full Check. lint, typecheck, `gateLimits` green. `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
