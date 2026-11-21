---
id: T-387
title: Views and catalogue state checks proved in the fast suite
objective: O-086
status: planned
depends_on: []
check_waiver: {task: T-387, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T20:47:35Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: vitest-moves
planned_reads: [packages/astraeus-site/tools/validate/journey-views.mjs, packages/astraeus-site/tools/validate/journey-catalogue.mjs, packages/astraeus-site/tools/validate/catalogue-lines.mjs, packages/astraeus/tests/viewsDom.test.ts, packages/astraeus/tests/syntheticViews.test.ts, packages/astraeus/tests/synthetic/syntheticViewsDefinition.ts, packages/astraeus/tests/domSetup.ts, packages/astraeus-site/src/synthetic/syntheticViewsScene.ts, packages/astraeus-site/tests/shelfCatalogue.test.ts]
planned_writes: [packages/astraeus/tests/viewsJourneyState.test.ts, packages/astraeus-site/tests/catalogueEntries.test.ts]
---

# Views and catalogue state checks proved in the fast suite

## Outcome

Every state and text assertion of the `views` and `catalogue` browser steps that does not need a real browser (menu contents, timeline rows, panel markers, clock and speed unchanged by a switch, host change records; catalogue entry names, fold state, import/add lines, shown code, out-of-the-box list) is proved by a Vitest case, so draft 11 can remove it from the browser scripts (Objective: "views/catalogue state and text checks moved to Vitest before removal"; Claude audit I.3 views SIMPLIFY, OpenAI catalogue SIMPLIFY).

## User Check

None visual.

## Done When

- A mapping table in Technical Evidence lists every `assert*` in `journey-views.mjs` and `journey-catalogue.mjs` with one of: **moves** (named Vitest file and case that now proves it, new or existing), or **stays** (needs a real browser: layout fit and overlap, button size in px, the camera stay/follow readouts, drawn path visibility from the scene readout, one viewer at a time on real mounts, chart bars and the live tile). Draft 11 removes only the **moves** rows.
- Planner's expected **moves** (confirm or correct with reasons): views `expectView` menu, event-row and panel-marker asserts for each view; `viewChoice` option list and opening view; clock and speed unchanged by a visitor switch and by `setView`; the host change records (`hostChanges` view/cause); catalogue part list and order, idle at open, out-of-the-box list, entry name, closed fold, import line, add line, `holdsAddLines` shown code.
- Where an existing case already proves a **moves** row exactly (for example in `viewsDom.test.ts`, `syntheticViews.test.ts`, `shelfCatalogue.test.ts`), the table names that file and case (TEST-03) and no new case is written for it.
- Remaining rows are proved in two new files (no existing test file edited; owner rule): `packages/astraeus/tests/viewsJourneyState.test.ts` (happy-dom, the real shell through `tests/domSetup.ts`, the made-up views scene definition from `tests/synthetic/syntheticViewsDefinition.ts`) and `packages/astraeus-site/tests/catalogueEntries.test.ts` (the catalogue built from `data/shelf-catalogue.json` and the `@shelf` comments the way `components.html` is filled at build; reuse `catalogue-lines.mjs`'s `holdsAddLines`).
- Each new case is shown to fail on a planted fault matching its browser twin (for example a view that leaks a hidden body into the menu; an add line missing the part), local edit, run, revert; one line each in evidence.
- No browser script changes in this Task.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-site/tools/validate/journey-views.mjs` (whole, ~175 lines)
- `packages/astraeus-site/tools/validate/journey-catalogue.mjs` (whole, ~160 lines)
- `packages/astraeus/tests/viewsDom.test.ts` (case titles; read cases as needed)
- `packages/astraeus/tests/syntheticViews.test.ts` (case titles)
- `packages/astraeus/tests/synthetic/syntheticViewsDefinition.ts`
- `packages/astraeus/tests/domSetup.ts` (exports)
- `packages/astraeus-site/tests/shelfCatalogue.test.ts` (case titles)
- `packages/astraeus-site/tools/validate/catalogue-lines.mjs`

## Design References

`.savepoint/Design.md` under `Views of one scene` and `Views fixes for a multi-probe app`. `docs/BROWSER_CHECKS.md` under `The fast tests that replaced the old sets`.

## Guardrails

TEST-01, TEST-03, ARCH-04, STYLE-01, STYLE-07.

## Implementation Plan

1. Build the mapping table from the two scripts.
2. Search the existing tests for each row; mark exact covers.
3. Write the two new files for the rest; plant each fault; revert.
4. Gates.

## Boundaries

New test files only; no source, script, driver or baseline change. If a **moves** row cannot be proved without a browser, mark it **stays** with the reason. The engine test must not import the site package (ARCH-04 / the engine-alone gate); the site test may import the engine.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/viewsJourneyState.test.ts packages/astraeus-site/tests/catalogueEntries.test.ts`; `npm run check:engine-alone` (a new engine test file). Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

None expected. The mapping table is the input of draft 11.
