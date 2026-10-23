---
id: T-156
title: Let demos and the site use the engine only through its front door
objective: O-035
status: done
depends_on: [{task: T-155, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o035-planning-20261023}
check_waiver:
    task: T-156
    reason: 'owner chose no per-step checks, one Full Objective Check at the end of O-035; quote: "Same as O-030 (Recommended)"'
    actor:
        role: owner
        session: owner-run-rules
    recorded_at: "2026-10-23T04:20:23Z"
---

# Let demos and the site use the engine only through its front door

## Outcome

The engine declares its entry points in its `package.json` `exports`; the demos and the site import it only through `astraeus` and those entries, and a fast test fails any import that reaches inside another package or any engine import of a demo or the site.

## User Check

None on screen. `npm test` includes the boundary test; break it on purpose (a deep import) and see it fail, then revert.

## Done When

- `astraeus`'s `package.json` `exports` lists the entries the demos and site use today, grouped plainly (for example the scene app and definition types, core, assets, shell, synthetic scenes), each with its types; the entries are exactly what is in use, no more (STYLE-05). O-036 designs the small public API; this step only declares today's doors.
- Every demo and the site import the engine through `astraeus` or `astraeus/<entry>`; no relative path crosses a package folder. Demos do not import each other or the site.
- A fast test (`tests/packageBoundaries.test.ts` or in the engine's tests) reads every source import in every package and fails a cross-package relative path, an engine import of a demo or the site, and a demo-to-demo import; it is proven with made-up offending files in a temp folder (ARCH-03).
- Configured gates pass; the public build and load budget pass unchanged. No browser runs.

## Context Files

The five `package.json` files from the previous step, `tsconfig.json`, `vite.config.ts`, the site's entry `main.tsx`, `src/app/experienceDefinition.ts` (at its new path), and the previous step's Technical Evidence.

## Design References

Design: Experience plug-in boundary; Components/Codebase Map.

## Guardrails

ARCH-01, ARCH-03, ARCH-04, TEST-01, TEST-03; STYLE-05, STYLE-07.

## Implementation Plan

1. List every import that crosses a package from the previous step's moves.
2. Declare the entries; switch those imports to the package name.
3. Write the boundary test with its made-up offenders.
4. Gates, public build, load budget.

## Boundaries

No new API, no renames of engine functions, no behaviour change. No browser runs, no screenshots.

## Technical Verification

Focused `npx vitest run`; configured gates, public build and load budget at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Builder run 2026-10-23 (nothing committed). Extra reads: none beyond the Context Files and the scan of every package's imports (script in scratchpad, not committed).

Engine entries (`packages/astraeus/package.json` `exports`, grouped): `./app/*`, `./assets/*`, `./core/*`, `./experiences/*`, `./shell/*`, `./synthetic/*` (each to `./src/<group>/*.ts`); `./data/*`; `./tests/*` (test helpers the demos' tests use); explicit entries for the `.tsx`/non-code files in use: `./app/App`, `./app/CameraController`, `./app/DebugOverlay`, `./app/style.css`, `./assets/stars/hyg-v42-naked-eye.json`, `./shell/{AstraeusShell,MetricVisual,MoonFamilyPanel,ScaleControl,StoryPanelView,SwitchControl}`, `./tools/import/test-io.mjs`. Demos declare `./experiences/*` and `./data/*` (apollo11 plus `./experiences/apollo11/apollo11Definition`; planets plus `./experiences/planets/surfacePlace.mjs`; showers plus `./tests/*` and `./tools/data/fetch-meteoroid-orbits.mjs`), because the site imports the demos by name too. The site declares none. No `types` condition: each target is the `.ts(x)` source, which is its own type. The group entries are patterns, so they admit more modules than are in use today (a pattern per group, not one line per module); O-036 narrows them to the public API. The boundary test also checks that each used entry matches an export and points at a real file.

Imports: 534 specifiers in 82 files switched from relative paths to `astraeus/<entry>` or `<demo>/<entry>` (static, dynamic, `vi.mock`, `?raw`); plus `planetDefinition.test.ts` (a templated dynamic import became three named ones). Each of demos and site now lists its workspace dependencies in its `package.json` (`"astraeus": "*"` etc.). `npm install --prefer-offline` created the five workspace links in `node_modules`; the lock gained only those dependency lines (19 insertions, 4 deletions); `npm ci --dry-run` passes.

Moved: `packages/astraeus/tests/jupiterMoonCatalogue.test.ts` to the site's tests, because it read the site's `assets.html` (an engine-to-site import). It still reads engine data by file path (`ROOT`), see below.

Left as relative on purpose (not code imports, so the boundary test does not check them): `import.meta.glob` patterns (the planets demo's `systems/*.ts` read `astraeus/data/...` bodies and ephemerides; `timeline.test.ts` and showers `elementsBody`/`swiftTuttle` tests glob engine sources; the engine's `moonOrbits.test.ts` globs `docs/evidence`), file reads by path (`jupiterMoonCatalogue.test.ts` ROOT, `publicBuild.test.ts` `vercel.json`, the Apollo report), and paths that leave `packages/` for the repository root. Vite globs cannot take a package name; a later step could pass these through the engine as data entries.

Boundary test: `packages/astraeus-site/tests/packageBoundaries.test.ts`. It reads every source file in every package, and fails (a) a relative path into another package, (b) an engine import of any other package, (c) a demo importing anything but the engine (so demo to demo and demo to site), (d) the site importing anything but the engine and demos, (e) any `package/entry` not matched by the target's `exports` or whose target file is missing (so deep `astraeus/src/...` paths fail). Proven: one test builds a scratch `packages/` folder in the OS temp folder with made-up offending files for each kind and expects the exact list of nine offences; a second accepts good imports. Proven on real code too: before the planets fix it failed on the templated `../../astraeus/data/bodies/${moon}/features.json` import. No edit-and-revert of real files was needed.

Gates (repo root): `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 115 files, 1527 passed + 1 skipped (1528; three new boundary tests); public build (`ASTRAEUS_PUBLIC_BUILD=1 npm run build`) 99 files / 26,012,195 B, identical to the step before; `node packages/astraeus-site/tools/validate/load-budget.mjs dist` all ok; `public-build-assets.mjs dist` ok. No browser runs, no screenshots. `test:full` not run (not required for this hand-off).

## Drift Notes

Note for Design: the engine's declared entries and the boundary test. Reconciled in the last step.

## Owner Exception (2026-10-23T04:20:23Z)

Done When asked for exports "exactly what is in use, no more" (135 engine entries in use). Builder declared one pattern entry per group (`./app/*`, `./core/*`, `./assets/*`, `./shell/*`, `./synthetic/*`, `./experiences/*`, `./data/*`, `./tests/*`) plus explicit non-`.ts` entries. Owner, asked by the coordinator: "Accept broad doorways (Recommended)" — O-036 narrows the public API. The boundary test still fails undeclared, deep, cross-package and demo-to-demo imports. Known limits carried to the Full Objective Check: `import.meta.glob` data paths and runtime file reads stay relative and are not checked by the boundary test.

