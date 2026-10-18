---
id: T-092
title: Start the Showers demo on 21 September 2019 and move both showers into that year
objective: O-024
status: planned
depends_on: [{task: T-091, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Start the Showers demo on 21 September 2019 and move both showers into that year

## Outcome

The Showers demo opens on 21 September 2019 and runs a year, so the Geminids peak (December 2019) and the Perseids peak (August 2020) both fall inside it, with every peak, activity window, comet and asteroid position and story moment taken from published values for those dates.

## User Check

Open the Showers demo: the clock starts on 21 September 2019; play through to the Geminids' peak in December 2019, switch to the Perseids and reach their peak in August 2020; the stories open at sensible moments.

## Done When

1. Owner, 2026-10-18 (O-024 Decision 3): the Showers demo starts on 21 September 2019 ("Date my daughter was born") and runs a year.
2. Each shower's peak time and activity window for its 2019-2020 return come from published values (IMO or AMS), recorded with sources; the timeline glow follows them.
3. 109P/Swift-Tuttle and 3200 Phaethon positions for those dates come from the existing ephemeris path (checked against JPL Horizons at sample dates, as C-030/C-032 did).
4. Story panel moments move into the new year (for example Phaethon's closest pass of the Sun nearest that window, from JPL); body text unchanged unless a date-bound sentence needs it; details say the 2019-2020 values and that the meteor orbits were measured by the Global Meteor Network in 2025 (illustrative positions, as now). The panel tests that pin times are updated.
5. The narrowed `span=activity` view still works for each shower.
6. Browser checks through the shared driver; full run passes.
7. Owner validation: the owner plays the year.

## Context Files

`data/showers/perseids.json`, `data/showers/geminids.json`, `data/stories/perseids/panels.json`, `data/stories/geminids/panels.json`, `src/experiences/showers/showerSettings.ts`, `src/experiences/showers/showerActivity.ts`, `tests/storyStoriesAllDemos.test.ts`, `tests/showers.test.ts`, `docs/ASTRONOMY_VALIDATION.md`, `tools/validate/browser-showers.mjs`, `.savepoint/objectives/O-024-launch-with-three-demos-apollo-showers-and-jupiter/Objective.md`.

## Design References

O-024 Decision 3 and Notes for planning.

## Guardrails

PROV-01, ARCH-01, TEST-01, TEST-03.

## Implementation Plan

1. Published 2019-2020 peaks and windows; comet and asteroid checks.
2. Story moments; tests; full run.

## Boundaries

Dates and the values that follow them; no new data sets.

## Technical Verification

Configured gates, showers and story-panel scripts, full run. Evaluated under `agent-skills/references/check-method.md`.
