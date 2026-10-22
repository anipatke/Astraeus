---
id: T-146
title: Check each demo's own rules in fast tests
objective: O-038
status: planned
depends_on: [{task: T-143, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o038-planning-20261023}
lane: demos
---

# Check each demo's own rules in fast tests

## Outcome

What the Apollo, showers and planets browser scripts prove beyond "it opens" is proven by fast tests: Apollo's provenance wording, 30 events, mission readouts, true and readable telemetry pairs, event jumps and home curve fits; the showers' orbits, Earth path, bodies, year, public shower rules and story panels; the planets' presets, places, orbit lines, moon panel, small-moon dots, planet switch keeping the clock, Saturn rings, places on Titan and Charon, Uranus rings, and Mercury to Mars in the switch.

## User Check

None on screen. Run `npm test` and see the new demo tests pass.

## Done When

- Each behaviour scenario in `browser-apollo-shell`, `browser-spike02`, `browser-home-curve-fits`, `browser-showers`, `browser-public-showers`, `browser-jupiter-io`, `browser-moon-panel`, `browser-jupiter-tap`, `browser-outer-planets`, `browser-planet-switch` and the demo parts of `browser-story-panels` is listed in Technical Evidence with the test file and case that now proves it, or "journey" (Planets on a phone, Play a meteor shower), "draws: smoke check", or "looks: owner's look on the preview".
- Screen-level demo proofs (moon panel, story panels, mission panel) use the pretend-page helper from the screen-parts step.
- Existing demo tests are reused and named exactly where they already prove a scenario (TEST-03).
- Scripts are not deleted here. The fast suite stays about a minute or less (time recorded). Configured gates pass.

## Context Files

`tools/validate/browser-apollo-shell.mjs`, `tools/validate/browser-spike02.mjs`, `tools/validate/browser-home-curve-fits.mjs`, `tools/validate/browser-showers.mjs`, `tools/validate/browser-public-showers.mjs`, `tools/validate/browser-jupiter-io.mjs`, `tools/validate/browser-moon-panel.mjs`, `tools/validate/browser-jupiter-tap.mjs`, `tools/validate/browser-outer-planets.mjs`, `tools/validate/browser-planet-switch.mjs`, `tools/validate/browser-story-panels.mjs`, `tests/domSetup.ts`, `src/shell/MoonFamilyPanel.tsx`, `src/shell/moonFamilies.ts`, `src/shell/storyPanels.ts`, `tests/apollo11Reconstruction.test.ts`, `tests/showers.test.ts`, `tests/jupiterIo.test.ts`, `tests/moonFamilyPanel.test.ts`, `tests/planetSwitchInner.test.ts`, `tests/storyStoriesAllDemos.test.ts`.

## Design References

Design: Shower builder (T-038, T-039, T-055); Story panels (O-015); the `src/experiences/` row.

## Guardrails

ARCH-01, ARCH-04, TEST-01, TEST-03; STYLE rules as listed in `.savepoint/Guardrails.md`.

## Implementation Plan

1. Confirm the pretend-page helper exists; if not, return REPLAN REQUIRED.
2. Demo by demo, list each script's assertions, reuse existing tests, add cases where missing.
3. Leave the two journeys' scenarios to the browser command; mark them "journey".
4. Record the scenario map and suite time.

## Boundaries

No change to what visitors see or to demo data. No browser runs, no script deletion, no doc edits. No screenshots.

## Technical Verification

Focused `npx vitest run <files>` while building; configured gates at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
