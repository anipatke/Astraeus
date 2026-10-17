---
id: T-084
title: Show activity as a glow within the timeline line instead of a graph above it
objective: O-020
status: planned
depends_on: [{task: T-080, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Show activity as a glow within the timeline line instead of a graph above it

## Outcome

The purple activity graph that sits above the timeline in the showers goes. Instead, the timeline's own track carries a gradient: brighter where activity is high and around key moments (the shower's peak), dimmer and lighter where nothing happens. The timeline is one slim line for every experience, showers included, on desktop and phone.

## User Check

Open the Perseids and the Geminids: no graph above the timeline; the track glows brightest at the peak night and fades away from it; hovering the track still tells you the rate at that moment. Apollo 11 and the others look as before.

## Done When

1. Owner, 2026-10-17: "I am not a fan of the purple lines. I want this re-designed to be a gradient within the line that gets brighter towards the key moments, and lighter when nothing happens", "this is on the timeline only". The window strip (`timeline-window`, `timeline-window-curve`, `timeline-windows` in `src/shell/TimelineBar.tsx` and `TimelineBar.css`) is removed; the experience's activity profile (the same data the strip drew) drives a gradient along the scrubber track, mapped from rate to brightness (and, if it reads better, a little thickness), with the played portion keeping its accent colour.
2. Generic: the shell draws the gradient from the experience's window data and event times, never from experience names (ARCH-01); an experience without a profile shows the plain track. Key moments (events) stay as marks on the line.
3. Readable information is not lost: the peak value and the rate at the hovered or current time are available as a tooltip or accessible text ("Perseids activity: peak 100 meteors per hour (ZHR)" today), and the gradient has a text equivalent for screen readers.
4. The gradient's colours, minimum brightness and curve are settings with live controls (owner rule), not hard-coded numbers; colour contrast keeps the scrubber thumb and played portion clearly visible.
5. Desktop and phone: the showers' timeline height equals the other experiences' (T-080 measured 101 px desktop and 173 px phone for the Perseids with the strip; the target is the one-line 52 px and two-line 110 px).
6. Browser checks that read the window strip are updated through the shared driver (T-083) or mapped, each scenario kept (TEST-03); pictures of both showers.
7. Owner validation: the owner looks at both showers.

## Context Files

`src/shell/TimelineBar.tsx`, `src/shell/TimelineBar.css`, `src/shell/timelineModel.ts`, the shower window settings (`data/showers/*.json` timeline/activity fields and how `src/experiences/showers/showerActivity.ts` builds the window), `.savepoint/objectives/O-020-make-the-phone-view-immersive/Objective.md`.

## Design References

Design.md shell timeline; the approved mock-ups https://claude.ai/artifact/Akgz8SgcZBq1jCy15aPqoS (one-line timeline).

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Remove the strip; expose the profile to the track.
2. Draw the gradient (CSS gradient stops or a small canvas behind the track), settings, tooltip and text equivalent.
3. Scripts, pictures, owner look.

## Boundaries

Timeline only (owner). No change to the activity data or the scene.

## Technical Verification

Configured gates, lite, pictures of both showers, the scripts that read the timeline. Evaluated under `agent-skills/references/check-method.md`.
