---
id: T-369
title: Core may import only core
objective: O-085
status: done
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

| Done When | Evidence |
|---|---|
| Whitelist replaces FORBIDDEN | `layerRule.test.ts`: `coreOffences` requires relative specifiers to resolve to `core` (or JSON in the package `data/` folder, see Deviation) and bare ones to be on `CORE_LIBRARIES` (`@lizard-isana/orb` and subpaths, with reason). |
| Real imports via `preProcessFile` | `specifiers` uses `ts.preProcessFile(source, true, true)` from `typescript6`. Count over `src/core/`: 256 by `preProcessFile` vs 258 by the old regex (the 2 extra are text in strings, e.g. `stateResolver.ts:94`). |
| Sample case extended | "would catch an upward import, including from a subfolder (whitelist)": reports exactly `../app/ephemerisProvenance`, `../../shell/a`, `../api/errors`, `../types/orb`, `three`, `../app/x` (dynamic); the template-literal `from "${x}"`, a comment import, `./body`, orb subpath and a data JSON are not reported. Three `layerOf` assertions kept. |
| Planted violation | `import type { SceneErrorCode } from "../api/errors";` added to `src/core/stateResolver.ts`: old test on HEAD PASSED (3/3); new test FAILED naming `../src/core/stateResolver.ts imports ../api/errors`. Reverted with `git checkout`; `git diff --stat packages/astraeus/src` empty. |
| assets rule kept | Same rule, reads specifiers through `specifiers`; passes. |
| Time | File run: 0.90 s before (1.54 s wall), 0.67-0.77 s after (about 0.7 s). |
| Gates | lint, typecheck, build clean; `npm test`: 303 files passed, 5037 passed, 2 skipped. No new dependency; `typescript6` import lints clean. |

Files changed: `packages/astraeus/tests/layerRule.test.ts` only.

Deviation: the first whitelist run found 19 real relative imports from `src/core/bodies/*` of `../../../data/{orbits,rings}/*.json` (packages/astraeus/data). They resolve outside `src/core/`, so the plain rule failed them. Added a named exemption (`isCoreData`): JSON files in the package `data/` folder only. Reported to the coordinator.

Limitations: `import x = require()` and non-literal dynamic imports are not seen by `preProcessFile` (none in core).

## Drift Notes

Record for Guardrails/Design reconciliation: ARCH-04's wording ("core imports nothing from assets, app, shell or experiences") is narrower than the mechanised rule now held ("core imports only core and the named libraries"); the planner decides whether to restate ARCH-04 at Full Check reconciliation.

Coordinator (orchestrate-g024-20261121): the `isCoreData` exemption (JSON in the package's own `data/` folder) is accepted: planet and moon data are core (owner, "Moon data is core") and those files hold no code. Gates green (lint, typecheck, build; `npm test` 303 files, 5037 passed). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
