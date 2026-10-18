---
id: T-100
title: Open "Jupiter and its moons" on 4 November 2016 with its stories moved there
objective: O-032
status: planned
depends_on: [{task: T-098, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Open "Jupiter and its moons" on 4 November 2016 with its stories moved there

## Planning Note (owner, 2026-10-18)

Parked: "Park the Juno demo". Moved from O-025 to O-032 in the post-launch Goal G-008 (owner chose a new Goal over keeping it in O-025 or dropping it). Done When unchanged; its references to O-025 Decisions 4 and 5 now read as O-032's carried-over decisions.

## Outcome

The Jupiter demo is named "Jupiter and its moons", opens on 4 November 2016 and runs a year, with its story panels moved into that window and reworded where a date-bound line needs it; its home page card shows the new scene.

## User Check

Open the demo: the title reads "Jupiter and its moons", the clock starts on 4 November 2016, the Io stories open in the new window and read correctly for that date.

## Done When

1. O-025 Decisions 4 and 5 (owner: start "4 Nov 2016, the day my son was born"; name "Jupiter and its moons"); the demo's address and title follow the name (the Jupiter address in the locked list from T-093 updated if it changes).
2. The window is a year from 2016-11-04 so the outer moons' loops show; the T-096 chunks needed for it are the only ones fetched.
3. The three Io panels move into the window; "The most volcanic world we know" drops "A few weeks before this scene, the Galileo spacecraft flew past Io" for a line true in 2016, in the same plain voice; facts and sources updated (PROV-01). A Juno panel is added (owner, 2026-10-18: "yes add a Juno story"): NASA's Juno had been orbiting Jupiter since 4 July 2016, so it was there on 4 November 2016; plain voice, facts and sources from NASA/JPL, badge chosen honestly; whether Juno itself is drawn in the scene stays out of scope (O-025 Boundaries) unless the owner asks, and the panel's details say so.
4. The home page card for the demo uses a fresh picture of the new scene (owner may supply a screenshot as before).
5. Tests pinning panel times and the window updated; browser checks through the shared driver; full run passes; owner look.

## Context Files

`src/experiences/jupiter-io/jupiterIo.ts`, `data/stories/jupiter-io/panels.json`, `tests/storyStoriesAllDemos.test.ts`, `index.html`, `tools/validate/browser-jupiter-io.mjs`, `tools/validate/browser-story-panels.mjs`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/Objective.md`.

## Design References

O-025 Decisions 4-5; O-015 voice (Decision 4).

## Guardrails

PROV-01, ARCH-01, TEST-01, TEST-03.

## Implementation Plan

1. Name, date, window.
2. Story moments and wording; home card; checks; owner look.

## Boundaries

The demo layer only (core data is T-096 and T-097).

## Technical Verification

Configured gates, Jupiter and story-panel scripts, full run. Evaluated under `agent-skills/references/check-method.md`.
