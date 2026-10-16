---
id: T-061
title: Write the Apollo 11 story panels
objective: O-015
status: planned
depends_on: [{task: T-059, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o015-plan-20261016}
---

# Write the Apollo 11 story panels

## Outcome

About seven panels tell the Apollo 11 story as playback reaches them: translunar injection, lunar orbit insertion, powered descent, landing at Tranquility Base, ascent and docking, trans-Earth injection, and splashdown.

## User Check

Play Apollo 11 from launch at a brisk rate. Each panel opens at its moment, reads plainly in a few sentences, and its facts match the sources it names.

## Done When

1. The panels are in Apollo 11's story settings (data, not code), tied to the existing timed anchors by id.
2. Every number in the text (times, distances, speeds) comes from the anchors file or the NASA sources already cited for it, and the source line says which. Badges are honest: observed for recorded events, modelled for trajectory-derived figures.
3. Plain, non-cheesy wording, two to four sentences each.
4. Browser evidence: each panel opens in order on playback, in a fresh evidence directory.

## Context Files

`data/apollo11/normalised/anchors.json`, `data/apollo11/generated/events.json`, `src/experiences/apollo11/apollo11.ts`, `docs/ASTRONOMY_VALIDATION.md`.

## Design References

Experience definitions.

## Guardrails

ARCH-01, PROV-01, STYLE-09, TEST-01.

## Implementation Plan

1. Pick the anchors and read their source records.
2. Write the panel entries in the story data.
3. Run the story-panels browser script on Apollo.

## Boundaries

No new data sources. No shell or engine changes; if the capability is missing something, report it rather than patch it.

## Technical Verification

Gates plus the story-panels and spike03 browser scripts. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
