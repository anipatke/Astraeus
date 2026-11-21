---
id: T-332
title: Clear out leftover interface code and measure the package
objective: O-079
status: planned
depends_on: [{task: T-325, requires: clear}]
check_waiver: {task: T-332, reason: 'Owner said "orchestrate 79": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o079-20261121}, recorded_at: '2026-11-21T02:14:11Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-o079-20261121}
---

# Clear out leftover interface code and measure the package

## Outcome

After the reset's build Tasks, nothing of the old interface is left: no CSS rule for a class the interface no longer renders, no unused look token, no dead export, helper or test helper, no leftover old stylesheet; a test keeps it that way; and the engine package's packed and unpacked size is measured before and after, so the owner can decide the size limit on the real number.

## User Check

None visible: the demos look and behave the same. The owner reads the before and after size and decides the limit (owner: "Let's assess the limit post cleanup").

## Done When

Every CSS class selector in the interface stylesheets matches a class the interface renders (or is on a reasoned allowlist, expected empty), checked by a new test that fails on an unused class; every `--astraeus-*` token is used; old stylesheets are merged into the area and part layout of `docs/architecture/viewer-interface.md` §9 (the drift check and computed-look baseline stay green, baseline changes named); dead exports, helpers and test helpers removed (each named); no existing test's setup or inputs changed; behaviour unchanged; engine packed and unpacked size recorded before and after (`npm run check:pack`), with the largest contributors listed. Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md` under `9. Module structure and contributor guide`
- `docs/architecture/viewer-interface.md` under `3. Look`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/Objective.md`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-330-set-up-the-screen-areas-and-one-shared-look.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-329-place-every-panel-by-one-rule.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-326-put-the-phone-s-controls-in-one-bar-row.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-331-rebuild-the-timeline-on-the-new-layout.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-325-give-the-bar-a-title-that-opens-about.md` under `Drift Notes`
- `packages/astraeus/src/shell/style.css`
- `packages/astraeus/src/shell/controls.css`
- `packages/astraeus/src/shell/TimelineBar.css`
- `packages/astraeus/src/shell/phone.css`
- `packages/astraeus/src/shell/embedded.css`
- `packages/astraeus/src/app/style.css`
- `packages/astraeus/src/shell/look/look.css`
- `packages/astraeus/tests/lookDrift.test.ts`
- `packages/astraeus/tests/viewerStyles.test.ts`
- `tools/check-packs.mjs`

## Design References

The decision note §3 and §9; Design "Good guest" (styles under `.astraeus-shell`).

## Guardrails

ARCH-01, API-01, API-03, TEST-01, TEST-03, STYLE-05, STYLE-07, CODE-01.

## Implementation Plan

1. Measure the engine pack (packed, unpacked, largest files) before any change.
2. List every class the interface renders (from the components) and every class selector in the stylesheets; remove rules for classes no longer rendered.
3. Remove unused tokens; merge leftover old stylesheets into the §9 layout.
4. Find and remove dead exports, helpers and test helpers (none used outside tests that only test them).
5. Add the unused-class test (the selector list against rendered classes), with a planted case proving it trips.
6. Run the gates; measure the pack again; list the largest contributors.

## Boundaries

No behaviour change, no new features, no change to the size limit (the owner decides after this Task). Return REPLAN REQUIRED if removing something would change behaviour.

## Technical Verification

Focused tests while iterating; handoff runs the configured gates plus `check:engine-alone` and `check:pack`. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for reconciliation in T-327.
