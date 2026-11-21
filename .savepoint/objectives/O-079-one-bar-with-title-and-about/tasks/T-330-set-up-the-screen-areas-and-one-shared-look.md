---
id: T-330
title: Set up the screen areas and one shared look
objective: O-079
status: planned
depends_on: [{task: T-328, requires: clear}]
check_waiver: {task: T-330, reason: 'Owner said "orchestrate 79": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o079-20261121}, recorded_at: '2026-11-21T00:35:01Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g023-20261121}
---

# Set up the screen areas and one shared look

## Outcome

The new interface's foundation exists as the decision note sets it: the named screen areas for desktop and phone, one set of look settings under the viewer's root class (public where the note says, with defaults), a check that fails on any colour or size typed outside the look, and the module layout and contributor guide that the following Tasks build into.

## User Check

None visible yet beyond the look: the demos look as the note's look settings say (colours, spacing, text), with every part still in place.

## Done When

The areas and look modules match the note; the existing stylesheets read only from the look settings (each hand-typed colour and size replaced or dropped as the note maps it); the drift check is a named test that fails on a typed colour or size outside the look module and passes; the screen-size rules the note replaces are folded into the one area description (each named in evidence); public look settings, if any, follow API-06 (defaults, ranges, address mapping test) and are documented in README; the module layout and contributor guide pointer are in place; existing behaviour unchanged apart from the note's look changes; two viewers keep separate looks (API-03). Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/Objective.md`
- `.savepoint/Design.md` under `Good guest`
- `.savepoint/Design.md` under `Headless use and looks as settings`
- `packages/astraeus/src/shell/style.css`
- `packages/astraeus/src/shell/controls.css`
- `packages/astraeus/src/shell/TopBar.css`
- `packages/astraeus/src/shell/TimelineBar.css`
- `packages/astraeus/src/shell/phone.css`
- `packages/astraeus/src/shell/embedded.css`
- `packages/astraeus/src/shell/phoneLayout.ts`
- `packages/astraeus/src/app/style.css`
- `packages/astraeus/src/app/look.ts`
- `packages/astraeus/src/api/look.ts`
- `packages/astraeus/tests/viewerStyles.test.ts`
- `packages/astraeus/tests/computedLook.test.ts`
- `packages/astraeus/README.md` under `Looks, controls and views`

## Design References

The decision note; Design "Good guest" (styles under `.astraeus-shell`), "Headless use and looks as settings" (one look table, precedence).

## Guardrails

ARCH-01, API-03, API-06, TEST-01, TEST-03, STYLE-01, STYLE-07, STYLE-09.

## Implementation Plan

1. Create the look module and the areas module in the layout the note sets.
2. Replace typed colours and sizes in each stylesheet with look settings, file by file; drop what the note drops.
3. Fold the screen-size rules into the area description.
4. Add the drift check test with its allowlist as the note defines (expected empty).
5. Make public look settings public as the note says (API-06 mapping, README).
6. Update the computed-look baseline only where the note changes the look, naming each change.

## Boundaries

No bar, panel or timeline restructuring (later Tasks), no About, no version bump.

## Technical Verification

Focused tests while iterating; handoff runs the configured gates plus `check:engine-alone`. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for reconciliation in T-327.
