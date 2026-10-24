---
id: T-176
title: Rebuild the meteor showers on the public API
objective: O-042
status: done
depends_on: [{task: T-171, requires: clear}, {task: T-172, requires: clear}, {task: T-175, requires: clear}, {task: T-177, requires: clear}]
owner_validation:
  required: true
  accepted_check: C-115
  scope: [both rebuilt showers on localhost:5490 (desktop and phone) incl. the flagged differences, Done When 1-8]
  accepted_by: {role: owner, session: o042-run-20261024}
  accepted_at: '2026-10-24T01:05:03Z'
  note: 'Owner look: "looks fine"; formal sign-off by the owner standing instruction for O-042: "merge and push when its clear" (C-115 CLEAR).'
planned_by: {role: planner, session: o042-planning-20261024}
check_waiver:
  task: T-176
  reason: 'Owner said "orchestrate O42"; under the standing O-042 run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o042-run-20261024}
  recorded_at: '2026-10-24T00:39:36Z'
---

# Rebuild the meteor showers on the public API

## Outcome

The showers demo builds each shower with public `Scene` calls and imports only `astraeus`; the site gives the app `toDefinition()` plus its own label and shower switch; both showers look as before apart from O-042's Decisions; page limits tightened; Design.md reconciled for O-042.

## User Check

Open `localhost:5490/app.html?experience=showers` on desktop and phone: the Perseids stream, the comet and its whole orbit, the planets' orbits, Earth's path, the glow and its peak, and the three panels look as before; the stream's card shows the rate bar and the radiant line; the camera menu reads Overview / Focus / Follow; the switch opens the Geminids with Phaethon; Developer > Under the hood has no orbit-set buttons.

## Done When

