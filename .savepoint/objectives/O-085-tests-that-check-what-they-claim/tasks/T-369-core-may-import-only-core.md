---
id: T-369
title: Core may import only core
objective: O-085
status: planned
depends_on: []
check_waiver: {task: T-369, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:50:31Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: layers
planned_reads: [tools/api-rules.mjs, packages/astraeus/src/core/stateResolver.ts]
planned_writes: [packages/astraeus/tests/layerRule.test.ts]
---

# Core may import only core

## Outcome

The core layer test lists what `src/core/` may import instead of what it may not, so an import of `api`, `shelf`, `types` or any folder added later fails it, proved by a planted violation (AH-20: Claude F-13).

## User Check

None visual.

## Done When

- `packages/astraeus/tests/layerRule.test.ts` is the subject. The `FORBIDDEN` list (line 3, which omits `api`, `shelf` and `types`) is replaced by a whitelist (PLAN.md decision 5):
  - a relative specifier from a file under `src/core/` must resolve inside `src/core/` (`layerOf(...) === "core"`);
  - a bare specifier must be on a short named list with a reason each. Today that list is one entry: `@lizard-isana/orb` and its subpaths (the astronomy library; the only bare imports in `src/core/`, planner grep). `node:` built-ins are not on it: `src/core/readBytes.ts:3` reaches `node:fs/promises` through `process.getBuiltinModule` at run time, not by import. Anything else (including `three`, `react`, `node:fs`, `astraeus/...`) fails.
- Specifiers are read as real imports, not by the current regex (`specifiers`, line ~9), which also matches text inside strings: for example `src/core/stateResolver.ts:94` has `from "${state.center}"` inside an error message, which a bare-specifier whitelist would report. Use `ts.preProcessFile(source, true, true)` from `typescript6` (already the repo's compiler API; `tools/api-rules.mjs:6`), which returns static imports, re-exports and dynamic `import("…")` with string literals, and ignores text in strings and comments. Record the import count it finds against the regex count.
- "would catch an upward import, including from a subfolder" (~38) keeps its three `layerOf` assertions, and its sample source gains the cases the old list missed: `"../api/errors"`, `"../../shelf/x"`, `"../types/orb"`, a bare `"three"`, a dynamic `import("../app/x")`, and a string `from "${x}"` inside a template literal (must not be reported). The case asserts the whitelist check reports exactly the five real violations. Its title may gain "(whitelist)".
- Planted violation in a real file, recorded and reverted: add `import type { SceneErrorCode } from "../api/errors";` to one `src/core/` file; "lets nothing under src/core/ import a layer above it" fails naming it; on HEAD the old test passes with the same plant (record both). `git diff packages/astraeus/src` empty afterwards.
- "lets src/assets/ import only src/core/, itself and Three.js" keeps its rule; it reads specifiers through the same function.
- `tests/layerRule.test.ts` stays inside the time it takes today (record before/after for the file).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/tests/layerRule.test.ts` (whole file, ~57 lines)
- `tools/api-rules.mjs` (line 6, how `typescript6` is imported; read only)
- `packages/astraeus/src/core/stateResolver.ts` (line ~94; read only)

## Design References

`.savepoint/Design.md` under `Core layers and demos`.

## Guardrails

ARCH-04, TEST-01, TEST-02, TEST-03.

## Implementation Plan

1. Plant the `api` import on HEAD; show the old test passing.
2. Switch to `preProcessFile` specifiers; add the whitelist; extend the sample case.
3. Plant again; show it failing; revert.

## Boundaries

Core whitelist only; rules for the upper layers (`app`, `shell`, `api`, `shelf`) are not in this Objective. No change to `src/`. No new dependency (`typescript6` is already a root dev dependency).

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/layerRule.test.ts`. Handoff: `quality_gates` (lint checks the test imports `typescript6` cleanly). No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

Record for Guardrails/Design reconciliation: ARCH-04's wording ("core imports nothing from assets, app, shell or experiences") is narrower than the mechanised rule now held ("core imports only core and the named libraries"); the planner decides whether to restate ARCH-04 at Full Check reconciliation.
