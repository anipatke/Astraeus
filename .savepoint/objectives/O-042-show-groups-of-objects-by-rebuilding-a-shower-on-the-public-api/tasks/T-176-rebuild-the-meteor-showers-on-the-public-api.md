---
id: T-176
title: Rebuild the meteor showers on the public API
objective: O-042
status: in_progress
stage: build
depends_on: [{task: T-171, requires: clear}, {task: T-172, requires: clear}, {task: T-175, requires: clear}, {task: T-177, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o042-planning-20261024}
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

Partial work at REPLAN REQUIRED (stage build, nothing committed; the tree does not pass typecheck because the old shower tests still import removed modules):
- Step 1 done: `packages/astraeus-demo-showers/tests/fixtures/showers-before-rebuild.json` captured from the pre-rebuild code (both showers, shipped orbits) before any change.
- Step 2 done: `showerScene.ts` (`buildShowerScene`, `loadShowerPanelsFile`, `rateSamplesOf`), `showerText.ts`, trimmed `showerBasics.ts`, `measuredOrbits.ts` (no orbit sets), `showerSettings.ts` with its own readers (no `astraeus/...` import). Removed `showerDefinition.ts`, `showerStream.ts`, `showerPaths.ts`, `showerBodies.ts`, `showerActivity.ts`.
- Step 3 done: `showerEntry.ts` moved to `packages/astraeus-site/src/showerSwitch.ts`; `main.tsx` builds `buildShowerScene(...).toDefinition()` with label and switcher, loads the planet series first, drops `?span=` and `?orbits=`.
- Test helper `tests/helpers/showerDefinition.ts` (scene `toDefinition()` for tests). Probe built both showers without error.
- Not done: comparison test, boundary rule, rewritten tests, driver repair, measuring and limits, Design.md.
- Differences seen so far (all to tie to a Decision or flag): body label priorities 100..94 (were 95/100/90/80/70); stream label priority 80 (was 70); camera far 10,000,000 (was 12,000,000; far = 2.5 x reach); Earth orbit id `earth-orbit` (was `earth-path`) and orbit lines take the body colours (earthPathColor, parentPathColor no longer used); orbits start at the opening time (were the peak); opening view is Focus Sun pressed (Geminids declares no view, a default one is used); 'times larger than life' sentence now in the planets' descriptions (was a known limit; catalogue limits are kept); radiant is a line in the stream description (Decision 4); rate row id `perseids-stream-rate` and wording 'outside the activity'; Geminids refillSliceMs 12 lost; whole-orbit and Focus parent items gone (Decision 6); the not-fetched notice is in the Sun's description.

## Drift Notes

Replan 2026-10-24 (planner, o042-replan-20261024): the builder returned REPLAN REQUIRED (Solar system scale unreachable through the public Scene; planet series loaded after the eager Sun-orbit lines; clump.near cannot name an elements body; no refillSliceMs). Owner chose "Add a small fix step first (Recommended)": T-177 fills them; this Task then resumes from its saved partial work (git stash "T-176 partial rebuild", fixture captured before any change). Differences already seen are in the builder's report and go to the comparison test.


Record architecture deltas for Design reconciliation in the showers rebuild Task.
