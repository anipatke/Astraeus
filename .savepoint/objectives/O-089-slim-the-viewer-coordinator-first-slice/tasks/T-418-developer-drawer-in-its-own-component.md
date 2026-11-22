---
id: T-418
title: Developer drawer in its own component
objective: O-089
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-418, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T03:09:26Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: drawer
planned_reads: [packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/developerPanels.tsx, packages/astraeus/src/app/DeveloperSettings.tsx, packages/astraeus/src/app/SettingControls.tsx, packages/astraeus/src/app/PanelLoadBoundary.tsx, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/tests/firstOpenGraph.test.ts, packages/astraeus/tests/developerToolsOption.test.ts, packages/astraeus/tests/appScreenDom.test.ts, packages/astraeus/tests/pausedRenders.test.ts, packages/astraeus-site/tools/validate/driver.mjs, tools/measure-example.mjs]
planned_writes: [packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/DeveloperDrawer.tsx, packages/astraeus/src/app/developerPanels.tsx, packages/astraeus/tests/firstOpenGraph.test.ts, packages/astraeus/tests/developerDrawerFolds.test.ts]
---

# Developer drawer in its own component

## Outcome

The Developer drawer (its header, its eight folds and their sliders, buttons and readouts) is one component in its own file, loaded on demand as the drawer's settings already are, and `App` hands it one props object instead of building ~390 lines of drawer JSX inline (audit S4, AH-18). The drawer looks and behaves exactly as before, and the engine's first download gets smaller because that JSX leaves the first-open chunk.

## User Check

None visual in this Task (the owner looks in draft 05). Opening the Developer drawer on any site page shows the same folds, in the same order, with the same controls and values as before.

## Done When

- New `packages/astraeus/src/app/DeveloperDrawer.tsx` holds the drawer: the `hud` header, the fold list (`camera`, `timeline`, `orbit-lines`, `moons-rings`, `sky-sun`, `labels`, `phone-layout`, `under-the-hood`, each shown under today's condition), `ViewLinkGroup`, `glowColoursShown`, the orbit slider table and `copyViewLink`. Today these are in `App.tsx`: `ViewLinkGroup` ~169-184, `glowColoursShown` ~381-384, the readout interval ~968-988, `copyViewLink` ~990-1002, `orbitSliders` to `drawer` ~1113-1498 (`FPS_HISTORY` ~108 moves with the interval).
- `developerPanels.tsx` exports one on-demand `DeveloperDrawer` (`lazy(() => import("./DeveloperDrawer"))`); `DeveloperDrawer.tsx` imports the settings bodies from `./DeveloperSettings` directly, so the six per-panel `onDemand` exports go away. `App` renders it inside the same `PanelLoadBoundary` and `Suspense` with the same "Loading developer tools..." fallback, and hands it through `drawerWhen(developerTools, …)` as now.
- The readouts only the drawer shows (`hud`, `frames`, `fpsHistory`, `fills`, `viewNow`) and their 250 ms interval (`App.tsx` ~968-988) move into the drawer as a hook. The drawer is mounted exactly while `developerMode` is on (`AstraeusShell.tsx` ~161-163 renders the children only then), so the interval's lifetime is unchanged. The hook starts from the live values (`readout.current`, `controls.groupFills`, `controls.viewReadout`) and restarts when `runtime` changes, as the effect does now (deps `[developerMode, runtime]`). State that must outlive a close stays in `App`: `viewLink`, `upChoice`, `timelineGlow`, `phoneLayoutOwn`, the story settings and every `…Shown` mirror the shell or the host publish reads.
- `App.tsx` gets shorter by at least the moved lines (record `wc -l` before and after). `App` keeps no drawer JSX beyond the one `<DeveloperDrawer …/>` element and its boundary.
- New table test `packages/astraeus/tests/developerDrawerFolds.test.ts`, written first and green against the current code before the move. It runs on both embedding paths (`mount` and the React `AstraeusScene`, as `developerToolsOption.test.ts` does) with `developerTools: true`, one row per made-up scene kind: with and without orbit paths, body sets or rings, sky, story panels and the address option. For each row it opens the drawer and records the fold ids and titles in order, which fold is open by default, every `data-testid` inside the drawer, and the "Copy view link" button's presence. It then moves one control per fold and checks the same value reaches the scene's live controls (`controls()` as `appScreenDom.test.ts` reads it). It also closes the drawer and checks the frame-stats readout stops (`controls().frameStats` back to null).
- `firstOpenGraph.test.ts`: the case "loads the developer panels through a dynamic import" expects `import("./DeveloperDrawer")` and still no static import in `developerPanels.tsx`, and the case "does not reach the developer panels" also lists `app/DeveloperDrawer.tsx`. These two expectations are this Task's subject (the drawer's on-demand boundary moved). No other line of that file changes.
- Existing tests pass unchanged (TEST-03): `pausedRenders.test.ts` (O-087: no `App` re-render while paused), `developerToolsOption.test.ts` (every row and "a React rebuild with a new scene keeps the value it was built with"), `developerSettingsDom.test.ts`, `domMenuAndLink.test.ts` (ViewLinkReadout cases), `appScreenDom.test.ts` ("the Developer tools" block), `domShell.test.ts` ("the developer cog …"), `twoViewers.test.ts` ("T-254: no element id repeats when both viewers show the Developer drawer and the info panel"), `lifecycle.test.ts` (both drivers).
- Engine size: the first-open raw total of `examples/hello-scene` goes down. Record both totals with `npm run measure:example` (builds the packages and `hello-scene` from the packed tarball, then measures; under a minute). The limit is 1,838,000 B raw / 527,000 B gzip (`packages/astraeus-site/tools/validate/engine-budget.mjs` ~20, held by `npm run check:pack`); the last recorded figure on `main` is 1,836,426 B raw / 525,714 B gzip (C-208), so about 1.6 KB of headroom is shared with O-092 (about 900 B planned). If the total does not fall, stop and report (the move is meant to free headroom for draft 03).
- Handoff gates are focused (builder rule 7): `npm run typecheck`, ESLint and `prettier --check` on the changed files, and the Technical Verification test list. No full `npm test` or `npm run lint` (the coordinator runs the full gate once per wave).

