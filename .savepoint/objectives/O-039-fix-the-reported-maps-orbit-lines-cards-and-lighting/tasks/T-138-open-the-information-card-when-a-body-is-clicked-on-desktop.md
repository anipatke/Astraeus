---
id: T-138
title: Open the information card when a body is clicked on desktop
objective: O-039
status: planned
check_waiver:
  task: T-138
  reason: "Owner skipped the optional Task Check for the O-039 overnight run ('Skip them, one big check at the end'); the Full Objective Check covers it."
  actor: {role: owner, session: 8d73d3f8}
  recorded_at: '2026-10-22T10:46:52Z'
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: 8d73d3f8}
lane: click
planned_reads: [src/shell/AstraeusShell.tsx, src/shell/phoneLayout.ts, src/app/App.tsx, .savepoint/objectives/O-022-tap-or-click-an-object-in-the-scene-to-focus-on-it/Objective.md, tests/focusPreset.test.ts]
planned_writes: [src/shell/AstraeusShell.tsx, tests/clickOpensInfo.test.ts]
---

# Open the information card when a body is clicked on desktop

## Outcome

On a desktop layout, clicking a body in the scene (a planet, a mapped moon or a small dot moon such as Halimede) flies to it and opens its information card; on the phone layout a tap still only flies there.

## User Check

On the preview at desktop size, open Neptune and click Halimede: the camera flies there and its card opens without pressing the i button. At a phone-sized window, a tap flies there and the card stays closed.

## Done When

- `pickObject` in `src/shell/AstraeusShell.tsx` selects the object and opens its card when the layout is not the phone layout; the phone behaviour is unchanged.
- A tapped body-set member that is not a listed object still just flies there (no card exists for it); note in evidence whether small dot moons such as Halimede are listed objects.
- The decision is a small pure function (layout in, open-or-not out) with a node test for both layouts; the comment on `pickObject` is updated.
- Owner look on preview recorded. Configured gates pass.

## Context Files

`src/shell/AstraeusShell.tsx`, `src/shell/phoneLayout.ts`, `src/app/App.tsx`, `.savepoint/objectives/O-022-tap-or-click-an-object-in-the-scene-to-focus-on-it/Objective.md`, `tests/focusPreset.test.ts`.

## Design References

Design: Components/Codebase Map row for `src/shell/`; O-022's tap-to-focus notes.

## Guardrails

ARCH-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Read how `chooseMoon`, `selectObject` and `pickObject` differ; reuse `selectObject`'s selection path rather than writing a third.
2. Add the layout-gated open; keep the phone path as is.
3. Write the test; leave the owner's look for the morning.

## Boundaries

Scene clicks only; the moon panel, picker and i button are unchanged. No browser sets, no screenshots.

## Technical Verification

Focused node test; configured gates at handoff; owner's look on the preview. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Changes O-022's focus-only rule for desktop; Design note deferred to T-137.
