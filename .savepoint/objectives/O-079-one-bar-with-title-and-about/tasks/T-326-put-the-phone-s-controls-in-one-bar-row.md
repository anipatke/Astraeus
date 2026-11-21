---
id: T-326
title: Put the phone's controls in one bar row
objective: O-079
status: planned
depends_on: [{task: T-329, requires: clear}]
check_waiver: {task: T-326, reason: 'Owner said "orchestrate 79": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o079-20261121}, recorded_at: '2026-11-21T00:35:01Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g023-20261121}
---

# Put the phone's controls in one bar row

## Outcome

In the bar area, styled only from the look settings, the desktop bar and the phone row are both drawn from one ordered list of bar items and one pure fit rule (from the decision note); on a phone the object-name pill is gone and one row shows the title place, the switch as tabs and a menu button whose drawer holds what the rule puts in the menu.

## User Check

At 375×667 and 390×844 a scene with a two-option picker shows one row: title place (the selected object's name until About lands), tabs, menu. Narrowing the screen turns the title place into "i". The menu opens the drawer with the object picker, scale, switches and Info. On desktop at 1280×720 the bar looks as before apart from the order the note sets.

## Done When

The bar item model and fit rule match the note and are a pure, unit-tested decision (the note's worked widths as named cases, plus no switch, views placed in the panel, developer tools on and off); `TopBar` and the phone row render only from the decision (no control placed outside it); optional `shortLabel` on picker options and views, checked under `bad-picker` and `bad-view`, used on the phone row; the existing pill tests, computed-look baseline and browser-driver helpers are migrated as the note lists; two viewers (API-03); README and CHANGELOG lines (the pill is replaced: no backwards compatibility, owner decision 2026-11-21); `npm run api:lock`. Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-330-set-up-the-screen-areas-and-one-shared-look.md` under `Technical Evidence`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/Objective.md`
- `.savepoint/Design.md` under `Views of one scene`
- `packages/astraeus/src/shell/TopBar.tsx`
- `packages/astraeus/src/shell/TopBar.css`
- `packages/astraeus/src/shell/ObjectControls.tsx`
- `packages/astraeus/src/shell/ScaleControl.tsx`
- `packages/astraeus/src/shell/DisplaySwitches.tsx`
- `packages/astraeus/src/shell/SwitchControl.tsx`
- `packages/astraeus/src/shell/ControlsDrawer.tsx`
- `packages/astraeus/src/shell/phoneLayout.ts`
- `packages/astraeus/src/shell/phone.css`
- `packages/astraeus/src/shell/embedded.css`
- `packages/astraeus/src/shell/AstraeusShell.tsx`
- `packages/astraeus/src/api/pickerInput.ts`
- `packages/astraeus/src/api/views.ts`
- `packages/astraeus/tests/domPhone.test.ts`
- `packages/astraeus/tests/domEmbedded.test.ts`
- `packages/astraeus/tests/twoViewers.test.ts`
- `packages/astraeus/tests/computedLook.test.ts`
- `packages/astraeus-site/tools/validate/driver.mjs`
- `packages/astraeus-site/tools/validate/journey-planets-phone.mjs`
- `docs/agents/browser-policy.md`

## Design References

The decision note; Design "Views of one scene", "Good guest" (ids, styles, scoped keys), "Host-page behaviour".

## Guardrails

ARCH-01, ARCH-03, API-01, API-03, API-04, TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-07, CODE-01.

## Implementation Plan

1. Write the bar item list and the pure fit decision from the note, with its named cases.
2. Add `shortLabel` to picker options and views (checks, carry to the shell).
3. Render the desktop bar from the decision; keep existing controls as the item renderers.
4. Replace the pill with the phone row (title place, tabs, menu) rendered from the decision; the drawer keeps its tap, swipe and `PhoneLayoutSettings` and holds the menu items; measurement resize-aware through `ResizeObserver`.
5. Apply the note's embedded-viewer finding.
6. Migrate the tests, baseline and driver helpers the note lists; run the phone journey (one browser job at a time).
7. README, CHANGELOG, `npm run api:lock`.

## Boundaries

Uses the panel rule from T-329 for the menu drawer, ⋯ and pop-ups; no About content (T-325), no story buttons (O-080), no version bump.

## Technical Verification

Focused tests while iterating; handoff runs the configured gates plus `check:engine-alone`, `check:pack` and the phone browser journey under the browser policy. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for reconciliation in T-327.
