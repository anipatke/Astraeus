---
id: T-145
title: Build one quick browser check with two journeys
objective: O-038
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o038-planning-20261023}
lane: browser
planned_writes: [package.json, tools/validate/runner.mjs, tools/validate/run-browser.mjs, tools/validate/browser-smoke.mjs, tools/validate/journey-planets-phone.mjs, tools/validate/journey-meteor-shower.mjs, tools/validate/driver.mjs]
---

# Build one quick browser check with two journeys

## Outcome

`npm run check:browser` starts the app, runs one smoke check and two journey checks one after another in one browser at a time, and finishes in about 3 minutes or less on this machine. The smoke check opens every public page and every demo view once at desktop and phone size and fails on any page or console error or a scene that draws nothing. The journeys are "Planets on a phone" (switch planet, focus a moon, open a place card at phone size) and "Play a meteor shower" (play, seek, a story panel opens).

## User Check

None on screen. Run `npm run check:browser` and see three steps pass, with the total time printed.

## Done When

- `browser-smoke.mjs` grows out of `browser-lite.mjs`: pages and experiences discovered as `browser-lite` does (index, assets, app with each experience and shower), desktop and phone, canvas not blank (scene readouts), zero page or console errors; no extra per-page assertions.
- Two journey scripts follow the confirmed steps, touch the interface only through `driver.mjs` (the guard passes), and read the scene's own readouts; no screenshots.
- `runner.mjs` is simplified so its main function reads at or under 20 by lizard (it reads 27 today); `run-browser.mjs` lists the three steps; `npm run check:browser` runs it. The public-build file checks (`public-build-assets`, `public-addresses`) run as node tests or a no-browser step, whichever is simpler, and stay in the gate.
- Timed: three runs in a row, all passing, each time and run folder recorded (evidence retention rule: `summary.txt` and `results.json` only).
- Old sets and scripts are not deleted here. Configured gates pass.

## Context Files

`tools/validate/browser-lite.mjs`, `tools/validate/runner.mjs`, `tools/validate/run-engine.mjs`, `tools/validate/run-demo.mjs`, `tools/validate/harness.mjs`, `tools/validate/driver.mjs`, `tools/validate/driver-guard.mjs`, `tools/validate/public-build-assets.mjs`, `tools/validate/public-addresses.mjs`, `tools/validate/browser-planet-switch.mjs`, `tools/validate/browser-story-panels.mjs`, `tests/browserDriverGuard.test.ts`, `package.json`, `docs/BROWSER_CHECKS.md`.

## Design References

Design: the `tools/validate/` row; Browser driver (T-083).

## Guardrails

CODE-01, TEST-01; STYLE rules as listed in `.savepoint/Guardrails.md`. AGENTS.md Astraeus Project Rules on browser checks, the driver, no screenshots and evidence retention.

## Implementation Plan

1. Measure `browser-lite` alone today to see how much of the 3 minutes it uses; if smoke alone is over about 2 minutes, trim waits before adding journeys.
2. Write the two journeys, adding driver functions only where one is missing.
3. Simplify the runner, add `run-browser.mjs` and the package script.
4. Run three times in a row, one browser at a time, nothing else running; record times and folders.

## Boundaries

No change to what visitors see. No other browser sets run. No screenshots. Old scripts stay until the last step.

## Technical Verification

The three timed runs are this step's own proof (it builds the checks, so a browser run is allowed). Configured gates at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Note for Design: `tools/validate/` now holds one command. Reconciled in the last step of this Objective.
