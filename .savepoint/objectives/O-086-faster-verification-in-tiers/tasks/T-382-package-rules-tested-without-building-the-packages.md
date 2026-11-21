---
id: T-382
title: Package rules tested without building the packages
objective: O-086
status: planned
depends_on: []
check_waiver: {task: T-382, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T20:47:35Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: packing
planned_reads: [tools/check-packs.mjs, tools/build-packages.mjs, tools/build-example.mjs, packages/astraeus-site/tools/validate/engine-budget.mjs, packages/astraeus-site/tools/validate/public-build-assets.mjs, docs/agents/build.md]
planned_writes: [packages/astraeus-site/tests/packagePacks.test.ts, tools/check-packs.mjs, packages/astraeus-site/tools/validate/engine-budget.mjs]
---

# Package rules tested without building the packages

## Outcome

`npm test` no longer builds or packs the nine real packages or builds `examples/hello-scene`: every packaging rule (stray file, extensionless import, packed comment, peer range, chunk URL, chunk types, engine size) is proved on small constructed inputs, and the real build, pack and engine-size measurement run only in `npm run check:pack`, which proves on its own run that it still fails a planted stray file and a planted extensionless import (AH-31; Claude audit I.2/I.6, Gemini S-07).

## User Check

None visual. `npm test` is faster; `npm run check:pack` still passes and prints its self-proof lines.

## Done When

- `packages/astraeus-site/tests/packagePacks.test.ts` calls none of `checkPacks()`, `checkPacks({ build: false, ... })`, `buildExample(...)` or `checkEngineBudget()` against a real `dist`, and writes nothing under any `packages/*/dist` (today it plants files in `astraeus/dist` and `astraeus-data-pluto/dist`; Claude audit I.2 "Unit tests mutate real build output").
- Each rule the file proves today is still proved in it, on a constructed input in a scratch folder (`mkdtempSync`) or a string: stray files (`strayFiles`), extensionless imports (`extensionlessImports`), packed comments (`packedComments` and the per-file problem), stale data-package `astraeus` peer and short React peer, chunk URL without `?no-inline` and a missing `chunks.d.ts`, and the engine budget's over-limit and one-byte-below cases (`checkEngineBudget({ exampleDir, limit })` on a constructed example `dist`). The case "the packed engine holds the ring facts ... (named case, on the packed build)" (~279) reads the real build: its packed-build half moves into `check:pack` (which already runs `ringFactProblems`; confirm), and its planted scratch twin (~283) stays. Where a rule is reachable today only through `problemsOf`/`checkPacks`, export the narrow rule function (or let `problemsOf` take a constructed `pack` object) rather than building; record which.
- `tools/check-packs.mjs` (run as `npm run check:pack`) additionally: (a) builds `examples/hello-scene` from the dist it just built (`buildExample("hello-scene", { buildPackages: false })`) and holds it to `ENGINE_LIMIT` (moved from `packagePacks.test.ts`, I-164), and (b) runs a self-proof after the real check: copies one built package's `dist` to a scratch folder, plants a stray `src/api/planted.js` and a `src/bad.js` with `from "./chunks"`, and fails the command unless the rule functions report both (prints one `self-proof: ...` line each). The real `dist` is never modified.
- The remaining describes in the file that need no build (`astraeus-data credits (PROV-02)`, the consumer-entry checks) are unchanged.
- Timing evidence, same machine: `npx vitest run packages/astraeus-site/tests/packagePacks.test.ts` file time before and after; `npm run check:pack` wall time before and after (it will grow by the example build; record it, do not raise the limit here: draft 12 sets limits).
- The `engine-budget.mjs` header comment and `ENGINE_LIMIT` doc comment name `check:pack` (not `packagePacks.test.ts`) as where the limit is held; the number is unchanged.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-site/tests/packagePacks.test.ts` (whole file)
- `tools/check-packs.mjs` (`checkPacks` ~350, `problemsOf` ~317, the CLI block after it, and the exported rule functions)
- `tools/build-example.mjs` (the `buildExample` export and its `buildPackages` option)
- `packages/astraeus-site/tools/validate/engine-budget.mjs` (header, `ENGINE_LIMIT`, `checkEngineBudget`)

## Design References

`.savepoint/Design.md` under `Size budgets are split` (read only; it names a stale `tests/engineBudget.test.ts`, see Drift Notes).

## Guardrails

TEST-01, TEST-03, STYLE-01, STYLE-07, STYLE-10, CODE-01.

## Implementation Plan

1. Time `packagePacks.test.ts` and `npm run check:pack` as they are; record.
2. For each build-dependent case, list the rule it proves and the constructed input that proves it; write the table into Technical Evidence first.
3. Export the narrow rule functions needed (or a `pack`-object seam on `problemsOf`); no rule logic changes.
4. Rewrite the build-dependent cases on scratch inputs; keep case titles where the claim is unchanged.
5. Add the engine-budget step and the planted-file self-proof to the `check-packs.mjs` CLI path; prove it fails by temporarily disabling one rule (local edit, run, revert; record the output).
6. Re-time; run gates.

## Boundaries

No change to what any packaging rule accepts or rejects, to `LIMITS`, `ENGINE_LIMIT` or to `tools/build-packages.mjs`. `public-build-assets.mjs` still calls `checkEngineBudget` until draft 08 removes it. No docs or gate-limit edits (drafts 05, 08 and 12). No change to `.github/workflows/publish.yml` (O-091).

## Technical Verification

Focused: `npx vitest run packages/astraeus-site/tests/packagePacks.test.ts`; `npm run check:pack`; `git status --porcelain packages/*/dist` empty after `npm test` (dist is ignored, so also `find packages/*/dist -newer <marker>` shows no file written by the test run). Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

Design `Size budgets are split` says the engine budget is held in `npm test` by `tests/engineBudget.test.ts`; after this Task it is held by `npm run check:pack`. Coordinator reconciles Design before the Full Check (draft 12 lists it).
