---
id: T-155
title: Move the code into five packages
objective: O-035
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o035-planning-20261023}
---

# Move the code into five packages

## Outcome

The repository is an npm workspace with five packages — `astraeus` (engine), `astraeus-demo-apollo11`, `astraeus-demo-showers`, `astraeus-demo-planets` and `astraeus-site` — holding today's files, moved with `git mv`, with every root command and the public build working as before.

## User Check

None on screen. `npm test` and the public build pass from the repository root; `git log --follow` on a moved file shows its history.

## Done When

- Root `package.json` declares the workspaces; each package has its own `package.json` (demos and site `"private": true`). The engine holds `src/core`, `src/assets`, `src/app`, `src/shell`, `src/synthetic`, `src/types`, `src/experiences/settingsFields.ts` (shared, names no demo), the core data (`data/bodies`, `data/moons`, `data/ephemerides`, `data/orbits`, `data/rings`), the core importers (`tools/import/`, `tools/data/fetch-hyg-stars.*`) and their tests. Each demo holds its `src/experiences/<demo>` code, its data (`data/apollo11`; `data/showers` and `data/stories/perseids`, `geminids`, `no-panels` if the showers use it; `data/planets` and `data/stories/jupiter-io`; `data/stories/apollo11`), its tools (`tools/apollo11/`; `tools/data/fetch-meteoroid-orbits.*` and the git-ignored `data/local/`) and its tests. The site holds `src/main.tsx`, `index.html`, `app.html`, `assets.html`, `site/`, `public/`, `tools/site/`, `tools/validate/` and their tests. Root keeps lint, `tools/lint/`, shared config and `vercel.json`.
- Moves only: imports change to keep working (relative paths or the workspace package names), but no behaviour, wording or data value changes. Where a file's home is unclear, put it where its only users are and list it in Technical Evidence.
- `npm run lint`, `typecheck`, `build`, `test`, `test:full` and `check:browser` keep their names at the root (they may delegate to packages). `vercel.json` still produces the same `dist` output for the site.
- The public build's file list matches the one before the move (names may keep their hashes' shape; sizes within 1%), recorded before and after; `node tools/validate/load-budget.mjs <dist>` (at its new path) passes unchanged.
- `.gitignore`, coverage `include` paths, `tests/browserDriverGuard.test.ts` and the health config (`.savepoint/health/config.json`) follow the moves.
- The move is committed on its own before any other change (the coordinator commits; say "MOVES READY").
- Configured gates pass. No browser runs (the Full Objective Check runs `npm run check:browser` once).

## Context Files

`package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.setup.ts`, `eslint.config.js`, `vercel.json`, `.gitignore`, `.savepoint/health/config.json`, `src/main.tsx`, `tools/validate/load-budget.mjs`, `tools/validate/runner.mjs`, `tools/validate/run-browser.mjs`, `tests/browserDriverGuard.test.ts`.

## Design References

Design: Components/Codebase Map; Public site and launch (O-016); Browser checks (O-038).

## Guardrails

ARCH-01, ARCH-04, PROV-02, TEST-03; STYLE-10.

## Implementation Plan

1. Record the public build's file list and sizes and the test count before moving.
2. Add the workspace and the five package manifests; `git mv` folders per the list above.
3. Fix imports, config paths, globs (`import.meta.glob` patterns that reach `data/`), the coverage and lint paths and the health config.
4. Rebuild, compare the file list and sizes, run the gates.

## Boundaries

Moves and path fixes only; no entry-point rules (next step), no licence or credit changes (step 3), no documentation rewrites beyond paths that would otherwise break. No browser runs, no screenshots. If a move needs a behaviour change, stop and report.

## Technical Verification

Focused `npx vitest run` while moving; configured gates, public build and load budget at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Note for Design: the repository is five packages. Reconciled in the last step of this Objective.
