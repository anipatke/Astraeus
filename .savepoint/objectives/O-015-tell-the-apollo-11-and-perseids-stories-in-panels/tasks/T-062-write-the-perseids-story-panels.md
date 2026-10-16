---
id: T-062
title: Write the Perseids story panels
objective: O-015
status: planned
depends_on: [{task: T-059, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o015-plan-20261016}
---

# Write the Perseids story panels

## Outcome

Three Perseids panels: the stream's shape (a wide ribbon of dust along Swift–Tuttle's orbit, drawn from measured orbits); Earth's crossing (active mid-July to late August, peak 12–13 August, about 100 an hour at best, radiant in Perseus); and Swift–Tuttle (about 26 km across, a 133-year orbit, last perihelion 1992, next 2126).

## User Check

Play Perseids through the year. Each panel opens at the right moment and the camera context makes sense for it. Facts match their named sources.

## Done When

1. The panels are in the Perseids story settings (data/showers/perseids.json or its story file), with no code.
2. Every figure is sourced: IAU MDC for the shower, JPL Small-Body Database for Swift–Tuttle, docs/ASTRONOMY_VALIDATION.md for the GMN figures. Badges say illustrative wherever dot places are illustrative.
3. Plain, non-cheesy wording.
4. The Geminids get no panels, but a test shows a shower settings file can carry panels with no code.
5. Browser evidence in a fresh evidence directory.

## Context Files

`data/showers/perseids.json`, `src/experiences/showers/showerSettings.ts`, `src/experiences/showers/showerDefinition.ts`, `docs/ASTRONOMY_VALIDATION.md`.

## Design References

Experience definitions; shower settings.

## Guardrails

ARCH-01, ARCH-03, PROV-01, STYLE-09, TEST-01.

## Implementation Plan

1. Gather the figures and their sources.
2. Write the panel entries.
3. Run the story-panels and showers browser scripts.

## Boundaries

No new data sources. Don't fetch meteorshowers.org (owner rule). No shell or engine changes.

## Technical Verification

Gates plus the story-panels and showers browser scripts. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