## Context Files

- `packages/astraeus/src/app/App.tsx` (lines ~165-185, ~370-385, ~495-590 for the state the drawer reads, ~965-1003, ~1110-1498, and the `<AstraeusShell>` element ~1501-1574). O-087 is merged: its 100 ms clock interval (~741-753, keeps the snapshot while the clock is unchanged) is not drawer code and stays in `App`.
- `packages/astraeus/src/app/developerPanels.tsx`
- `packages/astraeus/src/app/DeveloperSettings.tsx` (exports and prop types only)
- `packages/astraeus/src/shell/AstraeusShell.tsx` (`DeveloperDrawer` wrapper ~145-167 and its use ~885)
- `packages/astraeus/tests/firstOpenGraph.test.ts`
- `packages/astraeus/tests/developerToolsOption.test.ts` (how both paths are mounted)
- `packages/astraeus/tests/appScreenDom.test.ts` (the `controls()` probe and "the Developer tools" block)
- `packages/astraeus-site/tools/validate/driver.mjs` (the developer drawer section ~382-420: `[data-developer-panel] [data-fold-toggle]`, the `Developer mode` button and `.developer-tools`, which the browser scripts rely on; read only)

## Design References

`.savepoint/Design.md` under `Good guest` (item 3, Developer tools loaded only when asked) and `Size budgets are split`; `docs/architecture/viewer-interface.md` under `9. Module structure and contributor guide`.

## Guardrails

API-02, API-03, ARCH-02, TEST-01, TEST-03, STYLE-01, STYLE-07, STYLE-10, CODE-01.

## Implementation Plan

1. Measure the first-open total (`npm run measure:example`) and `wc -l App.tsx` on the base (1,574 lines at `fcde39b5`).
2. Write `developerDrawerFolds.test.ts` against the current code and see it pass on both paths.
3. Create `DeveloperDrawer.tsx` with a header comment (its one job; it must not decide the drawer's place, which the shell's `developer` area does). Move the fold list and helpers. Give it one typed props interface, grouped by fold (camera, timeline, orbit, moons and rings, sky and Sun, labels, phone layout), carrying `controls`, `readout`, `runtime` and the values and setters it uses. Prefer passing a setter that already writes both the live control and its mirror (as `setOrbit`, `changeSetLook` and `changeRing` do) over passing the pair separately.
4. Move the readout state and interval into a hook inside the drawer file.
5. Switch `developerPanels.tsx` to the one lazy export and update the two `firstOpenGraph` expectations.
6. Remove the moved code and unused imports from `App.tsx`; run `npm run format`.
7. Focused tests, the size measurement again, then gates.

## Boundaries

No change to any fold's title, id, order, default-open rule, control label, `aria-label`, `data-testid`, range, step or display format, and no change to `DeveloperSettings.tsx`'s bodies or to the shell. No new public option. The mirrored settings state stays in `App` (taking it out is a later slice, not this Task). No selection change (draft 03). No browser run (`docs/agents/browser-policy.md`: the DOM tests pin the drawer; draft 04 runs the tiers). If draft 04's run shows a browser script broke because of this Task, the fix (in `driver.mjs` only) comes back to this Task.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/developerDrawerFolds.test.ts packages/astraeus/tests/firstOpenGraph.test.ts packages/astraeus/tests/developerToolsOption.test.ts packages/astraeus/tests/developerSettingsDom.test.ts packages/astraeus/tests/domMenuAndLink.test.ts packages/astraeus/tests/appScreenDom.test.ts packages/astraeus/tests/domShell.test.ts packages/astraeus/tests/twoViewers.test.ts packages/astraeus/tests/lifecycle.test.ts packages/astraeus/tests/pausedRenders.test.ts`. Size: `npm run measure:example` before and after. Handoff (builder rule 7): `npm run typecheck`; `node --require ./tools/lint/use-typescript6.cjs node_modules/eslint/bin/eslint.js <changed files>`; `npx prettier --check <changed files>`; the focused list above. No full `npm test`/`npm run lint`.

## Technical Evidence

Pending execution.

## Drift Notes

Expected: `viewer-interface.md` section 9 and Design `Good guest` item 3 name where the drawer lives. Reconciled in draft 04 ("Slice pattern written down and Design brought up to date").
