---
id: T-112
title: Trim each demo's checks into its own optional set
objective: O-034
status: planned
depends_on: [{task: T-111, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o034-planning-20261020}
planned_writes: [tools/validate/run-demo.mjs, tools/validate/driver.mjs, tools/validate/browser-jupiter-io.mjs, tools/validate/browser-moon-panel.mjs, tools/validate/browser-showers.mjs, tools/validate/browser-public-showers.mjs, tools/validate/browser-spike02.mjs, tools/validate/browser-story-panels.mjs, tools/validate/browser-home-curve-fits.mjs, tools/validate/browser-lite.mjs]
---

# Trim each demo's checks into its own optional set

## Outcome

`npm run check:demo -- apollo`, `-- showers` and `-- jupiter` each run only that demo's facts-and-figures checks plus a load smoke test, in a few minutes each, steadily under machine load.

## User Check

Run each of the three commands: each passes with zero console errors and prints its total; Jupiter takes about a minute or two, not 23.

## Done When

1. Jupiter: `places()` samples a few moons and views instead of every one (about 1361 s to a couple of minutes), keeping the assertion that only the moon's own places show; the moon-panel and remaining Jupiter scenarios kept.
2. Showers: the Perseids step trimmed (it was about 270-330 s): slower camera scenarios merged or dropped, each named in the evidence (former O-027).
3. Apollo: the spike02 telemetry speed check reads at a known simulation time (paused or seeked), not after wall-clock waits; a deliberately wrong expected speed fails (negative probe); story-panel and anchor scenarios that are Apollo-specific stay here (former O-028).
4. Each demo set starts with a load smoke test for that demo at desktop and phone size (from `browser-lite`), so `browser-lite` itself can be retired or reduced to the made-up scenes.
5. Per demo, a total under 240 s on an idle machine.
6. Each changed or dropped scenario listed in the evidence for the map.
7. Gates: typecheck, build, test; each of the three demo commands passes once at handoff, one at a time.

## Context Files

`tools/validate/run-demo.mjs`, `tools/validate/driver.mjs`, `tools/validate/browser-jupiter-io.mjs`, `tools/validate/browser-moon-panel.mjs`, `tools/validate/browser-showers.mjs`, `tools/validate/browser-public-showers.mjs`, `tools/validate/browser-spike02.mjs`, `tools/validate/browser-story-panels.mjs`, `tools/validate/browser-home-curve-fits.mjs`, `tools/validate/browser-lite.mjs`, `docs/BROWSER_CHECKS.md`.

## Design References

O-034 Confirmed Decision 3 and Success Condition 3.

## Guardrails

TEST-01, TEST-02, TEST-03; STYLE rules.

## Implementation Plan

1. Jupiter sampling; 2. Perseids trim; 3. Apollo speed at known time with negative probe; 4. Demo smoke tests; 5. Gates and the three runs, one at a time.

## Boundaries

No app behaviour change; no screenshots. Time box: report back after two failed runs of the same script.

## Technical Verification

Configured gates and the three demo runs; evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record Design deltas for reconciliation in the last step.
