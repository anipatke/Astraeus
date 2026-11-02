---
id: T-253
title: Hide the Developer drawer unless the host asks
objective: O-055
status: done
depends_on: [{task: T-252, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-253, reason: 'Owner said "Mark it done and orchestrate the next one" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o055-run-20261102}, recorded_at: '2026-11-02T09:22:14Z'}
planned_by: {role: planner, session: o055-planning-20261102}
---

# Hide the Developer drawer unless the host asks

## Outcome

`mount` and `AstraeusScene` take `developerTools?: boolean` (default false): off, an outside host's viewer shows no Developer toggle or drawer and never fetches the drawer's code; on, the drawer is as today, and the demo site turns it on (O-055 Success Condition 4; review F3, D8; API-02, API-06).

## User Check

Not owner-facing as a step: the site passes the option on, so it looks as before; the examples lose the cog, which the DOM tests prove. The owner's one look is at T-258.

## Done When

- `MountOptions.developerTools` and `AstraeusSceneProps.developerTools` (`src/api/mount.ts`, `src/api/AstraeusScene.tsx`), each with a doc comment, read when the viewer is built like `address`; both pass it to `App` (`src/app/App.tsx`), which passes it to `AstraeusShell`. Off: no `DeveloperToggle`, no `.developer-tools` aside, and the lazy drawer module is never imported (a test proves the import did not happen, for example with a mocked `developerPanels` module that records loads). On: today's behaviour.
- The site (`packages/astraeus-site/src/main.tsx`) passes it on to `App`; nothing else of the site changes.
- Paths, each a row of one table-driven DOM test (new `packages/astraeus/tests/developerToolsOption.test.ts`): `mount` default; `mount` with `true`; `mount` with `false`; `AstraeusScene` default; with `true`; a React rebuild with a new `scene` keeps the value it was built with; `App` with `developerTools` as the site uses it. Each row checks the toggle, the aside and whether the drawer module loaded.
- The drawer placeholder of `packages/astraeus/tests/twoViewers.test.ts` becomes a real case per pairing: one viewer on, one off; only the first has the toggle, and toggling it does not open anything in the second.
- Existing tests that open the Developer drawer through `mount`, `AstraeusScene` or `App` pass the option; each edit recorded.
- README: the `mount` options and `AstraeusScene` props tables gain `developerTools` (checked by `apiRules.test.ts`); the "Page address" section says the "Copy view link" button is part of the Developer tools; the `setSwitches` row says a `"developer"` switch shows only when `developerTools` is on.
- **Surface recorded:** `npm run api:lock` regenerates `packages/astraeus/api-surface.lock.json` with only the two new members; CHANGELOG Unreleased gains the entry with its migration line (the Developer drawer is hidden unless `developerTools: true`); `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts` passes.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/src/app/App.tsx` under the `App` component and `developerTools`, `packages/astraeus/src/shell/AstraeusShell.tsx` under its props and the Developer toggle, `packages/astraeus/src/shell/TopBar.tsx` under `DeveloperToggle`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus/README.md` under the `mount` options table, the `AstraeusScene` props table, `scene.setSwitches` and `Page address`, `packages/astraeus/CHANGELOG.md` under `Unreleased`, `packages/astraeus/tests/twoViewers.test.ts`, `packages/astraeus/tests/developerSettingsDom.test.ts`.

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)` (Compatibility bullet, D8) and `O-053 checks (Guardrails API-01 to API-07)`; the O-055 Objective under `Architectural Considerations` (planned decisions); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F3) and the D8 decision.

## Guardrails

API-01, API-02, API-06, API-07, TEST-01, TEST-03, STYLE-02, STYLE-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Add the option on both paths and thread it to the shell; keep the drawer import behind it.
3. Site passes it on; fix tests that open the drawer.
4. Table DOM test and the two-viewer case.
5. README rows, lock, CHANGELOG; gates.

## Boundaries

The option and its threading only; the drawer's contents do not change. No address parameter for it. Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built under the O-055 run (check waived). Changed: `src/api/mount.ts` and `src/api/AstraeusScene.tsx` (the option, doc comments, passed to `App`), `src/app/App.tsx` (`developerTools` prop; drawer node named `drawer`, passed to the shell through `drawerWhen`), `src/shell/AstraeusShell.tsx` (new `DeveloperDrawer`: toggle and aside drawn only when the shell is given `developerTools` content), `packages/astraeus-site/src/main.tsx` (`developerTools` passed to `App`), README (mount options row, AstraeusScene props row, `setSwitches` row, Page address), CHANGELOG Unreleased, `api-surface.lock.json` (two new members plus the `AstraeusScene` signature text).

Entry paths to the drawer (each a row of `tests/developerToolsOption.test.ts`, 13 tests, each checks toggle, aside, `copy-link` absence and whether the drawer module loaded via a per-row `doMock` counter): mount default / true / false / `address: true` alone; mount with a `"developer"`-placed switch, default and on; AstraeusScene default / true / false; AstraeusScene with a developer switch, default; `App` as the site uses it (address + developerTools) and `App` without; plus a rebuild-with-new-scene test for both values. Two viewers: `twoViewers.test.ts` real case per pairing (3), one on and one off.

Existing tests edited (option passed so the drawer opens): `appScreenDom.test.ts` `open` (App gets `developerTools: true`); `addressDom.test.ts` `open` (same); `domPhone.test.ts` cog test and `domShell.test.ts` focus test (`mountShell({ developerTools: "Advanced readouts" })`: the shell now draws no cog without content); `apiRules.test.ts` README-lacking and invented-name replacements follow the new `address?, developerTools? })` text; `twoViewers.test.ts` duplicate-id `it.fails` split (see Drift Notes).

Gates from the repo root: `npm run lint` clean (complexity at most 20); `npm run typecheck` clean; `npm run build` ok; `npm test` 195 files, 2428 passed, 3 expected fail, 1 skipped, 6 todo; `npm run check:pack` pass; `npm run check:react-consumer` pass. The new/changed DOM test files ran 10 times in a loop: 10 of 10 clean (57 passed, 3 expected fail, 6 todo each). `apiSurface`, `apiRules` and `allowlistGrowth` tests pass inside `npm test`. No browser run, no allowlist entry added or removed, no deep-import count raised.

## Behaviour pins changed on purpose

None in scenePin / viewerLinkPin.

## Drift Notes

Record architecture deltas here; T-258 reconciles them into Design.md.

- (T-258 integration) The shell's Developer toggle and drawer are now drawn only when the shell is handed `developerTools` content; `App` hands it only when its `developerTools` option is true. Design.md's description of the Developer drawer as always present needs the option.
- (T-258 integration) The only repeated fixed element id between two default viewers was `developer-tools` (and the cog's `aria-controls`); with the drawer off it is gone, so the T-250 duplicate-id `it.fails` became a passing default-options case plus an `it.fails` for both viewers with the drawer on. T-254 still owns scoping the remaining ids and removes that `.fails`.
- (T-258 integration) `address: true` without `developerTools` reads the address but has no copy button (owner-confirmed); documented in README.
