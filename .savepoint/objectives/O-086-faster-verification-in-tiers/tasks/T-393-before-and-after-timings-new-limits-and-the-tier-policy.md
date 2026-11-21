---
id: T-393
title: Before and after timings, new limits and the tier policy
objective: O-086
status: planned
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

Pending execution.

## Drift Notes

Integration Task for this Objective's deferred Design notes (Astraeus Project Rules, Deferred Design reconciliation).
