---
id: T-091
title: Combine the Perseids and Geminids into one Showers demo with a switch
objective: O-024
status: planned
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Combine the Perseids and Geminids into one Showers demo with a switch

## Outcome

One Showers demo replaces the two shower demos. A switch in the top bar changes between the Perseids and the Geminids; each shower keeps its own data, story panels, settings and look, and only the chosen shower's data is downloaded.

## User Check

Open the Showers demo: the Perseids show; switch to the Geminids and back; each shower's stream, comet or asteroid, timeline glow and stories appear; a copied view link reopens the same shower.

## Done When

1. Owner, 2026-10-18 (O-024 Decision 1): "we combine the Perseids and Geminis into a single demo and the user can switch between them. This will be the showers demo". One experience id (`showers`) with a shower choice; the Perseids are the default.
2. The switch is a control in the top bar using the shared control styles (T-081), on desktop and in the phone drawer; accessible name stated. Switching changes shower without a page reload where practical (state, camera reset to the shower's start view, story panels and markers swapped); if a reload is simpler and fast, it is recorded as a Drift Note.
3. Only the chosen shower's data is fetched; the public load budget's page list becomes one Showers entry checked for each shower; no limit raised.
4. The chosen shower is in the view link (`?experience=showers&shower=geminids` or similar) and round-trips. The old `shower-perseids` and `shower-geminids` addresses are removed without redirects (O-024 Decision 4); the public build's address list and the five-address mentions in docs are updated.
5. Shower content stays data (owner rule): `data/showers/*.json` and `data/stories/<shower>/` unchanged except for wiring; no shower names in engine or shell (ARCH-01).
6. Browser checks through the shared driver: the showers scripts run each shower through the switch (both directions, desktop and phone); every prior scenario mapped (TEST-03); full run passes.
7. Owner validation: the owner switches between the showers.

## Context Files

`src/experiences/showers/showerDefinition.ts`, `src/experiences/showers/showerEntry.ts`, `src/experiences/showers/showerSettings.ts`, `data/showers/perseids.json`, `data/showers/geminids.json`, `src/shell/TopBar.tsx`, `src/app/viewLink.ts`, `tools/validate/load-budget.mjs`, `tools/validate/driver.mjs`, `tools/validate/browser-showers.mjs`, `tools/validate/run-full.sh`, `.savepoint/objectives/O-024-launch-with-three-demos-apollo-showers-and-jupiter/Objective.md`.

## Design References

Design.md experiences and shell; O-024 Decisions.

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. One `showers` experience with a shower choice; the switch control; view link.
2. Load budget, addresses, scripts; full run.

## Boundaries

Combining and switching only; the move to the 2019-2020 year is the next Task.

## Technical Verification

Configured gates, lite, the showers scripts, full run. Evaluated under `agent-skills/references/check-method.md`.
