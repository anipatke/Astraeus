---
id: T-127
title: A lint gate that stops a tangled function at hand-off
objective: O-037
status: planned
depends_on: [{task: T-124, requires: clear}, {task: T-125, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o037-planning-20261021}
planned_reads: [package.json, .savepoint/config.yml, tsconfig.json, AGENTS.md, tools/validate/runner.mjs, tools/data/fetch-hyg-stars.mjs, tools/data/fetch-meteoroid-orbits.mjs, tools/import/horizons-client.mjs]
planned_writes: [package.json, package-lock.json, eslint.config.js, .savepoint/config.yml, AGENTS.md, tools/validate/runner.mjs, tools/data/fetch-hyg-stars.mjs, tools/import/horizons-client.mjs]
---

# A lint gate that stops a tangled function at hand-off

## Outcome

`npm run lint` runs ESLint with a complexity limit of 20 over `src`, `tests` and `tools`, passes on the whole tree, and is the configured lint gate every Task hand-off runs.

## User Check

Run `npm run lint`: it prints nothing and exits 0. Add a throwaway function with 25 `if` branches to any file under `src` and run it again: it names that function and fails.

## Done When

1. Development dependencies `eslint`, `typescript-eslint` (parser and plugin) and nothing else are added; `eslint.config.js` (flat config) sets the TypeScript parser for `.ts`, `.tsx` and `.mjs` files, enables only `complexity` at `["error", 20]` and `max-depth` at `["error", 4]`, and ignores `node_modules`, `dist`, `coverage`, `docs`, `data`, `.savepoint` and `tools/import/.horizons-cache`. No style or formatting rules (STYLE rules stay advisory in Guardrails).
2. `package.json` gains `lint`; `.savepoint/config.yml` sets `quality_gates.lint: "npm run lint"`; AGENTS.md's Build section lists it among the hand-off gates.
3. The tree passes: after the frame and split Tasks, the remaining functions over 20 are in tools (`runStep` in `tools/validate/runner.mjs` at 27, `parseHyg` in `tools/data/fetch-hyg-stars.mjs` at 22, `headerOf` in `tools/import/horizons-client.mjs` at 20 by lizard; ESLint's own count decides). Split each by its seams (the summary-line builder out of `runStep`; the per-column readers out of `parseHyg`), behaviour unchanged and proven by the tests that import them (TEST-03: record the names). A flat dispatch table that ESLint flags may instead carry a one-line disable comment naming this Task, per the task skill's rule to leave such tables alone.
4. The run takes under 60 s on this machine; the time is recorded.
5. Gates: `npm run typecheck`, `npm run build`, `npm test`, `npm run lint`.

## Context Files

`package.json`, `.savepoint/config.yml`, `tsconfig.json`, `AGENTS.md`, `tools/validate/runner.mjs`, `tools/data/fetch-hyg-stars.mjs`, `tools/import/horizons-client.mjs`, `tests/hygStars.test.ts`, `agent-skills/savepoint-task/SKILL.md` (Acting On A Code Health Report section only).

## Design References

O-037 Confirmed Decision 3 and Planned Technical Decisions on ESLint. Design: Components/Codebase Map rows for `tools/`.

## Guardrails

CODE-01; TEST-01, TEST-03; STYLE-02, STYLE-05, STYLE-10.

## Implementation Plan

1. Install, write the flat config, add the script and the gate.
2. Run; split or annotate what it flags; rerun.
3. Time it; gates; AGENTS.md line.

## Boundaries

No formatting or import-order rules; no edits under `src` beyond what the rule flags after the earlier Tasks; no change to the health scanners (the scope Task owns them).

## Technical Verification

`npm run lint` clean on the tree; the throwaway-function probe recorded and reverted; handoff gates per AGENTS.md's Verification Policy.

## Technical Evidence

Pending execution: dependency versions, rule list, functions flagged and how each was resolved, run time, files changed.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
