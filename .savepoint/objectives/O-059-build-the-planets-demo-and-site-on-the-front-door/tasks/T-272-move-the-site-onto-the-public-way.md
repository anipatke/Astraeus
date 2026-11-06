---
id: T-272
objective: O-059
title: Move the site onto the public way
status: done
depends_on: [{task: T-271, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
check_waiver: {task: T-272, reason: 'Owner said "orchestrate O-59" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o059-run-20261106}, recorded_at: '2026-11-06T17:35:10Z'}
---

# Move the site onto the public way

## Outcome

The site opens every demo through the public viewer, with its pickers, loading cover and in-page address changes in the site, and no longer touches the engine's private parts.

## User Check

`packages/astraeus-site/src/main.tsx` imports only from `astraeus` and the demo packages; the deep-import count for the site is 0.

## Done When

The site uses `mount` or `AstraeusScene` with `address` and `developerTools`; no `App`, `ExperienceDefinition` or `toDefinition` in the site; cover, heading, picker and navigation behave as today; a regression test holds the cover hand-over (I-141); `DEEP_IMPORT_COUNTS` for `astraeus-site` is 0; site tests of engine internals moved to `packages/astraeus/tests/` and pass `check:engine-alone`. Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus-site/src/bootCover.ts`, `packages/astraeus-site/src/showerSwitch.ts`, `packages/astraeus-site/src/journeyData.ts`, `packages/astraeus/src/app/addressNavigation.ts`, `packages/astraeus/src/app/listSwitch.ts`, `packages/astraeus-site/tests/packageBoundaries.test.ts`, `packages/astraeus-site/tests/bootCover.test.ts`, `packages/astraeus-site/tests/loadingCoverChain.test.ts`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-03, ARCH-01, TEST-01, TEST-02, TEST-03.

## Implementation Plan

1. Move address navigation and switch choice into the site. 2. Mount through the public viewer. 3. Rewrite or move site tests. 4. Lower the count to 0.

## Boundaries

No visual change. `App` stays in the engine, internal. `toDefinition` itself is removed in O-057.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run build` with `ASTRAEUS_PUBLIC_BUILD=1`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Builder session (Sonnet), 2026-11-07, branch o059-front-door; not committed. Extra reads: none beyond Context Files, `docs/architecture/o059-public-forms.md` sections 5, 7, 11, `docs/agents/verification.md`, `.savepoint/issues/I-141`-named test files, engine `api/mount.ts`, `api/viewerHandle.ts`, `shell/SwitchControl.tsx`, `shell/bootLoader.ts`, `app/App.tsx`, `app/sceneFrame.ts`.

Gates (all pass): `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (225 files, 2938 passed, 2 skipped), `npm run check:engine-alone` (158 files, 1960 passed), `npm run check:pack`, and `ASTRAEUS_PUBLIC_BUILD=1 ASTRAEUS_ENGINE_SHARE=1 npm run build && node packages/astraeus-site/tools/validate/public-build-assets.mjs dist` (`ok: true`). No browser run.

Done When:
- Site on `mount` with `address` and `developerTools`; no `App`/`ExperienceDefinition`/`toDefinition`: `src/main.tsx`; held by `tests/loadingCoverChain.test.ts` (mount options recorded).
- Cover, heading, picker, navigation as today: `tests/entryChoice.test.ts` (every address form), `tests/addressNavigation.test.ts` (push, back/forward, overtaken, failed; `switchAddress` incl. kept `t`), `tests/listChoice.test.ts` (`pickerOf`), `tests/pageTitle.test.ts`, `tests/loadingCoverChain.test.ts` (in-page rebuild by popstate, `window.astraeusHost` for views only), `tests/bootCover.test.ts` (hide/I-074).
- I-141 regression: `tests/loadingCoverChain.test.ts` first-frame table; mutation check: removing `handle.onFirstDraw(...)` from main.tsx fails 4 tests.
- `DEEP_IMPORT_COUNTS["astraeus-site"]` 0: `tests/packageBoundaries.test.ts`.
- Internals tests moved to `packages/astraeus/tests/` and pass `check:engine-alone`: compositionsContract, experienceDefinitionContract, experiencePlugInContract, experiencesContract, storyPanelSettings, markerRuleEveryBody.

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective, named here as the integration Task.

Engine private paths removed (`App` props `claimCover` and `onOpenAddress`, definition `switcher`, `SwitchControl` address work, `hideBootLoader`/`CoverClaim`, `createViewsHost`); `SwitchControl.tsx` left `addressRule.test.ts` ALLOWED. Not asserted anywhere now (needed `toDefinition` internals): Perseids orbit-line listing, label defaults, Earth path samples, scale factor, Moon-free metrics; Apollo metric rows; marker rule on shower-defined bodies. Site no longer wraps in StrictMode (dev only).
