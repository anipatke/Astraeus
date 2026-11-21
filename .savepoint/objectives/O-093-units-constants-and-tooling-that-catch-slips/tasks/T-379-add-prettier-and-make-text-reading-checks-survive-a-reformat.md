---
id: T-379
title: Add Prettier and make text-reading checks survive a reformat
objective: O-093
status: planned
depends_on: [{task: T-370, requires: clear}, {task: T-371, requires: clear}, {task: T-372, requires: clear}, {task: T-373, requires: clear}, {task: T-374, requires: clear}, {task: T-375, requires: clear}, {task: T-376, requires: clear}, {task: T-377, requires: clear}, {task: T-378, requires: clear}]
check_waiver: {task: T-379, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T19:19:52Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: tooling
planned_reads: [tools/build-packages.mjs, tools/check-engine-alone.mjs, packages/astraeus-site/tools/validate/catalogue-lines.mjs, packages/astraeus-site/src/catalogue/page.ts, packages/astraeus/tests/layerRule.test.ts, packages/astraeus/tests/nameCheck.test.ts, tools/api-rules.mjs]
planned_writes: [package.json, package-lock.json, .prettierrc.json, .prettierignore]
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

Pending execution.

## Drift Notes

For Design reconciliation (`tools/` row): Prettier config and scope; list of checks made layout-independent.
