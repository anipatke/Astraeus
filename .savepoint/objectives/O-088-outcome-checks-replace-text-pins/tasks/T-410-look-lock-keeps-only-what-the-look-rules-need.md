---
id: T-410
title: Look lock keeps only what the look rules need
objective: O-088
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-410, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:56:58Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: look
planned_reads: [packages/astraeus/src/app/style.css, packages/astraeus/src/shell/look/look.css, packages/astraeus/tests/viewerStyles.test.ts, packages/astraeus/tests/lookDrift.test.ts, packages/astraeus/tests/interfaceLook.test.ts, packages/astraeus/tests/domSetup.ts]
planned_writes: [packages/astraeus/tests/computedLook.test.ts, packages/astraeus/tests/fixtures/computed-look.baseline.json, tools/look-lock.mjs, package.json]
---

# Look lock keeps only what the look rules need

## Outcome

The computed-look snapshot (a 302 KB baseline of 56 properties for every element, keyed by element index, so one new element shifts every later key; `computedLook.test.ts` ~185) is replaced by focused checks of the look rules it was added for, and the baseline, its writer and the `look:lock` script are retired (AH-33; Gemini: 16 s of `npm test`; G-024 decision 4). The look rules it served (Design `Good guest` item (6) Styles, I-140): the two bundle orders give the same look, and the specificity convention keeps class rules from beating the generic control rules (the I-140 flip). Token use, host isolation and the look defaults are already checked elsewhere (`lookDrift.test.ts`, `viewerStyles.test.ts`, `interfaceLook.test.ts`).

## User Check

None visual; no stylesheet changes. `npx vitest run packages/astraeus/tests/computedLook.test.ts` passes, faster than today (time recorded).

## Done When

- `computedLook.test.ts` keeps its render harness (the real App, four layouts, two definitions, every fold and panel open) and replaces the baseline comparison with:
  - **Bundle orders agree:** per layout and definition, every element's computed style under the "site" order equals the "mount" order (`ORDERS`, ~42), element by element, with elements keyed by ancestry path and position among siblings, not by a global index. No file is read.
  - **Specificity convention (I-140) and named parts:** a small table of named parts found by role, accessible name or a stable class (for example the open and closed nested fold heading, a top-bar button, a panel, the information panel text), each asserting only the properties the look rules govern (`color`, `background-color`, `font-size`, `font-weight` where relevant) equal to the value of the look token it should take from `look.css` (read from the stylesheet, not retyped). The nested fold heading case asserts accent when open and muted when closed, the I-140 defect.
  - The existing guards that the drawer is open with a nested fold, and that more than 100 elements render, stay.
- **Planted breaks, recorded then reverted, before the baseline is deleted:** (1) remove the `:where(...)` from `style.css` ~73 (`.astraeus-shell :where(.hud .collapsible-nested) .collapsible-toggle`): the I-140 case fails; (2) move one rule so it wins only by source order (for example duplicate a `look.css`-token rule later in `app/style.css` with a different token): the bundle-orders case fails. Both run against the new test while the old baseline still exists, showing the old test also fails on them (so nothing it caught for these rules is lost).
- If the bundle orders do not agree today, stop: record the differing elements and properties and return them to the coordinator (that is either a real look defect or a reason to compare per order); do not write exclusions on your own.
- Deleted after the planted breaks: `packages/astraeus/tests/fixtures/computed-look.baseline.json`, `tools/look-lock.mjs`, the `look:lock` script in root `package.json`, the `LOOK_UPDATE` branch and "writes the baseline" case in the test. A search for `look:lock`, `look-lock` and `computed-look.baseline` outside `docs/evidence`, `audits`, `.savepoint/checks|issues|objectives` and `docs/architecture/` history lists only `.savepoint/Design.md` lines (Drift Notes).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/tests/computedLook.test.ts` (whole file: the subject)
- `packages/astraeus/src/app/style.css` (~60–80, the collapsible rules) and `packages/astraeus/src/shell/look/look.css` (the token block only)
- `packages/astraeus/tests/lookDrift.test.ts`, `viewerStyles.test.ts`, `interfaceLook.test.ts` (header comments only, to avoid duplicating them)
- `tools/look-lock.mjs` (whole, short)
- root `package.json` (`scripts` only)

## Design References

`.savepoint/Design.md` under `Good guest` (item (6) Styles only).

## Guardrails

API-03, TEST-01, TEST-02, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Time today's test. Add the order-agreement check beside the baseline check; run; stop if orders differ.
2. Add the named-part table with token values read from `look.css`.
3. Planted breaks against both old and new checks; record; revert (`git diff` on the CSS empty).
4. Remove the baseline comparison, the update path, the fixture, the writer and the script; search.
5. Focused run (time), gates.

## Boundaries

Test, tool and script only; no stylesheet or component change. No new snapshot of any kind. No owner look needed: nothing visible changes.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/computedLook.test.ts packages/astraeus/tests/viewerStyles.test.ts packages/astraeus/tests/lookDrift.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

Expected: `.savepoint/Design.md` under `Good guest`, item (6), describes the baseline and `npm run look:lock`; the planner rewrites it to the two focused checks.
