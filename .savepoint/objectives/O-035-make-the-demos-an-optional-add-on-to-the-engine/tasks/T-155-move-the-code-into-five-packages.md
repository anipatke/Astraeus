---
id: T-155
title: Move the code into five packages
objective: O-035
status: in_progress
stage: audit
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

Builder run 2026-10-23 (moves only, nothing committed; staged by `git mv`). Five workspaces under `packages/` (`astraeus`, `astraeus-demo-apollo11`, `-showers`, `-planets`, `astraeus-site`), each keeping the old folder shape (`src/`, `data/`, `tools/`, `tests/`). 9918 pure renames, 91 renamed files with import/path edits, new root `vitest.config.ts` and five package manifests.

Homes: engine = core/assets/app/shell/synthetic/types, `settingsFields.ts`, core data, `tools/import`, `fetch-hyg-stars`, engine tests and their fixtures/helpers. Showers = `src/experiences/showers`, `data/showers`, stories perseids/geminids, `fetch-meteoroid-orbits`, `data/local`. Planets = `planets` + `jupiter-io` code, `data/planets`, stories jupiter-io and no-panels. Apollo = apollo11 code/data/story/tool. Site = `main.tsx`, html, `site/`, `public/`, `tools/site`, `tools/validate`, `vite.config.ts`. Tests: one demo plus engine goes to that demo; several demos or the site goes to the site package; engine-only to the engine.

Unclear homes (put where only users are): `apollo11/spacecraftMetrics.ts` -> engine `src/experiences/` (used by `src/synthetic` and Apollo; the engine cannot import a demo); `showers/showerChoice.ts` -> engine `src/experiences/` (generic switch chooser, used by the Planets and Showers demos); `data/stories/no-panels` -> planets (only planets name it); `vitest.setup.ts` -> engine.

Edits beyond renames: relative imports and `import.meta.glob` paths across packages; root `package.json` (workspaces, scripts dev/build/check:browser/apollo11:reconstruct/lint, name `astraeus-workspace` to avoid clashing with the engine's name), `package-lock.json`, `tsconfig.json`, `eslint.config.js`, `.gitignore`, `.savepoint/health/config.json` (`**/` prefixes), new `vitest.config.ts` (test block of the old `vite.config.ts`), `packages/astraeus-site/vite.config.ts` (outDir `../../dist`, dev route for `/data/local/`), `src/main.tsx` (story panels globbed per package, re-keyed to the old `data/stories/...` names), planet system globs (negated patterns written as full paths; `**/` ignores stopped matching once the files sit outside the vite root), `planetSystemParts.ts` key, `tools/validate/{runner,load-budget,public-build-assets,browser-smoke}.mjs`, `tools/site/assets-sections.mjs`, `tools/apollo11/run.mjs`, tests that read files by path or cwd (`domEmbedded`, `domPhone`, `venusMap`, `demoPlanets`, `planetSystems`, `assetsSections`, `homePage`, `elementsBody`, `swiftTuttle`, `publicBuild`, helper `shippedPanels`, `jupiterViewSnapshot`, which maps `/packages/astraeus/src/` back to the fixture's `/src/`).

Public build (`ASTRAEUS_PUBLIC_BUILD=1 npm run build`) vs the build of HEAD: 101 files / 26,023,331 B before; 99 files / 26,012,195 B after (-0.04%). Every file name (hash removed) matches except two: `panels-*.json` for apollo11 (9451 B) and jupiter-io (5979 B) are no longer emitted. They were never read: the Showers loader's `data/stories/*/*.json` glob used to sweep every demo's story files, now only the Showers stories; the two stories' panels are bundled with their demo code (`jupiter.js` +4.1 kB, app.js +0.5 kB). Sizes of all other files equal, bar `measuredOrbits.js` -320 B (shorter hashed names). Load budget `node packages/astraeus-site/tools/validate/load-budget.mjs dist`: all pages ok, whole build 99 files 26,012,195 B raw (limit 54,610,000). `public-build-assets.mjs dist` ok (self-proofs ok) and `public-addresses.mjs dist` ok. Dev server (`vite packages/astraeus-site`) answers /app.html, /src/main.tsx, /site/*.jpg and /data/local/gmn-iau-7.json (HTTP only, no browser).

Gates (repo root): `npm run lint` pass 3 s; `npm run typecheck` pass 4 s; `npm run build` pass 1 s; `npm test` 114 files, 1524 passed + 1 skipped (1525, same count as before) 33 s; `npm run test:full` pass 57 s (coverage-final.json, junit.xml refreshed). No browser script run, no screenshots.

Left for later steps (not done here): AGENTS.md Codebase Map/Build, `docs/BROWSER_CHECKS.md`, Design (path names); `fetchOrbitsCommand` text in `measuredOrbits.ts` still says `node tools/data/fetch-meteoroid-orbits.mjs` (now under `packages/astraeus-demo-showers/`); dev-only. Cross-package imports are relative paths (entry points come next step). Tests of one demo still import engine test helpers by relative path. `npm install` was not run (lock updated with `--package-lock-only`); `npm ci` should be tried once.

## Drift Notes

Note for Design: the repository is five packages. Reconciled in the last step of this Objective.
