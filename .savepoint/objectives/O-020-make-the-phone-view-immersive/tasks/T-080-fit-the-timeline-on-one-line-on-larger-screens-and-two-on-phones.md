---
id: T-080
title: Fit the timeline on one line on larger screens and two on phones
objective: O-020
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Fit the timeline on one line on larger screens and two on phones

## Outcome

The timeline panel becomes the approved slim bar: previous, play or pause and next as symbols, the time, the speed, the scrubber with event marks and an Events button, on one line on larger screens; on phones a simplified two-line version (transport, time and speed above, scrubber below).

## User Check

On a laptop the timeline is one slim line; on a phone it is two short lines; play, pause, previous, next, speed and the events list all still work.

## Done When

1. Matches the desktop and phone-closed artboards of the approved mock-ups (O-020 Decision 6); symbols with tooltips; accessible names unchanged (Decision 9).
2. The "Just happened / Up next" text and the event list move behind the Events button (desktop) or into the expanded drawer (the phone drawer Task wires the drawer; this Task provides the compact and expanded content).
3. Height measured before and after at 1440x900 and 390x844, stated in the evidence.
4. CSS for the timeline in its own stylesheet beside its component (not appended to `src/shell/style.css`).
5. Browser scripts that read the old timeline text are updated, each scenario mapped (TEST-03).

## Context Files

`src/shell/TimelineBar.tsx`, `src/shell/timelineModel.ts`, `src/shell/style.css` (timeline rules only, to move out), `tools/validate/browser-shell.mjs`, `.savepoint/objectives/O-020-make-the-phone-view-immersive/Objective.md`.

## Implementation Plan

1. Move the timeline CSS out; build the one-line layout.
2. The two-line phone variant; Events button.
3. Tests, browser scripts, pictures.

## Boundaries

Timeline only; no top bar or drawers (other Tasks).

## Design References

Design.md shell components and presentation (ARCH-02); the approved mock-ups https://claude.ai/artifact/Akgz8SgcZBq1jCy15aPqoS.

## Guardrails

ARCH-01 (no experience names in the shell), ARCH-02, ARCH-03, TEST-01, TEST-03 (any browser script a UI change invalidates is updated with each scenario mapped), STYLE-01, STYLE-07.

## Technical Verification

Configured gates, the lite browser check, before/after pictures against `docs/evidence/o017-baseline-20261017/` (differences are expected where the UI changes; each is listed), and the full run (`tools/validate/run-full.sh`) before handoff. Evaluated under `agent-skills/references/check-method.md`.
