---
id: T-379
title: Add Prettier and make text-reading checks survive a reformat
objective: O-093
status: done
depends_on: [{task: T-370, requires: clear}, {task: T-371, requires: clear}, {task: T-372, requires: clear}, {task: T-373, requires: clear}, {task: T-374, requires: clear}, {task: T-375, requires: clear}, {task: T-376, requires: clear}, {task: T-377, requires: clear}, {task: T-378, requires: clear}]
check_waiver: {task: T-379, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T19:19:52Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: tooling
planned_reads: [tools/build-packages.mjs, tools/check-engine-alone.mjs, packages/astraeus-site/tools/validate/catalogue-lines.mjs, packages/astraeus-site/src/catalogue/page.ts, packages/astraeus/tests/layerRule.test.ts, packages/astraeus/tests/nameCheck.test.ts, tools/api-rules.mjs]
planned_writes: [package.json, package-lock.json, .prettierrc.json, .prettierignore, packages/astraeus-site/src/catalogue/sourceLines.ts, packages/astraeus-site/tools/site/api-reference.mjs, packages/astraeus-site/tools/validate/assertion-list.mjs, packages/astraeus-site/tests/gateLimits.test.ts, packages/astraeus-site/tests/migrationTable.test.ts, packages/astraeus-site/tests/shelfCatalogue.test.ts, packages/astraeus/tests/interfaceLeftovers.test.ts, packages/astraeus/tests/renamedInputs.test.ts, packages/astraeus/api-surface.lock.json]
---

# Add Prettier and make text-reading checks survive a reformat

## Outcome

Prettier is installed and configured, `npm run format` and `npm run format:check` exist, and every check that reads source as text has been proved, by a full dry-run reformat in a scratch worktree, to pass on reformatted code; any that did not is fixed here, so the reformat itself (draft 12) can be a purely mechanical commit with no logic change (AH-44: Claude F-21 "adopt a formatter in one mechanical commit"; Release.md decision 7: "Prettier, one commit", kept separate from logic changes).

## User Check

None visual. `npm run format:check` runs and lists the files the reformat will change (it is expected to fail until draft 12); every gate passes.

## Done When

- Root `package.json`: `prettier` as an exact-pinned devDependency (the newest 3.x release at least two weeks old; record the version), scripts `"format": "prettier --write --cache ."` and `"format:check": "prettier --check --cache ."`. `lint` is not changed here.
- `.prettierrc.json`: Prettier defaults (double quotes, semicolons, trailing commas `all`, LF), which match the code's current style, plus `printWidth: 120` (the line length the audits measured against). Any other option needs a recorded reason.
- `.prettierignore` limits the reformat to code: it ignores `node_modules`, `dist`, `coverage`, `docs`, `.savepoint`, `agent-skills`, `audits`, `**/data/**`, `**/tools/import/.horizons-cache`, generated files (each data package's `src/chunks.js`, `junit.xml`), and all `*.json`, `*.md`, `*.html`, `*.yml` files (generated locks, pins, fixtures and Savepoint records keep their own writers). The resulting file list (`npx prettier --list-different . | wc -l` and by package) is recorded.
- Dry run, in a scratch git worktree of this branch (never the main checkout): `npm run format`, then `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, `npm run api:lock` and `npm run api:errors` with no diff, `npm run look:lock` with no diff, `npm run check:pack`, `npm run check:engine-alone`, `npm run check:node-consumer`, `npm run check:react-consumer`, `npm run build:example`. Every failure is listed in Technical Evidence with its cause. Expected suspects: tests that read sources with `?raw` or `readFileSync` and match regexes across lines (planner's grep found about 30 such test files), `tools/build-packages.mjs` regex rewrites, and the site's catalogue source-line view (`packages/astraeus-site/src/catalogue/page.ts`, `tools/validate/catalogue-lines.mjs`).
- Each failing check is fixed in this Task, in the main checkout, so it no longer depends on line breaks or spacing (read the AST with `typescript6` where a regex spans lines, as `tools/api-rules.mjs` does; or match whitespace-insensitively). A fix must keep what the check proves: show the check still fails on its planted case. If a fix would weaken a check, or needs a test's setup to change, stop and report. Every fixed file is added to `planned_writes` in the evidence.
- The dry run is repeated after the fixes and is green; the worktree is removed.
- Gates per `docs/agents/verification.md` (on the unformatted main checkout).

## Context Files

- `package.json` (scripts, devDependencies)
- `tools/build-packages.mjs` (the source rewrites)
- `tools/check-engine-alone.mjs` (what it copies: it runs ESLint directly, not `npm run lint`)
- `packages/astraeus-site/src/catalogue/page.ts`, `packages/astraeus-site/tools/validate/catalogue-lines.mjs` (source-line display)
- Each check the dry run reports failing (logged as an extra read with reason)

## Design References

`.savepoint/Design.md` under `Components/Codebase Map` (the `tools/` row).

## Guardrails

STYLE-10, TEST-01, TEST-02, TEST-03, CODE-01.

## Implementation Plan

1. Install and pin Prettier; write the config, ignore file and scripts; record the file list.
2. Create the scratch worktree; reformat there; run the listed checks; record failures.
3. Fix each failing check in the main checkout; show each still catches its planted case.
4. Re-run the dry run until green; remove the worktree; run gates.

## Boundaries

No reformat of the main checkout (draft 12 does it). No ESLint stylistic rules and no `eslint-config-prettier` (ESLint has no style rules to turn off). Browser scripts are not run here; if the catalogue source-line view depends on line numbers, fix the check and leave the browser confirmation to the Full Check.

## Technical Verification

Focused: the dry-run command list above, then `quality_gates`. Record each check's wall time on the reformatted copy beside the current one.

## Technical Evidence

Prettier pinned at 3.9.10 (exact). 3.10.1 is the latest but is 10 days old and 3.10.0 is 11 days old, so 3.9.10 (2026-10-10) is the newest release at least two weeks old. `.prettierrc.json`: `{"printWidth": 120}` only (defaults otherwise). Scripts `format` and `format:check` added; `lint` unchanged.

Extra reads: `packages/astraeus-site/tools/site/api-reference.mjs`, `packages/astraeus-site/tools/validate/assertion-list.mjs`, `packages/astraeus/tests/*` and `packages/astraeus-site/tests/*` for each failing check (reason: dry-run failures, listed below); `examples/hello-scene/src/main.js` via publishWorkflow.test.ts.

Deviations from the planned ignore list (flagged to the owner): `*.css` (the reformat rewrote values such as `.88` to `0.88`, which broke the look lock, 16 computed-look cases and five stylesheet tests: CSS is the look and keeps its own writer), `examples` (they are documentation shown to readers and have a 100-line budget the reformat breaks: 148 lines), `.claude` (Savepoint-managed hooks), and `packages/astraeus/src/core/bodies/listedMoons.ts` (generated; a test compares it with its generator's output). 

File list after ignores: `npx prettier --list-different . | wc -l` = 726 on the unformatted main tree. By package: astraeus 525, astraeus-site 96, astraeus-demo-apollo11 25, astraeus-demo-planets 24, astraeus-demo-showers 22, astraeus-data-constellations 6, astraeus-data 2, tools 19 (the `tools/` scripts and `.d.mts`), vitest.config.ts 1, other 6 (packages/astraeus-data-* single files).

Dry run (scratch worktree of HEAD plus these changes, `npm run format`; removed afterwards). First pass with the planned ignore list: 37 failures in 14 files. After ignoring CSS/generated: 12 failures in 7 files. Causes and fixes (all in the main checkout, test setup unchanged, only how text is read):
- `astraeus-site/tests/apiSurface.test.ts`: signatures read from source text keep `;`/`,` before `}` and a leading `|` as written. Fix: `layoutFree()` in `tools/site/api-reference.mjs` (whitespace runs, `;`/`,` before `}`, leading `| `). Consequence: `api-surface.lock.json` regenerated once; six type signatures lose their leading `| ` (no meaning change; `npm run api:lock` then shows no diff on both trees). `migrationTable.test.ts` `canonical()` also strips a leading `| ` so the 0.7.0 baseline still compares.
- `browserAssertions.test.ts`: the guard text printed from the AST kept a trailing comma. Fix: `squash` in `tools/validate/assertion-list.mjs` drops a comma before `}`/`)`/`]`. Baseline fixture unchanged and still matched.
- `gateLimits.test.ts`: regex `{ name: "` across a line break. Fix: `/\{\s*name: "/`.
- `shelfCatalogue.test.ts` (6 failures) and the page's own cutter: `addPartsStatement` found the closing `]);` by indent. Fix: `src/catalogue/sourceLines.ts` matches brackets (strings and comments skipped); the test's first-part regex takes `\s*`; the "indented, so substring cannot be the check" assertion applies when the statement spans lines. New test proves one-line and many-line forms and a bracket in a string.
- `interfaceLeftovers.test.ts` (`has no class selector the interface never renders`): carriers counted only literals on the carrier's own line; `GHOST_CLASS` table became multi-line. Fix: `carrierSpans()` extends a carrier to its call or `const` statement. New planted test.
- `renamedInputs.test.ts`: `rejectRenamed(` and the scope literal on one line. Fix: split on `rejectRenamed(` and take each call's text to `;`.
- Failed only through CSS/generated/examples (so fixed by ignoring): computedLook (16), domEmbedded (2), domPhone, interfaceLook (2), viewerStyles (2), lookDrift, listedMoons, publishWorkflow.

Repeated dry run after the fixes (fresh worktree): lint, typecheck, build exit 0; `npm test` 311 files / 5073 passed (2 skipped); `api:lock` and `api:errors` no diff; `look:lock` no diff; `check:pack`, `check:engine-alone`, `check:node-consumer`, `check:react-consumer`, `build:example` exit 0. Wall time on the formatted copy (s): lint 6, typecheck 7, build 4, test 57, look:lock 8, check:pack 20, check:engine-alone 33, node-consumer 7, react-consumer 6, build:example 24. (Unformatted main: tests ~55 s; no difference beyond noise; the other steps were not timed separately on main.) The scratch worktree was removed.

Gates on the unformatted main tree: `npm run lint`, `typecheck`, `build` exit 0; `npm test` 311 files, 5073 passed, 2 skipped (one run timed out `planetChunksWindow` saturn under load, 5 s; passed alone and on rerun). Browser checks not run. `format:check` lists 726 files (expected to fail until T-381).

Planted cases: the existing planted tests of each check still pass (assertion-list, interfaceLeftovers, migrationTable, gateLimits step list vs limits file); new cases added in shelfCatalogue.test.ts and interfaceLeftovers.test.ts.

Files changed: package.json, package-lock.json, .prettierrc.json, .prettierignore, packages/astraeus-site/src/catalogue/sourceLines.ts, packages/astraeus-site/tools/site/api-reference.mjs, packages/astraeus-site/tools/validate/assertion-list.mjs, packages/astraeus-site/tests/{gateLimits,migrationTable,shelfCatalogue}.test.ts, packages/astraeus/tests/{interfaceLeftovers,renamedInputs}.test.ts, packages/astraeus/api-surface.lock.json, this Task file.

Limitations: the catalogue page's source-line view was fixed and unit-tested, not browser-confirmed (left to the Full Check). The API reference page text shows six unions without a leading `|`.

## Drift Notes

For Design reconciliation (`tools/` row): Prettier 3.9.10, `printWidth: 120`; ignore list adds `*.css`, `examples`, `.claude` and the generated `listedMoons.ts` to the planned list. Checks made layout-independent: api-reference signatures (+ migrationTable canonical, api lock), assertion-list guard text, gateLimits step regex, catalogue `addPartsStatement`, interfaceLeftovers carrier spans, renamedInputs reader.

Coordinator (orchestrate-g024-20261121): accepted the ignore-list deviations (CSS: the look lock pins its exact text; `examples`: the hello-scene line budget; `.claude` and the generated `listedMoons.ts`), each with its reason. Gates green on the unformatted tree (lint, typecheck, build; `npm test` 311 files, 5073 passed) and the scratch formatted copy green. `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
