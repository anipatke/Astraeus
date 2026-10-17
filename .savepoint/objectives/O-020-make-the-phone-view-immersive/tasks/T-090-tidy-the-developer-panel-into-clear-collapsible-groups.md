---
id: T-090
title: Tidy the developer panel into clear collapsible groups
objective: O-020
status: planned
depends_on: [{task: T-081, requires: clear}, {task: T-086, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Tidy the developer panel into clear collapsible groups

## Outcome

The developer panel (the cog) is short and easy to scan: its controls are reviewed, sorted into a few clearly named groups, and each group folds open and closed, so a visitor sees the headings first and opens only what interests them.

## User Check

Open the cog on a laptop and a phone: a short list of group headings, each opening with one tap; every control is still there and still works.

## Done When

1. Owner, 2026-10-18: "the developer panel is getting big and messy, suggest as part of finalising this objective we also review what in it, organise / group into collapsible sections".
2. Review: an inventory of every control and readout in the panel today (experience sections, Scene instrumentation, Display settings groups View, Story panels, Timeline glow, Orbit lines, Sky, Sun glow, Labels, Data, Phone layout, and any from T-081/T-086), recorded in the Task evidence with a proposed grouping, a plain heading per group and anything to merge, rename or drop; the owner approves the grouping before the build (a drop needs the owner's yes; the owner keeps the panel public as a demo of "the ins and outs", O-020 decision).
3. Each group is a collapsible section, closed by default except one sensible default (for example the experience's own controls); open/closed state is remembered per viewer in browser storage where available and works without it; keyboard and screen-reader accessible (button with `aria-expanded`), 44 px headings on phones.
4. One shared collapsible part for the groups (STYLE-07; reuse T-081's collapsible if it fits); the panel's controls take the shared control styles from T-081.
5. Accessible names of controls unchanged (O-020 Decision 9); browser checks open a group through the shared driver (T-083) before using its controls, so the scripts change only in the driver; driver guard passes; full run passes.
6. Owner validation: the owner opens the panel on laptop and phone.

## Context Files

`src/app/App.tsx`, `src/app/SettingControls.tsx`, `src/app/DebugOverlay.tsx`, the experience `developerSections` definitions, T-081's collapsible part, `tools/validate/driver.mjs`, `.savepoint/objectives/O-020-make-the-phone-view-immersive/Objective.md`.

## Design References

Design.md shell and developer panel; O-020 decisions on the public cog.

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Inventory and proposed grouping; owner approves.
2. Collapsible groups; driver opens groups; full run; owner look.

## Boundaries

The developer panel's organisation and look; no setting's behaviour changes.

## Technical Verification

Configured gates, lite, full run. Evaluated under `agent-skills/references/check-method.md`.