- `packages/astraeus-demo-showers/src` imports only `astraeus`; `PUBLIC_API_DEMOS` in the boundary test gains the showers demo.
- The demo carries its own settings readers.
- A comparison test, captured from the pre-rebuild definitions of both showers BEFORE any change, checks objects (ids, labels, colours, provenance, known limits), the group (count, colour, dot size, sampled member positions at the peak), events, panels, window, rates, scales, opening view, loop, view-up, reach and enlargement; each difference named and tied to a Decision, or flagged for the owner (e.g. label priorities, the dev-only "orbits not fetched" item becoming a known limit).
- The showers' tests rewritten against the public result; each dropped case named with a reason.
- Browser scripts repaired in `driver.mjs` only and mapped in `docs/BROWSER_CHECKS.md`.
- Both page sets (and Apollo's, for the shared Scene chunk) re-measured on a public build; Perseids and Geminids limits lowered to the new measurement plus 5%, rounded up to the next 10,000 bytes (Decision 5); any raise flagged for the owner, not made.
- Design.md reconciled for every drift note of this Objective's Tasks.
- Hand-off gates plus `check:engine-alone` green; owner look recorded.

## Context Files

`packages/astraeus-demo-showers/src/experiences/showers/showerDefinition.ts`, `packages/astraeus-demo-showers/src/experiences/showers/showerStream.ts`, `packages/astraeus-demo-showers/src/experiences/showers/showerPaths.ts`, `packages/astraeus-demo-showers/src/experiences/showers/showerBodies.ts`, `packages/astraeus-demo-showers/src/experiences/showers/showerBasics.ts`, `packages/astraeus-demo-showers/src/experiences/showers/showerActivity.ts`, `packages/astraeus-demo-showers/src/experiences/showers/showerStreamText.ts`, `packages/astraeus-demo-showers/src/experiences/showers/showerSettings.ts`, `packages/astraeus-demo-showers/src/experiences/showers/measuredOrbits.ts`, `packages/astraeus-demo-showers/src/experiences/showers/showerEntry.ts`, `packages/astraeus-demo-showers/package.json`, `packages/astraeus-demo-showers/data/showers/perseids.json`, `packages/astraeus-demo-showers/data/showers/geminids.json`, `packages/astraeus-demo-showers/tests/showers.test.ts`, `packages/astraeus-demo-showers/tests/demoShowers.test.ts`, `packages/astraeus-demo-showers/tests/showersMeasured.test.ts`, `packages/astraeus-demo-showers/tests/showersYearHorizons.test.ts`, `packages/astraeus-demo-showers/tests/pointsLookAheadShowers.test.ts`, `packages/astraeus-demo-showers/tests/elementsBody.test.ts`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus-site/tests/packageBoundaries.test.ts`, `packages/astraeus-site/tools/validate/load-budget.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `packages/astraeus-site/tools/validate/journey-meteor-shower.mjs`, `docs/BROWSER_CHECKS.md`, `packages/astraeus/src/api/scene.ts`, `.savepoint/Design.md`.

## Design References

Design Components/Codebase Map (showers demo, site), Current Technical State O-030, O-035, O-041.

## Guardrails

ARCH-01, ARCH-03, ARCH-04, ARCH-05, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03.

## Implementation Plan

1. Capture both showers' comparable definitions as fixtures first. 2. A scene builder per settings file. 3. Switch the site. 4. Comparison test, boundary rule, rewritten tests. 5. Repair the driver, re-measure, tighten limits. 6. Reconcile Design.md. 7. If a call is missing, return REPLAN REQUIRED naming it.

## Boundaries

No new shower data, no re-fetch, no stutter work; no change to the planets demo beyond the list-switch move; no public switcher or alternates.

## Technical Verification

Hand-off gates from AGENTS.md (`npm run lint`, `npm run typecheck`, `npm run build`, `npm test`) plus the extra gates named in Done When. No `npm run check:browser` per Task (one run at the Full Objective Check); a changed browser step may be run alone once. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Stage audit (ready for a Check; not passed). Resumed after T-177.
- Done When: `packages/astraeus-demo-showers/src` imports only `astraeus` and `PUBLIC_API_DEMOS` has the showers demo (boundary test green); the demo carries its own settings readers (`showerSettings.ts`); `tests/rebuildComparison.test.ts` (34 cases) checks both showers against `tests/fixtures/showers-before-rebuild.json`, captured from the unchanged code before any edit, each difference tied to Decisions 1, 4 or 6 or marked FLAG; the showers' tests were rewritten (`demoShowers`, `showers`, `showersMeasured` and the callers in the demo and site packages; dropped cases and reasons are in the header of `tests/showers.test.ts`); driver helpers for the orbit-set buttons removed and mapped in `docs/BROWSER_CHECKS.md`; Design.md reconciled for T-171..T-177 (Drift Notes block "O-042 ...").
- Page sets on a public build (`ASTRAEUS_PUBLIC_BUILD=1 vite build`, `load-budget.mjs`): Perseids 9,191,109 B raw / 6,758,808 B gzip, Geminids 10,768,779 / 7,314,429, Apollo 4,355,880 / 2,815,247. Limits now Perseids 9,660,000 raw (was 10,080,000), Geminids 11,310,000 / 7,690,000 (were 12,680,000 / 7,890,000). Perseids gzip left at 7,040,000: measurement plus 5% rounds to 7,100,000, which would be a raise, so not made (flag for the owner). Apollo limits unchanged.
- Gates, all green: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (129 files, 1738 passed, 1 skipped), `npm run check:engine-alone`, `npm run check:pack`, `npm run build:example`. `journey-meteor-shower.mjs` run alone once against the preview (25,588 dots, 6 paths, 7 bodies, switch to Geminids kept the page, no errors); `check:browser` not run.
- Files read beyond the Context Files: the shower, planets and site tests that import the removed modules; `packages/astraeus/src/api/*`, `core/scalePolicy.ts`, `shell/scaleModel.ts`, `app/App.tsx`, `app/sceneCamera.ts` (to learn the public calls and the scale gap); `tests/helpers/*`; the Apollo scene and comparison test (the precedent). Edited beyond the list: `packages/astraeus-site/src/showerSwitch.ts`, `tests/*` of the site, `packageBoundaries.test.ts`, `publicBuild.test.ts` (the showers no longer import the shared settings readers), `load-budget.mjs` page sets (`showerScene.js`, `scene.js`, `preload-helper.js` optional).
- Limits: the opening view of the Geminids and every FLAG in `rebuildComparison.test.ts` need the owner's look on the preview; owner look not yet recorded.

## Owner Look

Owner, 2026-10-24, on localhost:5490 (desktop and phone), after being shown the flagged differences (Geminids opening view, orbit-line colours and start, label priorities and reach, Solar system scale, rate bar and radiant line): "looks fine". Formal acceptance is recorded against the Full Objective Check.

## Drift Notes

Replan 2026-10-24 (planner, o042-replan-20261024): the builder returned REPLAN REQUIRED (Solar system scale unreachable through the public Scene; planet series loaded after the eager Sun-orbit lines; clump.near cannot name an elements body; no refillSliceMs). Owner chose "Add a small fix step first (Recommended)": T-177 fills them; this Task then resumes from its saved partial work (git stash "T-176 partial rebuild", fixture captured before any change). Differences already seen are in the builder's report and go to the comparison test.


Record architecture deltas for Design reconciliation in the showers rebuild Task.
