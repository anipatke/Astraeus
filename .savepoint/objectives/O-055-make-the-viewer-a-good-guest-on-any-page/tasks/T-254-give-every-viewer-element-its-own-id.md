---
id: T-254
title: Give every viewer element its own id
objective: O-055
status: done
depends_on: [{task: T-253, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-254, reason: 'Owner said "Mark it done and orchestrate the next one" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o055-run-20261102}, recorded_at: '2026-11-02T09:30:32Z'}
planned_by: {role: planner, session: o055-planning-20261102}
---

# Give every viewer element its own id

## Outcome

Every element id the viewer writes in `src/shell/` and `src/app/` is made per viewer with `useId`, and every `aria-controls` / `aria-labelledby` follows its target, so two viewers on one page never repeat an id; the 35 component `id` entries of the O-053 isolation allowlist go (O-055 Success Condition 5; review F3; API-03).

## User Check

Not owner-facing: ids are invisible, and tests and the browser driver now find parts by role, label or class. The owner's one look is at T-258.

## Done When

- Each `id` entry of `packages/astraeus-site/tests/apiIsolation.allowlist.json` whose site is in a `.tsx` file (35 entries: `app/App.tsx`, `app/DeveloperSettings.tsx`, `app/FrameRateSection.tsx`, `app/SettingControls.tsx`, `shell/AstraeusShell.tsx`, `shell/ControlsDrawer.tsx`, `shell/InfoPanel.tsx`, `shell/MoonFamilyPanel.tsx`, `shell/ObjectControls.tsx`, `shell/StoryPanelView.tsx`, `shell/TimelineBar.tsx`, `shell/TopBar.tsx`) is fixed with a name bound to `useId()` (the form `tools/api-rules.mjs` `idLiteralBreaks` recognises) and removed from the allowlist in the same change. An id shared across components (for example `info-panel`, used by `ObjectControls`, `TimelineBar` and `InfoPanel`; `developer-tools`, used by `TopBar` and `AstraeusShell`) is made once in the nearest common owner and passed down, so a pair never drifts. The `shell/bootLoader.ts` entry stays for T-255. `idLiteralBreaks()` lists only that entry.
- Each pair of an `aria-controls` / `aria-labelledby` and its target, listed in one table in a new test (`packages/astraeus/tests/viewerIds.test.ts`), resolves inside the same viewer after render (the reference names an element that exists and is inside this viewer's `.astraeus-shell`), for every pair the 35 entries cover, through `mount`, `AstraeusScene` and `App`.
- The id-repeat case of `packages/astraeus/tests/twoViewers.test.ts` passes for every pairing (its `it.fails` marker removed), with both viewers' info panel, story panel, moons panel, drawers and Developer drawer (`developerTools: true`) open where a case can open them.
- Tests that found parts by fixed id (`domShell`, `domPhone`, `displaySwitches`, `appScreenDom`, `publicApiStory`, `hostPageDom`, `developerSettingsDom`, `packages/astraeus-demo-planets/tests/domMoonPanel.test.ts`, `packages/astraeus-site/tests/homePage.test.ts`, and any other found) use role, accessible name, class or `data-*` within the viewer instead; each file edited is listed. `packages/astraeus-site/tools/validate/driver.mjs` finds the info panel by class or role within the viewer instead of `#info-panel` (one place, per the browser policy); `browserDriverGuard.test.ts` passes. No browser run here: the Full Objective Check's one `check:browser` proves the driver.
- **Nothing public moved:** `git diff --exit-code -- packages/astraeus/api-surface.lock.json` is empty; `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts` passes (the allowlist only shrank). A new id break the scan finds that is not one of the 35 is fixed, not added; a break that cannot be fixed here stops the step for an owner decision (no allowlist addition without owner approval).
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus-site/tests/apiIsolation.allowlist.json`, `tools/api-rules.mjs` under `idLiteralBreaks` and `isFixedId`, the 12 component files named in Done When, `packages/astraeus/tests/twoViewers.test.ts`, `packages/astraeus-site/tools/validate/driver.mjs` under its info-panel lookups, `docs/agents/browser-policy.md`.

## Design References

`.savepoint/Design.md` under `O-053 checks (Guardrails API-01 to API-07)`; the O-055 Objective under `Success Conditions`; `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F3).

## Guardrails

API-03, TEST-01, TEST-03, ARCH-06, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Run `node tools/api-rules.mjs ids`; group the 35 by the element pair they name.
3. Make each id with `useId` in its owner; pass shared ones down; remove each allowlist entry as it is fixed.
4. Move the tests and the driver off fixed ids.
5. Pair table test; flip the two-viewer id case; gates.

## Boundaries

Ids only; no markup or look change beyond the id values. `bootLoader.ts` is T-255. Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). The driver change is proven by the Full Objective Check's one `npm run check:browser` (owner run rules: no browser run per step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Extra reads (path, reason): `packages/astraeus/src/shell/Collapsible.tsx` and `src/app/SettingControls.tsx` (their `id` props were what the scan flagged for the fold and setting-group call sites), `packages/astraeus/tests/domSetup.ts` and `developerToolsOption.test.ts` (to build the new test on the same stand-ins), `docs/agents/browser-policy.md` (Context File).

Changes. Ids made with `useId` in the nearest owner: `AstraeusShell` makes the info panel id once and passes it to `InfoPanel` (`id`), `TopBar` -> `ObjectControls` and `TimelineBar` -> `TimelineExpanded` (`infoPanelId`); `DeveloperDrawer` makes the drawer id and passes it to `DeveloperToggle` (`drawerId`); `MoonsSheet`, `ControlsDrawer`, `TimelineBar` (drawer), `InfoPanel`/`StoryPanelView` (title) make their own. `Collapsible`'s `id` prop is now `fold` (it was a storage key and `data-fold` hook, never a DOM id; the DOM ids were already `useId`) and `SettingGroup`'s `id` is now `name`, drawn as `data-setting-group` with a `useId` title id. New `HudSection` (SettingControls.tsx) draws the three developer-drawer sections' per-viewer heading ids (`App` sections, `FrameRateSection`, Scene instrumentation). 35 allowlist entries removed (`apiIsolation.allowlist.json` 425 -> 390; only the `bootLoader.ts` `#boot` lookup remains for T-255). `node tools/api-rules.mjs ids` lists only that entry.

Entry paths covered (each in the table tests): `mount`, `AstraeusScene`, `App` (default synthetic definition); wide screen and phone; info panel, story panel, Developer drawer with every fold open, controls and timeline drawers (phone), moon sheet and moon list (shell with a moon list, wide and phone).

Tests moved off fixed ids (class / `data-*` within the viewer): `domShell`, `domPhone`, `displaySwitches`, `appScreenDom`, `publicApiStory`, `hostPageDom`, `developerSettingsDom`, `developerToolsOption`, `twoViewers`, `packages/astraeus-demo-planets/tests/domMoonPanel.test.ts`. Updated for the renamed props: `collapsible`, `domPhone` (Collapsible `fold`), `infoCards` (`id`), `timelineMarkerGroups` (`infoPanelId`). `packages/astraeus-site/tests/homePage.test.ts` looks up the demo site's own page nodes (`fit-data`, `fit-photos`, `fit-recipe`), not a viewer part, so it is unchanged. Driver (`packages/astraeus-site/tools/validate/driver.mjs`): `#info-panel` -> `.info-panel` (HOOK.infoPanel, infoClose, the five other uses) and `button[aria-controls="moons-panel"]` -> `button.moons-toggle` (two places); `browserDriverGuard.test.ts` passes. No browser run.

| Done When | Evidence |
|---|---|
| 35 `.tsx` id entries fixed with `useId`, removed from the allowlist; shared ids made once in the common owner; bootLoader entry stays; `idLiteralBreaks()` lists only it | `node tools/api-rules.mjs ids` prints only `shell/bootLoader.ts: document.getElementById("boot")`; allowlist 425 -> 390 (35 removed, pure deletion); `apiRules`, `apiSurface`, `allowlistGrowth` tests pass inside `npm test` |
| aria pairs resolve inside the same viewer, one table, through mount, AstraeusScene, App | `packages/astraeus/tests/viewerIds.test.ts` (APP_PAIRS, MOON_PAIRS, plus a sweep of every `aria-controls`/`labelledby`/`describedby`/`for` in the viewer): 16 tests pass; ran 10x with `twoViewers.test.ts`, 63 passed each time |
| twoViewers id-repeat case passes for every pairing, `it.fails` removed, both viewers with info panel, Developer drawer (folds open) | `twoViewers.test.ts`: "T-254: no element id repeats when both viewers show the Developer drawer and the info panel" over all pairings; passes (47 passed, 6 todo); marker removed. The story panel, moons panel and phone drawers are in the viewerIds table instead (the two-viewer scene has no story panel or moon list) |
| Tests find parts by role, class or `data-*`; driver finds the info panel by class; guard passes | files listed above; viewerIds test "the browser driver finds parts without ids" fails on any `#id` in driver.mjs other than `#boot` (T-255) and the site page's `#curve-fits`, and the driver selectors are the ones the pair table finds in the rendered DOM (`.info-panel`, `.moons-toggle`, `.moons-sheet`, `.controls-drawer`, `.timeline-drawer`, `.developer-tools`) |
| Nothing public moved | `git diff --exit-code -- packages/astraeus/api-surface.lock.json` empty; the three named test files pass inside `npm test`; no CHANGELOG entry needed (no public surface change) |
| Gates | `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok; `npm test`: 196 files, 2447 passed, 1 skipped, 6 todo |

Unverified: the driver change itself (no browser run, per the Task); the phone controls/timeline drawers' pairs are proved in jsdom-style happy-dom, not a browser.

## Drift Notes

Record architecture deltas here; T-258 reconciles them into Design.md.

- Collapsible's `id` prop became `fold` and SettingGroup's `id` became `name` (internal, not public API), plus new `HudSection`; tests find developer groups by `[data-setting-group]` and `[data-fold-toggle]` rather than ids. For T-258: not architectural beyond "every viewer element id is made per viewer with `useId` in the nearest owner and passed down" (API-03).
